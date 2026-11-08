'use strict';
// ターン進行・オーバーレイ・マウス／タッチ／キーボード操作
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // GAME FLOW
  // ---------------------------------------------------------------------------
  function reflectVelocity(vx, vy, nx, ny) {
    const dot = vx * nx + vy * ny;
    return { x: vx - 2 * dot * nx, y: vy - 2 * dot * ny };
  }

  // Sample the same contour contact used by actual shots, then refine the first impact.
  function guideEnemyHit(x,y,vx,vy,length,r){
    let nearest=null;
    for(const enemy of state.enemies||[]){
      if(!enemy.alive||enemy.transparent)continue;
      const probe={x,y,r,vx,vy};
      let overlapping=!!contactEnemy(probe,enemy),previous=0;
      for(let t=Math.min(3,length);t<=length&&t>previous;t=Math.min(t+3,length)){
        probe.x=x+vx*t;probe.y=y+vy*t;
        const hit=contactEnemy(probe,enemy);
        if(!hit)overlapping=false;
        else if(!overlapping&&vx*hit.nx+vy*hit.ny<0){
          let lo=previous,hi=t,normal=hit;
          for(let i=0;i<10;i++){
            const mid=(lo+hi)/2;probe.x=x+vx*mid;probe.y=y+vy*mid;
            const contact=contactEnemy(probe,enemy);
            if(contact){hi=mid;normal=contact;}else lo=mid;
          }
          if(!nearest||hi<nearest.t)nearest={t:hi,nx:normal.nx,ny:normal.ny};
          break;
        }
        previous=t;
        if(nearest&&t>=nearest.t)break;
      }
    }
    return nearest;
  }

  function predictTrajectory(origin, direction, length = 620, bounds = { left: FIELD.left + 23, right: FIELD.right - 23, top: FIELD.top + 23, bottom: FIELD.bottom - 23 }) {
    const magnitude = Math.hypot(direction.x, direction.y);
    if (magnitude < 0.001) return [{ x: origin.x, y: origin.y }];
    let vx = direction.x / magnitude;
    let vy = direction.y / magnitude;
    let x = clamp(origin.x, bounds.left, bounds.right);
    let y = clamp(origin.y, bounds.top, bounds.bottom);
    let remaining = Math.max(0, length);
    const points = [{ x, y }];
    // 結界：外にいれば外殻で、中にいれば内側の面で反射する（触れた回数が規定に達した結界はその先で消える）
    const barriers=(state.barriers||[]).filter(b=>!b.broken).map(b=>({b,left:b.left,mode:barrierRelation({x,y,r:UNIT_RADIUS},b)})).filter(o=>o.mode!=='edge');
    for (let i = 0; i < 8 && remaining > 0.001; i++) {
      const tx = Math.abs(vx) < 0.0001 ? Infinity : (vx > 0 ? bounds.right - x : bounds.left - x) / vx;
      const ty = Math.abs(vy) < 0.0001 ? Infinity : (vy > 0 ? bounds.bottom - y : bounds.top - y) / vy;
      let obstacle=null;
      if(!hasAbility(state.units[state.activeUnit],'ab'))for(const b of state.waves[state.wave].gimmicks?.blocks||[]){const hit=rayBlock(x,y,vx,vy,b,UNIT_RADIUS);if(hit&&(!obstacle||hit.t<obstacle.t))obstacle=hit;}
      if(cubeActive())for(const ally of state.units){if(ally===state.units[state.activeUnit])continue;const h=cubeHalf(ally),hit=rayBlock(x,y,vx,vy,{x:ally.x-h,y:ally.y-h,w:h*2,h:h*2},UNIT_RADIUS);if(hit&&(!obstacle||hit.t<obstacle.t))obstacle=hit;}
      for(const c of state.waves[state.wave].gimmicks?.containers||[]){const hit=rayBlock(x,y,vx,vy,containerRect(c),UNIT_RADIUS);if(hit&&(!obstacle||hit.t<obstacle.t))obstacle=hit;}
      for(const o of barriers){
        if(o.left<=0)continue;let hit=null;
        if(o.mode==='out')hit=rayBlock(x,y,vx,vy,o.b,UNIT_RADIUS);
        else{
          const lx=o.b.x+UNIT_RADIUS,hx=o.b.x+o.b.w-UNIT_RADIUS,ly=o.b.y+UNIT_RADIUS,hy=o.b.y+o.b.h-UNIT_RADIUS;
          const bx=Math.abs(vx)<.0001?Infinity:((vx>0?hx:lx)-x)/vx,by=Math.abs(vy)<.0001?Infinity:((vy>0?hy:ly)-y)/vy;
          if(Math.min(bx,by)<Infinity)hit=bx<=by?{t:Math.max(0,bx),nx:vx>0?-1:1,ny:0}:{t:Math.max(0,by),nx:0,ny:vy>0?-1:1};
        }
        if(hit&&(!obstacle||hit.t<obstacle.t))obstacle={...hit,barrier:o};
      }
      if(!isPiercing(state.units[state.activeUnit])){
        const hit=guideEnemyHit(x,y,vx,vy,Math.min(remaining,tx,ty,obstacle?.t??Infinity),origin.r??UNIT_RADIUS);
        if(hit&&(!obstacle||hit.t<obstacle.t))obstacle=hit;
      }
      const blockHit=obstacle&&obstacle.t<Math.min(tx,ty);
      const travel = Math.min(remaining, Math.max(0,blockHit?obstacle.t:Math.min(tx, ty)));
      x += vx * travel;
      y += vy * travel;
      points.push({ x, y });
      remaining -= travel;
      if (remaining <= 0.001) break;
      if(blockHit){if(obstacle.barrier)obstacle.barrier.left--;const dot=vx*obstacle.nx+vy*obstacle.ny;vx-=2*dot*obstacle.nx;vy-=2*dot*obstacle.ny;x+=vx*.001;y+=vy*.001;}
      else {if (tx <= ty + 0.001) vx *= -1;if (ty <= tx + 0.001) vy *= -1;}
    }
    return points;
  }

  function launch(dx, dy, power) {
    if (!['ready', 'aiming'].includes(state.phase) || state.paused) return;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude < 0.001 || power < 0.05) {
      cancelAim();
      return;
    }
    const unit = state.units[state.activeUnit];
    state.skillShot = state.skillArmed && state.skillCharge >= 100;
    if (state.skillShot) {
      state.skillCharge = 0;
      state.skillArmed = false;
      state.skillFlash = 0.7;
      state.notice = { title: 'STRIKE BURST', sub: `${unit.name} / 限界を超える一撃`, remaining: 1.7, max: 1.7 };
      ring(unit.x, unit.y, unit.color, 250, 0.8);
      tone(140, 0.5, 'sawtooth', 0.035, 0, 740);
    }
    unit.lineContacts=new Set();
    unit.superUsed=new Set();unit.lineStacks=0;unit.superWallAttack=0;
    const speed = (390 + clamp(power, 0, 1) * 710) * (state.skillShot ? 2 : 1) * (unit.speed * dashMultiplier(unit) * (unit.superWind?1.5:1) / 100);
    state.waterWallUsed=false;state.waterPower=false;
    unit.vx = dx / magnitude * speed * waterSpeedMultiplier();
    unit.vy = dy / magnitude * speed * waterSpeedMultiplier();
    state.phase = 'moving';
    state.aiming = null;
    state.shotCount++;
    state.shotDirection={vx:dx,vy:dy};
    state.atkUp=1;state.firstTouchId=null;state.wallSides=new Set();for(const u of state.units)u.bubblyGift=false;
    state.swordPanelsUsed=new Set();state.swordBonus=0;state.typePanelsUsed=new Set();state.touchedAllies=new Set();state.slowWallContacts=new Map();state.swordBoost=1;state.swordToucher=null;state.transPanelsUsed=new Set();
    state.boostPanelsUsed=new Set();state.warpCooldown=0;state.hazardContacts={};
    for(const u of state.units){u.boostTime=0;u.inGravity=false;u.enemyContacts=new Map();u.barrierMode=null;}
    state.laserGens=[];
    state.lastHitEnemyId = null;
    state.speedBoostUsed = false;
    state.powerHitUsed = false;
    state.combo = 0;
    state.friendship.clear();state.friendshipCounts=new Map();state.friendshipContacts=new Set();state.healedAllies=new Set();
    state.trail = [];
    state.effects = [];
    state.intro = false;
    state.keyboardAimUntil = 0;
    state.moveTime = 0;
    state.unitStopped = false;
    burst(unit.x, unit.y, unit.color, 12, 100);
    tone(280, 0.16, 'triangle', 0.04, 0, 640);
    updateUI();
  }

  // 味方は貫通するので、止まった位置が他の味方と重ならないよう押し出す
  function separateFromAllies(unit) {
    for (let pass = 0; pass < 4; pass++) {
      let moved = false;
      for (const ally of state.units) {
        if (ally.id === unit.id) continue;
        const dx = unit.x - ally.x;
        const dy = unit.y - ally.y;
        const gap = Math.hypot(dx, dy);
        const minGap = unit.r + ally.r + 4;
        if (gap >= minGap) continue;
        const nx = gap > 0.001 ? dx / gap : 0;
        const ny = gap > 0.001 ? dy / gap : -1;
        unit.x = clamp(ally.x + nx * minGap, FIELD.left + unit.r, FIELD.right - unit.r);
        unit.y = clamp(ally.y + ny * minGap, FIELD.top + unit.r, FIELD.bottom - unit.r);
        moved = true;
      }
      if (!moved) break;
    }
  }

  function finishShot() {
    const recovery=Math.min(state.units.reduce((sum,u)=>sum+(u.chipRegen||0),0),state.maxHp-state.hp);
    if(recovery>0){state.hp+=recovery;floatingText(310,100,"緩回復 ＋"+recovery,"#35b981",16);}
    changeWaterDepth();
    const unit = state.units[state.activeUnit];
    unit.vx = 0;
    unit.vy = 0;
    separateFromAllies(unit);
    chargeSkill(6);
    rememberBest();
    if (!state.enemies.some(enemy => enemy.alive)) {
      tickAllyPoison();if(state.phase==='gameover')return;
      clearWave();
      return;
    }
    tickEnemyPoison();
    if(!state.enemies.some(e=>e.alive)){tickAllyPoison();if(state.phase!=='gameover')clearWave();return;}
    endOfTurnHeartFruits();
    state.phase = 'enemy';
    state.phaseTimer = 0.48;
    beginWindTurn();
    state.attackQueue = [];
    state.enemies.filter(enemy => enemy.alive).forEach(enemy => {
      for (const attack of enemy.attacks) {
        attack.remaining--;
        if (attack.remaining <= 0) state.attackQueue.push({ enemy, attack });
      }
      enemy.countdown = Math.min(...enemy.attacks.map(a => a.remaining));
    });
    updateUI();
  }

  function readyNextTurn() {
    if(state.phase!=='wave'){tickAllyPoison();if(state.phase==='gameover')return;}
      for(const u of state.units){u.weakAttack=0;u.lineStacks=0;u.superWallAttack=0;}
    for(const e of state.enemies)if(e.transparent&&!e.stealthManaged){e.transparent=false;allowSpawnExit(e);}
    resetBarriers();state.laserGens=[];
    state.atkUp=1;state.firstTouchId=null;state.wallSides=new Set();for(const u of state.units)u.bubblyGift=false;
    state.swordBoost=1;state.swordToucher=null;state.transPanelsUsed=new Set();state.containerLeft=(state.waves[state.wave].gimmicks?.containers||[]).map(c=>c.n);
    state.swordBonus=0;state.swordPanelsUsed=new Set();state.typePanelsUsed=new Set();state.touchedAllies=new Set();for(const u of state.units){const base=CHAR_BY_ID[u.charId]?.shotType;if(base)u.shotType=base;}resetPowerSwitches();
    if(state.phase!=='wave')for(const e of state.enemies){if(!e.alive||!e.weakPoint||!e.weakAngles?.length||e.weakMoveOnHit||e.weakPoint.internal||e.weakPoint.routeId)continue;e.weakStep=(e.weakStep+1)%e.weakAngles.length;e.weakPoint.angle=e.weakAngles[e.weakStep];const w=weakPosition(e);ring(w.x,w.y,'#dfaa19',40,.5);floatingText(e.x,e.y-e.r-45,'WEAK SHIFT','#b48d27',12);}
    state.turn++;
    state.waveTurn++;
    for(const e of state.enemies)if(e.defenseExpiresAt!==undefined&&e.defenseExpiresAt<=state.turn)e.defenseMultiplier=1;
    state.activeUnit = (state.activeUnit + 1) % state.units.length;
    state.phase = 'ready';
    for(const u of state.units)if(hasAbility(u,'regen')){const healed=Math.min(300,state.maxHp-state.hp);state.hp+=healed;if(healed>0){floatingText(u.x,u.y-40,'REGEN +'+healed,'#35b981',14);ring(u.x,u.y,'#35b981',65,.5);}}
    state.skillShot = false;
    state.keyboardAngle = -Math.PI / 2;
    state.keyboardPower = 0.8;
    const unit = state.units[state.activeUnit];
    ring(unit.x, unit.y, unit.color, 49, 0.5);
    updateUI();
  }

  function clearWave() {
    if (!scoreDisabled()) state.score += 2000 + state.wave * 1000;
    rememberBest();
    chime();
    if (state.wave === state.waves.length - 1) {
      state.phase = 'victory';
      state.phaseTimer = 1;
      state.notice = { title: 'ALL CLEAR', sub: 'すべての幾何が、共鳴した。', remaining: 3, max: 3 };
      burst(310, 300, state.units[0].color, 50, 240);
      return;
    }
    state.phase = 'wave';
    state.phaseTimer = 1.7;
    const retreat=state.waves[state.wave].bossPhase===1;
    state.notice = { title: retreat?'BOSS RETREAT':'WAVE CLEAR', sub: retreat?'ボスが撤退！ 追いかけて決着をつけよう / HP +1,500':'HP +1,500 / 次のフィールドへ', remaining: 1.7, max: 1.7 };
    state.hp = Math.min(state.maxHp, state.hp + 1500);
    updateUI();
  }

  function enterWave() {
    state.wave++;
    state.waveTurn = 0;
    state.friendshipCleanupTimer = null;
    state.enemies = makeEnemies(state.stage, state.wave);
    // Preserve every ally's exact position across waves. Newly overlapping
    // enemies are passable only until that ally exits their body once.
    for (const unit of state.units) {
      unit.vx = 0; unit.vy = 0;
      unit.spawnOverlaps = new Set(state.enemies.filter(e => enemyOverlaps(unit,e)).map(e=>e.id));
    }
    setupArea();
    state.effects = [];
    const last = state.wave === state.waves.length - 1;
    state.notice = { title: state.waves[state.wave].bossPhase ? 'BOSS '+state.waves[state.wave].bossPhase+' / 2' : last ? 'FINAL WAVE' : `WAVE ${pad2(state.wave + 1)}`, sub: state.waves[state.wave].name, remaining: 2, max: 2 };
    readyNextTurn();
  }

  function endGame(won) {
    const chipDrops=won?awardChips():[];
    state.phase = won ? 'victory' : 'gameover';
    state.phaseTimer = -1;
    state.aiming = null;
    if (!scoreDisabled()) state.score += won ? Math.round(state.hp / 10) : 0;
    rememberBest();
    showOverlay({
      eyebrow: won ? 'MISSION COMPLETE' : 'TRY AGAIN',
      title: won ? '完璧な、軌道。' : '次の一撃に、可能性を。',
      copy: won ? `${state.waves.length}つのウェーブを突破。 チップ：${chipDrops.length?chipDrops.map(chipName).join("、"):"ドロップなし"}${state.chipSaveFailed?"（保存に失敗しました）":""}` : '味方の上を通り抜けると友情コンボが発動。壁の反射を使って、次の軌道を見つけよう。',
      stats: `SCORE ${String(state.score).padStart(6, '0')}　/　MAX ${state.maxCombo} HITS　/　${state.shotCount} SHOTS`,
      primary: 'もう一度プレイ', onPrimary: resetGame,
      secondary: 'フィールドを見る', onSecondary: () => { hideOverlay(); updateUI(); },
      tertiary: battleExitLabel(), onTertiary: () => leaveBattle('stage'),
    });
    updateUI();
  }

  function showOverlay(options) {
    cancelAim();
    state.paused = true;
    setText('overlay-eyebrow', options.eyebrow);
    setText('overlay-title', options.title);
    setText('overlay-copy', options.copy);
    setText('overlay-stats', options.stats || '');
    setText('overlay-primary', options.primary || 'ゲームに戻る');
    setText('overlay-secondary', options.secondary || '');
    setText('overlay-tertiary', options.tertiary || '');
    if ($('overlay-stats')) $('overlay-stats').hidden = !options.stats;
    if ($('overlay-secondary')) $('overlay-secondary').hidden = !options.secondary;
    if ($('overlay-tertiary')) $('overlay-tertiary').hidden = !options.tertiary;
    overlayAction = options.onPrimary || resume;
    overlaySecondaryAction = options.onSecondary || resume;
    overlayTertiaryAction = options.onTertiary || null;
    if ($('game-overlay')) $('game-overlay').hidden = false;
    updateUI();
    if ($('overlay-primary')) $('overlay-primary').focus({ preventScroll: true });
  }

  function hideOverlay() {
    if ($('game-overlay')) $('game-overlay').hidden = true;
    if (state) state.paused = false;
    overlayAction = null;
    overlaySecondaryAction = null;
    overlayTertiaryAction = null;
  }

  function resume() {
    hideOverlay();
    updateUI();
    canvas.focus({ preventScroll: true });
  }

  function pauseGame() {
    if (state.stage.maker && !state.paused) {
      showOverlay({ eyebrow: 'TEST PLAY', title: 'テストプレイ', copy: '編集に戻るか、テストを続けます。', primary: 'ゲームに戻る', onPrimary: resume, secondary: 'はじめから', onSecondary: resetGame, tertiary: battleExitLabel(), onTertiary: () => leaveBattle() });
      return;
    }
    if (state.paused) { resume(); return; }
    if (['victory', 'gameover'].includes(state.phase)) {
      showOverlay({ eyebrow: 'ONE MORE STRIKE', title: '新しい軌道を、描こう。', copy: `もう一度、${state.waves.length}つのウェーブに挑戦します。`, primary: 'もう一度プレイ', onPrimary: resetGame, secondary: 'フィールドに戻る', onSecondary: resume, tertiary: 'ステージ選択へ', onTertiary: () => leaveBattle('stage') });
      return;
    }
    showOverlay({ eyebrow: 'TAKE A BREATH', title: 'ひとやすみ。', copy: '次の軌道を思い描こう。準備ができたら、続きをどうぞ。', stats: `STAGE ${state.stage.id}　・　WAVE ${state.wave + 1} / ${state.waves.length}　・　TURN ${state.turn}`, primary: 'ゲームを再開', onPrimary: resume, secondary: 'はじめから', onSecondary: confirmRestart, tertiary: 'ステージ選択へ', onTertiary: confirmQuit });
  }

  function battleExitLabel() {
    return state.stage.maker ? '編集に戻る' : 'ステージ選択へ';
  }

  function confirmRestart() {
    showOverlay({ eyebrow: 'RESTART', title: '新しい一撃から。', copy: '現在のプレイを終了して、最初のウェーブからやり直します。ベストスコアは保存されます。', primary: 'はじめからプレイ', onPrimary: () => { rememberBest(); resetGame(); }, secondary: 'ゲームに戻る', onSecondary: resume });
  }

  function confirmQuit() {
    showOverlay({ eyebrow: 'LEAVE STAGE', title: 'ステージを中断します。', copy: '現在のプレイは破棄されます。ベストスコアは保存されます。', primary: 'ステージ選択へ', onPrimary: () => { rememberBest(); leaveBattle('stage'); }, secondary: 'ゲームに戻る', onSecondary: resume });
  }

  function showHelp() {
    if (screen !== 'battle') return;
    showOverlay({
      eyebrow: 'HOW TO PLAY', title: '狙う。はじく。つながる。',
      copy: '光っている味方を、飛ばしたい方向と逆にひっぱってはなそう。壁では全キャラが反射。反射タイプは敵で跳ね返り、貫通タイプは敵を通り抜けてダメージを与えます。敵に当たるたび、撃種と戦型に応じて減速します。味方の上を通り抜けると友情コンボが発動します。敵の数字は攻撃ごとの残りターン。同時に0になる攻撃は同時発動します。金色の弱点に当てると、直殴りも友情も基本3倍（表示倍率を適用）。 黄色いフォトンは最大4個、直殴りで1個消費して基本2倍（ステージにより変動）。赤い地雷は接触ダメージ、青い重力バリアは減速します。緑のパネルで加速。金色のパワーエリア内では全ダメージ4倍。ウィンドは敵ターンに引き寄せ・吹き出し、敵やブロックで止まります。アンチウィンドで無効化できます。戦型とアビリティは編成画面で確認できます。ゲージが100%になったら、ストライクバーストを使おう。',
      stats: 'キーボード：← → 角度　↑ ↓ 強さ　SPACE 発射　ESC 一時停止',
      primary: 'プレイする', onPrimary: resume,
    });
  }

  function cancelAim() {
    if (state) {
      if (state.phase === 'aiming') state.phase = 'ready';
      state.aiming = null;
    }
    if (pointerId !== null) {
      try { if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId); } catch (_) {}
      pointerId = null;
    }
  }

  // ---------------------------------------------------------------------------
  // INPUT
  // ---------------------------------------------------------------------------
  function pointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * WIDTH / bounds.width, y: (event.clientY - bounds.top) * HEIGHT / bounds.height };
  }

  canvas.style.touchAction = 'none';
  canvas.tabIndex = 0;
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || state.paused || state.phase !== 'ready' || pointerId !== null) return;
    const point = pointFromEvent(event);
    const unit = state.units[state.activeUnit];
    if (distance(point, unit) > 64) return;
    event.preventDefault();
    unlockAudio();
    canvas.focus({ preventScroll: true });
    pointerId = event.pointerId;
    canvas.setPointerCapture(pointerId);
    state.phase = 'aiming';
    state.aiming = { start: point, current: point, dx: 0, dy: 0, power: 0 };
    state.keyboardAimUntil = 0;
    updateUI();
  });
  canvas.addEventListener('pointermove', event => {
    const point = pointFromEvent(event);
    if (state.phase === 'ready' && !state.paused) canvas.style.cursor = distance(point, state.units[state.activeUnit]) < 64 ? 'grab' : 'default';
    if (event.pointerId !== pointerId || !state.aiming) return;
    event.preventDefault();
    const aim = state.aiming;
    aim.current = point;
    aim.dx = aim.start.x - point.x;
    aim.dy = aim.start.y - point.y;
    aim.power = clamp(Math.hypot(aim.dx, aim.dy) / 140, 0, 1);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointerup', event => {
    if (event.pointerId !== pointerId || !state.aiming) return;
    event.preventDefault();
    const aim = state.aiming;
    const point = pointFromEvent(event);
    const dx = aim.start.x - point.x;
    const dy = aim.start.y - point.y;
    const power = clamp(Math.hypot(dx, dy) / 140, 0, 1);
    cancelAim();
    canvas.style.cursor = 'grab';
    if (Math.hypot(dx, dy) > 8) launch(dx, dy, power);
    else updateUI();
  });
  canvas.addEventListener('pointercancel', event => {
    if (event.pointerId === pointerId) { cancelAim(); updateUI(); }
  });
  canvas.addEventListener('lostpointercapture', () => {
    if (state.aiming) { cancelAim(); updateUI(); }
  });
  window.addEventListener('blur', () => { cancelAim(); updateUI(); });
  document.addEventListener('visibilitychange', () => {
    if (screen === 'battle' && document.hidden && !state.paused && !['victory', 'gameover'].includes(state.phase)) pauseGame();
  });
  window.addEventListener('keydown', event => {
    if (screen !== 'battle') {
      if (event.key === 'Escape' && screen === 'formation') { event.preventDefault(); confirmFormation(); }
      else if (event.key === 'Escape' && screen === 'stage') { event.preventDefault(); showScreen('title'); }
      return;
    }
    if (event.key === 'Tab' && state.paused && $('game-overlay') && !$('game-overlay').hidden) {
      const buttons = [$('overlay-primary'), $('overlay-secondary'), $('overlay-tertiary')].filter(button => button && !button.hidden);
      if (buttons.length) {
        const index = buttons.indexOf(document.activeElement);
        if (index < 0 || (!event.shiftKey && index === buttons.length - 1) || (event.shiftKey && index === 0)) {
          event.preventDefault();
          buttons[event.shiftKey ? buttons.length - 1 : 0].focus();
        }
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      pauseGame();
      return;
    }
    if (document.activeElement !== canvas) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
    if (state.paused || state.phase !== 'ready') return;
    if (event.key === 'ArrowLeft') state.keyboardAngle -= 0.1;
    else if (event.key === 'ArrowRight') state.keyboardAngle += 0.1;
    else if (event.key === 'ArrowUp') state.keyboardPower = clamp(state.keyboardPower + 0.06, 0.12, 1);
    else if (event.key === 'ArrowDown') state.keyboardPower = clamp(state.keyboardPower - 0.06, 0.12, 1);
    else if (event.key === ' ' && !event.repeat) {
      unlockAudio();
      launch(Math.cos(state.keyboardAngle), Math.sin(state.keyboardAngle), state.keyboardPower);
      return;
    } else return;
    state.keyboardAimUntil = state.clock + 5;
  });

  if ($('pause-button')) $('pause-button').addEventListener('click', pauseGame);
  if ($('restart-button')) $('restart-button').addEventListener('click', confirmRestart);
  if ($('help-button')) $('help-button').addEventListener('click', showHelp);
  if ($('sound-button')) $('sound-button').addEventListener('click', () => {
    muted = !muted;
    if (!muted) { unlockAudio(); tone(620, 0.1); }
    updateUI();
  });
  if ($('skill-button')) $('skill-button').addEventListener('click', () => {
    if (state.skillCharge < 100 || state.paused || !['ready', 'aiming'].includes(state.phase)) return;
    unlockAudio();
    state.skillArmed = !state.skillArmed;
    if (state.skillArmed) {
      tone(520, 0.2, 'sine', 0.035, 0, 880);
      const unit = state.units[state.activeUnit];
      ring(unit.x, unit.y, unit.color, 80, 0.65);
    }
    updateUI();
  });
  if ($('overlay-primary')) $('overlay-primary').addEventListener('click', () => { unlockAudio(); if (overlayAction) overlayAction(); });
  if ($('overlay-secondary')) $('overlay-secondary').addEventListener('click', () => { if (overlaySecondaryAction) overlaySecondaryAction(); });
  if ($('overlay-tertiary')) $('overlay-tertiary').addEventListener('click', () => { if (overlayTertiaryAction) overlayTertiaryAction(); });
