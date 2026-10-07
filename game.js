(()=>{
'use strict';
const N=20,S=800,M=24,CS=(S-2*M)/N,$=id=>document.getElementById(id);
const cv=$('c'),g=cv.getContext('2d'),ov=$('ov'),stage=$('stage'),bd=document.createElement('canvas'),bg=bd.getContext('2d');
const TH=['meadow','dusk','lcd'],TN=['Meadow','Dusk','LCD'],FR=['apple','apple','orange','cherry','strawberry','grapes'];
const FC={strawberry:'#ef233c',apple:'#e63946',orange:'#ff9f1c',cherry:'#c1121f',grapes:'#7b2cbf',gold:'#ffd166'};
let ti=0,flat=0,wrap=0,st='menu',snake=[],prev=[],dir={x:1,y:0},q=[],food=null,bonus=null,score=0,eaten=0,grow=0,acc=0,al=1,iv=150,hi=0,shake=0,parts=[],pops=[],bulges=[],T=0,newHi=0,muted=0,ac=null,ang=0,K=1,overAt=0;
const lvl=()=>1+(eaten/5|0),key=()=>'snake3d_'+(wrap?'wrap':'walls');
const loadHi=()=>{try{hi=+localStorage.getItem(key())||0}catch(e){hi=0}};
const saveHi=()=>{try{localStorage.setItem(key(),hi)}catch(e){}};
const wp=(x,y)=>[M+(x+.5)*CS,M+(y+.5)*CS];

/* ---------- sound ---------- */
function beep(f,d,type='square',v=.06,to){if(muted)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),a=ac.createGain(),n=ac.currentTime;o.type=type;o.frequency.setValueAtTime(f,n);if(to)o.frequency.exponentialRampToValueAtTime(to,n+d);a.gain.setValueAtTime(v,n);a.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(a).connect(ac.destination);o.start(n);o.stop(n+d)}catch(e){}}
const sEat=()=>{beep(520,.07,'triangle',.12);setTimeout(()=>beep(780,.1,'triangle',.12),70)};
const sBonus=()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.12,'triangle',.12),i*70));
const sDie=()=>beep(300,.8,'sawtooth',.09,50);

/* ---------- game logic ---------- */
const hud=()=>{$('sc').textContent=score;$('lv').textContent=lvl();$('hi').textContent=hi};
function free(){const o=new Set(snake.map(s=>s.x+','+s.y));food&&o.add(food.x+','+food.y);bonus&&o.add(bonus.x+','+bonus.y);const f=[];for(let x=0;x<N;x++)for(let y=0;y<N;y++)o.has(x+','+y)||f.push({x,y});return f}
const pick=()=>{const f=free();return f.length?f[Math.random()*f.length|0]:null};
function newFood(){food=null;const p=pick();food=p&&{...p,k:FR[Math.random()*FR.length|0]}}
function reset(){snake=[{x:8,y:10},{x:7,y:10},{x:6,y:10}];prev=snake.map(s=>({...s}));dir={x:1,y:0};ang=0;q=[];score=0;eaten=0;grow=0;acc=0;al=1;bonus=null;parts=[];pops=[];bulges=[];newHi=0;iv=150;loadHi();newFood();hud()}
function start(){reset();st='play';ov.className='h'}
function turn(d){
  if(st==='menu')start();
  if(st!=='play')return;
  const l=q.length?q[q.length-1]:dir;
  if((d.x===l.x&&d.y===l.y)||(d.x===-l.x&&d.y===-l.y)||q.length>=3)return;
  q.push(d);
}
function burst(x,y,c,n,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,s=(.4+Math.random())*sp*60;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,l:.6+Math.random()*.5,c,r:2+Math.random()*4})}}
const pop=(x,y,s,c)=>pops.push({x,y,s,c,t:1});
function die(){
  st='over';al=1;shake=1;sDie();overAt=performance.now();
  if(score>hi){hi=score;newHi=1;saveHi()}
  const[x,y]=wp(snake[0].x,snake[0].y);burst(x,y,'#34a853',30,5);hud();menu();
}
function step(){
  const old=snake.map(s=>({...s}));
  if(q.length)dir=q.shift();
  bulges=bulges.map(b=>b+1).filter(b=>b<snake.length+1);
  let nx=snake[0].x+dir.x,ny=snake[0].y+dir.y;
  if(wrap){nx=(nx+N)%N;ny=(ny+N)%N}else if(nx<0||ny<0||nx>=N||ny>=N)return die();
  const eat=food&&nx===food.x&&ny===food.y,bon=bonus&&nx===bonus.x&&ny===bonus.y;
  if(eat)grow++;if(bon)grow+=2;
  const body=grow>0?snake:snake.slice(0,-1);
  if(body.some(s=>s.x===nx&&s.y===ny))return die();
  if(grow>0)old.push({...old[old.length-1]});
  prev=old;snake.unshift({x:nx,y:ny});
  if(grow>0)grow--;else snake.pop();
  const[wx,wy]=wp(nx,ny);
  if(eat){
    const k=food.k,L0=lvl();score+=10;eaten++;sEat();burst(wx,wy,FC[k],16,3.2);pop(wx,wy-20,'+10','#fff');bulges.push(0);
    iv=Math.max(75,150-(lvl()-1)*9);newFood();
    if(lvl()>L0)pop(S/2,S/2,'LEVEL '+lvl(),'#ffd166');
    if(eaten%5===0&&!bonus){const p=pick();p&&(bonus={...p,t:8})}
  }
  if(bon){score+=50;bonus=null;sBonus();burst(wx,wy,FC.gold,28,4);pop(wx,wy-20,'+50','#ffd166');bulges.push(0)}
  hud();
}

