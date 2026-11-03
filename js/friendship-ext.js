'use strict';
// 新友情コンボ：クロスバウンドボム / アブソリュートクロスレイ / カウンターリング / ショットガン。
// 発射は spawnNewFriendship（attacks.js の emitFriendship から呼ぶ）、更新は updateNewFriendship、描画は drawNewFriendship。
// attacks.js の後、controls.js の前に読み込む。
const NEW_COMBOS=['sakuraNova','sonicCannon','crossBomb','absoluteCross','counterRing','shotgun','shockSplit','wayLaser','pierceHoming','shinePillar','wheel','sakuraBurst','cornerMissile'];
const CROSS_BOMB_STEP=150,CROSS_BOMB_HOP=.34;
// アブソリュートクロスレイ：出だしはゆっくり、その後に急加速（速度 = 初速 + 加速度×経過時間²、上限 speed）。
const ABSOLUTE_RAY_START_SPEED=200,ABSOLUTE_RAY_ACCEL=16000;
// カウンターリングの発射間隔（秒）
const COUNTER_RING_INTERVAL=.09;

// 全敵反射分裂衝撃波：大(0)→中(1)→小(2)。大・中は敵に当たると反射しつつ2つに分裂、小は分裂しない。全サイズとも敵に当たると反射する。
// half=当たり判定の半幅 / mult=威力倍率（分裂による減衰なし＝全サイズ等倍） / split=分裂するか / line=描画の線幅
const SHOCK_SIZES=[{half:56,mult:1,split:true,line:9},{half:40,mult:1.2,split:true,line:6.5},{half:28,mult:1.5,split:false,line:4.5}];
const SHOCK_SPEED=780,SHOCK_LIFE=3.2,SHOCK_SPLIT_ANGLE=.6,SHOCK_MAX_WAVES=140,SHOCK_MAX_BOUNCES=10;
const SHOCK_WALL_REFLECT=false; // true にすると壁でも反射する（既定は壁で消滅）
// 貫通ホーミング：最大 PIERCE_HOMING_HITS 回（=3回貫通して4回目）まで命中。最初に当たった敵（anchor）を原則として狙い続ける。命中直後は PIERCE_HOMING_ARC 秒だけ緩く曲がって弧を描く。
const PIERCE_HOMING_HITS=4,PIERCE_HOMING_SPEED=560,PIERCE_HOMING_ARC=.4,PIERCE_HOMING_TURN_ARC=6,PIERCE_HOMING_TURN=11;
// シャイニングピラー：出現前の予兆時間、ダメージ判定の間隔
const PILLAR_DELAY=.4,PILLAR_TICK=.11;
// 方向レーザーの太さと発射回数
const WAY_LASER_WIDTH=52,WAY_LASER_VOLLEYS=3;
// サクラバースト：手番キャラが敵に触れるたび（最大 SAKURA_MAX 回）当たった所に桜型の爆発。回ごとにサイズ・威力が +SAKURA_STEP 倍ずつ増え、5回目で1.5倍。
// 手番キャラの停止後に全回発動していたら、画面全体の花びら演出のあと全ての敵へ威力の SAKURA_FINALE_MULT 倍のダメージ。
const SAKURA_MAX=5,SAKURA_STEP=.125,SAKURA_BURST_LIFE=.75,SAKURA_FINALE_MULT=3;
// ホイール：初速は発動キャラの全力ショット速度の WHEEL_SPEED_MULT 倍。
const WHEEL_SPEED_MULT=2,WHEEL_FRICTION=.73,WHEEL_MAX_TIME=6.8;
const livingTargets=()=>state.enemies.filter(e=>targetable(e));
const rotateVec=(v,a)=>({x:v.x*Math.cos(a)-v.y*Math.sin(a),y:v.x*Math.sin(a)+v.y*Math.cos(a)});

// アブソリュートクロスレイ：自分から敵へ向かって湾曲し、敵の位置で互いに交差してから画面端まで抜ける2本のレーザー（敵1体につき1組）。
function curvedCrossBeams(from,enemy){
  let dx=enemy.x-from.x,dy=enemy.y-from.y,D=Math.hypot(dx,dy);if(D<40){dx=0;dy=-1;D=40;}
  const d={x:dx/D,y:dy/D};
  return [-1,1].map(s=>{
    const v=rotateVec(d,.24*s),back=rotateVec({x:-d.x,y:-d.y},s*1.0);
    const P0={x:from.x,y:from.y},P1={x:from.x+back.x*D*.6,y:from.y+back.y*D*.6},P2={x:enemy.x-v.x*D*.5,y:enemy.y-v.y*D*.5},P3={x:enemy.x,y:enemy.y};
    const pts=[];for(let i=0;i<=30;i++){const t=i/30,u=1-t;pts.push({x:u*u*u*P0.x+3*u*u*t*P1.x+3*u*t*t*P2.x+t*t*t*P3.x,y:u*u*u*P0.y+3*u*u*t*P1.y+3*u*t*t*P2.y+t*t*t*P3.y});}
    const end=rayEnd(enemy.x,enemy.y,v.x,v.y);const tail=Math.hypot(end.x-enemy.x,end.y-enemy.y);
    for(let i=1;i<=Math.max(1,Math.round(tail/24));i++){const t=i/Math.max(1,Math.round(tail/24));pts.push({x:enemy.x+(end.x-enemy.x)*t,y:enemy.y+(end.y-enemy.y)*t});}
    const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+distance(pts[i-1],pts[i]));
    return {pts,cum,total:cum[cum.length-1],head:0,hitIds:new Set()};
  });
}
function pointOnBeam(b,s){
  const d=clamp(s,0,b.total);let i=1;while(i<b.cum.length-1&&b.cum[i]<d)i++;
  const seg=b.cum[i]-b.cum[i-1]||1,t=(d-b.cum[i-1])/seg;return {x:b.pts[i-1].x+(b.pts[i].x-b.pts[i-1].x)*t,y:b.pts[i-1].y+(b.pts[i].y-b.pts[i-1].y)*t};
}

