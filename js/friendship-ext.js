'use strict';
// 新友情コンボ：クロスバウンドボム / アブソリュートクロスレイ / カウンターリング / ショットガン。
// 発射は spawnNewFriendship（attacks.js の emitFriendship から呼ぶ）、更新は updateNewFriendship、描画は drawNewFriendship。
// attacks.js の後、controls.js の前に読み込む。
const NEW_COMBOS=['markedPierce','plasmaBall','armageddon','interference','dimensionRift','astralPress','blastHoming','oathSwords','heavyCannon','wallSnake','sakuraNova','sonicCannon','crossBomb','absoluteCross','counterRing','shotgun','shockSplit','wayLaser','pierceHoming','shinePillar','wheel','sakuraBurst','cornerMissile'];
const CANNON_RADIUS=76,WALL_SNAKE_SCALE=3.6,WALL_SNAKE_LENGTH=130*WALL_SNAKE_SCALE,WALL_SNAKE_REACH=29*WALL_SNAKE_SCALE;
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
 if(['markedPierce','plasmaBall'].includes(f.kind)){const target=livingTargets().sort((a,b)=>(b.hp||0)-(a.hp||0)||distance(ally,a)-distance(ally,b))[0];if(f.kind==='plasmaBall'&&!target)return true;queueEffect({type:f.kind,side:'ally',owner:ally,ownerId:ally.id,x:ally.x,y:ally.y,color:ally.color,damage,carrier,target,age:0,phase:'wait',marks:new Map(),balls:[],count:f.count||3,volley:0,wait:0,r:12});return true;}
 if(f.kind==='armageddon'){queueEffect({type:f.kind,side:'ally',ownerId:ally.id,owner:ally,color:ally.color,damage,age:0,hit:false});return true;}
 if(RESONANCE_KINDS.includes(f.kind)){spawnResonance(ally,f,carrier,damage);return true;}
  if(!NEW_COMBOS.includes(f.kind))return false;
  const base={side:'ally',x:ally.x,y:ally.y,damage,color:ally.color,age:0};
  if(f.kind==='heavyCannon'){
    const order=[...(state.touchedAllies||[])].indexOf(ally.id)+1;
    queueEffect({...base,type:f.kind,volleys:2*Math.max(1,order),emitted:0,wait:0,balls:[]});
  }else if(f.kind==='wallSnake'){
    const direction=Math.hypot(carrier.vx,carrier.vy)>.01?carrier:state.shotDirection||{vx:0,vy:-1};
    const angle=Math.atan2(direction.vy,direction.vx);
    const end=rayEnd(ally.x,ally.y,Math.cos(angle),Math.sin(angle));
    const {left,right,top,bottom}=FIELD,corners=[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}];
    const gaps=[Math.abs(end.y-top),Math.abs(end.x-right),Math.abs(end.y-bottom),Math.abs(end.x-left)];
    const edge=gaps.indexOf(Math.min(...gaps)),inset=60;
    // Follow an inset rectangle so the surfboard and wave stay visible near walls.
    end.x=clamp(end.x,left+inset,right-inset);end.y=clamp(end.y,top+inset,bottom-inset);
    for(const corner of corners){corner.x=clamp(corner.x,left+inset,right-inset);corner.y=clamp(corner.y,top+inset,bottom-inset);}
    const pts=[{x:ally.x,y:ally.y},end];
    for(let i=1;i<=4;i++)pts.push(corners[(edge+i)%4]);
    pts.push(end);
    const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+distance(pts[i-1],pts[i]));
    queueEffect({...base,type:f.kind,pts,cum,total:cum[cum.length-1],head:0,contacts:new Set()});
  }else if(f.kind==='sakuraNova'){
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
 if(state.stage.underwater&&!state.waterWallUsed){state.waterWallUsed=true;state.waterPower=true;unit.vx*=1.5;unit.vy*=1.5;ring(unit.x,unit.y,"#62dfff",75,.4);}
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
 if(['markedPierce','plasmaBall'].includes(e.type))return updateOrbFriendship(e,dt);
 if(e.type==='armageddon')return updateArmageddon(e);
 if(RESONANCE_KINDS.includes(e.type))return updateResonance(e,dt);
  const pool=livingTargets();
  if(e.type==='heavyCannon'){
    e.wait-=dt;
    if(e.emitted<e.volleys&&e.wait<=0){
      const offset=(e.emitted%2)*Math.PI/4;
      for(let i=0;i<4;i++){
        const a=offset+i*Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);
        e.balls.push({x:e.x,y:e.y,dx,dy,hits:new Set()});
        burst(e.x+dx*26,e.y+dy*26,e.color,8,160);
      }
      tone(140,.18,'sawtooth',.045,0,40);ring(e.x,e.y,e.color,58,.22);
      e.emitted++;e.wait+=.32;
    }
    e.balls=e.balls.filter(b=>{
      const from={x:b.x,y:b.y};b.x+=b.dx*410*dt;b.y+=b.dy*410*dt;
      for(const enemy of pool)if(!b.hits.has(enemy.id)&&enemyGap(enemy,from,b)<=CANNON_RADIUS){
        b.hits.add(enemy.id);damageEnemy(enemy,e.damage,true,{hit:{from,to:b,radius:CANNON_RADIUS}});
      }
      return b.x>=FIELD.left-CANNON_RADIUS&&b.x<=FIELD.right+CANNON_RADIUS&&b.y>=FIELD.top-CANNON_RADIUS&&b.y<=FIELD.bottom+CANNON_RADIUS;
    });
    return e.emitted<e.volleys||e.balls.length>0;
  }
  if(e.type==='wallSnake'){
    const previous=e.head;e.head+=820*dt;
    const contacts=new Set();
    for(let i=1;i<e.pts.length;i++){
      const start=Math.max(0,e.head-WALL_SNAKE_LENGTH,e.cum[i-1]),end=Math.min(e.head,e.cum[i]);
      if(end<start)continue;
      const from=pointOnBeam(e,start),to=pointOnBeam(e,end);
      for(const enemy of pool)if(enemyGap(enemy,from,to)<=WALL_SNAKE_REACH){
        if(!contacts.has(enemy.id)&&!e.contacts.has(enemy.id))damageEnemy(enemy,e.damage,true,{hit:{from,to,radius:WALL_SNAKE_REACH}});
        contacts.add(enemy.id);
      }
    }
    e.contacts=contacts;
    if(previous<e.cum[1]&&e.head>=e.cum[1]){burst(e.pts[1].x,e.pts[1].y,e.color,24,240);tone(320,.17,'sawtooth',.035,0,90);}
    return e.head<e.total+WALL_SNAKE_LENGTH;
  }
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
 if(['markedPierce','plasmaBall'].includes(e.type)){drawOrbFriendship(e);return;}
 if(e.type==='armageddon'){drawArmageddon(e);return;}
 if(RESONANCE_KINDS.includes(e.type)){drawResonance(e);return;}
  if(e.type==='heavyCannon'){
    ctx.save();
    for(const b of e.balls){
      const bitmap=cinematicBitmap('heavyCannon:'+e.color,160,160,1,(g)=>{g.translate(80,80);      const glow=g.createRadialGradient(0-CANNON_RADIUS*.35,0-CANNON_RADIUS*.42,3,0,0,CANNON_RADIUS);
      glow.addColorStop(0,'color-mix(in srgb, '+e.color+' 45%, white)');glow.addColorStop(.6,e.color);glow.addColorStop(1,'color-mix(in srgb, '+e.color+' 75%, black)');
      g.fillStyle=glow;g.strokeStyle='color-mix(in srgb, '+e.color+' 55%, black)';g.lineWidth=3;
      g.beginPath();g.arc(0,0,CANNON_RADIUS,0,TAU);g.fill();g.stroke();
      g.fillStyle='#ffffffa0';g.beginPath();g.ellipse(0-CANNON_RADIUS*.28,0-CANNON_RADIUS*.38,CANNON_RADIUS*.2,CANNON_RADIUS*.09,-.6,0,TAU);g.fill();});
      if(bitmap)ctx.drawImage(bitmap,b.x-80,b.y-80,160,160);else{      const glow=ctx.createRadialGradient(b.x-CANNON_RADIUS*.35,b.y-CANNON_RADIUS*.42,3,b.x,b.y,CANNON_RADIUS);
      glow.addColorStop(0,'color-mix(in srgb, '+e.color+' 45%, white)');glow.addColorStop(.6,e.color);glow.addColorStop(1,'color-mix(in srgb, '+e.color+' 75%, black)');
      ctx.fillStyle=glow;ctx.strokeStyle='color-mix(in srgb, '+e.color+' 55%, black)';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(b.x,b.y,CANNON_RADIUS,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle='#ffffffa0';ctx.beginPath();ctx.ellipse(b.x-CANNON_RADIUS*.28,b.y-CANNON_RADIUS*.38,CANNON_RADIUS*.2,CANNON_RADIUS*.09,-.6,0,TAU);ctx.fill();}

    }
    ctx.restore();return;
  }
  if(e.type==='wallSnake'){
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const light='color-mix(in srgb, '+e.color+' 30%, white)';
    const tail=Math.max(0,e.head-WALL_SNAKE_LENGTH),head=Math.min(e.head,e.total);
    // 壁の角にも沿う三層の波と、流れる白い泡。
    for(let layer=0;layer<3;layer++){
      ctx.beginPath();
      for(let d=tail;d<=head;d+=8){
        const p=pointOnBeam(e,d),q=pointOnBeam(e,Math.max(0,d-2)),angle=Math.atan2(p.y-q.y,p.x-q.x);
        const t=Math.max(0,1-(e.head-d)/WALL_SNAKE_LENGTH),wave=Math.sin(d*.035-e.age*9+layer)*23*t;
        const x=p.x-Math.sin(angle)*wave,y=p.y+Math.cos(angle)*wave;
        if(d===tail)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.strokeStyle=layer===2?light:e.color;ctx.globalAlpha=[.18,.5,.85][layer];ctx.lineWidth=[150,85,16][layer];ctx.stroke();
    }
    ctx.globalAlpha=1;
    for(let d=tail;d<head;d+=24){
      const p=pointOnBeam(e,d),t=Math.max(0,1-(e.head-d)/WALL_SNAKE_LENGTH);
      ctx.fillStyle=light;ctx.globalAlpha=t*.75;ctx.beginPath();ctx.arc(p.x+Math.sin(d*1.3+e.age*5)*48,p.y+Math.cos(d*.7+e.age*5)*48,2+4*t,0,TAU);ctx.fill();
    }
    ctx.globalAlpha=1;
    if(e.head<=e.total){
      const p=pointOnBeam(e,head),q=pointOnBeam(e,Math.max(0,head-3));
      ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.y-q.y,p.x-q.x));
      ctx.scale(1,-1);
      const wave=ctx.createLinearGradient(0,-70,0,90);wave.addColorStop(0,light);wave.addColorStop(1,e.color);
      ctx.fillStyle=wave;ctx.beginPath();ctx.moveTo(-115,65);ctx.bezierCurveTo(-50,50,-32,-92,42,-72);ctx.bezierCurveTo(100,-45,68,18,38,1);ctx.bezierCurveTo(85,7,100,70,115,76);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#ffffffb0';ctx.lineWidth=6;ctx.stroke();
      ctx.save();ctx.translate(4,16);ctx.rotate(-.25);ctx.fillStyle=light;ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,90,15,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore();
      const ball=ctx.createRadialGradient(-17,-33,3,0,-15,49);ball.addColorStop(0,'#fff');ball.addColorStop(.35,light);ball.addColorStop(1,e.color);
      ctx.fillStyle=ball;ctx.strokeStyle=light;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-26,49,0,TAU);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#ffffff90';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,-26,21,47,Math.sin(e.age*6)*.6,0,TAU);ctx.stroke();
    }
    ctx.restore();return;
  }
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
    if(state.phase==='moving'&&!state.unitStopped){e.charge=Math.min(SONIC_CHARGE_SECONDS,e.charge+dt);return true;}
    e.phase='fire';const p=e.charge/SONIC_CHARGE_SECONDS;e.width=40+120*p;e.power=1+3*p;
    e.maxTicks=4+Math.round(12*p);
  }
  e.wait-=dt;
  if(e.ticks<e.maxTicks&&e.wait<=0){
    const target=livingEnemiesByDistance(e)[0];if(!target)return false;
    e.angle=Math.atan2(target.y-e.y,target.x-e.x);
    e.to=rayEnd(e.x,e.y,Math.cos(e.angle),Math.sin(e.angle));
    e.range=distance(e,e.to);
    damageAlongSegment(e,e.to,e.width,e.damage*e.power,.25);e.ticks++;e.wait+=.11;e.flash=1;
    state.shake=Math.max(state.shake,2+4.8*e.charge/SONIC_CHARGE_SECONDS);tone(180+e.ticks*18,.08,'sawtooth',.025);
  }
  e.flash=Math.max(0,(e.flash||0)-dt*4);return e.ticks<e.maxTicks||e.flash>0;
}
function drawSonicCannon(e){
  ctx.save();ctx.translate(e.x,e.y);const p=e.charge/SONIC_CHARGE_SECONDS;
  if(e.phase==='fire')ctx.rotate(e.angle);
  ctx.strokeStyle=e.color;ctx.fillStyle='#183947';ctx.lineWidth=3;ctx.shadowColor=e.color;ctx.shadowBlur=18;
  // Horn body and concentric sound fronts, with a bright core and broad translucent beam.
  ctx.beginPath();ctx.moveTo(-20,-12);ctx.lineTo(18,-24);ctx.lineTo(18,24);ctx.lineTo(-20,12);ctx.closePath();ctx.fill();ctx.stroke();
  if(e.phase==='charge'){
    ctx.beginPath();ctx.arc(0,0,36,-Math.PI/2,-Math.PI/2+TAU*p);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=e.color;ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText(p>=1?'SONIC MAX':e.charge.toFixed(1)+' / '+SONIC_CHARGE_SECONDS+'s',0,-46);
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
// Five cinematic friendships. Timelines use absolute timestamps so skipped frames do not lose hits.
const RESONANCE_KINDS=['interference','dimensionRift','astralPress','blastHoming','oathSwords'];
function resonanceSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function spawnResonance(ally,f,carrier,damage){
 if(f.kind==='blastHoming'||f.kind==='oathSwords'){spawnRevisedFriendship(ally,f,damage);return;}
 const targets=livingTargets().sort((a,b)=>b.hp-a.hp),e={type:f.kind,side:'ally',ownerId:ally.id,owner:ally,x:ally.x,y:ally.y,color:ally.color,damage,age:0,carrier,events:[],points:[],hits:new Map(),life:1.55};
 const event=(t,p,r,m)=>e.events.push({t,p:{x:p.x,y:p.y},r,m});
 if(f.kind==='interference'){e.life=1.8;e.points=[{x:ally.x,y:ally.y}];}
 else if(f.kind==='dimensionRift'&&targets.length){
  e.life=1.85;
  let best=-1;for(const p of targets)for(let i=0;i<12;i++){const a=i*Math.PI/12,u={x:Math.cos(a),y:Math.sin(a)},a0={x:p.x-u.x*290,y:p.y-u.y*290},b={x:p.x+u.x*290,y:p.y+u.y*290},score=targets.filter(t=>resonanceSegment(t,a0,b)<=100+t.r).length;if(score>best){best=score;e.points=[a0,b];}}
  for(const t of [.55,.7,.85,1.2])e.events.push({t,line:true,r:t===1.2?140:100,m:t===1.2?6:1.33});
 }else if(f.kind==='astralPress'&&targets.length){e.points=[{x:targets[0].x,y:targets[0].y}];for(let i=0;i<6;i++)event(.3+i*.1,e.points[0],105,1);event(1,e.points[0],125,6);}
 e.events.sort((a,b)=>a.t-b.t);queueEffect(e);
}
function resonanceHit(e,p,r,m,key,limit=99){for(const enemy of livingTargets()){if(distance(enemy,p)>r+enemy.r)continue;const k=key+':'+enemy.id,n=e.hits.get(k)||0;if(n>=limit)continue;e.hits.set(k,n+1);damageEnemy(enemy,e.damage*m,true,{owner:e.owner,hit:{x:p.x,y:p.y,radius:r}});}}
function interferenceGeometry(e){const a=e.points[0],b=e.points[1],r=e.age*280,s=Math.max(0,e.age-.25)*370;if(!b)return {r,s,cross:[]};const d=distance(a,b);if(d<24)return {r,s,resonant:true,cross:[]};if(d>r+s||d<Math.abs(r-s))return {r,s,cross:[]};const z=(r*r-s*s+d*d)/(2*d),h=Math.sqrt(Math.max(0,r*r-z*z)),dx=(b.x-a.x)/d,dy=(b.y-a.y)/d;return {r,s,cross:[{x:a.x+z*dx-h*dy,y:a.y+z*dy+h*dx},{x:a.x+z*dx+h*dy,y:a.y+z*dy-h*dx}]};}
function updateResonance(e,dt){
 if(e.type==='blastHoming'||e.type==='oathSwords')return updateRevisedFriendship(e,dt);
 if(e.type==='interference'){
  if(e.age>=.25&&!e.points[1])e.points.push({x:e.carrier.x,y:e.carrier.y});const g=interferenceGeometry(e);
  e.points.forEach((p,i)=>{const r=i?g.s:g.r,prev=Math.max(0,r-dt*(i?370:280));for(const enemy of livingTargets()){const d=distance(p,enemy),key='ring'+i+':'+enemy.id;if(d+enemy.r>=prev-14&&d-enemy.r<=r+14&&e.age-(e.hits.get(key)??-Infinity)>=.12-1e-9){e.hits.set(key,e.age);damageEnemy(enemy,e.damage*2,true,{owner:e.owner,hit:{x:enemy.x,y:enemy.y,radius:14}});}}});
  if(e.age>=(e.nextPulse||.25)){e.nextPulse=e.age+.12;if(g.resonant){for(const en of livingTargets())if(Math.abs(distance(en,e.points[0])-g.r)<en.r+38)resonanceHit(e,en,1,1,'cross',Infinity);}else for(const p of g.cross)resonanceHit(e,p,56,1,'cross',Infinity);}
 }else while(e.events.length&&e.events[0].t<=e.age){const v=e.events.shift();if(v.line){for(const enemy of livingTargets()){let hit=false;for(let i=1;i<e.points.length;i++)if(resonanceSegment(enemy,e.points[i-1],e.points[i])<=v.r+enemy.r)hit=true;if(hit)damageEnemy(enemy,e.damage*v.m,true,{owner:e.owner,hit:{x:enemy.x,y:enemy.y,radius:v.r}});}}else resonanceHit(e,v.p,v.r,v.m,'event');}
 return e.age<e.life;
}
function drawResonance(e){
 if(e.type==='blastHoming'||e.type==='oathSwords'){drawRevisedFriendship(e);return;}
 const t=e.age,fade=clamp((e.life-t)/.35,0,1);ctx.save();ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=14;ctx.globalAlpha=fade;
 const line=(a,b,w)=>{ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 const circle=(p,r,w=3)=>{ctx.lineWidth=w;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.1,r),0,TAU);ctx.stroke();};
 const shards=(p,r)=>{for(let i=0;i<12;i++){const a=i*TAU/12+t,rr=r*(.3+(i%3)*.2);ctx.save();ctx.translate(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr);ctx.rotate(a+t);ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(5,4);ctx.lineTo(-3,8);ctx.closePath();ctx.fill();ctx.restore();}};
 if(e.type==='interference'){const g=interferenceGeometry(e);e.points.forEach((p,i)=>{ctx.globalAlpha=fade*(i?.65:.9);circle(p,i?g.s:g.r,12);circle(p,(i?g.s:g.r)+9,2);});ctx.globalAlpha=fade;for(const p of g.cross){circle(p,43+Math.sin(t*40)*6,9);shards(p,54);}if(g.resonant)circle(e.points[0],g.r,23);}
 else if(e.type==='dimensionRift'&&e.points.length){drawCosmicRift(e);}
 else for(const [i,p] of e.points.entries()){
  if(e.type==='astralPress'){const gap=90*(1-clamp(t,0,1));ctx.globalAlpha=fade*.12;ctx.fillRect(p.x-100,p.y-gap,200,gap*2);ctx.globalAlpha=fade;for(const sign of [-1,1]){ctx.save();ctx.translate(p.x,p.y+sign*gap);ctx.scale(1,.38);circle({x:0,y:0},110,5);circle({x:0,y:0},86,2);for(let j=0;j<8;j++){const a=j*TAU/8+t*sign;line({x:Math.cos(a)*65,y:Math.sin(a)*65},{x:Math.cos(a+.4)*100,y:Math.sin(a+.4)*100},3);}ctx.restore();}if(t>=1){circle(p,(t-1)*280,12);shards(p,(t-1)*240);}}
 }
 ctx.restore();
}
// Oath swords and four-generation explosive homing.
const BLAST_HOMING_RADII=[0,66,98,135,188]; // 爆風半径を約1.5倍。威力は共通。
function spawnRevisedFriendship(ally,f,damage){
 const e={type:f.kind,side:'ally',ownerId:ally.id,owner:ally,color:ally.color,damage,age:0,shots:[],bursts:[],counts:new Map(),emitted:0,count:Math.max(1,Math.floor(f.count??3)),resonated:false};
 if(f.kind==='blastHoming')e.shots.push({x:ally.x,y:ally.y,level:4,age:0,angle:-Math.PI/2,curve:0,trail:[]});
 queueEffect(e);
}
function revisedDamage(e,enemy,m,r=1){damageEnemy(enemy,e.damage*m,true,{owner:e.owner,hit:{x:enemy.x,y:enemy.y,radius:r}});}
function updateRevisedFriendship(e,dt){
 e.bursts=e.bursts.filter(b=>(b.age+=dt)<.4);
 if(e.type==='oathSwords'){
  while(e.emitted<e.count&&e.age>=e.emitted*.075){const pool=livingTargets(),enemy=pool[Math.floor(Math.random()*pool.length)];const i=e.emitted++;if(enemy)e.shots.push({target:enemy,x:enemy.x+(Math.random()-.5)*26,y:enemy.y+(Math.random()-.5)*18,start:i*.075,land:i*.075+.10,hit:false});}
  for(const s of e.shots)if(!s.hit&&e.age>=s.land){s.hit=true;if(targetable(s.target)){revisedDamage(e,s.target,1.5);e.counts.set(s.target.id,(e.counts.get(s.target.id)||0)+1);}e.bursts.push({x:s.x,y:s.y,r:40,age:0});}
  e.resonanceAt=(e.count-1)*.075+.24;
  if(!e.resonated&&e.age>=e.resonanceAt){e.resonated=true;for(const enemy of livingTargets()){const n=e.counts.get(enemy.id)||0;if(n)revisedDamage(e,enemy,2*Math.pow(2,n-1));}}
  return e.age<e.resonanceAt+.6;
 }
 // Small integration steps retain collision accuracy on slower frames.
 let remaining=dt;while(remaining>0){const step=Math.min(remaining,1/120);remaining-=step;const next=[];
  for(const s of e.shots){s.age+=step;const pool=livingTargets().sort((a,b)=>distance(a,s)-distance(b,s));const target=pool[0];if(!target)continue;
   // 分裂時の個体差と滑らかな揺らぎ。帰還時には揺らぎを収束させる。
   const old={x:s.x,y:s.y},arcTime=s.arcTime??.23;
   if(s.curve&&s.age<arcTime){s.angle+=s.curve*(s.arcRate??7)*step;}else{
    const aim=Math.atan2(target.y-s.y,target.x-s.x),wobble=s.curve?Math.sin(s.age*(s.frequency??8)+(s.phase??0))*.35*clamp(distance(target,s)/220,0,1)*clamp(2-s.age,0,1):0;
    const desired=aim+wobble,delta=Math.atan2(Math.sin(desired-s.angle),Math.cos(desired-s.angle)),turn=s.turnRate??10;
    s.angle=s.age>2.5?aim:s.angle+clamp(delta,-turn*step,turn*step);
   }
   s.x+=Math.cos(s.angle)*(s.speed??640)*step;s.y+=Math.sin(s.angle)*(s.speed??640)*step;
   s.trail.push({x:s.x,y:s.y});if(s.trail.length>14)s.trail.shift();
   if((!s.curve||s.age>=arcTime)&&resonanceSegment(target,old,s)<=target.r+6+s.level*3){const r=BLAST_HOMING_RADII[s.level];e.bursts.push({x:s.x,y:s.y,r,age:0,level:s.level});for(const enemy of livingTargets())if(distance(enemy,s)<=r+enemy.r)revisedDamage(e,enemy,1,r);
    if(s.level>1)for(const sign of [-1,1])next.push({x:s.x,y:s.y,level:s.level-1,age:0,angle:s.angle+sign*(.7+Math.random()*.9),curve:sign,arcTime:.17+Math.random()*.19,arcRate:4.5+Math.random()*5,speed:540+Math.random()*200,turnRate:8+Math.random()*5,frequency:6+Math.random()*6,phase:Math.random()*TAU,trail:[]});
   }else if(s.age<4)next.push(s);
  }e.shots=next;
 }
 return e.shots.length>0||e.bursts.length>0;
}
function revisedLightning(a,b,color,seed=0,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;for(let j=1;j<9;j++){const z=Math.sin(j*71+seed)*12;ctx.lineTo(a.x+dx*j/9-dy/d*z,a.y+dy*j/9+dx/d*z);}ctx.lineTo(b.x,b.y);ctx.stroke();}
function drawRevisedFriendship(e){
 ctx.save();ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=16;
 for(const b of e.bursts){const p=b.age/.4;ctx.globalAlpha=1-p;ctx.lineWidth=8*(1-p)+1;ctx.beginPath();ctx.arc(b.x,b.y,Math.max(1,b.r*(.2+p*.8)),0,TAU);ctx.stroke();ctx.globalAlpha=(1-p)*.2;ctx.fill();for(let i=0;i<10;i++){const a=i*TAU/10;ctx.beginPath();ctx.moveTo(b.x+Math.cos(a)*b.r*p,b.y+Math.sin(a)*b.r*p);ctx.lineTo(b.x+Math.cos(a)*b.r*(p+.2),b.y+Math.sin(a)*b.r*(p+.2));ctx.stroke();}}
 if(e.type==='blastHoming'){for(const s of e.shots){ctx.globalAlpha=.5;ctx.lineWidth=s.level*3;ctx.beginPath();s.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(s.x,s.y,5+s.level*4,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,2+s.level*2,0,TAU);ctx.stroke();ctx.strokeStyle=e.color;}}
 else{
  const fade=e.resonated?clamp(1-(e.age-e.resonanceAt)/.6,0,1):1;ctx.globalAlpha=fade;
  for(const [i,s] of e.shots.entries()){const fall=clamp((s.land-e.age)/.1,0,1);ctx.save();ctx.translate(s.x,s.y-fall*220);ctx.rotate(-.12+(i%3)*.12);
   ctx.fillStyle='#172032';ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(-12,-24);ctx.lineTo(-9,-78);ctx.lineTo(-17,-90);ctx.lineTo(-7,-86);ctx.lineTo(0,-103);ctx.lineTo(7,-86);ctx.lineTo(17,-90);ctx.lineTo(9,-78);ctx.lineTo(12,-24);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle=e.color;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(-4,-27);ctx.lineTo(0,-82);ctx.lineTo(4,-27);ctx.closePath();ctx.fill();
   ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-26,-87);ctx.lineTo(-17,-77);ctx.lineTo(0,-82);ctx.lineTo(17,-77);ctx.lineTo(26,-87);ctx.stroke();ctx.fillRect(-4,-117,8,29);ctx.beginPath();ctx.arc(0,-121,6,0,TAU);ctx.fill();
   revisedLightning({x:-15,y:-120},{x:8,y:5},e.color,Math.floor(e.age*30)+i,2);ctx.restore();
   if(e.resonated){const other=e.shots[(i+1)%e.shots.length];if(other&&other!==s)revisedLightning(s,other,e.color,Math.floor(e.age*45)+i,4);revisedLightning({x:s.x-30,y:s.y-100},{x:s.x+25,y:s.y+25},'#ffffff',e.age*40+i,1.5);}
  }
 }
 ctx.restore();
}
function drawCosmicRift(e){
 const [a,b]=e.points,t=e.age,angle=Math.atan2(b.y-a.y,b.x-a.x),length=distance(a,b),open=(1-Math.pow(1-clamp((t-.5)/.045,0,1),3))*(t>1.2?clamp((1.8-t)/.6,0,1):1);
 ctx.save();ctx.shadowBlur=0;ctx.translate((a.x+b.x)/2,(a.y+b.y)/2);ctx.rotate(angle);
 const spine=e.riftSpine||(e.riftSpine=Array.from({length:17},(_,i)=>({x:-length/2+length*i/16,y:Math.sin(i*17)*18})));
 // Stable angular branches form a fractured glass network, rather than a wavering beam.
 for(let i=1;i<16;i++){if(t<i*.012)continue;const p=spine[i];for(const sign of [-1,1]){const q={x:p.x+Math.sin(i*13)*28,y:p.y+sign*(25+(i%4)*16)};ctx.strokeStyle=e.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(q.x+18*Math.cos(i),q.y+sign*22);ctx.stroke();ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x-24,q.y+sign*14);ctx.stroke();}}
 drawRiftOpening(t,length,e.color);
 const boundary=[];for(const sign of [-1,1]){const seq=sign===1?spine:[...spine].reverse();for(const p of seq){const width=(16+62*Math.pow(Math.max(0,1-Math.abs(p.x)/(length/2)),.6)+12*Math.sin(p.x))*open;boundary.push({x:p.x,y:p.y+sign*width});}}
 ctx.beginPath();boundary.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.save();ctx.clip();ctx.fillStyle='#03040d';ctx.fillRect(-length/2-10,-100,length+20,200);
 // Character-tinted nebulae and drifting stars remain clipped inside the tear.
 for(let i=0;i<7;i++){ctx.globalAlpha=.08;ctx.fillStyle=e.color;ctx.beginPath();ctx.ellipse(-length*.42+i*length*.14,Math.sin(i*7+t)*30,95,24+i%3*12,.4,0,TAU);ctx.fill();}
 const stars=cinematicBitmap('rift-stars:'+e.color,640,200,1,g=>{for(let i=0;i<100;i++){g.fillStyle=i%4?'#ffffff':e.color;g.globalAlpha=.35+(i%7)*.09;g.fillRect((i*97.31)%640,100+Math.sin(i*127.1)*95,i%9===0?2.5:1,i%9===0?2.5:1);}});
 if(stars){ctx.globalAlpha=.8+.15*Math.sin(t*2);ctx.drawImage(stars,-length/2+t*8-20,-100,length+40,200);}else{for(let i=0;i<100;i++){ctx.globalAlpha=.65;ctx.fillStyle=i%4?'#ffffff':e.color;ctx.fillRect(((i*97.31+t*8)%length)-length/2,Math.sin(i*127.1)*95,1.5,1.5);}}

 ctx.restore();ctx.beginPath();boundary.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.shadowBlur=8;ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=.7;ctx.stroke();
 drawRiftShards(t,length,e.color);
 ctx.restore();
}
// Secondary fractures erupt after the pause. Black cores retain the owner's hue.
function drawRiftOpening(t,length,color){
 const age=t-.5;if(age<0)return;
 const rgb=[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*.16));
 const ink=`rgb(${rgb.join(',')})`,growth=clamp(age/.14,0,1),fade=clamp((1.8-t)/.4,0,1);
 ctx.save();ctx.globalAlpha=fade;ctx.shadowBlur=0;
 for(let i=0;i<12;i++){
  const sign=i%2?1:-1,x=-length*.46+i*length*.08,y=Math.sin(i*17)*18;
  const pts=[{x,y}];for(let j=1;j<5;j++)pts.push({x:x+Math.sin(i*23+j*9)*j*15*growth,y:y+sign*j*(24+i%3*7)*growth});
  for(const [stroke,width] of [[color,5],[ink,3]]){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.beginPath();pts.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
  for(let j=2;j<5;j++){const p=pts[j];ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(i%2?1:-1)*32*growth,p.y+sign*15*growth);ctx.lineTo(p.x+(i%2?1:-1)*49*growth,p.y+sign*38*growth);ctx.stroke();}
 }
 // Brief pressure flash as the opening snaps outward.
 if(age<.18){ctx.globalAlpha=(1-age/.18)*.65;ctx.strokeStyle=color;ctx.lineWidth=5*(1-age/.18)+1;ctx.beginPath();ctx.ellipse(0,0,length*.48+age*100,12+age*420,0,0,TAU);ctx.stroke();}
 ctx.restore();
}
function drawRiftShards(t,length,color){
 const age=t-.5;if(age<0||age>.75)return;
 ctx.save();ctx.shadowBlur=0;
 for(let i=0;i<20;i++){
  const sign=i%2?1:-1,speed=160+(i*47)%260,x=-length*.48+(i*79%997)/997*length*.96;
  const travel=(1-Math.exp(-age*4))*speed;
  ctx.save();ctx.translate(x+Math.sin(i*17)*travel*.45,sign*(12+travel)+age*age*90);ctx.rotate(i*13+age*(i%2?7:-9));
  const size=7+i%6*2,flip=.25+.75*Math.abs(Math.cos(age*8+i));ctx.scale(flip,1);
  ctx.globalAlpha=clamp(1-age/.75,0,1)*.8;ctx.fillStyle=i%4===0?'#ffffff':color;ctx.strokeStyle='#ffffff';ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(-size*.7,-size);ctx.lineTo(size,-size*.25);ctx.lineTo(size*.25,size*1.3);ctx.lineTo(-size*.5,size*.3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.globalAlpha*=.6;ctx.beginPath();ctx.moveTo(-size*.7,-size);ctx.lineTo(size*.25,size*1.3);ctx.stroke();ctx.restore();
 }
 ctx.restore();
}
// A single full-field detonation. Beam and scenery are visual only, avoiding repeated damage.
function updateArmageddon(e){
 if(!e.hit&&e.age>=1.15){e.hit=true;for(const enemy of livingTargets())damageEnemy(enemy,e.damage,true,{owner:e.owner,hit:{x:enemy.x,y:enemy.y,radius:Math.hypot(FIELD.right-FIELD.left,FIELD.bottom-FIELD.top)}});state.shake=Math.max(state.shake||0,7);}
 return e.age<2.25;
}
function drawArmageddon(e){
 const t=e.age,c=e.color,cx=(FIELD.left+FIELD.right)/2,portalY=FIELD.top+10,impactY=FIELD.top+(FIELD.bottom-FIELD.top)*.73;
 const arrival=1-Math.pow(1-clamp((t-.15)/.48,0,1),3),depart=clamp((t-1.7)/.45,0,1),fade=1-depart;
 ctx.save();ctx.globalAlpha=fade;ctx.translate(cx,portalY);ctx.strokeStyle=c;ctx.shadowColor=c;ctx.shadowBlur=0;
 const oval=(x,y,rx,ry,fill,stroke=c,w=2)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();};

 // Horizontal cosmic aperture and its star field.
 const aperture=clamp(t/.18,0,1);oval(0,0,245*aperture,25*aperture,'#070711',c,3);
 ctx.save();ctx.beginPath();ctx.ellipse(0,0,240*aperture,23*aperture,0,0,TAU);ctx.clip();ctx.fillStyle='#ffffff';for(let i=0;i<30;i++)ctx.fillRect(-230+(i*83%460),Math.sin(i*17)*18,1.5,1.5);ctx.restore();
 drawArmageddonAtmosphere(e,impactY-portalY);
 // Clip deployment at the aperture: an armored central reactor, side engines and segmented struts.
 ctx.save();ctx.beginPath();ctx.rect(-260,0,520,340);ctx.clip();const machineY=-190+arrival*170-depart*170-(t>=.93&&t<1.3?Math.sin(clamp((t-.93)/.37,0,1)*Math.PI)*9:0);ctx.translate(0,machineY);
 const machine=cinematicBitmap('machine:'+c,420,190,1.5,(g)=>{g.translate(210,15);drawArmageddonMachine(g,c);});
 if(machine)ctx.drawImage(machine,-210,-15,420,190);else drawArmageddonMachine(ctx,c);
 const muzzle=machineY+159;ctx.restore();
 drawArmageddonDischarge(e,muzzle,impactY-portalY);

 ctx.restore();
}
function armageddonGlow(x,y,r,color,alpha){
 if(alpha<=.005||r<=0)return;
 ctx.save();ctx.globalAlpha*=alpha;ctx.shadowBlur=0;
 const glow=cinematicBitmap('glow:'+color,128,128,1,g=>{const grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'#ffffff');grad.addColorStop(.15,color);grad.addColorStop(1,color+'00');g.fillStyle=grad;g.fillRect(0,0,128,128);});
 if(glow)ctx.drawImage(glow,x-r,y-r,r*2,r*2);else{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.15,color);g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}ctx.restore();
}
function drawArmageddonAtmosphere(e,end){
 const t=e.age,c=e.color;ctx.save();ctx.shadowBlur=0;
 // Darken the space behind the weapon, preserving the readable battlefield beneath.
 ctx.globalAlpha=.22*Math.sin(clamp(t/2.25,0,1)*Math.PI);ctx.fillStyle='#080b1c';ctx.fillRect(-310,0,620,740);ctx.globalAlpha=1;
 armageddonGlow(0,0,260,c,.25);
 for(let k=0;k<3;k++){ctx.strokeStyle=k===1?'#ecf3ff':c;ctx.lineWidth=k===1?1:2;ctx.globalAlpha=.5;ctx.beginPath();ctx.ellipse(0,0,245+k*8,17+k*6,0,t*(k%2?1:-1),t*(k%2?1:-1)+Math.PI*1.6);ctx.stroke();}
 // Electrical fractures travel along the rim, and motes fall out of the dimensional breach.
 for(let i=0;i<6;i++){const x=-230+i*85;ctx.globalAlpha=.55;revisedLightning({x,y:-2},{x:x+45,y:Math.sin(i*9)*12},c,Math.floor(t*16)+i,1.5);}
 for(let i=0;i<24;i++){const p=(t*.45+i*.137)%1,x=Math.sin(i*57)*230;ctx.globalAlpha=(1-p)*.6;ctx.fillStyle=i%3?c:'#ffffff';ctx.fillRect(x,p*90,1.5,3+p*6);}
 if(t>.65&&t<1.15){const p=clamp((t-.65)/.5,0,1);ctx.globalAlpha=p*.65;ctx.strokeStyle=c;ctx.lineWidth=1.5;for(let k=0;k<2;k++){ctx.beginPath();ctx.ellipse(0,end,90-k*30,28-k*8,0,t*2,-t*2+TAU);ctx.stroke();}for(let i=0;i<4;i++){ctx.save();ctx.translate(0,end);ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(35,0);ctx.lineTo(62,0);ctx.stroke();ctx.restore();}}
 ctx.restore();
}
function drawArmageddonDischarge(e,muzzle,end){
 const t=e.age,c=e.color;ctx.save();ctx.shadowBlur=0;
 if(t>.57&&t<1.65){const charge=clamp((t-.57)/.36,0,1);
  armageddonGlow(0,muzzle,35+charge*75,c,.7);
  // Counter-rotating collector rings and inward spirals feed the muzzle.
  for(let k=0;k<3;k++){ctx.strokeStyle=k===1?'#ffffff':c;ctx.lineWidth=2;ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(0,muzzle,22+k*12,8+k*5,(k%2?1:-1)*t*2,0,TAU);ctx.stroke();}
  for(let i=0;i<24;i++){const p=(t*1.8+i/24)%1,a=i*2.4+t*3,r=12+(1-p)*90;ctx.globalAlpha=p;ctx.strokeStyle=i%3?c:'#ffffff';ctx.lineWidth=1+p*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,muzzle+Math.sin(a)*r*.65);ctx.lineTo(Math.cos(a+.2)*(r+12),muzzle+Math.sin(a+.2)*(r+12)*.65);ctx.stroke();}
  if(t>=.93){const power=clamp((t-.93)/.07,0,1)*clamp((1.65-t)/.2,0,1),width=35*power;
   for(const [w,alpha,color] of [[width*3,.12,c],[width*1.8,.22,c],[width,.8,c],[width*.38,1,'#ffffff']]){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,w);ctx.beginPath();ctx.moveTo(0,muzzle);ctx.lineTo(0,end);ctx.stroke();}
   for(let i=0;i<7;i++){const p=(t*3+i/7)%1,y=muzzle+(end-muzzle)*p;ctx.globalAlpha=(1-p)*.75;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,y,20+power*12,6,0,0,TAU);ctx.stroke();}
   for(const sign of [-1,1]){ctx.globalAlpha=.6;revisedLightning({x:sign*18,y:muzzle},{x:sign*23,y:end},c,Math.floor(t*25)+sign,2);}
   if(t<1.15)armageddonGlow(0,end,110,c,.8);
  }
 }
 if(t>=1.15){const age=t-1.15,fade=clamp(1-age/1.1,0,1),expand=1-Math.exp(-age*6);
  // Layered plasma cloud, a rising incandescent column and expanding pressure fronts.
  ctx.globalAlpha=fade;armageddonGlow(0,end,100+expand*300,c,.8);
  const core=ctx.createLinearGradient(0,end-320,0,end+90);core.addColorStop(0,c+'00');core.addColorStop(.5,c+'88');core.addColorStop(.85,'#ffffff');core.addColorStop(1,c+'00');ctx.fillStyle=core;ctx.globalAlpha=fade*.8;
  ctx.beginPath();ctx.moveTo(-70*expand,end+50);ctx.bezierCurveTo(-100,end-80,-10,end-120,-12,end-320*expand);ctx.lineTo(12,end-320*expand);ctx.bezierCurveTo(10,end-120,100,end-80,70*expand,end+50);ctx.closePath();ctx.fill();
  for(let k=0;k<4;k++){const p=clamp((age-k*.07)/.65,0,1);if(!p)continue;ctx.globalAlpha=(1-p)*fade;ctx.strokeStyle=k%2?c:'#ffffff';ctx.lineWidth=6*(1-p)+1;ctx.beginPath();ctx.ellipse(0,end,25+p*460,10+p*(110+k*18),k%2?.08:-.08,0,TAU);ctx.stroke();}
  // Radial bolts and hot fragments make the burst irregular instead of a flat polygon.
  for(let i=0;i<14;i++){const a=i*TAU/14+.12,r=70+expand*(150+i%4*32);ctx.globalAlpha=fade*.65;revisedLightning({x:Math.cos(a)*45,y:end+Math.sin(a)*35},{x:Math.cos(a)*r,y:end+Math.sin(a)*r*.8},i%3?c:'#ffffff',i+Math.floor(age*14),2);}
  for(let i=0;i<32;i++){const a=i*2.399,r=age*(150+i%7*35),x=Math.cos(a)*r,y=end+Math.sin(a)*r*.7+age*age*50;ctx.globalAlpha=fade;ctx.strokeStyle=i%4?c:'#ffffff';ctx.lineWidth=1+i%3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(a)*18,y-Math.sin(a)*12);ctx.stroke();}
  if(age<.1){ctx.globalAlpha=(1-age/.1)*.17;ctx.fillStyle='#ffffff';ctx.fillRect(-310,-80,620,800);}
 }
 ctx.restore();
}