/* ---------- drawing helpers ---------- */
const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h)};
function buildBoard(){
  bd.width=cv.width;bd.height=cv.height;bg.setTransform(K,0,0,K,0,0);
  bg.fillStyle='#16301a';bg.fillRect(0,0,S,S);
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){bg.fillStyle=(i+j)&1?'#6cc047':'#62b53e';bg.fillRect(M+i*CS,M+j*CS,CS,CS)}
  let s=7;const r=()=>(s=s*16807%2147483647)/2147483647;
  bg.lineWidth=1.3;
  for(let k=0;k<2200;k++){const x=M+r()*(S-2*M),y=M+r()*(S-2*M);bg.strokeStyle=r()<.5?'rgba(255,255,255,.09)':'rgba(0,70,0,.12)';bg.beginPath();bg.moveTo(x,y);bg.lineTo(x+(r()-.5)*5,y-3-r()*5);bg.stroke()}
  for(let k=0;k<26;k++){const x=M+r()*(S-2*M),y=M+r()*(S-2*M);bg.fillStyle=r()<.5?'#fff7d6':'#ffe66d';bg.beginPath();bg.arc(x,y,2.2,0,7);bg.fill();bg.fillStyle='#f4a259';bg.beginPath();bg.arc(x,y,.9,0,7);bg.fill()}
  const sun=bg.createRadialGradient(S*.35,S*.25,10,S/2,S/2,S*.75);sun.addColorStop(0,'rgba(255,250,200,.2)');sun.addColorStop(.6,'rgba(255,255,255,0)');sun.addColorStop(1,'rgba(0,30,0,.35)');bg.fillStyle=sun;bg.fillRect(M,M,S-2*M,S-2*M);
  bg.save();bg.beginPath();bg.rect(M,M,S-2*M,S-2*M);bg.clip();bg.shadowColor='rgba(0,0,0,.6)';bg.shadowBlur=24*K;bg.lineWidth=10;bg.strokeStyle='#000';bg.strokeRect(M-5,M-5,S-2*M+10,S-2*M+10);bg.restore();
  if(!wrap){
    const stone=(x,y,w,h)=>{rr(bg,x,y,w,h,5);bg.fillStyle=`hsl(${28+r()*10},${8+r()*8}%,${40+r()*14}%)`;bg.fill();bg.strokeStyle='rgba(0,0,0,.45)';bg.lineWidth=1.5;bg.stroke();bg.strokeStyle='rgba(255,255,255,.25)';bg.beginPath();bg.moveTo(x+4,y+3);bg.lineTo(x+w-4,y+3);bg.stroke()};
    for(let i=0;i<N;i++){stone(M+i*CS+1,1,CS-2,M-2);stone(M+i*CS+1,S-M+1,CS-2,M-2);stone(1,M+i*CS+1,M-2,CS-2);stone(S-M+1,M+i*CS+1,M-2,CS-2)}
    for(const[x,y]of[[1,1],[S-M+1,1],[1,S-M+1],[S-M+1,S-M+1]])stone(x,y,M-2,M-2);
  }else{
    bg.strokeStyle='#bfffa0';bg.lineWidth=3;bg.setLineDash([10,8]);bg.shadowColor='#9dff6a';bg.shadowBlur=12*K;bg.strokeRect(M/2,M/2,S-M,S-M);bg.setLineDash([]);bg.shadowBlur=0;
  }
}
const ball=(x,y,r,c)=>{const gr=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);gr.addColorStop(0,c[0]);gr.addColorStop(.55,c[1]);gr.addColorStop(1,c[2]);g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
const shine=(x,y,r)=>{g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.ellipse(x-r*.42,y-r*.42,r*.22,r*.12,-.7,0,7);g.fill()};
const leaf=(x,y,a,l,c)=>{g.save();g.translate(x,y);g.rotate(a);g.fillStyle=c;g.beginPath();g.ellipse(l/2,0,l/2,l*.3,0,0,7);g.fill();g.strokeStyle='rgba(0,60,0,.45)';g.lineWidth=1;g.beginPath();g.moveTo(1,0);g.lineTo(l-2,0);g.stroke();g.restore()};
const stem=(x,y,x2,y2)=>{g.strokeStyle='#5a3a1a';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+1,(y+y2)/2,x2,y2);g.stroke()};
function fruit(k,x,y,sc,bt){
  const r=CS*.4*sc;
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x+4,y+r*.95+4,r*.95,r*.36,0,0,7);g.fill();
  y+=Math.sin(T*4+x)*1.6-2;
  if(k==='apple'||k==='gold'){
    ball(x,y,r,k==='gold'?['#fff4b0','#ffc933','#b8790a']:['#ff7a6e','#d9202b','#7d0b10']);
    g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x,y-r*.82,r*.3,r*.13,0,0,7);g.fill();
    stem(x,y-r*.7,x+r*.18,y-r*1.4);leaf(x+r*.15,y-r*1.1,-.5,r*.9,'#4caf50');shine(x,y,r);
    if(k==='gold'){for(let i=0;i<4;i++){const a=T*2+i*1.57,sx=x+Math.cos(a)*r*1.3,sy=y+Math.sin(a)*r*1.3;g.fillStyle=`rgba(255,255,255,${.5+.5*Math.sin(T*8+i)})`;g.beginPath();g.arc(sx,sy,2.6,0,7);g.fill()}
      g.strokeStyle='#ffd166';g.lineWidth=4;g.lineCap='round';g.beginPath();g.arc(x,y,r*1.55,-1.57,-1.57+6.283*bt/8);g.stroke()}
  }else if(k==='orange'){
    ball(x,y,r,['#ffd27a','#ff9a1f','#b45309']);g.fillStyle='rgba(120,50,0,.25)';for(let i=0;i<9;i++){g.beginPath();g.arc(x+Math.cos(i*2.4)*r*.6*(i%3+1)/3,y+Math.sin(i*2.4)*r*.6*(i%3+1)/3,1.2,0,7);g.fill()}
    leaf(x,y-r*.85,-.3,r*.8,'#3f9b3f');g.fillStyle='#2e7d32';g.beginPath();g.arc(x,y-r*.85,3,0,7);g.fill();shine(x,y,r);
  }else if(k==='strawberry'){
    ball(x,y+r*.1,r*1.02,['#ff8a8a','#e5173f','#8a0a22']);g.fillStyle='#ffe9a8';for(let i=0;i<10;i++){g.beginPath();g.ellipse(x+Math.cos(i*2.2)*r*.55*((i%3+1)/3),y+r*.1+Math.sin(i*2.2)*r*.6*((i%3+1)/3),1,1.7,0,0,7);g.fill()}
    for(let i=-2;i<3;i++)leaf(x,y-r*.75,-1.57+i*.55,r*.55,'#43a047');shine(x,y+r*.1,r);
  }else if(k==='cherry'){
    g.strokeStyle='#4a7a2a';g.lineWidth=2.5;g.lineCap='round';g.beginPath();g.moveTo(x-r*.5,y+r*.1);g.quadraticCurveTo(x-r*.2,y-r*1.1,x+r*.2,y-r*1.4);g.moveTo(x+r*.5,y+r*.1);g.quadraticCurveTo(x+r*.45,y-r*1.1,x+r*.2,y-r*1.4);g.stroke();
    ball(x-r*.5,y+r*.25,r*.62,['#ff6b7d','#d90429','#6b0218']);ball(x+r*.5,y+r*.25,r*.62,['#ff6b7d','#d90429','#6b0218']);
    leaf(x+r*.2,y-r*1.4,-.3,r*.9,'#4caf50');shine(x-r*.5,y+r*.25,r*.62);shine(x+r*.5,y+r*.25,r*.62);
  }else{
    stem(x,y-r*.7,x+2,y-r*1.3);leaf(x+2,y-r*1.1,-.4,r,'#4caf50');
    for(const[dx,dy]of[[-.55,-.2],[.55,-.2],[0,-.25],[-.28,.3],[.28,.3],[0,.8]])ball(x+dx*r,y+dy*r,r*.4,['#d4a5ff','#8e3fd0','#3f1470']);
    shine(x-r*.3,y-r*.1,r*.5);
  }
}
const W=i=>{let w=CS*(.86-.46*Math.pow(i/Math.max(1,snake.length-1),1.3));for(const b of bulges)w+=Math.max(0,1-Math.abs(i-(b+al)))*CS*.2;return w};
const ip=i=>{const a=prev[i]||snake[i],b=snake[i];return Math.abs(a.x-b.x)>1||Math.abs(a.y-b.y)>1?b:{x:a.x+(b.x-a.x)*al,y:a.y+(b.y-a.y)*al}};
function tube(pts,add,col,dx,dy,wm){
  const len=pts.length;g.strokeStyle=col;g.lineCap='round';g.lineJoin='round';
  for(let i=len-1;i>=0;i--){
    const p=pts[i],a=i<len-1?pts[i+1]:p,b=i>0?pts[i-1]:p;
    if(Math.hypot(a[0]-p[0],a[1]-p[1])>CS*1.6||Math.hypot(b[0]-p[0],b[1]-p[1])>CS*1.6)continue;
    g.lineWidth=Math.max(1.5,W(i)*wm+add);g.beginPath();
    g.moveTo((p[0]+a[0])/2+dx,(p[1]+a[1])/2+dy);g.quadraticCurveTo(p[0]+dx,p[1]+dy,(p[0]+b[0])/2+dx,(p[1]+b[1])/2+dy);g.stroke();
  }
}
function head(p){
  g.save();g.translate(p[0],p[1]);g.rotate(ang);
  const L=CS*.78,Wd=CS*.5,dead=st==='over';
  if(!dead){const f=Math.max(0,Math.sin(T*2.3)),l=CS*.95*f*f;
    if(l>2){g.strokeStyle='#e5173f';g.lineWidth=2.6;g.lineCap='round';g.beginPath();g.moveTo(L*.8,0);g.lineTo(L*.8+l,0);g.moveTo(L*.8+l,0);g.lineTo(L*.8+l+CS*.22,-CS*.15);g.moveTo(L*.8+l,0);g.lineTo(L*.8+l+CS*.22,CS*.15);g.stroke()}}
  const gr=g.createRadialGradient(L*.15,-Wd*.5,2,0,0,L*1.1);gr.addColorStop(0,'#7edc6f');gr.addColorStop(.55,'#2f9e44');gr.addColorStop(1,'#17602a');
  g.fillStyle=gr;g.strokeStyle='#0e3b1a';g.lineWidth=3.5;g.lineJoin='round';g.beginPath();
  g.moveTo(L*.95,0);g.bezierCurveTo(L*.8,-Wd*.75,L*.2,-Wd*1.15,-L*.45,-Wd*.7);g.quadraticCurveTo(-L*.7,0,-L*.45,Wd*.7);g.bezierCurveTo(L*.2,Wd*1.15,L*.8,Wd*.75,L*.95,0);g.fill();g.stroke();
  g.fillStyle='#1b6b30';g.beginPath();g.moveTo(L*.1,0);g.lineTo(-L*.2,-Wd*.3);g.lineTo(-L*.5,0);g.lineTo(-L*.2,Wd*.3);g.closePath();g.fill();
  g.fillStyle='#0e3b1a';for(const s of[-1,1]){g.beginPath();g.arc(L*.78,s*Wd*.17,1.8,0,7);g.fill()}
  for(const s of[-1,1]){const ex=L*.2,ey=s*Wd*.62;
    if(dead){g.strokeStyle='#111';g.lineWidth=2.5;g.beginPath();g.moveTo(ex-5,ey-5);g.lineTo(ex+5,ey+5);g.moveTo(ex+5,ey-5);g.lineTo(ex-5,ey+5);g.stroke()}
    else{g.fillStyle='#fffbe6';g.strokeStyle='#0e3b1a';g.lineWidth=1.6;g.beginPath();g.arc(ex,ey,CS*.17,0,7);g.fill();g.stroke();
      g.fillStyle='#e0b000';g.beginPath();g.arc(ex+1,ey,CS*.11,0,7);g.fill();g.fillStyle='#111';g.beginPath();g.ellipse(ex+1,ey,CS*.04,CS*.1,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(ex-1,ey-3,1.6,0,7);g.fill()}}
  g.restore();
}
function draw(){
  const sx=shake?(Math.random()-.5)*shake*14:0,sy=shake?(Math.random()-.5)*shake*14:0;
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#16301a';g.fillRect(0,0,cv.width,cv.height);g.drawImage(bd,sx*K,sy*K);
  g.setTransform(K,0,0,K,sx*K,sy*K);
  const pts=snake.map((_,i)=>{const p=ip(i);return wp(p.x,p.y)});
  if(food){const[x,y]=wp(food.x,food.y);fruit(food.k,x,y,1+Math.sin(T*5)*.04)}
  if(bonus&&(bonus.t>3||(T*6|0)%2)){const[x,y]=wp(bonus.x,bonus.y);fruit('gold',x,y,1.12+Math.sin(T*6)*.06,bonus.t)}
  tube(pts,0,'rgba(0,0,0,.28)',6,9,1);
  tube(pts,5,'#0e3b1a',0,0,1);
  tube(pts,0,'#33a852',0,0,1);
  tube(pts,-W(0)*.5,'#6fd16a',0,0,1);
  for(let i=1;i<pts.length-1;i+=2){
    const p=pts[i],a=pts[i+1],b=pts[i-1];if(Math.hypot(a[0]-b[0],a[1]-b[1])>CS*3)continue;
    const w=W(i);g.save();g.translate(p[0],p[1]);g.rotate(Math.atan2(a[1]-b[1],a[0]-b[0]));
    g.fillStyle='#1a6a2e';g.beginPath();g.moveTo(w*.36,0);g.lineTo(0,w*.3);g.lineTo(-w*.36,0);g.lineTo(0,-w*.3);g.closePath();g.fill();
    g.fillStyle='#f2c94c';g.beginPath();g.arc(0,0,w*.08,0,7);g.fill();g.restore();
  }
  tube(pts,-W(0)*.62,'rgba(220,255,180,.45)',-2,-3,.5);
  head(pts[0]);
  for(const p of parts){g.globalAlpha=Math.min(1,p.l*2);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill()}
  g.globalAlpha=1;g.textAlign='center';g.font='900 26px "Trebuchet MS",sans-serif';g.lineWidth=5;g.strokeStyle='rgba(0,0,0,.6)';
  for(const p of pops){g.globalAlpha=Math.min(1,p.t*1.6);g.strokeText(p.s,p.x,p.y);g.fillStyle=p.c;g.fillText(p.s,p.x,p.y)}
  g.globalAlpha=1;
}

/* ---------- overlay ---------- */
function menu(){
  const k=a=>`<kbd>${a}</kbd>`;
  const info=`<div class="opts">Mode ${k('B')} ${wrap?'Wrap-around':'Walls'} &nbsp;·&nbsp; Theme ${k('T')} ${TN[ti]} &nbsp;·&nbsp; Camera ${k('V')} ${flat?'Flat':'3D tilt'}</div>`;
  let h='';
  if(st==='menu')h=`<h2>Snake <i>3D</i></h2><p>Eat apples, oranges, cherries, strawberries and grapes.<br>Catch the golden apple before it vanishes!</p><div class="go">Press ${k('Enter')} or an arrow key</div>${info}`;
  else if(st==='over')h=`<h2>Game Over</h2><p>Score <b>${score}</b> &nbsp;·&nbsp; Length <b>${snake.length}</b>${newHi?'<br>New best score!':''}</p><div class="go">Press ${k('Enter')} to slither again</div>${info}`;
  else h=`<h2>Paused</h2><p>Press ${k('Space')} to resume</p>`;
  ov.innerHTML=`<div class="card">${h}</div>`;ov.className='';
}
function pause(){if(st==='play'){st='pause';menu()}else if(st==='pause'){st='play';ov.className='h'}}
function apply(){document.body.dataset.theme=TH[ti];stage.classList.toggle('flat',!!flat)}

/* ---------- input ---------- */
const D={ArrowUp:{x:0,y:-1},KeyW:{x:0,y:-1},ArrowDown:{x:0,y:1},KeyS:{x:0,y:1},ArrowLeft:{x:-1,y:0},KeyA:{x:-1,y:0},ArrowRight:{x:1,y:0},KeyD:{x:1,y:0}};
addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const c=e.code;
  if(D[c]){e.preventDefault();turn({...D[c]});return}
  if(c==='Space'||c==='Enter'){e.preventDefault();if(e.repeat)return;
    if(st==='play'){c==='Space'&&pause()}else if(st==='pause')pause();else if(st==='menu'||performance.now()-overAt>400)start();return}
  if(c==='KeyP'||c==='Escape')return pause();
  if(c==='KeyM'){muted^=1;return}
  if(c==='KeyV')flat^=1;
  else if(c==='KeyT')ti=(ti+1)%3;
  else if(c==='KeyB'&&st!=='play'&&st!=='pause'){wrap^=1;loadHi();hud();resize()}
  else return;
  apply();if(st==='menu'||st==='over')menu();
});
let tx0,ty0;
cv.addEventListener('touchstart',e=>{tx0=e.touches[0].clientX;ty0=e.touches[0].clientY},{passive:true});
cv.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-tx0,dy=t.clientY-ty0;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24){st==='play'||st==='pause'?pause():start();return}
  turn(Math.abs(dx)>Math.abs(dy)?{x:Math.sign(dx),y:0}:{x:0,y:Math.sign(dy)})},{passive:true});
