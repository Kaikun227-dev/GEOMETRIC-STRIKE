'use strict';
// Stable IDs describe the variant, never its position in the catalogue.
const FRAGMENT_GROUPS={
  1:[['sniper',3],['homing',8],['pierceHoming',4],['explosion'],['laser'],['reflectLaser',4],['reflectCross',4],['drones',3],['meteor',8],['spread',16,3],['pierce',8],['satellites',4],['machinegun',40],['plasma'],['thunder'],['relation'],['slash'],['saw']],
  2:[['sniper',1],['homing',12],['pierceHoming',8],['scramble'],['drones',5],['wayLaser',8],['meteor',12],['spread',16,5],['spread',32,3],['poisonSpread',16,2],['pierce',16],['markedPierce',1],['speedUp'],['atkUp'],['machinegun',80],['shotgun',9,3],['dropBomb',4],['crossBomb',3],['splitShot',5],['roundBurst'],['eruption'],['wheel'],['allRangeBullet']],
  3:[['homing',18],['pierceHoming',12],['enhancedReflect',4],['wayLaser',16],['poisonMeteor',8],['spread',32,5],['satellites',8],['weakPierce'],['markedPierce',3],['bubblyGift'],['shotgun',13,4],['dropBomb',6],['poisonBomb'],['energyBall'],['crossWheel'],['involute',12],['shockSplit',3],['discharge'],['wallSnake'],['heavyCannon'],['blastHoming'],['oathSwords',3],['boundSphere'],['bomber',5]],
  4:[['pierceHoming',18],['enhancedScramble'],['markedPierce',5],['copy'],['atkSpeedUp'],['trident'],['cornerMissile'],['counterRing',16],['absoluteCross'],['shinePillar'],['sonicCannon'],['interference'],['dimensionRift'],['astralPress'],['oathSwords',7],['plasmaBall'],['poisonHole'],['laserTurret',7],['bomber',8]]
};
const FRAGMENTS=Object.entries(FRAGMENT_GROUPS).flatMap(([rarity,entries])=>entries.map(([kind,n,m])=>{
  const base=CHARACTERS.flatMap(c=>[c.friendship,c.secondary]).find(f=>f?.kind===kind);
  if(!base)throw Error('Missing fragment friendship: '+kind);
  const combo={...base};
  if(m!==undefined)Object.assign(combo,{ways:n,volleys:m});
  else if(n!==undefined)combo[['reflectLaser','reflectCross','enhancedReflect'].includes(kind)?'bounces':'count']=n;
  const name=friendshipTitle(combo);
  combo.displayName=name;
  return {id:[kind,n,m].filter(v=>v!==undefined).join('-'),rarity:Number(rarity),name,combo};
}));
const FRAGMENT_BY_ID=Object.fromEntries(FRAGMENTS.map(f=>[f.id,f]));
const FRAGMENT_KEY='geometric-friendship-fragments-v1';
let ownedFragments=[];
try{const raw=JSON.parse(localStorage.getItem(FRAGMENT_KEY));if(Array.isArray(raw))ownedFragments=[...new Set(raw.filter(id=>Object.hasOwn(FRAGMENT_BY_ID,id)))];}catch{}
function fragmentLabel(id){const f=FRAGMENT_BY_ID[id];return f?'★'.repeat(f.rarity)+' '+f.name:'';}
function fragmentRarityWeights(stageId){
  const chapter=String(stageId).startsWith('S-')?10:clamp(parseInt(stageId)||1,1,10),t=(chapter-1)/9;
  return [.70-.60*t,.25-.05*t,.04+.36*t,.01+.29*t];
}
function fragmentDropChance(units){return Math.min(1,.35+units.reduce((sum,u)=>sum+Math.max(0,u.chipMiningBonus||0),0));}
function rollFragment(stageId,excluded,random=Math.random){
  const weights=fragmentRarityWeights(stageId),groups=[1,2,3,4].map(r=>FRAGMENTS.filter(f=>f.rarity===r&&!excluded.has(f.id)));
  const total=weights.reduce((sum,w,i)=>sum+(groups[i].length?w:0),0);if(!total)return null;
  let value=random()*total,index=groups.findLastIndex(g=>g.length);
  for(let i=0;i<4;i++){if(!groups[i].length)continue;value-=weights[i];if(value<0){index=i;break;}}
  const pool=groups[index];return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))].id;
}
function awardFragments(random=Math.random){
  if(state.fragmentsAwarded)return state.fragmentDrops||[];
  state.fragmentsAwarded=true;state.fragmentDrops=[];
  if(state.stage.maker||!STAGE_BY_ID[state.stage.id])return [];
  const excluded=new Set(ownedFragments),drops=[],chance=fragmentDropChance(state.units);
  for(let i=0;i<3;i++)if(random()<chance){const id=rollFragment(state.stage.id,excluded,random);if(id){excluded.add(id);drops.push(id);}}
  if(!drops.length)return [];
  try{localStorage.setItem(FRAGMENT_KEY,JSON.stringify([...ownedFragments,...drops]));}
  catch{state.fragmentSaveFailed=true;return [];}
  ownedFragments.push(...drops);state.fragmentDrops=drops;return drops;
}
