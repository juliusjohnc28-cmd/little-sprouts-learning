// Little Sprouts secure TTS proxy. The key and voice ID are Cloudflare secrets.
// Restrict text to the finite phrases used by the learning games to limit abuse.
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nouns=['Apple','Bear','Cat','Dog','Elephant','Fish','Giraffe','Hat','Ice cream','Jellyfish','Kite','Lion','Moon','Nest','Owl','Penguin','Queen','Rainbow','Sun','Turtle','Umbrella','Violin','Whale','Xylophone','Yo-yo','Zebra'];
const sounds=new Set(['Amazing! You got it!','Try again!','How many can you see?','How many stars are there?','What letter does this start with?','Look at this shape. What shape is it?','Look at this balloon. What color is it?']);
for(let i=0;i<26;i++){sounds.add(alphabet[i]+'. '+nouns[i]);sounds.add('This is '+alphabet[i]+'. '+alphabet[i]+' is for '+nouns[i]+'. Find '+alphabet[i]+'!');}
for(let i=1;i<=10;i++)sounds.add('How many can you see?');
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers});}
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname!=='/api/tts')return env.ASSETS.fetch(request);
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  const origin=request.headers.get('Origin');
  if(origin&&origin!==url.origin)return json({error:'Invalid origin'},403);
  if(!/application\/json/i.test(request.headers.get('Content-Type')||''))return json({error:'JSON required'},415);
  if(Number(request.headers.get('Content-Length')||0)>1024)return json({error:'Too large'},413);
  let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
  const phrase=body?.text;
  if(typeof phrase!=='string'||phrase.length>160||!sounds.has(phrase))return json({error:'Unsupported lesson phrase'},400);
  if(!env.ELEVENLABS_API_KEY||!env.ELEVENLABS_VOICE_ID)return json({error:'Teacher voice not configured; using browser fallback'},503);
  const encoder=new TextEncoder();
  const hash=await crypto.subtle.digest('SHA-256',encoder.encode(phrase+'|'+env.ELEVENLABS_VOICE_ID+'|v1'));
  const key=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
  const cacheRequest=new Request(url.origin+'/__voice_cache/'+key,{method:'GET'});
  const cache=caches.default;
  const hit=await cache.match(cacheRequest);
  if(hit)return hit;
  let upstream;
  try{
   upstream=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(env.ELEVENLABS_VOICE_ID)+'?output_format=mp3_44100_128',{
    method:'POST',
    headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'Content-Type':'application/json','Accept':'audio/mpeg'},
    body:JSON.stringify({text:phrase,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.47,similarity_boost:0.8,style:0.45,use_speaker_boost:true}}),
    signal:AbortSignal.timeout(15000)
   });
  }catch{return json({error:'Voice service temporarily unavailable'},502)}
  if(!upstream.ok)return json({error:'Voice service unavailable'},502);
  const audio=await upstream.arrayBuffer();
  if(audio.byteLength>3000000)return json({error:'Voice output too large'},502);
  const result=new Response(audio,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
  ctx.waitUntil(cache.put(cacheRequest,result.clone()));
  return result;
 }
};