function spawnNewFriendship(ally,f,carrier,damage){
  if(!NEW_COMBOS.includes(f.kind))return false;
  const base={side:'ally',x:ally.x,y:ally.y,damage,color:ally.color,age:0};
  if(f.kind==='sakuraNova'){
    queueEffect({...base,type:'sakuraNova',bursts:[],emitted:0,wait:0,phase:'nova'});
  }else if(f.kind==='sonicCannon'){
    queueEffect({...base,type:'sonicCannon',charge:0,ticks:0,wait:0,phase:'charge',angle:0,width:40,range:260});
  }else if(f.kind==='crossBomb'){
    const m=Math.SQRT1_2,bombs=[[1,1],[1,-1],[-1,1],[-1,-1]].map(([sx,sy])=>({dx:sx*m,dy:sy*m,hop:0,t:0,from:{x:ally.x,y:ally.y},to:{x:ally.x+sx*m*CROSS_BOMB_STEP,y:ally.y+sy*m*CROSS_BOMB_STEP}}));
    queueEffect({...base,type:'crossBomb',bombs,bounces:Math.max(1,f.count??3),radius:f.radius??105,maxHits:f.maxHits??2});
  }else if(f.kind==='absoluteCross'){
    const beams=[];friendshipVisualTargets(ally).forEach((enemy,i)=>{for(const b of curvedCrossBeams(ally,enemy)){b.delay=i*.035;beams.push(b);}});
    queueEffect({...base,type:'absoluteCross',beams,speed:3600,width:16,doneAge:0});
  }else if(f.kind==='counterRing'){
    queueEffect({...base,type:'counterRing',owner:ally,carrier,max:Math.max(1,f.count??16),count:0,phase:'count',launched:0,wait:0,rings:[]});
  }else if(f.kind==='cornerMissile'){
    // コーナーウォールミサイル：画面の4隅へ向けて放つ。既存のウォールミサイル（trident）の処理を流用。
    const bullets=[[FIELD.left,FIELD.top],[FIELD.right,FIELD.top],[FIELD.left,FIELD.bottom],[FIELD.right,FIELD.bottom]].map(([cx,cy])=>{const a=Math.atan2(cy-ally.y,cx-ally.x);return {x:ally.x,y:ally.y,vx:Math.cos(a)*740,vy:Math.sin(a)*740,generation:0,hitIds:new Set()};});
    queueEffect({type:'trident',side:'ally',bullets,damage,color:ally.color,radius:f.radius??190,maxHits:f.maxHits??3,life:5,age:0,splits:0});
  }else if(f.kind==='sakuraBurst'){
    if(state.effects.some(x=>x.type==='sakuraBurst'&&x.owner===ally&&x.phase==='count'))return true; // 同じキャラの発動中カウンターは重複させない
    queueEffect({...base,type:'sakuraBurst',owner:ally,phase:'count',count:0,bursts:[],radius:f.radius??120,t:0,petals:null,finaleHit:false});
  }else if(f.kind==='wheel'){
    const live=livingTargets(),cand=live.length?live:friendshipVisualTargets(ally);
    const target=cand.reduce((m,t)=>distance(t,ally)<distance(m,ally)?t:m);
    let dx=target.x-ally.x,dy=target.y-ally.y;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;const sp=wheelSpeed(ally);
    const w={x:ally.x,y:ally.y,vx:dx*sp,vy:dy*sp,r:ally.r,shotType:ally.shotType,battleStyle:ally.battleStyle,abilities:[],contacts:new Map(),spawnOverlaps:new Set(state.enemies.filter(en=>en.alive&&contactEnemy({x:ally.x,y:ally.y,r:ally.r,vx:0,vy:0},en)).map(en=>en.id)),trail:[],spin:0};
    queueEffect({...base,type:'wheel',wheel:w,piercing:isPiercing(ally),moveTime:0});
  }else if(f.kind==='wayLaser'){
    // (X)方向レーザー：自身から周囲へ等間隔にX本（真上から時計回り）。太いレーザーが3回放たれる。
    const N=Math.max(1,f.count??16);
    for(let i=0;i<N;i++){
      const a=-Math.PI/2+i*TAU/N,dx=Math.cos(a),dy=Math.sin(a),end=rayEnd(ally.x,ally.y,dx,dy);
      queueEffect({type:'laser',side:'ally',x:ally.x,y:ally.y,ex:end.x,ey:end.y,dx,dy,width:WAY_LASER_WIDTH,hits:WAY_LASER_VOLLEYS,hitsLeft:WAY_LASER_VOLLEYS,wait:.12,interval:.17,flash:0,age:0,damage,color:ally.color});
    }
  }else if(f.kind==='pierceHoming'){
    const X=Math.max(1,f.count??8),targets=friendshipVisualTargets(ally),a0=Math.random()*TAU;
    queueEffect({...base,type:'pierceHoming',bullets:Array.from({length:X},(_,i)=>({x:ally.x,y:ally.y,angle:a0+i*TAU/X,target:targets[i%targets.length],delay:i*.06,hits:0,lastId:null,anchor:null,arc:0,life:5,trail:[]}))});
  }else if(f.kind==='shinePillar'){
    const x=FIELD.left+60+Math.random()*(FIELD.right-FIELD.left-120),y=FIELD.top+60+Math.random()*(FIELD.bottom-FIELD.top-120);
    queueEffect({...base,type:'shinePillar',x,y,radius:f.radius??170,delay:PILLAR_DELAY,ticks:0,maxTicks:f.ticks??6,wait:0,fade:0,hitIds:new Set()});
  }else if(f.kind==='shockSplit'){
    const X=Math.max(1,f.count??3),waves=[];
    friendshipVisualTargets(ally).forEach((enemy,i)=>{
      let dx=enemy.x-ally.x,dy=enemy.y-ally.y;const D=Math.hypot(dx,dy);if(D<1){dx=0;dy=-1;}
      const aim=Math.atan2(dy,dx);
      for(let k=0;k<X;k++){const a=aim+(k-(X-1)/2)*.07;waves.push({x:ally.x,y:ally.y,px:ally.x,py:ally.y,vx:Math.cos(a)*SHOCK_SPEED,vy:Math.sin(a)*SHOCK_SPEED,level:0,delay:k*.16+i*.03,life:SHOCK_LIFE,lastId:null,bounces:0});}
    });
    queueEffect({...base,type:'shockSplit',waves});
  }else if(f.kind==='shotgun'){
    queueEffect({...base,type:'shotgun',ways:Math.max(1,f.ways??9),volleys:Math.max(1,f.volleys??3),emitted:0,wait:0,bullets:[]});
  }
  tone(700,.14,'triangle',.03);return true;
}

