'use strict';
// ギミック・衝突・移動・シミュレーション更新
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // SIMULATION
  // ---------------------------------------------------------------------------
  function setupArea(){
    const g=state.waves[state.wave].gimmicks||{};
    state.heartPanels=(g.hearts||[]).map((p,i)=>({...p,id:p.id||'heart-'+i}));
    state.swordPanelsUsed=new Set();state.swordBonus=0;state.powerSwitchActive=false;state.powerSwitchContacts=new Set();state.powerSwitches=(g.powerSwitches||[]).map((p,i)=>({...p,state:p.initial??i%3,locked:false}));state.slowWallContacts=new Map();
    for(const u of state.units)u.heartContacts=new Set();
    setupEnemyGimmicks();
    state.winds=(g.winds||[]).map(w=>({...w,remaining:w.countdown??1,active:false}));
    state.pickups=[...(g.mines||[]).map(p=>({...p,kind:'mine'})),...(g.photons||[]).map(p=>({...p,kind:'photon'}))];
    for(const u of state.units){if(hasAbility(u,'pm'))u.photons=4;u.boostTime=0;u.inGravity=false;u.blockGrace=new Set((g.blocks||[]).map((b,i)=>overlapsBlock(u,b)?i:-1).filter(i=>i>=0));}
  }
  // Wind devices pulse during the enemy turn, one device at a time.
  function beginWindTurn(){
    const devices=[];
    for(const w of state.winds||[]){if(--w.remaining<=0){w.remaining=w.interval??2;devices.push(w);}}
    if(devices.length)queueEffect({type:'wind',side:'enemy',devices,index:0,elapsed:0,targets:null,age:0});
  }
  function moveByWind(unit,dx,dy){
    const length=Math.hypot(dx,dy);if(length<.00001)return false;
    const from={x:unit.x,y:unit.y},to={x:clamp(unit.x+dx,FIELD.left+unit.r,FIELD.right-unit.r),y:clamp(unit.y+dy,FIELD.top+unit.r,FIELD.bottom-unit.r)};
    let fraction=1,blocked=to.x!==unit.x+dx||to.y!==unit.y+dy;
    for(const e of state.enemies){
      if(!e.alive||e.transparent)continue;const radius=enemyCollisionRadius(e)+unit.r;
      if(distance(from,e)<radius&&distance(to,e)>distance(from,e))continue; // Existing area-spawn overlap may be exited.
      const hit=segmentCircleHit(from,to,e,radius);
      if(hit!==null&&hit<=fraction){fraction=Math.max(0,hit-.01/length);blocked=true;}
    }
    if(!hasAbility(unit,'ab'))for(const b of state.waves[state.wave].gimmicks?.blocks||[]){
      if(overlapsBlock(unit,b))continue;
      const hit=rayBlock(from.x,from.y,to.x-from.x,to.y-from.y,b,unit.r);
      if(hit&&hit.t<=fraction){fraction=Math.max(0,hit.t-.01/length);blocked=true;}
    }
    unit.x=from.x+(to.x-from.x)*fraction;unit.y=from.y+(to.y-from.y)*fraction;
    unit.vx=0;unit.vy=0;
    applyDamageWalls(unit);
    applyHeartPanels(unit);
    return blocked;
  }
  function updateWind(effect,dt){
    const w=effect.devices[effect.index];if(!w)return false;
    if(!effect.targets){
      w.active=true;effect.elapsed=0;
      effect.targets=state.units.filter(u=>distance(u,w)<=w.radius).map(u=>{
        if(hasAbility(u,'antiWind')){floatingText(u.x,u.y-42,'ANTI WIND','#438f99',11);return null;}
        const dx=u.x-w.x,dy=u.y-w.y,d=Math.hypot(dx,dy),sign=w.mode==='pull'?-1:1;
        return {u,dx:(d>.001?dx/d:0)*sign,dy:(d>.001?dy/d:1)*sign,limit:w.mode==='pull'?Math.min(w.force??145,Math.max(0,d-30)):w.force??145,moved:0,stopped:false};
      }).filter(Boolean);
      ring(w.x,w.y,w.mode==='pull'?'#589bad':'#8a8ac6',w.radius,.75);
    }
    const duration=.75;effect.elapsed+=dt;
    for(const t of effect.targets){
      if(t.stopped)continue;let step=Math.min(t.limit-t.moved,t.limit*dt/duration);
      while(step>.00001){const d=Math.min(4,step);t.stopped=moveByWind(t.u,t.dx*d,t.dy*d);t.moved+=d;step-=d;if(t.stopped||state.phase==='gameover')break;}
      if(state.phase==='gameover'){w.active=false;return false;}
    }
    if(effect.elapsed>=duration){w.active=false;effect.targets=null;effect.index++;return effect.index<effect.devices.length;}
    return true;
  }
  function scatterPickups(kind,count,wall=false){
    for(let i=0;i<count&&state.pickups.length<(wall?48:32);i++)for(let attempt=0;attempt<40;attempt++){
      const p={x:65+Math.random()*490,y:85+Math.random()*540,kind};
      if(wall){const edge=Math.floor(Math.random()*4);if(edge<2){p.x=edge===0?58:562;p.y=75+Math.random()*580;}else{p.y=edge===2?60:680;p.x=75+Math.random()*470;}}
      if(state.enemies.some(e=>e.alive&&distance(e,p)<e.r+28)||state.pickups.some(q=>distance(p,q)<36)||state.units.some(u=>distance(u,p)<u.r+25))continue;
      state.pickups.push(p);ring(p.x,p.y,kind==='mine'?'#e56565':'#d3a128',35,.4);break;
    }
  }
  function consumePhoton(unit){
    if(!(unit.photons>0))return 1;
    const multiplier=currentPhotonMultiplier();unit.photons--;floatingText(unit.x,unit.y-48,'PHOTON ×'+multiplier,'#b88a16',14);return multiplier;
  }
  function overlapsBlock(u,b){return Math.hypot(u.x-clamp(u.x,b.x,b.x+b.w),u.y-clamp(u.y,b.y,b.y+b.h))<u.r;}
  function applyBlocks(unit){
    if(hasAbility(unit,'ab'))return;
    const blocks=state.waves[state.wave].gimmicks?.blocks||[];
    for(let i=0;i<blocks.length;i++){
      const b=blocks[i];if(unit.blockGrace?.has(i)){if(!overlapsBlock(unit,b))unit.blockGrace.delete(i);else continue;}
      const qx=clamp(unit.x,b.x,b.x+b.w),qy=clamp(unit.y,b.y,b.y+b.h),dx=unit.x-qx,dy=unit.y-qy,d=Math.hypot(dx,dy);if(d>=unit.r)continue;
      let nx,ny,push;
      if(d>.0001){nx=dx/d;ny=dy/d;push=unit.r-d+.05;}
      else {const faces=[{d:unit.x-b.x,nx:-1,ny:0},{d:b.x+b.w-unit.x,nx:1,ny:0},{d:unit.y-b.y, nx:0,ny:-1},{d:b.y+b.h-unit.y,nx:0,ny:1}].sort((a,b)=>a.d-b.d);({nx,ny}=faces[0]);push=faces[0].d+unit.r+.05;}
      unit.x+=nx*push;unit.y+=ny*push;const dot=unit.vx*nx+unit.vy*ny;if(dot<0){unit.vx-=2*dot*nx;unit.vy-=2*dot*ny;burst(unit.x,unit.y,'#8c9dab',3,45);}
    }
  }
  function rayBlock(x,y,vx,vy,b,r){
    const loX=b.x-r,hiX=b.x+b.w+r,loY=b.y-r,hiY=b.y+b.h+r;
    if(x>=loX&&x<=hiX&&y>=loY&&y<=hiY)return null;
    let near=-Infinity,far=Infinity,nx=0,ny=0;
    for(const [p,v,lo,hi,ax,ay] of [[x,vx,loX,hiX,1,0],[y,vy,loY,hiY,0,1]]){
      if(Math.abs(v)<1e-9){if(p<lo||p>hi)return null;continue;}
      const a=(lo-p)/v,c=(hi-p)/v,t=Math.min(a,c);if(t>near){near=t;nx=ax*(v>0?-1:1);ny=ay*(v>0?-1:1);}far=Math.min(far,Math.max(a,c));if(near>far)return null;
    }
    return near>=0&&far>=near?{t:near,nx,ny}:null;
  }
  // A panel heals once on entry; leaving it rearms that panel for this ally.
  function applyHeartPanels(unit){
    if(state.phase==='gameover'||state.phase==='victory')return;
    if(!unit.heartContacts)unit.heartContacts=new Set();
    for(const p of state.heartPanels||[]){
      const inside=Math.hypot(Math.max(0,Math.abs(unit.x-p.x)-p.r),Math.max(0,Math.abs(unit.y-p.y)-p.r))<=unit.r;
      if(!inside){unit.heartContacts.delete(p.id);continue;}
      if(unit.heartContacts.has(p.id))continue;
      unit.heartContacts.add(p.id);const healed=Math.min(200,state.maxHp-state.hp);state.hp+=healed;
      if(healed>0){floatingText(p.x,p.y-35,'HP +'+healed,'#cf628e',15);ring(p.x,p.y,'#e68cad',65,.4);}
    }
  }
  function applyGimmicks(unit,dt){
    applyHeartPanels(unit);
    applySwordPanels(unit);
    applyPowerSwitches(unit);
    unit.boostTime=Math.max(0,(unit.boostTime||0)-dt);
    const inGravity=!hasAbility(unit,'agb')&&state.enemies.some(e=>e.alive&&!e.transparent&&e.gravity&&distance(unit,e)<e.gravity+unit.r);
    if(inGravity){const drag=unit.inGravity?Math.exp(-2.8*dt):.48;unit.vx*=drag;unit.vy*=drag;if(!unit.inGravity)floatingText(unit.x,unit.y-40,'GRAVITY','#6574be',12);}
    unit.inGravity=inGravity;
    for(const p of state.pickups||[]){
      if(p.taken||distance(unit,p)>unit.r+12)continue;
      if(p.kind==='photon'&&unit.photons>=4)continue;
      p.taken=true;
      if(p.kind==='mine'&&hasAbility(unit,'ms')){ring(p.x,p.y,'#6ba6a0',35,.25);floatingText(p.x,p.y-25,'MINE CLEAR','#5a8f89',11);}
      else if(p.kind==='photon'){unit.photons=Math.min(4,(unit.photons||0)+1);ring(p.x,p.y,'#d3a128',45,.3);floatingText(p.x,p.y-25,'PHOTON '+unit.photons+'/4','#b88a16',12);}
      else {ring(p.x,p.y,'#e56565',85,.4);burst(p.x,p.y,'#e56565',20,180);damageTeam((p.damage||1000),unit.x,unit.y,unit);if(state.phase==='gameover')break;}
    }
    state.pickups=(state.pickups||[]).filter(p=>!p.taken);
    if(state.phase==='gameover')return;
    const g=state.waves[state.wave].gimmicks||{};
    state.warpCooldown=Math.max(0,(state.warpCooldown||0)-dt);
    if(!state.boostPanelsUsed)state.boostPanelsUsed=new Set();
    (g.boosts||[]).forEach((p,i)=>{if(Math.hypot(Math.max(0,Math.abs(unit.x-p.x)-p.r),Math.max(0,Math.abs(unit.y-p.y)-p.r))<=unit.r&&!state.boostPanelsUsed.has(i)){
      state.boostPanelsUsed.add(i);const speed=Math.hypot(unit.vx,unit.vy)||1;const boosted=Math.min(2200,Math.max(1200,speed*1.8));unit.vx*=boosted/speed;unit.vy*=boosted/speed;unit.boostTime=1.1;ring(p.x,p.y,'#35bf86',100,.5);burst(p.x,p.y,'#35bf86',18,240);floatingText(p.x,p.y-35,'BOOST '+Math.round(boosted),'#249a69',16);
    }});
    if(state.warpCooldown>0||hasAbility(unit,'aw'))return;
    for(const pair of g.warps||[]){
      for(const [entry,exit] of [[pair.a,pair.b],[pair.b,pair.a]]){
        if(distance(unit,entry)>pair.r)continue;
        const speed=Math.hypot(unit.vx,unit.vy)||1;
        unit.x=clamp(exit.x+unit.vx/speed*(pair.r+unit.r+4),FIELD.left+unit.r,FIELD.right-unit.r);
        unit.y=clamp(exit.y+unit.vy/speed*(pair.r+unit.r+4),FIELD.top+unit.r,FIELD.bottom-unit.r);
        state.warpCooldown=.4;state.trail=[];ring(entry.x,entry.y,'#9a75de',65,.4);ring(exit.x,exit.y,'#9a75de',65,.4);
        unit.spawnOverlaps=new Set(state.enemies.filter(e=>distance(unit,e)<unit.r+enemyCollisionRadius(e)).map(e=>e.id));return;
      }
    }
  }
  function applySwordPanels(unit){
    if(state.phase!=='moving'||unit!==state.units[state.activeUnit])return;
    state.swordPanelsUsed??=new Set();
    (state.waves[state.wave].gimmicks?.swords||[]).forEach((p,i)=>{
      if(state.swordPanelsUsed.has(i)||Math.hypot(Math.max(0,Math.abs(unit.x-p.x)-p.r),Math.max(0,Math.abs(unit.y-p.y)-p.r))>unit.r)return;
      state.swordPanelsUsed.add(i);state.swordBonus=(state.swordBonus||0)+1;
      floatingText(p.x,p.y-34,'ATK ×'+(1+state.swordBonus),'#bc8130',16);ring(p.x,p.y,'#e3ad50',65,.4);
    });
  }
  function applyPowerSwitches(unit){
    const switches=state.powerSwitches||[];if(!switches.length)return;
    state.powerSwitchContacts??=new Set();
    switches.forEach((p,i)=>{
      const inside=Math.hypot(Math.max(0,Math.abs(unit.x-p.x)-p.r),Math.max(0,Math.abs(unit.y-p.y)-p.r))<=unit.r,key=String(i);
      if(!inside){state.powerSwitchContacts.delete(key);return;}
      if(state.powerSwitchContacts.has(key)||p.locked||state.powerSwitchActive)return;
      state.powerSwitchContacts.add(key);p.state=(p.state+1)%3;
      ring(p.x,p.y,['#8f9aa4','#6ca8c1','#d5a647'][p.state],58,.35);floatingText(p.x,p.y-32,'SWITCH '+p.state,['#77818c','#478ba8','#aa7c2c'][p.state],14);
      if(switches.every(q=>q.state===2)){state.powerSwitchActive=true;for(const q of switches){q.state=2;q.locked=true;}const m=state.waves[state.wave].switchMultiplier??state.stage.switchMultiplier??10;floatingText(310,FIELD.top+45,'POWER SWITCH ×'+m,'#b78327',19);ring(310,330,'#dfb454',260,.75);}
    });
  }
  function resetPowerSwitches(){
    if(state.powerSwitchActive)for(const [i,p] of (state.powerSwitches||[]).entries()){p.state=p.initial??i%3;p.locked=false;}
    state.powerSwitchActive=false;state.powerSwitchContacts=new Set();
  }
  function applySlowWalls(unit){
    state.slowWallContacts??=new Map();
    for(const w of state.waves[state.wave].gimmicks?.slowWalls||[]){
      const vertical=['left','right'].includes(w.side),pos=vertical?unit.y:unit.x;
      const on=w.side==='left'?unit.x<=FIELD.left+unit.r+.01:w.side==='right'?unit.x>=FIELD.right-unit.r-.01:w.side==='top'?unit.y<=FIELD.top+unit.r+.01:unit.y>=FIELD.bottom-unit.r-.01;
      const key=unit.id+':'+w.side;
      if(!on||pos<w.start||pos>w.end){state.slowWallContacts.delete(key);continue;}
      if(hasAbility(unit,'asw')||state.slowWallContacts.has(key))continue;
      state.slowWallContacts.set(key,true);unit.vx*=w.retention??.35;unit.vy*=w.retention??.35;
      floatingText(unit.x,unit.y-38,'SLOW WALL','#478fcc',12);
    }
  }
  function applyDamageWalls(unit){
    if(hasAbility(unit,'adw'))return;
    const walls=state.waves[state.wave].gimmicks?.walls||[];
    if(!state.hazardContacts)state.hazardContacts={};
    for(const w of walls){
      const vertical=w.side==='left'||w.side==='right',position=vertical?unit.y:unit.x;
      const onWall=w.side==='left'?unit.x<=FIELD.left+unit.r+.01:w.side==='right'?unit.x>=FIELD.right-unit.r-.01:w.side==='top'?unit.y<=FIELD.top+unit.r+.01:unit.y>=FIELD.bottom-unit.r-.01;
      if(onWall&&position>=w.start&&position<=w.end&&state.clock-(state.hazardContacts[unit.id+':'+w.side]??-100)>.18){
        state.hazardContacts[unit.id+':'+w.side]=state.clock;damageTeam(w.damage,unit.x,unit.y,unit);if(state.phase==='gameover')return;
      }
    }
  }
  function enemyCollisionRadius(enemy) { return enemy.r * (enemy.shape === 'circle' ? 1 : enemy.sides === 3 ? .85 : .94); }

  function directHitDamage(unit){
    const speed=Math.hypot(unit.vx,unit.vy),baseDamage=390+Math.min(speed,1100)*.24;
    let styleMultiplier=unit.battleStyle==='balance'?1.2:1;
    if(unit.battleStyle==='power'&&!state.powerHitUsed){state.powerHitUsed=true;styleMultiplier=2;floatingText(unit.x,unit.y-38,'POWER ×2',unit.color,14);}
    const switchMultiplier=powerSwitchMultiplier();
    return baseDamage*(unit.atk/1000)*(state.skillShot?2.4:1)*styleMultiplier*(1+(state.swordBonus||0))*switchMultiplier*consumePhoton(unit);
  }
  function updatePhysics(dt) {
    const unit = state.units[state.activeUnit];
    state.moveTime += dt;
    const initialSpeed = Math.hypot(unit.vx, unit.vy);
    const steps = Math.max(1, Math.ceil(Math.max(initialSpeed * (unit.battleStyle === 'speed' && !state.speedBoostUsed ? 1.45 : 1), 3200) * dt / 7));
    const step = dt / steps;
    for (let i = 0; i < steps; i++) {
      unit.x += unit.vx * step;
      unit.y += unit.vy * step;
      applyGimmicks(unit,step);
      applyBlocks(unit);
      if(state.phase==='gameover')return;
      let wallHit = false;
      if (unit.x < FIELD.left + unit.r) { unit.x = FIELD.left + unit.r; unit.vx = Math.abs(unit.vx); wallHit = true; }
      if (unit.x > FIELD.right - unit.r) { unit.x = FIELD.right - unit.r; unit.vx = -Math.abs(unit.vx); wallHit = true; }
      if (unit.y < FIELD.top + unit.r) { unit.y = FIELD.top + unit.r; unit.vy = Math.abs(unit.vy); wallHit = true; }
      if (unit.y > FIELD.bottom - unit.r) { unit.y = FIELD.bottom - unit.r; unit.vy = -Math.abs(unit.vy); wallHit = true; }
      if (wallHit) {
        applyDamageWalls(unit);
    applyHeartPanels(unit);
        if(state.phase==='gameover')return;
        if (unit.battleStyle === 'speed' && !state.speedBoostUsed) {
          state.speedBoostUsed = true;
          const current = Math.hypot(unit.vx, unit.vy) || 1;
          const boosted = Math.max(850, current * 1.45);
          unit.vx *= boosted / current; unit.vy *= boosted / current;
          floatingText(unit.x, unit.y - 38, 'SPEED UP', unit.color, 14); ring(unit.x,unit.y,unit.color,75,.45);
        }
        burst(unit.x, unit.y, unit.color, 4, 65);
        tone(450, 0.04, 'sine', 0.017);
      }
      applySlowWalls(unit);
      for (const enemy of state.enemies) {
        if (!enemy.alive||enemy.transparent) continue;
        const dx = unit.x - enemy.x;
        const dy = unit.y - enemy.y;
        const separation = Math.hypot(dx, dy);
        const minSeparation = unit.r + enemyCollisionRadius(enemy);
        if (unit.spawnOverlaps?.has(enemy.id)) {
          if (separation >= minSeparation) unit.spawnOverlaps.delete(enemy.id);
          else continue;
        }
        if (separation >= minSeparation) {unit.enemyContacts?.delete(enemy.id);continue;}
        const hit={x:unit.x,y:unit.y,radius:unit.r};
        if(isPiercing(unit)){
          if(!unit.enemyContacts)unit.enemyContacts=new Map();
          let contact=unit.enemyContacts.get(enemy.id);
          if(!contact){
            const retention=contactRetention(unit,enemy);unit.vx*=retention;unit.vy*=retention;
            const amount=directHitDamage(unit);contact={amount,weak: hitsWeak(enemy,hit)};
            unit.enemyContacts.set(enemy.id,contact);
            damageEnemy(enemy,amount,false,{hit,owner:unit});
          }else if(!contact.weak&&hitsWeak(enemy,hit)){
            // Body contact and the later weak-point crossing total x3, without another slowdown/photon.
            contact.weak=true;damageEnemy(enemy,contact.amount,false,{hit,owner:unit,weakBonusOnly:true,charge:0});
          }
          continue;
        }
        const nx=separation>.001?dx/separation:0,ny=separation>.001?dy/separation:1;
        const dot=unit.vx*nx+unit.vy*ny;
        unit.x=enemy.x+nx*(minSeparation+.3);unit.y=enemy.y+ny*(minSeparation+.3);
        if(dot<0){
          const reflected=reflectVelocity(unit.vx,unit.vy,nx,ny),retention=contactRetention(unit,enemy);
          unit.vx=reflected.x*retention;unit.vy=reflected.y*retention;
          enemy.hitAt=state.clock;state.lastHitEnemyId=enemy.id;
          damageEnemy(enemy,directHitDamage(unit),false,{hit:{x:unit.x,y:unit.y,radius:unit.r},owner:unit});
          state.shake=Math.max(state.shake,state.skillShot?4:1.5);
        }
      }
      // 味方とは反射せず、重なった瞬間に友情コンボが発動する（貫通）
      for (const ally of state.units) {
        if (ally.id === unit.id) continue;
        if(!state.friendshipContacts)state.friendshipContacts=new Set();
        if(distance(unit,ally)<unit.r+ally.r){if(!state.friendshipContacts.has(ally.id)){state.friendshipContacts.add(ally.id);friendshipBlast(ally);if(hasAbility(unit,'heal')){if(!state.healedAllies)state.healedAllies=new Set();if(!state.healedAllies.has(ally.id)){state.healedAllies.add(ally.id);const heal=Math.min(300,state.maxHp-state.hp);state.hp+=heal;if(heal)floatingText(unit.x,unit.y-35,'HEAL +'+heal,'#35b981',13);}}}}else state.friendshipContacts.delete(ally.id);
      }
      unit.x = clamp(unit.x, FIELD.left + unit.r, FIELD.right - unit.r);
      unit.y = clamp(unit.y, FIELD.top + unit.r, FIELD.bottom - unit.r);
    }
    if(Math.hypot(unit.vx,unit.vy)>.01)state.shotDirection={vx:unit.vx,vy:unit.vy};
    const friction = Math.exp(-(unit.boostTime>0 ? 0.12 : state.skillShot ? 0.54 : 0.73) * dt);
    unit.vx *= friction;
    unit.vy *= friction;
    state.trail.push({ x: unit.x, y: unit.y, life: 0.25, max: 0.25 });
    if (Math.hypot(unit.vx, unit.vy) < 64 || state.moveTime > 6.8 || !state.enemies.some(enemy => enemy.alive)) {
      unit.vx = 0;
      unit.vy = 0;
      state.unitStopped = true;
    }
  }

  function update(dt) {
    if (state.paused) return;
    state.clock += dt;
    if(state.retreatGhost){state.retreatGhost.age+=dt;if(state.retreatGhost.age>=1.1)state.retreatGhost=null;}
    state.shake = Math.max(0, state.shake - dt * 22);
    state.skillFlash = Math.max(0, state.skillFlash - dt);
    state.comboTime = Math.max(0, state.comboTime - dt);
    if (state.notice) {
      state.notice.remaining -= dt;
      if (state.notice.remaining <= 0) state.notice = null;
    }
    for (const enemy of state.enemies) enemy.flash = Math.max(0, enemy.flash - dt);
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.exp(-2 * dt);
      particle.vy *= Math.exp(-2 * dt);
      particle.rotation += dt * 2;
    }
    for (const label of state.floats) { label.life -= dt; label.y -= 36 * dt; }
    for (const item of [...state.rings, ...state.beams, ...state.trail]) item.life -= dt;
    state.particles = state.particles.filter(item => item.life > 0);
    state.floats = state.floats.filter(item => item.life > 0);
    state.rings = state.rings.filter(item => item.life > 0);
    state.beams = state.beams.filter(item => item.life > 0);
    state.trail = state.trail.filter(item => item.life > 0);
    if (state.phase === 'moving') {
      if (!state.unitStopped) updatePhysics(dt);
      updateEffects(dt);
      // 友情コンボの演出（レーザー・ホーミング・爆発）が終わるまで次へ進まない
      if (state.unitStopped && (!state.effects.length || state.moveTime > 12)) {
        state.effects = [];
        finishShot();
      } else if (state.unitStopped) state.moveTime += dt;
    } else if (state.phase === 'enemy') {
      updateEffects(dt);
      if (!state.effects.length && state.phase === 'enemy') {
        state.phaseTimer -= dt;
        if (state.phaseTimer <= 0) {
          if (state.attackQueue.length) {
            const ready = state.attackQueue.splice(0);
            for (const { enemy, attack } of ready) { if (state.phase !== 'enemy') break; enemyAttack(enemy, attack); }
            for (const enemy of state.enemies) enemy.countdown = Math.min(...enemy.attacks.map(a => a.remaining));
            state.phaseTimer = 0.38;
          }
          else readyNextTurn();
        }
      }
    } else if (state.phase === 'wave') {
      state.phaseTimer -= dt;
      if (state.phaseTimer <= 0) enterWave();
    } else if (state.phase === 'victory' && state.phaseTimer > 0) {
      state.phaseTimer -= dt;
      if (state.phaseTimer <= 0) endGame(true);
    }
    uiAccumulator += dt;
    if (uiAccumulator > 0.1) { uiAccumulator = 0; updateUI(); }
  }
