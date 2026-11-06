'use strict';
// ステージ：第1〜3章（旧 data.js）・第4章・第4章後半・第5章。ステージを増やすときはここに追加する。
// 敵のビルダー関数は enemies.js、ギミックの処理は enemy-gimmicks.js。data.js・enemies.js の後に読み込む。

  // ステージを増やすときは、この配列に { id, name, waves } を追加するだけです。
  // wave: { name, step, enemies: [{ x, y, r, hp, countdown, sides, boss?, attacks }] }
  const STAGES = [
    {
      id: '1-1', name: 'はじまりの幾何',
      waves: [
        { name: '静寂の庭', step: 'FIRST CONTACT', enemies: [
          { x: 178, y: 190, r: 31, hp: 1000, countdown: 2, sides: 6, attacks: [{ kind: 'sniper' }] },
          { x: 442, y: 190, r: 31, hp: 1000, countdown: 3, sides: 6, attacks: [{ kind: 'sniper' }] },
          { x: 310, y: 344, r: 35, hp: 1500, countdown: 2, sides: 4, attacks: [{ kind: 'homing', count: 3 }] },
        ] },
        { name: '共鳴する回廊', step: 'CROSS FIRE', enemies: [
          { x: 156, y: 183, r: 29, hp: 1050, countdown: 2, sides: 3, attacks: [{ kind: 'laser' }] },
          { x: 464, y: 183, r: 29, hp: 1050, countdown: 3, sides: 3, attacks: [{ kind: 'laser' }] },
          { x: 215, y: 342, r: 33, hp: 1450, countdown: 2, sides: 6, attacks: [{ kind: 'explosion' }] },
          { x: 405, y: 342, r: 33, hp: 1450, countdown: 3, sides: 6, attacks: [{ kind: 'homing', count: 3 }] },
        ] },
        { name: '幾何の心臓', step: 'THE CORE', enemies: [
          { x: 310, y: 214, r: 65, hp: 6600, countdown: 3, sides: 8, boss: true, attacks: [{ kind: 'laser', mult: 0.3 }, { kind: 'homing', count: 5, mult: 0.22 }, { kind: 'explosion', mult: 0.2 }] },
          { x: 146, y: 389, r: 30, hp: 1100, countdown: 2, sides: 4, attacks: [{ kind: 'sniper' }] },
          { x: 474, y: 389, r: 30, hp: 1100, countdown: 3, sides: 4, attacks: [{ kind: 'homing', count: 3 }] },
        ] },
      ],
    },
  ];
  STAGES.push(
    { id: '1-2', name: '星降る回廊', waves: [
      { name: '流星の入口', step: 'METEOR GATE', enemies: [
        { x: 175, y: 195, r: 32, hp: 1700, sides: 6, attacks: [{ kind: 'meteor', count: 2, countdown: 2, interval: 3 }] },
        { x: 445, y: 195, r: 32, hp: 1700, sides: 6, attacks: [{ kind: 'homing', count: 3, countdown: 3, interval: 3 }] },
        { x: 310, y: 355, r: 35, hp: 2200, sides: 4, attacks: [{ kind: 'sniper', countdown: 2, interval: 2 }, { kind: 'spread', ways: 8, volleys: 2, countdown: 4, interval: 4 }] }
      ] },
      { name: '交差する星屑', step: 'STAR CROSS', enemies: [
        { x: 155, y: 205, r: 34, hp: 2100, sides: 6, attacks: [{ kind: 'meteor', count: 3, countdown: 3, interval: 3 }, { kind: 'laser', countdown: 3, interval: 4 }] },
        { x: 465, y: 205, r: 34, hp: 2100, sides: 6, attacks: [{ kind: 'meteor', count: 2, countdown: 2, interval: 3 }] },
        { x: 220, y: 370, r: 30, hp: 1400, sides: 3, attacks: [{ kind: 'homing', countdown: 2, interval: 3 }] },
        { x: 400, y: 370, r: 30, hp: 1400, sides: 3, attacks: [{ kind: 'laser', countdown: 3, interval: 3 }] }
      ] },
      { name: '星核・アストラ', step: 'ASTRA CORE', enemies: [
        { x: 310, y: 215, r: 66, hp: 13000, sides: 6, boss: true, weakAngle: Math.PI / 2, attacks: [{ kind: 'meteor', count: 4, mult: .23, countdown: 2, interval: 3 }, { kind: 'spread', ways: 12, volleys: 2, mult: .16, countdown: 3, interval: 3 }, { kind: 'laser', mult: .25, countdown: 5, interval: 5 }] },
        { x: 155, y: 380, r: 30, hp: 1500, sides: 4, attacks: [{ kind: 'sniper', countdown: 3, interval: 3 }] },
        { x: 465, y: 380, r: 30, hp: 1500, sides: 4, attacks: [{ kind: 'homing', count: 3, countdown: 2, interval: 3 }] }
      ] }
    ] },
    { id: '1-3', name: '黄金の万華鏡', waves: [
      { name: '金色の波紋', step: 'GOLD RIPPLE', enemies: [
        { x: 175, y: 195, r: 34, hp: 2300, sides: 8, attacks: [{ kind: 'spread', ways: 12, volleys: 2, countdown: 2, interval: 3 }, { kind: 'sniper', countdown: 4, interval: 4 }] },
        { x: 445, y: 195, r: 34, hp: 2300, sides: 8, attacks: [{ kind: 'spread', ways: 12, volleys: 2, countdown: 3, interval: 3 }] },
        { x: 310, y: 355, r: 36, hp: 2600, sides: 6, attacks: [{ kind: 'meteor', count: 3, countdown: 2, interval: 3 }] }
      ] },
      { name: '双星の共鳴', step: 'TWIN CORES', enemies: [
        { x: 185, y: 225, r: 49, hp: 6200, sides: 8, boss: true, weakAngle: Math.PI / 3, attacks: [{ kind: 'spread', ways: 16, volleys: 2, mult: .13, countdown: 3, interval: 3 }, { kind: 'meteor', count: 2, mult: .2, countdown: 3, interval: 4 }] },
        { x: 435, y: 225, r: 49, hp: 6200, sides: 6, boss: true, weakAngle: Math.PI * 2 / 3, attacks: [{ kind: 'laser', mult: .22, countdown: 2, interval: 3 }, { kind: 'homing', count: 4, mult: .18, countdown: 4, interval: 4 }] },
        { x: 310, y: 400, r: 30, hp: 1700, sides: 4, attacks: [{ kind: 'sniper', countdown: 3, interval: 3 }] }
      ] },
      { name: '黄金核・ヘリオス', step: 'HELIOS CORE', enemies: [
        { x: 310, y: 225, r: 70, hp: 18500, sides: 8, boss: true, weakAngle: Math.PI / 2, attacks: [{ kind: 'spread', ways: 16, volleys: 3, mult: .14, countdown: 2, interval: 3 }, { kind: 'meteor', count: 4, mult: .22, countdown: 3, interval: 3 }, { kind: 'homing', count: 5, mult: .18, countdown: 5, interval: 4 }] },
        { x: 145, y: 395, r: 32, hp: 2100, sides: 6, attacks: [{ kind: 'laser', countdown: 2, interval: 3 }, { kind: 'sniper', countdown: 4, interval: 4 }] },
        { x: 475, y: 395, r: 32, hp: 2100, sides: 6, attacks: [{ kind: 'meteor', count: 2, countdown: 3, interval: 3 }] }
      ] }
    ] }
  );
  STAGES.push(
    {id:'1-4',name:'斜光の迷宮',hint:'斜めに並ぶ敵の列を、壁の反射で横から崩そう。',waves:[
      {name:'千鳥の門',step:'ZIGZAG GATE',enemies:[foe(130,160,34,1800),foe(280,230,38,2300,4,'laser'),foe(460,155,34,1800,3,'homing',4),foe(185,365,36,2100,6,'meteor'),foe(415,365,36,2100,6,'homing',4),foe(300,465,28,1400,3)]},
      {name:'折り重なる光',step:'CROSS LAYERS',enemies:[foe(100,210,34,1800,4),foe(270,150,36,2100,6,'meteor',4),foe(450,220,36,2100,4,'laser'),foe(165,380,38,2400,6,'spread',4),foe(335,320,38,2400,6,'homing'),foe(500,430,32,1700,3)]},
      {name:'斜光核・ルクス',step:'LUX CORE',enemies:[core(430,180,62,15000,6,[{kind:'laser',mult:.22,countdown:3,interval:3},{kind:'meteor',count:3,mult:.19,countdown:4,interval:4}],{weakAngle:Math.PI}),foe(285,230,38,2500,4,'homing'),foe(480,335,38,2500,4,'spread',4),foe(120,180,32,1500),foe(145,360,34,1800,3,'laser',4),foe(315,450,32,1700)]}
    ]},
    {id:'1-5',name:'螺旋の天球',hint:'外周の敵を崩して内側へ。ウェーブを越えて位置取りを活かそう。',waves:[
      {name:'環をほどく',step:'OUTER ORBIT',enemies:[foe(310,120,32,1700,3,'laser',4),foe(155,220,36,2000),foe(465,220,36,2000,6,'homing',4),foe(190,405,36,2000,4,'meteor',4),foe(430,405,36,2000,4,'spread',4),foe(310,285,45,3400,8,'homing')]},
      {name:'偏心の螺旋',step:'ECCENTRIC',enemies:[foe(160,150,34,1600),foe(345,120,38,2100,6,'laser',4),foe(480,260,37,2200,6,'spread',4),foe(400,440,35,2000,4,'meteor',4),foe(205,435,38,2200,6,'homing'),foe(110,300,34,1800,3),core(290,280,48,6500,6,[{kind:'homing',count:4,mult:.17,countdown:4,interval:4}],{weakAngle:Math.PI/2})]},
      {name:'天球核・オルビス',step:'ORBIS CORE',enemies:[core(310,265,64,18000,8,[{kind:'spread',ways:16,volleys:2,mult:.12,countdown:3,interval:4},{kind:'meteor',count:4,mult:.18,countdown:4,interval:4}],{weakAngle:Math.PI/2}),foe(175,135,35,2300,6,'laser',4),foe(445,135,35,2300,6,'homing'),foe(130,320,37,2300,4,'spread',4),foe(490,320,37,2300,4,'meteor',4),foe(235,465,34,1900),foe(385,465,34,1900)]}
    ]},
    {id:'1-6',name:'双円の反響',hint:'丸い敵の隙間は62px。浅い角度で入り、左右にカンカンして一気に削ろう。',waves:[
      {name:'双円の入口',step:'TWIN GAPS',enemies:[orb(170,200,44,3500,'sniper'),orb(320,200,44,3500,'homing',4),orb(300,390,44,3500,'sniper'),orb(450,390,44,3500,'meteor',4)]},
      {name:'交互の反響',step:'OFFSET PAIRS',enemies:[orb(150,175,46,4200,'laser',4),orb(304,175,46,4200,'homing'),orb(310,365,46,4200,'spread',4),orb(464,365,46,4200,'sniper'),orb(125,435,32,1900,'meteor',4)]},
      {name:'反響核・エコー',step:'ECHO CORE',enemies:[core(238,235,74,21000,0,[{kind:'spread',ways:16,volleys:2,mult:.12,countdown:3,interval:4},{kind:'meteor',count:3,mult:.2,countdown:4,interval:4}],{shape:'circle',weakAngle:0}),orb(426,235,52,8200,'homing',4),orb(190,435,42,3900,'sniper'),orb(336,435,42,3900,'laser',4)]}
    ]}
  );
  for (const wave of STAGES.find(s=>s.id==='1-6').waves) for(const enemy of wave.enemies) enemy.r=Math.round(enemy.r*.94);
  STAGES.find(s=>s.id==='1-6').hint='少し広がった丸い敵の隙間へ。浅い角度で入り、左右にカンカンして一気に削ろう。';
  STAGES.push(
    {id:'2-1',name:'加速する転送路',hint:'緑の加速パネルは1ショットに1回加速。紫のワープは進行方向を保って対の出口へ。赤い壁は接触ダメージ。',waves:[
      {name:'緑光の滑走路',step:'BOOST LANE',gimmicks:{boosts:[{x:170,y:465,r:27},{x:450,y:465,r:27}]},enemies:[foe(160,190,36,2600,6,'homing'),foe(460,190,36,2600,6,'laser'),foe(240,350,36,2300),foe(380,350,36,2300,4,'meteor')]},
      {name:'折り畳む軌道',step:'WARP ROUTE',gimmicks:{boosts:[{x:310,y:475,r:27}],warps:[{a:{x:95,y:520},b:{x:525,y:150},r:23}]},enemies:[foe(190,160,36,2600),foe(340,250,40,3300,8,'spread'),foe(170,365,34,2400,4,'laser'),foe(465,345,34,2400,6,'homing')]},
      {name:'転送核・ゲート',step:'GATE CORE',gimmicks:{boosts:[{x:310,y:505,r:27}],warps:[{a:{x:100,y:530},b:{x:520,y:135},r:23}],walls:[{side:'left',start:110,end:400,damage:420},{side:'right',start:320,end:615,damage:420}]},enemies:[core(310,190,63,19000,8,[{kind:'homing',count:4,mult:.16,countdown:2,interval:2},{kind:'laser',mult:.2,countdown:1,interval:2}]),foe(175,350,35,2600,6,'meteor'),foe(445,350,35,2600,6,'spread'),foe(310,395,32,1800)]}
    ]},
    {id:'2-2',name:'境界のラビリンス',hint:'赤い壁を避ける軌道を探そう。ワープと加速をつなぎ、敵の密集地へ入り込め。',waves:[
      {name:'赤い境界',step:'RED BORDER',gimmicks:{boosts:[{x:310,y:510,r:27}],walls:[{side:'left',start:160,end:510,damage:450},{side:'right',start:160,end:510,damage:450}]},enemies:[foe(180,165,35,2200,6,'laser'),foe(440,165,35,2200,6,'laser'),foe(230,315,40,2900,8,'homing'),foe(390,315,40,2900,8,'spread'),foe(310,435,30,1700)]},
      {name:'二重の転送環',step:'DOUBLE WARP',gimmicks:{boosts:[{x:310,y:490,r:27}],warps:[{a:{x:90,y:510},b:{x:500,y:130},r:23},{a:{x:530,y:510},b:{x:120,y:130},r:23}],walls:[{side:'top',start:210,end:410,damage:450},{side:'left',start:245,end:400,damage:450}]},enemies:[foe(310,165,43,4400,8,'meteor'),foe(165,300,34,2300,4,'homing'),foe(455,300,34,2300,4,'spread'),foe(235,410,32,2100),foe(385,410,32,2100)]},
      {name:'境界核・ネクサス',step:'NEXUS CORE',gimmicks:{boosts:[{x:190,y:495,r:27},{x:430,y:495,r:27}],warps:[{a:{x:92,y:555},b:{x:520,y:135},r:23}],walls:[{side:'left',start:130,end:430,damage:500},{side:'right',start:265,end:605,damage:500},{side:'top',start:200,end:405,damage:500}]},enemies:[core(310,210,68,23500,8,[{kind:'spread',ways:12,volleys:2,mult:.12,countdown:1,interval:2},{kind:'meteor',count:3,mult:.18,countdown:2,interval:2}]),orb(200,385,41,4200,'homing'),orb(350,385,41,4200,'laser'),foe(475,365,30,2100)]}
    ]}
  );

  const points=coords=>coords.map(([x,y])=>({x,y}));
  STAGES.push(
    {id:'2-3',name:'重力の岸壁',hint:'青い円は重力バリア。アンチ重力バリアで減速を無効化し、壁際の敵を連続反射で削ろう。',waves:[
      {name:'岸壁の縦列',step:'GRAVITY COAST',gimmicks:{boosts:[{x:310,y:490,r:27}],photons:points([[210,440],[410,440]])},enemies:[gravity(orb(104,145,32,2700)),gravity(orb(104,285,32,2700)),gravity(orb(516,215,32,2700)),gravity(orb(516,355,32,2700)),foe(310,270,35,3100,6,'homing')]},
      {name:'天井の包囲網',step:'CEILING ARC',gimmicks:{boosts:[{x:170,y:460,r:27},{x:450,y:460,r:27}],photons:points([[170,350],[450,350],[310,450]])},enemies:[gravity(orb(145,100,32,2800)),orb(310,100,32,2800),gravity(orb(475,100,32,2800)),gravity(scatter(foe(230,260,38,4000,6,'homing'),'photons')),foe(390,260,38,3300,4,'laser')]},
      {name:'重力核・グラビス',step:'GRAVIS CORE',gimmicks:{boosts:[{x:310,y:500,r:27}],photons:points([[240,400],[380,400],[460,490]])},enemies:[gravity(core(145,205,62,21000,8,[{kind:'homing',count:4,mult:.15,countdown:1,interval:2},{kind:'photons',count:4,countdown:2,interval:2}],{weakAngle:Math.PI}),145),orb(145,395,35,3800),gravity(orb(480,150,35,3500)),gravity(orb(480,320,35,3500)),foe(325,285,32,2400)]}
    ]},
    {id:'2-4',name:'地雷の結晶庭',hint:'赤い地雷は接触で爆発。マインスイーパーで回収するとフォトンに変わる。黄色い結晶も回収し、密集陣へ。',waves:[
      {name:'結晶の密集陣',step:'CRYSTAL CLUSTER',gimmicks:{mines:points([[180,430],[270,460],[350,460],[440,430]]),photons:points([[150,520],[470,520]])},enemies:[foe(245,190,30,2300),foe(375,190,30,2300),scatter(foe(310,290,36,3800,8,'homing'),'mines'),foe(205,360,30,2300),foe(415,360,30,2300)]},
      {name:'斜めの地雷帯',step:'MINE DIAGONAL',gimmicks:{mines:points([[140,230],[240,320],[340,410],[440,500]]),photons:points([[100,460],[200,500],[490,240]]),boosts:[{x:310,y:535,r:27}]},enemies:[scatter(foe(130,130,34,3500,4,'laser'),'mines'),foe(290,170,32,2700),foe(440,290,34,2900,6,'homing'),scatter(foe(180,390,34,3500),'photons'),foe(490,430,30,2500)]},
      {name:'結晶核・マイカ',step:'MICA CORE',gimmicks:{mines:points([[160,420],[260,450],[360,450],[460,420]]),photons:points([[110,530],[510,530],[310,540]])},enemies:[core(310,185,63,23500,8,[{kind:'mines',count:5,countdown:1,interval:2},{kind:'spread',ways:12,volleys:2,mult:.12,countdown:2,interval:2}]),foe(205,320,32,3200),foe(310,350,32,3200),foe(415,320,32,3200),scatter(foe(500,145,30,2700),'photons')]}
    ]},
    {id:'2-5',name:'光子の双城',hint:'黄色いフォトンは最大4個。直殴りで1個消費しダメージ2倍。左右の壁際に陣取る敵へ運ぼう。',waves:[
      {name:'左右の砦',step:'TWIN FORTS',gimmicks:{photons:points([[250,480],[310,450],[370,480],[310,530]]),walls:[{side:'left',start:90,end:390,damage:420}]},enemies:[gravity(orb(110,150,34,3700)),orb(110,310,34,3700),gravity(orb(510,150,34,3700)),orb(510,310,34,3700),scatter(foe(310,245,35,3400),'photons')]},
      {name:'壁際の搬送路',step:'PHOTON DELIVERY',gimmicks:{photons:points([[200,450],[310,475],[420,450]]),mines:points([[260,350],[360,350]]),warps:[{a:{x:105,y:520},b:{x:510,y:105},r:23}],boosts:[{x:420,y:525,r:27}]},enemies:[scatter(foe(110,180,34,3300),'photons'),gravity(orb(110,345,36,4200)),foe(310,130,34,3300,4,'laser'),gravity(orb(510,270,36,4200)),scatter(foe(410,350,30,3000),'mines')]},
      {name:'双城核・ジェミナ',step:'GEMINA CORES',gimmicks:{photons:points([[250,490],[310,450],[370,490],[310,540]]),boosts:[{x:110,y:500,r:27},{x:510,y:500,r:27}],walls:[{side:'right',start:95,end:390,damage:430}]},enemies:[gravity(core(125,200,54,15000,6,[{kind:'photons',count:4,countdown:1,interval:2},{kind:'laser',mult:.18,countdown:2,interval:2}],{weakAngle:Math.PI}),125),gravity(core(495,200,54,15000,8,[{kind:'mines',count:3,countdown:2,interval:2},{kind:'homing',count:3,mult:.16,countdown:1,interval:2}],{weakAngle:0}),125),orb(220,365,35,3700),orb(400,365,35,3700)]}
    ]},
    {id:'2-6',name:'万象の反応炉',hint:'全ギミックが集結。対応アビリティを編成し、地雷とフォトンを攻撃力へ。最後は壁際の核を狙おう。',waves:[
      {name:'圧縮する陣形',step:'COMPRESSION',gimmicks:{photons:points([[220,480],[400,480]]),mines:points([[140,430],[310,450],[480,430]]),boosts:[{x:310,y:535,r:27}]},enemies:[gravity(orb(235,180,36,4200)),gravity(orb(385,180,36,4200)),scatter(foe(310,300,36,4200,6,'homing'),'mines'),orb(170,330,32,3000),orb(450,330,32,3000)]},
      {name:'封鎖と転送',step:'LOCK AND SHIFT',gimmicks:{mines:points([[160,440],[310,490],[460,440]]),photons:points([[240,400],[380,400]]),warps:[{a:{x:100,y:530},b:{x:520,y:130},r:23}],walls:[{side:'left',start:80,end:400,damage:460}],boosts:[{x:440,y:535,r:27}]},enemies:[gravity(orb(105,140,34,4100)),gravity(orb(105,300,34,4100)),scatter(foe(310,160,38,4400,6,'meteor'),'photons'),foe(455,270,35,3700,4,'laser'),scatter(foe(310,330,35,3900),'mines')]},
      {name:'反応核・リアクター',step:'REACTOR CORE',gimmicks:{mines:points([[160,420],[270,450],[380,450]]),photons:points([[100,520],[230,530],[380,530],[510,520]]),boosts:[{x:310,y:590,r:27}],warps:[{a:{x:90,y:350},b:{x:520,y:470},r:23}],walls:[{side:'right',start:80,end:360,damage:480},{side:'top',start:240,end:550,damage:480}]},enemies:[gravity(core(460,165,65,28500,8,[{kind:'mines',count:4,countdown:1,interval:2},{kind:'photons',count:3,countdown:2,interval:2},{kind:'spread',ways:12,volleys:2,mult:.12,countdown:2,interval:2}],{weakAngle:0}),155),gravity(orb(165,155,38,4500)),orb(165,300,38,4500),foe(335,330,34,3500,6,'homing'),foe(465,330,34,3500,4,'laser')]}
    ]}
  );
  const block=(x,y,w,h)=>({x,y,w,h});
  const partition=[block(28,352,188,36),block(216,352,188,36),block(404,352,188,36)];
  STAGES.push(
    {id:'3-1',name:'隔壁の要塞',hint:'ブロック・ダメージウォール。灰色の隔壁で反射し、上下の赤い壁にも注意。装甲兵は友情で崩そう。',waves:[
      {name:'隔壁の入口',step:'BLOCK GATE',gimmicks:{blocks:[block(190,265,85,38),block(345,265,85,38)],walls:[{side:'top',start:140,end:480,damage:420},{side:'bottom',start:150,end:470,damage:420}]},enemies:[specialist('turret',130,155),specialist('lancer',490,155),specialist('sentinel',310,155,36,4400),foe(155,410,32,2700),foe(465,410,32,2700)]},
      {name:'折れた防壁',step:'BROKEN RAMPART',gimmicks:{blocks:[block(190,190,40,185),block(390,300,40,180)],walls:[{side:'top',start:65,end:350,damage:440},{side:'bottom',start:300,end:560,damage:440},{side:'left',start:310,end:500,damage:440}]},enemies:[specialist('turret',110,180),specialist('lancer',310,155),specialist('turret',505,245),specialist('sentinel',310,420,38,5000),foe(110,435,32,3000)]},
      {name:'要塞核・バスティオン',step:'BASTION CORE',gimmicks:{blocks:[block(175,295,100,38),block(345,295,100,38),block(290,450,40,85)],walls:[{side:'top',start:170,end:450,damage:480},{side:'bottom',start:100,end:520,damage:480},{side:'right',start:300,end:520,damage:480}]},enemies:[core(310,160,65,27000,8,[{kind:'reflectLaser',bounces:2,mult:.2,countdown:1,interval:2},{kind:'pierce',count:3,mult:.22,countdown:2,interval:2}]),specialist('turret',115,345),specialist('lancer',505,345),specialist('sentinel',200,450,34,4400),specialist('sentinel',420,450,34,4400)]}
    ]},
    {id:'3-2',name:'分断された転送城',hint:'ブロック・ワープ。中央の隔壁で上下が分断。対のワープで渡ろう。アンチブロックなら直通でき、アンチワープだけでは転送できない。',waves:[
      {name:'上下の境界',step:'DIVIDED FIELD',gimmicks:{blocks:partition,warps:[{a:{x:135,y:490},b:{x:470,y:260},r:26},{a:{x:480,y:525},b:{x:150,y:260},r:26}]},enemies:[specialist('turret',150,135),specialist('lancer',470,135),specialist('sentinel',310,220,38,4700),foe(310,485,34,2900)]},
      {name:'転送の交差点',step:'CROSS TRANSFER',gimmicks:{blocks:[...partition,block(290,90,40,100)],warps:[{a:{x:110,y:480},b:{x:500,y:230},r:26},{a:{x:505,y:555},b:{x:120,y:230},r:26}]},enemies:[specialist('turret',165,120),specialist('turret',455,120),specialist('lancer',310,280),specialist('sentinel',220,485,35,4200),specialist('lancer',405,470)]},
      {name:'転送核・ヤヌス',step:'JANUS CORE',gimmicks:{blocks:partition,warps:[{a:{x:120,y:505},b:{x:495,y:265},r:26},{a:{x:500,y:505},b:{x:125,y:265},r:26}]},enemies:[core(310,145,64,29000,6,[{kind:'pierce',count:3,mult:.24,countdown:1,interval:2},{kind:'reflectLaser',bounces:2,mult:.2,countdown:2,interval:2}]),specialist('turret',200,275,30,3500),specialist('lancer',420,275,30,3500),specialist('sentinel',230,485,35,4500),specialist('sentinel',390,485,35,4500)]}
    ]}
  );
  STAGES.push(
    {id:'3-3',name:'光子の重力環',hint:'重力バリア・フォトン・ブロック。丸いボスの弱点は毎ターン、下→右→上→左へ移動。位置を読んでフォトンを運ぼう。',waves:[
      {name:'環の入口',step:'PHOTON RING',gimmicks:{blocks:[block(240,285,140,36)],photons:points([[150,480],[250,510],[370,510],[470,480]])},enemies:[gravity(orb(150,175,35,3500)),gravity(orb(470,175,35,3500)),scatter(specialist('lancer',310,160),'photons'),specialist('sentinel',170,365,34,4100),specialist('sentinel',450,365,34,4100)]},
      {name:'偏心の重力',step:'SHIFTING ORBIT',gimmicks:{blocks:[block(185,170,40,180),block(395,310,40,165)],photons:points([[120,445],[290,460],[350,500],[500,500]])},enemies:[gravity(specialist('turret',105,160),110),gravity(orb(315,185,42,4900),130),scatter(specialist('lancer',500,230),'photons'),gravity(orb(280,370,37,4200),115),specialist('sentinel',125,360,32,3600)]},
      {name:'環核・セレーネ',step:'SELENE CORE',gimmicks:{blocks:[block(170,330,100,36),block(350,330,100,36)],photons:points([[130,475],[250,480],[370,480],[490,475]])},enemies:[gravity(core(310,195,73,30000,0,[{kind:'photons',count:4,countdown:1,interval:2},{kind:'reflectLaser',bounces:2,mult:.2,countdown:2,interval:2}],{shape:'circle',tint:'#9b85c5',weakAngles:[Math.PI/2,0,-Math.PI/2,Math.PI]}),175),specialist('lancer',110,360,31,3300),specialist('lancer',510,360,31,3300),gravity(orb(310,440,35,4800),110)]}
    ]},
    {id:'3-4',name:'転位する三角星',hint:'重力バリア・ワープ。三角形のボスは毎ターン3つの頂点へ弱点を移す。ワープで攻める側を切り替えよう。',waves:[
      {name:'三点の転送',step:'TRIANGLE ROUTE',gimmicks:{warps:[{a:{x:110,y:515},b:{x:510,y:130},r:24},{a:{x:505,y:520},b:{x:105,y:135},r:24}]},enemies:[gravity(specialist('turret',310,135,36,3800),130),gravity(orb(175,290,36,4000)),gravity(orb(445,290,36,4000)),specialist('lancer',245,450,31,3200),specialist('lancer',375,450,31,3200)]},
      {name:'対角の双核',step:'TWIN SHIFT',gimmicks:{warps:[{a:{x:95,y:490},b:{x:490,y:130},r:24},{a:{x:520,y:490},b:{x:125,y:130},r:24}]},enemies:[gravity(core(210,245,48,9500,4,[{kind:'pierce',count:3,mult:.18,countdown:1,interval:2}],{tint:'#77a8bd',weakAngle:Math.PI/2,weakAngles:[Math.PI/2,0,-Math.PI/2,Math.PI]}),125),gravity(core(410,245,48,9500,4,[{kind:'reflectLaser',bounces:2,mult:.17,countdown:2,interval:2}],{tint:'#77a8bd',weakAngle:-Math.PI/2,weakAngles:[-Math.PI/2,Math.PI,Math.PI/2,0]}),125),specialist('sentinel',310,425,38,4900)]},
      {name:'三角核・トリア',step:'TRIA CORE',gimmicks:{warps:[{a:{x:105,y:525},b:{x:495,y:170},r:25},{a:{x:510,y:525},b:{x:125,y:175},r:25}]},enemies:[gravity(core(310,220,77,33000,3,[{kind:'pierce',count:3,mult:.22,countdown:1,interval:2},{kind:'reflectLaser',bounces:2,mult:.2,countdown:2,interval:2}],{tint:'#65a5ad',weakAngle:-Math.PI/2,weakAngles:[-Math.PI/2,Math.PI/6,Math.PI*5/6]}),185),specialist('turret',175,400,32,3800),specialist('lancer',445,400,32,3800),gravity(orb(310,490,34,4400),100)]}
    ]}
  );
  const wallMines=()=>[...Array.from({length:8},(_,i)=>[{x:62,y:110+i*70},{x:558,y:110+i*70}]).flat(),...Array.from({length:7},(_,i)=>[{x:105+i*68,y:65},{x:105+i*68,y:674}]).flat()];
  STAGES.push(
    {id:'3-5',name:'崩れた幾何迷宮',hint:'ギミックはブロックのみ。細い横道と斜めの抜け道を探そう。ボスの爆発と振動で位置取りが変わる。',waves:[
      {name:'散らばる瓦礫',step:'SCATTERED RUINS',gimmicks:{blocks:[block(65,230,55,40),block(180,120,45,55),block(320,110,75,35),block(475,225,65,45),block(230,255,40,85),block(355,280,70,35),block(125,380,80,40),block(300,420,40,65),block(445,420,55,75)]},enemies:[specialist('turret',110,130),specialist('lancer',460,135),specialist('sentinel',315,215,34,4000),foe(110,505,30,2800),foe(405,500,30,2800)]},
      {name:'歪んだ通り道',step:'BROKEN PATHS',gimmicks:{blocks:[block(70,120,55,45),block(255,85,45,65),block(410,100,65,40),block(170,245,70,35),block(345,235,35,90),block(485,300,55,40),block(65,365,55,75),block(245,400,55,45),block(395,440,55,40)]},enemies:[specialist('turret',180,155),specialist('lancer',500,185),specialist('sentinel',270,320,35,4700),specialist('lancer',165,480),foe(490,505,30,3000)]},
      {name:'迷宮核・ラブル',step:'RUBBLE CORE',gimmicks:{blocks:[block(75,125,40,75),block(470,100,55,40),block(160,280,80,38),block(370,295,70,38),block(70,380,45,55),block(275,355,40,70),block(475,400,65,35),block(165,480,65,38),block(350,485,55,38)]},enemies:[core(300,165,65,32000,5,[{kind:'explosion',radius:165,maxHits:2,mult:.2,countdown:1,interval:2},{kind:'vibration',radius:230,push:115,mult:.4,countdown:2,interval:2},{kind:'reflectLaser',bounces:2,mult:.17,countdown:2,interval:2}],{tint:'#a58377',weakAngles:[Math.PI/2,0,Math.PI]}),specialist('turret',125,300,30,3400),specialist('lancer',495,275,30,3400),foe(205,405,30,2900),foe(410,400,30,2900)]}
    ]},
    {id:'3-6',name:'雷壁の挟撃回廊',hint:'ギミックは地雷のみ。壁沿いの地雷を避け、丸い敵同士の隙間で連続反射。マインスイーパーは除去のみ。',waves:[
      {name:'雷壁の双円',step:'MINED TWIN GAPS',gimmicks:{mines:wallMines()},enemies:[orb(215,200,44,5300,'sniper'),orb(365,200,44,5300,'homing'),orb(255,410,42,5000,'sniper'),orb(401,410,42,5000,'homing')]},
      {name:'交差する挟撃',step:'OFFSET PINCH',gimmicks:{mines:wallMines()},enemies:[orb(200,175,44,5700,'homing'),orb(350,175,44,5700,'sniper'),orb(280,390,44,5700,'homing'),orb(430,390,44,5700,'sniper'),{...specialist('lancer',115,355,30,3200),attacks:[{kind:'mines',count:8,wall:true,countdown:1,interval:2}]}]},
      {name:'雷壁核・クランプ',step:'CLAMP CORE',gimmicks:{mines:wallMines()},enemies:[core(230,230,68,35000,0,[{kind:'mines',count:10,wall:true,countdown:1,interval:2},{kind:'vibration',radius:200,push:90,mult:.35,countdown:2,interval:2},{kind:'explosion',radius:155,maxHits:2,mult:.18,countdown:2,interval:2}],{shape:'circle',tint:'#b59253',weakAngles:[0,Math.PI/2,Math.PI]}),orb(410,230,50,11000,'homing'),orb(210,450,42,5400,'sniper'),orb(356,450,42,5400,'homing')]}
    ]}
  );
  const STAGE_GIMMICKS={
    '3-5':['blocks'],'3-6':['mines'],
    '3-3':['gravity','photons','blocks'],'3-4':['gravity','warps'],
    '3-1':['blocks','walls'],'3-2':['blocks','warps'],
    '2-1':['boosts','warps'],'2-2':['warps','walls'],'2-3':['gravity','photons'],
    '2-4':['mines','boosts'],'2-5':['gravity','walls'],'2-6':['gravity','mines','boosts']
  };
  for(const stage of STAGES){const allowed=STAGE_GIMMICKS[stage.id];if(!allowed)continue;
    for(const wave of stage.waves){
      for(const key of Object.keys(wave.gimmicks||{}))if(!allowed.includes(key))delete wave.gimmicks[key];
      for(const e of wave.enemies){if(!allowed.includes('gravity'))delete e.gravity;e.attacks=e.attacks.filter(a=>!['mines','photons'].includes(a.kind)||allowed.includes(a.kind));}
    }
  }
  const stageUpdates={
    '2-1':['加速する転送路','ギミック：加速パネル・ワープ。加速と転送をつないで敵へ。'],
    '2-2':['境界のラビリンス','ギミック：ワープ・ダメージウォール。危険な壁を避ける転送ルートを探そう。'],
    '2-3':['重力の岸壁','ギミック：重力バリア・エナジーフォトン。結晶を回収し、壁際の敵へ強化した一撃を。'],
    '2-4':['地雷の結晶庭','ギミック：地雷・加速パネル。地雷を避けるか除去し、加速して密集陣へ。'],
    '2-5':['双城の防衛線','ギミック：重力バリア・ダメージウォール。左右の壁際に構える敵を崩そう。'],
    '2-6':['万象の反応炉','ギミック：重力バリア・地雷・加速パネル。3種類の対策を組み合わせ、右上の核へ。']
  };
  for(const stage of STAGES)if(stageUpdates[stage.id]){[stage.name,stage.hint]=stageUpdates[stage.id];}
  const twinStage=STAGES.find(s=>s.id==='2-5');twinStage.waves[1].name='壁際の防衛線';twinStage.waves[1].step='WALL DEFENSE';
  STAGES.find(s=>s.id==='2-6').waves[1].name='重力の封鎖';STAGES.find(s=>s.id==='2-6').waves[1].step='GRAVITY LOCK';
  for(const stage of STAGES)for(const wave of stage.waves)for(const enemy of wave.enemies)for(const attack of enemy.attacks){
    attack.countdown=1+((attack.countdown??enemy.countdown??2)-1)%2;
    attack.interval=1+((attack.interval??enemy.countdown??2)-1)%2;
  }
  const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]));