// カウンターリング：手番キャラが壁に触れるたびにカウント+1（最大 max）。
function noteWallTouch(unit){
  for(const e of state.effects)if(e.type==='counterRing'&&e.phase==='count'&&e.count<e.max){
    e.count++;floatingText(unit.x,unit.y-34,'RING '+e.count+'/'+e.max,e.color,12);ring(unit.x,unit.y,e.color,38,.25);
  }
}

// 桜型：花びら5枚の外形（先端は軸上でR、花びらの間で約0.55R）。a は花びらの軸（rot）からの角度。
function sakuraBoundary(R,a){const seg=TAU/5;let d=((a%seg)+seg)%seg;d=Math.min(d,seg-d);return R*(1-.45*Math.pow(d/(seg/2),1.4));}
// 花びら1枚（先端に切れ込み）。(0,0)から-y方向へ len。
function sakuraPetalPath(len,wid){
  ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-wid,-len*.25,-wid*1.1,-len*.85,-wid*.28,-len);ctx.lineTo(0,-len*.88);ctx.lineTo(wid*.28,-len);ctx.bezierCurveTo(wid*1.1,-len*.85,wid,-len*.25,0,0);ctx.closePath();
}
// 手番キャラが敵に触れたとき（simulation.js の onEnemyTouch から）：サクラバーストのカウンターを進めて桜型爆発を起こす。
function sakuraTouch(unit,enemy){
  for(const e of state.effects){
    if(e.type!=='sakuraBurst'||e.phase!=='count'||e.count>=SAKURA_MAX)continue;
    e.count++;const scale=1+SAKURA_STEP*(e.count-1);
    let dx=enemy.x-unit.x,dy=enemy.y-unit.y;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
    const x=unit.x+dx*unit.r,y=unit.y+dy*unit.r;
    e.bursts.push({x,y,k:e.count,radius:e.radius*scale,damage:e.damage*scale,age:0,hit:false,rot:Math.random()*TAU});
    floatingText(unit.x,unit.y-34,'SAKURA '+e.count+'/'+SAKURA_MAX,e.color,12);
  }
}
// ホイールの初速：発動キャラの全力ショット速度（launch と同じ式）の2倍。
const wheelSpeed=a=>WHEEL_SPEED_MULT*(390+710)*((a.speed*dashMultiplier(a))/100);

