'use strict';
// 敵ギミックのデータ処理。targets は敵の key 配列、all、nonRestriction、または {group}。
// 友情・爆風などの攻撃対象：生存していて、透明でなく、剣持ち敵（ダメージ無効）でもない敵。
const targetable=e=>!!(e&&e.alive&&!e.transparent&&!e.sword);
function createEnemyRuntime(enemy,index,wave){
  const attacks=(enemy.attacks||[]).map((a,j)=>({...a,...(a.kind==='move'?{route:[{x:enemy.x,y:enemy.y},...(a.path||[a.to])],index:0,dir:1}:{}),remaining:a.countdown??(enemy.countdown||2)+j,interval:a.interval??(enemy.boss?3+j:2+index%2)}));
  return {...enemy,id:`w${wave}e${index}`,key:enemy.key||`enemy-${index}`,maxHp:enemy.hp,alive:true,transparent:!!enemy.startTransparent,flash:0,hitAt:-100,rotation:index*.2,weakStep:0,weakHitStep:0,
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
function contactRetention(unit,enemy){return bubblyRelax(unit,isRestrictedContact(unit,enemy)?.10:enemyHitRetention(unit));}
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
  for(const u of state.units){u.enemyContacts?.delete(enemy.id);if(enemyOverlaps(u,enemy)){if(!u.spawnOverlaps)u.spawnOverlaps=new Set();u.spawnOverlaps.add(enemy.id);}}
}
function reviveEnemies(targets,hpRatio=1,restoreRetreat=true,limit=Infinity){
  let revived=0;
  for(const e of selectEffectTargets(targets)){
    if(e.alive||revived>=limit)continue;revived++;e.alive=true;if(!restoreRetreat)e.retreatWhenAlone=false;e.hp=Math.max(1,Math.round(e.maxHp*clamp(hpRatio,.01,1)));e.flash=.3;e.hitAt=-100;
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
  if(effect.type==='revive'){
    let targets=effect.targets;
    // 'others'：自分・ボス・中ボス以外の雑魚。倒れている敵からランダムに最大 limit 体を蘇生する。
    if(targets==='others')targets=state.enemies.filter(e=>e!==source&&!e.boss&&!e.midBoss&&!e.alive).sort(()=>Math.random()-.5).map(e=>e.id);
    reviveEnemies(targets,effect.hpRatio,effect.restoreRetreat!==false,effect.limit??Infinity);return;
  }
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
      e.weakPoint={angle:effect.angle??e.weakAngles?.[0]??Math.PI/2,internal:!!effect.internal,radius:effect.radius??(effect.internal?12:15)};e.weakStep=0;
      if(effect.multiplier!==undefined)e.weakMultiplier=effect.multiplier;
      if(e.alive){const w=weakPosition(e);ring(w.x,w.y,'#ddac32',35,.6);floatingText(e.x,e.y-e.r-30,'WEAK POINT','#b48b25',12);}
    }
  }
}
function setupEnemyGimmicks(){
  state.crossSkullsFired=new Set();state.weakRouteSteps=new Map();
  if(state.waves[state.wave].gimmicks?.transPanels?.length)for(const e of state.enemies)e.stealthManaged=true;
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
// 剣持ち敵：直接触れた手番キャラの攻撃力（友情コンボ含む）がそのターンだけ上がる。複数の剣持ち敵に触れても上がるのは1ターンに1回まで。
// 剣持ち敵そのものはダメージを受けず（倒せず）、他の敵が全滅すると撤退する（retreatWhenAlone）。
function touchSwordEnemy(unit,enemy){
  if(!enemy?.sword||(state.swordBoost||1)>1)return;
  state.swordBoost=enemy.sword;state.swordToucher=unit.id;
  floatingText(unit.x,unit.y-54,'SWORD ×'+enemy.sword,'#c47d12',18);floatingText(enemy.x,enemy.y-enemy.r-26,'ATK UP','#c47d12',13);
  ring(enemy.x,enemy.y,'#f0b23a',enemy.r+60,.6);ring(unit.x,unit.y,'#f4b73c',70,.5);burst(unit.x,unit.y,'#f4b73c',16,220);tone(760,.12,'sawtooth',.02,0,1200);
}
// 透明パネル：踏むと、透明でない敵は透明に、透明の敵は透明でなくなる。各パネル1ショット1回。透明状態は次のターンへ持ち越す（リセットしない）。
function flipTransparency(panel){
  for(const e of state.enemies){
    e.stealthManaged=true;e.transparent=!e.transparent;
    if(!e.transparent)allowSpawnExit(e);
    if(e.alive){ring(e.x,e.y,e.transparent?'#9aa0d8':'#7f8ad0',e.r+34,.55);floatingText(e.x,e.y-e.r-30,e.transparent?'透明化':'出現','#6d75b8',12);}
  }
  ring(panel.x,panel.y,'#8c92d6',90,.5);burst(panel.x,panel.y,'#aeb4ec',14,190);tone(540,.08,'sine',.02,0,820);
}
// Retreat counts as defeat and fires skull effects, but gives no damage score.
function resolveRetreats(){
  if(state.resolvingRetreats||state.enemies.some(e=>e.alive&&!e.retreatWhenAlone))return;
  state.resolvingRetreats=true;
  try{for(const e of state.enemies){if(!e.alive||!e.retreatWhenAlone)continue;e.alive=false;e.hp=0;e.retreated=true;floatingText(e.x,e.y-45,'撤退','#7c92a8',17);ring(e.x,e.y,'#8da6c3',95,.6);resolveEnemyDefeat(e);}}
  finally{state.resolvingRetreats=false;}
}
// 敵移動：route（出発点＋移動先）を行ったり来たりする。次の位置は peekMove で確認できる（描画用）。
function peekMove(enemy){
  const a=enemy.attacks?.find(q=>q.kind==='move');if(!a)return null;
  let dir=a.dir,next=a.index+dir;if(next>=a.route.length||next<0){dir*=-1;next=a.index+dir;}
  return {attack:a,index:next,dir,pos:a.route[next]};
}
function moveEnemy(enemy,attack){
  const m=peekMove(enemy);if(!m||m.attack!==attack)return;
  attack.index=m.index;attack.dir=m.dir;
  ring(enemy.x,enemy.y,'#9aa3ad',enemy.r+20,.5);
  enemy.trail={x:enemy.x,y:enemy.y,age:0};
  enemy.x=m.pos.x;enemy.y=m.pos.y;allowSpawnExit(enemy);
  ring(enemy.x,enemy.y,'#7f8a97',enemy.r+30,.6);
}
function stageGimmickNamesRaw(stage){
  const names=new Set(),map={mines:'地雷',photons:'エナジーフォトン',gravity:'重力バリア',blocks:'ブロック',walls:'ダメージウォール',warps:'ワープ',boosts:'加速パネル',winds:'ウィンド',powerAreas:'パワーエリア',hearts:'ハートパネル',slowWalls:'減速壁',swords:'剣パネル',powerSwitches:'パワースイッチ',typePanels:'撃種変化パネル',transPanels:'透明パネル',containers:'フォトンコンテナ',barriers:'結界'};
  const addEffect=e=>{if(e.type==='transparent')names.add('透明化');if(e.type==='heartPanel')names.add('ハートパネル');if(e.type==='revive')names.add('蘇生');if(e.type==='photons')names.add('エナジーフォトン');if(e.type==='defenseDown')names.add('防御ダウン（'+(e.multiplier??2)+'倍）');if(e.type==='grantWeak'){names.add('弱点付与');if(e.internal)names.add('内部弱点');}if(e.type==='moveWeak')names.add('弱点移動');};
  for(const wave of stage.waves){
    if(wave.cube??stage.cube)names.add('キューブ状態');if(wave.touchPower??stage.touchPower)names.add('触れた味方の数に応じて攻撃力アップ');
    if(wave.laserMultipliers||stage.laserMultipliers)names.add('レーザージェネレーター');
    if(wave.noWeakPoints||stage.noWeakPoints)names.add('全敵弱点なし');if(wave.switchMultiplier||stage.switchMultiplier)names.add('パワースイッチ（'+(wave.switchMultiplier??stage.switchMultiplier)+'倍）');
    for(const [key,value] of Object.entries(wave.gimmicks||{}))if(value?.length&&map[key])names.add(map[key]);
    if(wave.crossSkulls?.length){names.add('クロスドクロ');for(const g of wave.crossSkulls)g.effects.forEach(addEffect);}
    if(wave.weakRoutes?.length)names.add('弱点移動');
    const weak=wave.weakMultiplier??stage.weakMultiplier??3,photon=wave.photonMultiplier??stage.photonMultiplier??2;
    if(weak!==3)names.add('弱点倍率アップ（'+weak+'倍）');if(photon!==2)names.add('フォトン倍率アップ（'+photon+'倍）');
    for(const e of [...wave.enemies,...(wave.reserves||[])]){
      if(e.retreatWhenAlone)names.add('撤退');if(e.counterEffects?.length){names.add('反撃モード');e.counterEffects.forEach(addEffect);}
      if(e.gravity)names.add('重力バリア');if(e.startTransparent)names.add('透明化');if(e.sword)names.add('剣持ち敵（'+e.sword+'倍）');if(e.midBoss)names.add('中ボス');if(e.attacks?.some(a=>a.kind==='move'))names.add('敵移動');if(e.restriction)names.add(e.restriction==='reflect'?'反射制限':'貫通制限');
      if(!e.boss&&e.weakPoint&&!e.weakPoint.internal)names.add('雑魚敵に弱点');if(e.internalWeak||e.weakPoint?.internal)names.add('内部弱点');if(e.noWeak)names.add('一部のボスは弱点なし');if(e.weakMoveOnHit)names.add('弱点移動');
      if(e.skullEffects?.length){names.add('ドクロ');e.skullEffects.forEach(addEffect);}
      if(e.weakMultiplier&&e.weakMultiplier!==3)names.add('弱点倍率アップ（'+e.weakMultiplier+'倍）');
      for(const a of e.attacks||[]){if(a.kind==='revive')names.add('蘇生');if(map[a.kind])names.add(map[a.kind]);for(const event of a.effects||[])addEffect(event);}
    }
  }
  return [...names].filter(n=>!(stage.hideGimmicks||[]).includes(n));
}
// ステージ選択画面のギミック表示：赤（危険）→青（強化）→灰色（その他）の順に並べ、色分けする。
const GIMMICK_TONE_RED=['ダメージウォール','重力バリア','地雷','ウィンド','減速壁','反射制限','貫通制限'];
const GIMMICK_TONE_GREEN=['弱点倍率アップ','フォトン倍率アップ','防御ダウン'];
const GIMMICK_TONE_BLUE=['透明パネル','フォトンコンテナ','剣持ち敵','エナジーフォトン','パワーエリア','パワースイッチ','剣パネル','結界','レーザージェネレーター','キューブ状態','触れた味方の数に応じて攻撃力アップ'];
const GIMMICK_RED_BLOCK_STAGES=['3-5','6-2','8-5'];
// ワープは原則として赤（危険）。対策が不要な 3-2・8-2 だけ青（強化）で表示する。
const GIMMICK_BLUE_WARP_STAGES=['3-2','8-2'];
function gimmickTone(name,stage){
  if(name==='ブロック')return GIMMICK_RED_BLOCK_STAGES.includes(stage?.id)?'red':'blue';
  if(name==='ワープ')return GIMMICK_BLUE_WARP_STAGES.includes(stage?.id)?'blue':'red';
  if(GIMMICK_TONE_RED.some(n=>name.startsWith(n)))return 'red';
  if(GIMMICK_TONE_BLUE.some(n=>name.startsWith(n)))return 'blue';
  if(GIMMICK_TONE_GREEN.some(n=>name.startsWith(n)))return 'green';
  return 'gray';
}
function stageGimmickEntries(stage){
  const order={red:0,blue:1,green:2,gray:3};
  return stageGimmickNamesRaw(stage).map((name,i)=>({name,tone:gimmickTone(name,stage),i})).sort((a,b)=>order[a.tone]-order[b.tone]||a.i-b.i).map(({name,tone})=>({name,tone}));
}
function stageGimmickNames(stage){return stageGimmickEntries(stage).map(e=>e.name);}
