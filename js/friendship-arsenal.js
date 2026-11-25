'use strict';
// Airborne bombs, growing sphere, contact-triggered wall turrets and 64-way bullets.
// Loaded after simulation/rendering so all three extension hooks are available.
const ARSENAL_KINDS=['bomber','boundSphere','laserTurret','allRangeBullet'];
NEW_COMBOS.push(...ARSENAL_KINDS);
const arsenalSpawnPrevious=spawnNewFriendship;
spawnNewFriendship=function(owner,f,carrier,damage){
  if(!ARSENAL_KINDS.includes(f.kind))return arsenalSpawnPrevious(owner,f,carrier,damage);
  const e={type:f.kind,side:'ally',owner,ownerId:owner.id,carrier,x:owner.x,y:owner.y,color:owner.color,damage,age:0};
  if(f.kind==='bomber'||f.kind==='laserTurret'){
    const direction=Math.hypot(carrier.vx,carrier.vy)>.01?carrier:state.shotDirection||{vx:0,vy:-1};
    const baseAngle=f.kind==='bomber'?Math.atan2(direction.vy,direction.vx):-Math.PI/2;
    e.craft=Array.from({length:f.count||4},(_,i)=>{const angle=baseAngle+i*TAU/(f.count||4),dx=Math.cos(angle),dy=Math.sin(angle);return {x:owner.x,y:owner.y,dx,dy,angle,end:rayEnd(owner.x,owner.y,dx,dy),arrived:false,bombDistance:0};});
    e.beams=[];
  }else if(f.kind==='boundSphere'){
    const target=friendshipVisualTargets(owner)[0];
    const a=target?Math.atan2(target.y-owner.y,target.x-owner.x):-Math.PI/2;
    Object.assign(e,{dx:Math.cos(a),dy:Math.sin(a),r:16,bounces:0,contacts:new Set(),hits:0});
  }else Object.assign(e,{bullets:[],emitted:0,wait:0});
  queueEffect(e);return true;
};

function arsenalBomb(e,p){
  withDamageOwner(e.owner,()=>spawnExplosion('ally',p,livingTargets(),{radius:90,maxHits:2,damage:e.damage,color:e.color}));
}
function sphereSegment(e,from){
  for(const enemy of livingTargets()){
    if(!e.contacts.has(enemy.id)&&enemyGap(enemy,from,e)<=e.r){
      e.contacts.add(enemy.id);e.hits++;
      damageEnemy(enemy,e.damage,true,{owner:e.owner,hit:{from,to:{x:e.x,y:e.y},radius:e.r}});
      e.r+=4;
    }
  }
  for(const id of e.contacts){const enemy=state.enemies.find(n=>n.id===id);if(!enemy||!targetable(enemy)||enemyGap(enemy,e,e)>e.r+2)e.contacts.delete(id);}
}
const arsenalUpdatePrevious=updateNewFriendship;
updateNewFriendship=function(e,dt){
  if(!ARSENAL_KINDS.includes(e.type))return arsenalUpdatePrevious(e,dt);
  if(e.type==='bomber'){
    e.craft=e.craft.filter(p=>{
      let travel=Math.min(480*dt,distance(p,p.end));
      while(travel>1e-6){
        if(p.bombDistance<=1e-6){arsenalBomb(e,p);p.bombDistance=70;}
        const step=Math.min(travel,p.bombDistance);p.x+=p.dx*step;p.y+=p.dy*step;p.bombDistance-=step;travel-=step;
      }
      return distance(p,p.end)>.01;
    });return e.craft.length>0;
  }
  if(e.type==='boundSphere'){
    // Short swept segments preserve re-entry hits and growth without tunnelling.
    let travel=1150*dt;
    while(travel>1e-6){
      const end=rayEnd(e.x,e.y,e.dx,e.dy),gap=distance(e,end),step=Math.min(travel,gap,8),from={x:e.x,y:e.y};
      e.x+=e.dx*step;e.y+=e.dy*step;travel-=step;sphereSegment(e,from);
      if(gap<=step+1e-6){
        if(e.bounces===8)return false;
        e.bounces++;
        if(Math.abs(e.x-FIELD.left)<.01||Math.abs(e.x-FIELD.right)<.01)e.dx=-e.dx;
        if(Math.abs(e.y-FIELD.top)<.01||Math.abs(e.y-FIELD.bottom)<.01)e.dy=-e.dy;
      }
    }return true;
  }
  if(e.type==='laserTurret'){
    e.beams=e.beams.filter(b=>(b.life-=dt)>0);
    if(state.unitStopped||state.phase!=='moving')return e.beams.length>0;
    for(const p of e.craft){const remaining=distance(p,p.end),step=Math.min(1050*dt,remaining);p.x+=p.dx*step;p.y+=p.dy*step;if(step>=remaining){p.x=p.end.x;p.y=p.end.y;p.arrived=true;}}
    return true;
  }
  e.wait-=dt;
  while(e.emitted<100&&e.wait<=0){
    const angle=Math.floor(Math.random()*64)*TAU/64;
    e.bullets.push({x:e.x,y:e.y,dx:Math.cos(angle),dy:Math.sin(angle),angle,hits:new Set()});e.emitted++;e.wait+=.012;
  }
  e.bullets=e.bullets.filter(b=>{
    const from={x:b.x,y:b.y};b.x+=b.dx*1200*dt;b.y+=b.dy*1200*dt;
    for(const enemy of livingTargets())if(!b.hits.has(enemy.id)&&enemyGap(enemy,from,b)<=3){b.hits.add(enemy.id);damageEnemy(enemy,e.damage,true,{owner:e.owner,hit:{from,to:b,radius:3}});}
    return b.x>=FIELD.left-40&&b.x<=FIELD.right+40&&b.y>=FIELD.top-40&&b.y<=FIELD.bottom+40;
  });return e.emitted<100||e.bullets.length>0;
};

