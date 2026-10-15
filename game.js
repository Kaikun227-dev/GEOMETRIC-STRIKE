'use strict';
// 起動と公開API（必ず最後に読み込む）
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // BOOT
  // ---------------------------------------------------------------------------
  resetGame();
  showScreen('title', { focus: false, scroll: false });
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  requestAnimationFrame(frame);

  window.GeometricStrike = Object.freeze({
    getState: () => ({
      screen, stageId: state.stage.id, team: team.slice(),
      phase: state.phase, paused: state.paused, wave: state.wave + 1, turn: state.turn,
      hp: state.hp, maxHp: state.maxHp, score: state.score, best: Math.max(best, state.score),
      maxCombo: state.maxCombo, combo: state.combo, skillCharge: state.skillCharge,
      skillArmed: state.skillArmed, activeUnit: state.activeUnit, shotCount: state.shotCount,
      aiming: state.aiming ? { dx: state.aiming.dx, dy: state.aiming.dy, power: state.aiming.power } : null,
      muted,
      speedBoostUsed: !!state.speedBoostUsed, powerHitUsed: !!state.powerHitUsed,
      effects: state.effects.map(({ type, side }) => ({ type, side })),
      attackLog: state.attackLog.map(entry => ({ ...entry })),
      units: state.units.map(({ id, charId, name, shotType, battleStyle, x, y, r, vx, vy }) => ({ id, charId, name, shotType, battleStyle, x, y, r, vx, vy })),
      enemies: state.enemies.map(e => ({ id: e.id, x:e.x, y:e.y, r:e.r, hp:e.hp, maxHp:e.maxHp, countdown:e.countdown, alive:e.alive, boss:!!e.boss, weakPoint:weakPosition(e), attacks:e.attacks.map(a=>({kind:a.kind,remaining:a.remaining,interval:a.interval})) })),
    }),
    showScreen, startBattle, predictTrajectory, reflectVelocity,
  });