function drawArmageddonMachine(ctx,c){
 const oval=(x,y,rx,ry,fill,stroke=c,w=2)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();};
 const panel=(x,y,w,h)=>{const metal=ctx.createLinearGradient(x,y,x+w,y);metal.addColorStop(0,'#151d2b');metal.addColorStop(.28,'#647487');metal.addColorStop(.48,'#9ba8b5');metal.addColorStop(.56,'#3b485c');metal.addColorStop(1,'#111725');ctx.fillStyle=metal;ctx.fillRect(x,y,w,h);ctx.strokeStyle='#9da9b9';ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#a3b5c9';ctx.fillRect(x+3,y+3,w-6,2);ctx.fillStyle='#101825';ctx.fillRect(x+3,y+h-5,w-6,3);};
 for(const sign of [-1,1]){
  ctx.save();ctx.translate(sign*140,65);ctx.rotate(sign*-.23);panel(-13,-65,26,95);for(let j=0;j<4;j++)panel(-17,-58+j*22,34,10);ctx.restore();
  panel(sign*154-32,78,64,43);oval(sign*154,122,29,12,'#151b27');oval(sign*154,131,17,5,c);
  for(let j=0;j<3;j++){const x=sign*154+(j-1)*17;panel(x-4,122,8,20);}
 }
 panel(-61,8,122,87);oval(0,10,64,16,'#637181');oval(0,84,65,18,'#151b27');
 panel(-44,24,88,18);for(let i=0;i<7;i++){ctx.fillStyle=c;ctx.fillRect(-37+i*11,28,7,10);}
 for(const sign of [-1,1]){ctx.save();ctx.translate(sign*76,42);ctx.rotate(sign*.4);panel(-13,-38,26,86);panel(-17,14,34,15);ctx.restore();}
 oval(0,128,110,32,'#222b38','#a3afbd',3);panel(-98,104,196,27);oval(0,105,99,22,'#657283');oval(0,107,68,12,'#252c39');
 for(let i=0;i<11;i++){const a=i*Math.PI/10;oval(Math.cos(a)*93,126+Math.sin(a)*19,3,3,'#c0c9d4','#606c7c',1);}
 panel(-28,137,56,18);oval(0,157,25,10,'#111722');oval(0,159,14,5,c);

}

