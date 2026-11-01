const ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const words=[['Apple','🍎'],['Bear','🐻'],['Cat','🐱'],['Dog','🐶'],['Elephant','🐘'],['Fish','🐟'],['Giraffe','🦒'],['Hat','🎩'],['Ice cream','🍦'],['Jellyfish','🪼'],['Kite','🪁'],['Lion','🦁'],['Moon','🌙'],['Nest','🪺'],['Owl','🦉'],['Penguin','🐧'],['Queen','👑'],['Rainbow','🌈'],['Sun','☀️'],['Turtle','🐢'],['Umbrella','☂️'],['Violin','🎻'],['Whale','🐳'],['Xylophone','🎶'],['Yo-yo','🪀'],['Zebra','🦓']];
const shapes=[['Circle','●'],['Square','■'],['Triangle','▲'],['Star','★'],['Heart','♥'],['Diamond','◆']];
const colors=[['Red','#f06473'],['Blue','#62aefa'],['Green','#65bc8c'],['Yellow','#f4c44c'],['Purple','#a890ed'],['Orange','#f4a45e']];
const creatures=['🍎','🐥','🐸','🐞','🦋','⭐','🍓','🐝','🐢','🌷'];
const $=id=>document.getElementById(id);let sound=true;let currentGame='',round=0,locked=false;
const storageKey='little-sprouts-v1';const fresh=()=>({profiles:[{id:'explorer',name:'Explorer',avatar:'🐻',letters:[],numbers:[],wins:0,stars:0,shapes:[],colors:[]}],active:'explorer'});
let data;try{data=JSON.parse(localStorage.getItem(storageKey))||fresh();if(!Array.isArray(data.profiles)||!data.profiles.length) data=fresh()}catch{data=fresh()}
const player=()=>data.profiles.find(p=>p.id===data.active)||data.profiles[0];const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(data))}catch{}refresh()};
// Browser-native speech: prefer a warm, clear, feminine-sounding English teacher voice.
// Available voices differ by browser/device; never assume a specific voice is installed.
let teacherVoice=null;
function selectTeacherVoice(){
  if(!('speechSynthesis'in window))return;
  const voices=speechSynthesis.getVoices();
  const english=voices.filter(v=>/^en([_-]|$)/i.test(v.lang));
  const preferred=[/microsoft (jenny|aria|zira)/i,/google us english/i,/samantha/i,/ava/i,/victoria/i,/karen/i,/serena/i,/moira/i,/female/i];
  const score=v=>{
    const name=v.name||'';
    let rank=preferred.findIndex(rx=>rx.test(name));
    return (rank<0?0:100-rank*8)+(/en[-_]US/i.test(v.lang)?15:0)+(v.localService?2:0);
  };
  teacherVoice=[...english].sort((a,b)=>score(b)-score(a))[0]||null;
}
if('speechSynthesis'in window){
  selectTeacherVoice();
  speechSynthesis.addEventListener?.('voiceschanged',selectTeacherVoice);
}
let speechSequence=0;
let speechAudio=null;
let speechAbort=null;
function browserSpeak(phrase,sequence){
  if(!sound||sequence!==speechSequence||!('speechSynthesis'in window))return;
  try{
    speechSynthesis.cancel();selectTeacherVoice();
    const u=new SpeechSynthesisUtterance(phrase);
    if(teacherVoice)u.voice=teacherVoice;
    u.lang=teacherVoice?.lang||'en-US';u.rate=.86;u.pitch=1.17;u.volume=1;
    speechSynthesis.speak(u);
  }catch{}
}
function stopSpeech(){
  speechSequence++;
  speechAbort?.abort();speechAbort=null;
  if(speechAudio){speechAudio.pause();speechAudio.removeAttribute('src');speechAudio=null;}
  if('speechSynthesis'in window)speechSynthesis.cancel();
}
async function speak(phrase){
  if(!sound)return;
  stopSpeech();
  const sequence=speechSequence;
  speechAbort=new AbortController();
  try{
    const response=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:phrase}),signal:speechAbort.signal});
    if(!response.ok){
      const detail=await response.json().catch(()=>({}));
      throw Error(detail.error||'Voice service unavailable');
    }
    const blob=await response.blob();
    if($('voiceStatus'))$('voiceStatus').textContent='🎙️ Miss Lily · ElevenLabs';
    if(sequence!==speechSequence||!sound)return;
    const url=URL.createObjectURL(blob);
    const audio=new Audio(url);speechAudio=audio;
    audio.onended=audio.onerror=()=>{URL.revokeObjectURL(url);if(speechAudio===audio)speechAudio=null;};
    await audio.play();
  }catch(e){
    if(sequence!==speechSequence||!sound)return;
    if($('voiceStatus')){$('voiceStatus').textContent='🔈 Browser voice (ElevenLabs error: '+(e?.message||'Unavailable')+')';$('voiceStatus').title='The game is using browser speech. Check /api/voice-status for missing secrets.';}
    browserSpeak(phrase,sequence);
  }
}
function ding(){if(!sound)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const ctx=new A();[523,659,784].forEach((freq,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,ctx.currentTime+i*.11);gain.gain.exponentialRampToValueAtTime(.14,ctx.currentTime+i*.11+.025);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+i*.11+.19);osc.connect(gain).connect(ctx.destination);osc.start(ctx.currentTime+i*.11);osc.stop(ctx.currentTime+i*.11+.2)});setTimeout(()=>ctx.close(),800)}catch{}}
let toastTimer;function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2300)}
function refresh(){let p=player();$('profileName').textContent=p.name;$('starsLabel').textContent=`⭐ ${p.stars} stars`;if($('letterCount')){$('letterCount').innerHTML=`${p.letters.length}<span>/26</span>`;$('numberCount').innerHTML=`${p.numbers.length}<span>/10</span>`;$('quizCount').textContent=p.wins;$('letterBar').style.width=p.letters.length/26*100+'%';$('numberBar').style.width=p.numbers.length*10+'%';$('quizBar').style.width=Math.min(100,p.wins*10)+'%'}}
const homeHTML=$('main').innerHTML;function home(){stopSpeech();currentGame='';$('main').innerHTML=homeHTML;bindHome();refresh();location.hash='home'}
function bindHome(){$('startBtn').onclick=()=>document.getElementById('games').scrollIntoView({behavior:'smooth'});document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>start(b.dataset.game))}
function pickOptions(answer,max){let choices=new Set([answer]);while(choices.size<3)choices.add(Math.floor(Math.random()*max)+1);return [...choices].sort(()=>Math.random()-.5)}
function letterOptions(answer){let opts=new Set([answer]);while(opts.size<3)opts.add(ABC[Math.floor(Math.random()*26)]);return [...opts].sort(()=>Math.random()-.5)}
function start(game){currentGame=game;round=0;location.hash=game;showRound()}
function showRound(){locked=false;const game=currentGame;if(!game)return;let title,subtitle,visual,answer,choices,question;
if(game==='alphabet'){let index=round%26;answer=ABC[index];title='Alphabet Garden 🌸';subtitle='Listen, look, and find the matching letter!';visual=`<div class="letter-display">${answer.toLowerCase()} ${answer}</div><div class="word-display">${words[index][1]} ${words[index][0]}</div>`;question=`Can you find the letter ${answer}?`;choices=letterOptions(answer)}
else if(game==='numbers'){answer=round%10+1;title='Counting Meadow 🌼';subtitle='Count all the little friends!';let emoji=creatures[round%creatures.length];visual=`<div class="count-objects">${Array.from({length:answer},(_,i)=>`<span style="animation-delay:${i*.05}s">${emoji}</span>`).join('')}</div>`;question='How many can you see?';choices=pickOptions(answer,10)}
else if(game==='shapes'){let item=shapes[round%shapes.length];answer=item[0];title='Shape Safari 🦄';subtitle='Look at the shape and pick its name!';visual=`<div class="shape-display">${item[1]}</div>`;question='What shape is this?';choices=[item[0],...shapes.filter(x=>x[0]!==item[0]).sort(()=>Math.random()-.5).slice(0,2).map(x=>x[0])].sort(()=>Math.random()-.5)}
else if(game==='colors'){let item=colors[round%colors.length];answer=item[0];title='Rainbow Colors 🌈';subtitle='Meet a beautiful new color!';visual=`<div class="color-display" style="background:${item[1]}"><span>🎈</span></div>`;question='Which color do you see?';choices=[item[0],...colors.filter(x=>x[0]!==item[0]).sort(()=>Math.random()-.5).slice(0,2).map(x=>x[0])].sort(()=>Math.random()-.5)}
else{let isLetter=round%2===0;let n=Math.floor(round/2);if(isLetter){let index=(n*7+2)%26;answer=ABC[index];visual=`<div class="character">${words[index][1]}</div><div class="word-display">${words[index][0]}</div>`;question='What letter does this start with?';choices=letterOptions(answer)}else{answer=(n*3+2)%10+1;visual=`<div class="count-objects">${Array.from({length:answer},()=>'<span>⭐</span>').join('')}</div>`;question='How many stars are there?';choices=pickOptions(answer,10)}title='Star Challenge 🏆';subtitle='Show us what you know!'}
$('main').innerHTML=`<div class="play-screen"><button class="back-btn" id="backHome">← Back to games</button><div class="play-panel"><div id="voiceStatus" role="status" aria-live="polite" style="font-size:13px;color:#775d8f;margin-bottom:8px">🎙️ Checking teacher voice…</div><span class="eyebrow">ROUND ${round+1}</span><div class="mascot" aria-hidden="true">${game==='shapes'?'🦄':game==='colors'?'🦋':game==='numbers'?'🐸':game==='alphabet'?'🦊':'🐻'}</div><h1>${title}</h1><p>${subtitle}</p>${visual}<h2>${question}</h2><div class="choice-grid" id="choices">${choices.map(x=>`<button class="choice" data-answer="${x}" aria-label="Answer ${x}">${x}</button>`).join('')}</div><div class="feedback" id="feedback" role="status" aria-live="polite"></div><div class="play-actions"><button class="secondary-btn" id="hearBtn">🔊 Hear it again</button><button class="primary-btn" id="nextBtn">Next →</button></div></div></div>`;
$('backHome').onclick=home;$('hearBtn').onclick=()=>speak(game==='alphabet'?`${answer}. ${words[round%26][0]}`:question);$('nextBtn').onclick=()=>{round++;showRound()};document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{if(locked)return;const guess=b.dataset.answer;if(String(guess)===String(answer)){locked=true;b.classList.add('correct');document.querySelectorAll('.choice').forEach(x=>x.disabled=true);$('feedback').textContent='🌟 Hooray! You got it! +1 star';let p=player();p.stars++;if(game==='alphabet'&&!p.letters.includes(answer))p.letters.push(answer);if(game==='numbers'&&!p.numbers.includes(answer))p.numbers.push(answer);if(game==='quiz')p.wins++;if(game==='shapes'){p.shapes??=[];if(!p.shapes.includes(answer))p.shapes.push(answer)}if(game==='colors'){p.colors??=[];if(!p.colors.includes(answer))p.colors.push(answer)}save();celebrate();ding();speak('Amazing! You got it!');toast('⭐ Superstar!')}else{b.classList.add('wrong');$('feedback').textContent='Keep trying! You can do it! 💛';speak('Try again!')}});
speak(game==='alphabet'?`This is ${answer}. ${answer} is for ${words[round%26][0]}. Find ${answer}!`:game==='shapes'?'Look at this shape. What shape is it?':game==='colors'?'Look at this balloon. What color is it?':question);window.scrollTo({top:0,behavior:'smooth'})}
$('soundBtn').onclick=()=>{sound=!sound;$('soundBtn').textContent=sound?'🔊':'🔇';$('soundBtn').setAttribute('aria-label',sound?'Mute sound':'Enable sound');if(!sound)stopSpeech();toast(sound?'Sound on!':'Sound off')};
function renderProfiles(){$('profileList').innerHTML=data.profiles.map(p=>`<button type="button" class="profile-option ${p.id===data.active?'active':''}" data-id="${p.id}">${p.avatar} ${p.name} ${p.id===data.active?'✓':''}</button>`).join('');document.querySelectorAll('.profile-option').forEach(b=>b.onclick=()=>{data.active=b.dataset.id;save();$('profileDialog').close();home()})}
$('profileBtn').onclick=()=>{renderProfiles();$('profileDialog').showModal()};$('addProfileBtn').onclick=()=>{let name=$('newName').value.trim();if(!name)return;let id='kid-'+Date.now();data.profiles.push({id,name,avatar:['🐰','🐻','🐼','🦊'][data.profiles.length%4],letters:[],numbers:[],wins:0,stars:0,shapes:[],colors:[]});data.active=id;$('newName').value='';save();$('profileDialog').close();home()};
bindHome();refresh();

function celebrate(){const old=document.querySelector('.confetti-layer');if(old)old.remove();const layer=document.createElement('div');layer.className='confetti-layer';layer.setAttribute('aria-hidden','true');for(let i=0;i<24;i++){let bit=document.createElement('span');bit.textContent=['⭐','✨','🎉','🌸','💛'][i%5];bit.style.left=(Math.random()*100)+'%';bit.style.animationDelay=(Math.random()*.25)+'s';layer.appendChild(bit)}document.body.appendChild(layer);setTimeout(()=>layer.remove(),2100)}