// ===== 第4章 =====
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


// ===== 第4章後半（4-4〜4-6） =====
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
 enemies:positions.map(([x,y],j)=>({...i>=3&&j===0?lateBoss('インサイド',x,y,i===3?230000:370000,6,'#6d9daa'):{...foe4(x,y,38,28500+i*1950,j%2?'pierce':'homing'),key:'inner-'+j},internalWeak:true,weakRadius:12}))
}))};
for(const stage of [stage44,stage45,stage46]){CHAPTER_FOUR.push(stage);STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}


// ===== 第4章の雑魚を新旧の種類へ再編成（enemies.js の variedFoe を使用） =====
// Reuse chapter 2/3 silhouettes alongside the new families in every chapter 4 area.
const chapter4Families=['lancer','turret','orb','cruciform','sentinel','starBattery','bomber'];
for(const [si,stage] of CHAPTER_FOUR.entries())for(const [wi,wave] of stage.waves.entries()){
 let index=0;
 wave.enemies=wave.enemies.map(e=>{
  if(e.boss||e.restriction)return e;
  const family=chapter4Families[(si*2+wi+index++)%chapter4Families.length],v=variedFoe(family,e.x,e.y,e.r,e.hp);
  return {...e,...v,shape:v.shape||'polygon'};
 });
}

