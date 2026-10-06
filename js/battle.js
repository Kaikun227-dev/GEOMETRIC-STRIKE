'use strict';
// 保存・戦闘状態・ステータス表示・音・ダメージ計算
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // STORAGE
  // ---------------------------------------------------------------------------
  const TEAM_KEY = 'geometric-strike-team-v1';
  const LEGACY_BEST_KEY = 'geometric-strike-best-v1';
  const bestKey = id => `geometric-strike-best-v2-${id}`;

  function loadBest(stageId) {
    try {
      const saved = localStorage.getItem(bestKey(stageId));
      if (saved !== null) return Number(saved) || 0;
      if (stageId === STAGES[0].id) return Number(localStorage.getItem(LEGACY_BEST_KEY)) || 0;
    } catch (_) {}
    return 0;
  }
  function loadTeam() {
    try {
      const raw = JSON.parse(localStorage.getItem(TEAM_KEY));
      if (Array.isArray(raw)) {
        const ids = raw.filter((id, i) => CHAR_BY_ID[id] && raw.indexOf(id) === i).slice(0, MAX_TEAM);
        if (ids.length) return ids;
      }
    } catch (_) {}
    return DEFAULT_TEAM.slice();
  }
  function saveTeam() {
    try { localStorage.setItem(TEAM_KEY, JSON.stringify(team)); } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // APP STATE
  // ---------------------------------------------------------------------------
  let screen = 'title';
  let team = loadTeam();
  let currentStage = STAGES[0];
  let selectedStageId = STAGES[0].id;
  let selectedCharId = null;
  let formationReturn = 'title';
  let best = 0;
  let audioContext = null;
  let muted = false;
  let overlayAction = null;
  let overlaySecondaryAction = null;
  let overlayTertiaryAction = null;
  let previousTime = 0;
  let uiAccumulator = 0;
  let pointerId = null;
  let state;

  function makeUnits() {
    const positions = FORMATION_POSITIONS[team.length] || FORMATION_POSITIONS[MAX_TEAM];
    return team.map((charId, i) => {
      const c = CHAR_BY_ID[charId];
      return { ...c, id: i, charId, x: positions[i][0], y: positions[i][1], r: UNIT_RADIUS, vx: 0, vy: 0, photons: 0 };
    });
  }

  function makeEnemies(stage, wave) {
    return stage.waves[wave].enemies.map((enemy,i)=>createEnemyRuntime(enemy,i,wave));
  }

  function resetGame() {
    const restoreFocus = !!state && screen === 'battle';
    cancelAim();
    const units = makeUnits();
    const maxHp = units.reduce((sum, unit) => sum + unit.hp, 0);
    best = loadBest(currentStage.id);
    state = {
      phase: 'ready', paused: false, stage: currentStage, waves: currentStage.waves, wave: 0, turn: 1,
      hp: maxHp, maxHp, score: 0,
      activeUnit: 0, units, enemies: makeEnemies(currentStage, 0),
      clock: 0, shotCount: 0, combo: 0, maxCombo: 0, skillCharge: 35, skillArmed: false,
      skillShot: false, aiming: null, keyboardAngle: -Math.PI / 2, keyboardPower: 0.8,
      keyboardAimUntil: 0, phaseTimer: 0, attackQueue: [], friendship: new Set(),
      particles: [], rings: [], floats: [], beams: [], trail: [], effects: [], attackLog: [], shake: 0,
      unitStopped: false, moveTime: 0,
      notice: { title: 'WAVE 01', sub: currentStage.waves[0].name, remaining: 2.1, max: 2.1 },
      comboTime: 0, intro: true, skillFlash: 0,
    };
    setupArea();
    hideOverlay();
    renderBattleChrome();
    updateUI();
    if (restoreFocus) canvas.focus({ preventScroll: true });
  }

  function setText(id, value) {
    const element = $(id);
    if (element && element.textContent !== String(value)) element.textContent = value;
  }

  function shapeHTML(character, extra = '') {
    return `<span class="shape shape-${character.shape} ${extra}" style="--c:${character.color}"></span>`;
  }
  const colorVars = color => `--c:${color};--c-soft:${color}14;--c-tint:${color}26;--c-line:${color}80`;

  // Team / wave panels in the battle sidebar depend on the selected team and stage.
  function renderBattleChrome() {
    const tip = document.querySelector('.tip-panel div p:last-child');
    if(tip) tip.textContent = state.stage.hint || '味方の上を通り抜けると友情コンボが発動。ひとつの軌道が、連鎖になる。';
    setText('stage-label', `STAGE ${state.stage.id}`);
    setText('wave-count-badge', `${state.waves.length} WAVES`);
    setText('team-count-tag', `${state.units.length} UNITS`);
    setText('progress-range', `01 — ${pad2(state.waves.length)}`);
    const list = $('unit-list');
    if (list) {
      list.innerHTML = state.units.map((unit, i) => `<div class="unit-card" data-unit="${i}" style="${colorVars(unit.color)}"><div class="unit-avatar">${shapeHTML(unit)}<span class="unit-number">${pad2(i + 1)}</span></div><div class="unit-info"><h3>${unit.name} <span>${unit.kana}</span></h3><p>${unit.type}</p><p class="unit-abilities">${abilityNames(unit)}</p><p class="unit-friendships"><span>主：${friendshipTitle(unit.friendship)}</span>${unit.secondary ? `<span>副：${friendshipTitle(unit.secondary)}</span>` : ''}</p><p class="photon-count" data-photons="${i}"></p></div><span class="unit-turn">WAIT</span></div>`).join('');
    }
    const steps = $('wave-steps');
    if (steps) {
      steps.innerHTML = state.waves.map((wave, i) => `${i ? '<div class="step-line"></div>' : ''}<div class="wave-step" id="wave-step-${i + 1}"><span class="step-symbol${wave.enemies.some(e => e.boss) ? ' boss-symbol' : ''}">${pad2(i + 1)}</span><span>${wave.step}</span></div>`).join('');
    }
  }

  function updateUI() {
    if (!state) return;
    const unit = state.units[state.activeUnit];
    for(const u of state.units){const el=document.querySelector('[data-photons="'+u.id+'"]');if(el)el.textContent='フォトン '+(u.photons||0)+' / 4';}
    const count = state.units.length;
    const nextIndex = (state.activeUnit + 1) % count;
    setText('wave-label', `${pad2(state.wave + 1)} / ${pad2(state.waves.length)}`);
    setText('wave-title', state.waves[state.wave].name);
    setText('turn-value', pad2(state.turn));
    setText('score-value', String(state.score).padStart(6, '0'));
    setText('best-value', String(Math.max(best, state.score)).padStart(6, '0'));
    setText('hp-value', `${fmt(Math.ceil(state.hp))} / ${fmt(state.maxHp)}`);
    setText('hp-percent', `${Math.ceil(state.hp / state.maxHp * 100)}%`);
    setText('enemy-count', pad2(state.enemies.filter(enemy => enemy.alive).length));
    setText('combo-value', pad2(state.maxCombo));
    setText('skill-percent', `${Math.floor(state.skillCharge)}%`);
    setText('active-name', unit.name);
    setText('active-type', unit.type);
    if ($('hp-fill')) {
      $('hp-fill').style.width = `${state.hp / state.maxHp * 100}%`;
      $('hp-fill').classList.toggle('is-low', state.hp < state.maxHp * 0.3);
    }
    if ($('skill-progress')) $('skill-progress').style.width = `${state.skillCharge}%`;
    const skillButton = $('skill-button');
    if (skillButton) {
      skillButton.disabled = state.skillCharge < 100 || !['ready', 'aiming'].includes(state.phase) || state.paused;
      skillButton.classList.toggle('is-ready', state.skillCharge >= 100);
      skillButton.classList.toggle('is-armed', state.skillArmed);
      skillButton.setAttribute('aria-pressed', String(state.skillArmed));
      skillButton.title = state.skillCharge < 100 ? '敵や味方に当ててチャージ' : state.skillArmed ? '次のショットが強化されます。もう一度押すと解除' : '次のショットを強化する';
      const skillCaption = skillButton.querySelector('.skill-text small');
      if (skillCaption) skillCaption.textContent = state.skillArmed ? '発動準備完了。狙って、はなそう。' : state.skillCharge >= 100 ? 'タップして、次のショットを強化。' : '連鎖を重ねて、必殺の一撃。';
    }
    const status = state.paused ? 'PAUSED' : state.phase === 'moving' ? 'ショット中' : state.phase === 'enemy' ? '敵のターン' : state.phase === 'wave' ? '次のウェーブへ' : state.phase === 'victory' ? 'ALL CLEAR' : state.phase === 'gameover' ? 'GAME OVER' : state.skillArmed ? 'ストライクバースト準備完了' : state.phase === 'aiming' ? 'はなしてショット' : 'ひっぱって、はなす';
    setText('shot-status', status);
    document.querySelectorAll('.unit-card[data-unit]').forEach(card => {
      const index = Number(card.dataset.unit);
      const isActive = index === state.activeUnit;
      const isNext = !isActive && index === nextIndex;
      card.classList.toggle('active', isActive);
      card.classList.toggle('next', isNext);
      card.setAttribute('aria-current', isActive ? 'true' : 'false');
      const turnLabel = card.querySelector('.unit-turn');
      if (turnLabel) turnLabel.textContent = isActive ? 'YOUR TURN' : isNext ? 'NEXT' : 'WAIT';
    });
    for (let i = 0; i < state.waves.length; i++) {
      const step = $(`wave-step-${i + 1}`);
      if (step) {
        step.classList.toggle('current', i === state.wave);
        step.classList.toggle('complete', i < state.wave || state.phase === 'victory');
      }
    }
    const pauseButton = $('pause-button');
    if (pauseButton) {
      pauseButton.setAttribute('aria-pressed', String(state.paused));
      pauseButton.setAttribute('aria-label', state.paused ? 'ゲームを再開' : '一時停止');
      pauseButton.title = state.paused ? 'ゲームを再開（Esc）' : '一時停止（Esc）';
      const icon = pauseButton.querySelector('svg');
      if (icon && icon.dataset.mode !== String(state.paused)) {
        icon.dataset.mode = String(state.paused);
        icon.innerHTML = state.paused ? '<path d="m8 5 11 7-11 7V5Z"/>' : '<use href="#i-pause"/>';
      }
    }
    const soundButton = $('sound-button');
    if (soundButton) {
      soundButton.dataset.muted = String(muted);
      soundButton.setAttribute('aria-pressed', String(muted));
      soundButton.setAttribute('aria-label', muted ? 'サウンドをオン' : 'サウンドをオフ');
      soundButton.title = muted ? 'サウンドをオン' : 'サウンドをオフ';
    }
    canvas.setAttribute('aria-label', `幾何学アクションゲーム。ウェーブ${state.wave + 1}、残りHP${Math.ceil(state.hp)}。${unit.name}をひっぱってはなすとショット。矢印キーで角度と強さを調整、スペースキーで発射。`);
  }

  function rememberBest() {
    if (state.score > best) {
      best = state.score;
      try { localStorage.setItem(bestKey(state.stage.id), String(best)); } catch (_) {}
    }
  }

  function unlockAudio() {
    if (muted) return;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch (_) {}
  }

  function tone(frequency, duration = 0.12, type = 'sine', volume = 0.045, delay = 0, endFrequency = frequency) {
    if (muted || !audioContext || audioContext.state !== 'running') return;
    try {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const time = audioContext.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), time + duration);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.02);
    } catch (_) {}
  }

  function chime() {
    [523.25, 659.25, 783.99].forEach((frequency, i) => tone(frequency, 0.24, 'sine', 0.035, i * 0.1));
  }

  function polygon(x, y, radius, sides, rotation = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = rotation + i * TAU / sides;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function ring(x, y, color, radius = 40, life = 0.5) {
    state.rings.push({ x, y, color, radius, life, max: life });
  }

  function burst(x, y, color, count = 12, strength = 140) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU;
      const speed = strength * (0.25 + Math.random() * 0.75);
      const life = 0.25 + Math.random() * 0.45;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 2 + Math.random() * 3, color, life, max: life, rotation: angle });
    }
  }

  function floatingText(x, y, text, color, size = 20) {
    state.floats.push({ x, y, text, color, size, life: 0.95, max: 0.95 });
  }

  function chargeSkill(amount) {
    state.skillCharge = clamp(state.skillCharge + amount, 0, 100);
  }

  // ---------------------------------------------------------------------------
  // DAMAGE
  // ---------------------------------------------------------------------------
  function weakPosition(enemy) {
    if (!enemy.weakPoint) return null;
    if(enemy.weakPoint.internal)return {x:enemy.x,y:enemy.y,r:enemy.weakPoint.radius};
    return { x: enemy.x + Math.cos(enemy.weakPoint.angle) * enemy.r * .84, y: enemy.y + Math.sin(enemy.weakPoint.angle) * enemy.r * .84, r: enemy.weakPoint.radius };
  }
  function segmentDistance(p, a, b) {
    const dx = b.x-a.x, dy=b.y-a.y;
    const t = clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy || 1),0,1);
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  }
  function hitsWeak(enemy, hit) {
    const weak = weakPosition(enemy);
    if (!weak || !hit) return false;
    if (hit.from && hit.to) return segmentDistance(weak, hit.from, hit.to) <= weak.r + (hit.radius || 0);
    return distance(weak, hit) <= weak.r + (hit.radius || 0);
  }
  function withDamageOwner(owner, action) {
    const previous=state.damageOwner;
    state.damageOwner=owner;
    try { return action(); } finally { state.damageOwner=previous; }
  }
  function queueEffect(effect) {
    if(effect.side==='ally'&&effect.ownerId===undefined&&state.damageOwner)effect.ownerId=state.damageOwner.id;
    state.effects.push(effect);
    return effect;
  }
  function inPowerArea(unit) {
    if(!unit)return false;
    return (state.waves[state.wave].gimmicks?.powerAreas||[]).some(a=>unit.x>=a.x&&unit.x<=a.x+a.w&&unit.y>=a.y&&unit.y<=a.y+a.h);
  }
  function damageEnemy(enemy, amount, friendship = false, options = {}) {
    if (!enemy.alive) return;
    const owner=options.owner||state.damageOwner||(!friendship?state.units[state.activeUnit]:null);
    const weak=hitsWeak(enemy,options.hit)&&(!enemy.weakPoint?.internal||friendship||owner&&isPiercing(owner));
    const multiplier=enemyWeakMultiplier(enemy);
    const damage=Math.round(amount*(inPowerArea(owner)?4:1)*(weak?(options.weakBonusOnly?multiplier-1:multiplier):1)*(enemy.defenseMultiplier||1)*enemyRestrictionMultiplier(enemy,owner,friendship)*(friendship?1:enemy.armor??1));
    if (weak) { floatingText(enemy.x, enemy.y - enemy.r - 38, 'WEAK ×'+multiplier, '#c79816', 15); ring(weakPosition(enemy).x, weakPosition(enemy).y, '#e1b327', 36, .3); }
    const actualDamage = Math.min(enemy.hp, damage);
    enemy.hp = Math.max(0, enemy.hp - damage);
    enemy.flash = 0.15;
    state.score += actualDamage;
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.comboTime = 1.7;
    chargeSkill(options.charge !== undefined ? options.charge : friendship ? 4 : 3.5);
    floatingText(enemy.x + (Math.random() - 0.5) * 28, enemy.y - enemy.r - 10, String(damage), friendship ? '#269e86' : '#dc776c', friendship ? 19 : 22);
    burst(enemy.x, enemy.y, friendship ? '#65c6ae' : '#ee9187', 7, 95);
    tone(250 + Math.min(state.combo, 12) * 36, 0.085, 'triangle', 0.025, 0, 170);
    if (enemy.hp <= 0) {
      enemy.alive = false;
      if(enemy.boss&&state.waves[state.wave].bossPhase===1){state.retreatGhost={x:enemy.x,y:enemy.y,r:enemy.r,sides:enemy.sides,tint:enemy.tint,age:0};floatingText(enemy.x,enemy.y-enemy.r-58,'ボスが撤退！','#618a95',18);}
      state.score += enemy.boss ? 5000 : 1000;
      chargeSkill(enemy.boss ? 15 : 7);
      burst(enemy.x, enemy.y, '#ef8277', enemy.boss ? 42 : 22, enemy.boss ? 260 : 170);
      ring(enemy.x, enemy.y, '#ed9b91', enemy.boss ? 140 : 75, 0.65);
      state.shake = Math.max(state.shake, enemy.boss ? 9 : 4);
      tone(150, 0.22, 'triangle', 0.04, 0, 45);
      rememberBest();
      resolveEnemyDefeat(enemy);
    }
    if(weak)advanceWeakPoint(enemy);
  }

  // Enemy attacks always damage the shared team HP.
  function damageTeam(amount, x, y, target = state.units.find(u => Math.hypot(u.x-x,u.y-y) < 1)) {
    if (['gameover', 'victory'].includes(state.phase)) return;
    const damage = Math.max(1, Math.round(amount * (target?.battleStyle === 'balance' ? .8 : 1)));
    state.hp = Math.max(0, state.hp - damage);
    ring(x, y, '#eaa294', 65, 0.5);
    burst(x, y, '#ec998f', 8, 140);
    floatingText(x, y - 42, `−${damage}`, '#d87970', 22);
    state.shake = Math.max(state.shake, 3);
    tone(110, 0.2, 'triangle', 0.04, 0, 50);
    if (state.hp <= 0) {
      state.effects = [];
      endGame(false);
    }
    updateUI();
  }