function updateNewFriendship(e,dt){
  const pool=livingTargets();
  if(e.type==='sonicCannon')return updateSonicCannon(e,dt);
  if(e.type==='sakuraNova'){
    e.wait-=dt;
    if(e.emitted<9&&e.wait<=0){const first=e.emitted===0;e.bursts.push({x:first?e.x:FIELD.left+Math.random()*(FIELD.right-FIELD.left),y:first?e.y:FIELD.top+Math.random()*(FIELD.bottom-FIELD.top),k:1,radius:first?280:150,damage:e.damage,age:0,hit:false,rot:Math.random()*TAU});e.emitted++;e.wait+=.15;}
    // Reuse the original sakura hit geometry and burst lifetime without its contact counter/finale.
    updateNewFriendship({...e,type:'sakuraBurst',phase:'end'},dt);
    e.bursts=e.bursts.filter(b=>b.age<SAKURA_BURST_LIFE);
    return e.emitted<9||e.bursts.length>0;
  }
  if(e.type==='crossBomb'){
    for(const b of e.bombs){
      if(b.done)continue;b.t+=dt/CROSS_BOMB_HOP;
      if(b.t<1)continue;
      spawnExplosion('ally',{x:b.to.x,y:b.to.y},livingTargets(),{radius:e.radius,maxHits:e.maxHits,damage:e.damage,color:e.color});
      b.hop++;if(b.hop>=e.bounces){b.done=true;continue;}
      b.from=b.to;b.to={x:b.from.x+b.dx*CROSS_BOMB_STEP,y:b.from.y+b.dy*CROSS_BOMB_STEP};b.t=0;
    }
    return e.bombs.some(b=>!b.done);
  }
  if(e.type==='absoluteCross'){
    let active=false;
    for(const b of e.beams){
      if(b.delay>0){b.delay-=dt;active=true;continue;}
      if(b.head>=b.total)continue;active=true;
      b.age=(b.age||0)+dt;const speed=Math.min(e.speed,ABSOLUTE_RAY_START_SPEED+ABSOLUTE_RAY_ACCEL*b.age*b.age),nextHead=Math.min(b.total,b.head+speed*dt),from=pointOnBeam(b,b.head),to=pointOnBeam(b,nextHead);
      for(const enemy of livingTargets()){
        if(b.hitIds.has(enemy.id)||enemyGap(enemy,from,to)>e.width/2)continue;
        b.hitIds.add(enemy.id);damageEnemy(enemy,e.damage,true,{charge:.4,hit:{from,to,radius:e.width/2}});
      }
      b.head=nextHead;
    }
    if(!active)e.doneAge+=dt;
    return e.doneAge<.45;
  }
  if(e.type==='counterRing'){
    if(e.phase==='count'){if(state.unitStopped||state.phase!=='moving'){e.phase='attack';e.wait=.12;}else return true;}
    e.wait-=dt;
    if(e.launched<e.count&&e.wait<=0){
      const targets=friendshipVisualTargets(e);
      if(!targets.length){if(!e.launched&&!e.rings.length)showFriendshipActivation(e.x,e.y,e.color,FRIENDSHIP_KINDS[e.type].label);e.launched=e.count;}
      else{
        const target=targets[Math.floor(Math.random()*targets.length)],side=Math.floor(Math.random()*4),M=70;
        const start=side===0?{x:FIELD.left+Math.random()*(FIELD.right-FIELD.left),y:FIELD.top-M}:side===1?{x:FIELD.right+M,y:FIELD.top+Math.random()*(FIELD.bottom-FIELD.top)}:side===2?{x:FIELD.left+Math.random()*(FIELD.right-FIELD.left),y:FIELD.bottom+M}:{x:FIELD.left-M,y:FIELD.top+Math.random()*(FIELD.bottom-FIELD.top)};
        const dx=target.x-start.x,dy=target.y-start.y,len=Math.hypot(dx,dy)||1;
        e.rings.push({x:start.x,y:start.y,px:start.x,py:start.y,vx:dx/len*2100,vy:dy/len*2100,r:44,life:2,hitIds:new Set(),entered:false});
        e.launched++;e.wait+=COUNTER_RING_INTERVAL;tone(380,.05,'sawtooth',.012);
      }
    }
    const keep=[];
    for(const r of e.rings){
      r.px=r.x;r.py=r.y;r.x+=r.vx*dt;r.y+=r.vy*dt;r.life-=dt;
      for(const enemy of livingTargets()){
        if(r.hitIds.has(enemy.id)||enemyGap(enemy,{x:r.px,y:r.py},r)>r.r*.8)continue;
        r.hitIds.add(enemy.id);damageEnemy(enemy,e.damage,true,{charge:.5,hit:{from:{x:r.px,y:r.py},to:{x:r.x,y:r.y},radius:r.r*.8}});
      }
      const inside=r.x>FIELD.left-20&&r.x<FIELD.right+20&&r.y>FIELD.top-20&&r.y<FIELD.bottom+20;
      if(inside)r.entered=true;
      if(r.life>0&&!(r.entered&&!inside))keep.push(r);
    }
    e.rings=keep;
    return e.launched<e.count||e.rings.length>0;
  }
  if(e.type==='wheel'){
    // ホイール：キャラと同じ挙動（壁で反射・敵接触で減速・貫通/反射）。ブロックやコンテナは貫通するので判定しない。
    const w=e.wheel;e.moveTime+=dt;
    const sp0=Math.hypot(w.vx,w.vy),steps=Math.max(1,Math.ceil(sp0*dt/10)),h=dt/steps;
    for(let s=0;s<steps;s++){
      w.x+=w.vx*h;w.y+=w.vy*h;
      if(w.x<FIELD.left+w.r){w.x=FIELD.left+w.r;w.vx=Math.abs(w.vx);}
      if(w.x>FIELD.right-w.r){w.x=FIELD.right-w.r;w.vx=-Math.abs(w.vx);}
      if(w.y<FIELD.top+w.r){w.y=FIELD.top+w.r;w.vy=Math.abs(w.vy);}
      if(w.y>FIELD.bottom-w.r){w.y=FIELD.bottom-w.r;w.vy=-Math.abs(w.vy);}
      for(const enemy of state.enemies){
        if(!enemy.alive||enemy.transparent)continue;
        const info=contactEnemy(w,enemy);
        if(w.spawnOverlaps.has(enemy.id)){if(!info)w.spawnOverlaps.delete(enemy.id);continue;}
        if(!info){w.contacts.delete(enemy.id);continue;}
        const hit={x:w.x,y:w.y,radius:w.r};
        if(e.piercing){
          let c=w.contacts.get(enemy.id);
          if(!c){const ret=contactRetention(w,enemy);w.vx*=ret;w.vy*=ret;c={weak:hitsWeak(enemy,hit)};w.contacts.set(enemy.id,c);if(!enemy.sword)damageEnemy(enemy,e.damage,true,{hit,charge:.3});ring(w.x,w.y,e.color,34,.2);}
          else if(!c.weak&&hitsWeak(enemy,hit)){c.weak=true;damageEnemy(enemy,e.damage,true,{hit,weakBonusOnly:true,charge:0});}
        }else{
          const {nx,ny}=info,dot=w.vx*nx+w.vy*ny;w.x+=nx*info.push;w.y+=ny*info.push;
          if(dot<0){const rf=reflectVelocity(w.vx,w.vy,nx,ny),ret=contactRetention(w,enemy);w.vx=rf.x*ret;w.vy=rf.y*ret;if(!enemy.sword)damageEnemy(enemy,e.damage,true,{hit:{x:w.x,y:w.y,radius:w.r},charge:.3});ring(w.x,w.y,e.color,34,.2);}
        }
      }
    }
    const fr=Math.exp(-WHEEL_FRICTION*dt);w.vx*=fr;w.vy*=fr;w.spin+=Math.hypot(w.vx,w.vy)*dt/Math.max(8,w.r);
    w.trail.push({x:w.x,y:w.y});if(w.trail.length>14)w.trail.shift();
    return Math.hypot(w.vx,w.vy)>=64&&e.moveTime<WHEEL_MAX_TIME;
  }
  if(e.type==='sakuraBurst'){
    // 桜型爆発：出現の少し後に一度だけ、花びら形の範囲内の敵へダメージ
    for(const b of e.bursts){
      b.age+=dt;
      if(!b.hit&&b.age>=.1){
        b.hit=true;ring(b.x,b.y,e.color,b.radius,.45);burst(b.x,b.y,e.color,14,200);tone(660+b.k*70,.12,'sine',.03,0,980);state.shake=Math.max(state.shake,2+b.k*.6);
        for(const en of livingTargets()){
          const dx=en.x-b.x,dy=en.y-b.y;
          if(Math.hypot(dx,dy)>sakuraBoundary(b.radius,Math.atan2(dy,dx)-b.rot)+en.r*.7)continue;
          const wp=weakPosition(en),inside=wp&&Math.hypot(wp.x-b.x,wp.y-b.y)<=sakuraBoundary(b.radius,Math.atan2(wp.y-b.y,wp.x-b.x)-b.rot);
          damageEnemy(en,b.damage,true,inside?{charge:.4,hit:{x:wp.x,y:wp.y,radius:0}}:{charge:.4});
        }
      }
    }
    e.bursts=e.bursts.filter(b=>b.age<SAKURA_BURST_LIFE);
    if(e.phase==='count'){
      if(!(state.unitStopped||state.phase!=='moving'))return true;
      e.phase=e.count>=SAKURA_MAX?'finale':'end';e.t=0;
      if(e.phase==='finale'){
        e.petals=Array.from({length:90},()=>({x:FIELD.left+Math.random()*(FIELD.right-FIELD.left),y:FIELD.top-Math.random()*320,vy:110+Math.random()*190,ph:Math.random()*TAU,rot:Math.random()*TAU,vr:(Math.random()-.5)*5,size:8+Math.random()*10}));
        floatingText((FIELD.left+FIELD.right)/2,(FIELD.top+FIELD.bottom)/2,'SAKURA FINALE',e.color,22);tone(880,.5,'sine',.03,0,1500);
      }
    }
    if(e.phase==='end')return e.bursts.length>0;
    e.t+=dt;
    for(const p of e.petals){p.y+=p.vy*dt;p.x+=Math.sin(e.t*2.2+p.ph)*46*dt;p.rot+=p.vr*dt;}
    if(!e.finaleHit&&e.t>=.45){
      e.finaleHit=true;state.shake=Math.max(state.shake,8);
      for(const en of livingTargets())damageEnemy(en,e.damage*SAKURA_FINALE_MULT,true,{charge:1,hit:weakPosition(en)});
    }
    return e.t<2.2||e.bursts.length>0;
  }
  if(e.type==='pierceHoming'){
    const keep=[],nearest=(b,exceptId)=>{const live=livingTargets(),others=live.filter(t=>t.id!==exceptId),pool2=others.length?others:live;return pool2.length?pool2.reduce((m,t)=>distance(t,b)<distance(m,b)?t:m):null;};
    for(const b of e.bullets){
      if(b.delay>0){b.delay-=dt;keep.push(b);continue;}
      b.life-=dt;if(b.life<=0)continue;
      if(!b.target||!targetable(b.target)){b.target=nearest(b,b.lastId);if(!b.target)continue;if(b.anchor!=null)b.anchor=b.target.id;}
      if(b.lastId!=null){const le=state.enemies.find(en=>en.id===b.lastId);if(!le||!le.alive||distance(le,b)>le.r+22)b.lastId=null;}
      // 命中直後は緩く曲がって弧を描き、そのあと敵へ鋭く追尾する
      b.arc=Math.max(0,b.arc-dt);
      const turn=(b.arc>0?PIERCE_HOMING_TURN_ARC:PIERCE_HOMING_TURN)*dt,want=Math.atan2(b.target.y-b.y,b.target.x-b.x);
      let diff=want-b.angle;while(diff>Math.PI)diff-=TAU;while(diff<-Math.PI)diff+=TAU;
      b.angle+=clamp(diff,-turn,turn);
      const prev={x:b.x,y:b.y};b.x+=Math.cos(b.angle)*PIERCE_HOMING_SPEED*dt;b.y+=Math.sin(b.angle)*PIERCE_HOMING_SPEED*dt;
      b.trail.push({x:b.x,y:b.y});if(b.trail.length>14)b.trail.shift();
      let done=false;
      for(const en of livingTargets()){
        if(en.id===b.lastId||enemyGap(en,prev,b)>7)continue;
        damageEnemy(en,e.damage,true,{charge:.6,hit:{from:prev,to:{x:b.x,y:b.y},radius:7}});
        b.hits++;b.lastId=en.id;b.arc=PIERCE_HOMING_ARC;ring(b.x,b.y,e.color,30,.2);burst(b.x,b.y,e.color,5,100);tone(620+b.hits*80,.05,'triangle',.014);
        if(b.hits>=PIERCE_HOMING_HITS){done=true;break;}
        if(b.anchor==null)b.anchor=en.id; // 最初に当たった敵を以後も狙い続ける（倒れたら最寄りの敵に切り替え）
        const anchorEn=state.enemies.find(x=>x.id===b.anchor);
        if(anchorEn&&targetable(anchorEn))b.target=anchorEn;else{b.target=nearest(b,en.id);if(!b.target){done=true;break;}b.anchor=b.target.id;}
        break;
      }
      if(!done&&b.x>FIELD.left-80&&b.x<FIELD.right+80&&b.y>FIELD.top-80&&b.y<FIELD.bottom+80)keep.push(b);
    }
    e.bullets=keep;return keep.length>0;
  }
  if(e.type==='shinePillar'){
    if(e.delay>0){e.delay-=dt;if(e.delay<=0){state.shake=Math.max(state.shake,7);ring(e.x,e.y,e.color,e.radius+30,.5);tone(880,.3,'sine',.03,0,1500);}return true;}
    if(e.ticks<e.maxTicks){
      e.wait-=dt;
      if(e.wait<=0){
        e.wait+=PILLAR_TICK;e.ticks++;ring(e.x,e.y,e.color,e.radius*(.5+.1*e.ticks),.3);burst(e.x,e.y,e.color,6,160);
        for(const en of livingTargets())if(distance(en,e)<=e.radius+en.r*.8)damageEnemy(en,e.damage,true,{charge:.5,hit:{x:e.x,y:e.y,radius:e.radius}});
      }
    }else e.fade+=dt;
    return e.fade<.5;
  }
  if(e.type==='shockSplit'){
    const next=[],born=[];let total=e.waves.length;
    for(const w of e.waves){
      if(w.delay>0){w.delay-=dt;next.push(w);continue;}
      const sz=SHOCK_SIZES[w.level];w.px=w.x;w.py=w.y;w.x+=w.vx*dt;w.y+=w.vy*dt;w.life-=dt;
      const prev={x:w.px,y:w.py};
      if(w.lastId!=null){const le=state.enemies.find(en=>en.id===w.lastId);if(!le||!le.alive||enemyGap(le,prev,w)>sz.half+6)w.lastId=null;}
      // 壁：既定では消滅、SHOCK_WALL_REFLECT なら反射
      if(w.x<FIELD.left||w.x>FIELD.right||w.y<FIELD.top||w.y>FIELD.bottom){
        if(!SHOCK_WALL_REFLECT){if(w.x<FIELD.left-24||w.x>FIELD.right+24||w.y<FIELD.top-24||w.y>FIELD.bottom+24)continue;}
        else{if(w.x<FIELD.left||w.x>FIELD.right){w.vx=-w.vx;w.x=clamp(w.x,FIELD.left,FIELD.right);}if(w.y<FIELD.top||w.y>FIELD.bottom){w.vy=-w.vy;w.y=clamp(w.y,FIELD.top,FIELD.bottom);}}
      }
      let target=null,best=Infinity;
      for(const enemy of pool){
        if(!enemy.alive||enemy.id===w.lastId||enemyGap(enemy,prev,w)>sz.half*.9)continue;
        const d=Math.hypot(enemy.x-w.px,enemy.y-w.py);if(d<best){best=d;target=enemy;}
      }
      if(!target){if(w.life>0)next.push(w);continue;}
      // 命中：ダメージ→反射（→分裂）
      damageEnemy(target,e.damage*sz.mult,true,{charge:.3,hit:{from:prev,to:{x:w.x,y:w.y},radius:sz.half*.9}});
      let nx=w.px-target.x,ny=w.py-target.y;
      if(enemyIsSquare(target)){if(Math.abs(nx)>=Math.abs(ny)){nx=Math.sign(nx)||1;ny=0;}else{ny=Math.sign(ny)||1;nx=0;}} // 四角い敵は面に垂直に反射
      else{const L=Math.hypot(nx,ny);if(L<.001){const sp=Math.hypot(w.vx,w.vy)||1;nx=-w.vx/sp;ny=-w.vy/sp;}else{nx/=L;ny/=L;}}
      let dot=w.vx*nx+w.vy*ny;if(dot>=0){const sp=Math.hypot(w.vx,w.vy)||1;nx=-w.vx/sp;ny=-w.vy/sp;dot=w.vx*nx+w.vy*ny;}
      const rvx=w.vx-2*dot*nx,rvy=w.vy-2*dot*ny;
      ring(w.px,w.py,e.color,sz.half+10,.22);burst(w.px,w.py,e.color,6,110);tone(520-w.level*90,.05,'triangle',.014);
      w.bounces++;if(w.bounces>=SHOCK_MAX_BOUNCES)continue;
      if(sz.split&&total+1<SHOCK_MAX_WAVES){
        for(const s of [-1,1]){const c=Math.cos(SHOCK_SPLIT_ANGLE*s),sn=Math.sin(SHOCK_SPLIT_ANGLE*s);
          born.push({x:w.px,y:w.py,px:w.px,py:w.py,vx:rvx*c-rvy*sn,vy:rvx*sn+rvy*c,level:w.level+1,delay:0,life:SHOCK_LIFE,lastId:target.id,bounces:w.bounces});}
        total++;
      }else{w.vx=rvx;w.vy=rvy;w.x=w.px;w.y=w.py;w.lastId=target.id;if(w.life>0)next.push(w);}
    }
    e.waves=next.concat(born);
    return e.waves.length>0;
  }
  if(e.type==='shotgun'){
    e.wait-=dt;
    if(e.emitted<e.volleys&&e.wait<=0){
      const target=friendshipVisualTargets(e)[0];
      if(!target){if(!e.emitted&&!e.bullets.length)showFriendshipActivation(e.x,e.y,e.color,FRIENDSHIP_KINDS[e.type].label);e.emitted=e.volleys;}
      else{
        const base=Math.atan2(target.y-e.y,target.x-e.x),fan=.12+.012*e.ways;
        for(let i=0;i<e.ways;i++){
          const a=e.ways===1?base:base+(i-(e.ways-1)/2)*fan/(e.ways-1);
          e.bullets.push({x:e.x,y:e.y,px:e.x,py:e.y,vx:Math.cos(a)*980,vy:Math.sin(a)*980,life:1.4,hitIds:new Set()});
        }
        e.emitted++;e.wait+=.27;ring(e.x,e.y,e.color,36,.22);tone(300,.06,'square',.014);
      }
    }
    const keep=[];
    for(const b of e.bullets){
      b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      for(const enemy of pool){
        if(b.hitIds.has(enemy.id)||enemyGap(enemy,{x:b.px,y:b.py},b)>4)continue;
        b.hitIds.add(enemy.id);damageEnemy(enemy,e.damage,true,{charge:.15,hit:{from:{x:b.px,y:b.py},to:{x:b.x,y:b.y},radius:4}});
      }
      if(b.life>0&&b.x>=FIELD.left&&b.x<=FIELD.right&&b.y>=FIELD.top&&b.y<=FIELD.bottom)keep.push(b);
    }
    e.bullets=keep;
    return e.emitted<e.volleys||keep.length>0;
  }
  return false;
}

