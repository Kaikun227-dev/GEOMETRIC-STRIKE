'use strict';
// 敵ギミックのデータ処理。targets は敵の key 配列、all、nonRestriction、または {group}。
function createEnemyRuntime(enemy,index,wave){
  const attacks=(enemy.attacks||[]).map((a,j)=>({...a,remaining:a.countdown??(enemy.countdown||2)+j,interval:a.interval??(enemy.boss?3+j:2+index%2)}));
  return {...enemy,id:`w${wave}e${index}`,key:enemy.key||`enemy-${index}`,maxHp:enemy.hp,alive:true,flash:0,hitAt:-100,rotation:index*.2,weakStep:0,weakHitStep:0,
    weakPoint:initialWeakPoint(enemy),attacks,countdown:attacks.length?Math.min(...attacks.map(a=>a.remaining)):0};
}
function initialWeakPoint(enemy){
  if(enemy.weakEnabled===false)return null;
  if(enemy.internalWeak)return {internal:true,angle:0,radius:enemy.weakRadius??12};
  if(enemy.weakPoint)return {...enemy.weakPoint};
  return enemy.boss?{angle:enemy.weakAngles?.[0]??enemy.weakAngle??Math.PI/2,radius:15}:null;
}
function enemyWeakMultiplier(enemy){return Math.max(1,enemy.weakMultiplier??state.waves[state.wave].weakMultiplier??state.stage.weakMultiplier??3);}
function currentPhotonMultiplier(){return Math.max(1,state.waves[state.wave].photonMultiplier??state.stage.photonMultiplier??2);}
function isRestrictedContact(unit,enemy){return !!enemy.restriction&&(isPiercing(unit)?enemy.restriction==='pierce':enemy.restriction==='reflect');}
function contactRetention(unit,enemy){return isRestrictedContact(unit,enemy)?.10:enemyHitRetention(unit);}
function enemyRestrictionMultiplier(enemy,owner,friendship){
  if(!enemy.restriction)return 1;
  if(friendship)return .05;
  return owner&&!isRestrictedContact(owner,enemy)?10:.15;
}
function selectEffectTargets(selector){
  if(selector==='all')return state.enemies.slice();
  if(selector==='nonRestriction')return state.enemies.filter(e=>!e.restriction);
  if(selector&&typeof selector==='object'&&!Array.isArray(selector))return state.enemies.filter(e=>e.crossSkull===selector.group);
  const keys=new Set(Array.isArray(selector)?selector:selector?[selector]:[]);
  return state.enemies.filter(e=>keys.has(e.key)||keys.has(e.id));
}
function allowSpawnExit(enemy){
  for(const u of state.units){u.enemyContacts?.delete(enemy.id);if(distance(u,enemy)<u.r+enemyCollisionRadius(enemy)){if(!u.spawnOverlaps)u.spawnOverlaps=new Set();u.spawnOverlaps.add(enemy.id);}}
}
function reviveEnemies(targets,hpRatio=1,restoreRetreat=true){
  for(const e of selectEffectTargets(targets)){
    if(e.alive)continue;e.alive=true;if(!restoreRetreat)e.retreatWhenAlone=false;e.hp=Math.max(1,Math.round(e.maxHp*clamp(hpRatio,.01,1)));e.flash=.3;e.hitAt=-100;
    for(const a of e.attacks)a.remaining=a.countdown??a.interval;e.countdown=e.attacks.length?Math.min(...e.attacks.map(a=>a.remaining)):0;
    allowSpawnExit(e);ring(e.x,e.y,'#68b9a3',e.r+38,.7);floatingText(e.x,e.y-e.r-25,'REVIVE','#449881',13);
  }
}
function applyEnemyEffect(effect,source){
  if(!effect)return;
  if(effect.type==='transparent'){for(const e of effect.targets?selectEffectTargets(effect.targets):[source])e.transparent=true;return;}
  if(effect.type==='counterShot'){
    const target=state.units[state.activeUnit];
    ring(source.x,source.y,'#d96f6b',120,.4);burst(source.x,source.y,'#d96f6b',12,125);
    floatingText(source.x,source.y-source.r-34,'COUNTER SHOT','#c65e55',13);
    damageTeam(effect.damage??420,source.x,source.y,target);
    return;
  }
  if(effect.type==='heartPanel'){
    const p={r:26,...effect.panel};p.id=p.id||'heart-'+source.key;
    if(!state.heartPanels.some(q=>q.id===p.id)){state.heartPanels.push(p);ring(p.x,p.y,'#e68cad',80,.6);floatingText(p.x,p.y-38,'HEART PANEL','#cf628e',13);}
    return;
  }
  if(effect.type==='revive'){reviveEnemies(effect.targets,effect.hpRatio,effect.restoreRetreat!==false);return;}
  if(effect.type==='photons'){scatterPickups('photon',effect.count??6);return;}
  if(effect.type==='summon'){
    for(const key of effect.keys||[]){
      const old=state.enemies.find(e=>e.key===key);if(old){if(!old.alive)reviveEnemies([key]);continue;}
      if(state.enemies.length>=64)continue;
      const def=(state.waves[state.wave].reserves||[]).find(e=>e.key===key);if(!def)continue;
      const e=createEnemyRuntime(def,state.enemies.length,state.wave);state.enemies.push(e);allowSpawnExit(e);
      ring(e.x,e.y,'#68b9a3',e.r+40,.7);floatingText(e.x,e.y-e.r-28,'SUMMON','#449881',13);
      for(const event of def.onSpawnEffects||[])applyEnemyEffect(event,e);
    }return;
  }
  if(effect.type==='moveWeak'){advanceWeakPoint(source);return;}
  for(const e of selectEffectTargets(effect.targets)){
    if(effect.type==='defenseDown'){
      e.defenseMultiplier=Math.max(e.defenseMultiplier||1,effect.multiplier??2);if(effect.durationTurns)e.defenseExpiresAt=Math.max(e.defenseExpiresAt||0,state.turn+effect.durationTurns+1);
      if(e.alive){ring(e.x,e.y,'#9265b3',e.r+28,.6);floatingText(e.x,e.y-e.r-32,'DEF DOWN ×'+e.defenseMultiplier,'#8863ad',13);}
    }else if(effect.type==='grantWeak'){
      if(state.waves[state.wave].noWeakPoints||state.stage.noWeakPoints)continue;
      e.weakPoint={angle:effect.angle??Math.PI/2,internal:!!effect.internal,radius:effect.radius??(effect.internal?12:15)};
      if(effect.multiplier!==undefined)e.weakMultiplier=effect.multiplier;
      if(e.alive){const w=weakPosition(e);ring(w.x,w.y,'#ddac32',35,.6);floatingText(e.x,e.y-e.r-30,'WEAK POINT','#b48b25',12);}
    }
  }
}
function setupEnemyGimmicks(){
  state.crossSkullsFired=new Set();state.weakRouteSteps=new Map();
  if(state.waves[state.wave].noWeakPoints||state.stage.noWeakPoints)for(const e of state.enemies)e.weakPoint=null;
  for(const route of state.waves[state.wave].weakRoutes||[])setWeakRoute(route,0);
}
function setWeakRoute(route,start){
  if(state.waves[state.wave].noWeakPoints||state.stage.noWeakPoints||!route.positions?.length)return;
  for(let offset=0;offset<route.positions.length;offset++){
    const index=(start+offset)%route.positions.length,p=route.positions[index],target=selectEffectTargets(p.target).find(e=>e.alive);
    if(!target)continue;
    for(const e of state.enemies)if(e.weakPoint?.routeId===route.id)e.weakPoint=null;
    target.weakPoint={angle:p.angle??Math.PI/2,internal:!!p.internal,radius:p.radius??12,offset:p.offset??0,routeId:route.id};
    state.weakRouteSteps.set(route.id,index);return;
  }
}
function advanceWeakPoint(enemy){
  if(!enemy?.weakPoint)return;
  if(enemy.weakPoint.routeId){
    const route=(state.waves[state.wave].weakRoutes||[]).find(r=>r.id===enemy.weakPoint.routeId);if(!route)return;
    setWeakRoute(route,(state.weakRouteSteps.get(route.id)||0)+1);
  }else if(enemy.weakMoveOnHit&&enemy.weakAngles?.length){
    enemy.weakHitStep=(enemy.weakHitStep+1)%enemy.weakAngles.length;enemy.weakPoint.angle=enemy.weakAngles[enemy.weakHitStep];
  }else return;
  ring(enemy.x,enemy.y,'#e1b327',enemy.r+30,.4);
}
function resolveEnemyDefeat(enemy){
  for(const effect of enemy.skullEffects||[]){if(enemy.retreated&&effect.notOnRetreat)continue;applyEnemyEffect(effect,enemy);if(effect.once)enemy.skullEffects=enemy.skullEffects.filter(candidate=>candidate!==effect);}
  for(const group of state.waves[state.wave].crossSkulls||[]){
    if(state.crossSkullsFired.has(group.id))continue;
    const members=selectEffectTargets(group.members||{group:group.id});
    if(!members.length||members.some(e=>e.alive))continue;
    state.crossSkullsFired.add(group.id);
    floatingText(enemy.x,enemy.y-60,'CROSS SKULL','#84579f',16);
    for(const effect of group.effects||[])applyEnemyEffect(effect,enemy);
  }
}
// Retreat counts as defeat and fires skull effects, but gives no damage score.
function resolveRetreats(){
  if(state.resolvingRetreats||state.enemies.some(e=>e.alive&&!e.retreatWhenAlone))return;
  state.resolvingRetreats=true;
  try{for(const e of state.enemies){if(!e.alive||!e.retreatWhenAlone)continue;e.alive=false;e.hp=0;e.retreated=true;floatingText(e.x,e.y-45,'撤退','#7c92a8',17);ring(e.x,e.y,'#8da6c3',95,.6);resolveEnemyDefeat(e);}}
  finally{state.resolvingRetreats=false;}
}
function stageGimmickNames(stage){
  const names=new Set(),map={mines:'地雷',photons:'エナジーフォトン',gravity:'重力バリア',blocks:'ブロック',walls:'ダメージウォール',warps:'ワープ',boosts:'加速パネル',winds:'ウィンド',powerAreas:'パワーエリア',hearts:'ハートパネル',slowWalls:'減速壁',swords:'剣パネル',powerSwitches:'パワースイッチ'};
  const addEffect=e=>{if(e.type==='transparent')names.add('透明化');if(e.type==='heartPanel')names.add('ハートパネル');if(e.type==='revive')names.add('蘇生');if(e.type==='photons')names.add('エナジーフォトン');if(e.type==='defenseDown')names.add('防御ダウン（'+(e.multiplier??2)+'倍）');if(e.type==='grantWeak')names.add('弱点付与');if(e.type==='moveWeak')names.add('弱点移動');};
  for(const wave of stage.waves){
    if(wave.noWeakPoints||stage.noWeakPoints)names.add('全敵弱点なし');if(wave.switchMultiplier||stage.switchMultiplier)names.add('パワースイッチ（'+(wave.switchMultiplier??stage.switchMultiplier)+'倍）');
    for(const [key,value] of Object.entries(wave.gimmicks||{}))if(value?.length&&map[key])names.add(map[key]);
    if(wave.crossSkulls?.length){names.add('クロスドクロ');for(const g of wave.crossSkulls)g.effects.forEach(addEffect);}
    if(wave.weakRoutes?.length)names.add('弱点移動');
    const weak=wave.weakMultiplier??stage.weakMultiplier??3,photon=wave.photonMultiplier??stage.photonMultiplier??2;
    if(weak!==3)names.add('弱点倍率アップ（'+weak+'倍）');if(photon!==2)names.add('フォトン倍率アップ（'+photon+'倍）');
    for(const e of [...wave.enemies,...(wave.reserves||[])]){
      if(e.retreatWhenAlone)names.add('撤退');if(e.counterEffects?.length){names.add('反撃モード');e.counterEffects.forEach(addEffect);}
      if(e.gravity)names.add('重力バリア');if(e.restriction)names.add(e.restriction==='reflect'?'反射制限':'貫通制限');
      if(!e.boss&&e.weakPoint&&!e.weakPoint.internal)names.add('雑魚敵に弱点');if(e.internalWeak||e.weakPoint?.internal)names.add('内部弱点');if(e.weakMoveOnHit)names.add('弱点移動');
      if(e.skullEffects?.length){names.add('ドクロ');e.skullEffects.forEach(addEffect);}
      if(e.weakMultiplier&&e.weakMultiplier!==3)names.add('弱点倍率アップ（'+e.weakMultiplier+'倍）');
      for(const a of e.attacks||[]){if(a.kind==='revive')names.add('蘇生');if(map[a.kind])names.add(map[a.kind]);for(const event of a.effects||[])addEffect(event);}
    }
  }
  return [...names];
}