ov.addEventListener('click',()=>{if(st==='pause')pause();else if(st==='menu'||(st==='over'&&performance.now()-overAt>400))start()});
addEventListener('blur',()=>{if(st==='play')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&st==='play')pause()});

/* ---------- main loop ---------- */
function resize(){const r=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);cv.width=cv.height=Math.max(320,Math.round(Math.max(r.width,r.height)*d));K=cv.width/S;buildBoard()}
addEventListener('resize',resize);
let last=performance.now();
function loop(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;T+=dt;
  if(st==='play'){
    acc+=dt*1000;
    while(acc>=iv&&st==='play'){acc-=iv;step()}
    al=st==='play'?acc/iv:1;
    if(bonus){bonus.t-=dt;if(bonus.t<=0)bonus=null}
  }
  const target=Math.atan2(dir.y,dir.x);let df=target-ang;df=Math.atan2(Math.sin(df),Math.cos(df));ang+=df*Math.min(1,dt*16);
  for(const p of parts){p.vy+=260*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt}
  parts=parts.filter(p=>p.l>0);
  for(const p of pops){p.y-=40*dt;p.t-=dt*.9}
  pops=pops.filter(p=>p.t>0);
  shake=Math.max(0,shake-dt*2.2);
  {const h=snake[0]||{x:N/2,y:N/2};$('board').style.transform=flat?'':`rotateX(${27-(h.y/N-.5)*6}deg) rotateY(${(h.x/N-.5)*9}deg) scale(.96)`}
  draw();requestAnimationFrame(loop);
}
apply();reset();st='menu';menu();resize();
requestAnimationFrame(loop);
})();
