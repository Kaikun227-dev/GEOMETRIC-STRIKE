'use strict';
const REFLECTION_RING_INTERVAL=.24;
const COSMIC_KINDS=['reflectionRing'];
NEW_COMBOS.push(...COSMIC_KINDS);
const cosmicSpawnPrevious=spawnNewFriendship;
spawnNewFriendship=function(owner,f,carrier,damage){
  if(!COSMIC_KINDS.includes(f.kind))return cosmicSpawnPrevious(owner,f,carrier,damage);
  const e={type:f.kind,side:'ally',owner,ownerId:owner.id,carrier,x:owner.x,y:owner.y,color:owner.color,damage,age:0};
  Object.assign(e,{rings:[],wait:0,emitted:0});
  queueEffect(e);return true;
};
function cosmicRingSegment(e,b,from){
  for(const enemy of livingTargets())if(!b.contacts.has(enemy.id)&&enemyGap(enemy,from,b)<=12){b.contacts.add(enemy.id);damageEnemy(enemy,e.damage,true,{owner:e.owner,hit:{from,to:{x:b.x,y:b.y},radius:12}});}
  for(const id of b.contacts){const enemy=state.enemies.find(n=>n.id===id);if(!enemy||!targetable(enemy)||enemyGap(enemy,b,b)>14)b.contacts.delete(id);}
}
function moveCosmicRing(e,b,dt){
  let travel=1050*dt;
  while(travel>1e-6){
    const end=rayEnd(b.x,b.y,b.dx,b.dy),gap=distance(b,end),step=Math.min(travel,gap,10),from={x:b.x,y:b.y};
    b.x+=b.dx*step;b.y+=b.dy*step;travel-=step;cosmicRingSegment(e,b,from);
    if(gap<=step+1e-6){
      if(b.bounces===3)return false;
      b.bounces++;
      if(Math.abs(b.x-FIELD.left)<.01||Math.abs(b.x-FIELD.right)<.01)b.dx=-b.dx;
      if(Math.abs(b.y-FIELD.top)<.01||Math.abs(b.y-FIELD.bottom)<.01)b.dy=-b.dy;
    }
  }return true;
}
const cosmicUpdatePrevious=updateNewFriendship;
updateNewFriendship=function(e,dt){
  if(!COSMIC_KINDS.includes(e.type))return cosmicUpdatePrevious(e,dt);
  if(e.type==='reflectionRing'){
    const moving=state.phase==='moving'&&!state.unitStopped;
    if(moving){
      e.wait-=dt;
      while(e.wait<=0){
        const angle=distance(e.owner,e.carrier)>.01?Math.atan2(e.carrier.y-e.owner.y,e.carrier.x-e.owner.x):Math.atan2(e.carrier.vy||-1,e.carrier.vx||0);
        e.rings.push({x:e.owner.x,y:e.owner.y,dx:Math.cos(angle),dy:Math.sin(angle),bounces:0,contacts:new Set()});e.emitted++;e.wait+=REFLECTION_RING_INTERVAL;
      }
    }
    e.rings=e.rings.filter(b=>moveCosmicRing(e,b,dt));
    return moving||e.rings.length>0;
  }

};

const cosmicDrawPrevious=drawNewFriendship;
drawNewFriendship=function(e){
  if(!COSMIC_KINDS.includes(e.type))return cosmicDrawPrevious(e);
  ctx.save();
  if(e.type==='reflectionRing'){
    for(const b of e.rings){
      ctx.strokeStyle=e.color;ctx.lineWidth=6;ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(b.x,b.y,15,0,TAU);ctx.stroke();
      ctx.globalAlpha=.95;ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,b.y,11,0,TAU);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(b.x,b.y,8,e.age*5,e.age*5+Math.PI*1.6);ctx.stroke();
      ctx.globalAlpha=.3;ctx.strokeStyle=e.color;ctx.beginPath();ctx.arc(b.x-b.dx*18,b.y-b.dy*18,7,0,TAU);ctx.stroke();
    }ctx.restore();return;
  }
  ctx.restore();
};
