'use strict';
// ギミック・衝突・移動・シミュレーション更新
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // SIMULATION
  // ---------------------------------------------------------------------------
  function superOnce(unit,id,action){
if(state.phase!=='moving'||state.unitStopped||unit!==state.units[state.activeUnit]||!hasAbility(unit,id))return;
unit.superUsed??=new Set();if(unit.superUsed.has(id))return;unit.superUsed.add(id);action();
}
function superAccelerate(unit){unit.vx*=1.5;unit.vy*=1.5;ring(unit.x,unit.y,'#56e8bb',85,.45);floatingText(unit.x,unit.y-45,'SUPER SPEED','#36ab89',13);}
  function setupArea(){
    for(const u of state.units){u.superWallAttack=0;u.superUsed=new Set();}
    const g=state.waves[state.wave].gimmicks||{};
    state.heartPanels=(g.hearts||[]).map((p,i)=>({...p,id:p.id||'heart-'+i}));
    state.heartFruits=[];state.heartFruitSeq=0;
    setupBarriers(g);state.laserGens=[];
    state.swordPanelsUsed=new Set();state.swordBonus=0;state.typePanelsUsed=new Set();state.touchedAllies=new Set();for(const u of state.units){const base=CHAR_BY_ID[u.charId]?.shotType;if(base)u.shotType=base;}state.powerSwitchActive=false;state.powerSwitchContacts=new Set();state.powerSwitches=(g.powerSwitches||[]).map((p,i)=>({...p,state:p.initial??i%3,locked:false}));state.slowWallContacts=new Map();
    for(const u of state.units)u.heartContacts=new Set();
    state.atkUp=1;state.firstTouchId=null;state.wallSides=new Set();for(const u of state.units)u.bubblyGift=false;
    state.swordBoost=1;state.swordToucher=null;state.transPanelsUsed=new Set();state.containerLeft=(g.containers||[]).map(c=>c.n);
    setupEnemyGimmicks();
    state.winds=(g.winds||[]).map(w=>({...w,remaining:w.countdown??1,active:false}));
    state.pickups=[...(g.mines||[]).map(p=>({...p,kind:'mine'})),...(g.photons||[]).map(p=>({...p,kind:'photon'}))];
    for(const u of state.units){if(hasAbility(u,'pm'))u.photons=4;u.boostTime=0;u.inGravity=false;u.blockGrace=new Set((g.blocks||[]).map((b,i)=>overlapsBlock(u,b)?i:-1).filter(i=>i>=0));u.containerGrace=new Set((g.containers||[]).map((c,i)=>overlapsBlock(u,containerRect(c))?i:-1).filter(i=>i>=0));}
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
    applyHeartFruits(unit);
    return blocked;
  }
  function updateWind(effect,dt){
    const w=effect.devices[effect.index];if(!w)return false;
    if(!effect.targets){
      w.active=true;effect.elapsed=0;
      effect.targets=state.units.filter(u=>distance(u,w)<=w.radius).map(u=>{
        if(hasAbility(u,'santiWind')){u.superWind=true;ring(u.x,u.y,'#65e8ce',65,.5);floatingText(u.x,u.y-58,'SPEED ×1.5','#36ab89',13);}if(hasAbility(u,'antiWind')){floatingText(u.x,u.y-42,'ANTI WIND','#438f99',11);return null;}
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
  // ブロック／コンテナの衝突：狙い線（rayBlock）と同じ「半径ぶん膨らませた四角形」で判定し、法線は常に面に垂直（角でも斜めに飛ばない）。
  // 侵入した面は、各軸で「面を越えてからの経過時間」が短い方（＝直前に越えた面）で決める。
  function boxNormal(unit,b){
    const r=unit.r,l=unit.x-(b.x-r),rt=(b.x+b.w+r)-unit.x,tp=unit.y-(b.y-r),bt=(b.y+b.h+r)-unit.y;
    if(l<=0||rt<=0||tp<=0||bt<=0)return null;
    const px=Math.min(l,rt),sx=l<rt?-1:1,py=Math.min(tp,bt),sy=tp<bt?-1:1;
    const ex=Math.abs(unit.vx)>1e-6?px/Math.abs(unit.vx):Infinity,ey=Math.abs(unit.vy)>1e-6?py/Math.abs(unit.vy):Infinity;
    const useX=ex===ey?px<=py:ex<ey;
    return useX?{nx:sx,ny:0,push:px+.05}:{nx:0,ny:sy,push:py+.05};
  }
  function overlapsBlock(u,b){return Math.hypot(u.x-clamp(u.x,b.x,b.x+b.w),u.y-clamp(u.y,b.y,b.y+b.h))<u.r;}
  function applyBlocks(unit){
    if(hasAbility(unit,'ab'))return;
    const blocks=state.waves[state.wave].gimmicks?.blocks||[];
    for(let i=0;i<blocks.length;i++){
      const b=blocks[i];if(unit.blockGrace?.has(i)){if(!overlapsBlock(unit,b))unit.blockGrace.delete(i);else continue;}
      const hit=boxNormal(unit,b);if(!hit)continue;const {nx,ny,push}=hit;
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
  // キャラ側のパネル系（撃種変化・透明・剣・加速・回復・パワースイッチ）の当たり判定：キャラの中心付近の小さな円だけがパネル（四角）に触れたとき反応する。
  // ブロック・壁・敵・フォトンコンテナとの当たり判定は従来どおりキャラ全体の大きさ。
  const PANEL_TOUCH_RATIO=.35;
  const panelTouch=(unit,p)=>Math.hypot(Math.max(0,Math.abs(unit.x-p.x)-p.r),Math.max(0,Math.abs(unit.y-p.y)-p.r))<=unit.r*PANEL_TOUCH_RATIO;
  function applyHeartPanels(unit){
    if(state.phase==='gameover'||state.phase==='victory')return;
    if(!unit.heartContacts)unit.heartContacts=new Set();
    for(const p of state.heartPanels||[]){
      const inside=panelTouch(unit,p);
      if(!inside){unit.heartContacts.delete(p.id);continue;}
      if(unit.heartContacts.has(p.id))continue;
      unit.heartContacts.add(p.id);const healed=Math.min(200,state.maxHp-state.hp);state.hp+=healed;
      if(healed>0){floatingText(p.x,p.y-35,'HP +'+healed,'#cf628e',15);ring(p.x,p.y,'#e68cad',65,.4);}
    }
  }
  // ---------------------------------------------------------------------------
  // HEART FRUIT — 自ターン終了時に上下左右いずれかの壁沿いへ出現。取らないと毎ターン lv.1→2→3 に成長。
  // ---------------------------------------------------------------------------
  function heartFruitChance(){
    const ratio=state.maxHp>0?state.hp/state.maxHp:1;
    for(const [limit,chance] of HEART_FRUIT.lowHpChances)if(ratio<=limit)return chance;
    return HEART_FRUIT.spawnChance;
  }
  // 壁に接する位置（side と壁沿いの座標 along から中心を求める。成長で半径が変わっても壁に接したまま）
  function heartFruitPlace(f){
    const r=HEART_FRUIT.radius[f.level-1];f.r=r;
    if(f.side==='left'){f.x=FIELD.left+r;f.y=f.along;}
    else if(f.side==='right'){f.x=FIELD.right-r;f.y=f.along;}
    else if(f.side==='top'){f.x=f.along;f.y=FIELD.top+r;}
    else{f.x=f.along;f.y=FIELD.bottom-r;}
  }
  function spawnHeartFruit(){
    if(heartFruitDisabled())return null;
    const fruits=state.heartFruits;
    if(fruits.length>=HEART_FRUIT.maxCount)return null;
    const m=HEART_FRUIT.wallMargin,sides=['top','bottom','left','right'];
    for(let attempt=0;attempt<20;attempt++){
      const side=sides[Math.floor(Math.random()*sides.length)],horizontal=side==='top'||side==='bottom';
      const lo=(horizontal?FIELD.left:FIELD.top)+m,hi=(horizontal?FIELD.right:FIELD.bottom)-m;
      const f={id:++state.heartFruitSeq,level:1,side,along:lo+Math.random()*(hi-lo)};
      heartFruitPlace(f);
      // 他のハートフルーツ・味方と重ならない位置だけ採用
      if(fruits.some(o=>distance(o,f)<o.r+f.r+16))continue;
      if(state.units.some(u=>distance(u,f)<u.r+f.r+6))continue;
      fruits.push(f);
      ring(f.x,f.y,'#ef8fb0',55,.6);burst(f.x,f.y,'#f2a3bf',8,90);
      floatingText(f.x+(f.side==='left'?34:f.side==='right'?-34:0),f.y+(f.side==='top'?36:f.side==='bottom'?-36:-30),'HEART FRUIT','#cf628e',12);
      return f;
    }
    return null;
  }
  function growHeartFruits(){
    for(const f of state.heartFruits){
      if(f.level>=HEART_FRUIT.heal.length)continue;
      f.level++;heartFruitPlace(f);
      ring(f.x,f.y,f.level>=3?'#e6b422':'#ef8fb0',60,.55);burst(f.x,f.y,f.level>=3?'#f0cf5c':'#f2a3bf',8,100);
      floatingText(f.x+(f.side==='left'?30:f.side==='right'?-30:0),f.y+(f.side==='top'?32:f.side==='bottom'?-32:-28),'Lv.'+f.level,'#cf628e',13);
    }
  }
  // 自ターン終了時：既存のハートフルーツを成長させてから、生成を抽選する（今回生成した実は成長しない）。
  function endOfTurnHeartFruits(){
    if(heartFruitDisabled())return;
    if(!state.heartFruits)state.heartFruits=[];
    const roll=Math.random(); // 抽選は成長演出より先に引く（演出の乱数に左右されない）
    growHeartFruits();
    if(state.heartFruits.length<HEART_FRUIT.maxCount&&roll<heartFruitChance())spawnHeartFruit();
  }
  function applyHeartFruits(unit){
    if(state.phase==='gameover'||state.phase==='victory'||!state.heartFruits?.length)return;
    for(const f of state.heartFruits.slice()){
      if(distance(unit,f)>unit.r+f.r)continue;
      state.heartFruits.splice(state.heartFruits.indexOf(f),1);
      const healed=Math.min(HEART_FRUIT.heal[f.level-1],Math.max(0,state.maxHp-state.hp));state.hp+=healed;
      floatingText(f.x+(f.side==='left'?34:f.side==='right'?-34:0),f.y+(f.side==='top'?40:f.side==='bottom'?-40:-34),healed>0?'HP +'+fmt(healed):'HP MAX','#cf628e',17);
      ring(f.x,f.y,'#ef8fb0',80,.5);burst(f.x,f.y,f.level>=3?'#f0cf5c':'#f2a3bf',14,150);
      tone(660,.12,'sine',.035,0,880);tone(880,.16,'sine',.03,.08,1100);
    }
  }
  function activeLineColor(lines){
    return state.waveTurn%2===0 && lines.some(line=>line.color==='gold') ? 'gold' : 'silver';
  }
  function applyDamageLines(unit){
    const lines=state.waves[state.wave].gimmicks?.damageLines;
    if(!lines?.length || hasAbility(unit,'adl'))return;
    const color=activeLineColor(lines);
    unit.lineContacts??=new Set();
    for(const line of lines){
      const touching=line.color===color && segmentDistance(unit,line.a,line.b)<=unit.r+3;
      if(!touching){unit.lineContacts.delete(line);continue;}
      if(unit.lineContacts.has(line))continue;
      unit.lineContacts.add(line);
      damageTeam(line.damage??1000,unit.x,unit.y,unit);
      if(state.phase==='gameover')return;
    }
  }
  function applyGimmicks(unit,dt){
    applyDamageLines(unit);
    if(state.phase==='gameover')return;
    applyHeartPanels(unit);
    applyHeartFruits(unit);
    applySwordPanels(unit);
    applyTypePanels(unit);
    applyTransPanels(unit);
    applyPowerSwitches(unit);
    unit.boostTime=Math.max(0,(unit.boostTime||0)-dt);
    if(state.enemies.some(e=>e.alive&&!e.transparent&&e.gravity&&distance(unit,e)<e.gravity+unit.r))superOnce(unit,'sagb',()=>superAccelerate(unit));
    const inGravity=!hasAbility(unit,'agb')&&state.enemies.some(e=>e.alive&&!e.transparent&&e.gravity&&distance(unit,e)<e.gravity+unit.r);
    if(inGravity){const drag=unit.inGravity?Math.exp(-2.8*dt):.48;unit.vx*=drag;unit.vy*=drag;if(!unit.inGravity)floatingText(unit.x,unit.y-40,'GRAVITY','#6574be',12);}
    unit.inGravity=inGravity;
    for(const p of state.pickups||[]){
      if(p.taken||distance(unit,p)>unit.r+12)continue;
      if(p.kind==='photon'&&unit.photons>=4)continue;
      p.taken=true;
      if(p.kind==='mine'&&hasAbility(unit,'ms')){if(hasAbility(unit,'sms')){ring(p.x,p.y,'#ffb94f',150,.5);burst(p.x,p.y,'#ffb94f',24,190);for(const enemy of state.enemies)if(enemy.alive&&distance(p,enemy)<=150+enemy.r)damageEnemy(enemy,effectiveAttack(unit),true,{owner:unit,hit:{x:p.x,y:p.y,radius:150}});}ring(p.x,p.y,'#6ba6a0',35,.25);floatingText(p.x,p.y-25,'MINE CLEAR','#5a8f89',11);}
      else if(p.kind==='photon'){unit.photons=Math.min(4,(unit.photons||0)+1);ring(p.x,p.y,'#d3a128',45,.3);floatingText(p.x,p.y-25,'PHOTON '+unit.photons+'/4','#b88a16',12);}
      else {ring(p.x,p.y,'#e56565',85,.4);burst(p.x,p.y,'#e56565',20,180);damageTeam((p.damage||1000),unit.x,unit.y,unit);if(state.phase==='gameover')break;}
    }
    state.pickups=(state.pickups||[]).filter(p=>!p.taken);
    if(state.phase==='gameover')return;
    const g=state.waves[state.wave].gimmicks||{};
    state.warpCooldown=Math.max(0,(state.warpCooldown||0)-dt);
    if(!state.boostPanelsUsed)state.boostPanelsUsed=new Set();
    (g.boosts||[]).forEach((p,i)=>{if(panelTouch(unit,p)&&!state.boostPanelsUsed.has(i)){
      state.boostPanelsUsed.add(i);const speed=Math.hypot(unit.vx,unit.vy)||1;const boosted=speed*2;unit.vx*=2;unit.vy*=2;unit.boostTime=1.1;ring(p.x,p.y,'#35bf86',100,.5);burst(p.x,p.y,'#35bf86',18,240);floatingText(p.x,p.y-35,'BOOST '+Math.round(boosted),'#249a69',16);
    }});
    for(const pair of g.warps||[])if([pair.a,pair.b].some(p=>distance(unit,p)<=pair.r))superOnce(unit,'saw',()=>{const heal=Math.min(1500,state.maxHp-state.hp);state.hp+=heal;ring(unit.x,unit.y,'#45d99b',70,.5);floatingText(unit.x,unit.y-40,'HEAL +'+heal,'#35b981',14);});
    if(state.warpCooldown>0||hasAbility(unit,'aw'))return;
    for(const pair of g.warps||[]){
      for(const [entry,exit] of [[pair.a,pair.b],[pair.b,pair.a]]){
        if(distance(unit,entry)>pair.r)continue;
        const speed=Math.hypot(unit.vx,unit.vy)||1;
        unit.x=clamp(exit.x+unit.vx/speed*(pair.r+unit.r+4),FIELD.left+unit.r,FIELD.right-unit.r);
        unit.y=clamp(exit.y+unit.vy/speed*(pair.r+unit.r+4),FIELD.top+unit.r,FIELD.bottom-unit.r);
        state.warpCooldown=.4;state.trail=[];ring(entry.x,entry.y,'#9a75de',65,.4);ring(exit.x,exit.y,'#9a75de',65,.4);
        // 出口が敵（ボスなど）の内側だったら外へ押し出す。出現直後の「すり抜け猶予」は与えず、壁と敵の間に挟まって通常どおり衝突する。
        for(let k=0;k<4;k++){let moved=false;
          for(const e of state.enemies){if(!e.alive||e.transparent)continue;const info=contactEnemy(unit,e);if(info){unit.x+=info.nx*info.push;unit.y+=info.ny*info.push;moved=true;}}
          unit.x=clamp(unit.x,FIELD.left+unit.r,FIELD.right-unit.r);unit.y=clamp(unit.y,FIELD.top+unit.r,FIELD.bottom-unit.r);
          if(!moved)break;}
        unit.spawnOverlaps=new Set(state.enemies.filter(e=>e.alive&&!e.transparent&&enemyOverlaps(unit,e)).map(e=>e.id));return;
      }
    }
  }
  function applySwordPanels(unit){
    if(state.phase!=='moving'||unit!==state.units[state.activeUnit])return;
    state.swordPanelsUsed??=new Set();
    (state.waves[state.wave].gimmicks?.swords||[]).forEach((p,i)=>{
      if(state.swordPanelsUsed.has(i)||!panelTouch(unit,p))return;
      state.swordPanelsUsed.add(i);state.swordBonus=(state.swordBonus||0)+1;
      floatingText(p.x,p.y-34,'ATK ×'+(1+state.swordBonus),'#bc8130',16);ring(p.x,p.y,'#e3ad50',65,.4);
    });
  }
  // 撃種変化パネル：踏むと反射⇔貫通が入れ替わる。1ショットにつき各パネル1回まで（剣パネルと同じ）。次の手番開始時に元へ戻る。
  function applyTypePanels(unit){
    if(state.phase!=='moving'||unit!==state.units[state.activeUnit])return;
    state.typePanelsUsed??=new Set();
    (state.waves[state.wave].gimmicks?.typePanels||[]).forEach((p,i)=>{
      if(state.typePanelsUsed.has(i)||!panelTouch(unit,p))return;
      state.typePanelsUsed.add(i);
      unit.shotType=isPiercing(unit)?'reflect':'pierce';
      floatingText(p.x,p.y-36,'撃種変化 → '+(unit.shotType==='pierce'?'貫通':'反射'),'#3f5fae',15);ring(p.x,p.y,'#6f8fd0',70,.45);burst(p.x,p.y,'#e8985a',14,200);tone(620,.06,'sine',.02);
    });
  }
  // 透明パネル：踏むと全ての敵の透明／不透明が入れ替わる。各パネル1ショット1回（次の手番開始で使用済み表示を戻す）。透明状態そのものは持ち越す。
  function applyTransPanels(unit){
    if(state.phase!=='moving'||unit!==state.units[state.activeUnit])return;
    state.transPanelsUsed??=new Set();
    (state.waves[state.wave].gimmicks?.transPanels||[]).forEach((p,i)=>{
      if(state.transPanelsUsed.has(i)||!panelTouch(unit,p))return;
      state.transPanelsUsed.add(i);flipTransparency(p);
    });
  }
  // フォトンコンテナ：正方形の当たり判定を持つ固い箱。反射するたびにフォトンを1つ獲得（各キャラ最大4個）。
  // 獲得できる回数は箱の数字まで。フォトンが満タンの接触は回数を消費せず、回数は次の手番開始時（ターン終了時）に元へ戻る。
  const containerRect=c=>({x:c.x-c.r,y:c.y-c.r,w:c.r*2,h:c.r*2});
  function applyContainers(unit){
    const cs=state.waves[state.wave].gimmicks?.containers||[];if(!cs.length)return;
    state.containerLeft??=cs.map(c=>c.n);
    for(let i=0;i<cs.length;i++){
      const c=cs[i],b=containerRect(c);
      if(unit.containerGrace?.has(i)){if(!overlapsBlock(unit,b))unit.containerGrace.delete(i);else continue;}
      const hit=boxNormal(unit,b);if(!hit)continue;const {nx,ny,push}=hit;
      unit.x+=nx*push;unit.y+=ny*push;
      const dot=unit.vx*nx+unit.vy*ny;if(dot>=0)continue;
      unit.vx-=2*dot*nx;unit.vy-=2*dot*ny;burst(unit.x,unit.y,'#e8c14a',3,45);
      if((state.containerLeft[i]||0)>0&&(unit.photons||0)<4){
        unit.photons=(unit.photons||0)+1;state.containerLeft[i]--;
        floatingText(c.x,c.y-c.r-14,'PHOTON '+unit.photons+'/4','#b88a16',13);ring(c.x,c.y,'#d3a128',c.r+30,.35);tone(880,.05,'sine',.02,0,1180);
      }
    }
  }
  // ---------------------------------------------------------------------------
  // 結界（BARRIER）：ステージ上の四角い枠。外殻に当たり判定があり、触れると壁と同じく反射する。
  //   ・枠の外にいる味方は枠の中へ入れず、枠の中にいる味方は閉じ込められて内側の面で反射する。
  //   ・規定の回数（枠の数字）だけ触れると破壊され、そのショットのあいだは自由に通れる。
  //   ・結界と触れた回数は毎ターン（次の手番開始時）にリセットされ、元の姿へ戻る。
  //   ・友情の弾・爆風や敵の攻撃は結界を通過する。アンチブロックでも結界は通過できない。
  //   ・ショット開始時に外殻と重なっている味方は、完全に外へ出る（または中へ入る）まで外殻との衝突を保留する。
  // ---------------------------------------------------------------------------
  const BARRIER_COLOR='#2de0cf';
  function setupBarriers(g){state.barriers=(g.barriers||[]).map((b,i)=>({...b,id:i,left:b.n,broken:false,flash:0}));}
  function resetBarriers(){
    for(const b of state.barriers||[]){
      if(b.broken){ring(b.x+b.w/2,b.y+b.h/2,BARRIER_COLOR,Math.min(120,Math.max(b.w,b.h)/2+20),.5);}
      b.left=b.n;b.broken=false;b.flash=0;
    }
  }
  // 味方と結界の位置関係：'in'=完全に内側、'out'=完全に外側、'edge'=外殻をまたいでいる
  function barrierRelation(u,b){
    const r=u.r;
    if(u.x-r>b.x&&u.x+r<b.x+b.w&&u.y-r>b.y&&u.y+r<b.y+b.h)return 'in';
    return overlapsBlock(u,b)?'edge':'out';
  }
  function barrierTouch(b,unit){
    b.left--;b.flash=.22;
    ring(unit.x,unit.y,BARRIER_COLOR,46,.3);burst(unit.x,unit.y,'#5ff0dc',6,90);tone(520,.06,'sine',.02,0,700);
    if(b.left<=0){
      b.broken=true;const cx=b.x+b.w/2,cy=b.y+b.h/2;
      ring(cx,cy,BARRIER_COLOR,Math.min(160,Math.max(b.w,b.h)/2+30),.6);burst(cx,cy,'#7ff5e4',26,230);
      floatingText(cx,Math.max(FIELD.top+16,b.y+14),'BARRIER BREAK','#16a595',14);tone(330,.18,'triangle',.035,0,120);
      state.shake=Math.max(state.shake,3);
    }
  }
  function applyBarriers(unit){
    const list=state.barriers;if(!list?.length)return;
    if(!unit.barrierMode)unit.barrierMode=list.map(b=>barrierRelation(unit,b));
    for(let i=0;i<list.length;i++){
      const b=list[i];if(b.broken)continue;
      let mode=unit.barrierMode[i];
      if(mode==='edge'){const rel=barrierRelation(unit,b);if(rel==='edge')continue;unit.barrierMode[i]=mode=rel;}
      if(mode==='out'){
        const hit=boxNormal(unit,b);if(!hit)continue;
        unit.x+=hit.nx*hit.push;unit.y+=hit.ny*hit.push;
        const dot=unit.vx*hit.nx+unit.vy*hit.ny;if(dot>=0)continue;
        unit.vx-=2*dot*hit.nx;unit.vy-=2*dot*hit.ny;barrierTouch(b,unit);
      }else{
        const lo={x:b.x+unit.r,y:b.y+unit.r},hi={x:b.x+b.w-unit.r,y:b.y+b.h-unit.r};let touched=false;
        if(unit.x<lo.x){unit.x=lo.x;unit.vx=Math.abs(unit.vx);touched=true;}
        if(unit.x>hi.x){unit.x=hi.x;unit.vx=-Math.abs(unit.vx);touched=true;}
        if(unit.y<lo.y){unit.y=lo.y;unit.vy=Math.abs(unit.vy);touched=true;}
        if(unit.y>hi.y){unit.y=hi.y;unit.vy=-Math.abs(unit.vy);touched=true;}
        if(touched)barrierTouch(b,unit);
      }
    }
  }
  // ---------------------------------------------------------------------------
  // レーザージェネレーター（LASER GENERATOR）
  //   ・ステージの laserMultipliers または共通設定がある場合に有効（共通設定は指定ステージを除く）。上下左右の各辺で、手番キャラが最初に触れた壁に設置（辺ごとに1基）。
  //   ・手番キャラが停止すると、設置された全基が壁に垂直なレーザーを3回一斉に発射する。設置数がレベル（1〜4）。
  //   ・威力＝手番キャラの攻撃力×攻撃力アップ×ウォールブースト×ステージ倍率（レベル別）。キラー等の敵別倍率は命中時に適用し、フォトンは適用しない。
  //   ・設置は毎ショット。発射後（または次の手番開始時）に消える。
  // ---------------------------------------------------------------------------
  const laserStage=()=>!!(state.waves[state.wave].laserMultipliers||state.stage.laserMultipliers||commonLaserGeneratorActive());
  function laserMultipliers(){return state.waves[state.wave].laserMultipliers||state.stage.laserMultipliers||LASER_GENERATOR.defaultMultipliers;}
  function laserLevelInfo(level){const m=laserMultipliers(),i=Math.max(1,Math.min(4,level))-1;return {mult:m[Math.min(i,m.length-1)]??1,thickness:LASER_GENERATOR.thickness[i]};}
  function laserBeam(g){
    return {from:{x:g.x,y:g.y},to:{x:g.side==='left'?FIELD.right:g.side==='right'?FIELD.left:g.x,y:g.side==='top'?FIELD.bottom:g.side==='bottom'?FIELD.top:g.y}};
  }
  function placeLaserGen(side,unit){
    if(!laserStage()||state.laserGens.some(g=>g.side===side))return;
    const horizontal=side==='top'||side==='bottom';
    const along=horizontal?clamp(unit.x,FIELD.left+14,FIELD.right-14):clamp(unit.y,FIELD.top+14,FIELD.bottom-14);
    const g={side,x:side==='left'?FIELD.left:side==='right'?FIELD.right:along,y:side==='top'?FIELD.top:side==='bottom'?FIELD.bottom:along,color:unit.color};
    state.laserGens.push(g);
    const lv=state.laserGens.length,info=laserLevelInfo(lv);
    ring(g.x,g.y,'#f08a3c',62,.5);burst(g.x,g.y,'#f6b36a',10,140);
    floatingText(g.x+(side==='left'?64:side==='right'?-64:0),g.y+(side==='top'?40:side==='bottom'?-40:-4),'LASER GEN Lv.'+lv+' ×'+info.mult,'#d6702a',13);
    tone(420+lv*110,.1,'square',.022,0,720+lv*110);
  }
  function fireLaserGens(){
    const gens=state.laserGens||[];if(!gens.length)return;
    state.laserGens=[];
    if(!state.enemies.some(e=>e.alive))return;
    const unit=state.units[state.activeUnit],level=gens.length,info=laserLevelInfo(level);
    queueEffect({type:'laserGen',side:'ally',ownerId:unit.id,gens:gens.map(g=>({...g})),level,mult:info.mult,thickness:info.thickness,
      damage:Math.round(effectiveAttack(unit)*(state.atkUp||1)*wallBoostMultiplier(unit)*info.mult*LASER_GENERATOR.damagePerPower),color:unit.color,fired:0,wait:LASER_GENERATOR.chargeDelay,interval:LASER_GENERATOR.interval,flash:0});
    floatingText(310,FIELD.top+64,'LASER Lv.'+level+' ×'+info.mult+' ×'+LASER_GENERATOR.volleys,'#d6702a',17);
    tone(300,.35,'sawtooth',.03,0,900);
  }
  function applyPowerSwitches(unit){
    const switches=state.powerSwitches||[];if(!switches.length)return;
    state.powerSwitchContacts??=new Set();
    switches.forEach((p,i)=>{
      const inside=panelTouch(unit,p),key=String(i);
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
      superOnce(unit,'sasw',()=>superAccelerate(unit));
      if(hasAbility(unit,'asw')||state.slowWallContacts.has(key))continue;
      state.slowWallContacts.set(key,true);{const rr=bubblyRelax(unit,w.retention??.35);unit.vx*=rr;unit.vy*=rr;}
      floatingText(unit.x,unit.y-38,'SLOW WALL','#478fcc',12);
    }
  }
  function applyDamageWalls(unit){
    
    const walls=state.waves[state.wave].gimmicks?.walls||[];
    if(!state.hazardContacts)state.hazardContacts={};
    for(const w of walls){
      const vertical=w.side==='left'||w.side==='right',position=vertical?unit.y:unit.x;
      const onWall=w.side==='left'?unit.x<=FIELD.left+unit.r+.01:w.side==='right'?unit.x>=FIELD.right-unit.r-.01:w.side==='top'?unit.y<=FIELD.top+unit.r+.01:unit.y>=FIELD.bottom-unit.r-.01;
      if(onWall&&position>=w.start&&position<=w.end&&state.clock-(state.hazardContacts[unit.id+':'+w.side]??-100)>.18){
        superOnce(unit,'sadw',()=>{unit.superWallAttack=200;floatingText(unit.x,unit.y-45,'ATK +200','#ed8b39',14);});
        if(hasAbility(unit,'adw'))continue;
        state.hazardContacts[unit.id+':'+w.side]=state.clock;damageTeam(w.damage,unit.x,unit.y,unit);if(state.phase==='gameover')return;
      }
    }
  }
  // 円で近似する場面（風の遮蔽・円との交差判定）用の目安半径。判定の本体は enemyGap / contactEnemy。
  function enemyCollisionRadius(enemy) { return enemy.r * (enemy.shape === 'circle' ? 1 : enemy.sides === 3 ? .85 : enemyIsSquare(enemy) ? .85 : .94); }
  // ---- 敵の当たり判定：見た目どおりの外形（円／四角／多角形／十字など）で判定する ----
  // 外形の頂点（描画の enemyPath と同じ。揺れは無視）。円は null。
  function enemyOutline(enemy){
    if(enemy.shape==='circle')return null;
    const r=enemy.r;
    if(enemy.shape==='cruciform'){const a=.38;return [[-a,-1],[a,-1],[a,-a],[1,-a],[1,a],[a,a],[a,1],[-a,1],[-a,a],[-1,a],[-1,-a],[-a,-a]].map(([x,y])=>[x*r,y*r]);}
    if(enemy.shape==='starBattery')return Array.from({length:16},(_,i)=>{const ang=-Math.PI/2+i*TAU/16,k=i%2?.58:1;return [Math.cos(ang)*r*k,Math.sin(ang)*r*k];});
    const n=enemy.sides|0;if(n<3)return null;
    const rot=-Math.PI/2+(n===4?Math.PI/4:0);
    return Array.from({length:n},(_,i)=>[Math.cos(rot+i*TAU/n)*r,Math.sin(rot+i*TAU/n)*r]);
  }
  const enemyIsSquare=e=>e.shape!=='circle'&&e.shape!=='cruciform'&&e.shape!=='starBattery'&&e.sides===4;
  const enemyWorldPoly=e=>enemyOutline(e)?.map(([x,y])=>({x:e.x+x,y:e.y+y}));
  function nearestOnSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return {x:a.x+t*dx,y:a.y+t*dy};}
  function pointInPoly(p,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
  function segmentsCross(a,b,c,d){const o=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0;}
  // 線分(a,b)と敵の外形との距離。触れていれば0以下。円は「中心との距離−半径」。a===b なら点との距離。
  function enemyGap(enemy,a,b){
    const pts=enemyWorldPoly(enemy);
    if(!pts)return segmentDistance(enemy,a,b)-enemy.r;
    if(pointInPoly(a,pts)||pointInPoly(b,pts))return 0;
    let best=Infinity;
    for(let i=0;i<pts.length;i++){const c=pts[i],d=pts[(i+1)%pts.length];
      if(segmentsCross(a,b,c,d))return 0;
      best=Math.min(best,segmentDistance(a,c,d),segmentDistance(b,c,d),segmentDistance(c,a,b),segmentDistance(d,a,b));}
    return best;
  }
  // 手番キャラ（円）と敵の接触。接触していなければ null。接触なら押し出し法線(nx,ny)と押し出し量(push)。
  //   円＝中心間距離／四角＝ブロックと同じ「半径ぶん膨らませた四角形」（面に垂直に反射）／それ以外の多角形＝外形との最近点。
  function contactEnemy(unit,enemy){
    const pts=enemyWorldPoly(enemy);
    if(!pts){
      const dx=unit.x-enemy.x,dy=unit.y-enemy.y,sep=Math.hypot(dx,dy),min=unit.r+enemy.r;if(sep>=min)return null;
      return {nx:sep>.001?dx/sep:0,ny:sep>.001?dy/sep:1,push:min-sep+.3};
    }
    if(enemyIsSquare(enemy)){const h=enemy.r*Math.SQRT1_2;return boxNormal(unit,{x:enemy.x-h,y:enemy.y-h,w:h*2,h:h*2});}
    let best=Infinity,bx=0,by=0;
    for(let i=0;i<pts.length;i++){const q=nearestOnSegment(unit,pts[i],pts[(i+1)%pts.length]),d2=(q.x-unit.x)**2+(q.y-unit.y)**2;if(d2<best){best=d2;bx=q.x;by=q.y;}}
    const d=Math.sqrt(best),inside=pointInPoly(unit,pts);if(!inside&&d>=unit.r)return null;
    if(inside){const L=d||1;return {nx:(bx-unit.x)/L,ny:(by-unit.y)/L,push:d+unit.r+.3};}
    return {nx:(unit.x-bx)/d,ny:(unit.y-by)/d,push:unit.r-d+.3};
  }
  const enemyOverlaps=(unit,enemy)=>contactEnemy(unit,enemy)!==null;


  // ウォールブースト：そのショットで触れた壁の面数（1〜4）に応じて直殴りのパワーが上がる。友情コンボには乗らない。
  const wallBoostMultiplier=unit=>hasAbility(unit,'wb')?(WALL_BOOST_TABLE[(state.wallSides?.size||0)-1]||1):1;
  // 敵への接触時：ファーストキラー用の「最初に触れた敵」の記録、ドレインの回復。
  function onEnemyTouch(unit,enemy){
    sakuraTouch(unit,enemy);
    if(state.firstTouchId==null&&!enemy.sword)state.firstTouchId=enemy.id;
    if(hasAbility(unit,'drain')){const heal=Math.min(DRAIN_HEAL,state.maxHp-state.hp);if(heal>0){state.hp+=heal;floatingText(unit.x,unit.y-35,'DRAIN +'+heal,'#2a9a56',14);}}
  }
  function directHitDamage(unit){
    const speed=Math.hypot(unit.vx,unit.vy),baseDamage=390+Math.min(speed,1100)*.24;
    let styleMultiplier=unit.battleStyle==='balance'?1.2:1;
    if(unit.battleStyle==='power'&&!state.powerHitUsed){state.powerHitUsed=true;styleMultiplier=2;floatingText(unit.x,unit.y-38,'POWER ×2',unit.color,14);}
    const switchMultiplier=powerSwitchMultiplier();
    return baseDamage*(effectiveAttack(unit)/1000)*(state.skillShot?2.4:1)*styleMultiplier*(1+(state.swordBonus||0))*(state.atkUp||1)*wallBoostMultiplier(unit)*switchMultiplier*consumePhoton(unit);
  }
  // キューブ状態：手番以外の味方は正方形の当たり判定を持つ（移動中の味方は反射し、友情は接触で発動）。
  function cubeActive(){return !!(state.waves[state.wave].cube??state.stage.cube??stageSettings.cube);}
  const cubeHalf=ally=>ally.r+3;
  function cubeOverlap(unit,ally){
    const h=cubeHalf(ally),cx=clamp(unit.x,ally.x-h,ally.x+h),cy=clamp(unit.y,ally.y-h,ally.y+h);
    return Math.hypot(unit.x-cx,unit.y-cy)<unit.r;
  }
  // キューブの反射：ブロックと同じ「半径ぶん膨らませた四角形」で判定し、法線は常に面に垂直（角でも斜めに飛ばない）。狙い線（predictTrajectory）とも一致。
  function cubeBounce(unit,ally){
    const h=cubeHalf(ally),hit=boxNormal(unit,{x:ally.x-h,y:ally.y-h,w:h*2,h:h*2});
    if(!hit)return;
    unit.x+=hit.nx*hit.push;unit.y+=hit.ny*hit.push;
    const dot=unit.vx*hit.nx+unit.vy*hit.ny;
    if(dot<0){const r=reflectVelocity(unit.vx,unit.vy,hit.nx,hit.ny);unit.vx=r.x*.92;unit.vy=r.y*.92;burst(unit.x,unit.y,ally.color,3,40);tone(520,.04,'sine',.015);}
  }
  const allyTouching=(unit,ally)=>cubeActive()?cubeOverlap(unit,ally):distance(unit,ally)<unit.r+ally.r;
  function touchAlly(unit,ally){
    state.touchedAllies??=new Set();
    if(state.touchedAllies.has(ally.id))return;
    state.touchedAllies.add(ally.id);
    if(touchPowerActive()){const m=touchPowerMultiplier();floatingText(unit.x,unit.y-52,'TOUCH ×'+m,'#2f6fd1',16);ring(unit.x,unit.y,'#5b8fe0',62,.45);}
  }
  function updatePhysics(dt) {
    const unit = state.units[state.activeUnit];
    state.moveTime += dt;
    const initialSpeed = Math.hypot(unit.vx, unit.vy);
    const steps = Math.max(1, Math.ceil(Math.max(initialSpeed * (unit.battleStyle === 'speed' && !state.speedBoostUsed ? 2 : 1), 3200) * dt / 7));
    const step = dt / steps;
    for (let i = 0; i < steps; i++) {
      unit.x += unit.vx * step;
      unit.y += unit.vy * step;
      applyGimmicks(unit,step);
      applyBlocks(unit);
      applyContainers(unit);
      applyBarriers(unit);
      if(state.phase==='gameover')return;
      let wallHit = false;const hitSides=[];
      if (unit.x < FIELD.left + unit.r) { unit.x = FIELD.left + unit.r; unit.vx = Math.abs(unit.vx); wallHit = true; hitSides.push('left'); }
      if (unit.x > FIELD.right - unit.r) { unit.x = FIELD.right - unit.r; unit.vx = -Math.abs(unit.vx); wallHit = true; hitSides.push('right'); }
      if (unit.y < FIELD.top + unit.r) { unit.y = FIELD.top + unit.r; unit.vy = Math.abs(unit.vy); wallHit = true; hitSides.push('top'); }
      if (unit.y > FIELD.bottom - unit.r) { unit.y = FIELD.bottom - unit.r; unit.vy = -Math.abs(unit.vy); wallHit = true; hitSides.push('bottom'); }
      if (wallHit) {
        state.wallSides??=new Set();const sidesBefore=state.wallSides.size;for(const sd of hitSides)state.wallSides.add(sd);
        if(hasAbility(unit,'wb')&&state.wallSides.size>sidesBefore)floatingText(unit.x,unit.y-52,'WALL ×'+WALL_BOOST_TABLE[state.wallSides.size-1],unit.color,14);
        noteWallTouch(unit);
        for(const side of hitSides)placeLaserGen(side,unit);
        applyDamageWalls(unit);
    applyHeartPanels(unit);
    applyHeartFruits(unit);
        if(state.phase==='gameover')return;
        if (unit.battleStyle === 'speed' && !state.speedBoostUsed) {
          state.speedBoostUsed = true;
          const current = Math.hypot(unit.vx, unit.vy) || 1;
          const boosted = current * 2;
          unit.vx *= boosted / current; unit.vy *= boosted / current;
          floatingText(unit.x, unit.y - 38, 'SPEED UP', unit.color, 14); ring(unit.x,unit.y,unit.color,75,.45);
        }
        burst(unit.x, unit.y, unit.color, 4, 65);
        tone(450, 0.04, 'sine', 0.017);
      }
      applySlowWalls(unit);
      for (const enemy of state.enemies) {
        if (!enemy.alive||enemy.transparent) continue;
        const info=contactEnemy(unit,enemy);
        if (unit.spawnOverlaps?.has(enemy.id)) {
          if (!info) unit.spawnOverlaps.delete(enemy.id);
          else continue;
        }
        if (!info) {unit.enemyContacts?.delete(enemy.id);continue;}
        const hit={x:unit.x,y:unit.y,radius:unit.r};
        if(isPiercing(unit)){
          if(!unit.enemyContacts)unit.enemyContacts=new Map();
          let contact=unit.enemyContacts.get(enemy.id);
          if(!contact){
            onEnemyTouch(unit,enemy);
            const retention=contactRetention(unit,enemy);unit.vx*=retention;unit.vy*=retention;
            if(enemy.sword){touchSwordEnemy(unit,enemy);unit.enemyContacts.set(enemy.id,{amount:0,weak:swordWeakHit(enemy,hit),sword:true});continue;}
            const amount=directHitDamage(unit);contact={amount,weak: hitsWeak(enemy,hit)};
            unit.enemyContacts.set(enemy.id,contact);
            damageEnemy(enemy,amount,false,{hit,owner:unit});
          }else if(!contact.weak&&hitsWeak(enemy,hit)){
            // Body contact and the later weak-point crossing total x3, without another slowdown/photon.
            contact.weak=true;if(contact.sword)swordWeakHit(enemy,hit);else damageEnemy(enemy,contact.amount,false,{hit,owner:unit,weakBonusOnly:true,charge:0});
          }
          continue;
        }
        const {nx,ny}=info,dot=unit.vx*nx+unit.vy*ny;
        unit.x+=nx*info.push;unit.y+=ny*info.push;
        if(dot<0){
          const reflected=reflectVelocity(unit.vx,unit.vy,nx,ny),retention=contactRetention(unit,enemy);
          unit.vx=reflected.x*retention;unit.vy=reflected.y*retention;
          enemy.hitAt=state.clock;state.lastHitEnemyId=enemy.id;onEnemyTouch(unit,enemy);
          if(enemy.sword){touchSwordEnemy(unit,enemy);swordWeakHit(enemy,{x:unit.x,y:unit.y,radius:unit.r});}
          else damageEnemy(enemy,directHitDamage(unit),false,{hit:{x:unit.x,y:unit.y,radius:unit.r},owner:unit});
          state.shake=Math.max(state.shake,state.skillShot?4:1.5);
        }
      }
      // 味方とは反射せず、重なった瞬間に友情コンボが発動する（貫通）
      for (const ally of state.units) {
        if (ally.id === unit.id) continue;
        if(!state.friendshipContacts)state.friendshipContacts=new Set();
        if(allyTouching(unit,ally)){if(!state.friendshipContacts.has(ally.id)){state.friendshipContacts.add(ally.id);touchAlly(unit,ally);friendshipBlast(ally);if(hasAbility(unit,'heal')){if(!state.healedAllies)state.healedAllies=new Set();if(!state.healedAllies.has(ally.id)){state.healedAllies.add(ally.id);const heal=Math.min(300,state.maxHp-state.hp);state.hp+=heal;if(heal)floatingText(unit.x,unit.y-35,'HEAL +'+heal,'#35b981',13);}}}}else state.friendshipContacts.delete(ally.id);
        // キューブ状態：手番以外の味方は正方形の当たり判定を持ち、移動中の味方は反射する（友情は上で発動済み）
        if(cubeActive())cubeBounce(unit,ally);
      }
      unit.x = clamp(unit.x, FIELD.left + unit.r, FIELD.right - unit.r);
      unit.y = clamp(unit.y, FIELD.top + unit.r, FIELD.bottom - unit.r);
    }
    if(Math.hypot(unit.vx,unit.vy)>.01)state.shotDirection={vx:unit.vx,vy:unit.vy};
    const friction = Math.exp(-(unit.boostTime>0 ? 0.12 : state.skillShot ? 0.54 : 0.73) * dt);
    unit.vx *= friction;
    unit.vy *= friction;
    state.trail.push({ x: unit.x, y: unit.y, life: 0.25, max: 0.25 });
    if(isBubbly(unit)&&Math.random()<.2)burst(unit.x,unit.y,'#8ddcf5',1,40); // バブリー状態の泡
    if (Math.hypot(unit.vx, unit.vy) < 64 || state.moveTime > 6.8 || !state.enemies.some(enemy => enemy.alive)) {
      unit.vx = 0;
      unit.vy = 0;
      state.unitStopped = true;unit.superWind=false;
      fireLaserGens();
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
    for (const b of state.barriers || []) b.flash = Math.max(0, b.flash - dt);
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
