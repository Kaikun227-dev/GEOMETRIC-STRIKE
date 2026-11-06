'use strict';

{
  const storageKey = 'geometric-strike-maker-v1';
  const parts = {
    enemy: ['雑魚敵', '#be6262'],
    boss: ['ボス', '#923d55'],
    boosts: ['加速パネル', '#268660', { r: 27 }, '»'],
    mines: ['地雷', '#c45041', { r: 16, damage: 1000 }, '!'],
    blocks: ['ブロック', '#64788c', { w: 85, h: 38 }, '壁'],
    warps: ['ワープ', '#8054af', { r: 23 }],
    walls: ['ダメージウォール', '#cb443d'],
    slowWalls: ['減速壁', '#526ca7'],
    damageLines: ['ダメージライン', '#788998', { damage: 1000, color: 'silver' }],
    winds: ['ウィンド', '#48899d', { r: 20, mode: 'push', radius: 250, force: 120, countdown: 1, interval: 2 }, '風'],
    photons: ['エナジーフォトン', '#aa7918', { r: 16 }, '◆'],
    hearts: ['ハートパネル', '#b95580', { r: 26 }, '♥'],
    powerAreas: ['パワーエリア', '#b27330', { w: 160, h: 110 }, 'POWER'],
    swords: ['剣パネル', '#aa7918', { r: 22 }, '剣'],
    powerSwitches: ['パワースイッチ', '#6876b7', { r: 24, initial: 0 }, 'SW'],
    typePanels: ['撃種変化パネル', '#527ea5', { r: 24 }, '撃'],
    transPanels: ['透明パネル', '#716ab3', { r: 25 }, '透'],
    containers: ['フォトンコンテナ', '#927222', { r: 30, n: 4 }, '光'],
    barriers: ['結界', '#8c5aa7', { w: 92, h: 62, n: 4 }, '結'],
  };
  const attackKinds = Object.keys(ENEMY_ATTACKS).filter(kind => FRIENDSHIP_KINDS[kind]);
  const shapes = { 3: '三角形', 4: '四角形', 5: '五角形', 6: '六角形', 7: '七角形', 8: '八角形', circle: '円', cruciform: '十字', starBattery: '星形' };
  const sides = { left: '左', right: '右', top: '上', bottom: '下' };
  const maxWaves = 10;
  const maxParts = 60;
  const board = $('maker-board');
  const status = message => setText('maker-status', message);
  const newDraft = () => ({ id: null, name: '新しいステージ', teamHp: null, areas: [[]] });
  const newAttack = () => ({ kind: 'sniper', damage: 400, countdown: 2, interval: 3 });
  let draft = newDraft();
  let library = [];
  let dirty = false;
  let area = 0;
  let selected = -1;
  let tool = 'select';
  let warpStart = null;
  let gesture = null;
  let openEnemyTraits = false;

  const pieces = () => draft.areas[area];
  const option = (value, label) => new Option(label, value);
  const isEnemy = p => p.type === 'enemy' || p.type === 'boss';
  const isWall = p => p.type === 'walls' || p.type === 'slowWalls';
  const isPair = p => p.type === 'warps' || p.type === 'damageLines';
  const isRect = p => ['blocks', 'powerAreas', 'barriers'].includes(p.type);
  const enemyShape = p => ({
    shape: p.shape,
    sides: p.sides ?? (p.type === 'boss' ? 8 : 6),
  });
  const weakAngle = p => p.weak === undefined ? p.weakPoint?.angle ?? p.weakAngles?.[0] ?? p.weakAngle ?? Math.PI / 2 : p.weak * Math.PI / 180;
  const radius = p => p.r ?? parts[p.type][2]?.r ?? 20;
  const partName = p => p.name || parts[p.type][0];
  const vertical = side => side === 'left' || side === 'right';
  const axisLimits = side => vertical(side) ? [FIELD.top, FIELD.bottom] : [FIELD.left, FIELD.right];
  const onWall = (side, along) => vertical(side)
    ? { x: FIELD[side], y: along } : { x: along, y: FIELD[side] };
  const alongWall = (side, p) => vertical(side) ? p.y : p.x;
  const bounded = (p, rx = 0, ry = rx) => ({
    x: clamp(Math.round(p.x), FIELD.left + rx, FIELD.right - rx),
    y: clamp(Math.round(p.y), FIELD.top + ry, FIELD.bottom - ry),
  });

  function fit(p) {
    if (isWall(p)) {
      const [min, max] = axisLimits(p.side);
      p.start = clamp(p.start, min, max - 10);
      p.end = clamp(p.end, p.start + 10, max);
    } else if (isPair(p)) {
      const r = p.type === 'warps' ? radius(p) : 0;
      Object.assign(p.a, bounded(p.a, r));
      Object.assign(p.b, bounded(p.b, r));
    } else if (isRect(p)) {
      Object.assign(p, bounded(p, p.w / 2, p.h / 2));
    } else {
      Object.assign(p, bounded(p, radius(p)));
    }
  }

  function svg(tag, attributes, parent) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    parent.append(element);
    return element;
  }

  function drawBoard() {
    const layer = $('maker-pieces');
    layer.replaceChildren();
    pieces().forEach((p, i) => {
      const [, color, , label] = parts[p.type];
      const r = radius(p);
      const group = svg('g', { 'data-piece': i, fill: color, stroke: i === selected ? '#152c42' : '#fff', 'stroke-width': i === selected ? 5 : 2 }, layer);
      svg('title', {}, group).textContent = partName(p);
      if (isWall(p)) {
        const a = onWall(p.side, p.start);
        const b = onWall(p.side, p.end);
        svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color, 'stroke-width': i === selected ? 18 : 12, 'stroke-linecap': 'round' }, group);
      } else if (isPair(p)) {
        svg('line', { x1: p.a.x, y1: p.a.y, x2: p.b.x, y2: p.b.y, stroke: p.color === 'gold' ? '#c19432' : color, 'stroke-dasharray': '7 6', 'stroke-width': p.type === 'damageLines' ? 6 : 2, 'pointer-events': 'none' }, group);
        for (const end of ['a', 'b']) {
          svg('circle', { cx: p[end].x, cy: p[end].y, r: p.type === 'warps' ? r : 13, 'data-end': end }, group);
          svg('text', { x: p[end].x, y: p[end].y }, group).textContent = end.toUpperCase();
        }
      } else {
        if (p.gravity || p.type === 'winds') {
          svg('circle', { cx: p.x, cy: p.y, r: p.gravity || p.radius, fill: 'none', stroke: '#729caf', 'stroke-width': 2, 'stroke-dasharray': '6 4', 'pointer-events': 'none' }, group);
        }
        if (isRect(p) || ['boosts', 'swords', 'hearts', 'powerSwitches', 'typePanels', 'transPanels', 'containers'].includes(p.type)) {
          const w = p.w ?? r * 2;
          const h = p.h ?? r * 2;
          svg('rect', { x: p.x - w / 2, y: p.y - h / 2, width: w, height: h, rx: 4, 'fill-opacity': p.type === 'powerAreas' ? .32 : 1 }, group);
        } else {
          const outline = isEnemy(p) && enemyOutline({ ...enemyShape(p), r });
          if (outline) svg('polygon', { points: outline.map(([x, y]) => (p.x + x) + ',' + (p.y + y)).join(' ') }, group);
          else svg('circle', { cx: p.x, cy: p.y, r }, group);
        }
        svg('text', { x: p.x, y: p.y }, group).textContent = p.reserve ? '召' : p.type === 'boss' ? 'BOSS' : p.type === 'enemy' ? '敵' : label;
        if (isEnemy(p) && p.weakEnabled !== false && (p.type === 'boss' || p.weakPoint || p.internalWeak)) {
          const angle = weakAngle(p);
          const offset = p.internalWeak || p.weakPoint?.internal ? 0 : r;
          svg('circle', { cx: p.x + Math.cos(angle) * offset, cy: p.y + Math.sin(angle) * offset, r: 8, fill: '#fbd367', 'pointer-events': 'none' }, group);
        }
      }
    });
    if (warpStart) svg('circle', { cx: warpStart.x, cy: warpStart.y, r: 18, fill: 'none', stroke: parts[tool][1], 'stroke-width': 4, 'stroke-dasharray': '7 5' }, layer);
    if (gesture?.wall) {
      const { side, start, end } = gesture.wall;
      const a = onWall(side, start);
      const b = onWall(side, end);
      svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: parts[tool][1], 'stroke-width': 12, 'stroke-linecap': 'round' }, layer);
    }
  }

  function field(root, label, control) {
    const row = document.createElement('label');
    if (control.tagName === 'SELECT') control.setAttribute('aria-label', label);
    row.append(label, control);
    root.append(row);
  }

  function editNumber(root, obj, key, label, min, max, changed, step = 1) {
    const input = document.createElement('input');
    Object.assign(input, { type: 'number', value: obj[key] ?? '', min, max, step });
    input.addEventListener('change', () => {
      if (Number.isFinite(input.valueAsNumber)) obj[key] = clamp(Number((Math.round(input.valueAsNumber / step) * step).toFixed(2)), min, max);
      dirty = true;
      changed?.();
      input.value = obj[key] ?? '';
    });
    field(root, label, input);
  }

  function editChoice(root, label, values, value, apply) {
    const select = document.createElement('select');
    select.replaceChildren(...Object.entries(values).map(([key, name]) => option(key, name)));
    select.value = value;
    select.addEventListener('change', () => { apply(select.value); dirty = true; });
    field(root, label, select);
  }

  function editToggle(root, obj, key, label, changed) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!obj[key];
    input.addEventListener('change', () => { obj[key] = input.checked; dirty = true; changed?.(); });
    field(root, label, input);
  }

  function action(root, label, callback) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', callback);
    root.append(button);
    return button;
  }

  function editPosition(root, p, label, changed) {
    editNumber(root, p, 'x', label + ' X', FIELD.left, FIELD.right, changed);
    editNumber(root, p, 'y', label + ' Y', FIELD.top, FIELD.bottom, changed);
  }

  const enemyChoices = predicate => Object.fromEntries(pieces().flatMap((p, i) =>
    isEnemy(p) && predicate(p) ? [[p.key, (i + 1) + '. ' + partName(p)]] : []));

  function editTargets(root, obj, key, predicate, common = {}, changed) {
    const choices = { ...common, ...enemyChoices(predicate) };
    const select = document.createElement('select');
    select.multiple = true;
    select.size = Math.min(5, Math.max(2, Object.keys(choices).length));
    const values = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
    for (const [id, label] of Object.entries(choices)) {
      const entry = option(id, label);
      entry.selected = values.includes(id);
      select.add(entry);
    }
    select.addEventListener('change', () => {
      const ids = Array.from(select.selectedOptions, entry => entry.value);
      obj[key] = ids.find(id => Object.hasOwn(common, id)) ?? ids;
      dirty = true;
      changed?.(obj[key]);
    });
    field(root, '対象（複数選択可）', select);
  }

  const effectKinds = { counterShot: '反撃ダメージ', transparent: '透明化', revive: '蘇生', summon: '召喚', defenseDown: '防御ダウン', grantWeak: '弱点付与', moveWeak: '弱点移動', photons: 'フォトン散布', heartPanel: 'ハートパネル出現' };

  function editEffects(root, p, effects, redraw = drawInspector) {
    effects.forEach((effect, i) => {
      const box = document.createElement('fieldset');
      const title = document.createElement('legend');
      title.textContent = effectKinds[effect.type] ?? effect.type;
      box.append(title);
      if (effect.type === 'summon') editTargets(box, effect, 'keys', e => e.reserve);
      if (['revive', 'defenseDown', 'grantWeak', 'transparent'].includes(effect.type)) {
        editTargets(box, effect, 'targets', () => true, effect.type === 'revive' ? { all: '全員', others: '他の雑魚' } : { all: '全員' });
      }
      if (effect.type === 'defenseDown' || effect.type === 'grantWeak') editNumber(box, effect, 'multiplier', '倍率', 1, 999, null, .1);
      if (effect.type === 'defenseDown') editNumber(box, effect, 'durationTurns', '継続ターン（0で無期限）', 0, 99);
      if (effect.type === 'grantWeak') editToggle(box, effect, 'internal', '内部弱点');
      if (effect.type === 'counterShot') editNumber(box, effect, 'damage', '反撃ダメージ', 0, 999999);
      if (effect.type === 'photons') editNumber(box, effect, 'count', '散布数', 1, 20);
      if (effect.type === 'revive') editNumber(box, effect, 'limit', '蘇生数の上限', 1, 60);
      if (effect.type === 'heartPanel') {
        effect.panel ??= { x: p.x, y: p.y, r: 26 };
        editPosition(box, effect.panel, '出現位置');
      }
      editToggle(box, effect, 'once', '一度だけ（撃破時の効果）');
      action(box, '効果を削除', () => { effects.splice(i, 1); dirty = true; redraw(); });
      root.append(box);
    });
    editChoice(root, '効果を追加', { '': '選択…', ...effectKinds }, '', type => {
      if (!type) return;
      effects.push({ type, ...(['revive', 'defenseDown', 'grantWeak'].includes(type) ? { targets: 'all' } : {}) });
      redraw();
    });
  }

  function editEnemyTraits(root, p) {
    const panel = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = '敵のギミック';
    panel.open = openEnemyTraits;
    panel.addEventListener('toggle', () => { if (panel.isConnected) openEnemyTraits = panel.open; });
    panel.append(summary);
    const mode = p.weakEnabled === false ? 'none' : p.internalWeak || p.weakPoint?.internal ? 'internal' : p.type === 'boss' || p.weakPoint ? 'outer' : 'none';
    editChoice(panel, '弱点', { none: 'なし', outer: '外側', internal: '内部' }, mode, value => {
      p.weakEnabled = value !== 'none';
      p.internalWeak = value === 'internal';
      if (value === 'outer') p.weakPoint = { angle: weakAngle(p), radius: 15 };
      else delete p.weakPoint;
      drawBoard();
    });
    const degrees = Math.round(weakAngle(p) * 180 / Math.PI);
    const angle = { value: ((degrees % 360) + 360) % 360 };
    editNumber(panel, angle, '弱点の角度（右が0°）', 0, 359, () => {
      p.weak = angle.value;
      drawBoard();
    });
    editNumber(panel, p, 'weakMultiplier', '個別の弱点倍率', 1, 999, null, .1);
    editNumber(panel, p, 'gravity', '重力バリアの半径（0で無効）', 0, 400, drawBoard);
    editChoice(panel, '撃種制限', { '': 'なし', reflect: '反射制限', pierce: '貫通制限' }, p.restriction ?? '', value => { p.restriction = value; });
    editNumber(panel, p, 'sword', '剣持ち敵の攻撃倍率（0で無効）', 0, 999, null, .1);
    editNumber(panel, p, 'armor', '直殴りの被ダメージ倍率', .01, 1, null, .01);
    editNumber(panel, p, 'switchArmor', 'スイッチ未発動時の被ダメージ倍率', .01, 1, null, .01);
    editToggle(panel, p, 'startTransparent', '最初は透明');
    editToggle(panel, p, 'retreatWhenAlone', '他の敵がいなくなると撤退');
    editToggle(panel, p, 'reserve', '召喚で出現', () => {
      drawBoard();
      drawRules();
    });
    editToggle(panel, p, 'midBoss', '中ボス');
    const links = document.createElement('fieldset');
    const label = document.createElement('legend');
    label.textContent = 'HP共有';
    links.append(label);
    editTargets(links, p, 'hpShare', other => other !== p);
    editToggle(links, p, 'retreatWhenShareDead', '共有先が全滅すると撤退');
    panel.append(links);
    for (const [key, name] of [['skullEffects', 'ドクロ（撃破時）'], ['counterEffects', '反撃（被弾時）'], ['onSpawnEffects', '召喚された時']]) {
      const box = document.createElement('fieldset');
      const title = document.createElement('legend');
      title.textContent = name;
      box.append(title);
      editEffects(box, p, p[key] ??= []);
      panel.append(box);
    }
    root.append(panel);
  }

  function editAttack(box, p, attack) {
    if (attack.kind === 'move') {
      const route = attack.path ??= [attack.to ?? bounded({ x: p.x + 100, y: p.y }, radius(p))];
      route.forEach((point, i) => editPosition(box, point, '移動先 ' + (i + 1)));
      action(box, '移動先を追加', () => { route.push({ x: p.x, y: p.y }); drawInspector(); dirty = true; }).disabled = route.length >= 8;
      action(box, '最後の移動先を削除', () => { route.pop(); drawInspector(); dirty = true; }).disabled = route.length <= 1;
    } else if (attack.kind === 'summon') {
      editTargets(box, attack, 'keys', e => e.reserve);
      editToggle(box, attack, 'retreat', '召喚後に撤退');
    } else if (attack.kind === 'revive') {
      editTargets(box, attack, 'targets', () => true, { all: '全員', others: '他の雑魚' });
      editNumber(box, attack, 'limit', '蘇生数の上限', 1, 60);
    } else if (attack.kind === 'effect') {
      editEffects(box, p, attack.effects ??= []);
    } else {
      const spec = ENEMY_ATTACKS[attack.kind] ?? {};
      if (typeof spec.mult === 'number' && !['mines', 'photons'].includes(attack.kind)) {
        editNumber(box, attack, 'damage', '基礎ダメージ（1発）', 0, 999999);
      }
      for (const [key, label, max] of [['count', '発射・散布数', 40], ['ways', '方向数', 32], ['volleys', '発射回数', 12], ['hits', 'ヒット数', 24], ['maxHits', '最大ヒット数', 24], ['bounces', '反射回数', 8], ['radius', '範囲', 700], ['width', '幅', 300], ['push', '押し出す距離', 400]]) {
        if (key in spec || key in attack) editNumber(box, attack, key, label, 1, max);
      }
    }
  }

  function drawInspector() {
    const root = $('maker-properties');
    const p = pieces()[selected];
    root.replaceChildren();
    if (!p) {
      root.textContent = 'パーツを選ぶと、ここで数値を編集できます。';
      return;
    }
    const changed = () => {
      fit(p);
      drawBoard();
      // A size or position edit may also move another coordinate to stay inside the field.
      if (isPair(p)) {
        const inputs = root.querySelectorAll('input');
        const points = [p.a.x, p.a.y, p.b.x, p.b.y];
        if (p.type === 'warps') points.unshift(p.r);
        points.forEach((value, i) => { inputs[i].value = value; });
      } else {
        const inputs = root.querySelectorAll('input');
        const values = isWall(p) ? [p.start, p.end] : [p.x, p.y];
        values.forEach((value, i) => { inputs[i].value = value; });
      }
    };
    if (isWall(p)) {
      const select = document.createElement('select');
      select.replaceChildren(...Object.entries(sides).map(([value, label]) => option(value, label)));
      select.value = p.side;
      select.addEventListener('change', () => {
        p.side = select.value;
        dirty = true;
        changed();
        drawInspector();
      });
      field(root, '壁の位置', select);
      const [min, max] = axisLimits(p.side);
      editNumber(root, p, 'start', '開始位置', min, max, changed);
      editNumber(root, p, 'end', '終了位置', min, max, changed);
    } else if (isPair(p)) {
      if (p.type === 'warps') editNumber(root, p, 'r', '半径', 10, 70, changed);
      editPosition(root, p.a, p.type === 'warps' ? '入口 A' : '端点 A', changed);
      editPosition(root, p.b, p.type === 'warps' ? '出口 B' : '端点 B', changed);
    } else {
      editPosition(root, p, '中心', changed);
      if (isRect(p)) {
        editNumber(root, p, 'w', '幅', 16, FIELD.right - FIELD.left, changed);
        editNumber(root, p, 'h', '高さ', 16, FIELD.bottom - FIELD.top, changed);
      } else if (p.type !== 'winds') {
        editNumber(root, p, 'r', '半径', 10, 100, changed);
      }
    }
    if (p.type === 'mines' || p.type === 'walls') editNumber(root, p, 'damage', '接触ダメージ', 0, 999999);
    if (p.type === 'slowWalls') editNumber(root, p, 'retention', '接触後の速度倍率', .05, 1, null, .01);
    if (p.type === 'damageLines') {
      editNumber(root, p, 'damage', '接触ダメージ', 0, 999999);
      editChoice(root, 'ライン色', { silver: '銀（金があれば奇数ターン）', gold: '金（偶数ターン）' }, p.color, value => { p.color = value; drawBoard(); });
    }
    if (p.type === 'powerAreas') editNumber(root, p, 'multiplier', 'エリア内の攻撃倍率', .1, 999, null, .1);
    if (p.type === 'powerSwitches') editNumber(root, p, 'initial', '初期レベル', 0, 2);
    if (p.type === 'containers') editNumber(root, p, 'n', 'フォトン数', 1, 20);
    if (p.type === 'barriers') editNumber(root, p, 'n', '破壊に必要な接触回数', 1, 99);
    if (p.type === 'winds') {
      editChoice(root, '風の向き', { push: '吹き出し', pull: '引き寄せ' }, p.mode, value => { p.mode = value; });
      editNumber(root, p, 'radius', '風の範囲', 20, 800, drawBoard);
      editNumber(root, p, 'force', '移動距離', 1, 700);
      editNumber(root, p, 'countdown', '初回ターン', 1, 99);
      editNumber(root, p, 'interval', '発動間隔', 1, 99);
    }
    if (isEnemy(p)) {
      editNumber(root, p, 'hp', '敵HP', 1, 99999999);
      const shape = enemyShape(p);
      editChoice(root, '形', shapes, shapes[shape.shape] ? shape.shape : shape.sides, value => {
        p.sides = Number(value) || ({ cruciform: 4, starBattery: 8 }[value] ?? 0);
        p.shape = Number(value) ? 'polygon' : value;
        drawBoard();
      });
      editEnemyTraits(root, p);
      (p.attacks ??= []).forEach((attack, i) => {
        const box = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = '攻撃 ' + (i + 1);
        box.append(legend);
        editChoice(box, '種類', Object.fromEntries([...new Set([...attackKinds, attack.kind])].map(key => [key, FRIENDSHIP_KINDS[key]?.name ?? key])), attack.kind, value => {
          p.attacks[i] = { ...newAttack(), kind: value, countdown: attack.countdown ?? 2, interval: attack.interval ?? 3 };
          drawInspector();
        });
        editAttack(box, p, attack);
        editNumber(box, attack, 'countdown', '初回ターン', 1, 99);
        editNumber(box, attack, 'interval', '発動間隔', 1, 99);
        action(box, 'この攻撃を削除', () => {
          p.attacks.splice(i, 1);
          dirty = true;
          drawInspector();
        });
        root.append(box);
      });
      action(root, '攻撃を追加', () => {
        p.attacks.push(newAttack());
        dirty = true;
        drawInspector();
      }).disabled = p.attacks.length >= 6;
    }
    action(root, 'パーツを削除', () => {
      pieces().splice(selected, 1);
      selectPiece(-1);
      drawRules();
      dirty = true;
    });
  }

  function selectPiece(index) {
    selected = index;
    const list = $('maker-selection');
    list.replaceChildren(option(-1, '選択なし'), ...pieces().map((p, i) => option(i, (i + 1) + '. ' + partName(p))));
    list.value = index;
    drawBoard();
    drawInspector();
  }

  function setTool(next) {
    tool = next;
    warpStart = null;
    for (const button of $('maker-tools').children) button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
    board.dataset.tool = tool;
    drawBoard();
    status({
      select: '置いたパーツを選択・ドラッグできます。',
      warps: 'ワープの入口と出口を順に押してください。',
      walls: '壁の近くから、壁に沿ってドラッグしてください。',
      slowWalls: '壁の近くから、壁に沿ってドラッグしてください。',
      damageLines: 'ラインの始点と終点を順に押してください。',
    }[tool] || '盤面を押して配置します。続けて配置できます。');
  }

  function addPart(p) {
    if (pieces().length >= maxParts) { status('1エリアに置けるパーツは60個までです。'); return; }
    fit(p);
    pieces().push(p);
    dirty = true;
    selectPiece(pieces().length - 1);
    drawRules();
  }

  function point(event) {
    const p = new DOMPoint(event.clientX, event.clientY);
    return bounded(p.matrixTransform(board.getScreenCTM().inverse()));
  }

  board.addEventListener('pointerdown', event => {
    if (event.button !== 0 || gesture) return;
    const p = point(event);
    if (tool === 'select') {
      const group = event.target.closest('[data-piece]');
      selectPiece(group ? Number(group.dataset.piece) : -1);
      const piece = pieces()[selected];
      if (!piece) return;
      gesture = { id: event.pointerId, start: p, piece, original: structuredClone(piece), end: event.target.dataset.end };
    } else if (tool === 'walls' || tool === 'slowWalls') {
      const side = Object.keys(sides).reduce((nearest, side) =>
        Math.abs((vertical(side) ? p.x : p.y) - FIELD[side]) < Math.abs((vertical(nearest) ? p.x : p.y) - FIELD[nearest]) ? side : nearest);
      const start = alongWall(side, p);
      gesture = { id: event.pointerId, wall: { type: tool, side, start, end: start } };
    } else if (tool === 'warps' || tool === 'damageLines') {
      if (warpStart) {
        const a = warpStart;
        warpStart = null;
        addPart({ type: tool, a, b: p, ...parts[tool][2] });
        drawBoard();
        if (pieces().length < maxParts) status(parts[tool][0] + 'を配置しました。続けて配置できます。');
      } else {
        warpStart = bounded(p, tool === 'warps' ? 23 : 0);
        status(tool === 'warps' ? '出口を押してください。' : '終点を押してください。');
        drawBoard();
      }
    } else {
      const defaults = {
        enemy: { r: 30, hp: 2000, attacks: [newAttack()] },
        boss: { r: 58, hp: 15000, weak: 90, attacks: [newAttack()] },
      };
      const part = { type: tool, ...p, ...(defaults[tool] ?? parts[tool][2]) };
      if (isEnemy(part)) part.key = 'maker-enemy-' + Math.random().toString(36).slice(2);
      addPart(part);
    }
    if (gesture) board.setPointerCapture(event.pointerId);
  });

  function moveGesture(event) {
    if (gesture?.id !== event.pointerId) return;
    const p = point(event);
    if (gesture.wall) {
      gesture.wall.end = alongWall(gesture.wall.side, p);
    } else {
      const { piece, original, start, end } = gesture;
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      if (isWall(piece)) {
        const [min, max] = axisLimits(piece.side);
        const offset = clamp(vertical(piece.side) ? dy : dx, min - original.start, max - original.end);
        piece.start = original.start + offset;
        piece.end = original.end + offset;
      } else if (isPair(piece)) {
        const origin = original[end];
        piece[end] = bounded({ x: origin.x + dx, y: origin.y + dy }, piece.type === 'warps' ? radius(piece) : 0);
      } else {
        Object.assign(piece, { x: original.x + dx, y: original.y + dy });
        fit(piece);
      }
    }
    drawBoard();
  }

  board.addEventListener('pointermove', moveGesture);
  board.addEventListener('pointerup', event => {
    if (gesture?.id !== event.pointerId) return;
    moveGesture(event);
    const { wall, piece, original } = gesture;
    gesture = null;
    if (wall) {
      const [min, max] = axisLimits(wall.side);
      const clicked = Math.abs(wall.start - wall.end) < 10;
      const start = clicked ? Math.max(min, wall.start - 65) : Math.min(wall.start, wall.end);
      const end = clicked ? Math.min(max, wall.start + 65) : Math.max(wall.start, wall.end);
      const behavior = wall.type === 'walls' ? { damage: 500 } : { retention: .35 };
      addPart({ type: wall.type, side: wall.side, start, end, ...behavior });
    } else {
      if (JSON.stringify(piece) !== JSON.stringify(original)) dirty = true;
      drawInspector();
    }
    drawBoard();
  });
  function cancelGesture() {
    if (!gesture) return;
    if (gesture.piece) Object.assign(gesture.piece, gesture.original);
    gesture = null;
    drawBoard();
  }
  board.addEventListener('pointercancel', cancelGesture);
  board.addEventListener('lostpointercapture', cancelGesture);

  function namedGroup(root, name) {
    const box = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = name;
    box.append(legend);
    root.append(box);
    return box;
  }

  function drawRules() {
    const root = $('maker-rules');
    root.replaceChildren();
    const rules = draft.rules[area];
    const settings = draft.settings ?? {};
    const numbers = [
      ['directMultiplier', '直殴り倍率', 1],
      ['weakMultiplier', '弱点倍率', 3],
      ['photonMultiplier', 'フォトン倍率', 2],
      ['powerAreaMultiplier', 'パワーエリア倍率', 4],
      ['switchMultiplier', 'パワースイッチ倍率', 1],
    ];
    for (const [key, label, fallback] of numbers) {
      const value = { value: rules[key] ?? settings[key] ?? fallback };
      editNumber(root, value, 'value', label, .1, 999, () => { rules[key] = value.value; }, .1);
    }
    for (const [key, label] of [['cube', 'キューブ状態'], ['touchPower', '触れた味方の数で攻撃力アップ'], ['noWeakPoints', '全敵の弱点を無効化']]) {
      const value = { enabled: rules[key] ?? settings[key] };
      editToggle(root, value, 'enabled', label, () => { rules[key] = value.enabled; });
    }
    const laser = rules.laserMultipliers ?? settings.laserMultipliers;
    const laserEnabled = { enabled: !!laser };
    editToggle(root, laserEnabled, 'enabled', 'レーザージェネレーター', () => {
      rules.laserMultipliers = laserEnabled.enabled ? [...(laser || LASER_GENERATOR.defaultMultipliers)] : false;
      drawRules();
    });
    if (laser) {
      const multipliers = [...laser];
      multipliers.forEach((_, i) => editNumber(root, multipliers, i, 'レーザー Lv.' + (i + 1) + ' 倍率', .1, 999, () => { rules.laserMultipliers = multipliers; }, .1));
    }
    const cross = rules.crossSkulls ??= [];
    const routes = rules.weakRoutes ??= [];
    const crossBox = namedGroup(root, 'クロスドクロ');
    cross.forEach((group, i) => {
      const box = namedGroup(crossBox, 'グループ ' + (i + 1));
      const members = { value: group.members ?? Object.keys(enemyChoices(e => e.crossSkull === group.id)) };
      editTargets(box, members, 'value', () => true, {}, value => { group.members = value; });
      editEffects(box, { x: 310, y: 370 }, group.effects, drawRules);
      action(box, 'グループを削除', () => { cross.splice(i, 1); dirty = true; drawRules(); });
    });
    action(crossBox, 'クロスドクロを追加', () => {
      cross.push({ id: 'cross-' + Math.random().toString(36).slice(2), members: [], effects: [] });
      dirty = true;
      drawRules();
    }).disabled = cross.length >= 12;
    const routesBox = namedGroup(root, '弱点移動ルート');
    const enemies = enemyChoices(() => true);
    routes.forEach((route, i) => {
      const box = namedGroup(routesBox, 'ルート ' + (i + 1));
      route.positions.forEach((point, j) => {
        const position = namedGroup(box, '弱点 ' + (j + 1));
        editChoice(position, '敵', enemies, point.target, target => { point.target = target; });
        const angle = { value: ((Math.round((point.angle ?? Math.PI / 2) * 180 / Math.PI) % 360) + 360) % 360 };
        editNumber(position, angle, '角度（右が0°）', 0, 359, () => { point.angle = angle.value * Math.PI / 180; });
        editToggle(position, point, 'internal', '内部弱点');
        editNumber(position, point, 'offset', '中心からの距離（内部弱点）', 0, 100);
        action(position, 'この位置を削除', () => { route.positions.splice(j, 1); dirty = true; drawRules(); });
      });
      action(box, '弱点の位置を追加', () => {
        route.positions.push({ target: Object.keys(enemies)[0], angle: Math.PI / 2 });
        dirty = true;
        drawRules();
      }).disabled = route.positions.length >= 12 || !Object.keys(enemies).length;
      action(box, 'ルートを削除', () => { routes.splice(i, 1); dirty = true; drawRules(); });
    });
    action(routesBox, 'ルートを追加', () => {
      routes.push({ id: 'route-' + Math.random().toString(36).slice(2), positions: [{ target: Object.keys(enemies)[0], angle: Math.PI / 2 }] });
      dirty = true;
      drawRules();
    }).disabled = routes.length >= 8 || !Object.keys(enemies).length;
  }

  function drawAreas(index) {
    area = index;
    $('maker-wave').replaceChildren(...draft.areas.map((_, i) => option(i, 'エリア ' + (i + 1))));
    $('maker-wave').value = area;
    $('maker-add').disabled = $('maker-copy').disabled = draft.areas.length >= maxWaves;
    $('maker-remove-wave').disabled = draft.areas.length === 1;
    setTool('select');
    selectPiece(-1);
    drawRules();
  }

  function drawLibrary() {
    $('maker-library').replaceChildren(option('', '保存済みを選ぶ'), ...library.map(s => option(s.id, s.name)));
    $('maker-library').value = draft.id ?? '';
  }

  function openDraft(stage) {
    draft = structuredClone(stage);
    draft.rules ??= draft.areas.map(() => ({}));
    for (const list of draft.areas) {
      list.forEach((p, index) => {
        if (isEnemy(p)) p.key ??= 'maker-enemy-' + index;
      });
    }
    dirty = false;
    $('maker-name').value = draft.name;
    $('maker-hp').value = draft.teamHp ?? '';
    drawLibrary();
    drawAreas(0);
  }

  function saveDraft() {
    if (!readDetails()) return;
    if (warpStart) { status('配置の終点を置くか、別のツールを選んでください。'); return; }
    const id = draft.id ?? 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const saved = { ...draft, id };
    try {
      const latest = readLibrary();
      const next = latest.some(s => s.id === id) ? latest.map(s => s.id === id ? saved : s) : [...latest, saved];
      localStorage.setItem(storageKey, JSON.stringify(next));
      library = structuredClone(next);
    } catch {
      status('ブラウザーに保存できませんでした。保存設定や空き容量を確認してください。');
      return;
    }
    draft.id = id;
    dirty = false;
    drawLibrary();
    status('「' + draft.name + '」を保存しました。');
  }

  function readDetails() {
    const hp = $('maker-hp');
    if (!hp.reportValidity()) return false;
    draft.name = $('maker-name').value.trim() || '無題のステージ';
    $('maker-name').value = draft.name;
    draft.teamHp = hp.value === '' ? null : hp.valueAsNumber;
    return true;
  }

  function readLibrary() {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(saved) ? saved.filter(s => s?.id && Array.isArray(s.areas) && s.areas.length) : [];
  }

  function toWave(list, index, rules) {
    const wave = { name: 'エリア ' + (index + 1), step: 'AREA ' + (index + 1), ...rules, enemies: [], reserves: [], gimmicks: {} };
    for (const { type, ...p } of list) {
      if (type === 'enemy' || type === 'boss') {
        const { weak, reserve, ...enemy } = p;
        if (weak !== undefined) {
          enemy.weakAngle = weakAngle(p);
          if (enemy.weakPoint) enemy.weakPoint.angle = enemy.weakAngle;
          if (enemy.weakAngles?.length) enemy.weakAngles[0] = enemy.weakAngle;
        }
        (reserve ? wave.reserves : wave.enemies).push({ ...enemy, ...enemyShape({ type, ...p }), boss: type === 'boss' });
      } else {
        if (isRect({ type })) { p.x -= p.w / 2; p.y -= p.h / 2; }
        (wave.gimmicks[type] ??= []).push(p);
      }
    }
    return wave;
  }

  function fromStage(stage) {
    const { id, name, waves, ...settings } = structuredClone(stage);
    const template = { ...newDraft(), name: (name + '（複製）').slice(0, 60), settings, areas: [], rules: [] };
    for (const { enemies, reserves = [], gimmicks = {}, ...rules } of waves) {
      const list = [...enemies, ...reserves].map((enemy, index) => ({
        ...enemy, type: enemy.boss ? 'boss' : 'enemy', reserve: index >= enemies.length,
        key: enemy.key ?? 'enemy-' + index,
      }));
      for (const [type, objects] of Object.entries(gimmicks)) {
        for (const data of objects) {
          const part = { ...data, type };
          if (isRect(part)) { part.x += part.w / 2; part.y += part.h / 2; }
          list.push(part);
        }
      }
      template.areas.push(list);
      template.rules.push(rules);
    }
    return template;
  }

  function testStage(onlyArea) {
    if (!readDetails()) return;
    if (!team.length) { status('先に通常モードの編成画面で味方を選んでください。'); return; }
    if (warpStart) { status('配置の終点を置くか、別のツールを選んでください。'); return; }
    const copy = structuredClone(draft);
    const waves = copy.areas.map((list, index) => toWave(list, index, copy.rules[index]));
    const empty = waves.findIndex((wave, i) => (!onlyArea || i === area) && !wave.enemies.length);
    if (empty !== -1) { status('エリア ' + (empty + 1) + ' に敵を1体以上配置してください。'); return; }
    unlockAudio();
    playStage({ ...copy.settings, id: 'MAKER', maker: true, name: copy.name, teamHp: copy.teamHp, waves: onlyArea ? [waves[area]] : waves });
  }

  for (const [key, label] of [['select', '選択・移動'], ...Object.entries(parts).map(([key, part]) => [key, part[0]])]) {
    action($('maker-tools'), label, () => setTool(key)).dataset.tool = key;
  }
  $('maker-selection').addEventListener('change', event => {
    setTool('select');
    selectPiece(Number(event.target.value));
  });
  $('maker-wave').addEventListener('change', event => drawAreas(Number(event.target.value)));
  for (const [id, copy] of [['maker-add', false], ['maker-copy', true]]) {
    $(id).addEventListener('click', () => {
      draft.areas.splice(area + 1, 0, copy ? structuredClone(pieces()) : []);
      draft.rules.splice(area + 1, 0, copy ? structuredClone(draft.rules[area]) : {});
      dirty = true;
      drawAreas(area + 1);
    });
  }
  $('maker-remove-wave').addEventListener('click', () => {
    if (pieces().length && !window.confirm('このエリアと配置したパーツを削除しますか？')) return;
    draft.areas.splice(area, 1);
    draft.rules.splice(area, 1);
    dirty = true;
    drawAreas(Math.min(area, draft.areas.length - 1));
  });
  for (const id of ['maker-name', 'maker-hp']) $(id).addEventListener('input', () => { dirty = true; });
  const canReplace = () => !dirty || window.confirm('保存していない編集を破棄しますか？');
  $('maker-template').replaceChildren(...STAGES.map(stage => option(stage.id, stage.id + ' ' + stage.name)));
  $('maker-use-template').addEventListener('click', () => {
    if (!canReplace()) return;
    openDraft(fromStage(STAGE_BY_ID[$('maker-template').value]));
    dirty = true;
    status('既存ステージを複製しました。名前を付けて保存できます。');
  });
  $('maker-new').addEventListener('click', () => { if (canReplace()) openDraft(newDraft()); });
  $('maker-library').addEventListener('change', event => {
    const saved = library.find(s => s.id === event.target.value);
    if (saved && canReplace()) openDraft(saved);
    else drawLibrary();
  });
  $('maker-save').addEventListener('click', saveDraft);
  $('maker-test-area').addEventListener('click', () => testStage(true));
  $('maker-test').addEventListener('click', () => testStage(false));
  $('maker-back').addEventListener('click', () => showScreen('title'));
  $('maker-return').addEventListener('click', () => leaveBattle());
  $('title-maker').addEventListener('click', () => showScreen('maker'));
  try {
    library = readLibrary();
  } catch { /* A blocked or unavailable store starts with an empty library. */ }
  openDraft(draft);
}
