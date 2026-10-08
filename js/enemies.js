'use strict';
// 敵：ビルダー関数（foe/orb/core/gravity/scatter/specialist）・雑魚の種類・十字／クロスレーザー定義。
// 配置とステータスは stages.js 側で決める。data.js の後、stages.js の前に読み込む。

  // Staggered routes, offset rings and explicit circular rebound pairs.
  const foe = (x,y,r,hp,sides=6,kind='sniper',delay=3) => ({x,y,r,hp,sides,attacks:[{kind,countdown:delay,interval:3}]});
  const orb = (x,y,r,hp,kind='homing',delay=3) => ({...foe(x,y,r,hp,0,kind,delay),shape:'circle'});
  const core = (x,y,r,hp,sides,attacks,extra={}) => ({x,y,r,hp,sides,boss:true,attacks,...extra});
  const gravity=(e,r=115)=>({...e,gravity:r});
  const scatter=(e,kind)=>({...e,attacks:[...e.attacks,{kind,count:4,countdown:2,interval:2}]});
  const specialist=(kind,x,y,r=32,hp=3600)=>({...foe(x,y,r,hp,kind==='turret'?4:kind==='lancer'?3:8,kind==='turret'?'reflectLaser':kind==='lancer'?'pierce':'homing',2),species:kind,tint:kind==='turret'?'#9b82c5':kind==='lancer'?'#cf9470':'#779fa5',armor:kind==='sentinel'?.65:1});

// Reusable enemy families. Stats/placement remain authored by each stage.
const ENEMY_SPECIES={turret:'反射砲台',lancer:'貫通射手',sentinel:'装甲兵',orb:'球形兵',cruciform:'十字砲台',starBattery:'星光砲台',bomber:'爆撃兵'};
Object.assign(ENEMY_ATTACKS,{plusLaser:{mult:.30,hits:2},crossLaser:{mult:.30,hits:2}});
Object.assign(FRIENDSHIP_KINDS,{plusLaser:{name:'十字レーザー',label:'十字レーザー'},crossLaser:{name:'クロスレーザー',label:'クロスレーザー'}});
function variedFoe(kind,x,y,r=34,hp=6000){
 if(['turret','lancer','sentinel'].includes(kind)){
  const e=specialist(kind,x,y,r,hp);e.attacks=e.attacks.map(a=>({...a,countdown:2,interval:2,mult:.30}));return e;
 }
 const specs={
  orb:{shape:'circle',sides:0,tint:'#6eaaa2',attacks:[{kind:'homing',count:3,mult:.28,countdown:2,interval:2}]},
  cruciform:{shape:'cruciform',sides:4,tint:'#bc7b96',attacks:[{kind:'plusLaser',hits:2,mult:.30,countdown:2,interval:2}]},
  starBattery:{shape:'starBattery',sides:8,tint:'#7989c4',attacks:[{kind:'crossLaser',hits:2,mult:.30,countdown:2,interval:2}]},
  bomber:{sides:5,tint:'#bd965a',attacks:[{kind:'meteor',count:2,mult:.24,countdown:1,interval:2},{kind:'explosion',radius:130,maxHits:2,mult:.22,countdown:2,interval:2}]}
 };
 return {x,y,r,hp,armor:1,species:kind,...specs[kind]};
}
