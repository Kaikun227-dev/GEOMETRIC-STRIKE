'use strict';
// 保存・戦闘状態・ステータス表示・音・ダメージ計算
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // STORAGE
  // ---------------------------------------------------------------------------
  const TEAM_KEY = 'geometric-strike-team-v1';
  const LEGACY_BEST_KEY = 'geometric-strike-best-v1';
  const bestKey = id => `geometric-strike-best-v2-${id}`;
  const CHAPTER_EIGHT_BEST_RESET_KEY = 'geometric-strike-migration-reset-best-8-1-8-2-v1';
  const STAGE_SETTINGS_KEY = 'geometric-strike-stage-settings-v1';

  function loadStageSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STAGE_SETTINGS_KEY));
      return {
        invincible: saved?.invincible === true,
        powerBonus: saved?.powerBonus === true,
        laserGenerator: saved?.laserGenerator === true,
        cube: saved?.cube === true,
        heartFruitDisabled: saved?.heartFruitDisabled === true,
      };
    } catch (error) {
      console.error('ステージ設定を読み込めませんでした。', error);
      return { invincible: false, powerBonus: false, laserGenerator: false, cube: false, heartFruitDisabled: false };
    }
  }
  const stageSettings = loadStageSettings();
  function getStageSettings() { return { ...stageSettings }; }
  function setStageSetting(key, enabled) {
    if (!['invincible', 'powerBonus', 'laserGenerator', 'cube', 'heartFruitDisabled'].includes(key) || typeof enabled !== 'boolean') return false;
    const previous = stageSettings[key];
    stageSettings[key] = enabled;
    try {
      localStorage.setItem(STAGE_SETTINGS_KEY, JSON.stringify(stageSettings));
      return true;
    } catch (error) {
      stageSettings[key] = previous;
      console.error('ステージ設定を保存できませんでした。', error);
      return false;
    }
  }
  function stageHasLaserGenerator() {
    const stage = state?.stage || currentStage;
    const waves = state?.waves || stage.waves;
    return !!(stage.laserMultipliers || waves.some(wave => wave.laserMultipliers));
  }
  function commonLaserGeneratorActive() { return stageSettings.laserGenerator && !stageHasLaserGenerator(); }
  function scoreDisabled() { return currentStage.maker || stageSettings.invincible || stageSettings.powerBonus || commonLaserGeneratorActive(); }
  function heartFruitDisabled() { return stageSettings.heartFruitDisabled; }

  function resetChapterEightIntroBestOnce() {
    try {
      if (localStorage.getItem(CHAPTER_EIGHT_BEST_RESET_KEY) === 'done') return;
      localStorage.removeItem(bestKey('8-1'));
      localStorage.removeItem(bestKey('8-2'));
      localStorage.setItem(CHAPTER_EIGHT_BEST_RESET_KEY, 'done');
    } catch (error) {
      console.error('8-1/8-2のベストスコアをリセットできませんでした。', error);
    }
  }
  resetChapterEightIntroBestOnce();

  function resetBestScore(stageId) {
    try {
      localStorage.removeItem(bestKey(stageId));
      if (stageId === STAGES[0].id) localStorage.removeItem(LEGACY_BEST_KEY);
      if (currentStage.id === stageId) best = 0;
      return true;
    } catch (error) {
      console.error(`${stageId}のベストスコアをリセットできませんでした。`, error);
      return false;
    }
  }

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
        const migrated = raw.map(id => id === 'floria' ? 'next' : id);
        const ids = migrated.filter((id, i) => CHAR_BY_ID[id] && migrated.indexOf(id) === i).slice(0, MAX_TEAM);
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
      const c = chipCharacter(CHAR_BY_ID[charId],team);
      return { ...c, atk: c.atk + (stageSettings.powerBonus ? 3000 : 0), id: i, charId, x: positions[i][0], y: positions[i][1], r: UNIT_RADIUS, vx: 0, vy: 0, photons: 0 };
    });
  }

  function makeEnemies(stage, wave) {
    return stage.waves[wave].enemies.map((enemy,i)=>createEnemyRuntime(enemy,i,wave));
  }

  function resetGame() {
    const restoreFocus = !!state && screen === 'battle';
    cancelAim();
    const units = makeUnits();
    const maxHp = currentStage.teamHp ?? units.reduce((sum, unit) => sum + unit.hp, 0);
    best = loadBest(currentStage.id);
    state = {
      waterLevel:1,waterWallUsed:false,waterPower:false,
      phase: 'ready', paused: false, stage: currentStage, waves: currentStage.waves, wave: 0, turn: 1, waveTurn: 1,
      hp: maxHp, maxHp, score: 0,
      activeUnit: 0, units, enemies: makeEnemies(currentStage, 0),
      clock: 0, shotCount: 0, combo: 0, maxCombo: 0, skillCharge: 35, skillArmed: false,
      skillShot: false, aiming: null, keyboardAngle: -Math.PI / 2, keyboardPower: 0.8,
      keyboardAimUntil: 0, phaseTimer: 0, attackQueue: [], friendship: new Set(),
      particles: [], rings: [], floats: [], beams: [], trail: [], effects: [], attackLog: [], shake: 0,
      unitStopped: false, moveTime: 0, friendshipCleanupTimer: null,
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
    $('maker-return').hidden = !state.stage.maker;
    const tip = document.querySelector('.tip-panel div p:last-child');
    if(tip) tip.textContent = state.stage.hint || '味方の上を通り抜けると友情コンボが発動。ひとつの軌道が、連鎖になる。';
    setText('stage-label', state.stage.maker ? state.stage.name : `STAGE ${state.stage.id}`);
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
    if (scoreDisabled()) return;
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
    if(enemy.weakPoint.internal){const w=enemy.weakPoint,d=Math.min(w.offset||0,Math.max(0,enemy.r-w.radius-3));return {x:enemy.x+Math.cos(w.angle||0)*d,y:enemy.y+Math.sin(w.angle||0)*d,r:w.radius};}
    return { x: enemy.x + Math.cos(enemy.weakPoint.angle) * enemy.r * .84, y: enemy.y + Math.sin(enemy.weakPoint.angle) * enemy.r * .84, r: enemy.weakPoint.radius };
  }
  function weakPositions(enemy){
    if(!enemy.weakPoint)return [];
    const angles=enemy.weakPoint.angles;
    return angles?.length?angles.map(angle=>weakPosition({...enemy,weakPoint:{...enemy.weakPoint,angle}})):[weakPosition(enemy)];
  }
  function segmentDistance(p, a, b) {
    const dx = b.x-a.x, dy=b.y-a.y;
    const t = clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy || 1),0,1);
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  }
  function hitsWeak(enemy, hit) {
    if(!hit)return false;
    return weakPositions(enemy).some(weak=>hit.from&&hit.to?segmentDistance(weak,hit.from,hit.to)<=weak.r+(hit.radius||0):distance(weak,hit)<=weak.r+(hit.radius||0));
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
  function showFriendshipActivation(x,y,color,label) {
    queueEffect({type:'friendshipActivation',side:'ally',x,y,color,label,age:0,life:.55});
  }
  function powerAreaValue(area){const wave=state.waves[state.wave];return area.multiplier??wave.powerAreaMultiplier??state.stage.powerAreaMultiplier??4;}
  function powerAreaMultiplier(unit){if(!unit)return 1;const a=(state.waves[state.wave].gimmicks?.powerAreas||[]).find(a=>unit.x>=a.x&&unit.x<=a.x+a.w&&unit.y>=a.y&&unit.y<=a.y+a.h);return a?powerAreaValue(a):1;}
  // 触れた味方の数に応じて手番キャラの攻撃力アップ：0人=1倍、1人=4倍、2人=8倍、3人以上=30倍
  const TOUCH_POWER_TABLE=[1,4,8,30];
  function touchPowerActive(){return !!(state.waves[state.wave].touchPower??state.stage.touchPower);}
  function touchPowerMultiplier(owner=state.units[state.activeUnit]){return touchPowerActive()&&owner?.id===state.units[state.activeUnit]?.id?TOUCH_POWER_TABLE[Math.min(TOUCH_POWER_TABLE.length-1,state.touchedAllies?.size||0)]:1;}
  function powerSwitchMultiplier(){return state.powerSwitchActive?(state.waves[state.wave].switchMultiplier??state.stage.switchMultiplier??1):1;}
  function inPowerArea(unit) {
    if(!unit)return false;
    return (state.waves[state.wave].gimmicks?.powerAreas||[]).some(a=>unit.x>=a.x&&unit.x<=a.x+a.w&&unit.y>=a.y&&unit.y<=a.y+a.h);
  }
  // キラー系アビリティ：重力バリアを持つ敵／そのショットで最初に触れた敵へのダメージ倍率（直殴り・友情コンボの両方に乗る）。
  function killerMultiplier(owner,enemy){
    let mult=1,kind=null;
    for(const id of owner?.abilities||[]){
      const t=KILLER_TIERS[id];if(!t)continue;
      if(t.kind==='all'){mult*=t.mult;kind='all';}
      else if(t.kind==='poison'&&enemy.poisonTurns>0){mult*=t.mult;if(kind!=='all')kind='poison';}
      else if(t.kind==='gravity'&&enemy.gravity){mult*=t.mult;if(kind!=='all')kind='gravity';}
      else if(t.kind==='first'&&state.firstTouchId!=null&&state.firstTouchId===enemy.id){mult*=t.mult;if(kind!=='all')kind='first';}
    }
    return {mult,kind};
  }
  function killerDamageColor(killer,shockKiller,friendship){
    if(killer.mult>1&&killer.kind==='all')return ['#348fe5','#9554dd','#ed63b5'];
    if(shockKiller)return '#30bce6';
    if(killer.mult>1)return {gravity:'#348fe5',poison:'#a65bd3',first:'#e8553a'}[killer.kind]||(friendship?'#269e86':'#dc776c');
    return friendship?'#269e86':'#dc776c';
  }
  function killerEffect(enemy,k,friendship){
    const color=k.kind==='poison'?'#a65bd3':k.kind==='gravity'?'#6a5fd6':k.kind==='all'?ALL_KILLER_COLORS[1]:'#e8553a';
    if(friendship){if((enemy.killerFxAt||-9)>state.clock-.25)return;enemy.killerFxAt=state.clock;if(k.kind==='all')for(const c of ALL_KILLER_COLORS)burst(enemy.x,enemy.y,c,3,150);else burst(enemy.x,enemy.y,color,8,150);return;}
    floatingText(enemy.x,enemy.y-enemy.r-58,'KILLER','#348fe5',15);
    ring(enemy.x,enemy.y,color,enemy.r+46,.4);if(k.kind==='all'){ALL_KILLER_COLORS.forEach((c,i)=>{ring(enemy.x,enemy.y,c,enemy.r+30+i*14,.35+i*.06);burst(enemy.x,enemy.y,c,6,230);});}else burst(enemy.x,enemy.y,color,16,230);state.shake=Math.max(state.shake,5);
    queueEffect({type:'killerFx',side:'ally',x:enemy.x,y:enemy.y,r:enemy.r,kind:k.kind,color,age:0,life:.5});
  }
  function damageEnemy(enemy, amount, friendship = false, options = {}) {
    if (!enemy.alive||(enemy.transparent&&!options.poisonTick)||enemy.sword||enemy.summoner) return; // 剣持ち敵はダメージを受けない（他の敵が全滅すると撤退）
    // HP共有で他の敵から反映されたダメージ（sharedFrom）：倍率・弱点・キラーは再計算せず、受けたダメージ量をそのまま受ける。
    const shared=!!options.sharedFrom||!!options.poisonTick;
    const owner=options.owner||state.damageOwner||(!friendship?state.units[state.activeUnit]:null);
    const weak=!shared&&hitsWeak(enemy,options.hit)&&(!enemy.weakPoint?.internal||friendship||owner&&isPiercing(owner));
    const multiplier=enemyWeakMultiplier(enemy);
    const killer=shared?{mult:1,kind:null}:killerMultiplier(owner,enemy);
    const damage=shared?Math.max(0,Math.round(amount)):Math.round(amount*powerAuraMultiplier(owner)*killer.mult*powerAreaMultiplier(owner)*touchPowerMultiplier(owner)*(state.swordBoost||1)*(friendship?powerSwitchMultiplier():1)*(weak?(options.weakBonusOnly?multiplier-1:multiplier):1)*(enemy.defenseMultiplier||1)*(enemy.switchArmor&&!state.powerSwitchActive?enemy.switchArmor:1)*(options.laserGenerator?1:enemyRestrictionMultiplier(enemy,owner,friendship))*(friendship?1:enemy.armor??1));
    if (weak) { floatingText(enemy.x, enemy.y - enemy.r - 38, 'WEAK ×'+multiplier, '#c79816', 15); ring(weakPosition(enemy).x, weakPosition(enemy).y, '#e1b327', 36, .3); }
    if(killer.mult>1)killerEffect(enemy,killer,friendship);
    else if(!friendship&&!shared&&options.shockKiller)floatingText(enemy.x,enemy.y-enemy.r-58,'KILLER','#348fe5',15);
    const actualDamage = Math.min(enemy.hp, damage);
    enemy.hp = Math.max(0, enemy.hp - damage);
    enemy.flash = 0.15;
    if (!scoreDisabled()&&!enemy.hpShare?.length) state.score += actualDamage; // HP共有元の得点は、反映先の敵が受けたダメージ分に含める（二重加算しない）
    if(shared){
      floatingText(enemy.x + (Math.random() - 0.5) * 28, enemy.y - enemy.r - 10, (options.poisonTick?'毒 −':'')+String(damage), options.poisonTick?'#a65bd3':options.shockTick?'#199ed2':'#6f8f3f', 20);
      if(!options.shockTick){ring(enemy.x,enemy.y,'#7fae4f',enemy.r+22,.35);burst(enemy.x, enemy.y, '#9cc46a', 6, 90);}
    }else{
      state.combo++;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.comboTime = 1.7;
      chargeSkill(options.charge !== undefined ? options.charge : friendship ? 4 : 3.5);
      floatingText(enemy.x + (Math.random() - 0.5) * 28, enemy.y - enemy.r - 10, String(damage), killerDamageColor(killer,options.shockKiller,friendship), friendship ? 19 : 22);
      burst(enemy.x, enemy.y, friendship ? '#65c6ae' : '#ee9187', 7, 95);
      tone(250 + Math.min(state.combo, 12) * 36, 0.085, 'triangle', 0.025, 0, 170);
    }
    // HP共有：この敵が受けたダメージを、hpShare に指定した敵にも反映する（一方向。相手側が共有を持たなければ反映されない）。
    if(!options.poisonTick&&damage>0&&enemy.hpShare?.length){
      const visited=options.shareVisited||new Set();visited.add(enemy.id);
      for(const target of selectEffectTargets(enemy.hpShare)){
        if(visited.has(target.id)||!target.alive)continue;
        damageEnemy(target,damage,friendship,{...options,sharedFrom:enemy.id,shareVisited:visited,charge:0});
      }
    }
    if (enemy.hp <= 0 && enemy.alive) { // HP共有の反映中に撤退済みなら、二重に撃破処理しない
      enemy.alive = false;
      if(enemy.boss&&state.waves[state.wave].bossPhase===1){state.retreatGhost={x:enemy.x,y:enemy.y,r:enemy.r,sides:enemy.sides,tint:enemy.tint,age:0};floatingText(enemy.x,enemy.y-enemy.r-58,'ボスが撤退！','#618a95',18);}
      if (!scoreDisabled()) state.score += enemy.boss ? 5000 : 1000;
      chargeSkill(enemy.boss ? 15 : 7);
      burst(enemy.x, enemy.y, '#ef8277', enemy.boss ? 42 : 22, enemy.boss ? 260 : 170);
      ring(enemy.x, enemy.y, '#ed9b91', enemy.boss ? 140 : 75, 0.65);
      state.shake = Math.max(state.shake, enemy.boss ? 9 : 4);
      tone(150, 0.22, 'triangle', 0.04, 0, 45);
      rememberBest();
      resolveEnemyDefeat(enemy);
      if(enemy.boss&&state.waves[state.wave].bossPhase){
        for(const minion of state.enemies){
          if(!minion.alive||minion.boss||minion.midBoss||minion.retreatWhenShareDead)continue;
          minion.alive=false;minion.hp=0;
          if(!scoreDisabled())state.score+=1000;
          chargeSkill(7);
        }
      }
    }
    if(!options.poisonTick&&enemy.alive&&damage>0&&enemy.counterEffects?.length&&!enemy.counterResolving&&enemy.counterUsedTurn!==state.turn){
      enemy.counterUsedTurn=state.turn;enemy.counterResolving=true;floatingText(enemy.x,enemy.y-enemy.r-55,'COUNTER','#598cc4',14);
      try{for(const effect of enemy.counterEffects)applyEnemyEffect(effect,enemy);}finally{enemy.counterResolving=false;}
    }
    resolveRetreats();
    if(!state.enemies.some(e=>e.alive))state.friendshipCleanupTimer=0;
    if((weak&&!friendship)||(!enemy.alive&&enemy.weakPoint?.routeId))advanceWeakPoint(enemy);
  }

  // Enemy attacks always damage the shared team HP.
  function damageTeam(amount, x, y, target = state.units.find(u => Math.hypot(u.x-x,u.y-y) < 1), options = {}) {
    if (['gameover', 'victory'].includes(state.phase)) return;
    if (stageSettings.invincible || amount === 0) return;
    const damage = Math.max(1, Math.round(amount * (!options.poisonTick&&target?.battleStyle === 'balance' ? .8 : 1)));
    if(target?.barrierHp>0){
      target.barrierHp=Math.max(0,target.barrierHp-damage);
      if(!target.barrierHp)burst(target.x,target.y,target.color,20,190);
      ring(target.x,target.y,target.color,target.barrierHp?42:75,.4);
      floatingText(target.x,target.y-40,target.barrierHp?'バリア '+target.barrierHp:'バリア破壊','#379dbd',14);
      return;
    }
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

// 感電・感電キラー・友情ブースト
const tierBoost=(u,prefix)=>{for(const [suffix,m] of [['EL',3],['L',2.5],['M',2],['',1.5]])if(u?.abilities?.includes(prefix+suffix))return m;return 1;};
const friendBoost=u=>tierBoost(u,'fb');
const ELECTRIC_KINDS=new Set(['plasma','thunder','discharge','interference','oathSwords','plasmaBall']);
const baseElectricDamage=damageEnemy;
damageEnemy=function(enemy,amount,friendship=false,options={}){
 const owner=options.owner||state.damageOwner||(!friendship?state.units[state.activeUnit]:null),alive=enemy.alive,hp=enemy.hp;
 const secondary=options.sharedFrom||options.poisonTick||options.shockTick;
 const shocked=enemy.shockTurns>0;
 if(!secondary){if(shocked)amount*=tierBoost(owner,'ek');if(hitsWeak(enemy,options.hit)&&(!enemy.weakPoint?.internal||friendship||owner&&isPiercing(owner)))amount*=1+(owner?.chipWeak||0);}
 baseElectricDamage(enemy,amount,friendship,{...options,shockKiller:!secondary&&shocked&&tierBoost(owner,'ek')>1});
 const dealt=Math.max(0,hp-enemy.hp);
 if(!secondary&&!friendship&&shocked&&dealt>0&&tierBoost(owner,'ek')>1&&state.clock-(enemy.shockKillerFxAt??-99)>=.22){enemy.shockKillerFxAt=state.clock;queueEffect({type:'shockKiller',side:'ally',x:enemy.x,y:enemy.y,r:enemy.r,mult:tierBoost(owner,'ek'),age:0,life:.48});}
 if(alive&&!enemy.alive&&owner?.chipSoul)state.hp=Math.min(state.maxHp,state.hp+owner.chipSoul);
 if(!secondary&&dealt>0&&friendship&&ELECTRIC_KINDS.has(state.damageKind)&&enemy.alive&&Math.random()<.5){enemy.shockTurns=3;enemy.shockTurn=state.turn;}
 if(!secondary&&!friendship&&shocked&&dealt>0){for(const target of [...state.enemies])if(target.alive&&target.shockTurns>0&&!target.transparent){const resistance=(target.defenseMultiplier??1)*(target.switchArmor&&!state.powerSwitchActive?target.switchArmor:1)*(target.armor??1)*enemyRestrictionMultiplier(target,owner,false);damageEnemy(target,dealt*.3*resistance,false,{owner,shockTick:true,sharedFrom:'shock',charge:0});ring(target.x,target.y,'#75cfff',target.r+15,.3);}}
};
