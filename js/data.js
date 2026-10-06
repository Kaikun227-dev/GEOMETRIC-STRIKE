'use strict';
// キャラクター・友情定義・敵攻撃定義・ステージデータ
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // DATA — characters, friendship combos, enemy attacks, stages
  // ---------------------------------------------------------------------------
  const MAX_TEAM = 4;
  const UNIT_RADIUS = 23;
  const DRONE_TRAVEL_DURATION = 0.35;
  const DRONE_BARRAGE_DURATION = 1;

  // hp: チームHPに加算 / atk: 1000 = 等倍 / speed: 100 = 等倍
  // friendship: { kind, ... } の kind は FRIENDSHIP_KINDS のキー
  const CHARACTERS = [
    { id: 'nova', name: 'NOVA', kana: 'ノヴァ', shape: 'circle', color: '#15b7d4', type: '反射 / スピード', hp: 3800, atk: 1000, speed: 260,
      friendship: { kind: 'sniper', power: 500, count: 3 } },
    { id: 'axis', name: 'AXIS', kana: 'アクシス', shape: 'triangle', color: '#42b98c', type: '反射 / パワー', hp: 4300, atk: 1240, speed: 140,
      friendship: { kind: 'homing', power: 120, count: 12 } },
    { id: 'prism', name: 'PRISM', kana: 'プリズム', shape: 'diamond', color: '#9270ec', type: '貫通 / バランス', hp: 3900, atk: 1100, speed: 200,
      friendship: { kind: 'laser', power: 360, hits: 3 } },
    { id: 'burst', name: 'BURST', kana: 'バースト', shape: 'square', color: '#f2922b', type: '反射 / バランス', hp: 4000, atk: 1150, speed: 180,
      friendship: { kind: 'explosion', power: 460, radius: 205, maxHits: 4 } },
  ];
  CHARACTERS.push(
    { id: 'galaxy', name: 'GALAXY', kana: 'ギャラクシー', shape: 'hexagon', color: '#3478ed', type: '反射 / スピード', hp: 3700, atk: 1030, speed: 300,
      friendship: { kind: 'scramble', power: 245 } },
    { id: 'gold', name: 'GOLD', kana: 'ゴールド', shape: 'octagon', color: '#ddb426', type: '貫通 / 砲撃', hp: 4100, atk: 920, speed: 160, 
      friendship: { kind: 'spread', power: 122, ways: 16, volleys: 5 } },
    {id:'lumen',name:'LUMEN',kana:'ルーメン',shape:'star',color:'#df60af',type:'反射 / バランス',hp:3900,atk:1060,speed:240,
      friendship:{kind:'reflectLaser',power:290,bounces:4}},
    {id:'crux',name:'CRUX',kana:'クルクス',shape:'cross',color:'#e35657',type:'反射 / 砲撃',hp:4200,atk:940,speed:190,
      friendship:{kind:'reflectCross',power:135,bounces:4}},
    {id:'volt',name:'VOLT',kana:'ヴォルト',shape:'bolt',color:'#19ab9b',type:'反射 / スピード',hp:3600,atk:1020,speed:270,
      friendship:{kind:'plasma',power:164}},
    {id:'orbit',name:'ORBIT',kana:'オービット',shape:'pentagon',color:'#8aad30',type:'反射 / 砲撃',hp:4500,atk:1280,speed:160,
      friendship:{kind:'energyBall',power:750,radius:370,maxHits:4}},
    {id:'lance',name:'LANCE',kana:'ランス',shape:'arrow',color:'#dc6849',type:'貫通 / バランス',hp:4200,atk:1120,speed:220,
      friendship:{kind:'pierce',power:280,count:12}},
    {id:'iris',name:'IRIS',kana:'アイリス',shape:'eye',color:'#6869d9',type:'反射 / パワー',hp:3800,atk:980,speed:190,
      friendship:{kind:'weakPierce',power:265}},
    {id:'ripple',name:'RIPPLE',kana:'リプル',shape:'hourglass',color:'#cc6891',type:'反射 / バランス',hp:4400,atk:1050,speed:210,
      friendship:{kind:'roundBurst',power:470,radius:340,maxHits:4}},
    {id:'comet',name:'COMET',kana:'コメット',shape:'crescent',color:'#b156b8',type:'反射 / パワー',hp:4600,atk:1260,speed:150,
      friendship:{kind:'dropBomb',power:300,count:5,radius:140,maxHits:3}},
    {id:'pyre',name:'PYRE',kana:'パイア',shape:'flame',color:'#d57b22',type:'反射 / 砲撃',hp:4000,atk:1000,speed:180,
      friendship:{kind:'eruption',power:190,radius:145}},
    {id:'arc',name:'ARC',kana:'アーク',shape:'fan',color:'#397ecd',type:'貫通 / スピード',hp:3900,atk:1040,speed:280,
      friendship:{kind:'thunder',power:740,radius:480}},
    {id:'echo',name:'ECHO',kana:'エコー',shape:'bowtie',color:'#997aae',type:'反射 / バランス',hp:4100,atk:1080,speed:230,
      friendship:{kind:'copy',power:0}},
    {id:'zephyr',name:'ZEPHYR',kana:'ゼファー',shape:'wing',color:'#469b79',type:'反射 / スピード',hp:3700,atk:1020,speed:290,
      friendship:{ kind: 'splitShot', power: 84 }},
    {id:'salvo',name:'SALVO',kana:'サルヴォ',shape:'crown',color:'#d55073',type:'反射 / 砲撃',hp:4000,atk:990,speed:180,
      friendship:{kind:'drones',power:160,count:5}},
    {id:'vesper',name:'VESPER',kana:'ヴェスパー',shape:'satellite',color:'#6864b7',type:'反射 / バランス',hp:4100,atk:1060,speed:220,
      friendship:{kind:'machinegun',power:36,count:80}},
    {id:'cobalt',name:'COBALT',kana:'コバルト',shape:'gear',color:'#447f9e',type:'反射 / パワー',hp:4700,atk:1230,speed:160,
      friendship:{kind:'saw',power:90,count:4}},
    {id:'ribbon',name:'RIBBON',kana:'リボン',shape:'ribbon',color:'#cd79a1',type:'反射 / スピード',hp:3800,atk:1080,speed:275,
      friendship:{kind:'relation',power:650}},
    {id:'aegis',name:'AEGIS',kana:'イージス',shape:'shield',color:'#8e9858',type:'貫通 / バランス',hp:4500,atk:1040,speed:200,
      friendship:{kind:'eruption',power:190,radius:145}},
    {id:'shard',name:'SHARD',kana:'シャード',shape:'shuriken',color:'#b18542',type:'貫通 / スピード',hp:3900,atk:1100,speed:260,
      friendship:{kind:'copy',power:0}}
  );
  CHARACTERS.push(
    {id:'anchor',name:'ANCHOR',kana:'アンカー',shape:'anchor',color:'#328e93',type:'反射 / 砲撃',hp:4400,atk:1120,speed:230,
      friendship:{kind:'trident',power:340,radius:255,maxHits:3}},
    {id:'kite',name:'KITE',kana:'カイト',shape:'kite',color:'#8c75bd',type:'反射 / スピード',hp:4100,atk:1090,speed:265,
      friendship:{ kind: 'explosion', power: 360, radius: 235, maxHits: 3 }}
  );
  CHARACTERS.push(
    {id:'suture',name:'SUTURE',kana:'スーチャー',shape:'chevron',color:'#ca7780',type:'貫通 / バランス',hp:4400,atk:1080,speed:235,friendship:{kind:'spread',power:75,ways:32,volleys:3}},
    {id:'lattice',name:'LATTICE',kana:'ラティス',shape:'dodecagon',color:'#6995c6',type:'貫通 / 砲撃',hp:4000,atk:990,speed:190,friendship:{kind:'reflectLaser',power:200,bounces:4}},
    {id:'basalt',name:'BASALT',kana:'バサルト',shape:'anvil',color:'#717788',type:'貫通 / パワー',hp:5000,atk:1350,speed:160,friendship:{kind:'explosion',power:260,radius:205,maxHits:3}},
    {id:'sparrow',name:'SPARROW',kana:'スパロー',shape:'dart',color:'#b3924a',type:'貫通 / スピード',hp:3850,atk:1080,speed:285,friendship:{kind:'homing',power:175,count:12}}
  );
  for(const c of CHARACTERS)c.shotType=c.type.startsWith('貫通')?'pierce':'reflect';
  const isPiercing=unit=>unit.shotType==='pierce';
  const enemyHitRetention=unit=>isPiercing(unit)?(unit.battleStyle==='power'?.57:.60):(unit.battleStyle==='power'?.74:.80);
  // CHARACTERSと同じ順に並べる
  const SECONDARIES = {
    suture:{kind:'saw',power:65,count:4},
    lattice:{kind:'dropBomb',power:170,count:3,radius:140,maxHits:3},
    basalt:{kind:'speedUp',power:0},
    sparrow:{kind:'machinegun',power:45,count:50},
    anchor: {kind:'homing',power:95,count:12},
    kite: {kind:'thunder',power:530,radius:480},
    nova: { kind: 'splitShot', power: 48 },
    axis: { kind: 'explosion', power: 240, radius: 205, maxHits: 3 },
    prism: { kind: 'trident', power: 340, radius: 255, maxHits: 3 },
    burst: { kind: 'sniper', power: 360, count: 2 },
    galaxy: { kind: 'meteor', power: 220, count: 10 },
    gold: { kind: 'homing', power: 90, count: 8 },
    lumen: { kind: 'reflectCross', power: 165, bounces: 2 },
    crux: {kind: 'laser', power: 210, hits: 3 },
    volt: { kind: 'spread', power: 65, ways: 16, volleys: 3 },
    orbit: { kind: 'explosion', power: 200, radius: 205, maxHits: 3 },
    lance: { kind: 'homing', power: 90, count: 8 },
    iris: { kind: 'sniper', power: 220, count: 5 },
    ripple: { kind: 'scramble', power: 132 },
    comet: { kind: 'spread', power: 70, ways: 16, volleys: 3 },
    pyre: { kind: 'meteor', power: 310, count: 8 },
    arc: { kind: 'reflectCross', power: 90, bounces: 2 },
    echo: { kind: 'speedUp', power: 0 },
    zephyr: {kind:'plasma',power:80},
    salvo: { kind: 'laser', power: 280, hits: 3 },
    vesper: { kind: 'homing', power: 90, count: 8 },
    cobalt: { kind: 'explosion', power: 210, radius: 180, maxHits: 3 },
    ribbon: { kind: 'speedUp', power: 0 },
    aegis: {kind:'reflectLaser',power:180,bounces:4},
    shard: {kind:'pierce',power:260,count:8}
  };
  for(const c of CHARACTERS)c.secondary=SECONDARIES[c.id];
  const BATTLE_STYLES = {
    balance: '被ダメージ20%軽減・直殴りダメージ20%アップ。',
    speed: '各ショットで最初に壁へ触れたとき、一度だけ加速。',
    power: '各ショットで最初の直殴りダメージが2倍。',
    artillery: '自身の友情コンボの威力が2倍。'
  };
  for (const c of CHARACTERS) c.battleStyle = c.type.includes('バランス') ? 'balance' : c.type.includes('スピード') ? 'speed' : c.type.includes('パワー') ? 'power' : 'artillery';
  const ABILITIES={antiWind:['アンチウィンド','引き寄せ・吹き出しウィンドによる強制移動を無効化。'],double:['友情コンボ×2','1ショットで主・副友情をそれぞれ2回まで発動。'],heal:['回復','移動中に味方に触れるとHP300回復。各味方につき1ショット1回。'],ab:['アンチブロック','ブロックをすり抜ける。'],adw:['アンチダメージウォール','ダメージウォールを無効化。'],aw:['アンチワープ','ワープ転送を無効化。'],agb:['アンチ重力バリア','重力バリアの減速を無効化。'],ms:['マインスイーパー','触れた地雷を安全に除去する。フォトンへの変換はしない。'],pm:['フォトンマスター','各エリア開始時にフォトンを4個獲得。'],regen:['リジェネ','毎ターン開始時、チームHPを1200回復。']};
  const abilitySets = {
    suture:['adw','ab','heal'],lattice:['ms','double'],basalt:['agb','ms','pm'],sparrow:['adw','aw'],
    anchor:['antiWind','ab','pm'],
    kite:['antiWind','adw'],
    nova: ['agb', 'adw'],
    axis: ['ms', 'agb'],
    prism: ['adw', 'aw'],
    burst: ['regen', 'aw'],
    galaxy: ['aw', 'agb'],
    gold: ['double','pm','ms'],
    lumen: ['adw', 'agb'],
    crux: ['aw', 'ms'],
    volt: ['agb', 'pm'],
    orbit: ['ms', 'aw'],
    lance: ['ab', 'adw'],
    iris: ['agb', 'aw'],
    ripple: ['agb','ab', 'regen'],
    comet: ['adw', 'ms'],
    pyre: ['ab', 'adw'],
    arc: ['agb', 'aw'],
    echo: ['adw', 'pm'],
    zephyr: ['aw', 'ms'],
    salvo: ['agb', 'adw'],
    vesper: ['regen', 'aw','ab'],
    cobalt: ['ms', 'ab'],
    ribbon: ['heal', 'agb'],
    aegis: ['heal', 'ms'],
    shard: ['aw', 'ab']
  };
  for(const c of CHARACTERS)c.abilities=abilitySets[c.id];
  const hasAbility=(u,id)=>u.abilities?.includes(id);
  const abilityNames=u=>u.abilities.map(id=>ABILITIES[id][0]).join(' / ');
  const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
  const DEFAULT_TEAM = ['nova', 'axis', 'prism', 'burst'];

  const FRIENDSHIP_KINDS = {
    revive:{name:'蘇生',label:'REVIVE'},effect:{name:'効果',label:'EFFECT'},
    machinegun:{name:'マシンガン',label:'MACHINE GUN',describe:f=>'近くの敵へ'+f.count+'発を高速連射。敵を倒すと次の敵を狙う。'},
    drones:{name:'レーザードローン',label:'LASER DRONES',describe:f=>f.count+'機が発動元キャラから遠い敵を優先して囲み、順番に2巡射撃。射撃中に敵を倒しても2巡を完了してから別の敵へ移動。各機最大4射。'},
    saw:{name:'チップソー',label:'CHIP SAWS',describe:()=> '近くの敵へ低速の回転刃を連射。貫通しながら連続ダメージ。'},
    relation:{name:'リレーションカッター',label:'RELATION CUTTER',describe:()=> '手番キャラが止まるまで、出番キャラ以外の味方の間を編成順に巡回し、経路上の敵を斬る。'},
    vibration:{name:'振動',label:'SHOCKWAVE'},
    pierce:{name:'貫通弾',label:'PIERCING ARROWS',describe:f=>'ランダムな敵へ矢印形の貫通弾を'+f.count+'発放つ。'},
    weakPierce:{name:'弱点貫通弾',label:'WEAK ARROWS',describe:()=> '全ての生存中の弱点へそれぞれ5発の貫通弾。弱点がない場合は真上へ5発。'},
    roundBurst:{name:'ラウンドバースト',label:'ROUND BURST',describe:f=>'触れた味方が動く間、半径がゆっくり拡大。最大'+f.radius+'まで広がり、停止時に爆発する。'},
    dropBomb:{name:'ドロップボム',label:'DROP BOMBS',describe:f=>'ランダムな場所へ'+f.count+'個のボムを投げ、着弾時に爆発。'},
    eruption:{name:'イラプション',label:'ERUPTION',describe:()=> 'ランダムな敵の足元に巨大な炎柱。周囲の敵にも連続ダメージ。'},
    thunder:{name:'サンダーウェーブ',label:'THUNDER',describe:()=> '進行方向へ、扇状に大きく広がる電撃を放つ。'},
    copy:{name:'コピー',label:'COPY',describe:()=> '触れた味方の主友情を自分の位置から発動。コピー同士は再コピーしない。'},
    speedUp:{name:'スピードアップ',label:'SPEED UP',describe:()=> '触れた移動中の味方を加速させる。'},
    splitShot:{name:'反射分裂弾',label:'SPLIT SHOT',describe:f=> '進行方向へ'+(f.count??5)+'発。壁で二つに分裂して反射し、各弾は最大3回分裂する。'},
    scramble:{name:'スクランブルレーザー',label:'SCRAMBLE LASER',describe:()=> '32方向からランダムに選んだ方向へ、0.045秒間隔で10本のレーザーを放つ。各2回反射。'},
    trident:{name:'トライデントウォールミサイル',label:'TRIDENT MISSILE',describe:()=> '進行方向へ3wayの貫通ミサイル。壁に当たると広範囲に爆発し、味方の友情も誘発。'},
    mines:{name:'地雷散布',label:'MINE FIELD'},photons:{name:'フォトン散布',label:'PHOTON FIELD'},
    reflectLaser:{name:'反射レーザー',label:'REFLECT LASER',describe:f=>'触れたキャラの進行方向へ極太レーザーを1回発射。壁で最大'+f.bounces+'回反射する。'},
    reflectCross:{name:'反射クロスレーザー',label:'REFLECT CROSS',describe:f=> 'X字の4方向へレーザーを1回発射。それぞれ壁で'+f.bounces+'回反射する。'},
    plasma:{name:'プラズマ',label:'PLASMA',describe:()=> '触れた味方との間に移動中ずっとプラズマ線を張り、線に触れた敵へ連続ダメージ。'},
    energyBall:{name:'エナジーボール',label:'ENERGY BALL',describe:()=> '触れたキャラの進行方向へ弾を発射。敵に命中すると広範囲に激しく爆発する。'},
    meteor: { name: 'メテオ', label: 'METEOR', describe: f => `ランダムな敵へ順番に${f.count}個のメテオを落とす。` },
    spread: { name: '拡散弾', label: 'SPREAD', describe: f => `全方位に${f.ways}wayの弾を${f.volleys}回放つ。` },
    sniper: { name: 'スナイパーショット', label: 'SNIPER SHOT', describe: f => `近くの敵${f.count}体を狙い撃つ。` },
    laser: { name: 'レーザー', label: 'LASER', describe: f => `近くの敵へ直線のレーザーを放つ。最大${f.hits}回の多段ヒット。` },
    homing: { name: 'ホーミング', label: 'HOMING', describe: f => `敵に向かってホーミング弾を${f.count}発放つ。` },
    explosion: { name: '爆発', label: 'EXPLOSION', describe: f => `周囲に爆発を起こす。中心に近い敵ほど多段ヒット（最大${f.maxHits}回）。` },
  };
  const friendshipTitle=f=>{const name=FRIENDSHIP_KINDS[f.kind].name;if(['reflectLaser','reflectCross'].includes(f.kind))return name+'（'+f.bounces+'）';if(['sniper','homing','meteor','pierce','dropBomb','splitShot','machinegun','drones'].includes(f.kind))return name+'（'+(f.count??5)+'）';if(f.kind==='spread')return name+'（'+f.ways+'×'+f.volleys+'）';return name;};

  // 敵の攻撃。mult は基本ダメージ（ウェーブごとに上昇）に対する倍率。
  // 敵データ側の attacks: [{ kind, ...上書き }] で個別に調整できます。
  const ENEMY_ATTACKS = {
    revive:{mult:0},effect:{mult:0},
    vibration:{mult:.65,radius:190,push:95},
    reflectLaser:{mult:.22,bounces:2},pierce:{mult:.3,count:3},
    mines:{mult:0,count:4},photons:{mult:0,count:4},
    meteor: { mult: 0.32, count: 3 },
    spread: { mult: 0.22, ways: 12, volleys: 2 },
    sniper: { mult: 1 },
    laser: { mult: 0.42, hits: 3 },
    homing: { mult: 0.4, count: 3 },
    explosion: { mult: 0.24, radius: 112, maxHits: 4 },
  };

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
  // Staggered routes, offset rings and explicit circular rebound pairs.
  const foe = (x,y,r,hp,sides=6,kind='sniper',delay=3) => ({x,y,r,hp,sides,attacks:[{kind,countdown:delay,interval:3}]});
  const orb = (x,y,r,hp,kind='homing',delay=3) => ({...foe(x,y,r,hp,0,kind,delay),shape:'circle'});
  const core = (x,y,r,hp,sides,attacks,extra={}) => ({x,y,r,hp,sides,boss:true,attacks,...extra});
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

  const gravity=(e,r=115)=>({...e,gravity:r});
  const scatter=(e,kind)=>({...e,attacks:[...e.attacks,{kind,count:4,countdown:2,interval:2}]});
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
  const specialist=(kind,x,y,r=32,hp=3600)=>({...foe(x,y,r,hp,kind==='turret'?4:kind==='lancer'?3:8,kind==='turret'?'reflectLaser':kind==='lancer'?'pierce':'homing',2),species:kind,tint:kind==='turret'?'#9b82c5':kind==='lancer'?'#cf9470':'#779fa5',armor:kind==='sentinel'?.65:1});
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

  const FORMATION_POSITIONS = {
    1: [[310, 610]],
    2: [[205, 610], [415, 610]],
    3: [[151, 562], [310, 636], [469, 562]],
    4: [[112, 570], [246, 636], [374, 636], [508, 570]],
  };