function drawNewFriendship(e){
  if(e.type==='sonicCannon'){drawSonicCannon(e);return;}
  ctx.save();ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.lineCap='round';
  if(e.type==='crossBomb')for(const b of e.bombs){
    if(b.done)continue;const t=clamp(b.t,0,1),x=b.from.x+(b.to.x-b.from.x)*t,y=b.from.y+(b.to.y-b.from.y)*t-Math.sin(t*Math.PI)*70;
    ctx.globalAlpha=.4;ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(b.to.x,b.to.y,e.radius*.45,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=.25;ctx.beginPath();ctx.ellipse(x,y+Math.sin(t*Math.PI)*70,9,4,0,0,TAU);ctx.fill();
    ctx.globalAlpha=1;polygon(x,y,12,6);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-3,y-3,3,0,TAU);ctx.fill();ctx.fillStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+7,y-20);ctx.stroke();
  }
  else if(e.type==='absoluteCross'){
    const fade=clamp(1-e.doneAge/.45,0,1);
    for(const b of e.beams){
      if(b.delay>0||b.head<=0)continue;const n=b.cum.findIndex(c=>c>=b.head);const last=n<0?b.pts.length-1:n;
      const path=()=>{ctx.beginPath();ctx.moveTo(b.pts[0].x,b.pts[0].y);for(let i=1;i<last;i++)ctx.lineTo(b.pts[i].x,b.pts[i].y);const h=pointOnBeam(b,b.head);ctx.lineTo(h.x,h.y);};
      ctx.globalAlpha=.35*fade;ctx.lineWidth=e.width+8;path();ctx.stroke();
      ctx.globalAlpha=fade;ctx.shadowColor=e.color;ctx.shadowBlur=12;ctx.lineWidth=e.width*.55;path();ctx.stroke();ctx.shadowBlur=0;
      ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;path();ctx.stroke();ctx.strokeStyle=e.color;
    }
  }
  else if(e.type==='counterRing'){
    const o=e.owner;if(e.phase==='count'){ctx.globalAlpha=.9;ctx.lineWidth=3;ctx.beginPath();ctx.arc(o.x,o.y,40,0,TAU);ctx.stroke();ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(o.x,o.y,46,e.age*2,e.age*2+TAU*e.count/e.max);ctx.stroke();ctx.setLineDash([]);ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText(e.count+'/'+e.max,o.x,o.y-52);}
    for(const r of e.rings){
      ctx.globalAlpha=.35;ctx.lineWidth=r.r*.9;ctx.beginPath();ctx.moveTo(r.x-r.vx*.045,r.y-r.vy*.045);ctx.lineTo(r.x,r.y);ctx.stroke();
      ctx.globalAlpha=1;ctx.shadowColor=e.color;ctx.shadowBlur=14;ctx.lineWidth=9;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke();ctx.strokeStyle=e.color;
    }
  }
  else if(e.type==='wheel'){
    const w=e.wheel;
    ctx.globalAlpha=.4;ctx.lineWidth=w.r*.9;ctx.lineCap='round';ctx.beginPath();w.trail.forEach((p,i)=>{if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();ctx.lineCap='butt';
    ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.spin);ctx.globalAlpha=1;
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.strokeStyle=e.color;ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,w.r,0,TAU);ctx.fill();ctx.stroke();
    ctx.lineWidth=2.5;for(let i=0;i<6;i++){const a=i*TAU/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*w.r*.2,Math.sin(a)*w.r*.2);ctx.lineTo(Math.cos(a)*w.r*.92,Math.sin(a)*w.r*.92);ctx.stroke();}
    ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(0,0,w.r*.2,0,TAU);ctx.fill();ctx.restore();
  }
  else if(e.type==='sakuraBurst'||e.type==='sakuraNova'){
    const seg=TAU/5;
    // 発動キャラの桜のカウンター（花びらが敵に触れるたびに1枚ずつ染まる）
    if(e.phase==='count'){
      const o=e.owner,len=o.r*2.1,wid=len*.42;
      ctx.save();ctx.translate(o.x,o.y);ctx.rotate(state.clock*.25);ctx.lineWidth=2.5;ctx.strokeStyle=e.color;
      for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*seg);sakuraPetalPath(len,wid);
        if(i<e.count){ctx.fillStyle=e.color;ctx.globalAlpha=.85;}else{ctx.fillStyle='#ffffff';ctx.globalAlpha=.55;}
        ctx.fill();ctx.globalAlpha=.95;ctx.stroke();ctx.restore();}
      ctx.restore();
    }
    // 桜型爆発
    for(const b of e.bursts){
      const p=clamp(b.age/SAKURA_BURST_LIFE,0,1),s=Math.min(1,p*6),R=b.radius*(.35+.65*(1-Math.pow(1-s,3)));
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot+p*.4);ctx.globalAlpha=Math.max(0,1-p*p);ctx.lineWidth=3;ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=18*(1-p);
      for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*seg+Math.PI/2);sakuraPetalPath(R*.98,R*.42);
        const g=ctx.createLinearGradient(0,-R,0,R*.25);g.addColorStop(0,'#ffffff');g.addColorStop(.24,'#ffe7f1');g.addColorStop(.58,e.color);g.addColorStop(.82,'#fff5fa');g.addColorStop(1,e.color);
        ctx.fillStyle=g;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff7fb';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();}
      ctx.shadowBlur=0;ctx.globalAlpha*=.8;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,R*.12,0,TAU);ctx.fill();
      ctx.restore();
    }
    // フィナーレ：画面全体に舞う花びら
    if(e.phase==='finale'&&e.petals){
      const fade=e.t>1.7?clamp((2.2-e.t)/.5,0,1):1;
      ctx.save();ctx.globalAlpha=Math.min(.22,e.t*.5)*fade;ctx.fillStyle=e.color;ctx.fillRect(FIELD.left,FIELD.top,FIELD.right-FIELD.left,FIELD.bottom-FIELD.top);ctx.restore();
      for(const p of e.petals){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=.9*fade;ctx.fillStyle=e.color;ctx.strokeStyle=e.color;ctx.lineWidth=1.2;sakuraPetalPath(p.size,p.size*.42);ctx.fill();ctx.stroke();ctx.restore();}
    }
  }
  else if(e.type==='pierceHoming')for(const b of e.bullets){
    if(b.delay>0||!b.trail.length)continue;
    ctx.globalAlpha=.45;ctx.lineWidth=6;ctx.beginPath();b.trail.forEach((p,i)=>{if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();
    ctx.globalAlpha=1;ctx.shadowColor=e.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(b.x,b.y,7,0,TAU);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(b.x,b.y,3,0,TAU);ctx.fill();ctx.fillStyle=e.color;
    // 残り貫通回数のピップ
    for(let i=0;i<PIERCE_HOMING_HITS-b.hits;i++){ctx.beginPath();ctx.arc(b.x-6+i*6,b.y-13,1.8,0,TAU);ctx.fill();}
  }
  else if(e.type==='shinePillar'){
    const R=e.radius,fade=clamp(1-e.fade/.5,0,1);
    if(e.delay>0){ // 予兆：地面の点線リングと薄い光の柱
      ctx.globalAlpha=.3+.25*Math.sin(e.age*30);ctx.lineWidth=2.5;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(e.x,e.y,R,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.1;ctx.fillStyle=e.color;ctx.fillRect(e.x-R*.7,0,R*1.4,e.y);
    }else{
      const w=R*1.7*(1+.05*Math.sin(e.age*38)),g=ctx.createLinearGradient(e.x-w/2,0,e.x+w/2,0);
      g.addColorStop(0,e.color+'00');g.addColorStop(.3,e.color+'b3');g.addColorStop(.5,'#ffffff');g.addColorStop(.7,e.color+'b3');g.addColorStop(1,e.color+'00');
      ctx.globalAlpha=fade;ctx.fillStyle=g;ctx.fillRect(e.x-w/2,0,w,e.y);
      const h=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,R*1.15);h.addColorStop(0,'rgba(255,255,240,.95)');h.addColorStop(.55,e.color+'73');h.addColorStop(1,e.color+'00');
      ctx.fillStyle=h;ctx.beginPath();ctx.arc(e.x,e.y,R*1.15,0,TAU);ctx.fill();
      ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=16;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,R,0,TAU);ctx.stroke();ctx.shadowBlur=0;
      // 神々しい光の粒（上昇）と放射する光条
      ctx.fillStyle='#fffbe0';
      for(let i=0;i<14;i++){const px=e.x+Math.sin(i*2.4+e.age*3)*w*.42,py=e.y-((e.age*240+i*53)%Math.max(60,e.y));ctx.globalAlpha=fade*.8;ctx.beginPath();ctx.arc(px,py,2+(i%3),0,TAU);ctx.fill();}
      ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.globalAlpha=fade*.5;
      for(let i=0;i<10;i++){const a=i*TAU/10+e.age*.8;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*R*.5,e.y+Math.sin(a)*R*.5);ctx.lineTo(e.x+Math.cos(a)*R*1.5,e.y+Math.sin(a)*R*1.5);ctx.stroke();}
      ctx.strokeStyle=e.color;ctx.fillStyle=e.color;
    }
  }
  else if(e.type==='shockSplit')for(const w of e.waves){
    if(w.delay>0)continue;
    const sz=SHOCK_SIZES[w.level],ang=Math.atan2(w.vy,w.vx),R=sz.half*1.1,cx=-sz.half*.2,span=1.0,alpha=clamp(w.life/.35,0,1);
    ctx.save();ctx.translate(w.x,w.y);ctx.rotate(ang);
    const arc=(off)=>{ctx.beginPath();ctx.arc(cx-off,0,R,-span,span);ctx.stroke();};
    for(let k=3;k>=1;k--){ctx.globalAlpha=alpha*(.5-k*.12);ctx.lineWidth=sz.line*(1-k*.18);arc(k*13);}
    ctx.globalAlpha=alpha;ctx.shadowColor=e.color;ctx.shadowBlur=12;ctx.lineWidth=sz.line;arc(0);ctx.shadowBlur=0;
    ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1.5,sz.line*.32);arc(0);
    ctx.restore();
  }
  else if(e.type==='shotgun')for(const b of e.bullets){
    ctx.globalAlpha=.4;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x-b.vx*.03,b.y-b.vy*.03);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.globalAlpha=1;ctx.beginPath();ctx.arc(b.x,b.y,4,0,TAU);ctx.fill();
  }
  ctx.restore();
}