// Bounded LRU cache of procedurally drawn assets; released on eviction.
const cinematicBitmaps=new Map();
function cinematicBitmap(key,w,h,scale,paint){
 if(cinematicBitmaps.has(key)){const image=cinematicBitmaps.get(key);cinematicBitmaps.delete(key);cinematicBitmaps.set(key,image);return image;}
 let image;if(typeof OffscreenCanvas!=='undefined')image=new OffscreenCanvas(Math.ceil(w*scale),Math.ceil(h*scale));else if(typeof document!=='undefined'){image=document.createElement('canvas');image.width=Math.ceil(w*scale);image.height=Math.ceil(h*scale);}else return null;
 const g=image.getContext('2d');if(!g)return null;g.scale(scale,scale);paint(g);cinematicBitmaps.set(key,image);
 while(cinematicBitmaps.size>18)cinematicBitmaps.delete(cinematicBitmaps.keys().next().value);return image;
}
function updateOrbFriendship(e,dt){
 if(e.type==='markedPierce'){
  if(e.phase==='wait'){if(state.phase==='moving'&&!state.unitStopped)return true;e.phase='fire';}
  e.wait-=dt;
  while(e.volley<3&&e.wait<=0){for(const target of e.marks.values()){const a=Math.atan2(target.y-e.y,target.x-e.x);for(let i=0;i<e.count;i++){const angle=a+(i-(e.count-1)/2)*.09;e.balls.push({x:e.x,y:e.y,dx:Math.cos(angle),dy:Math.sin(angle),travel:0,hits:new Set()});}}e.volley++;e.flashAt=e.age;e.wait+=.22;}
  e.balls=e.balls.filter(b=>{const from={x:b.x,y:b.y};b.travel=(b.travel||0)+2200*dt;b.x+=b.dx*2200*dt;b.y+=b.dy*2200*dt;for(const en of livingTargets())if(!b.hits.has(en.id)&&enemyGap(en,from,b)<=7){b.hits.add(en.id);damageEnemy(en,e.damage,true,{owner:e.owner,hit:{from,to:b,radius:7}});}return b.travel<Math.hypot(FIELD.right-FIELD.left,FIELD.bottom-FIELD.top)+600;});return e.volley<3||e.balls.length>0;
 }
 if(e.phase==='end'){e.endAge+=dt;return e.endAge<.4;}
 if(e.phase==='wait'){const d=distance(e,e.target),step=620*dt;if(d>step){e.x+=(e.target.x-e.x)/d*step;e.y+=(e.target.y-e.y)/d*step;return true;}e.x=e.target.x;e.y=e.target.y;e.phase='grow';}
 const limit=Math.max(0,Math.min(e.x-FIELD.left,FIELD.right-e.x,e.y-FIELD.top,FIELD.bottom-e.y));e.r=Math.min(limit,e.r+125*dt);e.wait-=dt;
 if(e.wait<=0){e.wait+=.12;for(const en of livingTargets())if(enemyGap(en,e,e)<=e.r)damageEnemy(en,e.damage,true,{owner:e.owner,hit:{x:e.x,y:e.y,radius:e.r}});}
 if(e.r>=limit){for(const en of livingTargets())if(enemyGap(en,e,e)<=e.r+45)damageEnemy(en,e.damage*6,true,{owner:e.owner,hit:{x:e.x,y:e.y,radius:e.r+45}});e.phase='end';e.endAge=0;state.shake=Math.max(state.shake||0,5);}return true;
}
function drawOrbFriendship(e){
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';const t=e.age,c=e.color;
 const circle=(x,y,r,color,w,alpha=1)=>{ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,TAU);ctx.stroke();};
 const glow=(x,y,r,alpha)=>{const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,'#ffffff');g.addColorStop(.15,c);g.addColorStop(1,c+'00');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();};
 const seal=(p,r,spin,alpha)=>{glow(p.x,p.y,r*1.6,.16*alpha);circle(p.x,p.y,r,c,2,alpha);circle(p.x,p.y,r*.84,'#fff',1,alpha*.8);circle(p.x,p.y,r*.55,c,2,alpha);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(spin);ctx.globalAlpha=alpha;ctx.strokeStyle=c;ctx.lineWidth=1.5;for(let k=0;k<2;k++){ctx.beginPath();for(let i=0;i<=3;i++){const a=i*TAU/3+k*Math.PI,rr=r*.76;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.beginPath();ctx.moveTo(r*.94,0);ctx.lineTo(r*1.12,0);ctx.lineTo(r*1.08,3);ctx.stroke();}ctx.restore();};
 if(e.type==='markedPierce'){
  const flash=Math.max(0,1-(t-(e.flashAt??-10))/.18),deploy=Math.min(1,t/.18);
  seal(e,(26+flash*9)*deploy,t*.8,1);glow(e.x,e.y,42+flash*40,.3+flash*.5);
  for(const en of e.marks.values()){const r=Math.min(34,en.r+5);seal(en,r,-t*1.5,.9);for(let i=0;i<4;i++){const a=i*TAU/4+t*.2;circle(en.x+Math.cos(a)*(r+8),en.y+Math.sin(a)*(r+8),2.5,'#fff',2,.9);}if(e.phase==='fire')circle(en.x,en.y,r+flash*20,c,2,flash);}
  for(const b of e.balls){const travel=b.travel??distance(e,b),tail=Math.min(500,travel),thickness=.35+travel/180;for(const [w,alpha,color] of [[12,.12,c],[6,.4,c],[3,.95,c],[1,1,'#fff']]){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=w*thickness;ctx.beginPath();ctx.moveTo(b.x-b.dx*tail,b.y-b.dy*tail);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(b.x+b.dx*14,b.y+b.dy*14);ctx.lineTo(b.x-b.dx*9-b.dy*1.5*thickness,b.y-b.dy*9+b.dx*1.5*thickness);ctx.lineTo(b.x-b.dx*9+b.dy*1.5*thickness,b.y-b.dy*9-b.dx*1.5*thickness);ctx.closePath();ctx.fill();}
 }else{
  const end=e.phase==='end',p=end?Math.min(1,e.endAge/.4):0,fade=1-p,r=Math.max(2,e.r),cx=e.x,cy=e.y;
  glow(cx,cy,r*1.3,.36*fade);const g=ctx.createRadialGradient(cx-r*.2,cy-r*.25,0,cx,cy,r);g.addColorStop(0,'#ffffff');g.addColorStop(.12,'#d9ffff');g.addColorStop(.38,c);g.addColorStop(.75,'#153c66');g.addColorStop(1,c);ctx.globalAlpha=.42*fade;ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();
  circle(cx,cy,r,c,3,.8*fade);circle(cx,cy,r*.96,'#eaffff',1,.65*fade);
  for(let i=0;i<3;i++){ctx.save();ctx.translate(cx,cy);ctx.rotate(t*(i%2?-1:1)+i*TAU/3);ctx.globalAlpha=.55*fade;ctx.strokeStyle=i===1?'#fff':c;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*.94,r*(.22+i*.07),0,0,TAU);ctx.stroke();ctx.restore();}
  for(let i=0;i<16;i++){const a=i*TAU/16+t*.4;ctx.beginPath();for(let j=0;j<=8;j++){const rr=(r+(end?55*p:0))*j/8,ang=a+Math.sin(Math.floor(t*28)*1.3+i*7+j*4)*.09;const x=cx+Math.cos(ang)*rr,y=cy+Math.sin(ang)*rr;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.globalAlpha=(end?.95:.5)*fade;ctx.strokeStyle=i%3?'#bfffff':c;ctx.lineWidth=end?2.8:1.3;ctx.stroke();}
  for(let i=0;i<10;i++){const a=i*2.4+t*(i%2?1:-1),rr=r*(.55+.35*Math.sin(i*8+t));glow(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,3+Math.min(6,r*.025),.65*fade);}
  if(end){circle(cx,cy,r+70*p,'#fff',5*fade,fade);circle(cx,cy,r+100*p,c,2,fade*.7);glow(cx,cy,r*.65,.85*fade);}
 }
 ctx.restore();
}