// ===== 第5章 =====
// Chapter 5: three approach areas, followed by two encounters with the same boss.
const chapter5Attack=(kind,extra={})=>({kind,countdown:2,interval:2,mult:.24,...extra});
const chapter5Boss=(name,x,y,hp,tint,attacks)=>({...boss4(name,x,y,hp,8,tint,attacks),key:'boss',weakAngles:undefined});
// New damage-wall stages should use variedWallSides; all four sides are an explicit exception.
const variedWallSides=i=>[['top','right'],['bottom','left'],['top','left'],['bottom','right'],['top','bottom']][i%5];
const chapter5Walls=i=>variedWallSides(i).map(side=>({side,start:65,end:['top','bottom'].includes(side)?555:665,damage:600}));
const chapter5SealLayouts=[
 {seals:[[115,325],[235,420],[385,325],[505,420]],guards:[[160,145],[450,155],[310,250]],blocks:[[275,345,70,28]]},
 {seals:[[125,210],[255,320],[385,430],[510,315]],guards:[[310,125],[115,445],[490,120]],blocks:[[160,300,38,90],[440,430,38,90]]},
 {seals:[[110,355],[235,255],[385,355],[510,255]],guards:[[150,115],[460,115],[310,490]],blocks:[[275,170,70,30],[275,400,70,30]]},
 {seals:[[115,310],[245,395],[375,310],[505,395]],guards:[[115,135],[505,135],[310,510]],boss:[310,175],blocks:[[155,475,55,28],[410,475,55,28]]},
 {seals:[[125,250],[250,365],[380,475],[505,350]],guards:[[125,100],[500,130],[130,480]],boss:[340,180],blocks:[[255,480,35,65],[410,265,60,25]]}
];
const stage51={id:'5-1',name:'八倍の弱点と封印の守護者',weakMultiplier:8,hint:'反射で貫通制限と雑魚の弱点を狙おう。ボス戦は貫通制限以外の雑魚を全滅させるとボスの被ダメージが4倍。ハートパネルは踏むたびHP200回復。',waves:chapter5SealLayouts.map((l,i)=>{
 const seals=l.seals.map((p,j)=>'seal-'+j);
 const enemies=l.seals.map(([x,y],j)=>({...restrictionFoe(seals[j],x,y,'pierce',[seals[(j+1)%seals.length]]),crossSkull:undefined,attacks:[{kind:'revive',targets:[seals[(j+1)%seals.length]],countdown:2,interval:2},chapter5Attack(j%2?'homing':'plusLaser',{mult:.18,count:2,hits:1})]}));
 const guardKeys=l.guards.map((p,j)=>'guard-'+j);
 enemies.push(...l.guards.map(([x,y],j)=>({...variedFoe(['turret','bomber','starBattery'][(i+j)%3],x,y,33,21750+i*2250),key:guardKeys[j],weakPoint:{angle:[Math.PI/2,0,-Math.PI/2,Math.PI][(i+j)%4],radius:15},...(i>=3?{crossSkull:'guardSeal'}:{})})));
 if(i>=3)enemies.push(chapter5Boss('ヴェール',...l.boss,i===3?315000:420000,'#aa729b',[chapter5Attack('crossLaser'),chapter5Attack('homing',{count:4,countdown:1}),chapter5Attack('meteor',{count:3})]));
 return {name:['弱点を結ぶ入口','隔壁と回復の小径','交互に狙う八倍の光','封印王・ヴェール','封印王の最終防壁'][i],step:i<3?'SEAL '+(i+1):'VEIL / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),enemies,
  gimmicks:{walls:chapter5Walls(i),blocks:l.blocks.map(p=>block(...p)),hearts:[{id:'heart-left',x:80,y:560,r:25},{id:'heart-right',x:540,y:560,r:25}]},
  ...(i>=3?{crossSkulls:[{id:'guardSeal',members:guardKeys,effects:[{type:'defenseDown',targets:['boss'],multiplier:4}]}]}:{})};
})};
const relayLayouts=[[[135,210],[250,310],[365,410],[485,300],[375,130]],[[115,155],[255,245],[410,350],[490,505],[160,440]],[[150,430],[265,330],[380,230],[495,130],[150,150]],[[310,165],[150,300],[260,415],[405,490],[495,310]],[[310,180],[470,300],[355,420],[195,490],[105,300]]];
const stage52={id:'5-2',name:'十二倍の光を渡す一筆',weakMultiplier:12,hint:'金色の内部弱点は一つ。触れると次の生存敵へ移動する。貫通で順番を結ぼう。ボスは3ターンごとに雑魚を全蘇生する。',waves:relayLayouts.map((positions,i)=>{
 const boss=i>=3,keys=positions.map((_,j)=>boss&&j===0?'boss':'relay-'+j),mobKeys=keys.filter(k=>k!=='boss');
 const enemies=positions.map(([x,y],j)=>({...(boss&&j===0?chapter5Boss('オルド',x,y,i===3?189000:270000,'#708fb9',[{kind:'revive',targets:mobKeys,countdown:3,interval:3},chapter5Attack('plusLaser'),chapter5Attack('homing',{count:3,mult:.2})]):variedFoe(['lancer','starBattery','orb','turret','bomber'][(i+j)%5],x,y,34,12400+i*300)),key:keys[j],internalWeak:true,weakEnabled:false,armor:1,
  ...(!boss?{attacks:[{kind:'revive',targets:[keys[(j+1)%keys.length]],countdown:2,interval:2},chapter5Attack(j%2?'pierce':'crossLaser',{count:2,hits:1,mult:.18})]}:{})}));
 return {name:['ひとつの光の巡回','転送する筆先','蘇る星の順番','巡光王・オルド','巡光王の無限軌道'][i],step:i<3?'RELAY '+(i+1):'ORDO / '+(i-2),...(boss?{bossPhase:i-2}:{}),enemies,
  weakRoutes:[{id:'internalRelay',positions:keys.map(target=>({target,internal:true,radius:13,offset:0}))}],
  gimmicks:{warps:[{a:{x:i%2?505:100,y:550},b:{x:i%2?110:515,y:100},r:23},...(i===2?[{a:{x:310,y:560},b:{x:90,y:260},r:22}]:[])]}};
})};
const forgeLayouts=[
 {zones:[[55,245,175,210],[390,245,175,210]],guards:[[140,350],[480,350]],outer:[[165,115],[455,120],[310,270],[310,505]]},
 {zones:[[55,110,175,230],[390,350,175,210]],guards:[[140,230],[480,455]],outer:[[355,130],[475,225],[130,455],[295,375]]},
 {zones:[[65,350,180,210],[370,105,185,235]],guards:[[155,455],[460,225]],outer:[[125,150],[275,265],[465,475],[310,590]]},
 {zones:[[55,295,180,230],[385,295,180,230]],guards:[[145,400],[475,400]],outer:[[310,160],[110,150],[510,150],[310,520]]},
 {zones:[[55,105,180,235],[385,335,180,230]],guards:[[145,225],[475,450]],outer:[[385,165],[130,470],[295,390],[510,275]]}
];
const stage53={id:'5-3',name:'力の炉と癒やしの火種',hint:'金色の領域の重力兵を倒すとハートパネルが出現。領域内に味方を置き、4倍の友情で領域外の高HPの敵を攻撃しよう。地雷と風にも注意。',waves:forgeLayouts.map((l,i)=>{
 const enemies=l.guards.map(([x,y],j)=>({...gravity(variedFoe('sentinel',x,y,34,11500+i*800),88),key:'keeper-'+j,skullEffects:[{type:'heartPanel',panel:{id:'forge-heart-'+j,x,y,r:28}}]}));
 enemies.push(...l.outer.map(([x,y],j)=>i>=3&&j===0?chapter5Boss('フォルナクス',x,y,i===3?195000:260000,'#b49154',[chapter5Attack('crossLaser'),chapter5Attack('meteor',{count:3}),chapter5Attack('vibration',{radius:180,push:85,mult:.3})]):({...variedFoe(['bomber','cruciform','turret','starBattery'][(i+j)%4],x,y,34,48000+i*4500),key:'outer-'+j})));
 return {name:['二つの力の炉','斜めに渡る火種','風に運ぶ友情','炉心王・フォルナクス','炉心王との共鳴決戦'][i],step:i<3?'FORGE '+(i+1):'FORNAX / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),enemies,
  gimmicks:{powerAreas:l.zones.map(p=>powerZone(...p)),winds:[windDevice(...l.guards[i%2],'pull',230,100,2)],mines:[{x:280,y:90},{x:330,y:555},{x:75,y:600},{x:545,y:615},{x:285,y:465},{x:340,y:330}].filter(p=>!enemies.some(e=>Math.hypot(p.x-e.x,p.y-e.y)<e.r+22)).map(p=>({...p,damage:800}))}};
})};
// Full-side slow walls. Retention is the speed remaining after contact.
const slowBoundary=side=>({side,start:28,end:['top','bottom'].includes(side)?592:712,retention:.35});
const finaleSeals=(positions,types,group='seal')=>positions.map(([x,y],j)=>{
 const kind=types[j%types.length],target=Array.from({length:positions.length-1},(_,step)=>(j+step+1)%positions.length).find(k=>types[k%types.length]===kind),targets=target===undefined?[]:['seal-'+target];
 return {...restrictionFoe('seal-'+j,x,y,kind,targets),crossSkull:group,attacks:[{kind:'revive',targets,countdown:3,interval:3},chapter5Attack(j%2?'homing':'crossLaser',{mult:.14,count:2,hits:1})]};
});
const photonLayouts=[
 {feeds:[[100,190],[510,435]],mobs:[[300,140],[450,255],[185,365],[330,490]],boosts:[[110,505],[460,535]]},
 {feeds:[[510,130],[110,445]],mobs:[[165,145],[315,255],[465,370],[320,500]],boosts:[[95,300],[505,540]]},
 {feeds:[[310,115],[310,495]],mobs:[[115,245],[505,245],[175,410],[445,410]],boosts:[[110,540],[505,540],[310,315]]},
 {feeds:[[100,180],[510,430]],mobs:[[310,185],[140,360],[355,450]],boosts:[[95,520],[490,545],[480,150]]},
 {feeds:[[510,120],[105,440]],mobs:[[330,220],[140,180],[455,445],[300,525]],boosts:[[105,550],[510,555],[300,90]]}
];
const stage54={id:'5-4',name:'光子を纏う霧の回廊',noWeakPoints:true,photonMultiplier:14,hint:'散布兵に触れてフォトンを補給。反撃すると次ターンまで透明化する。加速パネルで周回し、14倍のフォトン直殴りで敵を削ろう。散布兵は他の敵を倒せば撤退。',waves:photonLayouts.map((l,i)=>{
 const enemies=l.feeds.map(([x,y],j)=>({...variedFoe('cruciform',x,y,30,9000000),key:'feeder-'+j,retreatWhenAlone:true,counterEffects:[{type:'photons',count:3},{type:'transparent'}],attacks:[chapter5Attack('photons',{count:2,countdown:2,interval:2})]}));
 enemies.push(...l.mobs.map(([x,y],j)=>i>=3&&j===0?chapter5Boss('ネブラ',x,y,i===3?120000:180000,'#6597b1',[chapter5Attack('homing',{count:3,mult:.2}),chapter5Attack('crossLaser',{mult:.18}),chapter5Attack('vibration',{radius:175,push:60,mult:.25})]):({...variedFoe(['orb','lancer','bomber','starBattery'][(i+j)%4],x,y,34,20000+i*2500),key:'guard-'+j})));
 return {name:['霧の光子補給路','片面の青い境界','光子の周回軌道','霧王・ネブラ','霧王の光子回廊'][i],step:i<3?'PHOTON '+(i+1):'NEBULA / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),enemies,gimmicks:{slowWalls:[slowBoundary(['top','right','bottom','left','top'][i])],winds:[windDevice(310,330,i%2?'push':'pull',250,95,2)],photons:points([[170,530],[310,560],[510,315]]),boosts:l.boosts.map(([x,y])=>({x,y,r:24}))}};
})};
const dualSealLayouts=[
 [[105,145],[240,145],[375,145],[510,145],[170,285],[310,285],[450,285],[105,425],[240,425],[375,425],[510,425]],
 [[110,120],[270,150],[450,120],[175,255],[350,285],[510,245],[100,395],[260,425],[420,405],[510,535],[155,540]],
 [[110,140],[310,125],[510,140],[205,255],[415,255],[110,365],[310,365],[510,365],[205,485],[415,485],[310,555]],
 [[115,135],[505,135],[115,285],[505,285],[195,405],[330,405],[465,405],[115,535],[395,535]],
 [[105,120],[500,130],[130,285],[510,310],[220,405],[385,405],[105,505],[500,505],[310,545]]
];
const stage55={id:'5-5',name:'双撃の封印陣',hint:'反射と貫通を編成して両方の制限を処理。同じ撃種の制限敵だけが4ターンごとに蘇生。ボス戦は全制限撃破で防御ダウン6倍、地雷にも備えよう。',waves:dualSealLayouts.map((positions,i)=>{
 const types=positions.map((_,j)=>j%2?'pierce':'reflect'),sameTypeKeys=j=>positions.map((_,k)=>k!==j&&types[k]===types[j]?'seal-'+k:null).filter(Boolean);
 const enemies=positions.map(([x,y],j)=>({...restrictionFoe('seal-'+j,x,y,types[j],sameTypeKeys(j)),crossSkull:i<3?undefined:'seal',attacks:[{kind:'revive',targets:sameTypeKeys(j),countdown:4,interval:4},chapter5Attack(j%2?'homing':'crossLaser',{mult:.14,count:2,hits:1})]}));
 if(i>=3)enemies.push(chapter5Boss('ディオス',310,200,i===3?210000:280000,'#9d819f',[chapter5Attack('plusLaser'),chapter5Attack('homing',{count:3}),chapter5Attack('mines',{count:2})]));
 return {name:['二種の封印','交差する撃種','双撃の密集陣','双門王・ディオス','双門王の最終封印'][i],step:i<3?'DUAL SEAL '+(i+1):'DIOS / '+(i-2),...(i>=3?{bossPhase:i-2,crossSkulls:[{id:'seal',effects:[{type:'defenseDown',targets:['boss'],multiplier:6}]}]}:{}),enemies,gimmicks:{mines:i<3?[]:points([[80,355],[265,305],[385,305],[545,385],[170,605],[310,620],[465,605],[250,480]]).map(p=>({...p,damage:850}))}};
})};
const swordLayouts=[
 {seals:[[125,170],[305,270],[490,170],[170,450],[455,450]],swords:[[125,170],[305,270],[490,170],[170,450],[455,450],[100,570],[300,535],[515,570]],mobs:[[310,120],[110,320],[505,320]],blocks:[[215,345,65,32],[345,345,65,32]]},
 {seals:[[110,220],[310,140],[510,260],[250,420],[465,495]],swords:[[110,220],[310,140],[510,260],[250,420],[465,495],[105,530],[310,550],[490,120]],mobs:[[140,110],[380,310],[110,410]],blocks:[[185,265,80,30],[370,405,40,90]]},
 {seals:[[120,150],[500,150],[205,310],[415,310],[310,490]],swords:[[120,150],[500,150],[205,310],[415,310],[310,490],[105,570],[505,570],[310,220]],mobs:[[310,110],[105,410],[505,410]],blocks:[[255,315,110,30],[160,455,32,65],[430,455,32,65]]},
 {seals:[[100,330],[230,435],[390,435],[520,330]],swords:[[100,330],[230,435],[390,435],[520,330],[105,535],[310,540],[510,535],[100,120],[520,120]],boss:[310,190],blocks:[[142,95,38,200],[440,95,38,200]],mobs:[[150,425],[470,425]]},
 {seals:[[110,385],[255,455],[395,455],[515,385]],swords:[[110,385],[255,455],[395,455],[515,385],[105,550],[310,560],[515,550],[120,130],[500,130],[310,95]],boss:[310,230],blocks:[[142,125,38,205],[440,125,38,205]],mobs:[[110,250],[510,250]]}
];
const stage56={id:'5-6',name:'剣の回廊と内部の核',weakMultiplier:5,hint:'貫通で制限敵の下の剣パネルを踏み、直殴りを加算強化。ボスだけが中心弱点を持つ。左右のブロックの間へ入り、往復して内部弱点を狙おう。',waves:swordLayouts.map((l,i)=>{
 const enemies=finaleSeals(l.seals,['reflect'],undefined).map(e=>({...e,crossSkull:undefined,hp:5200}));
 enemies.push(...l.mobs.map(([x,y],j)=>({...variedFoe(['turret','bomber','orb'][(i+j)%3],x,y,31,10000+i*1200),key:'guard-'+j,weakEnabled:false})));
 if(i>=3)enemies.push({...chapter5Boss('エッジ',...l.boss,i===3?180000:250000,'#b68d50',[chapter5Attack('crossLaser',{mult:.2}),chapter5Attack('homing',{count:3,mult:.2}),chapter5Attack('explosion',{radius:145,mult:.18})]),internalWeak:true});
 return {name:['剣を繋ぐ小径','積み重なる刃','隔壁の剣陣','剣核王・エッジ','剣核王の狭間'][i],step:i<3?'SWORD '+(i+1):'EDGE / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),enemies,gimmicks:{swords:l.swords.map(([x,y])=>({x,y,r:22})),blocks:l.blocks.map(p=>block(...p)),slowWalls:[slowBoundary(['right','top','left','bottom','top'][i])],boosts:[{x:310,y:i>=3?350:610,r:24},{x:i%2?520:100,y:630,r:22}],warps:[{a:{x:70,y:490},b:{x:550,y:95},r:22}]}};
})};
const CHAPTER_FIVE=[stage51,stage52,stage53,stage54,stage55,stage56];
for(const stage of CHAPTER_FIVE){STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}

// Rotate legacy left/right wall arrangements; keep the deliberate four-wall 4-6 intact.
for(const [si,stage] of STAGES.entries())for(const [wi,wave] of stage.waves.entries()){
 const walls=wave.gimmicks?.walls;if(!walls?.length||stage.id==='4-6'||stage.id==='5-1'||walls.some(w=>['top','bottom'].includes(w.side)))continue;
 const sides=variedWallSides(si+wi);wave.gimmicks.walls=walls.map((w,j)=>({...w,side:sides[j%2],start:28+(w.start-28)*(['top','bottom'].includes(sides[j%2])?564/684:1),end:28+(w.end-28)*(['top','bottom'].includes(sides[j%2])?564/684:1)}));
}

// ===== 第6章：既存の敵・ギミック・エリア処理を利用 =====
const c6Wall=(side,damage=580)=>({side,start:28,end:['top','bottom'].includes(side)?592:712,damage});
const c6Slow=side=>({side,start:28,end:['top','bottom'].includes(side)?592:712,retention:.35});
const c6Attack=(kind,extra={})=>({kind,countdown:2,interval:2,mult:.2,...extra});
const c6Boss=(name,x,y,hp,tint,attacks)=>({...chapter5Boss(name,x,y,hp,tint,attacks),key:'boss'});
const c6Foe=(family,x,y,r,hp,key,extra={})=>({...variedFoe(family,x,y,r,hp),key,...extra});
const c6Layouts=[
 {m:[[140,155],[470,155],[180,390],[440,390]],s:[310,500]},
 {m:[[120,150],[500,155],[155,390],[465,390]],s:[310,285]},
 {m:[[115,180],[500,180],[310,395],[170,535]],s:[460,350]},
 {m:[[115,310],[505,310],[190,485]],s:[310,480],b:[310,170]},
 {m:[[110,350],[510,350],[175,490]],s:[310,470],b:[310,180]}
];
const stage61={id:'6-1',name:'三相の弱点解放',weakMultiplier:8,hint:'ダメージウォール・ワープ・重力バリア・地雷・ハートパネルが交差。ドクロ雑魚を倒すと防御ダウン。ボスは最初は弱点なし。ボス戦は召喚敵を全滅させるとボスへ弱点を付与。',waves:c6Layouts.map((l,i)=>{
 const enemies=l.m.map(([x,y],j)=>c6Foe(['turret','lancer','sentinel','bomber'][(i+j)%4],x,y,32,72000+i*700,'guard-'+j,{weakEnabled:false}));
 enemies.slice(0,2).forEach(e=>e.gravity=92);
 enemies.push(c6Foe('cruciform',...l.s,31,4000,'sigil',{skullEffects:[{type:'defenseDown',targets:'all',multiplier:20},...(i>=3?[{type:'summon',keys:['seal-a','seal-b']}]:[])]}));
 const reserves=i>=3?[{key:'seal-a',x:120,y:555,r:28,hp:2000,sides:4,tint:'#798b9c',crossSkull:'weakSeal',attacks:[c6Attack('homing',{count:2})]},{key:'seal-b',x:500,y:555,r:28,hp:2000,sides:5,tint:'#9a819c',crossSkull:'weakSeal',attacks:[c6Attack('crossLaser',{hits:1})]}]:[];
 if(i>=3)enemies.push({...c6Boss('アスペクト',...l.b,i===3?630000:840000,'#a3739b',[c6Attack('crossLaser'),c6Attack('homing',{count:4}),c6Attack('explosion',{radius:135})]),weakEnabled:false});
 return {name:['四相の番兵','封鎖の紋章','弱点を開く印','相界王・アスペクト','相界王の終端'][i],step:i<3?'ASPECT '+(i+1):'ASPECT / '+(i-2),...(i>=3?{bossPhase:i-2,crossSkulls:[{id:'weakSeal',members:{group:'weakSeal'},effects:[{type:'grantWeak',targets:['boss'],angle:-Math.PI/2,radius:16}]}]}:{}),enemies,reserves,gimmicks:{walls:[c6Wall(i%2?'top':'left'),c6Wall(i%2?'right':'bottom')],warps:[{a:{x:78,y:555},b:{x:542,y:105},r:22}],mines:[{x:160,y:265,damage:750},{x:450,y:260,damage:750},{x:310,y:430,damage:750}],hearts:[{x:95,y:620,r:23},{x:525,y:620,r:23}]}};
})};
const makeSwitches=(l,count)=>l.sw.slice(0,count).map(([x,y,initial])=>({x,y,r:24,initial}));
// 6-2：[x,y,family,r] の敵、[x,y,w,h] のブロック、[x,y,初期値] のスイッチ。ボスは boss:[x,y]。
const keyLayouts=[
 {m:[[480,114,'orb',34],[480,196,'lancer',36]],bl:[[152,135,229,42],[475,279,53,223]],sw:[[294,317,0],[294,447,0]]},
 {m:[[81,75,'turret',35],[81,639,'cruciform',34]],bl:[[180,267,54,209],[240,285,161,41],[406,267,54,205]],sw:[[197,230,0],[319,390,1]]},
 {m:[[302,123,'sentinel',37],[451,672,'bomber',34],[546,672,'starBattery',35]],bl:[[294,275,280,63],[42,461,337,73]],sw:[[115,399,0],[317,403,2],[500,403,2]]},
 {m:[[308,672,'lancer',35]],boss:[308,128],bl:[[79,221,154,41],[398,221,153,41],[232,488,153,41]],sw:[[129,436,0],[482,436,0],[308,595,1]]},
 {m:[[94,89,'orb',35],[532,665,'turret',35]],boss:[308,367],bl:[[144,256,59,236],[418,256,57,236]],sw:[[525,103,0],[124,615,1]]}
];
const keyBossAttacks=[[c6Attack('plusLaser'),c6Attack('homing',{count:4}),c6Attack('explosion',{radius:140})],[c6Attack('crossLaser'),c6Attack('meteor',{count:3}),c6Attack('vibration',{radius:170,push:70})]];
const stage62={id:'6-2',name:'三十倍の封鍵',noWeakPoints:true,switchMultiplier:30,hint:'全敵に弱点なし。ブロックを避けてパワースイッチを踏むたびに0→1→2と進み、すべて2（金色）にすると30倍の直殴りが可能。未点灯時は防御でダメージがほぼ通らない。エリアごとにスイッチの数と初期値が違う。',waves:keyLayouts.map((l,i)=>{
 const enemies=l.m.map(([x,y,family,r],j)=>c6Foe(family,x,y,r,i<3?95000+i*700:145000+(i-3)*900,'lock-'+j,{switchArmor:.018,weakEnabled:false}));
 if(l.boss)enemies.unshift({...c6Boss('ロック',...l.boss,i===3?410000:540000,'#827da7',keyBossAttacks[i-3]),switchArmor:.018,weakEnabled:false});
 return {name:['二つの錠','H字の小部屋','橙の錠と二枚の壁','錠王・ロック','双柱の錠王・ロック'][i],step:i<3?'LOCK '+(i+1):'LOCK / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),enemies,gimmicks:{powerSwitches:l.sw.map(([x,y,initial])=>({x,y,r:24,initial})),blocks:l.bl.map(b=>block(...b))}};
})};
const reactLayouts=[
 {a:[310,155],m:[[125,300],[500,300],[200,470],[420,485]]},
 {a:[120,350],m:[[300,150],[500,180],[330,390],[480,520]]},
 {a:[500,170],m:[[130,190],[315,290],[150,470],[420,470]]},
 {a:[310,160],m:[[140,300],[480,300],[175,490]],b:[310,485]},
 {a:[490,180],m:[[135,200],[185,405],[430,430]],b:[310,485]}
];
const stage63={id:'6-3',name:'一閃の反撃陣',hint:'全敵が反撃（各敵につき1ターンに1度だけ発動）。青い減速壁と風に注意。高体力の撤退敵の反撃で敵全体の防御が1ターン下がり、直後に集中攻撃。',waves:reactLayouts.map((l,i)=>{
 const enemies=[c6Foe('sentinel',...l.a,35,5200000+i*200000,'reactor',{retreatWhenAlone:true,counterEffects:[{type:'defenseDown',targets:'all',multiplier:8,durationTurns:1},{type:'transparent'}],attacks:[c6Attack('homing',{count:3})]})];
 enemies.push(...l.m.map(([x,y],j)=>c6Foe(['turret','bomber','orb','cruciform'][(i+j)%4],x,y,32,42000+i*800,'guard-'+j,{weakEnabled:false,counterEffects:[{type:'counterShot',damage:160+j*20}]})));
 if(i>=3)enemies.push({...c6Boss('ベクター',...l.b,i===3?145000:195000,'#6b9bb2',[c6Attack('plusLaser'),c6Attack('homing',{count:4}),c6Attack('vibration',{radius:180,push:75})]),counterEffects:[{type:'counterShot',damage:260}]});
 return {name:['反応の起点','風に潜む炉','重なる反撃','反応王・ベクター','反応王の残光'][i],step:i<3?'VECTOR '+(i+1):'VECTOR / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),enemies,gimmicks:{slowWalls:[c6Slow(i%2?'top':'left'),c6Slow(i%2?'bottom':'right')],winds:[windDevice(310,345,i%2?'push':'pull',250,100,2)]}};
})};

const loopLayouts=[
 {a:[140,300],b:[470,390],m:[[310,160],[310,520],[450,190]]},
 {a:[480,300],b:[135,425],m:[[310,150],[300,315],[220,530]]},
 {a:[130,460],b:[500,220],m:[[170,155],[310,300],[400,510]]},
 {a:[125,310],b:[500,385],m:[[150,150],[310,520],[455,185]]},
 {a:[490,320],b:[120,440],m:[[470,150],[310,520],[185,230]]}
];
const stage64={id:'6-4',name:'九倍の光子循環',photonMultiplier:9,hint:'減速壁4面でフォトン直殴り。青いドクロ雑魚を倒すとフォトンと反対側のドクロ雑魚を召喚。召喚側を倒すと元の雑魚が蘇生し、交互に循環する。最後に残れば撤退し、その際は召喚・蘇生は起きない。',waves:loopLayouts.map((l,i)=>{
 const a='loop-a',b='loop-b',source=c6Foe('cruciform',...l.a,31,2500+i*700,a,{retreatWhenAlone:true,skullEffects:[{type:'photons',count:3},{type:'summon',keys:[b],notOnRetreat:true}],attacks:[c6Attack('homing',{count:2})]}),reserve={key:b,x:l.b[0],y:l.b[1],r:31,hp:2500+i*800,sides:4,tint:'#5b91b4',retreatWhenAlone:true,skullEffects:[{type:'revive',targets:[a],notOnRetreat:true},{type:'photons',count:6}],attacks:[c6Attack('crossLaser',{hits:1})]};
 const enemies=[source,...l.m.map(([x,y],j)=>c6Foe(['orb','turret','lancer'][(i+j)%3],x,y,33,16500+i*850,'guard-'+j))];
 if(i>=3)enemies.push(c6Boss('ループ',310,185,i===3?150000:200000,'#5c8eaa',[c6Attack('crossLaser'),c6Attack('homing',{count:3}),c6Attack('explosion',{radius:150})]));
 return {name:['循環のドクロ','反転する召喚陣','絶えない供給','循環王・ループ','循環王の終端'][i],step:i<3?'LOOP '+(i+1):'LOOP / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),enemies,reserves:[reserve],gimmicks:{slowWalls:['left','right','top','bottom'].map(c6Slow),photons:points([[210,565],[310,565],[410,565],[210,245],[410,245]])}};
})};
// 6-5：m=[x,y,family] の敵、ar=[x,y,w,h] のパワーエリア(10倍)、sw=[x,y,初期値] のスイッチ。ボス弱点は毎ターン wk の2か所を交互に移動。
const tensorLayouts=[
{m:[[185,183,'sentinel'],[442,365,'turret']],ar:[[28,28,211,203],[380,268,212,206]],sw:[[449,168,0],[279,391,1]]},
{m:[[71,65,'lancer'],[475,108,'orb'],[136,529,'sentinel'],[140,675,'bomber']],ar:[[318,28,274,168],[28,528,226,184]],sw:[[313,319,0],[313,416,0]]},
{m:[[226,101,'turret'],[380,101,'cruciform'],[226,672,'starBattery'],[386,672,'sentinel']],ar:[[28,28,564,201],[28,508,206,204],[381,508,211,204]],sw:[[77,310,1],[530,442,1]]},
{m:[[68,64,'orb'],[69,676,'lancer'],[556,370,'sentinel']],ar:[[28,28,152,152],[28,180,564,119],[28,438,564,119],[28,557,150,155]],sw:[[400,54,1],[293,370,1],[477,687,1]],b:[105, 371],wk:[-Math.PI/2,Math.PI/2]},
{m:[[74,157,'bomber'],[235,157,'turret'],[550,676,'cruciform']],ar:[[28,28,253,487],[265,506,327,206]],sw:[[308,346,0],[568,288,1],[568,405,1]],b:[255, 538],wk:[-Math.PI/2,0]}
];
const stage65={id:'6-5',name:'百倍の力場',switchMultiplier:10,hint:'パワースイッチを揃えて攻撃10倍、橙のパワーエリア内から殴ってさらに10倍。合計100倍を前提とした高HPの敵。ボスの弱点は毎ターン2か所のどちらか片方に付く。ダメージウォールは4面。',waves:tensorLayouts.map((l,i)=>{
 const enemies=l.m.map(([x,y,family],j)=>c6Foe(family,x,y,36,84000+i*12000,'tensor-'+j,{switchArmor:.02,weakEnabled:false}));
 if(l.b)enemies.unshift({...c6Boss('テンサー',...l.b,i===3?600000:1400000,'#ad8a45',[c6Attack('crossLaser'),c6Attack('homing',{count:4}),c6Attack('explosion',{radius:145})]),weakAngles:l.wk});
 return {name:['角に潜む力場','散らばる橙の力場','三つの帯と門','力場王・テンサー','百倍王・テンサー'][i],step:i<3?'TENSOR '+(i+1):'TENSOR / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),enemies,gimmicks:{walls:['left','right','top','bottom'].map(side=>c6Wall(side,700)),powerAreas:l.ar.map(([x,y,w,h])=>({x,y,w,h,multiplier:10})),powerSwitches:l.sw.map(([x,y,initial])=>({x,y,r:24,initial}))}};
})};
const finaleLayouts=[
 {m:[[140,155],[470,155],[180,390],[440,390]],sw:[[150,550,0],[470,550,1],[310,450,0]],s:[[105,555],[310,535],[515,555],[310,335],[310,470]]},
 {m:[[150,150],[470,160],[145,440],[475,440]],areas:[[28,130,155,500],[437,130,155,500]]},
 {m:[[150,150],[470,150],[150,390],[470,390]],feeds:[[180,270],[440,270]]},
 {m:[[130,300],[490,300],[185,475],[435,475]]},
 {m:[[120,250],[500,250],[170,450],[450,450]],sw:[[95,565,0],[525,565,0]],bl:[[185,285,65,38],[370,285,65,38],[282,390,56,35]]}
];
const stage66={id:'6-6',name:'終局・多重機構の覇者',switchMultiplier:16,photonMultiplier:3,powerAreaMultiplier:8,weakMultiplier:4,hint:'エリアごとに仕掛けが切り替わる。剣パネル、力場、フォトンのドクロを使い分けよう。ボス1は雑魚を全滅させるクロスドクロでボスの防御が下がる。ボス2のボスは最初は弱点なし。雑魚を全滅させて弱点を出し、2つのパワースイッチを揃えて狙おう。',waves:finaleLayouts.map((l,i)=>{
 const enemies=l.m.map(([x,y],j)=>c6Foe(['orb','turret','bomber','starBattery'][(i+j)%4],x,y,33,6000+i*1600,'guard-'+j,{...(i===0?{weakPoint:{angle:[0,Math.PI/2,Math.PI,-Math.PI/2][j%4],radius:14}}:{weakEnabled:false}),...(i===2?{skullEffects:[{type:'photons',count:4}]}:{})}));
 if(i===2)enemies.push(c6Foe('cruciform',...l.feeds[0],28,6500,'feed-a',{skullEffects:[{type:'photons',count:2}],weakEnabled:false,attacks:[c6Attack('homing',{count:2})]}),c6Foe('cruciform',...l.feeds[1],28,5000,'feed-b',{skullEffects:[{type:'photons',count:4}],weakEnabled:false,attacks:[c6Attack('crossLaser',{hits:1})]}));
 if(i===2)enemies.push(c6Foe('starBattery',310,330,33,4000+i*1600,'photon-core',{weakEnabled:false,skullEffects:[{type:'photons',count:4}],attacks:[c6Attack('photons',{count:4})]}));
 if(i>=3)enemies.push({...c6Boss('キマイラ',310,i===3?175:180,i===3?410000:720000,'#ad706d',[c6Attack('crossLaser'),c6Attack('homing',{count:4}),c6Attack('vibration',{radius:180,push:65})]),...(i===4?{weakEnabled:false}:{})});
 const reserves=[],crossSkulls=[];
 if(i===3){crossSkulls.push({id:'bossGate',members:{group:'bossGate'},effects:[{type:'defenseDown',targets:['boss'],multiplier:8,durationTurns:3}]});for(const e of enemies)if(!e.boss){e.crossSkull='bossGate';e.internalWeak=true;e.weakEnabled=true;}}
 if(i===4){reserves.push({key:'sentry',x:145,y:535,r:29,hp:4000,sides:4,tint:'#6e91b0',crossSkull:'finalSummon',attacks:[c6Attack('homing',{count:2})]});crossSkulls.push({id:'finalSummon',members:{group:'finalSummon'},effects:[{type:'grantWeak',targets:['boss'],angle:Math.PI/2,radius:16}]});for(const e of enemies)if(!e.boss)e.crossSkull='finalSummon';}
 let gimmicks;
 if(i===0){enemies.slice(0,2).forEach(e=>e.gravity=82);gimmicks={swords:l.s.map(([x,y])=>({x,y,r:23}))};}
 if(i===1){enemies.slice(0,2).forEach(e=>e.gravity=90);gimmicks={slowWalls:[c6Slow('top'),c6Slow('bottom')],powerAreas:l.areas.map(([x,y,w,h])=>({x,y,w,h}))};}
 if(i===2)gimmicks={walls:[c6Wall('top')],winds:[windDevice(310,360,'pull',260,90,2)],photons:points([[220,570],[310,570],[400,570]])};
 if(i===3)gimmicks={walls:[c6Wall('left')],slowWalls:[c6Slow('right')]};
 if(i===4){enemies.slice(0,2).forEach(e=>e.gravity=95);gimmicks={winds:[windDevice(310,340,'push',240,90,2)],blocks:l.bl.map(b=>block(...b)),powerSwitches:makeSwitches(l,2)};}
 return {name:['剣刃の前哨','壁際の力場','光子のドクロ','防御崩しの関門','覇王キマイラとの決戦'][i],step:i<3?'CHIMERA '+(i+1):'CHIMERA / '+(i-2),...(i>=3?{bossPhase:i-2}:{}),...(i===4?{switchMultiplier:20}:{}),enemies,reserves,gimmicks,...(crossSkulls.length?{crossSkulls}:{})};
})};
const CHAPTER_SIX=[stage61,stage62,stage63,stage64,stage65,stage66];for(const stage of CHAPTER_SIX){STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}

// ===== 第7章：7-1 万力の回廊 / 7-2 風と雷原（スライド準拠・各ステージ道中3＋ボス2の5エリア） =====
// 7-1：重力バリア・ワープ・ブロック・弱点倍率9。雑魚は全員四角で弱点（黄色）を持つ。敵と敵の間に挟まって狙う。ボスの弱点は毎ターン移動。
// 7-2：地雷・ウィンド・ブロック・加速パネル・内部弱点（6倍）。ピンクの「地雷兵」は地雷をランダムに撒く。
// 座標はスライドを620×740の盤面へ換算した値。ワープの組み合わせはスライドに記載がないため、c7Warps で調整できる。
ENEMY_SPECIES.mineLayer='地雷兵';
const c7Attack=(kind,extra={})=>({kind,countdown:2,interval:2,mult:.2,...extra});
const c7Warps=(...pairs)=>pairs.map(([a,b])=>({a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]},r:22}));
const c7Mines=(coords,damage=750)=>coords.map(([x,y])=>({x,y,damage}));
const c7Boosts=coords=>coords.map(([x,y])=>({x,y,r:27}));
const c7Boss=(name,x,y,hp,tint,attacks,extra={})=>({...core(x,y,68,hp,0,attacks,{bossName:name,tint,shape:'circle',armor:1,...extra}),key:'boss'});
// 7-1 の雑魚：全員四角。weakAngle は弱点の向き（0=右、π/2=下、π=左、-π/2=上）。gravity は重力バリア半径。
const SQUARE_KINDS=['homing','laser','explosion','meteor','reflectLaser','pierce'];
const c7Square=(key,x,y,weakAngle,hp,n,extra={})=>{const kind=SQUARE_KINDS[n%SQUARE_KINDS.length];
 return {...foe(x,y,38,hp,4,kind,2),key,armor:1,tint:'#d98a7e',weakPoint:{angle:weakAngle,radius:15},
  attacks:[c7Attack(kind,kind==='homing'?{count:3}:kind==='explosion'?{radius:120,maxHits:3}:kind==='meteor'?{count:2}:{})],...extra};};
const C7P=Math.PI,C7H=Math.PI/2;
// [x, y, 弱点の向き, 重力バリア半径(省略可)]
const vise71=[
 {name:'挟まれた弱点',step:'CLAMP 1',
  e:[[104,96,C7P,80],[498,110,-C7H,80],[302,336,C7H],[302,482,-C7H]],
  warps:[[[132,288],[484,501]],[[482,289],[128,501]]]},
 {name:'十字の隙間',step:'CLAMP 2',
  e:[[306,70,C7H,80],[315,272,-C7H],[242,342,0],[388,342,C7P],[315,412,C7H],[316,670,-C7H,80]],
  warps:[[[83,274],[557,455]],[[417,159],[270,573]]]},
 {name:'転送する縦列',step:'CLAMP 3',
  e:[[74,78,0],[74,166,0],[74,254,0],[550,494,C7P],[550,582,C7P],[550,670,C7P]],
  blocks:[[275,28,69,254],[275,464,69,248]],
  warps:[[[309,323],[128,680]],[[309,406],[486,74]]]},
 {name:'万力王・ヴァイス',step:'VISE / 1',boss:[520,396,[-C7H,C7P,C7H],125],
  e:[[84,383,C7P,85],[520,222,C7H],[520,570,-C7H],[348,396,0]],
  warps:[[[211,102],[418,528]],[[234,631],[411,247]]]},
 {name:'万力王の終端',step:'VISE / 2',boss:[295,346,[-C7H,C7H]],
  e:[[295,170,C7H,80],[295,522,-C7H,80],[80,104,-C7H],[546,636,C7H]],
  warps:[[[52,346],[566,346]],[[142,346],[442,346]]]}
];
const stage71={id:'7-1',name:'九倍の挟撃回廊',weakMultiplier:9,hint:'重力バリア・ワープ・ブロック。雑魚は全員四角で、どの敵にも弱点がある。敵と敵の間に挟まって、向かい合う弱点を一撃でまとめて狙おう。ボスの弱点は毎ターン位置が変わる。弱点倍率は9倍。',
 waves:vise71.map((a,i)=>{
  const enemies=a.e.map(([x,y,w,g],j)=>c7Square('sq-'+j,x,y,w,26000+i*1500,j+i,g?{gravity:g}:{}));
  if(a.boss){const [bx,by,wa,bg]=a.boss;
   enemies.push(c7Boss('ヴァイス',bx,by,i===3?340000:460000,'#a8634f',i===3?[c7Attack('spread',{ways:8,volleys:1,mult:.12}),c7Attack('homing',{count:4,mult:.16}),c7Attack('explosion',{radius:140,mult:.2})]:[c7Attack('laser',{hits:3,mult:.16}),c7Attack('meteor',{count:3,mult:.16}),c7Attack('pierce',{count:3,mult:.2})],{shape:'octagon',sides:8,weakAngles:wa,...(bg?{gravity:bg}:{})}));}
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,
   gimmicks:{warps:c7Warps(...a.warps),...(a.blocks?{blocks:a.blocks.map(b=>block(...b))}:{})}};
 })};
// 7-2 の雑魚：今までの種類（反射砲台・貫通射手・装甲兵・球形兵・十字・星光・爆撃兵）をそのまま使用。全敵が内部弱点。
const c7Fam=['turret','lancer','orb','cruciform','sentinel','starBattery','bomber'];
const c7Foe=(key,n,x,y,hp)=>({...variedFoe(c7Fam[n%c7Fam.length],x,y,36,hp),key,internalWeak:true,weakRadius:12});
const c7MineLayer=(key,x,y,hp)=>({...foe(x,y,36,hp,0,'homing',1),key,armor:1,shape:'circle',tint:'#ee8fb9',species:'mineLayer',internalWeak:true,weakRadius:12,
 attacks:[{kind:'mines',count:5,countdown:1,interval:2}]});
const c7Wind=(x,y,mode,r,force=130)=>windDevice(x,y,mode,r,force,mode==='pull'?1:2);
// f=通常敵 [x,y]、m=地雷兵 [x,y]
const storm72=[
 {name:'地雷原の入口',step:'STORM 1',f:[[68,68],[68,246]],m:[[535,68]],
  mines:[[179,50],[179,96],[179,200],[179,284],[348,306],[484,368],[278,453],[437,521]],
  blocks:[[28,123,112,52],[28,317,112,51],[374,28,56,109],[376,133,150,51]],boosts:[[565,215],[269,299]],
  winds:[c7Wind(391,423,'pull',195)]},
 {name:'風に挟まれる通路',step:'STORM 2',f:[[298,166],[300,271],[212,672],[423,672]],m:[[314,672]],
  mines:[[142,86],[55,169],[148,221],[50,284],[553,86],[466,170],[558,221],[455,284],[50,605],[568,605]],
  blocks:[[194,108,53,285],[351,45,55,286],[91,582,443,48]],boosts:[[294,57],[305,397],[110,683],[548,683]],
  winds:[c7Wind(100,573,'push',210),c7Wind(497,445,'push',120)]},
 {name:'引き寄せる地雷庭',step:'STORM 3',f:[[384,155],[545,155],[68,570],[205,570]],m:[[303,351]],
  mines:[[50,119],[134,119],[218,119],[50,203],[134,203],[218,203],[404,531],[487,531],[568,531],[404,614],[487,614],[568,614]],
  blocks:[[251,94,55,190],[287,432,56,215]],boosts:[[274,57],[318,683]],
  winds:[c7Wind(160,237,'pull',200),c7Wind(460,508,'pull',200)]},
 {name:'暴風王・ミストラル',step:'MISTRAL / 1',boss:[315,365],f:[],m:[[315,64],[315,672]],
  mines:[[195,180],[319,180],[447,180],[535,291],[546,396],[510,477],[443,540],[317,572],[190,553],[106,462],[91,358],[121,248]],
  blocks:[[183,226,52,189],[402,321,55,189],[227,104,175,42],[227,590,175,42]],boosts:[[363,241],[267,497]],
  winds:[c7Wind(315,368,'push',251)]},
 {name:'暴風王の終端',step:'MISTRAL / 2',boss:[499,642],f:[[78,672],[216,672]],m:[[535,226],[532,341]],
  mines:[[156,53],[360,50],[63,138],[266,127],[365,177],[162,188],[52,252],[256,241],[134,328],[338,321],[50,410],[245,404],[140,463],[50,526],[233,520],[344,455]],
  blocks:[[416,151,55,245],[421,502,171,51],[309,613,56,99]],boosts:[[544,107],[235,308],[538,436],[360,553],[162,595]],
  winds:[c7Wind(175,156,'pull',240),c7Wind(422,570,'push',190)]}
];
const stage72={id:'7-2',name:'六倍の風と雷原',weakMultiplier:6,hint:'地雷・ウィンド・ブロック・加速パネル。全敵の中心に内部弱点があり、倍率は6倍。ピンクの地雷兵は地雷をランダムにばらまく。引き寄せ風と吹き出し風に流されないよう、加速パネルで中心を貫こう。',
 waves:storm72.map((a,i)=>{
  const hp=19000+i*1200,enemies=[...a.f.map(([x,y],j)=>c7Foe('foe-'+j,i+j,x,y,hp)),...a.m.map(([x,y],j)=>c7MineLayer('layer-'+j,x,y,hp))];
  if(a.boss)enemies.push({...c7Boss('ミストラル',a.boss[0],a.boss[1],i===3?230000:320000,'#c4577a',i===3?[c7Attack('vibration',{radius:170,push:70,mult:.25}),c7Attack('meteor',{count:3,mult:.16}),c7Attack('explosion',{radius:140,mult:.2})]:[c7Attack('reflectLaser',{bounces:2,mult:.16}),c7Attack('homing',{count:4,mult:.16}),{kind:'mines',count:6,countdown:2,interval:2}]),shape:'starBattery',sides:8,internalWeak:true,weakRadius:12});
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,
   gimmicks:{mines:c7Mines(a.mines),blocks:a.blocks.map(b=>block(...b)),boosts:c7Boosts(a.boosts),winds:a.winds}};
 })};
const CHAPTER_SEVEN=[stage71,stage72];for(const stage of CHAPTER_SEVEN){STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}

// ===== 第7章 後半：7-3 回遊する剣の蘇生陣 / 7-4 球体と貫通の封印 =====
// 7-3：ダメージウォール(2〜3面)・剣パネル・蘇生・敵移動・中ボス。
//   敵移動＝攻撃欄に { kind:'move', to:{x,y} } を追加（出発点と移動先を行ったり来たり）。雑魚は毎ターン、中ボス／ボスは3ターンごと。
//   蘇生＝{ kind:'revive', targets:'others', limit:2 }：自分・ボス・中ボス以外の倒れた雑魚（蘇生役を含む）から最大2体。
// 7-4：重力バリア・貫通制限・キューブ状態（ステージの cube:true）・中ボス・弱点倍率8・クロスドクロ→防御ダウン12倍。
const c7Reviver=(key,n,x,y,hp,moveTo)=>({...variedFoe(c7Fam[n%c7Fam.length],x,y,38,hp),key,tint:'#b78be6',
 attacks:[...variedFoe(c7Fam[n%c7Fam.length],x,y,38,hp).attacks.slice(0,1),...(moveTo?[{kind:'move',to:{x:moveTo[0],y:moveTo[1]},countdown:1,interval:1}]:[]),{kind:'revive',targets:'others',limit:2,countdown:2,interval:2}]});
const c7Normal=(key,n,x,y,hp,extra={})=>({...variedFoe(c7Fam[n%c7Fam.length],x,y,38,hp),key,...extra});
const c7Mid=(key,x,y,hp,weakAngles,attacks,extra={})=>({...foe(x,y,54,hp,0,'homing',2),key,armor:1,shape:'circle',tint:'#4a78c4',species:'midBoss',midBoss:true,weakAngles,weakPoint:{angle:weakAngles[0],radius:15},attacks,...extra});
const c7Swords=coords=>coords.map(([x,y])=>({x,y,r:24}));
// 7-3：[x,y] は通常の雑魚、rv は蘇生役 [x,y,移動先?]、swords は剣パネル、walls はダメージウォールの面
const nomad73=[
 {name:'蘇る六つの影',step:'NOMAD 1',walls:['top','right'],
  f:[[138,166],[308,168],[308,383],[476,383]],rv:[[476,166],[138,383]],
  swords:[[225,56],[398,56],[52,267],[305,267],[564,267],[223,489],[390,489]]},
 {name:'回遊する蘇生者',step:'NOMAD 2',walls:['left','bottom','right'],
  f:[],rv:[[169,208,[168,341]],[442,199,[307,201]],[163,488,[303,489]],[442,485,[441,338]]],
  swords:[[307,67],[57,264],[567,267],[303,337],[57,448],[566,445],[300,657]]},
 {name:'中ボス・ヴァグラント',step:'NOMAD 3',walls:['top','left'],f:[],rv:[],mid:[300,607,[298,121]],
  swords:[[90,101],[519,99],[298,255],[298,365],[298,476],[81,607],[523,618]]},
 {name:'回遊王・ノマド',step:'NOMAD / 1',walls:['top','bottom','right'],boss:[135,352,[Math.PI,0],[504,356]],
  f:[[135,192],[505,192],[135,504],[503,504]],rv:[[322,66,[323,662]]],
  swords:[[131,78],[499,83],[322,203],[323,358],[322,514],[135,644],[503,644]]},
 {name:'回遊王の終端',step:'NOMAD / 2',walls:['left','top','bottom'],boss:[488,114,[-Math.PI/2,0],[120,604]],
  f:[[121,467],[308,619]],rv:[[305,111,[119,333]],[488,271,[469,619]]],
  swords:[[140,159],[356,214],[239,293],[417,362],[264,438],[542,442],[404,517]]}
];
const stage73={id:'7-3',name:'回遊する剣の蘇生陣',hint:'ダメージウォール（2〜3面）・剣パネル・蘇生・敵移動・中ボス。灰色の破線円が敵の次の移動先。雑魚は毎ターン、中ボスとボスは3ターンごとに行ったり来たりする。紫の蘇生役は2ターンごとに倒れた雑魚を最大2体蘇生する。剣パネルを踏んで威力を加算しよう。',
 waves:nomad73.map((a,i)=>{
  const hp=8000+i*1200,enemies=[...a.f.map(([x,y],j)=>c7Normal('foe-'+j,i+j,x,y,hp)),...a.rv.map(([x,y,to],j)=>c7Reviver('rev-'+j,i+j+2,x,y,hp,to))];
  if(a.mid)enemies.push(c7Mid('mid',a.mid[0],a.mid[1],60000,[C7P,0],[c7Attack('homing',{count:4,mult:.22}),c7Attack('explosion',{radius:130,mult:.22}),{kind:'move',to:{x:a.mid[2][0],y:a.mid[2][1]},countdown:3,interval:3}]));
  if(a.boss)enemies.push(c7Boss('ノマド',a.boss[0],a.boss[1],i===3?100000:160000,'#d19a3e',i===3?[c7Attack('crossLaser',{mult:.2}),c7Attack('explosion',{radius:140,mult:.2}),{kind:'move',to:{x:a.boss[3][0],y:a.boss[3][1]},countdown:3,interval:3}]:[c7Attack('plusLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),{kind:'move',to:{x:a.boss[3][0],y:a.boss[3][1]},countdown:3,interval:3}],{shape:'hexagon',sides:6,weakAngles:a.boss[2]}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,gimmicks:{walls:a.walls.map(s=>c6Wall(s,560)),swords:c7Swords(a.swords)}};
 })};
// 7-4：g=[x,y,弱点の向き] 重力バリア付きの雑魚、s=[x,y] 貫通制限（灰）、mid=中ボス、boss=ボス
const sealGrey=(key,n,x,y,peers)=>({...foe(x,y,38,3000,0,'homing',3),key,armor:1,shape:'circle',restriction:'pierce',crossSkull:'seal',tint:'#8e9aab',
 attacks:[{kind:'revive',targets:peers,countdown:3,interval:3},c7Attack(['homing','laser','explosion','meteor'][n%4],{count:2,mult:.16,hits:2,radius:110})]});
const cube74=[
 {name:'貫通の封印',step:'SPHERE 1',g:[[471,147,Math.PI/2]],s:[[72,103],[160,156],[70,199],[291,405],[399,405],[343,485]]},
 {name:'球体の円環',step:'SPHERE 2',g:[[78,72,0],[548,668,Math.PI]],s:[[302,136],[99,236],[506,236],[107,519],[483,524],[303,606]],mid:[303,364,[C7P,0]]},
 {name:'四つの重力',step:'SPHERE 3',g:[[130,194,Math.PI/2],[479,194,Math.PI],[131,504,0],[464,513,-Math.PI/2]],s:[[304,286],[304,419]]},
 {name:'球体王・スフェラ',step:'SPHERE / 1',g:[[289,138,Math.PI/2],[289,268,-Math.PI/2]],s:[[119,201],[218,201],[355,201],[456,201]],boss:[286,600,[-Math.PI/2,Math.PI/2]]},
 {name:'球体王の終端',step:'SPHERE / 2',g:[[505,543,0],[423,633,Math.PI/2]],s:[[480,66],[550,125],[70,622],[140,670],[383,526]],boss:[142,123,[-Math.PI/2,Math.PI]]}
];
const stage74={id:'7-4',name:'球体と貫通の封印',weakMultiplier:8,cube:true,hint:'重力バリア・貫通制限・キューブ状態・中ボス。手番以外の味方は四角いキューブになり、移動中の味方は反射するが友情は発動する。貫通制限（灰色）は3ターンごとに全蘇生。すべて倒すとクロスドクロで他の敵の防御が12倍ダウン。弱点倍率は8倍。',
 waves:cube74.map((a,i)=>{
  const keys=a.s.map((p,j)=>'seal-'+j),enemies=a.s.map(([x,y],j)=>sealGrey(keys[j],i+j,x,y,keys.filter(k=>k!==keys[j])));
  enemies.push(...a.g.map(([x,y,w],j)=>c7Normal('guard-'+j,i+j,x,y,220000+i*1500,{gravity:92,weakPoint:{angle:w,radius:15}})));
  if(a.mid)enemies.push(c7Mid('mid',a.mid[0],a.mid[1],800000,a.mid[2],[c7Attack('plusLaser',{mult:.22}),c7Attack('meteor',{count:3,mult:.2}),c7Attack('explosion',{radius:140,mult:.22})],{gravity:150}));
  if(a.boss)enemies.push(c7Boss('スフェラ',a.boss[0],a.boss[1],i===3?1200000:1800000,'#7b63c9',i===3?[c7Attack('crossLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),c7Attack('explosion',{radius:140,mult:.2})]:[c7Attack('plusLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),c7Attack('vibration',{radius:170,push:70,mult:.25})],{weakAngles:a.boss[2],gravity:185}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,
   crossSkulls:[{id:'seal',members:{group:'seal'},effects:[{type:'defenseDown',targets:'nonRestriction',multiplier:12}]}],gimmicks:{}};
 })};
CHAPTER_SEVEN.push(stage73,stage74);for(const stage of [stage73,stage74]){STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}

// ===== 第7章 終盤：7-5 撃種変化の蘇生回廊 / 7-6 立方体と暴風の九倍域（スライド準拠・道中3＋ボス2の5エリア） =====
// 座標はスライドの各盤面を620×740の盤面（フィールド 28〜592 × 28〜712）へ換算した値。
// 7-5：ダメージウォール（4面）・ブロック・反射制限／貫通制限（3ターンごとに蘇生しあう）・撃種変化パネル・弱点付与・蘇生・敵移動。
//   撃種変化パネル＝gimmicks.typePanels。踏むと反射⇔貫通が入れ替わり、1ショットにつき各パネル1回まで（剣パネルと同じ）。次の手番開始時に元へ戻る。
//   弱点付与＝ボスに weakEnabled:false を付け、雑魚（制限敵を含む）全員に crossSkull:'weak' を付けて全滅で grantWeak。
// 7-6：ウィンド・キューブ状態・触れた味方の数に応じて攻撃力アップ（stage.touchPower）・撃種変化パネル（ボス2）・弱点付与・内部弱点（ボス2）・中ボス・弱点倍率9。
// 触れた味方の数に応じて手番キャラの攻撃力アップ＝1人2倍・2人4倍・3人20倍。
const c7Type=coords=>coords.map(([x,y])=>({x,y,r:27}));
const c7Restrict=(key,kind,n,x,y,peers,hp,extra={})=>({...foe(x,y,38,hp,0,'homing',3),key,armor:1,shape:'circle',restriction:kind,tint:'#8e9aab',
 attacks:[{kind:'revive',targets:peers,countdown:3,interval:3},c7Attack(['homing','laser','explosion','meteor'][n%4],{count:2,mult:.16,hits:2,radius:110})],...extra});
const c7WeakGrant=(target,angle,extra={})=>[{id:'weak',members:{group:'weak'},effects:[{type:'grantWeak',targets:[target],angle,...extra}]}];
// f=通常敵、g=貫通制限（灰）、c=反射制限（水色）、types=撃種変化パネル、blocks=ブロック
const meta75=[
 {name:'反転の交差路',step:'TYPE 1',f:[[70,81],[70,187],[416,356],[546,356]],g:[],c:[[70,274],[481,435]],
  types:[[71,134],[481,355]],blocks:[[119,28,64,207],[354,265,238,50]]},
 {name:'封印の天秤',step:'TYPE 2',f:[[228,672],[376,672]],g:[[205,159],[298,158],[392,159]],c:[],
  types:[[86,149],[529,147],[302,681]],blocks:[[145,198,319,50],[259,610,87,36]]},
 {name:'蘇生の挟み撃ち',step:'TYPE 3',f:[],g:[[70,309],[174,312],[118,375],[221,380]],c:[[540,236],[462,289],[385,346],[459,400],[538,458]],
  types:[[214,204],[81,489]],blocks:[[272,178,64,337]]},
 {name:'変転王・メタモル',step:'META / 1',boss:[301,148],f:[[546,310],[546,437],[70,526],[70,647]],g:[],c:[],
  types:[[303,55],[548,375],[70,584]],blocks:[]},
 {name:'変転王の終端',step:'META / 2',boss:[463,208],move:[151,603],f:[],g:[[300,207],[303,602]],c:[[72,201],[542,607]],
  types:[[562,208],[168,321],[439,482],[55,602]],blocks:[]}
];
const stage75={id:'7-5',name:'撃種変化の蘇生回廊',hint:'ダメージウォール（4面）・ブロック・反射制限／貫通制限・撃種変化パネル・弱点付与・蘇生・敵移動。灰色の貫通制限は反射で、水色の反射制限は貫通で倒すと大ダメージ。逆の撃種ではほとんど通らない。撃種変化パネルを踏むと反射と貫通が入れ替わる（各パネル1ショット1回）。制限敵は3ターンごとに蘇生しあう。ボス戦では、雑魚と制限敵を全員倒すとボスに弱点が現れる。',
 waves:meta75.map((a,i)=>{
  const hp=12000+i*1500,rhp=1800+i*1500,keys=[...a.g.map((_,j)=>'pierce-'+j),...a.c.map((_,j)=>'reflect-'+j)],mob=a.boss?{crossSkull:'weak'}:{};
  const enemies=[...a.f.map(([x,y],j)=>c7Normal('foe-'+j,i+j,x,y,hp,mob)),
   ...a.g.map(([x,y],j)=>c7Restrict('pierce-'+j,'pierce',i+j,x,y,keys.filter(k=>k!=='pierce-'+j),rhp,mob)),
   ...a.c.map(([x,y],j)=>c7Restrict('reflect-'+j,'reflect',i+j+1,x,y,keys.filter(k=>k!=='reflect-'+j),rhp,mob))];
  if(i===3)enemies.push(c7Boss('メタモル',a.boss[0],a.boss[1],150000,'#2f9fa8',[c7Attack('crossLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),c7Attack('explosion',{radius:140,mult:.2})],{shape:'cruciform',sides:4,weakEnabled:false}));
  if(i===4)enemies.push(c7Boss('メタモル',a.boss[0],a.boss[1],220000,'#2f9fa8',[c7Attack('plusLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),{kind:'move',to:{x:a.move[0],y:a.move[1]},countdown:3,interval:3}],{shape:'cruciform',sides:4,weakEnabled:false,weakAngles:[C7P,0]}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,
   ...(a.boss?{crossSkulls:c7WeakGrant('boss',i===3?-C7H:C7P)}:{}),
   gimmicks:{walls:['top','right','bottom','left'].map(s=>c6Wall(s,560)),blocks:a.blocks.map(b=>block(...b)),typePanels:c7Type(a.types)}};
 })};
// 7-6：f=通常敵、mid=中ボス、winds=[向き,x,y,半径]。mid.grant＝雑魚全滅で中ボスに弱点、mid.grantBoss＝中ボス撃破でボスに内部弱点、mid.panel＝中ボスの下に隠れた撃種変化パネル
const c7Strong=([mode,x,y,r])=>c7Wind(x,y,mode,r,300);
const cube76=[
 {name:'吹き出す風の庭',step:'CUBE 1',f:[[193,130],[72,231],[433,202],[547,327]],winds:[['push',86,100,232],['push',480,351,232]]},
 {name:'中ボス・ガスト',step:'CUBE 2',f:[],mid:{p:[374,217],weak:[-C7H,0]},winds:[['pull',378,233,304]]},
 {name:'引き寄せの環',step:'CUBE 3',f:[[318,73],[546,373],[301,672]],mid:{p:[108,373],weak:[-C7H,C7H],grant:true},winds:[['pull',391,376,278]]},
 {name:'立方王・ゼニス',step:'ZENITH / 1',boss:[301,642],f:[[180,186],[431,186],[99,421],[515,438]],winds:[['push',298,398,216]]},
 {name:'立方王の終端',step:'ZENITH / 2',boss:[304,98],mid:{p:[303,646],weak:[-C7H],grantBoss:true,panel:[303,646]},f:[],winds:[['pull',304,97,284],['push',307,652,292]]}
];
const c7Vibe=(extra={})=>c7Attack('vibration',{radius:170,push:70,mult:.25,...extra});
const stage76={id:'7-6',name:'立方体と暴風の九倍域',weakMultiplier:9,cube:true,touchPower:true,hint:'ウィンド・キューブ状態・触れた味方の数に応じて攻撃力アップ（1人4倍・2人8倍・3人30倍）・撃種変化パネル（ボス2）・弱点付与・内部弱点（ボス2）・中ボス・弱点倍率9倍。味方に触れてから敵を殴ろう。道中3とボス1では雑魚を全員倒すと弱点が現れ、ボス2の中ボスには最初から上側に弱点があり、倒すとボスに内部弱点が付く。中ボスの下には撃種変化パネルが隠れている。',
 waves:cube76.map((a,i)=>{
  const mob=(a.boss||a.mid?.grant)?{crossSkull:'weak'}:{};
  const enemies=a.f.map(([x,y],j)=>c7Normal('foe-'+j,i+j,x,y,18000+i*2500,mob));
  const crossSkulls=[];
  if(a.mid){const m=a.mid,hpMid=[0,700000,900000,0,500000][i];
   const extra={r:64,shape:'square',sides:4,tint:'#3d8aa6',...(m.weak.length===1?{weakAngles:null}:{}),...(m.grant?{weakEnabled:false}:{}),...(m.grantBoss?{crossSkull:'weak'}:{})};
   enemies.push(c7Mid('mid',m.p[0],m.p[1],hpMid,m.weak,[c7Vibe(),c7Attack('plusLaser',{mult:.22}),c7Attack('meteor',{count:3,mult:.2})],extra));
   if(m.grant)crossSkulls.push(...c7WeakGrant('mid',m.weak[0]));
   if(m.grantBoss)crossSkulls.push(...c7WeakGrant('boss',0,{internal:true,radius:12}));}
  if(i===3)enemies.push(c7Boss('ゼニス',a.boss[0],a.boss[1],1100000,'#4e5cc4',[c7Attack('crossLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),c7Attack('explosion',{radius:140,mult:.2})],{shape:'pentagon',sides:5,weakEnabled:false}));
  if(i===3)crossSkulls.push(...c7WeakGrant('boss',-C7H));
  if(i===4)enemies.push(c7Boss('ゼニス',a.boss[0],a.boss[1],1800000,'#4e5cc4',[c7Attack('plusLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),c7Vibe()],{shape:'pentagon',sides:5,weakEnabled:false,internalWeak:true,weakRadius:12}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,...(crossSkulls.length?{crossSkulls}:{}),
   gimmicks:{winds:a.winds.map(c7Strong),...(a.mid?.panel?{typePanels:c7Type([a.mid.panel])}:{})}};
 })};
CHAPTER_SEVEN.push(stage75,stage76);for(const stage of [stage75,stage76]){STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}

// ===== 第8章：8-3 三十倍の剣と透明の蘇生陣 / 8-4 光子貯蔵庫と三十倍の弱点（旧 8-1 / 8-2。新しい 8-1 / 8-2 はこの下） =====
// （以下のコメント中の「8-1」「8-2」は旧称で、現在は 8-3 / 8-4）
// （スライド準拠・道中3＋ボス2の5エリア） =====
// 座標はスライドの各盤面（左の盤面＝x0:0・幅565、右の盤面＝x0:728・幅605、高さ745）を盤面（フィールド 28〜592 × 28〜712）へ換算した値。
// 新ギミック（実装は simulation.js / enemy-gimmicks.js）
//   剣持ち敵＝敵に sword:倍率 を付ける。直接触れた手番キャラの攻撃力（友情含む）がそのターンだけ倍率分アップ（複数触れても1ターン1回）。ダメージは受けず、他の敵が全滅すると撤退（retreatWhenAlone）。
//   透明パネル＝gimmicks.transPanels。踏むと全ての敵の透明／不透明が入れ替わる。各パネル1ショット1回。透明状態はターンをまたいで持ち越す。敵の startTransparent:true で開幕から透明。
//   フォトンコンテナ＝gimmicks.containers [{x,y,r,n}]。正方形の当たり判定の固い箱。反射するたびにフォトン+1（最大4個）、n回まで。回数は次の手番開始時に元へ戻る。
// 8-1：重力バリア・ブロック・反射制限・透明化・透明パネル・剣持ち敵(30)・蘇生・クロスドクロ・撤退・弱点付与・内部弱点・弱点倍率10。
//   反射制限（水色）は3ターンごとに互いを蘇生。道中1以外では反射制限を全て倒すとクロスドクロで他の敵（通常敵＝内部弱点、ボス＝外側の弱点）に弱点が付く。
// 8-2：減速壁（4面）・ブロック・フォトンコンテナ・透明化・透明パネル・弱点付与・フォトン倍率20・弱点倍率30。ボス2は雑魚を全て倒すとボスに弱点が付く。
const c8Panels=coords=>coords.map(([x,y])=>({x,y,r:27}));
const c8Containers=(list,r=33)=>list.map(([x,y,n])=>({x,y,r,n}));
const c8Kinds=['homing','laser','explosion','meteor'];
const c8Boss=(name,x,y,hp,radius,tint,attacks,extra={})=>({...core(x,y,radius,hp,0,attacks,{bossName:name,tint,shape:'circle',armor:1,...extra}),key:'boss'});
// 通常敵。weak を渡すと外側の弱点（向き）を最初から持つ。
const c8Mob=(key,n,x,y,hp,extra={})=>{const kind=c8Kinds[n%4];
 return {...foe(x,y,38,hp,0,kind,2),key,armor:1,shape:'circle',tint:'#e98f84',
  attacks:[c7Attack(kind,kind==='homing'?{count:3,mult:.18}:kind==='explosion'?{radius:120,maxHits:3,mult:.18}:kind==='meteor'?{count:2,mult:.16}:{mult:.18})],...extra};};
const c8MobTints=['#d8766f','#d99a43','#65a98b','#6f91c5','#aa7ac0'];
const c8MobTint=n=>c8MobTints[n%c8MobTints.length];
// 剣持ち敵：ダメージ無効。hp は表示用の仮値。
const c8Sword=(key,x,y,mult,extra={})=>({...foe(x,y,38,999999,0,'homing',3),key,armor:1,shape:'circle',tint:'#f1b628',sword:mult,retreatWhenAlone:true,
 attacks:[c7Attack('homing',{count:2,mult:.14,countdown:3,interval:3})],...extra});
const c8Opt=(g,t)=>({...(g?{gravity:g}:{}),...(t?{startTransparent:true}:{})});
// c=反射制限 [x,y,開幕透明,重力]、m=通常敵 [x,y,開幕透明,重力]、s=剣持ち敵 [x,y,開幕透明,重力]、boss=[x,y,開幕透明,重力]、bw=ボスの弱点の向き（毎ターン順に切替）、p=透明パネル
const sword83=[
 {name:'剣の守る交差路',step:'SWORD 1',c:[[84,90,1,80],[453,115,0,0],[326,292,0,80],[416,527,1,0]],m:[],s:[[208,449,0,110]],p:[[223,156],[530,416]]},
 {name:'透明に揺れる三叉路',step:'SWORD 2',c:[[104,157,0,80],[186,363,0,80],[104,578,0,80]],m:[[508,99,1,95]],s:[[368,324,1,110]],p:[[237,85],[551,476]]},
 {name:'剣と蘇生の三重陣',step:'SWORD 3',c:[[323,290,1,0],[540,90,0,0],[485,517,0,0]],m:[[145,117,1,95],[90,661,1,95]],s:[[172,330,1,110],[535,667,0,110]],p:[[445,211],[82,442]]},
 {name:'剣陣王・クレイヴ',step:'CLAVE / 1',c:[[90,392,1,0],[400,519,0,0]],m:[[524,101,0,95],[90,648,1,95]],s:[[100,94,1,110],[530,652,0,110]],boss:[293,359,1,150],bw:[-2.28,.92],p:[[257,205],[553,379],[171,520]]},
 {name:'剣陣王の終端',step:'CLAVE / 2',c:[[157,184,0,80],[523,469,1,80]],m:[],s:[[532,71,0,110],[83,536,1,110]],boss:[312,409,0,150],bw:[Math.PI/2],blocks:[[206,263,216,55],[204,595,205,117]],p:[[446,168],[114,325],[310,555]]}
];
const stage83={id:'8-3',name:'三十倍の剣と透明の蘇生陣',directMultiplier:5,weakMultiplier:10,hint:'重力バリア・ブロック・反射制限・透明化・透明パネル・剣持ち敵・蘇生・クロスドクロ・撤退・弱点付与・内部弱点・直殴り倍率アップ（5倍）・弱点倍率10倍。剣持ち敵に直接触れると、その手番キャラの攻撃力（友情含む）が30倍（1ターン1回）。剣持ち敵は倒せず、他の敵を全滅させると撤退する。透明パネルを踏むと敵の透明／不透明が入れ替わり、その状態は次のターンへ持ち越す。水色の反射制限は3ターンごとに互いを蘇生。道中1以外では、反射制限を全て倒すと他の敵に弱点が付く。',
 waves:sword83.map((a,i)=>{
  const rhp=700000+i*1500,mhp=4800000+i*20000,ckeys=a.c.map((_,j)=>'ref-'+j),grant=!!(a.m.length||a.boss);
  const cyan=a.c.map(([x,y,t,g],j)=>({...c7Restrict(ckeys[j],'reflect',i+j,x,y,ckeys.filter(k=>k!==ckeys[j]),rhp,grant?{crossSkull:'weak'}:{}),...c8Opt(g,t)}));
  const mobs=a.m.map(([x,y,t,g],j)=>({...c8Mob('mob-'+j,i+j,x,y,mhp),...c8Opt(g,t)}));
  const swords=a.s.map(([x,y,t,g],j)=>({...c8Sword('sword-'+j,x,y,30),...c8Opt(g,t)}));
  const enemies=[...cyan,...mobs,...swords];
  if(a.boss){const [bx,by,bt,bg]=a.boss;
   enemies.push({...c8Boss('クレイヴ',bx,by,i===3?12000000:20000000,68,'#d9503f',i===3?[c7Attack('crossLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),c7Attack('explosion',{radius:140,mult:.2})]:[c7Attack('plusLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),c7Vibe()],{shape:'polygon',sides:8,weakEnabled:false,weakAngles:a.bw}),...c8Opt(bg,bt)});}
  const effects=[...(a.m.length?[{type:'grantWeak',targets:a.m.map((_,j)=>'mob-'+j),internal:true,radius:14}]:[]),...(a.boss?[{type:'grantWeak',targets:['boss']}]:[])];
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,...(grant?{crossSkulls:[{id:'weak',members:{group:'weak'},effects}]}:{}),
   gimmicks:{blocks:(a.blocks||[]).map(b=>block(...b)),transPanels:c8Panels(a.p)}};
 })};
// 8-2：敵・ボスは四角形（sides:4）。m=通常敵 [x,y,開幕透明,弱点の向き]（外側の弱点を最初から持つ）、cont=フォトンコンテナ [x,y,回数]、boss=[x,y,開幕透明,弱点の向き(配列)]
const photon84=[
 {name:'光子の貯蔵庫',step:'PHOTON 1',m:[[75,234,0,0],[539,234,0,Math.PI],[297,674,0,-Math.PI/2]],blocks:[[28,28,564,144]],cont:[[307,228,4],[64,323,1],[64,401,1],[64,481,1],[541,324,1],[541,401,1],[541,481,1]],p:[]},
 {name:'反転する光子路',step:'PHOTON 2',m:[[534,81,0,Math.PI/2],[534,360,0,-Math.PI/2],[76,412,1,Math.PI/2],[78,665,1,-Math.PI/2]],cont:[[449,228,6],[159,540,6]],p:[[211,57],[545,228],[78,541],[404,685]]},
 {name:'四つの光子庫',step:'PHOTON 3',m:[[75,214,1,-Math.PI/2],[534,214,0,-Math.PI/2]],blocks:[[129,28,64,201],[419,28,64,206]],cont:[[301,341,4],[254,533,2],[344,533,2]],p:[[78,75],[306,118],[536,76],[298,672]]},
 {name:'光庫王・ルミナス',step:'LUMEN / 1',boss:[398,533,0,[.92]],cont:[[558,61,2],[191,206,2],[61,679,2]],p:[[90,80],[506,646]]},
 {name:'光庫王の終端',step:'LUMEN / 2',boss:[312,179,1,[Math.PI,0]],grantBoss:true,m:[[83,357,1,-Math.PI/2],[543,359,0,-Math.PI/2]],blocks:[[28,28,564,106],[127,224,76,208],[422,224,76,208]],cont:[[78,178,9],[543,175,9]],p:[[160,178],[78,258],[459,175],[547,258],[309,381],[309,643]]}
];
const stage84={id:'8-4',name:'光子貯蔵庫と三十倍の弱点',weakMultiplier:30,photonMultiplier:20,hideGimmicks:['雑魚敵に弱点'],hint:'減速壁（4面）・ブロック・フォトンコンテナ・透明化・透明パネル・弱点付与・フォトン倍率20倍・弱点倍率30倍。フォトンコンテナは正方形の箱で、反射するたびにフォトンを1つ獲得（箱の数字の回数まで、ターン終了でリセット）。フォトンを持った直殴りは20倍、弱点は30倍。透明パネルで敵の透明／不透明を入れ替えられる。ボス2は雑魚を全員倒すとボスに弱点が付く。',
 waves:photon84.map((a,i)=>{
  const mhp=1500000+i*15000,enemies=(a.m||[]).map(([x,y,t,ang],j)=>({...c8Mob('mob-'+j,i+j,x,y,mhp,{shape:'polygon',sides:4,weakPoint:{angle:ang,radius:15},...(a.grantBoss?{crossSkull:'weak'}:{})}),...c8Opt(0,t)}));
  if(a.boss){const [bx,by,bt,bw]=a.boss;
   enemies.push({...c8Boss('ルミナス',bx,by,i===3?1000000:10000000,96,'#d6a21f',i===3?[c7Attack('meteor',{count:3,mult:.18}),c7Attack('explosion',{radius:140,mult:.2}),c7Attack('homing',{count:4,mult:.18})]:[c7Attack('wayLaser',{count:8,mult:.2}),c7Attack('spread',{ways:16,volleys:3,mult:.2}),c7Vibe()],{shape:'polygon',sides:4,weakAngles:bw,...(a.grantBoss?{weakEnabled:false}:{})}),...c8Opt(0,bt)});}
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,...(a.grantBoss?{crossSkulls:[{id:'weak',members:{group:'weak'},effects:[{type:'grantWeak',targets:['boss']}]}]}:{}),
   gimmicks:{slowWalls:['top','right','bottom','left'].map(c6Slow),blocks:(a.blocks||[]).map(b=>block(...b)),containers:c8Containers(a.cont),transPanels:c8Panels(a.p)}};
 })};

// ===== 第8章：新 8-1 二十倍の光子と地雷の蘇生陣 / 8-2 防御崩しの転送回廊（スライド準拠・道中3＋ボス2の5エリア） =====
// 座標はスライドを盤面へ換算した値（左の盤面 x0:0・幅565、右の盤面 x0:728・幅605、高さ745）。
// 8-1：ダメージウォール（上下2面）・地雷（中ボス／ボスが撒く）・フォトンコンテナ・蘇生（紫の雑魚が3ターンごとに1体蘇生しあう）・クロスドクロ（道中2・ボス戦：雑魚全滅で中ボス／ボスに弱点付与）・フォトン倍率20・弱点倍率10。敵・ボスは全員四角（sides:4）。
// 8-2：ダメージウォール（4面）・ワープ（紫と青の2組）・ブロック・貫通制限・加速パネル・撃種変化パネル・クロスドクロ（道中2以降：貫通制限全滅で中ボス／ボスに防御ダウン16倍）・一部のボスは内部弱点・ボス1は弱点なしで3ターンごとに移動。雑魚・貫通制限は丸、中ボス・ボスは四角。
const c8Purple=(key,n,x,y,hp,extra={})=>{const base=c8Mob(key,n,x,y,hp,{tint:'#c79bff'});
 return {...base,shape:'polygon',sides:4,attacks:[...base.attacks,{kind:'revive',targets:'others',limit:1,countdown:3,interval:3}],...extra};};
const c8Mines=(count=4,countdown=1,interval=3)=>({kind:'mines',count,countdown,interval});
const mine81=[
 {name:'蘇る紫の群れ',step:'MINE 1',m:[[171, 204], [299, 325], [435, 460]],c:[[451, 197, 3], [156, 460, 3]]},
 {name:'中ボス・マインレイ',step:'MINE 2',mid:[302, 371],m:[[377, 255], [441, 336], [159, 398], [227, 488]],c:[[302, 256, 4], [302, 490, 4]]},
 {name:'光子の挟み撃ち',step:'MINE 3',m:[[141, 66], [308, 66], [474, 66], [141, 674], [308, 674], [474, 674]],c:[[57, 57, 1], [225, 57, 1], [389, 57, 1], [558, 57, 1], [57, 683, 1], [225, 683, 1], [389, 683, 1], [558, 683, 1]]},
 {name:'地雷王・ボマー',step:'BOMBER / 1',boss:[305, 103],bw:[C7H],m:[[124, 370], [488, 378], [305, 594]],c:[[57, 57, 4], [559, 57, 4], [305, 683, 2]]},
 {name:'地雷王の終端',step:'BOMBER / 2',boss:[116, 634],bw:[-C7H,0],m:[[479, 143], [411, 217], [115, 510], [260, 640]],c:[[57, 57, 2], [235, 529, 8], [559, 683, 2]]}
];
const stage81={id:'8-1',name:'二十倍の光子と地雷の蘇生陣',weakMultiplier:10,photonMultiplier:20,hint:'ダメージウォール（上下2面）・地雷・フォトンコンテナ・蘇生・クロスドクロ・フォトン倍率20倍・弱点倍率10倍。紫の雑魚は3ターンごとに1体を蘇生しあう。中ボスとボスは地雷を撒いてくる。敵は全員四角。道中1・3以外では、雑魚を全員倒すとクロスドクロで中ボス／ボスに弱点が付く。フォトンコンテナで光子を補給して20倍の直殴りを狙おう。',
 waves:mine81.map((a,i)=>{
  const hp=14000+i*1500,grant=!!(a.mid||a.boss),enemies=a.m.map(([x,y],j)=>c8Purple('mob-'+j,i+j,x,y,hp,grant?{crossSkull:'weak'}:{}));
  if(a.mid)enemies.push(c7Mid('mid',a.mid[0],a.mid[1],620000,[C7P,0],[c7Attack('homing',{count:4,mult:.2}),c7Attack('explosion',{radius:130,mult:.22}),c8Mines(4,1,3)],{shape:'polygon',sides:4,r:76,weakEnabled:false}));
  if(a.boss)enemies.push(c7Boss('ボマー',a.boss[0],a.boss[1],i===3?800000:1100000,'#c25b4a',i===3?[c7Attack('crossLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),c8Mines(4,1,3)]:[c7Attack('plusLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),c8Mines(5,1,3)],{shape:'polygon',sides:4,r:96,weakEnabled:false,weakAngles:a.bw}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,...(grant?{crossSkulls:[{id:'weak',members:{group:'weak'},effects:[{type:'grantWeak',targets:[a.mid?'mid':'boss']}]}]}:{}),
   gimmicks:{walls:['top','bottom'].map(s=>c6Wall(s,560)),containers:c8Containers(a.c,29)}};
 })};
// 8-2：grey=貫通制限、pink=内部弱点の通常敵、mid=中ボス、boss=ボス（move=3ターンごとの移動先）。warpP=紫の組、warpB=青の組。
const gate82=[
 {name:'転送する二つの核',step:'WARP 1',pink:[[67, 66], [544, 67]],grey:[[303, 530]],blocks:[[116, 28, 60, 230], [28, 258, 148, 50], [432, 28, 60, 230], [432, 259, 160, 48]],type:[[67, 146], [544, 146]],boost:[[67, 220], [542, 223]],warpP:[[128, 173], [400, 452]],warpB:[[474, 175], [207, 453]]},
 {name:'中ボス・ポータル',step:'WARP 2',mid:[302, 371],midWeak:[C7P,0],grey:[[377, 67], [230, 674]],blocks:[[275, 28, 55, 684]],type:[],boost:[[473, 292], [138, 453]],warpP:[[563, 56], [53, 689]],warpB:[[229, 62], [365, 687]]},
 {name:'壁に囲まれた核',step:'WARP 3',mid:[300, 586],midInternal:true,grey:[[442, 157], [542, 157], [84, 620]],blocks:[[28, 130, 362, 55], [153, 404, 296, 54], [154, 460, 58, 252], [390, 460, 59, 252]],type:[[136, 79]],boost:[[255, 491], [350, 490], [300, 685]],warpP:[[84, 531], [527, 689]],warpB:[[50, 76], [412, 679]]},
 {name:'転位王・ネクサ',step:'NEXA / 1',boss:[459, 594],move:[152, 151],grey:[[493, 137], [302, 351], [132, 603]],blocks:[],type:[],boost:[],warpP:[[152, 46], [459, 691]],warpB:[[47, 136], [565, 592]]},
 {name:'転位王の終端',step:'NEXA / 2',boss:[502, 278],bossInternal:true,grey:[[193, 193], [547, 519], [83, 663]],blocks:[[28, 101, 564, 47], [355, 147, 57, 312], [412, 412, 180, 48], [143, 582, 449, 48]],type:[[306, 65]],boost:[[133, 66], [483, 66], [444, 175], [561, 177], [442, 381], [557, 384], [327, 676]],warpP:[[566, 61], [384, 373]],warpB:[[50, 65], [567, 679]]}
];
const stage82={id:'8-2',name:'防御崩しの転送回廊',hint:'ダメージウォール（4面）・ワープ・ブロック・貫通制限・加速パネル・撃種変化パネル・クロスドクロ・防御ダウン16倍。雑魚と貫通制限は丸、中ボス・ボスは四角。ワープは同じ色どうしがつながる（対策は不要）。道中2以降は、灰色の貫通制限を全て倒すと中ボス／ボスの防御が16倍ダウン。道中3とボス2は内部弱点、ボス1は弱点なしで3ターンごとに移動する。',
 waves:gate82.map((a,i)=>{
  const sq={shape:'polygon',sides:4},keys=a.grey.map((_,j)=>'seal-'+j),enemies=a.grey.map(([x,y],j)=>sealGrey(keys[j],i+j,x,y,keys.filter(k=>k!==keys[j])));
  (a.pink||[]).forEach(([x,y],j)=>enemies.push(c7Square('pink-'+j,x,y,0,24000,i+j,{shape:'circle',sides:0,weakPoint:null,internalWeak:true,weakRadius:12})));
  const defDown=t=>({crossSkulls:[{id:'seal',members:{group:'seal'},effects:[{type:'defenseDown',targets:[t],multiplier:16}]}]});
  if(a.mid)enemies.push(c7Mid('mid',a.mid[0],a.mid[1],1000000,a.midWeak||[C7P,0],[c7Attack('plusLaser',{mult:.22}),c7Attack('meteor',{count:3,mult:.2}),c7Attack('explosion',{radius:140,mult:.22})],{...sq,r:76,...(a.midInternal?{weakPoint:null,internalWeak:true,weakRadius:12}:{})}));
  if(a.boss)enemies.push(c7Boss('ネクサ',a.boss[0],a.boss[1],i===3?1400000:3200000,'#b24a6b',i===3?[c7Attack('crossLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),{kind:'move',to:{x:a.move[0],y:a.move[1]},countdown:3,interval:3}]:[c7Attack('plusLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),c7Attack('vibration',{radius:170,push:70,mult:.25})],{...sq,r:96,...(a.bossInternal?{internalWeak:true,weakRadius:12}:{weakEnabled:false,noWeak:true})}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,...(i>=1?defDown(a.mid?'mid':'boss'):{}),
   gimmicks:{walls:['top','right','bottom','left'].map(s=>c6Wall(s,560)),blocks:a.blocks.map(b=>block(...b)),warps:c7Warps([a.warpP[0],a.warpP[1]],[a.warpB[0],a.warpB[1]]),
    ...(a.boost.length?{boosts:c7Boosts(a.boost)}:{}),...(a.type.length?{typePanels:a.type.map(([x,y])=>({x,y,r:27}))}:{})}};
 })};
const CHAPTER_EIGHT=[stage81,stage82,stage83,stage84];for(const stage of CHAPTER_EIGHT){STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}

// ===== 第8章：8-5 閉ざされた結界の回廊 / 8-6 三十倍の起動と十八倍の弱点（スライド準拠・道中3＋ボス2の5エリア） =====
// 座標はスライドを盤面へ換算した値（左の盤面 x0:0・幅565、右の盤面 x0:725・幅603、高さ745 → 620×740。枠・ブロックは壁際に吸着、盤面の外へはみ出す配置は内側へ補正）。
// 8-5：ブロック・結界・剣パネル・加速パネル・ハートパネル・撃種変化パネル（ボス2のみ）・内部弱点（ボス2のみ）。結界の数字は壊れるまでの接触回数。
//   m=通常敵（円・三角・五角・六角・八角）、q=四角い通常敵、mid=中ボス（弱点は上下を毎ターン交互）、boss=ボス、move=ボス2の移動先（3ターンごと）、bar=[x,y,幅,高さ,接触回数]
// 8-6：減速壁（4面）・反射制限／貫通制限・パワースイッチ（30）・撃種変化パネル・内部弱点・弱点倍率18。
//   pierce=貫通制限（灰）、reflect=反射制限（水色）、normal=内部弱点の通常敵、sw=[x,y,初期値0〜2]、type=撃種変化パネル。制限敵・中ボス・ボスはスイッチ未点灯だとほとんどダメージが通らない（switchArmor）。
const barrier85=[
 {name:'結界に閉じ込められた始まり',step:'BARRIER 1',m:[[554,66],[66,127],[128,346]],blocks:[[383,28,73,269],[28,486,270,63]],bar:[[28,216,355,81,4],[298,517,294,195,3]],sw:[[63,257],[192,257],[320,257],[467,401]],heart:[[269,61],[268,156]],boost:[[149,109]]},
 {name:'三つの結界と囚われの核',step:'BARRIER 2',q:[[66,66],[66,208],[308,294],[308,438],[554,527],[554,671]],blocks:[[132,128,460,64],[28,547,462,64]],bar:[[28,28,101,251,2],[244,226,129,283,1],[490,458,102,254,2]],sw:[[65,137],[308,368],[554,598],[184,269],[434,488]],heart:[[533,84],[89,659]]},
 {name:'中ボス・ガーディア',step:'BARRIER 3',q:[[528,204],[528,556]],mid:[516,379],blocks:[[326,28,75,684]],bar:[[28,28,298,227,5],[28,487,298,225,5]],sw:[[77,60],[239,60],[77,182],[239,182],[74,549],[229,549],[74,671],[229,671],[154,372]],heart:[[159,123],[154,594]],boost:[[55,372]]},
 {name:'結界王・ヴェール',step:'VEIL / 1',m:[[112,674],[509,674]],boss:[315,124],blocks:[[28,192,129,407],[463,192,129,407]],bar:[[28,28,67,70,4],[522,28,70,70,4],[157,243,306,98,6],[157,464,306,97,3]],sw:[[233,294],[311,294],[388,293],[233,513],[311,513],[388,513],[215,648],[408,647]],heart:[[62,63],[557,63]],boost:[[312,398]]},
 {name:'結界王の終端',step:'VEIL / 2',boss:[478,139],move:[296,616],bar:[[28,28,304,263,4],[332,259,260,58,9],[181,432,411,80,9],[28,514,408,198,3]],sw:[[98,67],[216,67],[52,148],[153,152],[258,152],[101,242],[218,243],[86,398]],heart:[[238,478],[554,478]],boost:[[452,370],[189,631]],type:[[237,369]]}
];
const c8MobShape=n=>{const sides=[0,3,5,6,8][n%5];return sides?{shape:'polygon',sides}:{shape:'circle'};};
const stage85={id:'8-5',name:'閉ざされた結界の回廊',hint:'ブロック・結界・剣パネル・加速パネル・ハートパネル・撃種変化パネル・内部弱点。翡翠色の枠が結界で、外殻に触れると壁と同じように反射し、中にいると閉じ込められる。枠の上の数字だけ触れると結界が壊れ、そのショットのあいだは自由に通れる。結界と数字は毎ターン元に戻る。結界の中には敵・剣パネル・ハートパネルが隠れている。ボス2のボスだけが内部弱点を持ち、3ターンごとに結界の中へ移動する。',
 waves:barrier85.map((a,i)=>{
  const hp=20000+i*2500,enemies=[...(a.m||[]).map(([x,y],j)=>c8Mob('mob-'+j,i+j,x,y,hp,{...c8MobShape(i+j),tint:c8MobTint(i+j)})),...(a.q||[]).map(([x,y],j)=>c8Mob('sq-'+j,i+j,x,y,hp,{shape:'polygon',sides:4,tint:c8MobTint(i+j+2)}))];
  if(a.mid)enemies.push(c7Mid('mid',a.mid[0],a.mid[1],180000,[-C7H,C7H],[c7Attack('plusLaser',{mult:.22}),c7Attack('meteor',{count:3,mult:.2}),c7Attack('explosion',{radius:140,mult:.22})],{r:76,shape:'polygon',sides:4}));
  if(i===3)enemies.push(c7Boss('ヴェール',a.boss[0],a.boss[1],260000,'#3a9f94',[c7Attack('plusLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),c7Attack('explosion',{radius:140,mult:.2})],{r:68,shape:'polygon',sides:6}));
  if(i===4)enemies.push(c7Boss('ヴェール',a.boss[0],a.boss[1],320000,'#3a9f94',[c7Attack('crossLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),{kind:'move',to:{x:a.move[0],y:a.move[1]},countdown:3,interval:3}],{r:68,shape:'polygon',sides:6,internalWeak:true,weakRadius:12}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,
   gimmicks:{blocks:(a.blocks||[]).map(b=>block(...b)),barriers:a.bar.map(([x,y,w,h,n])=>({x,y,w,h,n})),swords:c7Swords(a.sw),...(a.boost?{boosts:c7Boosts(a.boost)}:{}),hearts:a.heart.map(([x,y])=>({x,y,r:25})),...(a.type?{typePanels:c7Type(a.type)}:{})}};
 })};
const limit86=[
 {name:'二つの制限と起動の鍵',step:'LIMIT 1',pierce:[[554,66]],reflect:[[388,192]],normal:[],sw:[[298,277,0],[298,460,0]],type:[[77,98],[491,666]]},
 {name:'三つの鍵と囚われの制限',step:'LIMIT 2',pierce:[[229,371]],reflect:[[66,66],[554,66]],normal:[[66,674]],sw:[[69,371,2],[308,371,1],[549,371,1]],type:[[428,222],[150,529]]},
 {name:'中ボス・リミッター',step:'LIMIT 3',pierce:[],reflect:[],normal:[[91,79],[511,79]],mid:[426,580],sw:[[54,326,1],[245,326,0]],type:[[565,590],[426,685]]},
 {name:'解放王・リミット',step:'LIMIT / 1',pierce:[[309,309]],reflect:[[66,66],[554,594],[554,674]],normal:[],boss:[170,155],sw:[[309,428,1],[309,629,1]],type:[[454,169],[124,524]]},
 {name:'解放王の終端',step:'LIMIT / 2',pierce:[[348,366],[217,480]],reflect:[[554,674]],normal:[[554,509],[363,674]],boss:[370,507],sw:[[213,346,0],[568,418,2],[261,688,2]],type:[[545,217],[92,652]]}
];
const stage86={id:'8-6',name:'三十倍の起動と十八倍の弱点',weakMultiplier:18,switchMultiplier:30,hint:'減速壁（4面）・反射制限／貫通制限・パワースイッチ（30倍）・撃種変化パネル・内部弱点・弱点倍率18倍。パワースイッチを踏むたびに0→1→2と進み、すべて2（金色）にすると直殴りと友情が30倍になる。灰色の貫通制限は反射で、水色の反射制限は貫通で倒すと大ダメージ（撃種変化パネルで入れ替え可）。制限敵・中ボス・ボスはスイッチを起動しないとほとんどダメージが通らない。',
 waves:limit86.map((a,i)=>{
  const keys=[...a.pierce.map((_,j)=>'pierce-'+j),...a.reflect.map((_,j)=>'reflect-'+j)],rhp=180000+i*25000,arm={switchArmor:.02};
  const enemies=[...a.pierce.map(([x,y],j)=>c7Restrict('pierce-'+j,'pierce',i+j,x,y,keys.filter(k=>k!=='pierce-'+j),rhp,arm)),
   ...a.reflect.map(([x,y],j)=>c7Restrict('reflect-'+j,'reflect',i+j+1,x,y,keys.filter(k=>k!=='reflect-'+j),rhp,{...arm,tint:'#65b9c9'})),
   ...a.normal.map(([x,y],j)=>c8Mob('weak-'+j,i+j,x,y,640000+i*30000,{...c8MobShape(i+j),tint:c8MobTint(i+j),weakPoint:null,internalWeak:true,weakRadius:12}))];
  if(a.mid)enemies.push(c7Mid('mid',a.mid[0],a.mid[1],1200000,[0,C7H],[c7Attack('plusLaser',{mult:.22}),c7Attack('meteor',{count:3,mult:.2}),c7Attack('explosion',{radius:140,mult:.22})],{r:76,...arm}));
  if(i===3)enemies.push(c7Boss('リミット',a.boss[0],a.boss[1],2000000,'#b0603c',[c7Attack('plusLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),c7Attack('explosion',{radius:140,mult:.2})],{r:68,weakAngles:[-C7H,C7P],...arm}));
  if(i===4)enemies.push(c7Boss('リミット',a.boss[0],a.boss[1],3000000,'#b0603c',[c7Attack('crossLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),c7Attack('vibration',{radius:170,push:70,mult:.25})],{r:68,weakAngles:[0,C7H],...arm}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,
   gimmicks:{slowWalls:['top','right','bottom','left'].map(c6Slow),powerSwitches:a.sw.map(([x,y,initial])=>({x,y,r:24,initial})),typePanels:c7Type(a.type)}};
 })};
CHAPTER_EIGHT.push(stage85,stage86);for(const stage of [stage85,stage86]){STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}

// ===== 第9章：9-1 蘇る大群と九倍の弱点 / 9-2 四つの砲台と二十倍の弱点（スライド準拠・道中3＋ボス2の5エリア） =====
// 座標はスライドを盤面フィールド（28〜592 × 28〜712）へ換算した値（敵が盤面の端に接する配置のため、盤面の外側ではなく内側へ合わせている）。
// 9-1：重力バリア・結界・蘇生・弱点倍率9。敵の数が多く、雑魚は柔らかめ。雑魚とボスは四角。蘇生役（紫）とボスは、毎ターン倒れた雑魚を3体まで蘇生する。
//   m=雑魚 [x,y,弱点の向き(R=右/D=下/L=左/U=上)]、rv=蘇生役 [x,y,重力バリア半径]、boss=[x,y,重力バリア半径]、move=ボス2の移動先（3ターンごと）、bar=結界 [x,y,幅,高さ,回数]
// 9-2：地雷・反射制限・レーザージェネレーター・蘇生・クロスドクロ・弱点付与・内部弱点・弱点倍率20。蘇生役（紫）は2ターンごとに倒れた敵を全て蘇生。
//   ボス戦では蘇生役を全て倒すとボスに弱点が付く。レーザーの倍率は stage.laserMultipliers（Lv.1〜4＝手番キャラの攻撃力の 1／2／8／24倍）。
//   cyan=反射制限（水色）、pur=蘇生役（内部弱点）、mid=中ボス（内部弱点）、boss=ボス
const c9Ang={R:0,D:C7H,U:-C7H,L:C7P};
const c9Revive=(limit,countdown,interval)=>({kind:'revive',targets:'others',limit,countdown,interval});
const c9Mob=(key,n,x,y,hp,ang)=>c8Mob(key,n,x,y,hp,{shape:'polygon',sides:4,weakPoint:{angle:c9Ang[ang],radius:15}});
const c9Reviver=(key,n,x,y,hp,grav)=>{const base=c8Mob(key,n,x,y,hp,{tint:'#c79bff',shape:'polygon',sides:4,gravity:grav});
 return {...base,attacks:[...base.attacks,c9Revive(3,1,1)]};};
const horde91=[
 {name:'ひしめく蘇生の列',step:'HORDE 1',m:[[185,95,'D'],[278,107,'D'],[369,115,'D'],[461,123,'D'],[553,134,'D'],[75,435,'D'],[166,422,'D'],[258,410,'D'],[350,398,'D'],[442,384,'D']],rv:[[75,267,175]],bar:[[28,218,98,95,1]]},
 {name:'挟み撃ちの二列縦隊',step:'HORDE 2',m:[[75,66,'R'],[75,146,'R'],[75,224,'R'],[75,304,'R'],[75,435,'R'],[75,515,'R'],[75,594,'R'],[75,673,'R'],[554,66,'L'],[554,146,'L'],[554,224,'L'],[554,304,'L'],[554,435,'L'],[554,515,'L'],[554,594,'L'],[554,673,'L']],rv:[[316,66,176],[316,673,176]],bar:[[28,350,564,42,2]]},
 {name:'結界に囲まれた蘇生核',step:'HORDE 3',m:[[189,281,'L'],[385,281,'U'],[185,460,'D'],[384,460,'R']],rv:[[287,373,222]],bar:[[249,245,75,69,1],[153,336,75,68,1],[345,339,75,69,1],[249,424,75,69,1]]},
 {name:'多頭王・ヒドラ',step:'HYDRA / 1',m:[[119,380,'R'],[499,382,'L'],[223,66,'D'],[310,66,'D'],[396,66,'D'],[223,674,'U'],[310,674,'U'],[396,674,'U']],rv:[],boss:[311,382,220],bar:[[223,293,175,176,1]]},
 {name:'多頭王の終端',step:'HYDRA / 2',m:[[548,67,'L'],[548,148,'L'],[548,227,'L'],[548,306,'L'],[548,385,'L'],[73,357,'R'],[73,437,'R'],[73,516,'R'],[73,596,'R'],[73,674,'R']],rv:[[73,71,178],[545,674,173]],boss:[359,230,195],move:[264,527],bar:[[140,199,75,66,2],[405,485,75,67,2]]}
];
const stage91={id:'9-1',name:'蘇る大群と九倍の弱点',weakMultiplier:9,hint:'重力バリア・結界・蘇生・弱点倍率9倍。敵の数が非常に多く、雑魚は柔らかめ。雑魚とボスは四角で、外側に弱点がある。紫の蘇生役とボスは、毎ターン倒れた雑魚を3体まで蘇生してくる。蘇生役とボスは重力バリアで守られ、結界の中に隠れていることも多い。結界を破って蘇生役から先に倒そう。',
 waves:horde91.map((a,i)=>{
  const hp=6000+i*500,enemies=a.m.map(([x,y,ang],j)=>c9Mob('mob-'+j,i+j,x,y,hp,ang));
  a.rv.forEach(([x,y,g],j)=>enemies.push(c9Reviver('reviver-'+j,i+j,x,y,12000+i*200,g)));
  if(a.boss)enemies.push(c7Boss('ヒドラ',a.boss[0],a.boss[1],i===3?220000:340000,'#7f5fb0',
   i===3?[c7Attack('plusLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),c9Revive(3,1,1)]:[c7Attack('crossLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),{kind:'move',to:{x:a.move[0],y:a.move[1]},countdown:3,interval:3},c9Revive(3,1,1)],
   {shape:'polygon',sides:4,r:80,gravity:a.boss[2],weakAngles:i===3?[-C7H,C7H]:[C7P,0]}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,gimmicks:{barriers:a.bar.map(([x,y,w,h,n])=>({x,y,w,h,n}))}};
 })};
const c9Purple=(key,n,x,y,hp,extra={})=>{const base=c8Mob(key,n,x,y,hp,{tint:'#c79bff',weakPoint:null,internalWeak:true,weakRadius:12});
 return {...base,attacks:[...base.attacks,c9Revive(99,2,2)],...extra};};
const c9Cyan=(key,n,x,y,hp)=>{const e=c7Restrict(key,'reflect',n,x,y,[],hp);return {...e,attacks:e.attacks.filter(a=>a.kind!=='revive')};};
const laser92=[
 {name:'砲台の目覚め',step:'LASER 1',mid:[298,227],cyan:[[170,451],[295,451],[418,451]],pur:[]},
 {name:'蘇る内部の核',step:'LASER 2',cyan:[],pur:[[503,107],[257,320],[362,413],[103,628]]},
 {name:'八つの蘇生核',step:'LASER 3',cyan:[],pur:[[226,88],[376,88],[101,254],[514,254],[101,481],[514,481],[226,656],[376,656]]},
 {name:'砲台王・ジェネシス',step:'GENESIS / 1',boss:[191,565],cyan:[[73,245],[367,351],[482,671]],pur:[[478,127],[196,408],[355,576]]},
 {name:'砲台王の終端',step:'GENESIS / 2',boss:[308,210],cyan:[[476,375],[156,461]],pur:[[121,211],[470,106],[435,544]]}
];
const stage92={id:'9-2',name:'四つの砲台と二十倍の弱点',weakMultiplier:20,laserMultipliers:[1,2,8,24],hint:'地雷・反射制限・レーザージェネレーター・蘇生・クロスドクロ・弱点付与・内部弱点・弱点倍率20倍。上下左右の各辺で最初に触れた壁にレーザージェネレーターが設置され、停止後に全基が3回一斉にレーザーを発射する。設置数がレベル（1〜4）で、威力は手番キャラの攻撃力の1／2／8／24倍、太さも増す。レーザーは反射制限の軽減を受けず、内部弱点にも届く。紫の蘇生役は2ターンごとに倒れた敵を全て蘇生する。ボス戦では蘇生役を全員倒すとボスに弱点が現れる。',
 waves:laser92.map((a,i)=>{
  const grant=!!a.boss,enemies=[...a.cyan.map(([x,y],j)=>c9Cyan('cyan-'+j,i+j,x,y,7000+i*500)),
   ...a.pur.map(([x,y],j)=>c9Purple('purple-'+j,i+j,x,y,1000000+i*3000,grant?{crossSkull:'weak'}:{}))];
  if(a.mid)enemies.push(c7Mid('mid',a.mid[0],a.mid[1],5000000,[0],[c7Attack('homing',{count:4,mult:.2}),c7Attack('explosion',{radius:130,mult:.22}),c8Mines(8,1,2)],{r:76,weakPoint:null,internalWeak:true,weakRadius:12}));
  if(i===3)enemies.push(c7Boss('ジェネシス',a.boss[0],a.boss[1],10000000,'#3f78b5',[c7Attack('plusLaser',{mult:.2}),c7Attack('homing',{count:4,mult:.18}),c8Mines(12,1,3)],{r:84,weakEnabled:false}));
  if(i===4)enemies.push(c7Boss('ジェネシス',a.boss[0],a.boss[1],20000000,'#3f78b5',[c7Attack('crossLaser',{mult:.2}),c7Attack('meteor',{count:3,mult:.18}),c8Mines(8,1,2)],{r:84,weakEnabled:false,weakAngles:[C7P,0]}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,
   ...(i===3?{crossSkulls:c7WeakGrant('boss',0,{internal:true,radius:12})}:i===4?{crossSkulls:c7WeakGrant('boss',C7P)}:{}),gimmicks:{}};
 })};
const CHAPTER_NINE=[stage91,stage92];for(const stage of CHAPTER_NINE){STAGES.push(stage);STAGE_BY_ID[stage.id]=stage;}

// 9-3：中ボス中心の弱点攻略。複数の弱点位置はターンごとに交代。
const c93Attacks=()=>[c7Attack('homing',{count:3,mult:.18}),c7Attack('wayLaser',{count:6,hits:2,mult:.16,countdown:2,interval:3})];
const c93Mid=(key,x,y,hp,angles,extra={})=>c7Mid(key,x,y,hp,[angles[0]],c93Attacks(),{r:78,shape:'square',sides:4,weakAngles:angles.length>1?angles:null,weakPoint:{angle:angles[0],radius:15},...extra});
const c93Move=(x,y,turns)=>({kind:'move',to:{x,y},countdown:turns,interval:turns});
const c93Boss=(x,y,hp,extra={})=>c7Boss('テンペスト',x,y,hp,'#48b3a7',[c7Attack('reflectCross',{bounces:2,mult:.14,countdown:2,interval:3}),c7Attack('dropBomb',{count:3,mult:.22,countdown:3,interval:4}),c7Attack('homing',{count:3,mult:.18})],{r:82,shape:'octagon',sides:8,weakEnabled:false,...extra});
const damageLine=(x1,y1,x2,y2,color='silver')=>({a:{x:x1,y:y1},b:{x:x2,y:y2},color});
const lines93=[
  [damageLine(28,182,592,182)],
  [damageLine(310,28,310,210),damageLine(310,510,310,700)],
  [damageLine(475,28,475,210),damageLine(145,465,145,645),damageLine(225,340,390,340,'gold')],
  [damageLine(28,445,265,675),damageLine(580,28,580,320)],
  [damageLine(125,145,495,145),damageLine(125,565,495,565),damageLine(190,250,190,425,'gold'),damageLine(430,250,430,425,'gold')]
];
const stage93={id:'9-3',name:'双弱点の対角回廊',hint:'ダメージラインに触れるたびにダメージ。金のユニットがあるエリアでは銀→金の順に毎ターン切り替わる。道中は四角い中ボスだけが出現。左右・上下の弱点と移動先を狙おう。ボス1は右上の中ボスを倒すとボスに弱点付与。ボス2は上下の中ボスを両方倒すとボスの上下に弱点が出現する。',waves:[
 {name:'中央の双弱点',step:'DUAL 1',enemies:[c93Mid('mid',310,350,50000,[0,C7P])],gimmicks:{}},
 {name:'対角を渡る番人',step:'DUAL 2',enemies:[c93Mid('mid',465,180,80000,[-C7H,C7H],{attacks:[...c93Attacks(),c93Move(155,540,3)]})],gimmicks:{}},
 {name:'向かい合う双番人',step:'DUAL 3',enemies:[
 c93Mid('mid-left',145,165,64000,[0],{attacks:[...c93Attacks(),c93Move(145,350,2)]}),
 c93Mid('mid-right',475,545,64000,[C7P],{attacks:[...c93Attacks(),c93Move(475,350,2)]})],gimmicks:{}},
 {name:'八角王の対角陣',step:'TEMPEST / 1',bossPhase:1,enemies:[
 c93Mid('mid',465,180,75000,[C7P],{weakPoint:{angle:C7P,radius:15},weakAngles:[C7P,C7H],crossSkull:'weak'}),
 c93Boss(155,535,160000,{weakAngles:[0,-C7H]})],crossSkulls:c7WeakGrant('boss',0),gimmicks:{}},
 {name:'八角王の上下封印',step:'TEMPEST / 2',bossPhase:2,enemies:[
 c93Mid('mid-top',310,145,90000,[0,C7P],{crossSkull:'weak',attacks:[...c93Attacks(),c93Move(475,145,1)]}),
 c93Mid('mid-bottom',310,565,90000,[0,C7P],{crossSkull:'weak',attacks:[c7Attack('dropBomb',{count:2,mult:.2,countdown:2,interval:3}),c7Attack('homing',{count:2,mult:.16}),c93Move(145,565,1)]}),
 c93Boss(310,355,240000,{weakAngles:[-C7H,C7H]})],crossSkulls:c7WeakGrant('boss',-C7H),gimmicks:{}}
]};
stage93.waves.forEach((wave,i)=>{wave.gimmicks.damageLines=lines93[i];});
CHAPTER_NINE.push(stage93);STAGES.push(stage93);STAGE_BY_ID[stage93.id]=stage93;

// ===== 第9章：9-4 二十四倍の共鳴回廊（スライド準拠・道中3＋ボス2の5エリア） =====
// 座標はスライドを盤面フィールド（28〜592 × 28〜712）へ換算した値（左の盤面 x0:0・幅560〜566、右の盤面 x0:723〜728・幅603〜605、高さ約748）。
// ギミック：ワープ（3組）・ブロック・反射制限・パワーエリア（18倍）・剣持ち敵（24倍）・蘇生・弱点ヒットで弱点移動・HP共有・加速パネル・弱点倍率アップ（12倍）。
// 弱点は「移動する弱点の順番」（route）どおりに敵から敵へ渡る。弱点に直接ヒットすると次の番号へ移る。剣持ち敵は倒せないが、弱点に触れるとダメージなしで弱点だけが次へ移る。
//   route=[キー, 弱点の位置(C=中央、R/D/U/L=右/下/上/左)] の配列。キー：pink-N=通常敵、sword-N=剣持ち敵、share-N=HP共有の敵（緑）、boss=ボス
// HP共有（hpShare）：緑の敵が受けたダメージ（弱点・パワーエリア・剣の倍率込み）を、指定したボス／中ボスにもそのまま反映する。逆（ボス→緑）は反映しない。
//   緑の敵は高HPで倒せず、共有先が倒されると撤退する。反射制限（水色）は2ターンごとに互いを蘇生。中ボス・ボスは3ターンごとに倒れた雑魚を全て蘇生（反射制限は蘇生しない）。
const c94Revive={kind:'revive',targets:'others',limit:99,skipRestricted:true,countdown:4,interval:6};
const c94Cyan=(key,n,x,y,hp,peers)=>{const e=c7Restrict(key,'reflect',n,x,y,peers,hp);return {...e,attacks:e.attacks.map(a=>a.kind==='revive'?{...a,countdown:2,interval:2}:a)};};
const c94Share=(key,n,x,y,target)=>c8Mob(key,n,x,y,3000000000,{tint:'#58893a',hpShare:[target],retreatWhenShareDead:true,retreatWhenAlone:true});
const reson94=[
 {name:'剣が導く三つの弱点',step:'RESONANCE 1',
  pa:[[28,28,206,205],[376,28,216,345]],pink:[[538,296],[131,133]],sword:[[208,414]],cyan:[[259,187],[369,355]],
  route:[['sword-0','C'],['pink-0','C'],['pink-1','C']],
  warp:[[[61,205],[543,128]],[[95,466],[410,240]],[[303,88],[482,480]]]},
 {name:'光の帯を渡る五つの弱点',step:'RESONANCE 2',
  pa:[[232,28,149,684]],pink:[[305,76],[305,666],[383,225],[230,528]],sword:[[305,373]],cyan:[[527,201],[86,553]],
  route:[['sword-0','C'],['pink-0','C'],['pink-1','C'],['pink-2','L'],['pink-3','R']],
  warp:[[[233,316],[380,436]],[[380,314],[233,436]],[[307,262],[308,493]]]},
 {name:'中ボス・共鳴核',step:'RESONANCE 3',
  pa:[[28,393,564,319]],pink:[[511,654],[405,665],[296,665],[187,665],[76,624]],sword:[[87,256],[530,493]],share:[[223,447],[395,330]],mid:[299,124],
  blocks:[[133,559,351,45]],boost:[[308,396],[544,584]],
  route:[['pink-0','C'],['pink-1','C'],['pink-2','C'],['pink-3','C'],['pink-4','C'],['share-0','C'],['share-1','C']],
  warp:[[[430,65],[145,340]],[[176,65],[78,541]],[[298,238],[536,398]]]},
 {name:'共鳴王・レゾナ',step:'RESONA / 1',
  pa:[[28,28,564,133],[28,575,564,137]],pink:[[368,80],[234,639]],sword:[[527,244],[102,474]],cyan:[[383,226],[252,500]],boss:[138,160],move:[466,575],
  boost:[[310,365]],
  route:[['pink-0','C'],['pink-1','C'],['boss','D'],['boss','U']],
  warp:[[[311,292],[369,670]],[[246,74],[311,446]],[[490,105],[129,618]]]},
 {name:'共鳴王の終端',step:'RESONA / 2',
  pa:[[458,28,134,265],[28,332,270,290]],pink:[[323,412],[74,576],[535,181]],sword:[[307,193],[296,654]],share:[[113,398],[501,454]],boss:[113,108],
  boost:[[188,290],[418,568]],
  route:[['pink-0','L'],['pink-1','R'],['pink-2','D'],['share-0','C'],['share-1','C']],
  warp:[[[225,404],[548,554]],[[525,78],[72,482]],[[441,303],[300,569]]]}
];
const stage94={id:'9-4',name:'二十四倍の共鳴回廊',directMultiplier:20,weakMultiplier:12,powerAreaMultiplier:18,hideGimmicks:['撤退','中ボス','敵移動','一部のボスは弱点なし'],
 hint:'直殴り倍率アップ（40倍）・ワープ・ブロック・反射制限・パワーエリア（18倍）・剣持ち敵（24倍）・蘇生・弱点ヒットで弱点移動・HP共有・加速パネル・弱点倍率アップ（12倍）。弱点は番号順に敵から敵へ移動する。弱点に直接ヒットすると次の番号へ移り、剣持ち敵は倒せないが弱点に触れるだけで弱点が移る。緑の敵は高HPで倒せないが、受けたダメージ（弱点・パワーエリア・剣の倍率込み）が中ボス／ボスにそのまま反映される（逆は反映されない）。ボス2のボスは弱点なしなので、緑の敵を狙おう。水色の反射制限は2ターンごとに互いを蘇生し、中ボス・ボスは3ターンごとに倒れた雑魚を全員蘇生する（反射制限は除く）。',
 waves:reson94.map((a,i)=>{
  const hp=60000000+i*2500,keys=(a.cyan||[]).map((_,j)=>'ref-'+j),enemies=[
   ...a.pink.map(([x,y],j)=>c8Mob('pink-'+j,i+j,x,y,hp)),
   ...(a.cyan||[]).map(([x,y],j)=>c94Cyan(keys[j],i+j,x,y,120000,keys.filter(k=>k!==keys[j]))),
   ...(a.share||[]).map(([x,y],j)=>c94Share('share-'+j,i+j,x,y,a.mid?'mid':'boss')),
   ...a.sword.map(([x,y],j)=>c8Sword('sword-'+j,x,y,24))];
  if(a.mid)enemies.push(c7Mid('mid',a.mid[0],a.mid[1],320000000,[],[c7Attack('homing',{count:4,mult:.2}),c7Attack('dropBomb',{radius:130,mult:.22}),{...c94Revive}],{r:76,weakPoint:null,weakEnabled:false}));
  if(i===3)enemies.push(c7Boss('レゾナ',a.boss[0],a.boss[1],240000000,'#d9392f',[c7Attack('reflectCross',{bounces:2,mult:.2}),c7Attack('homing',{count:4,mult:.18}),{...c94Revive},{kind:'move',to:{x:a.move[0],y:a.move[1]},countdown:2,interval:2}],{r:80,shape:'polygon',sides:6,weakEnabled:false,routeWeak:true}));
  if(i===4)enemies.push(c7Boss('レゾナ',a.boss[0],a.boss[1],360000000,'#d9392f',[c7Attack('wayLaser',{count:8,mult:.2}),c7Attack('meteor',{count:3,mult:.18}),{...c94Revive}],{r:80,shape:'polygon',sides:6,weakEnabled:false,noWeak:true}));
  return {name:a.name,step:a.step,...(i>=3?{bossPhase:i-2}:{}),enemies,
   weakRoutes:[{id:'resonance',positions:a.route.map(([target,ang])=>({target,angle:c9Ang[ang]??0,internal:ang==='C',offset:0,radius:15}))}],
   gimmicks:{powerAreas:a.pa.map(([x,y,w,h])=>({x,y,w,h})),warps:c7Warps(...a.warp),...(a.blocks?{blocks:a.blocks.map(b=>block(...b))}:{}),...(a.boost?{boosts:c7Boosts(a.boost)}:{})}};
 })};
CHAPTER_NINE.push(stage94);STAGES.push(stage94);STAGE_BY_ID[stage94.id]=stage94;

// ===== 第9章：9-5 召喚王の重力陣 =====
// 雑魚・増援は [x,y,弱点の向き,重力半径]。弱点の向きがある敵は中ボス／ボスとHPを共有する。
const summon95=[
 {name:'横線の召喚陣',step:'SUMMON / 1',mid:[506,110,9600000],summoner:[51,96],share:[[283,166,'U'],[374,135,'U',105],[357,220,'D']],pink:[[355,356]],
  reserve:[[125,501,'L',105],[489,501,'R',105],[300,608,'D']],lines:[[28,321,592,321]]},
 {name:'双線の狭間',step:'SUMMON / 2',mid:[103,637,12800000,195],summoner:[300,351],share:[[111,134,'U',105],[483,103,'R',105],[511,607,'D',105]],pink:[[107,463],[495,354]],
  reserve:[[300,269,'D'],[300,432,'U']],lines:[[215,28,215,668],[388,28,388,668]]},
 {name:'二列の増援',step:'SUMMON / 3',summoner:[310,381],pink:[[359,209],[554,209],[77,541],[264,541]],
  reserve:[[110,70,null,105],[165,209,null,105],[450,541,null,105],[502,680,null,105]],lines:[[28,206,592,206],[28,539,592,539]]},
 {name:'四辺の包囲陣',step:'SUMMON / 4',boss:[506,365,14400000],summoner:[395,365],share:[[500,123,'U',105],[129,356,'L',105],[500,610,'D',105]],
  reserve:[[153,121,'L'],[213,294,'D'],[211,430,'U'],[151,605,'L']],lines:[[35,32,586,32],[35,697,586,697],[35,32,35,697],[586,32,586,697]]},
 {name:'十字の召喚陣',step:'SUMMON / 5',boss:[307,99,17200000,185],summoner:[307,664],share:[[130,106,'L'],[484,107,'R'],[122,628,'D',105],[489,629,'D',105]],
  reserve:[[230,304,'R',105],[383,306,'D',105],[236,434,'U',105],[385,435,'L',105]],lines:[[309,28,309,699],[28,373,592,373]]}
];
const stage95={id:'9-5',name:'召喚王の重力陣',gimmickOrder:['重力バリア','ダメージライン'],weakMultiplier:24,directMultiplier:30,
 hint:'直殴りは30倍、弱点は24倍。緑の敵を攻撃するとボスにもダメージが入る。召喚敵は3ターン目に増援を呼んで撤退。ボスと中ボスは3ターンごとに、初期配置のHP共有敵だけを蘇生する。',
 waves:summon95.map((a,i)=>{
  const mobs=(points,prefix)=>(points||[]).map(([x,y,side,gravity],j)=>c8Mob(prefix+j,j,x,y,side?2000000:125000,{
   shape:'square',sides:4,gravity,tint:side?'#58893a':'#ee858b',
   ...(side?{weakPoint:{angle:c9Ang[side],radius:15},hpShare:[a.mid?'mid':'boss'],retreatWhenShareDead:true}:{})}));
  const share=mobs(a.share,'share-'),reserves=mobs(a.reserve,'reserve-'),enemies=[...share,...mobs(a.pink,'mob-')];
  if(a.mid||a.boss){
   const [x,y,hp,gravity]=a.mid||a.boss,extra={r:72,gravity,weakEnabled:false,weakPoint:null};
   const attacks=[c7Attack('homing',{count:4}),c7Attack('poisonSpread',{ways:16,volleys:a.mid?2:4,mult:.15,countdown:1,interval:3}),
    a.mid?c7Attack('wayLaser',{count:6,mult:.16,countdown:3,interval:3}):c7Attack('scramble',{mult:.16,countdown:3,interval:3}),
    c7Attack('revive',{targets:share.map(e=>e.key),countdown:3,interval:3})];
   enemies.push(a.mid?c7Mid('mid',x,y,hp,[],attacks,extra):c7Boss('召喚王',x,y,hp,'#cc4949',attacks,{...extra,shape:'square',sides:4}));
  }
  enemies.push(c8Mob('summoner',0,...a.summoner,1e9,{summoner:true,r:20,shape:'square',sides:4,tint:'#e1b730',retreatWhenAlone:!!(a.mid||a.boss),
   attacks:[c7Attack('summon',{keys:reserves.map(e=>e.key),countdown:3,interval:3,retreat:true})]}));
  return {name:a.name,step:a.step,bossPhase:a.boss?i-2:0,enemies,reserves,gimmicks:{damageLines:a.lines.map(line=>damageLine(...line))}};
 })};
CHAPTER_NINE.push(stage95);STAGES.push(stage95);STAGE_BY_ID[stage95.id]=stage95;

// ===== 第9章：9-6 三十六倍の弱点と風の砲台 =====
// 座標はフィールド座標。pur=蘇生敵、share=HP共有敵、reserve=召喚されるHP共有敵。
// midHp=各道中の中ボスHP、mid=[x,y,弱点の向き配列]。中央弱点は内部弱点、2方向の弱点は毎ターン交代。
const gale96=[
 {name:'斜線を越える砲台',step:'GALE 1',pur:[[103,102],[267,104],[348,382],[513,382]],
  blocks:[[28,28,155,155],[435,310,157,153]],winds:[[310,650,300]],lines:[[28,482,592,482],[28,427,592,28,'gold']]},
 {name:'双八角の吹き出し陣',step:'GALE 2',midHp:42000000,pur:[],mid:[[112,364,[-C7H,0]],[508,364,[C7H,C7P]]],
  blocks:[[275,130,70,65],[275,546,70,65]],winds:[[310,375,300]],
  lines:[[28,150,275,150],[345,150,592,150],[28,574,275,574],[345,574,592,574],[112,28,112,712,'gold'],[508,28,508,712,'gold'],[310,188,310,520,'gold']]},
 {name:'召喚される共鳴核',step:'GALE 3',midHp:480000000,mid:[[435,155,[-C7H,0]]],summoner:[530,80],pur:[[225,476],[90,550],[265,644]],share:[[170,156]],
  reserve:[[435,300],[435,413],[435,527],[435,644]],winds:[[310,310,310]],lines:[[28,28,28,712,'gold'],[580,28,580,712]]},
 {name:'風砲王・サイクロン',step:'CYCLONE / 1',boss:[310,365],summoner:[533,645],pur:[[310,132],[310,604]],share:[[135,288],[488,450]],
  reserve:[[485,288],[133,445]],winds:[[310,370,300]],lines:[[211,28,211,680],[407,28,407,680],[142,112,485,583,'gold'],[483,112,144,583,'gold']]},
 {name:'風砲王の終端',step:'CYCLONE / 2',boss:[112,202],move:[510,574],summoner:[307,78],pur:[[443,297],[308,379],[185,473]],
  reserve:[[375,202],[510,202],[114,573],[248,573]],blocks:[[217,169,70,65],[326,546,70,65]],winds:[[420,202,300],[220,574,310]],
  lines:[[28,116,592,116],[28,656,592,656],[28,282,592,282,'gold'],[28,480,592,480,'gold']]}
];
const stage96={id:'9-6',name:'三十六倍の弱点と風の砲台',weakMultiplier:36,laserMultipliers:[3,6,12,60],
 hint:'レーザージェネレーターステージ。レーザー倍率は3／6／12／60倍、弱点36倍。紫の敵は2ターンごとに互いを全蘇生。道中3以降は紫の敵を全て倒すと中ボス／ボスの防御が3倍ダウン。緑の敵は倒せず、受けたダメージを中ボス／ボスに共有する。召喚敵は3ターン後に増援を呼んで撤退。ボス2は2ターンごとに移動。',
 waves:gale96.map((a,i)=>{
  const target=a.boss?'boss':'mid-0',keys=a.pur.map((_,j)=>'pur-'+j),enemies=a.pur.map(([x,y],j)=>{
   const e=c8Mob(keys[j],j,x,y,7000000+i*150000,{tint:'#c79bff',internalWeak:true,weakRadius:15,...(i>=2?{crossSkull:'defense'}:{})});
   return {...e,attacks:[...e.attacks,c7Attack('revive',{targets:keys.filter(k=>k!==keys[j]),countdown:2,interval:2})]};});
  const shares=(points,prefix)=>(points||[]).map(([x,y],j)=>c8Mob(prefix+j,j,x,y,300000000000,{tint:'#58893a',internalWeak:true,weakRadius:15,hpShare:[target],retreatWhenShareDead:true,retreatWhenAlone:true}));
  enemies.push(...shares(a.share,'share-'));const reserves=shares(a.reserve,'reserve-');
  (a.mid||[]).forEach(([x,y,angles],j)=>enemies.push(c7Mid('mid-'+j,x,y,a.midHp,angles,[c7Attack('homing',{count:4,mult:.18}),c7Attack('wayLaser',{count:6,mult:.16,countdown:3,interval:3})],{r:78,shape:'polygon',sides:8})));
  if(a.boss)enemies.push(c7Boss('サイクロン',a.boss[0],a.boss[1],i===3?360000000:540000000,'#c94757',
   [c7Attack('homing',{count:4,mult:.18}),c7Attack('scramble',{mult:.16,countdown:3,interval:3}),...(a.move?[{kind:'move',to:{x:a.move[0],y:a.move[1]},countdown:2,interval:2}]:[])],
   {r:82,shape:'polygon',sides:8,...(a.move?{internalWeak:true,weakRadius:15}:{weakAngles:[-C7H,C7H]})}));
  if(a.summoner)enemies.push(c8Mob('summoner',0,...a.summoner,1e9,{summoner:true,r:20,shape:'square',sides:4,tint:'#e1b730',retreatWhenAlone:true,
   attacks:[c7Attack('summon',{keys:reserves.map(e=>e.key),countdown:3,interval:3,retreat:true})]}));
  return {name:a.name,step:a.step,...(a.boss?{bossPhase:i-2}:{}),enemies,reserves,
   ...(i>=2?{crossSkulls:[{id:'defense',members:keys,effects:[{type:'defenseDown',targets:[target],multiplier:3}]}]}:{}),
   gimmicks:{blocks:(a.blocks||[]).map(b=>block(...b)),winds:a.winds.map(([x,y,r])=>windDevice(x,y,'push',r,145,1)),damageLines:a.lines.map(line=>damageLine(...line))}};
 })};
CHAPTER_NINE.push(stage96);STAGES.push(stage96);STAGE_BY_ID[stage96.id]=stage96;

// 第1章EX：各敵のHPは c1ExMid / c1ExBoss の座標の次の数値で指定する。
const c1ExMid=(key,x,y,hp,angles,kind='laser',extra={})=>c7Mid(key,x,y,hp,[angles[0]],
 [c7Attack(kind,{count:3,hits:2,mult:.18,countdown:2,interval:3}),c7Attack('spread',{ways:8,volleys:1,mult:.14,countdown:3,interval:3}),...(extra.move?[{kind:'move',...extra.move}]:[])],
 {r:78,shape:'square',sides:4,weakAngles:angles.length>1?angles:null,weakPoint:{angle:angles[0],radius:15},...(extra.crossSkull?{crossSkull:extra.crossSkull}:{})});
const c1ExBoss=(x,y,hp,angles)=>c7Boss('テンペスト',x,y,hp,'#48b3a7',
 [c7Attack('crossLaser',{mult:.16,countdown:2,interval:3}),c7Attack('meteor',{count:2,mult:.18,countdown:3,interval:4}),c7Attack('spread',{ways:8,volleys:2,mult:.12,countdown:4,interval:4})],
 {r:82,shape:'square',sides:4,weakEnabled:false,weakAngles:angles});
const stage1EX={id:'1-EX',name:'四角王の対角試練',
 hint:'メインギミックなし。中ボスの弱点と移動先を狙おう。ボス戦は中ボスを倒すとボスに弱点が現れる。',
 waves:[
 {name:'中央の双弱点',step:'DUAL 1',enemies:[c1ExMid('mid',310,350,25000,[0,C7P])],gimmicks:{}},
 {name:'対角を渡る番人',step:'DUAL 2',enemies:[c1ExMid('mid',465,180,40000,[-C7H,C7H],'laser',{move:{to:{x:155,y:540},countdown:3,interval:3}})],gimmicks:{}},
 {name:'向かい合う双番人',step:'DUAL 3',enemies:[
  c1ExMid('mid-left',145,165,20000,[0],'laser',{move:{to:{x:145,y:350},countdown:2,interval:2}}),
  c1ExMid('mid-right',475,545,20000,[C7P],'pierce',{move:{to:{x:475,y:350},countdown:2,interval:2}})],gimmicks:{}},
 {name:'四角王の対角陣',step:'TEMPEST / 1',bossPhase:1,enemies:[
  c1ExMid('mid',465,180,30000,[C7P,C7H],'laser',{crossSkull:'weak'}),
  c1ExBoss(155,535,60000,[0,-C7H])],crossSkulls:c7WeakGrant('boss',0),gimmicks:{}},
 {name:'四角王の上下封印',step:'TEMPEST / 2',bossPhase:2,enemies:[
  c1ExMid('mid-top',310,145,36000,[0,C7P],'laser',{crossSkull:'weak',move:{to:{x:475,y:145},countdown:1,interval:1}}),
  c1ExMid('mid-bottom',310,565,36000,[0,C7P],'pierce',{crossSkull:'weak',move:{to:{x:145,y:565},countdown:1,interval:1}}),
  c1ExBoss(310,355,80000,[-C7H,C7H])],crossSkulls:c7WeakGrant('boss',-C7H),gimmicks:{}}
 ]};
STAGES.splice(STAGES.findIndex(s=>s.id==='1-6')+1,0,stage1EX);STAGE_BY_ID[stage1EX.id]=stage1EX;

// 難易度は1〜6。nullは未設定。各ステージの数値をここで編集する。
const STAGE_DIFFICULTIES={
 '1-1':1,'1-2':1,'1-3':1,'1-4':1,'1-5':1,'1-6':1,'1-EX':2,
 '2-1':1,'2-2':1,'2-3':1,'2-4':1,'2-5':1,'2-6':2,
 '3-1':2,'3-2':2,'3-3':2,'3-4':2,'3-5':2,'3-6':3,
 '4-1':3,'4-2':3,'4-3':3,'4-4':3,'4-5':3,'4-6':3,
 '5-1':3,'5-2':3,'5-3':3,'5-4':4,'5-5':6,'5-6':3,
 '6-1':3,'6-2':3,'6-3':4,'6-4':3,'6-5':5,'6-6':4,
 '7-1':3,'7-2':4,'7-3':3,'7-4':5,'7-5':4,'7-6':6,
 '8-1':4,'8-2':3,'8-3':5,'8-4':5,'8-5':3,'8-6':6,
 '9-1':3,'9-2':4,'9-3':3,'9-4':6,'9-5':4,'9-6':5
};