const arsenalTouchPrevious=onEnemyTouch;
onEnemyTouch=function(unit,enemy){
  arsenalTouchPrevious(unit,enemy);
  if(state.unitStopped||state.phase!=='moving')return;
  for(const e of state.effects){
    if(e.type!=='laserTurret'||e.carrier!==unit)continue;
    // Snapshot the contact position; subsequent enemy movement does not steer beams.
    const target={x:enemy.x,y:enemy.y};
    for(const p of e.craft){
      if(!p.arrived)continue;
      let dx=target.x-p.x,dy=target.y-p.y,length=Math.hypot(dx,dy);
      if(length<.01){dx=enemy.x-p.x;dy=enemy.y-p.y;length=Math.hypot(dx,dy)||1;}
      const to=rayEnd(p.x,p.y,dx/length,dy/length),from={x:p.x,y:p.y};
      p.aim=Math.atan2(dy,dx);e.beams.push({from,to,life:.18});
      withDamageOwner(e.owner,()=>damageAlongSegment(from,to,14,e.damage,.4));
    }
  }
};

const arsenalDrawPrevious=drawNewFriendship;
drawNewFriendship=function(e){
  if(!ARSENAL_KINDS.includes(e.type))return arsenalDrawPrevious(e);
  ctx.save();ctx.strokeStyle=e.color;ctx.fillStyle=e.color;
  if(e.type==='boundSphere'){
    const g=ctx.createRadialGradient(e.x-e.r*.3,e.y-e.r*.3,1,e.x,e.y,e.r);g.addColorStop(0,'#fff');g.addColorStop(.35,'#c8fff1');g.addColorStop(1,e.color);
    ctx.globalAlpha=.8;ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=3;ctx.stroke();
    ctx.strokeStyle='#fff';ctx.beginPath();ctx.ellipse(e.x,e.y,e.r*.8,e.r*.3,e.age*3,0,TAU);ctx.stroke();
  }else if(e.type==='allRangeBullet'){
    for(const b of e.bullets){ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(b.x-b.dx*30,b.y-b.dy*30);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();ctx.strokeStyle=e.color;}
  }else{
    if(e.type==='laserTurret')for(const b of e.beams){ctx.globalAlpha=b.life/.18;ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(b.from.x,b.from.y);ctx.lineTo(b.to.x,b.to.y);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=e.color;}
    ctx.globalAlpha=1;
    for(const p of e.craft){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(e.type==='bomber'?p.angle:(p.aim??p.angle+Math.PI));
      if(e.type==='bomber'){
        ctx.globalAlpha=.35;ctx.fillRect(-50,-3,35,6);ctx.globalAlpha=1;
        ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(-14,-22);ctx.lineTo(-8,-5);ctx.lineTo(-22,-9);ctx.lineTo(-17,0);ctx.lineTo(-22,9);ctx.lineTo(-8,5);ctx.lineTo(-14,22);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
      }else{ctx.beginPath();ctx.arc(0,0,12,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillRect(0,-4,23,8);}
      ctx.restore();
    }
  }ctx.restore();
};
