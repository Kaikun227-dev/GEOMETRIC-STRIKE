'use strict';
// 第4章後半。各クエストは道中3エリア + 同一ボス2エリア。
const restrictionFoe=(key,x,y,restriction,peers)=>({key,x,y,r:32,hp:3200,shape:'circle',sides:0,restriction,crossSkull:'seal',tint:restriction==='reflect'?'#79c5d1':'#8e9aab',attacks:[{kind:'revive',targets:peers,countdown:2,interval:2}]});
const lateBoss=(name,x,y,hp,sides,tint)=>({...boss4(name,x,y,hp,sides,tint,[{kind:'laser',hits:2,mult:.16,countdown:2,interval:2},{kind:'meteor',count:3,mult:.16,countdown:1,interval:2},{kind:'spread',ways:8,volleys:1,mult:.12,countdown:2,interval:2}]),weakAngles:undefined,key:'boss'});
const sealLayouts=[
 {seals:[[165,285],[280,360],[395,435],[490,330]],others:[[165,135],[445,140],[100,455],[335,185]]},
 {seals:[[130,210],[245,305],[370,400],[490,495]],others:[[345,135],[500,210],[120,425],[285,515]]},
 {seals:[[130,375],[250,260],[370,375],[490,260]],others:[[170,120],[435,115],[100,515],[490,510]]},
 {seals:[[115,330],[240,400],[370,330],[490,410],[320,520]],others:[[310,160],[105,180],[510,175],[140,510]]},
 {seals:[[120,230],[245,335],[375,440],[495,335],[245,535]],others:[[375,155],[130,100],[100,440],[500,525]]}
];
// Seeded scatter keeps each area reproducible while avoiding rows, enemy bodies and starting allies.
const lateMines=(phase,enemies)=>{
 let seed=9173+phase*1597;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),mines=[];
 for(let region=0;region<4;region++)for(let n=0;n<4;n++)for(let attempt=0;attempt<180;attempt++){
  const p={x:Math.round(65+(region%2)*245+random()*240),y:Math.round(80+Math.floor(region/2)*280+random()*275),damage:750};
  if(enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<e.r+20)||mines.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<38)||Object.values(FORMATION_POSITIONS).flat().some(([x,y])=>Math.hypot(x-p.x,y-p.y)<48))continue;
  mines.push(p);break;
 }
 return mines;
};
const stage44={id:'4-4',name:'蘇る水晶の封印',hint:'反射制限を同時に倒してクロスドクロを発動。互いに2ターンで蘇生する。残りの敵は防御ダウンでダメージ5倍。貫通とマインスイーパーが有効。',waves:sealLayouts.map((layout,i)=>{
 const keys=layout.seals.map((_,j)=>'gel-'+String.fromCharCode(97+j)),enemies=layout.seals.map(([x,y],j)=>restrictionFoe(keys[j],x,y,'reflect',[keys[(j+1)%keys.length]]));
 enemies.push(...layout.others.map(([x,y],j)=>i>=3&&j===0?lateBoss('メメント',x,y,i===3?78000:105000,5,'#a184b6'):{...foe4(x,y,36,i>=3?16000:12500,j?'pierce':'homing'),key:'guard-'+j}));
 return {name:['水晶の包囲陣','対角線の蘇生','封印を結ぶ道','封印核・メメント','封印核・メメントを追撃'][i],step:i<3?'SEAL '+(i+1):'MEMENTO / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),gimmicks:{mines:lateMines(i,enemies)},enemies,
   crossSkulls:[{id:'seal',members:keys,effects:[{type:'defenseDown',targets:'nonRestriction',multiplier:5}]}]};
})};
const stage45={id:'4-5',name:'鋼の封印と十倍の光',photonMultiplier:10,hint:'貫通制限を全滅させるとフォトンを放つ雑魚が出現。鋼の敵は互いに2ターンで蘇生する。フォトン付きの直殴りは10倍。',waves:sealLayouts.map((layout,i)=>{
 const keys=layout.seals.map((_,j)=>'iron-'+String.fromCharCode(97+j)),enemies=layout.seals.map(([x,y],j)=>restrictionFoe(keys[j],x,y,'pierce',[keys[(j+1)%keys.length]]));
 enemies.push(...layout.others.map(([x,y],j)=>gravity(i>=3&&j===0?lateBoss('ルクス',x,y,i===3?95000:125000,8,'#bf9c43'):{...foe4(x,y,37,i>=3?19000:16000),key:'guard-'+j},i>=3&&j===0?145:115)));
 const reserves=[{key:'feeder-a',x:layout.seals[0][0],y:layout.seals[0][1],r:25,hp:36000,sides:4,tint:'#bdaf57',attacks:[{kind:'photons',count:4,countdown:1,interval:1}],onSpawnEffects:[{type:'photons',count:4}]},{key:'feeder-b',x:layout.seals.at(-1)[0],y:layout.seals.at(-1)[1],r:25,hp:12000,sides:4,tint:'#bdaf57',attacks:[{kind:'photons',count:4,countdown:1,interval:1}],onSpawnEffects:[{type:'photons',count:4}]}];
 return {name:['鋼の四重門','光子を呼ぶ対角線','重力の光路','光核・ルクス','光核・ルクスを追撃'][i],step:i<3?'PHOTON '+(i+1):'LUX / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),gimmicks:{},enemies,reserves,
   crossSkulls:[{id:'seal',members:keys,effects:[{type:'summon',keys:['feeder-a','feeder-b']}]}]};
})};
const internalLayouts=[[[175,180],[445,180],[215,395],[420,420]],[[105,245],[310,170],[500,310],[280,440]],[[180,155],[435,265],[175,420],[435,515]],[[325,185],[135,385],[455,450]],[[195,240],[460,200],[380,440]]];
const stage46={id:'4-6',name:'四面の壁と内なる弱点',weakMultiplier:10,hint:'四面すべてがダメージウォール。全敵の中心に内部弱点があり、倍率は10倍。貫通で中心を通り、風で崩される配置に対応しよう。',waves:internalLayouts.map((positions,i)=>({
 name:['内なる光を貫いて','中心を結ぶ軌道','風に揺れる弱点','内核・インサイド','内核・インサイドとの決着'][i],step:i<3?'INNER '+(i+1):'INSIDE / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),
 gimmicks:{walls:[{side:'left',start:28,end:712,damage:430},{side:'right',start:28,end:712,damage:430},{side:'top',start:28,end:592,damage:430},{side:'bottom',start:28,end:592,damage:430}],winds:[windDevice(i%2?155:460,i%2?360:320,i%2?'pull':'push',330,120),...(i>=3?[windDevice(310,510,'pull',200,90,2)]:[])]},
 enemies:positions.map(([x,y],j)=>({...i>=3&&j===0?lateBoss('インサイド',x,y,i===3?230000:370000,6,'#6d9daa'):{...foe4(x,y,38,19000+i*1300,j%2?'pierce':'homing'),key:'inner-'+j},internalWeak:true,weakRadius:12}))
}))};
for(const stage of [stage44,stage45,stage46]){CHAPTER_FOUR.push(stage);STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}
