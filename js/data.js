'use strict';
// キャラクター・アビリティ・友情定義・敵攻撃定義・編成位置（ステージは stages.js、敵は enemies.js）
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
      friendship:{kind:'copy',power:0}},
    {id:'anchor',name:'ANCHOR',kana:'アンカー',shape:'anchor',color:'#328e93',type:'反射 / 砲撃',hp:4400,atk:1120,speed:230,
      friendship:{kind:'trident',power:340,radius:255,maxHits:3}},
    {id:'kite',name:'KITE',kana:'カイト',shape:'kite',color:'#8c75bd',type:'反射 / スピード',hp:4100,atk:1090,speed:265,
      friendship:{ kind: 'explosion', power: 360, radius: 235, maxHits: 3 }},
    {id:'suture',name:'SUTURE',kana:'スーチャー',shape:'chevron',color:'#ca7780',type:'貫通 / バランス',hp:4400,atk:1080,speed:235,
      friendship:{kind:'spread',power:75,ways:32,volleys:3}},
    {id:'lattice',name:'LATTICE',kana:'ラティス',shape:'dodecagon',color:'#6995c6',type:'貫通 / 砲撃',hp:4000,atk:990,speed:190,
      friendship:{kind:'reflectLaser',power:200,bounces:4}},
    {id:'basalt',name:'BASALT',kana:'バサルト',shape:'anvil',color:'#717788',type:'貫通 / パワー',hp:5000,atk:1350,speed:160,
      friendship:{kind:'explosion',power:260,radius:205,maxHits:3}},
    {id:'sparrow',name:'SPARROW',kana:'スパロー',shape:'dart',color:'#b3924a',type:'貫通 / スピード',hp:3850,atk:1080,speed:285,
      friendship:{kind:'homing',power:175,count:12}},
    {id:'kepler',name:'KEPLER',kana:'ケプラー',shape:'rosette',color:'#4cabc1',type:'貫通 / スピード',hp:3850,atk:1050,speed:280,
      friendship:{kind:'satellites',power:145,count:4}},
    {id:'helix',name:'HELIX',kana:'ヘリックス',shape:'spiral',color:'#a573cd',type:'反射 / 砲撃',hp:4100,atk:980,speed:190,
      friendship:{kind:'involute',power:340,count:6}},
    {id:'saber',name:'SABER',kana:'セイバー',shape:'saber',color:'#539c7f',type:'貫通 / バランス',hp:4450,atk:1120,speed:220,
      friendship:{kind:'slash',power:180}},
    {id:'tesla',name:'TESLA',kana:'テスラ',shape:'fork',color:'#cf9c42',type:'反射 / パワー',hp:4900,atk:1320,speed:155,
      friendship:{kind:'discharge',power:620}},
    {id:'facet',name:'FACET',kana:'ファセット',shape:'gem',color:'#c36d96',type:'貫通 / 砲撃',hp:4000,atk:970,speed:195,
      friendship:{kind:'scramble',power:190}},
    {id:'aster',name:'ASTER',kana:'アステル',shape:'sixstar',color:'#737fbc',type:'反射 / バランス',hp:4400,atk:1100,speed:225,
      friendship:{kind:'meteor',power:255,count:12}}
  );
  CHARACTERS.push(
    {id:'nimbus',name:'NIMBUS',kana:'ニンバス',shape:'windmill',color:'#429bc5',type:'貫通 / スピード',hp:4200,atk:1080,speed:280,friendship:{kind:'involute',power:290,count:8}},
    {id:'seam',name:'SEAM',kana:'シーム',shape:'spool',color:'#bf785e',type:'貫通 / バランス',hp:4600,atk:1180,speed:230,friendship:{kind:'saw',power:105,count:4}}
  );
  for(const c of CHARACTERS)c.shotType=c.type.startsWith('貫通')?'pierce':'reflect';
  const isPiercing=unit=>unit.shotType==='pierce';
  const enemyHitRetention=unit=>isPiercing(unit)?(unit.battleStyle==='power'?.57:.60):(unit.battleStyle==='power'?.74:.80);
  // CHARACTERSと同じ順に並べる
  const SECONDARIES = {
    nimbus:{kind:'explosion',power:250,radius:205,maxHits:3},seam:{kind:'relation',power:430},
    suture:{kind:'saw',power:65,count:4},
    lattice:{kind:'dropBomb',power:170,count:3,radius:140,maxHits:3},
    basalt:{kind:'speedUp',power:0},
    sparrow:{kind:'machinegun',power:45,count:50},
    anchor: {kind:'homing',power:95,count:12},
    kite: {kind:'thunder',power:530,radius:480},
    nova: { kind: 'splitShot', power: 48 },
    axis: { kind: 'explosion', power: 240, radius: 205, maxHits: 3 },
    prism: { kind: 'trident', power: 340, radius: 255, maxHits: 3 },
    burst: {kind:'drones',power:160,count:3},
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
    shard:{kind:'pierce',power:260,count:8},
    kepler:{kind:'speedUp',power:0},
    helix:{kind:'plasma',power:105},
    saber:{kind:'roundBurst',power:410,radius:340,maxHits:4},
    tesla:{kind:'energyBall',power:480,radius:370,maxHits:4},
    facet:{kind:'weakPierce',power:190},
    aster:{kind:'pierce',power:210,count:8}
  };
  for(const c of CHARACTERS)c.secondary=SECONDARIES[c.id];
  const BATTLE_STYLES = {
    balance: '被ダメージ20%軽減・直殴りダメージ20%アップ。',
    speed: '各ショットで最初に壁へ触れたとき、一度だけ加速。',
    power: '各ショットで最初の直殴りダメージが2倍。',
    artillery: '自身の友情コンボの威力が2倍。'
  };
  for (const c of CHARACTERS) c.battleStyle = c.type.includes('バランス') ? 'balance' : c.type.includes('スピード') ? 'speed' : c.type.includes('パワー') ? 'power' : 'artillery';
  const ABILITIES={asw:['アンチ減速壁','減速壁による減速を無効化。'],antiWind:['アンチウィンド','引き寄せ・吹き出しウィンドによる強制移動を無効化。'],double:['友情コンボ×2','1ショットで主・副友情をそれぞれ2回まで発動。'],heal:['回復','移動中に味方に触れるとHP300回復。各味方につき1ショット1回。'],ab:['アンチブロック','ブロックをすり抜ける。'],adw:['アンチダメージウォール','ダメージウォールを無効化。'],aw:['アンチワープ','ワープ転送を無効化。'],agb:['アンチ重力バリア','重力バリアの減速を無効化。'],ms:['マインスイーパー','触れた地雷を安全に除去する。フォトンへの変換はしない。'],pm:['フォトンマスター','各エリア開始時にフォトンを4個獲得。'],regen:['リジェネ','毎ターン開始時、チームHPを1200回復。']};
  const abilitySets = {
    nimbus:['adw','asw','pm'],seam:['aw','asw','heal'],
    suture:['adw','ab','heal'],lattice:['ms','double'],basalt:['agb','ms','pm'],sparrow:['adw','aw'],
    anchor:['antiWind','ab','pm'],
    kite:['antiWind','adw'],
    nova: ['agb', 'adw'],
    axis: ['ms', 'agb'],
    prism: ['adw', 'aw'],
    burst: ['agb','aw','regen'],
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
    shard: ['aw', 'ab'],
    kepler:['adw','ms'],
    helix:['agb','antiWind','regen'],
    saber:['ms','antiWind'],
    tesla:['aw','antiWind','heal'],
    facet:['adw','double'],
    aster:['adw','antiWind','pm']
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
    slash:{name:'斬撃',label:'SLASH',describe:()=> '付近の敵を狙い、尖った刃で12回斬りつける。射程180。'},
    involute:{name:'インボリュートスフィア',label:'INVOLUTE SPHERE',describe:f=> (f.count??6)+'つの弾が螺旋を描きながら広がり、敵を貫通して攻撃する。'},
    satellites:{name:'衛星弾',label:'SATELLITES',describe:f=> '触れた味方の周囲を'+f.count+'個の弾が旋回。手番キャラが止まるまで攻撃する。'},
    discharge:{name:'放電',label:'DISCHARGE',describe:()=> '周囲の敵へ電撃を放ち、近くの別の敵へ順に伝わる。同じ敵には1回まで。'},
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
  const friendshipTitle=f=>{const name=FRIENDSHIP_KINDS[f.kind].name;if(['reflectLaser','reflectCross'].includes(f.kind))return name+'（'+f.bounces+'）';if(['sniper','homing','meteor','pierce','dropBomb','splitShot','machinegun','drones','satellites','involute'].includes(f.kind))return name+'（'+(f.count??5)+'）';if(f.kind==='spread')return name+'（'+f.ways+'×'+f.volleys+'）';return name;};

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


  const FORMATION_POSITIONS = {
    1: [[310, 610]],
    2: [[205, 610], [415, 610]],
    3: [[151, 562], [310, 636], [469, 562]],
    4: [[112, 570], [246, 636], [374, 636], [508, 570]],
  };
