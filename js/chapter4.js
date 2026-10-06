'use strict';
// 第4章：道中3エリア + 同じボスを追う2エリア。既存章のデータとは独立して編集できる。
const windDevice=(x,y,mode,radius=300,force=145,countdown=1)=>({x,y,mode,radius,force,countdown,interval:2});
const powerZone=(x,y,w,h)=>({x,y,w,h});
const foe4=(x,y,r=34,hp=4400,kind='homing')=>({...foe(x,y,r,hp,6,kind,2),attacks:[{kind,countdown:2,interval:2,mult:.34}]});
const boss4=(name,x,y,hp,sides,tint,attacks)=>core(x,y,66,hp,sides,attacks,{bossName:name,tint,weakAngles:[Math.PI/2,0,Math.PI,-Math.PI/2]});
const aeroAttacks=[{kind:'homing',count:4,mult:.2,countdown:1,interval:2},{kind:'pierce',count:3,mult:.22,countdown:2,interval:2},{kind:'photons',count:5,countdown:1,interval:2}];
const vectorAttacks=[{kind:'reflectLaser',bounces:2,mult:.16,countdown:2,interval:2},{kind:'spread',ways:8,volleys:1,mult:.13,countdown:1,interval:2},{kind:'vibration',radius:170,push:75,mult:.25,countdown:2,interval:2}];
const reactorAttacks=[{kind:'explosion',radius:160,maxHits:2,mult:.2,countdown:1,interval:2},{kind:'pierce',count:3,mult:.2,countdown:2,interval:2},{kind:'reflectLaser',bounces:2,mult:.15,countdown:2,interval:2}];
const CHAPTER_FOUR=[
  {id:'4-1',name:'風が運ぶ光の航路',hint:'ウィンド・エナジーフォトン。風は敵ターンに作動し、敵に引っかかると止まる。アンチウィンドで位置を保ち、光を集めて風核を追おう。',waves:[
    {name:'引き寄せる風の庭',step:'INWARD',gimmicks:{winds:[windDevice(310,250,'pull',360,155)],photons:points([[135,420],[245,470],[375,470],[485,420]])},enemies:[foe4(170,155),foe4(450,155),orb(235,335,36,4200),orb(385,335,36,4200)]},
    {name:'吹き出す外周路',step:'OUTWARD',gimmicks:{winds:[windDevice(310,325,'push',340,170)],photons:points([[105,320],[515,320],[180,540],[440,540]])},enemies:[foe4(95,170),foe4(525,170),foe4(130,415),foe4(490,415)]},
    {name:'交差する二つの風',step:'CROSSWIND',gimmicks:{winds:[windDevice(155,220,'pull',230,130),windDevice(470,400,'push',230,135,2)],photons:points([[300,230],[170,440],[350,505],[470,575]])},enemies:[foe4(275,140,36,4800),foe4(130,365,34,4500,'pierce'),foe4(365,320,38,5000),foe4(465,530,32,3900)]},
    {name:'風核・エアロとの遭遇',step:'AERO / 1',bossPhase:1,gimmicks:{winds:[windDevice(180,365,'pull',320,160)],photons:points([[105,490],[255,520],[390,420],[500,340]])},enemies:[boss4('エアロ',440,195,38000,6,'#4c9d9a',aeroAttacks),foe4(220,210,34,5500),foe4(335,420,34,5000)]},
    {name:'風核・エアロを追撃',step:'AERO / 2',bossPhase:2,gimmicks:{winds:[windDevice(400,390,'push',350,160),windDevice(110,450,'pull',200,105,2)],photons:points([[125,380],[255,380],[365,520],[510,500]])},enemies:[boss4('エアロ',180,200,48000,6,'#4c9d9a',aeroAttacks),foe4(465,175,34,5500),foe4(365,360,37,6000)]}
  ]},
  {id:'4-2',name:'風向きの転送迷宮',hint:'ワープ・ダメージウォール・ウィンド・加速パネル。風に運ばれた先の壁に注意。カイトのアンチウィンド＋アンチダメージウォールが有効。道中3エリアの先で転送核を2回追う。',waves:[
    {name:'風が導く転送口',step:'WIND GATE',gimmicks:{winds:[windDevice(135,450,'pull',260,120)],warps:[{a:{x:135,y:465},b:{x:490,y:135},r:24}],walls:[{side:'right',start:130,end:440,damage:420}],boosts:[{x:360,y:485,r:24}]},enemies:[foe4(175,155,35,4600),foe4(440,270,36,4800),foe4(290,350,35,4800)]},
    {name:'危険な横風',step:'SIDE DRAFT',gimmicks:{winds:[windDevice(310,320,'push',330,150)],warps:[{a:{x:110,y:505},b:{x:510,y:195},r:24}],walls:[{side:'left',start:130,end:510,damage:430},{side:'right',start:250,end:620,damage:430}],boosts:[{x:210,y:460,r:23},{x:410,y:460,r:23}]},enemies:[foe4(125,220,36,4600),foe4(495,350,36,4600),foe4(310,135,37,5500),foe4(310,520,33,3900)]},
    {name:'上下の境界を抜けて',step:'UPDRAFT',gimmicks:{winds:[windDevice(310,115,'pull',370,145)],warps:[{a:{x:165,y:520},b:{x:445,y:295},r:25},{a:{x:475,y:540},b:{x:140,y:195},r:25}],walls:[{side:'top',start:95,end:525,damage:460},{side:'bottom',start:150,end:480,damage:460}],boosts:[{x:310,y:470,r:24}]},enemies:[foe4(235,225,37,5400),foe4(390,225,37,5400),foe4(150,380,34,4700),foe4(475,390,34,4700)]},
    {name:'転送核・ベクトルの守り',step:'VECTOR / 1',bossPhase:1,gimmicks:{winds:[windDevice(470,410,'push',330,140)],warps:[{a:{x:125,y:525},b:{x:490,y:170},r:24}],walls:[{side:'left',start:160,end:570,damage:440},{side:'top',start:120,end:490,damage:440}],boosts:[{x:300,y:475,r:25}]},enemies:[boss4('ベクトル',230,185,40000,4,'#8d7ebb',vectorAttacks),foe4(420,315,34,5400),foe4(155,365,34,5400)]},
    {name:'転送核・ベクトルの逃走先',step:'VECTOR / 2',bossPhase:2,gimmicks:{winds:[windDevice(150,430,'pull',290,145),windDevice(475,210,'push',230,100,2)],warps:[{a:{x:120,y:520},b:{x:485,y:395},r:25},{a:{x:490,y:585},b:{x:195,y:140},r:25}],walls:[{side:'right',start:130,end:570,damage:440},{side:'bottom',start:135,end:515,damage:440}],boosts:[{x:310,y:495,r:25}]},enemies:[boss4('ベクトル',390,220,51000,4,'#8d7ebb',vectorAttacks),foe4(150,220,36,5700),foe4(280,390,36,5700)]}
  ]},
  {id:'4-3',name:'四倍の力を宿す領域',hint:'パワーエリア・重力バリア・ブロック。金色のエリア内にいる味方は全ダメージ4倍。高HPの敵をエリア内から殴り、味方を中に置いて友情も強化。',waves:[
    {name:'金色の両岸',step:'POWER BANKS',gimmicks:{powerAreas:[powerZone(45,90,205,350),powerZone(370,90,205,350)],blocks:[block(275,245,70,125)]},enemies:[gravity(foe4(145,185,38,16000),115),gravity(foe4(475,185,38,16000),115),foe4(145,350,35,14000),foe4(475,350,35,14000)]},
    {name:'斜めに結ぶ領域',step:'DIAGONAL',gimmicks:{powerAreas:[powerZone(55,90,275,230),powerZone(295,335,265,230)],blocks:[block(355,110,50,190),block(190,355,50,155)]},enemies:[gravity(foe4(150,170,38,18000),115),foe4(265,245,33,14000),gravity(foe4(445,410,38,18000),115),foe4(350,490,32,14000)]},
    {name:'二重の反応帯',step:'POWER GAPS',gimmicks:{powerAreas:[powerZone(60,95,500,165),powerZone(100,330,420,185)],blocks:[block(70,285,160,30),block(390,285,160,30),block(290,370,40,100)]},enemies:[gravity(orb(230,175,42,20000),125),gravity(orb(385,175,42,20000),125),foe4(210,425,37,17500),foe4(415,425,37,17500)]},
    {name:'力核・ヘリオンを崩せ',step:'HELION / 1',bossPhase:1,gimmicks:{powerAreas:[powerZone(170,65,350,290),powerZone(65,365,205,180)],blocks:[block(330,405,50,130),block(70,265,60,70)]},enemies:[gravity(boss4('ヘリオン',350,205,144000,8,'#b9993e',reactorAttacks),155),foe4(165,440,38,21000),foe4(475,295,37,17000)]},
    {name:'力核・ヘリオンと最後の共鳴',step:'HELION / 2',bossPhase:2,gimmicks:{powerAreas:[powerZone(65,105,335,290),powerZone(310,395,235,205)],blocks:[block(435,135,50,165),block(150,430,115,35),block(350,340,130,30)]},enemies:[gravity(boss4('ヘリオン',235,245,184000,8,'#b9993e',reactorAttacks),165),gravity(foe4(455,485,38,24000),115),foe4(135,360,34,18000)]}
  ]}
];
for(const stage of CHAPTER_FOUR){
  for(const wave of stage.waves)for(const e of wave.enemies)for(const a of e.attacks){a.countdown=1+((a.countdown??2)-1)%2;a.interval=1+((a.interval??2)-1)%2;}
  STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;
}