// Poison: refresh, never stack. Enemy DOT runs after the player shot; ally DOT after enemy attacks.
function applyPoison(target,ally=false){
  if(!target||(!ally&&(!target.alive||target.sword||target.transparent))||(ally&&stageSettings.invincible))return;
  target.poisonTurns=2;floatingText(target.x,target.y-target.r-28,'毒 2T','#9954c5',13);ring(target.x,target.y,'#a66bd6',target.r+15,.4);
}
function tickEnemyPoison(){
  for(const e of state.enemies){if(!e.alive||!(e.poisonTurns>0))continue;
    damageEnemy(e,Math.max(1,Math.round(e.maxHp*.01)),false,{poisonTick:true,charge:0});e.poisonTurns--;
  }
}
function tickAllyPoison(){
  for(const u of state.units){if(!(u.poisonTurns>0))continue;u.poisonTurns--;damageTeam(200,u.x,u.y,u,{poisonTick:true});if(state.phase==='gameover')break;}
}
function spawnPoisonAttack(side,source,f,damage){
  const o={...f,damage,color:'#a561d4',poison:true};
  if(f.kind==='poisonSpread')spawnSpread(side,source,o);
  else if(f.kind==='poisonMeteor')spawnMeteor(side,source,o);
  else queueEffect({type:'dropBomb',side,x:source.x,y:source.y,poison:true,bombs:[{x:FIELD.left+Math.random()*(FIELD.right-FIELD.left),y:FIELD.top+Math.random()*(FIELD.bottom-FIELD.top),delay:0,elapsed:0}],radius:f.radius??240,maxHits:f.maxHits??3,damage,color:o.color,age:0});
}
function updateSonicCannon(e,dt){
  if(e.phase==='charge'){
    if(state.phase==='moving'&&!state.unitStopped){e.charge=Math.min(8,e.charge+dt);return true;}
    e.phase='fire';const p=e.charge/8;e.width=40+120*p;e.range=260+640*p;e.power=1+3*p;
  }
  e.wait-=dt;
  if(e.ticks<16&&e.wait<=0){
    const target=livingEnemiesByDistance(e)[0];if(!target)return false;
    e.angle=Math.atan2(target.y-e.y,target.x-e.x);e.to={x:e.x+Math.cos(e.angle)*e.range,y:e.y+Math.sin(e.angle)*e.range};
    damageAlongSegment(e,e.to,e.width,e.damage*e.power,.25);e.ticks++;e.wait+=.11;e.flash=1;
    state.shake=Math.max(state.shake,2+e.charge*.6);tone(180+e.ticks*18,.08,'sawtooth',.025);
  }
  e.flash=Math.max(0,(e.flash||0)-dt*4);return e.ticks<16||e.flash>0;
}
function drawSonicCannon(e){
  ctx.save();ctx.translate(e.x,e.y);const p=e.charge/8;
  if(e.phase==='fire')ctx.rotate(e.angle);
  ctx.strokeStyle=e.color;ctx.fillStyle='#183947';ctx.lineWidth=3;ctx.shadowColor=e.color;ctx.shadowBlur=18;
  // Horn body and concentric sound fronts, with a bright core and broad translucent beam.
  ctx.beginPath();ctx.moveTo(-20,-12);ctx.lineTo(18,-24);ctx.lineTo(18,24);ctx.lineTo(-20,12);ctx.closePath();ctx.fill();ctx.stroke();
  if(e.phase==='charge'){
    ctx.beginPath();ctx.arc(0,0,36,-Math.PI/2,-Math.PI/2+TAU*p);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=e.color;ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText(p>=1?'SONIC MAX':e.charge.toFixed(1)+' / 8s',0,-46);
  }else{
    ctx.globalAlpha=.15+.15*(e.flash||0);ctx.fillStyle=e.color;ctx.fillRect(18,-e.width/2,e.range-18,e.width);
    ctx.globalAlpha=.85;ctx.strokeStyle='#e6ffff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(e.range,0);ctx.stroke();
    for(let i=0;i<12;i++){const x=25+((i/12+(e.age*2)%1)%1)*(e.range-25),r=e.width*(.35+.25*x/e.range);ctx.globalAlpha=(1-x/e.range)*.8;ctx.lineWidth=3+4*p;ctx.strokeStyle=i%2?e.color:'#ffffff';ctx.beginPath();ctx.ellipse(x,0,8+16*p,r,0,0,TAU);ctx.stroke();}
  }
  ctx.restore();
}
function drawPoisonStatus(x,y,r,turns){
  if(!(turns>0))return;ctx.save();ctx.fillStyle='#a85ad0';ctx.strokeStyle='#e5bbff';ctx.lineWidth=1.5;
  for(let i=0;i<3;i++){const a=(state.clock||0)*1.6+i*TAU/3;ctx.beginPath();ctx.arc(x+Math.cos(a)*(r+6),y+Math.sin(a)*(r+6)-8,3+i,0,TAU);ctx.fill();ctx.stroke();}
  ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText('毒 '+turns+'T',x,y+r+16);ctx.restore();
}
