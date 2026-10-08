'use strict';
// 友情コンボ・敵の攻撃・攻撃エフェクトの更新
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // ATTACK PATTERNS (friendship combos and enemy attacks share these)
  // ---------------------------------------------------------------------------
  function logAttack(side, kind) {
    state.attackLog.push({ side, kind, turn: state.turn });
    if (state.attackLog.length > 80) state.attackLog.shift();
  }

  function livingEnemiesByDistance(from) {
    return state.enemies.filter(enemy => (enemy.alive&&!enemy.transparent)).sort((a, b) => distance(a, from) - distance(b, from));
  }

  // 点から半直線(origin, 単位方向)までの距離
  function distanceToRay(px, py, ox, oy, dx, dy) {
    const t = (px - ox) * dx + (py - oy) * dy;
    if (t < 0) return Math.hypot(px - ox, py - oy);
    return Math.abs((px - ox) * dy - (py - oy) * dx);
  }

  function rayEnd(ox, oy, dx, dy) {
    let t = Infinity;
    if (dx > 1e-6) t = Math.min(t, (FIELD.right - ox) / dx); else if (dx < -1e-6) t = Math.min(t, (FIELD.left - ox) / dx);
    if (dy > 1e-6) t = Math.min(t, (FIELD.bottom - oy) / dy); else if (dy < -1e-6) t = Math.min(t, (FIELD.top - oy) / dy);
    if (!Number.isFinite(t)) t = 0;
    return { x: ox + dx * t, y: oy + dy * t };
  }

  // スナイパーショット: 近くの対象を即座に撃ち抜く（従来の友情コンボ・敵攻撃）
  function fireSniper(from, targets, damage, color) {
    targets.forEach((target, i) => {
      state.beams.push({ x1: from.x, y1: from.y, x2: target.x, y2: target.y, color, life: 0.32, max: 0.32 });
      damageEnemy(target, damage * (i ? 0.85 : 1), true, { hit: { from, to: target, radius: 3 } });
    });
  }

  // レーザー: 対象に向かって直線に放ち、線上の対象すべてに最大 hits 回ヒット
  function spawnLaser(side, source, target, o) {
    let dx = target.x - source.x;
    let dy = target.y - source.y;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length; dy /= length;
    const end = rayEnd(source.x, source.y, dx, dy);
    queueEffect({
      type: 'laser', side, x: source.x, y: source.y, ex: end.x, ey: end.y, dx, dy,
      width: o.width || 40, hits: o.hits, hitsLeft: o.hits, wait: 0.2, interval: 0.17, flash: 0, age: 0,
      damage: o.damage, color: o.color,
    });
  }

  // ホーミング(X): 対象に向かって曲がりながら飛ぶ弾を count 発放つ
  function spawnHoming(side, source, targets, o) {
    const base = Math.random() * TAU;
    for (let i = 0; i < o.count; i++) {
      queueEffect({
        type: 'homing', side, x: source.x, y: source.y, angle: base + i * TAU / o.count,
        speed: o.speed || 430, target: targets[i % targets.length], delay: i * 0.07, age: 0, life: 3.2,
        damage: o.damage, color: o.color, trail: [], launched: false,
      });
    }
  }

  // 爆発: 中心に近い対象ほど多段ヒット（最大 maxHits 回）
  function spawnExplosion(side, center, pool, o) {
    const entries = pool.map(target => {
      const edge = Math.max(0, distance(target, center) - (target.r || 0) * 0.9);
      const ratio = 1 - edge / o.radius;
      return { target, hits: ratio > 0 ? clamp(Math.ceil(ratio * o.maxHits), 1, o.maxHits) : 0 };
    }).filter(entry => entry.hits > 0);
    const maxTick = Math.max(1, ...entries.map(entry => entry.hits));
    queueEffect({
      type: 'explosion', side, x: center.x, y: center.y, radius: o.radius, damage: o.damage, color: o.color,
      entries, tick: 0, maxTick, wait: 0.14, interval: 0.13, pulse: 0, age: 0,
    });
  }

  // Meteor targets are selected afresh from living targets for each sequential drop.
  const METEOR = Object.freeze({ fall: .25, gap: .055, visualRadius: 24, hitRadius: 38 });
  function spawnMeteor(side, source, o) {
    queueEffect({ type: 'meteor', side, x:source.x, y:source.y, left:o.count, damage:o.damage, color:o.color, wait:0, impact:null, age:0 });
  }
  function updateMeteor(effect, dt) {
    const pool = effect.side === 'ally' ? state.enemies.filter(e=>(e.alive&&!e.transparent)) : state.units;
    if (!pool.length) return false;
    if (effect.impact && effect.side === 'ally' && !(effect.target.alive&&!effect.target.transparent)) { effect.impact=null; effect.wait=0; }
    if (!effect.impact) {
      if (effect.left <= 0) return false;
      effect.wait -= dt;
      if (effect.wait > 0) return true;
      effect.target=pool[Math.floor(Math.random()*pool.length)];
      const a=Math.random()*TAU, offset=Math.random()*effect.target.r*.5;
      effect.impact={x:effect.target.x+Math.cos(a)*offset,y:effect.target.y+Math.sin(a)*offset};
      effect.wait=METEOR.fall;
    }
    effect.wait-=dt;
    if (effect.wait > 0) return true;
    const p=effect.impact, radius=METEOR.hitRadius;
    if (effect.side==='ally') damageEnemy(effect.target,effect.damage,true,{charge:1.5,hit:{...p,radius}});
    else damageTeam(effect.damage,effect.target.x,effect.target.y,effect.target);
    ring(p.x,p.y,effect.color,radius,.45);burst(p.x,p.y,effect.color,16,150);
    tone(95,.18,'triangle',.035,0,38);
    effect.left--;effect.impact=null;effect.wait=METEOR.gap;
    return effect.left>0;
  }
  function spawnSpread(side, source, o) {
    queueEffect({type:'spread',side,x:source.x,y:source.y,ways:o.ways,volleys:o.volleys,emitted:0,wait:0,bullets:[],damage:o.damage,color:o.color,age:0});
  }
  function segmentCircleHit(a,b,center,radius) {
    const dx=b.x-a.x,dy=b.y-a.y,fx=a.x-center.x,fy=a.y-center.y;
    const aa=dx*dx+dy*dy,cc=fx*fx+fy*fy-radius*radius;
    if(cc<=0)return 0;
    if(aa<1e-9)return null;
    const bb=2*(fx*dx+fy*dy),disc=bb*bb-4*aa*cc;
    if(disc<0)return null;
    const t=(-bb-Math.sqrt(disc))/(2*aa);
    return t>=0&&t<=1?t:null;
  }
  function updateSpread(effect,dt) {
    effect.wait-=dt;
    if(effect.emitted<effect.volleys&&effect.wait<=0){
      for(let i=0;i<effect.ways;i++){
        const a=i*TAU/effect.ways - Math.PI/2;
        effect.bullets.push({x:effect.x,y:effect.y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:1.8});
      }
      effect.emitted++;effect.wait+=.23;
      ring(effect.x,effect.y,effect.color,40,.25);tone(420,.065,'triangle',.018);
    }
    const remaining=[];
    for(const bullet of effect.bullets){
      const from={x:bullet.x,y:bullet.y};
      bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;bullet.life-=dt;
      const pool=effect.side==='ally'?state.enemies.filter(e=>(e.alive&&!e.transparent)):state.units;
      let target=null,nearest=Infinity;
      for(const candidate of pool){const t=segmentCircleHit(from,bullet,candidate,candidate.r+5);if(t!==null&&t<nearest){target=candidate;nearest=t;}}
      if(target){
        const hit={x:from.x+(bullet.x-from.x)*nearest,y:from.y+(bullet.y-from.y)*nearest,radius:5};
        if(effect.side==='ally')damageEnemy(target,effect.damage,true,{charge:.35,hit});
        else damageTeam(effect.damage,target.x,target.y,target);
        burst(hit.x,hit.y,effect.color,3,60);
      }else if(bullet.life>0&&bullet.x>=FIELD.left&&bullet.x<=FIELD.right&&bullet.y>=FIELD.top&&bullet.y<=FIELD.bottom)remaining.push(bullet);
      if(state.phase==='gameover')return false;
    }
    effect.bullets=remaining;
    return effect.emitted<effect.volleys||remaining.length>0;
  }

  function traceReflectedBeam(source, direction, bounces) {
    const length=Math.hypot(direction.x,direction.y)||1;
    let dx=direction.x/length,dy=direction.y/length;
    if(Math.abs(dx)+Math.abs(dy)<.001){dx=0;dy=-1;}
    let from={x:clamp(source.x,FIELD.left,FIELD.right),y:clamp(source.y,FIELD.top,FIELD.bottom)};
    const segments=[];
    for(let i=0;i<=bounces;i++){
      const to=rayEnd(from.x,from.y,dx,dy);segments.push({from:{...from},to});
      if(i===bounces)break;
      if(Math.abs(to.x-FIELD.left)<.01||Math.abs(to.x-FIELD.right)<.01)dx=-dx;
      if(Math.abs(to.y-FIELD.top)<.01||Math.abs(to.y-FIELD.bottom)<.01)dy=-dy;
      from={x:clamp(to.x+dx*.001,FIELD.left,FIELD.right),y:clamp(to.y+dy*.001,FIELD.top,FIELD.bottom)};
    }
    return segments;
  }
  function spawnReflect(source, carrier, o, cross=false) {
    const directions=cross?[{x:1,y:1},{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1}]:[{x:carrier.vx,y:carrier.vy}];
    const segments=directions.flatMap(d=>{
      let start=.08;
      return traceReflectedBeam(source,d,o.bounces).map(seg=>{const duration=Math.max(.08,distance(seg.from,seg.to)/1400);const part={...seg,start,duration,progress:0,hitIds:new Set()};start+=duration;return part;});
    });
    queueEffect({type:'reflectBeam',side:o.side||'ally',segments,width:cross?32:40,damage:o.damage,color:o.color||source.color,elapsed:0,life:Math.max(...segments.map(s=>s.start+s.duration))+.45,fired:false,age:0});
  }
  function damageAlongSegment(from,to,width,damage,charge=1) {
    for(const enemy of state.enemies){
      if((enemy.alive&&!enemy.transparent)&&segmentDistance(enemy,from,to)<=enemyCollisionRadius(enemy)+width/2)
        damageEnemy(enemy,damage,true,{charge,hit:{from,to,radius:width/2}});
    }
  }
  function updateReflect(effect,dt){
    effect.elapsed+=dt;effect.fired=effect.elapsed>=.08;
    for(const seg of effect.segments){
      seg.progress=clamp((effect.elapsed-seg.start)/seg.duration,0,1);
      if(seg.progress<=0)continue;
      const dx=seg.to.x-seg.from.x,dy=seg.to.y-seg.from.y,len2=dx*dx+dy*dy;
      for(const enemy of effect.side==='enemy'?state.units:state.enemies){
        if((effect.side!=='enemy'&&!(enemy.alive&&!enemy.transparent))||seg.hitIds.has(enemy.id))continue;
        const along=clamp(((enemy.x-seg.from.x)*dx+(enemy.y-seg.from.y)*dy)/(len2||1),0,1);
        if(along<=seg.progress&&segmentDistance(enemy,seg.from,seg.to)<=(effect.side==='enemy'?enemy.r:enemyCollisionRadius(enemy))+effect.width/2){
          seg.hitIds.add(enemy.id);if(effect.side==='enemy'){damageTeam(effect.damage,enemy.x,enemy.y,enemy);if(state.phase==='gameover')return false;}else damageEnemy(enemy,effect.damage,true,{charge:.65,hit:{from:seg.from,to:seg.to,radius:effect.width/2}});
        }
      }
    }
    return effect.elapsed<effect.life;
  }
  function updatePlasma(effect,dt){
    if(state.phase!=='moving'||state.unitStopped)return false;
    effect.wait-=dt;
    if(effect.wait<=0){effect.wait+=.12;damageAlongSegment(effect.source,effect.carrier,effect.width,effect.damage,.45);}
    return true;
  }
  function updateEnergyBall(effect,dt){
    const from={x:effect.x,y:effect.y};effect.x+=effect.vx*dt;effect.y+=effect.vy*dt;effect.life-=dt;
    let nearest=Infinity,target=null;
    for(const enemy of state.enemies){if(!(enemy.alive&&!enemy.transparent))continue;const t=segmentCircleHit(from,effect,enemy,enemyCollisionRadius(enemy)+effect.r);if(t!==null&&t<nearest){target=enemy;nearest=t;}}
    if(target){
      effect.x=from.x+(effect.x-from.x)*nearest;effect.y=from.y+(effect.y-from.y)*nearest;
      const entries=state.enemies.filter(e=>(e.alive&&!e.transparent)).map(e=>({target:e,hits:clamp(Math.ceil((1-Math.max(0,distance(e,effect)-enemyCollisionRadius(e))/effect.radius)*effect.maxHits),0,effect.maxHits)})).filter(e=>e.hits>0);
      Object.assign(effect,{type:'explosion',entries,tick:0,maxTick:Math.max(1,...entries.map(e=>e.hits)),wait:0,interval:.09,pulse:1,age:0});
      burst(effect.x,effect.y,effect.color,45,280);state.shake=Math.max(state.shake,7);return true;
    }
    effect.trail.push({x:effect.x,y:effect.y});if(effect.trail.length>12)effect.trail.shift();
    return effect.life>0&&effect.x>=FIELD.left&&effect.x<=FIELD.right&&effect.y>=FIELD.top&&effect.y<=FIELD.bottom;
  }

  const EXPANSION_COMBOS=['slash','involute','satellites','discharge'];
  function spawnExpansionFriendship(ally,f,carrier,damage){
    if(!EXPANSION_COMBOS.includes(f.kind))return false;
    const e={type:f.kind,side:'ally',x:ally.x,y:ally.y,damage,color:ally.color,age:0};
    if(f.kind==='slash')Object.assign(e,{emitted:0,wait:0,cuts:[],range:180,count:12});
    if(f.kind==='involute')e.balls=Array.from({length:f.count??6},(_,i)=>({arm:i*TAU/(f.count??6),x:ally.x,y:ally.y,trail:[],hits:new Map()}));
    if(f.kind==='satellites')Object.assign(e,{carrier,lastCarrier:{x:carrier.x,y:carrier.y},balls:Array.from({length:Math.max(1,Math.min(32,f.count??6))},(_,i)=>({arm:i*TAU/(f.count??6),x:carrier.x+Math.cos(i*TAU/(f.count??6))*62,y:carrier.y+Math.sin(i*TAU/(f.count??6))*62,trail:[],hits:new Map()}))});
    if(f.kind==='discharge')Object.assign(e,{from:{x:ally.x,y:ally.y},visited:new Set(),wait:0,segments:[],finished:false});
    queueEffect(e);tone(750,.12,'triangle',.025);return true;
  }
  function expansionBallHit(e,b,from,to,now){
    for(const enemy of state.enemies){
      if(!(enemy.alive&&!enemy.transparent)||now-(b.hits.get(enemy.id)??-100)<.18||segmentDistance(enemy,from,to)>enemyCollisionRadius(enemy)+9)continue;
      b.hits.set(enemy.id,now);damageEnemy(enemy,e.damage,true,{charge:.45,hit:{from,to,radius:9}});
    }
  }
  function updateExpansionFriendship(e,dt){
    if(e.type==='slash'){
      e.cuts=e.cuts.filter(c=>(c.life-=dt)>0);e.wait-=dt;
      while(e.wait<=0&&e.emitted<e.count){
        const target=livingEnemiesByDistance(e).find(t=>distance(t,e)<=e.range+enemyCollisionRadius(t));if(!target){e.emitted=e.count;break;}
        const a=Math.atan2(target.y-e.y,target.x-e.x)+Math.PI/2+(e.emitted%2?.55:-.55),dx=Math.cos(a)*58,dy=Math.sin(a)*58;
        const from={x:target.x-dx,y:target.y-dy},to={x:target.x+dx,y:target.y+dy};e.cuts.push({from,to,life:.19});e.emitted++;e.wait+=.075;
        for(const t of state.enemies)if((t.alive&&!t.transparent)&&segmentDistance(t,from,to)<enemyCollisionRadius(t)+6)damageEnemy(t,e.damage,true,{charge:.4,hit:{from,to,radius:6}});
      }
      return e.emitted<e.count||e.cuts.length>0;
    }
    if(e.type==='discharge'){
      e.segments=e.segments.filter(s=>(s.life-=dt)>0);e.wait-=dt;
      while(e.wait<=0&&!e.finished){
        const radius=e.visited.size?210:240,target=livingEnemiesByDistance(e.from).find(t=>!e.visited.has(t.id)&&distance(t,e.from)<=radius);
        if(!target||e.visited.size>=16){e.finished=true;break;}
        const to={x:target.x,y:target.y};e.segments.push({from:{...e.from},to,life:.25});e.visited.add(target.id);
        damageEnemy(target,e.damage,true,{charge:1,hit:{from:e.from,to,radius:7}});e.from=to;e.wait+=.085;
      }
      return !e.finished||e.segments.length>0;
    }
    if(e.type==='satellites'&&(state.phase!=='moving'||state.unitStopped))return false;
    const steps=Math.max(1,Math.ceil(dt/.008));
    const jumped=e.type==='satellites'&&distance(e.carrier,e.lastCarrier)>150;
    for(let step=1;step<=steps;step++){
      const age=e.age-dt+dt*step/steps;
      for(const b of e.balls){
        const from={x:b.x,y:b.y};
        if(e.type==='involute'){
          const t=age*6.5,x=24*(Math.cos(t)+t*Math.sin(t)),y=24*(Math.sin(t)-t*Math.cos(t));
          b.x=e.x+x*Math.cos(b.arm)-y*Math.sin(b.arm);b.y=e.y+x*Math.sin(b.arm)+y*Math.cos(b.arm);
        }else{
          const progress=step/steps,cx=jumped?e.carrier.x:e.lastCarrier.x+(e.carrier.x-e.lastCarrier.x)*progress,cy=jumped?e.carrier.y:e.lastCarrier.y+(e.carrier.y-e.lastCarrier.y)*progress;
          b.x=cx+Math.cos(b.arm+age*6)*62;b.y=cy+Math.sin(b.arm+age*6)*62;
        }
        if(jumped){from.x=b.x;from.y=b.y;b.trail=[];}
        expansionBallHit(e,b,from,b,age);
        b.trail.push({x:b.x,y:b.y});if(b.trail.length>28)b.trail.shift();
      }
    }
    if(e.type==='satellites'){e.lastCarrier={x:e.carrier.x,y:e.carrier.y};return true;}
    return e.age<3.4;
  }
  function drawExpansionFriendship(e){
    ctx.save();ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.lineCap='round';
    if(e.type==='slash')for(const c of e.cuts){
      const mx=(c.from.x+c.to.x)/2,my=(c.from.y+c.to.y)/2,dx=c.to.x-c.from.x,dy=c.to.y-c.from.y,l=Math.hypot(dx,dy)||1;
      ctx.globalAlpha=c.life/.19;ctx.beginPath();ctx.moveTo(c.from.x,c.from.y);ctx.quadraticCurveTo(mx-dy/l*16,my+dx/l*16,c.to.x,c.to.y);ctx.quadraticCurveTo(mx+dy/l*4,my-dx/l*4,c.from.x,c.from.y);ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.stroke();
    }
    else if(e.type==='discharge')for(const s of e.segments){
      const dx=s.to.x-s.from.x,dy=s.to.y-s.from.y,l=Math.hypot(dx,dy)||1;ctx.globalAlpha=s.life/.25;ctx.lineWidth=5;ctx.shadowColor=e.color;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(s.from.x,s.from.y);
      for(let i=1;i<9;i++){const jitter=(i%2?1:-1)*9;ctx.lineTo(s.from.x+dx*i/9-dy/l*jitter,s.from.y+dy*i/9+dx/l*jitter);}ctx.lineTo(s.to.x,s.to.y);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#fff7d8';ctx.lineWidth=1.5;ctx.stroke();ctx.strokeStyle=e.color;
    }
    else for(const b of e.balls){
      ctx.strokeStyle=e.color;ctx.lineWidth=e.type==='satellites'?4:5;ctx.globalAlpha=.45;ctx.beginPath();b.trail.forEach((p,i)=>{if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();ctx.globalAlpha=1;ctx.shadowColor=e.color;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(b.x,b.y,8,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x-2,b.y-2,3,0,TAU);ctx.fill();ctx.fillStyle=e.color;
    }
    ctx.restore();
  }

  function spawnScramble(source,damage){
    const segments=[];
    for(let i=0;i<10;i++){
      const a=Math.floor(Math.random()*32)*TAU/32;let start=.08+i*.045;
      for(const seg of traceReflectedBeam(source,{x:Math.cos(a),y:Math.sin(a)},2)){
        const duration=Math.max(.08,distance(seg.from,seg.to)/1400);segments.push({...seg,start,duration,progress:0,hitIds:new Set()});start+=duration;
      }
    }
    queueEffect({type:'reflectBeam',side:'ally',segments,width:22,damage,color:source.color,elapsed:0,life:Math.max(...segments.map(s=>s.start+s.duration))+.45,fired:false,age:0});
  }
  function spawnWallProjectiles(source,carrier,f,damage){
    const base=Math.atan2(carrier.vy,carrier.vx),count=f.kind==='splitShot'?(f.count??5):3;
    const bullets=Array.from({length:count},(_,i)=>{const a=base+(i-(count-1)/2)*(f.kind==='splitShot'?.11:.28);return {x:source.x,y:source.y,vx:Math.cos(a)*740,vy:Math.sin(a)*740,generation:0,hitIds:new Set()};});
    queueEffect({type:f.kind,side:'ally',bullets,damage,color:source.color,radius:f.radius,maxHits:f.maxHits,life:5,age:0,splits:0});
  }
  function updateWallProjectiles(effect,dt){
    effect.life-=dt;const next=[];
    for(const bullet of effect.bullets){
      const speed=Math.hypot(bullet.vx,bullet.vy),steps=Math.max(1,Math.ceil(speed*dt/8));let ended=false;
      for(let i=0;i<steps;i++){
        const from={x:bullet.x,y:bullet.y},tx=bullet.vx>0?(FIELD.right-bullet.x)/bullet.vx:bullet.vx<0?(FIELD.left-bullet.x)/bullet.vx:Infinity,ty=bullet.vy>0?(FIELD.bottom-bullet.y)/bullet.vy:bullet.vy<0?(FIELD.top-bullet.y)/bullet.vy:Infinity;
        const travel=Math.max(0,Math.min(dt/steps,tx,ty));bullet.x+=bullet.vx*travel;bullet.y+=bullet.vy*travel;
        for(const enemy of state.enemies){if(!(enemy.alive&&!enemy.transparent)||bullet.hitIds.has(enemy.id))continue;if(segmentDistance(enemy,from,bullet)<=enemyCollisionRadius(enemy)+6){bullet.hitIds.add(enemy.id);damageEnemy(enemy,effect.damage,true,{charge:.25,hit:{from,to:bullet,radius:6}});}}
        if(tx<=dt/steps||ty<=dt/steps){
          if(effect.type==='trident'){spawnExplosion('ally',bullet,state.enemies.filter(e=>(e.alive&&!e.transparent)),{radius:effect.radius,maxHits:effect.maxHits,damage:effect.damage*2,color:effect.color});burst(bullet.x,bullet.y,effect.color,24,220);ended=true;break;}
          if(bullet.generation>=3){ended=true;break;}
          const hitX=tx<=ty+.00001,hitY=ty<=tx+.00001,rx=hitX?-bullet.vx:bullet.vx,ry=hitY?-bullet.vy:bullet.vy;
          const a=Math.atan2(ry,rx);
          for(const offset of [-.24,.24]){let vx=Math.cos(a+offset)*speed,vy=Math.sin(a+offset)*speed;if(hitX)vx=Math.abs(vx)*(bullet.x<(FIELD.left+FIELD.right)/2?1:-1);if(hitY)vy=Math.abs(vy)*(bullet.y<(FIELD.top+FIELD.bottom)/2?1:-1);next.push({x:clamp(bullet.x+Math.sign(vx)*.05,FIELD.left,FIELD.right),y:clamp(bullet.y+Math.sign(vy)*.05,FIELD.top,FIELD.bottom),vx,vy,generation:bullet.generation+1,hitIds:new Set()});}
          effect.splits++;ended=true;break;
        }
      }
      if(!ended)next.push(bullet);
    }
    effect.bullets=next;return effect.life>0&&next.length>0;
  }
  function spawnPiercing(side,source,o){
    const pool=side==='enemy'?state.units:state.enemies.filter(e=>(e.alive&&!e.transparent)),aims=[];
    if(o.weak){for(const e of pool)if(e.weakPoint){const w=weakPosition(e);for(let i=0;i<5;i++)aims.push({x:w.x,y:w.y,delay:i*.055});}if(!aims.length)for(let i=0;i<5;i++)aims.push({x:source.x,y:source.y-100,delay:i*.055});}
    else for(let i=0;i<o.count;i++){const p=pool[Math.floor(Math.random()*pool.length)]||{x:source.x,y:source.y-100};aims.push({x:p.x,y:p.y,delay:i*.055});}
    const bullets=aims.map(p=>{let dx=p.x-source.x,dy=p.y-source.y;if(Math.hypot(dx,dy)<.001)dy=-1;const m=Math.hypot(dx,dy);return{x:source.x,y:source.y,vx:dx/m*700,vy:dy/m*700,from:{x:source.x,y:source.y},to:rayEnd(source.x,source.y,dx/m,dy/m),delay:p.delay,life:2,hitIds:new Set()};});
    queueEffect({type:'pierce',side,bullets,damage:o.damage,color:o.color,age:0});
  }
  function updateNewCombo(e,dt){
    if(e.type==='pierce'){
      e.bullets=e.bullets.filter(b=>{if(b.delay>0){b.delay-=dt;return true;}const from={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        for(const target of e.side==='enemy'?state.units:state.enemies){if((e.side!=='enemy'&&!(target.alive&&!target.transparent))||b.hitIds.has(target.id))continue;const r=e.side==='enemy'?target.r:enemyCollisionRadius(target);if(segmentDistance(target,from,b)<=r+5){b.hitIds.add(target.id);if(e.side==='enemy'){damageTeam(e.damage,target.x,target.y,target);if(state.phase==='gameover')return false;}else damageEnemy(target,e.damage,true,{charge:.4,hit:{from:b.from,to:b.to,radius:5}});}}
        return b.life>0&&b.x>=FIELD.left-20&&b.x<=FIELD.right+20&&b.y>=FIELD.top-20&&b.y<=FIELD.bottom+20;});return e.bullets.length>0&&state.phase!=='gameover';
    }
    if(e.type==='roundBurst'){
      if(state.unitStopped||Math.hypot(e.carrier.vx,e.carrier.vy)<.01){spawnExplosion('ally',e,state.enemies.filter(t=>(t.alive&&!t.transparent)),{radius:e.radius,maxHits:e.maxHits,damage:e.damage,color:e.color});return false;}
      e.radius=Math.min(e.maxRadius,e.radius+65*dt);return true;
    }
    if(e.type==='dropBomb'){
      e.bombs=e.bombs.filter(b=>{if(b.delay>0){b.delay-=dt;return true;}b.elapsed+=dt;if(b.elapsed<.55)return true;spawnExplosion('ally',b,state.enemies.filter(t=>(t.alive&&!t.transparent)),{radius:e.radius,maxHits:e.maxHits,damage:e.damage,color:e.color});return false;});return e.bombs.length>0;
    }
    if(e.type==='eruption'){
      e.wait-=dt;if(e.wait<=0&&e.ticks<6){e.wait+=.15;e.ticks++;for(const target of state.enemies)if((target.alive&&!target.transparent)&&distance(target,e)<=e.radius+enemyCollisionRadius(target))damageEnemy(target,e.damage,true,{charge:.5,hit:{x:e.x,y:e.y,radius:e.radius}});}
      return e.age<1.65;
    }
    if(e.type==='thunder'){
      e.radius=Math.min(e.maxRadius,e.radius+780*dt);
      for(const target of state.enemies){if(!(target.alive&&!target.transparent)||e.hitIds.has(target.id))continue;const d=distance(target,e),a=Math.atan2(target.y-e.y,target.x-e.x),delta=Math.atan2(Math.sin(a-e.angle),Math.cos(a-e.angle));if(d>e.radius+enemyCollisionRadius(target)||Math.abs(delta)>Math.PI/3)continue;e.hitIds.add(target.id);damageEnemy(target,e.damage,true,{charge:.7,hit:{from:e,to:target,radius:8}});}
      return e.age<.95;
    }
    return false;
  }
  function chooseDroneTarget(e){
    // e.x / e.y は発動元の位置。再照準もドローン位置ではなく、この位置から遠い敵を優先する。
    e.target=livingEnemiesByDistance(e).reverse().find(t=>!e.visited.has(t.id));if(!e.target)return false;
    e.visited.add(e.target.id);e.phase='travel';e.travel=0;e.fired=0;e.wait=0;for(const d of e.drones){d.from={x:d.x,y:d.y};d.trail=[];}return true;
  }
  function updateAdvanced(e,dt){
    if(e.type==='vibration'){
      if(!e.targets){e.targets=state.units.filter(u=>distance(u,e)<=e.radius+u.r).map(u=>{const dx=u.x-e.x,dy=u.y-e.y,d=Math.hypot(dx,dy);damageTeam(e.damage,u.x,u.y,u);return{u,dx:d>.001?dx/d:0,dy:d>.001?dy/d:1};});if(state.phase==='gameover')return false;ring(e.x,e.y,e.color,e.radius,.5);}
      const progress=Math.min(1,e.age/.4),delta=progress-e.progress;e.progress=progress;
      for(const {u,dx,dy} of e.targets){const steps=Math.max(1,Math.ceil(e.push*delta/5));for(let i=0;i<steps;i++){const before={x:u.x,y:u.y};u.x=clamp(u.x+dx*e.push*delta/steps,FIELD.left+u.r,FIELD.right-u.r);u.y=clamp(u.y+dy*e.push*delta/steps,FIELD.top+u.r,FIELD.bottom-u.r);applyBlocks(u);if(state.enemies.some(t=>(t.alive&&!t.transparent)&&distance(t,u)<enemyCollisionRadius(t)+u.r)){u.x=before.x;u.y=before.y;break;}}u.vx=0;u.vy=0;}
      return e.age<.5;
    }
    if(e.type==='machinegun'||e.type==='saw'){
      const saw=e.type==='saw';e.wait-=dt;
      while(e.wait<=0&&e.emitted<e.count){const target=livingEnemiesByDistance(e)[0];if(!target){e.emitted=e.count;break;}const a=Math.atan2(target.y-e.y,target.x-e.x),speed=saw?250:1050;e.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:saw?3:1.5,hits:new Map()});e.emitted++;e.wait+=saw?.14:.035;}
      e.bullets=e.bullets.filter(b=>{const from={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let first=null,nearest=Infinity;
        for(const target of state.enemies){if(!(target.alive&&!target.transparent))continue;const at=segmentCircleHit(from,b,target,enemyCollisionRadius(target)+(saw?17:4));if(at===null)continue;if(saw){if(e.age-(b.hits.get(target.id)??-10)>=.08){b.hits.set(target.id,e.age);damageEnemy(target,e.damage,true,{charge:.2,hit:{from,to:b,radius:17}});}}else if(at<nearest){nearest=at;first=target;}}
        if(first){damageEnemy(first,e.damage,true,{charge:.2,hit:{x:from.x+(b.x-from.x)*nearest,y:from.y+(b.y-from.y)*nearest,radius:4}});return false;}
        return b.life>0&&b.x>=FIELD.left-20&&b.x<=FIELD.right+20&&b.y>=FIELD.top-20&&b.y<=FIELD.bottom+20;});return e.emitted<e.count||e.bullets.length>0;
    }
    if(e.type==='drones'){
      if(!e.target)return false;
      if(!(e.target.alive&&!e.target.transparent)&&e.phase==='travel'){if(e.stage>=1)return false;e.stage++;if(!chooseDroneTarget(e))return false;}
      if(e.phase==='travel'){
        e.travel=Math.min(1,e.travel+dt/DRONE_TRAVEL_DURATION);const t=e.travel,smooth=t*t*(3-2*t);
        e.drones.forEach((d,i)=>{const a=-Math.PI/2+i*TAU/e.count,end={x:clamp(e.target.x+Math.cos(a)*95,FIELD.left+12,FIELD.right-12),y:clamp(e.target.y+Math.sin(a)*95,FIELD.top+12,FIELD.bottom-12)};const swirl=Math.sin(Math.PI*t)*(60+18*i);d.x=d.from.x+(end.x-d.from.x)*smooth+Math.cos(a+t*TAU)*swirl;d.y=d.from.y+(end.y-d.from.y)*smooth+Math.sin(a+t*TAU)*swirl;d.trail.push({x:d.x,y:d.y});if(d.trail.length>9)d.trail.shift();});
        if(e.travel>=1){e.phase='shoot';e.aim={x:e.target.x,y:e.target.y};e.drones.forEach(d=>d.trail=[]);}return true;
      }
      e.wait-=dt;
      if(e.wait<=0&&e.fired<e.count*2){const d=e.drones[e.fired%e.count];e.fired++;e.wait+=e.shotInterval;d.shots++;const end=rayEnd(d.x,d.y,e.aim.x-d.x,e.aim.y-d.y);damageAlongSegment(d,end,16,e.damage,.35);state.beams.push({x1:d.x,y1:d.y,x2:end.x,y2:end.y,color:e.color,width:6,coreWidth:2,life:.24,max:.24});}
      if(e.fired>=e.count*2){if(e.stage>=1)return false;e.stage++;if(!chooseDroneTarget(e))return false;}
      return true;
    }
    if(e.type==='relation'){
      if(state.phase!=='moving'||state.unitStopped||!e.route.length)return false;
      let remaining=1100*dt,coincident=0;
      while(remaining>0){const dest=e.route[e.index],d=distance(e,dest);if(d<.001){e.index=(e.index+1)%e.route.length;e.hitIds.clear();if(++coincident>=e.route.length)break;continue;}coincident=0;const from={x:e.x,y:e.y},travel=Math.min(d,remaining);e.x+=(dest.x-e.x)/d*travel;e.y+=(dest.y-e.y)/d*travel;remaining-=travel;
        for(const target of state.enemies)if((target.alive&&!target.transparent)&&!e.hitIds.has(target.id)&&segmentDistance(target,from,e)<=enemyCollisionRadius(target)+14){e.hitIds.add(target.id);damageEnemy(target,e.damage,true,{charge:.7,hit:{from,to:e,radius:14}});}
        e.trail.push({x:e.x,y:e.y});if(e.trail.length>15)e.trail.shift();if(travel>=d){e.index=(e.index+1)%e.route.length;e.hitIds.clear();}
      }
      return true;
    }
    return false;
  }
  function updateEffects(dt) {
    if (!state.effects.length) return;
    const keep = [];
    const updating=state.effects;state.effects=[];
    for (const effect of updating) {
      let alive = true;
      effect.age += dt;
      withDamageOwner(effect.side==='ally'?state.units[effect.ownerId]:null,()=>{
      if(EXPANSION_COMBOS.includes(effect.type))alive=updateExpansionFriendship(effect,dt);
      else if (effect.type === 'wind') alive = updateWind(effect,dt);
      else if (effect.type === 'reflectBeam') alive = updateReflect(effect,dt);
      else if(['machinegun','saw','drones','relation','vibration'].includes(effect.type))alive=updateAdvanced(effect,dt);
      else if(['pierce','roundBurst','dropBomb','eruption','thunder'].includes(effect.type))alive=updateNewCombo(effect,dt);
      else if(effect.type==='splitShot'||effect.type==='trident')alive=updateWallProjectiles(effect,dt);
      else if (effect.type === 'plasma') alive = updatePlasma(effect,dt);
      else if (effect.type === 'energyBall') alive = updateEnergyBall(effect,dt);
      else if (effect.type === 'meteor') alive = updateMeteor(effect, dt);
      else if (effect.type === 'spread') alive = updateSpread(effect, dt);
      else if (effect.type === 'laser') alive = updateLaser(effect, dt);
      else if (effect.type === 'homing') alive = updateHoming(effect, dt);
      else if (effect.type === 'explosion') alive = updateExplosion(effect, dt);
      });
      if (state.phase === 'gameover') break;
      if (alive) keep.push(effect);
    }
    if (state.phase !== 'gameover') state.effects = keep.concat(state.effects);
  }

  function updateLaser(effect, dt) {
    effect.flash = Math.max(0, effect.flash - dt * 5);
    if (effect.hitsLeft <= 0) return effect.flash > 0;
    effect.wait -= dt;
    if (effect.wait > 0) return true;
    effect.wait += effect.interval;
    effect.hitsLeft--;
    effect.flash = 1;
    state.shake = Math.max(state.shake, 1.5);
    tone(880 - effect.hitsLeft * 90, 0.09, 'sawtooth', 0.02, 0, 420);
    const reach = effect.width * 0.5;
    if (effect.side === 'ally') {
      state.enemies.forEach(enemy => {
        if ((enemy.alive&&!enemy.transparent) && distanceToRay(enemy.x, enemy.y, effect.x, effect.y, effect.dx, effect.dy) < enemy.r * 0.9 + reach) {
          damageEnemy(enemy, effect.damage, true, { charge: 1.5, hit: { from: effect, to: { x: effect.ex, y: effect.ey }, radius: reach } });
        }
      });
    } else {
      state.units.forEach(unit => {
        if (distanceToRay(unit.x, unit.y, effect.x, effect.y, effect.dx, effect.dy) < unit.r + reach) damageTeam(effect.damage, unit.x, unit.y);
      });
    }
    return true;
  }

  function updateHoming(effect, dt) {
    if (effect.delay > 0) { effect.delay -= dt; return true; }
    if (!effect.launched) {
      effect.launched = true;
      burst(effect.x, effect.y, effect.color, 3, 70);
      tone(560, 0.07, 'triangle', 0.02, 0, 900);
    }
    effect.life -= dt;
    if (effect.life <= 0) return false;
    if (effect.side === 'ally' && (!effect.target || !(effect.target.alive&&!effect.target.transparent))) {
      effect.target = livingEnemiesByDistance(effect)[0];
      if (!effect.target) return false;
    }
    const target = effect.target;
    const turnRate = 4 + effect.age * 7;
    const desired = Math.atan2(target.y - effect.y, target.x - effect.x);
    let diff = desired - effect.angle;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    effect.angle += clamp(diff, -turnRate * dt, turnRate * dt);
    const speed = effect.speed * (1 + Math.min(effect.age, 0.6) * 0.5);
    effect.x += Math.cos(effect.angle) * speed * dt;
    effect.y += Math.sin(effect.angle) * speed * dt;
    effect.trail.push({ x: effect.x, y: effect.y });
    if (effect.trail.length > 9) effect.trail.shift();
    if (Math.hypot(target.x - effect.x, target.y - effect.y) < target.r + 7) {
      if (effect.side === 'ally') damageEnemy(target, effect.damage, true, { charge: 1.5, hit: { x: effect.x, y: effect.y, radius: 7 } });
      else damageTeam(effect.damage, target.x, target.y);
      return false;
    }
    return true;
  }

  function updateExplosion(effect, dt) {
    effect.pulse = Math.max(0, effect.pulse - dt * 4);
    if (effect.tick >= effect.maxTick) return effect.pulse > 0;
    effect.wait -= dt;
    if (effect.wait > 0) return true;
    effect.wait += effect.interval;
    effect.tick++;
    if(effect.side==='ally'){if(!effect.induced)effect.induced=new Set();for(const ally of state.units)if(!effect.induced.has(ally.id)&&distance(ally,effect)<=effect.radius+ally.r){effect.induced.add(ally.id);friendshipBlast(ally);}}
    effect.pulse = 1;
    ring(effect.x, effect.y, effect.color, effect.radius, 0.5);
    burst(effect.x, effect.y, effect.color, 10, 190);
    state.shake = Math.max(state.shake, 3.5);
    tone(120 - effect.tick * 12, 0.2, 'sawtooth', 0.04, 0, 40);
    effect.entries.forEach(entry => {
      if (effect.tick > entry.hits) return;
      if (effect.side === 'ally') {
        if ((entry.target.alive&&!entry.target.transparent)) damageEnemy(entry.target, effect.damage, true, { charge: 1.2, hit: { x: effect.x, y: effect.y, radius: effect.radius } });
      } else damageTeam(effect.damage, entry.target.x, entry.target.y);
    });
    return true;
  }

  // 友情コンボ
  function friendshipBlast(ally,trigger=state.units[state.activeUnit]) {
    if(!state.friendshipCounts)state.friendshipCounts=new Map();
    const used=state.friendshipCounts.get(ally.id)||0;if(used>=(hasAbility(ally,'double')?2:1))return;
    state.friendshipCounts.set(ally.id,used+1);
    state.friendship.add(ally.id);
    chargeSkill(5);
    for(const f of [ally.friendship,ally.secondary].filter(Boolean))fireFriendship(ally,f,trigger);
  }
  function fireFriendship(ally,f,trigger=state.units[state.activeUnit],copied=false){
    return withDamageOwner(ally,()=>emitFriendship(ally,f,trigger,copied));
  }
  function emitFriendship(ally,f,trigger,copied){
    const kind = FRIENDSHIP_KINDS[f.kind];
    ring(ally.x, ally.y, ally.color, 105, 0.6);
    burst(ally.x, ally.y, ally.color, 20, 170);
    floatingText(ally.x, ally.y - (f===ally.secondary?62:43), (f===ally.secondary?'SUB / ':'')+kind.label, ally.color, f===ally.secondary?10:12);
    logAttack('ally', f.kind);
    if(f.kind==='copy'){if(!copied&&trigger.friendship.kind!=='copy')fireFriendship(ally,trigger.friendship,trigger,true);return;}
    if(f.kind==='speedUp'){if(!state.unitStopped&&state.phase==='moving'){const v=Math.hypot(trigger.vx,trigger.vy);if(v>.01){const boost=Math.max(v,Math.min(2800,Math.max(1100,v*1.55)));trigger.vx*=boost/v;trigger.vy*=boost/v;trigger.boostTime=Math.max(trigger.boostTime||0,.7);ring(trigger.x,trigger.y,ally.color,80,.5);}}return;}
    const targets = livingEnemiesByDistance(ally);
    if (!targets.length&&f.kind!=='weakPierce') return;
    const damage = f.power * (ally.atk / 1000) * (state.skillShot ? 1.7 : 1) * (ally.battleStyle === 'artillery' ? 2 : 1);
    const mover=trigger;
    const direction=Math.hypot(mover.vx,mover.vy)>.01?{vx:mover.vx,vy:mover.vy}:state.shotDirection||{vx:0,vy:-1};
    const carrier=mover;
    const aimed={...mover,...direction};
    if(spawnExpansionFriendship(ally,f,carrier,damage))return;
    if(f.kind==='machinegun'||f.kind==='saw')queueEffect({type:f.kind,side:'ally',x:ally.x,y:ally.y,count:f.count,emitted:0,wait:0,bullets:[],damage,color:ally.color,age:0});
    else if(f.kind==='drones'){
      const e={type:'drones',side:'ally',x:ally.x,y:ally.y,damage,color:ally.color,count:f.count,shotInterval:DRONE_BARRAGE_DURATION/(f.count*2-1),drones:Array.from({length:f.count},()=>({x:ally.x,y:ally.y,from:{x:ally.x,y:ally.y},shots:0,trail:[]})),stage:0,visited:new Set(),phase:'travel',travel:0,fired:0,wait:0,age:0};chooseDroneTarget(e);queueEffect(e);
    }
    else if(f.kind==='relation'){const route=state.units.filter(u=>u.id!==state.activeUnit);queueEffect({type:'relation',side:'ally',x:ally.x,y:ally.y,route,index:0,hitIds:new Set(),trail:[],damage,color:ally.color,age:0});}
    else if(f.kind==='pierce'||f.kind==='weakPierce')spawnPiercing('ally',ally,{count:f.count,damage,color:ally.color,weak:f.kind==='weakPierce'});
    else if(f.kind==='roundBurst')queueEffect({type:'roundBurst',side:'ally',x:ally.x,y:ally.y,carrier,maxRadius:f.radius,radius:45,maxHits:f.maxHits,damage,color:ally.color,age:0});
    else if(f.kind==='dropBomb')queueEffect({type:'dropBomb',side:'ally',x:ally.x,y:ally.y,bombs:Array.from({length:f.count},(_,i)=>({x:FIELD.left+25+Math.random()*(WIDTH-106),y:FIELD.top+25+Math.random()*(HEIGHT-106),delay:i*.07,elapsed:0})),radius:f.radius,maxHits:f.maxHits,damage,color:ally.color,age:0});
    else if(f.kind==='eruption'){const target=targets[Math.floor(Math.random()*targets.length)];queueEffect({type:'eruption',side:'ally',x:target.x,y:target.y,radius:f.radius,damage,color:ally.color,wait:.12,ticks:0,age:0});}
    else if(f.kind==='thunder')queueEffect({type:'thunder',side:'ally',x:ally.x,y:ally.y,angle:Math.atan2(aimed.vy,aimed.vx),radius:0,maxRadius:f.radius,damage,color:ally.color,hitIds:new Set(),age:0});
    else if(f.kind==='splitShot'||f.kind==='trident')spawnWallProjectiles(ally,aimed,f,damage);
    else if(f.kind==='scramble')spawnScramble(ally,damage);
    else if(f.kind==='reflectLaser'||f.kind==='reflectCross')spawnReflect(ally,aimed,{bounces:f.bounces,damage},f.kind==='reflectCross');
    else if(f.kind==='plasma')queueEffect({type:'plasma',side:'ally',source:ally,carrier,width:16,damage,color:ally.color,wait:0,age:0});
    else if(f.kind==='energyBall'){
      const magnitude=Math.hypot(aimed.vx,aimed.vy)||1;
      queueEffect({type:'energyBall',side:'ally',x:ally.x,y:ally.y,vx:aimed.vx/magnitude*820,vy:aimed.vy/magnitude*820,r:15,radius:f.radius,maxHits:f.maxHits,damage,color:ally.color,life:2,trail:[],age:0});
    }
    else if (f.kind === 'meteor') spawnMeteor('ally', ally, { count: f.count, damage, color: ally.color });
    else if (f.kind === 'spread') spawnSpread('ally', ally, { ways: f.ways, volleys: f.volleys, damage, color: ally.color });
    else if (f.kind === 'sniper') fireSniper(ally, targets.slice(0, f.count), damage, ally.color);
    else if (f.kind === 'laser') spawnLaser('ally', ally, targets[0], { hits: f.hits, damage, color: ally.color });
    else if (f.kind === 'homing') spawnHoming('ally', ally, targets, { count: f.count, damage, color: ally.color });
    else if (f.kind === 'explosion') spawnExplosion('ally', ally, targets, { radius: f.radius * (state.skillShot ? 1.2 : 1), maxHits: f.maxHits, damage, color: ally.color });
    tone(720, 0.2, 'sine', 0.035, 0, 1150);
  }

  // 敵の攻撃
  function enemyAttack(enemy, attack) {
    if (!(enemy.alive&&!enemy.transparent) || state.phase !== 'enemy') return;
    attack.remaining = attack.interval;
    const spec = { ...ENEMY_ATTACKS[attack.kind], ...attack };
    const base = enemy.boss ? 1150 : 370 + state.wave * 70;
    const damage = base * spec.mult;
    const target = state.units[state.activeUnit];
    const color = '#e88478';
    logAttack('enemy', attack.kind);
    floatingText(enemy.x, enemy.y - enemy.r - 26, FRIENDSHIP_KINDS[attack.kind].label, '#c65e55', 12);
    state.shake = Math.max(state.shake, enemy.boss ? 8 : 3);
    if(attack.kind==='revive')applyEnemyEffect({type:'revive',targets:spec.targets,hpRatio:spec.hpRatio},enemy);
    else if(attack.kind==='effect')for(const effect of spec.effects||[])applyEnemyEffect(effect,enemy);
    else if(attack.kind==='mines'||attack.kind==='photons')scatterPickups(attack.kind==='mines'?'mine':'photon',spec.count,spec.wall);
    else if(attack.kind==='plusLaser'||attack.kind==='crossLaser'){
      const offset=attack.kind==='crossLaser'?Math.PI/4:0;
      for(let i=0;i<4;i++){const angle=offset+i*Math.PI/2;spawnLaser('enemy',enemy,{x:enemy.x+Math.cos(angle),y:enemy.y+Math.sin(angle)},{hits:spec.hits,damage,color,width:36});}
    }    else if(attack.kind==='vibration')queueEffect({type:'vibration',side:'enemy',x:enemy.x,y:enemy.y,radius:spec.radius,push:spec.push,damage,color,age:0,targets:null,progress:0});
    else if(attack.kind==='reflectLaser')spawnReflect(enemy,{vx:target.x-enemy.x,vy:target.y-enemy.y},{bounces:spec.bounces,damage,side:'enemy',color});
    else if(attack.kind==='pierce')spawnPiercing('enemy',enemy,{count:spec.count,damage,color});
    else if (attack.kind === 'meteor') spawnMeteor('enemy', enemy, { count: spec.count, damage, color });
    else if (attack.kind === 'spread') spawnSpread('enemy', enemy, { ways: spec.ways, volleys: spec.volleys, damage, color });
    else if (attack.kind === 'sniper') {
      state.beams.push({ x1: enemy.x, y1: enemy.y, x2: target.x, y2: target.y, color, life: 0.4, max: 0.4 });
      damageTeam(damage, target.x, target.y);
    } else if (attack.kind === 'laser') {
      spawnLaser('enemy', enemy, target, { hits: spec.hits, damage, color, width: 40 });
    } else if (attack.kind === 'homing') {
      spawnHoming('enemy', enemy, state.units, { count: spec.count, damage, color, speed: 380 });
    } else if (attack.kind === 'explosion') {
      const center = state.units[Math.floor(Math.random() * state.units.length)];
      spawnExplosion('enemy', center, state.units, { radius: spec.radius, maxHits: spec.maxHits, damage, color });
    }
    updateUI();
  }
