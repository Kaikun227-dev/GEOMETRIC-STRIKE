'use strict';
// Canvas描画・リサイズ・アニメーションループ
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // RENDERING
  // ---------------------------------------------------------------------------
  function drawGimmicks(){
    const g=state.waves[state.wave].gimmicks||{};ctx.save();ctx.textAlign='center';ctx.font='bold 10px Arial';
    for(const a of g.powerAreas||[]){
      ctx.fillStyle='#edbd4525';ctx.strokeStyle='#c49b36';ctx.lineWidth=2;
      ctx.fillRect(a.x,a.y,a.w,a.h);ctx.strokeRect(a.x,a.y,a.w,a.h);
      ctx.save();ctx.beginPath();ctx.rect(a.x,a.y,a.w,a.h);ctx.clip();ctx.strokeStyle='#d9b45c25';ctx.lineWidth=1;
      for(let x=a.x-a.h;x<a.x+a.w;x+=24){ctx.beginPath();ctx.moveTo(x,a.y);ctx.lineTo(x+a.h,a.y+a.h);ctx.stroke();}ctx.restore();
      ctx.fillStyle='#957023';ctx.fillText('POWER AREA ×'+powerAreaValue(a),a.x+a.w/2,a.y+17);
    }
    for(const w of state.winds||[]){
      const color=w.mode==='pull'?'#4f94a5':'#8881ba';ctx.strokeStyle=color;ctx.fillStyle=w.mode==='pull'?'#5dabb010':'#9183be10';
      ctx.setLineDash([4,7]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(w.x,w.y,w.radius,0,TAU);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      ctx.save();ctx.translate(w.x,w.y);ctx.rotate(state.clock*(w.active?4:1)*(w.mode==='pull'?1:-1));
      for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(4,2);ctx.lineTo(21,3);ctx.lineTo(13,18);ctx.closePath();ctx.fillStyle=color;ctx.fill();}ctx.restore();
      ctx.fillStyle=color;ctx.fillText((w.mode==='pull'?'引き寄せ':'吹き出し')+' '+w.remaining,w.x,w.y+((state.heartPanels||[]).some(p=>distance(p,w)<p.r+25)?-40:36));
      for(let i=0;i<8;i++){const angle=i*TAU/8,progress=(state.clock*(w.active?1.8:.35)+i/8)%1,r=30+(w.mode==='pull'?1-progress:progress)*(w.radius-40),x=w.x+Math.cos(angle)*r,y=w.y+Math.sin(angle)*r;
        ctx.save();ctx.translate(x,y);ctx.rotate(angle+(w.mode==='pull'?Math.PI:0));ctx.globalAlpha=w.active?.75:.22;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(0,0);ctx.lineTo(-8,4);ctx.stroke();ctx.restore();}
    }
    for(const route of state.waves[state.wave].weakRoutes||[]){
      const targets=route.positions.map(p=>selectEffectTargets(p.target).find(e=>e.alive)).filter(Boolean);
      ctx.strokeStyle='#d9ba692e';ctx.setLineDash([3,9]);ctx.lineWidth=1;ctx.beginPath();targets.forEach((e,i)=>{if(i)ctx.lineTo(e.x,e.y);else ctx.moveTo(e.x,e.y);});if(targets.length>1)ctx.closePath();ctx.stroke();ctx.setLineDash([]);
      targets.forEach((e,i)=>{ctx.fillStyle=e.weakPoint?.routeId===route.id?'#bc8f20':'#a5a7ae';ctx.font='bold 10px Arial';ctx.fillText('順 '+(i+1),e.x+e.r+12,e.y+e.r+8);});
    }    for(const b of g.blocks||[]){ctx.fillStyle='#c8d1dc';ctx.strokeStyle='#7c8b9f';ctx.lineWidth=2;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#edf2f7';ctx.strokeRect(b.x+5,b.y+5,b.w-10,b.h-10);ctx.fillStyle='#64758b';ctx.fillText('BLOCK',b.x+b.w/2,b.y+b.h/2+3);}
    for(const e of state.enemies){if(!e.alive||!e.gravity)continue;ctx.fillStyle='#6974cb12';ctx.strokeStyle='#7985c680';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.arc(e.x,e.y,e.gravity,0,TAU);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#6976ab';ctx.fillText('GRAVITY',e.x,e.y+e.gravity-12);}
    for(const p of state.pickups||[]){ctx.save();ctx.translate(p.x,p.y);ctx.lineWidth=2;if(p.kind==='mine'){ctx.strokeStyle='#d65e62';ctx.fillStyle='#f8d8d9';polygon(0,0,12,8);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(5,5);ctx.moveTo(5,-5);ctx.lineTo(-5,5);ctx.stroke();}else{ctx.strokeStyle='#c4992c';ctx.fillStyle='#ffe7a0';polygon(0,0,12,4);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill();}ctx.restore();}
    (state.powerSwitches||[]).forEach(p=>{ctx.save();ctx.translate(p.x,p.y);const color=['#aab5bf','#5cafd0','#d8a23d'][p.state];ctx.fillStyle=color+'33';ctx.strokeStyle=color;ctx.lineWidth=3;ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2);ctx.strokeRect(-p.r,-p.r,p.r*2,p.r*2);ctx.fillStyle='#52616d';ctx.font='bold 17px Arial';ctx.fillText(String(p.state),0,6);ctx.fillStyle='#667782';ctx.font='bold 8px Arial';ctx.fillText('POWER',0,p.r+12);ctx.restore();});
    (g.swords||[]).forEach((p,i)=>{ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=state.swordPanelsUsed?.has(i)?.38:1;ctx.fillStyle='#fff0cb';ctx.strokeStyle='#bb8933';ctx.lineWidth=2;ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2);ctx.strokeRect(-p.r,-p.r,p.r*2,p.r*2);ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(6,-8);ctx.lineTo(3,9);ctx.lineTo(-3,9);ctx.lineTo(-6,-8);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-10,9);ctx.lineTo(10,9);ctx.moveTo(0,9);ctx.lineTo(0,20);ctx.stroke();ctx.fillStyle='#98702d';ctx.fillText('+100%',0,p.r+13);ctx.restore();});
    for(const p of state.heartPanels||[]){
      ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#fce4ee';ctx.strokeStyle='#d67d9e';ctx.lineWidth=2;
      ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2);ctx.strokeRect(-p.r,-p.r,p.r*2,p.r*2);
      ctx.beginPath();ctx.moveTo(0,11);ctx.bezierCurveTo(-30,-7,-10,-23,0,-10);ctx.bezierCurveTo(10,-23,30,-7,0,11);ctx.fillStyle='#d76a92';ctx.fill();
      ctx.fillStyle='#bd5980';ctx.fillText('+200',0,p.r+14);ctx.restore();
    }    for(const p of g.boosts||[]){ctx.fillStyle='#ddf6e9';ctx.strokeStyle='#35b981';ctx.lineWidth=2;ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);ctx.strokeRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);ctx.fillStyle='#2a9f70';ctx.fillText('BOOST',p.x,p.y+p.r+14);for(const d of [-7,7]){ctx.beginPath();ctx.moveTo(p.x-10,p.y+d+3);ctx.lineTo(p.x,p.y+d-5);ctx.lineTo(p.x+10,p.y+d+3);ctx.stroke();}}
    (g.warps||[]).forEach((pair,i)=>{for(const p of [pair.a,pair.b]){ctx.fillStyle=i?'#e3efff':'#eee5fa';ctx.strokeStyle=i?'#698fdb':'#9d79d5';ctx.beginPath();ctx.arc(p.x,p.y,pair.r,0,TAU);ctx.fill();ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(p.x,p.y,pair.r-8,state.clock,TAU+state.clock);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=ctx.strokeStyle;ctx.fillText('WARP '+(i+1),p.x,p.y+pair.r+15);}});
    for(const w of [...(g.walls||[]),...(g.slowWalls||[]).map(w=>({...w,slow:true}))]){ctx.strokeStyle=w.slow?'#438fd5':'#e56565';ctx.lineWidth=7;ctx.shadowColor=w.slow?'#77bbee':'#ec7777';ctx.shadowBlur=10;ctx.beginPath();if(w.side==='left'||w.side==='right'){const x=w.side==='left'?FIELD.left:FIELD.right;ctx.moveTo(x,w.start);ctx.lineTo(x,w.end);}else{const y=w.side==='top'?FIELD.top:FIELD.bottom;ctx.moveTo(w.start,y);ctx.lineTo(w.end,y);}ctx.stroke();ctx.shadowBlur=0;}
    ctx.restore();
  }
  function drawBackground() {
    ctx.fillStyle = '#f7f9fb';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const wash = ctx.createRadialGradient(310, 320, 20, 310, 340, 460);
    wash.addColorStop(0, '#ffffff');
    wash.addColorStop(1, '#f4f7fa');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#dfe6eb';
    for (let x = 28; x <= WIDTH; x += 24) {
      for (let y = 28; y <= HEIGHT; y += 24) {
        ctx.beginPath(); ctx.arc(x, y, 0.8, 0, TAU); ctx.fill();
      }
    }
    ctx.strokeStyle = '#e8edf1';
    ctx.lineWidth = 1;
    [104, 190, 268].forEach(radius => {
      ctx.beginPath(); ctx.arc(310, 352, radius, 0, TAU); ctx.stroke();
    });
    ctx.setLineDash([4, 8]);
    ctx.beginPath(); ctx.moveTo(310, 76); ctx.lineTo(310, 632); ctx.moveTo(44, 352); ctx.lineTo(576, 352); ctx.stroke();
    ctx.setLineDash([]);
    polygon(310, 352, 14, 4, 0);
    ctx.stroke();
    ctx.strokeStyle = '#d9e2e8';
    ctx.strokeRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);
    ctx.strokeStyle = '#c6d4dd';
    ctx.lineWidth = 2;
    [[28, 28, 1, 1], [592, 28, -1, 1], [28, 712, 1, -1], [592, 712, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + 16 * dy); ctx.lineTo(x, y); ctx.lineTo(x + 16 * dx, y); ctx.stroke();
    });
    ctx.font = '500 9px "Space Grotesk", "Arial", sans-serif';
    ctx.fillStyle = '#98a8b4';
    ctx.textAlign = 'left';
    ctx.fillText(`FIELD / 0${state.wave + 1}`, 43, 51);
    ctx.textAlign = 'right';
    ctx.fillText(state.enemies.some(enemy => enemy.boss) ? 'CORE DETECTED' : 'REFLECT · CONNECT', 578, 51);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a6b3bc';
    ctx.fillText('GEOMETRIC SYSTEM / ACTIVE', 43, 695);
    ctx.textAlign = 'right';
    ctx.fillText('X 620 : Y 740', 577, 695);
  }

  function enemyPath(enemy,radius,rotation) {
    if(enemy.shape==='cruciform'){
      const arm=.38,points=[[-arm,-1],[arm,-1],[arm,-arm],[1,-arm],[1,arm],[arm,arm],[arm,1],[-arm,1],[-arm,arm],[-1,arm],[-1,-arm],[-arm,-arm]];
      ctx.beginPath();points.forEach(([x,y],i)=>{if(i)ctx.lineTo(x*radius,y*radius);else ctx.moveTo(x*radius,y*radius);});ctx.closePath();
    }else if(enemy.shape==='starBattery'){
      ctx.beginPath();for(let i=0;i<16;i++){const angle=rotation+i*TAU/16,r=radius*(i%2?.58:1);if(i)ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);else ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);}ctx.closePath();
    }else    if(enemy.shape==='circle'){ctx.beginPath();ctx.arc(0,0,radius,0,TAU);}
    else polygon(0,0,radius,enemy.sides,rotation);
  }
  function drawEnemy(enemy) {
    if (!enemy.alive) {
      if(enemy.restriction&&!state.crossSkullsFired?.has(enemy.crossSkull)){ctx.save();ctx.strokeStyle='#aaa2b966';ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(enemy.x,enemy.y,enemy.r,0,TAU);ctx.stroke();ctx.fillStyle='#9991a6';ctx.textAlign='center';ctx.font='10px Arial';ctx.fillText('蘇生待ち',enemy.x,enemy.y+3);ctx.restore();}
      return;
    }
    const { x, y, r } = enemy;
    const wobble = Math.sin(state.clock * 1.4 + enemy.rotation) * 0.035;
    ctx.save();
    ctx.translate(x, y);
    if(enemy.transparent)ctx.globalAlpha=.22;
    if(enemy.counterEffects?.length){ctx.strokeStyle='#548dbb';ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(0,0,r+10,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#4d80b0';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText(enemy.transparent?'透明化':'反撃',0,-r-18);}
    if (enemy.boss) {
      ctx.strokeStyle = '#f0d0cb';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 8]);
      ctx.beginPath(); ctx.arc(0, 0, r + 17, state.clock * 0.07, TAU + state.clock * 0.07); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 10px "Space Grotesk", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ca7c71';
      ctx.fillText((state.waves[state.wave].noWeakPoints||state.stage.noWeakPoints)?'BOSS / 弱点なし':enemy.internalWeak&&!enemy.weakPoint?'BOSS / 弱点は他の敵へ':'BOSS / '+(enemy.weakPoint?.internal?'内部弱点':'WEAK')+' ×'+enemyWeakMultiplier(enemy),0,r+40);
    }
    ctx.shadowColor = 'rgba(213, 118, 105, 0.17)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;
    enemyPath(enemy, r, -Math.PI / 2 + wobble + (enemy.sides === 4 ? Math.PI / 4 : 0));
    ctx.fillStyle = enemy.flash ? '#fff8f4' : (enemy.tint||'#ee8c7f');
    if(enemy.restriction&&!enemy.flash){const gel=enemy.restriction==='reflect';const gradient=ctx.createLinearGradient(-r,-r,r,r);gradient.addColorStop(0,gel?'#d6f6fa':'#edf0f3');gradient.addColorStop(.4,gel?'#8ed6df':'#9ba8b6');gradient.addColorStop(1,gel?'#53adbf':'#586879');ctx.fillStyle=gradient;}
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#d9776b';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    enemyPath(enemy, r * 0.68, -Math.PI / 2 + wobble + (enemy.sides === 4 ? Math.PI / 4 : 0));
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = 1;
    ctx.stroke();
    polygon(0, 0, enemy.boss ? 18 : 8, enemy.boss ? 4 : (enemy.shape === 'circle' ? 6 : enemy.sides), -Math.PI / 2);
    ctx.fillStyle = enemy.flash ? '#f1aaa0' : '#fbdcd5';
    ctx.fill();
    if(enemy.restriction){
      if(enemy.restriction==='reflect'){ctx.fillStyle='#ffffff90';ctx.beginPath();ctx.ellipse(-r*.28,-r*.32,r*.3,r*.13,-.6,0,TAU);ctx.fill();ctx.strokeStyle='#e5fcff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*.8,.2,2.2);ctx.stroke();}
      else{ctx.strokeStyle='#e9edf2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r*.55,-r*.55);ctx.lineTo(r*.55,r*.55);ctx.moveTo(r*.55,-r*.55);ctx.lineTo(-r*.55,r*.55);ctx.stroke();for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){ctx.fillStyle='#536476';ctx.beginPath();ctx.arc(Math.cos(a)*r*.78,Math.sin(a)*r*.78,3,0,TAU);ctx.fill();}}
      ctx.fillStyle=enemy.restriction==='reflect'?'#2b7189':'#344653';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText(enemy.restriction==='reflect'?'反 ×':'貫 ×',0,4);
    }
    if(enemy.crossSkull||enemy.skullEffects?.length){
      ctx.save();ctx.translate(-r*.72,-r*.66);ctx.strokeStyle=enemy.crossSkull?'#8753a8':'#545b69';ctx.lineWidth=3;
      if(enemy.crossSkull){ctx.beginPath();ctx.moveTo(-11,-10);ctx.lineTo(11,10);ctx.moveTo(11,-10);ctx.lineTo(-11,10);ctx.stroke();}
      ctx.fillStyle=enemy.crossSkull?'#8753a8':'#545b69';ctx.beginPath();ctx.arc(0,-2,8,0,TAU);ctx.fill();ctx.fillRect(-5,3,10,7);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3,-2,2,0,TAU);ctx.arc(3,-2,2,0,TAU);ctx.fill();ctx.restore();
    }
    if(enemy.defenseMultiplier>1){ctx.font='bold 12px Arial';ctx.fillStyle='#9260b0';ctx.textAlign='center';ctx.fillText('↓ ×'+enemy.defenseMultiplier,r+16,0);}
    enemy.attacks.forEach((attack, i) => {
      const bx = (i - (enemy.attacks.length-1)/2) * 42;
      const by = -r - 10;
      ctx.beginPath(); ctx.arc(bx, by, 11, 0, TAU);
      ctx.fillStyle = attack.remaining <= 1 ? '#c65e55' : '#fff'; ctx.fill();
      ctx.strokeStyle = '#cf8478'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.font = '700 11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = attack.remaining <= 1 ? '#fff' : '#b3584d';
      ctx.fillText(String(Math.max(0, attack.remaining)), bx, by);
      ctx.font = '9px Arial'; ctx.fillStyle = '#a9675c';
      ctx.fillText(({ sniper: '狙撃', laser: '光線', homing: '追尾', explosion: '爆発', meteor: '隕石', spread: '拡散', mines:'地雷', photons:'光子',vibration:'振動',reflectLaser:'反射(2)',pierce:'貫通(3)',revive:'蘇生',effect:'効果',plusLaser:'十字',crossLaser:'クロス' })[attack.kind], bx, by-20);
    });
    if (enemy.weakPoint) {
      const w = weakPosition(enemy), wx=w.x-x, wy=w.y-y;
      ctx.beginPath(); ctx.arc(wx,wy,w.r+4,0,TAU); ctx.fillStyle='#fff8d6'; ctx.fill();
      ctx.strokeStyle='#e1b327';ctx.lineWidth=2;ctx.stroke();
      polygon(wx,wy,10,4);ctx.fillStyle='#dfaa19';ctx.fill();
      ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillStyle='#9a730b';
      ctx.fillText('×'+enemyWeakMultiplier(enemy),wx+29,wy+1);
    }
    ctx.textBaseline = 'alphabetic';
    if(enemy.species){ctx.font='bold 9px Arial';ctx.fillStyle=enemy.tint;ctx.textAlign='center';ctx.fillText(ENEMY_SPECIES[enemy.species]||enemy.species,0,r+30);}
    const barWidth = enemy.boss ? 122 : 50;
    const barY = r + 12;
    ctx.fillStyle = '#edd9d3';
    ctx.fillRect(-barWidth / 2, barY, barWidth, enemy.boss ? 5 : 3);
    ctx.fillStyle = '#d97d70';
    ctx.fillRect(-barWidth / 2, barY, barWidth * enemy.hp / enemy.maxHp, enemy.boss ? 5 : 3);
    ctx.restore();
  }

  const CHARACTER_OUTLINES={
    windmill:[[0,-1],[.25,-.3],[1,-.5],[.4,.2],[.8,.8],[0,.5],[-.5,1],[-.4,.1],[-1,-.4],[-.25,-.3]],
    spool:[[-.85,-1],[.85,-1],[.35,-.5],[.35,.5],[.85,1],[-.85,1],[-.35,.5],[-.35,-.5]],
chevron:[[-1,-.7],[-.35,-.7],[0,-.15],[.35,-.7],[1,-.7],[0,1]],
dodecagon:Array.from({length:12},(_,i)=>[Math.cos(-Math.PI/2+i*TAU/12),Math.sin(-Math.PI/2+i*TAU/12)]),
anvil:[[-1,-.75],[1,-.75],[.7,-.2],[.3,-.2],[.3,.55],[.75,.65],[.75,1],[-.75,1],[-.75,.65],[-.3,.55],[-.3,-.2],[-.7,-.2]],
dart:[[0,-1],[.95,.85],[0,.3],[-.95,.85]],
anchor:[[-.18,-1],[.18,-1],[.18,.3],[.58,.3],[.58,-.05],[1,.35],[.65,.85],[0,1],[-.65,.85],[-1,.35],[-.58,-.05],[-.58,.3],[-.18,.3]],
kite:[[0,-1],[.9,-.15],[.2,.45],[.55,1],[-.2,.75],[-.2,.45],[-.9,-.15]],
crown:[[-1,-0.8],[-0.45,-0.15],[0,-1],[0.45,-0.15],[1,-0.8],[0.7,0.85],[-0.7,0.85]],
satellite:[[-1,-0.7],[-0.4,-0.7],[-0.4,-0.25],[0.4,-0.25],[0.4,-0.7],[1,-0.7],[1,0.7],[0.4,0.7],[0.4,0.25],[-0.4,0.25],[-0.4,0.7],[-1,0.7]],
gear:[[1,0],[0.6279,0.16835],[0.866,0.5],[0.45955,0.45955],[0.5,0.866],[0.16835,0.6279],[0,1],[-0.16835,0.6279],[-0.5,0.866],[-0.45955,0.45955],[-0.866,0.5],[-0.6279,0.16835],[-1,0],[-0.6279,-0.16835],[-0.866,-0.5],[-0.45955,-0.45955],[-0.5,-0.866],[-0.16835,-0.6279],[0,-1],[0.16835,-0.6279],[0.5,-0.866],[0.45955,-0.45955],[0.866,-0.5],[0.6279,-0.16835]],
ribbon:[[-0.9,-1],[0.25,-1],[0.8,-0.25],[0.2,0.3],[0.9,1],[-0.25,1],[-0.8,0.25],[-0.2,-0.3]],
shield:[[-0.9,-0.8],[0,-1],[0.9,-0.8],[0.7,0.45],[0,1],[-0.7,0.45]],
shuriken:[[0,-1],[0.25,-0.25],[1,-0.5],[0.25,0.25],[0.5,1],[-0.25,0.25],[-1,0.5],[-0.25,-0.25]],
arrow:[[0,-1],[1,0],[0.35,0],[0.35,1],[-0.35,1],[-0.35,0],[-1,0]],
eye:[[0,-0.65],[0.65,-0.35],[1,0],[0.65,0.35],[0,0.65],[-0.65,0.35],[-1,0],[-0.65,-0.35]],
hourglass:[[-0.8,-1],[0.8,-1],[0.25,0],[0.8,1],[-0.8,1],[-0.25,0]],
crescent:[[0.55,-1],[-0.45,-0.8],[-0.9,-0.2],[-0.8,0.5],[-0.2,1],[0.7,0.9],[0.1,0.5],[-0.1,0],[0.1,-0.5]],
flame:[[0,-1],[0.25,-0.4],[0.55,-0.7],[0.9,0.2],[0.55,0.8],[0,1],[-0.6,0.7],[-0.85,0.1],[-0.4,-0.5],[-0.3,0.1]],
fan:[[0,1],[-1,-0.2],[-0.7,-0.8],[0,-1],[0.7,-0.8],[1,-0.2]],
bowtie:[[-1,-0.8],[0,-0.2],[1,-0.8],[1,0.8],[0,0.2],[-1,0.8]],
wing:[[-1,0.65],[-0.6,-0.65],[0,0.05],[0.6,-1],[1,-0.8],[0.6,0.35],[0,1]],
    star:[[0,-1],[.24,-.32],[.95,-.31],[.38,.12],[.59,.81],[0,.42],[-.59,.81],[-.38,.12],[-.95,-.31],[-.24,-.32]],
    cross:[[-.32,-1],[.32,-1],[.32,-.32],[1,-.32],[1,.32],[.32,.32],[.32,1],[-.32,1],[-.32,.32],[-1,.32],[-1,-.32],[-.32,-.32]],
    bolt:[[.1,-1],[-.85,.16],[-.1,.16],[-.4,1],[.85,-.25],[.1,-.25]],
    rosette:Array.from({length:24},(_,i)=>{const a=-Math.PI/2+i*Math.PI/12,r=i%4===0?1:i%2?.68:.8;return [Math.cos(a)*r,Math.sin(a)*r];}),
    spiral:[[-.85,-.7],[.5,-1],[1,-.35],[.8,.6],[0,1],[-.8,.5],[-1,-.1],[-.4,-.5],[.4,-.35],[.45,.25],[0,.5],[-.35,.2],[-.1,0],[.05,.15],[.2,.05],[.05,-.2],[-.35,-.2],[-.55,.1],[-.35,.5],[.2,.7],[.6,.35],[.7,-.25],[.35,-.65],[-.45,-.5]],
    saber:[[.65,-1],[.55,.2],[-.25,.7],[-.05,.95],[-.35,1],[-.6,.65],[-.9,.5],[-.7,.25],[-.45,.4],[.2,-.5]],
    fork:[[-.85,-1],[-.35,-1],[-.35,0],[.35,0],[.35,-1],[.85,-1],[.85,.4],[.25,.4],[.25,1],[-.25,1],[-.25,.4],[-.85,.4]],
    gem:[[-.7,-.9],[.45,-1],[1,-.1],[.4,.65],[-.2,1],[-1,.2]],
    sixstar:Array.from({length:12},(_,i)=>{const a=-Math.PI/2+i*Math.PI/6,r=i%2?.5:1;return [Math.cos(a)*r,Math.sin(a)*r];})
  };
  function characterOutline(shape,r){ctx.beginPath();CHARACTER_OUTLINES[shape].forEach(([x,y],i)=>{if(i)ctx.lineTo(x*r,y*r);else ctx.moveTo(x*r,y*r);});ctx.closePath();}
  function drawUnit(unit) {
    const isActive = unit.id === state.activeUnit;
    const idlePulse = (Math.sin(state.clock * 3) + 1) / 2;
    ctx.save();
    ctx.translate(unit.x, unit.y);
    if(inPowerArea(unit)){ctx.strokeStyle='#d2a335';ctx.lineWidth=3;polygon(0,0,33,6,state.clock*.25);ctx.stroke();ctx.fillStyle='#98701f';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText('POWER ×'+powerAreaMultiplier(unit),0,-42);}
    for(let i=0;i<(unit.photons||0);i++){const a=-Math.PI/2+i*TAU/4;ctx.fillStyle='#f5c84f';ctx.strokeStyle='#a58123';polygon(Math.cos(a)*43,Math.sin(a)*43,5,4);ctx.fill();ctx.stroke();}
    if(unit.boostTime>0){ctx.strokeStyle='#35bf86';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,32,0,TAU);ctx.stroke();}
    if (isActive) {
      ctx.beginPath(); ctx.arc(0, 0, 38 + idlePulse * 3, 0, TAU);
      ctx.fillStyle = `${unit.color}0d`; ctx.fill();
      ctx.strokeStyle = `${unit.color}35`; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 34, -Math.PI * 0.85 + state.clock * 0.3, Math.PI * 0.2 + state.clock * 0.3);
      ctx.strokeStyle = `${unit.color}80`; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 34, Math.PI * 0.15 + state.clock * 0.3, Math.PI * 1.2 + state.clock * 0.3); ctx.stroke();
      if (state.skillArmed || state.skillShot) {
        ctx.save(); ctx.rotate(state.clock * 0.45);
        polygon(0, 0, 46, 6); ctx.strokeStyle = `${unit.color}90`; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
      }
    }
    ctx.shadowColor = `${unit.color}30`;
    ctx.shadowBlur = isActive ? 17 : 9;
    ctx.shadowOffsetY = 4;
    ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = isActive ? unit.color : `${unit.color}75`; ctx.lineWidth = isActive ? 2 : 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU);
    ctx.fillStyle = `${unit.color}0e`; ctx.fill();
    ctx.fillStyle = unit.color;
    if(CHARACTER_OUTLINES[unit.shape]) characterOutline(unit.shape,18);
    else if(unit.shape==='pentagon')polygon(0,0,18,5);
    else if (unit.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); }
    else if (unit.shape === 'triangle') polygon(0, 1, 18, 3);
    else if (unit.shape === 'square') polygon(0, 0, 18, 4, -Math.PI / 4);
    else if (unit.shape === 'hexagon') polygon(0, 0, 18, 6);
    else if (unit.shape === 'octagon') polygon(0, 0, 18, 8, Math.PI/8);
    else polygon(0, 0, 18, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5;
    if(CHARACTER_OUTLINES[unit.shape]){characterOutline(unit.shape,10);ctx.stroke();}
    else if(unit.shape==='pentagon'){polygon(0,0,10,5);ctx.stroke();}
    else if (unit.shape === 'circle') { ctx.beginPath(); ctx.arc(-2, -2, 8, Math.PI, Math.PI * 1.7); ctx.stroke(); }
    else if (unit.shape === 'triangle') { polygon(0, 1, 10, 3); ctx.stroke(); }
    else if (unit.shape === 'square') { polygon(0, 0, 10, 4, -Math.PI / 4); ctx.stroke(); }
    else { polygon(0, 0, 10, unit.shape === 'hexagon' ? 6 : unit.shape === 'octagon' ? 8 : 4); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(20, 19, 8, 0, TAU);
    ctx.fillStyle = isActive ? unit.color : '#fff'; ctx.fill();
    ctx.strokeStyle = isActive ? '#fff' : `${unit.color}65`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = '700 8px "Space Grotesk", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = isActive ? '#fff' : unit.color; ctx.fillText(String(unit.id + 1), 20, 19.5);
    ctx.restore();
  }

  function drawAim() {
    const unit = state.units[state.activeUnit];
    const aim = state.aiming || (state.phase === 'ready' && state.keyboardAimUntil > state.clock ? {
      dx: Math.cos(state.keyboardAngle), dy: Math.sin(state.keyboardAngle), power: state.keyboardPower,
    } : null);
    if (!aim || aim.power < 0.025) return;
    const magnitude = Math.hypot(aim.dx, aim.dy);
    const dx = aim.dx / magnitude;
    const dy = aim.dy / magnitude;
    const points = predictTrajectory(unit, { x: dx, y: dy }, 180 + 400 * aim.power);
    ctx.save();
    ctx.strokeStyle = `${unit.color}8c`; ctx.lineWidth = 2.5; ctx.setLineDash([4, 9]); ctx.lineDashOffset = -state.clock * 24;
    ctx.beginPath(); points.forEach((point, i) => i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 1; i < points.length - 1; i++) {
      ctx.beginPath(); ctx.arc(points[i].x, points[i].y, 6, 0, TAU); ctx.strokeStyle = `${unit.color}90`; ctx.lineWidth = 1.5; ctx.stroke();
    }
    const arrowX = unit.x + dx * 72;
    const arrowY = unit.y + dy * 72;
    ctx.translate(arrowX, arrowY); ctx.rotate(Math.atan2(dy, dx));
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-7, -7); ctx.lineTo(-3, 0); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fillStyle = unit.color; ctx.fill();
    ctx.restore();
    const pullDistance = Math.min(100, aim.power * 100);
    const pullX = unit.x - dx * pullDistance;
    const pullY = unit.y - dy * pullDistance;
    ctx.save(); ctx.strokeStyle = `${unit.color}4d`; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(unit.x, unit.y); ctx.lineTo(pullX, pullY); ctx.stroke();
    ctx.beginPath(); ctx.arc(pullX, pullY, 8, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = unit.color; ctx.lineWidth = 2; ctx.stroke();
    const labelX = clamp(pullX, 86, WIDTH - 86);
    const labelY = clamp(pullY + 31, 92, HEIGHT - 64);
    ctx.font = '600 10px "Space Grotesk", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#697d8b';
    ctx.fillText(`POWER ${Math.round(aim.power * 100)}%`, labelX, labelY);
    ctx.restore();
  }

  function drawAttackEffect(effect) {
    if(EXPANSION_COMBOS.includes(effect.type)){drawExpansionFriendship(effect);return;}
    if(['machinegun','saw','drones','relation','vibration'].includes(effect.type)){
      const e=effect;ctx.save();ctx.fillStyle=e.color;ctx.strokeStyle=e.color;ctx.lineWidth=3;
      if(e.type==='machinegun'||e.type==='saw')for(const b of e.bullets){ctx.save();ctx.translate(b.x,b.y);if(e.type==='saw'){ctx.rotate(e.age*22);ctx.beginPath();for(let i=0;i<24;i++){const a=i*TAU/24,r=i%2?12:20;if(i)ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,6,0,TAU);ctx.fill();}else{ctx.beginPath();ctx.moveTo(-b.vx*.014,-b.vy*.014);ctx.lineTo(0,0);ctx.stroke();}ctx.restore();}
      else if(e.type==='drones')for(const d of e.drones){if(e.phase==='travel'){ctx.globalAlpha=.3;ctx.beginPath();d.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}ctx.globalAlpha=1;polygon(d.x,d.y,10,4,e.age*5);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(d.x,d.y,3,0,TAU);ctx.fill();ctx.fillStyle=e.color;}
      else if(e.type==='relation'){ctx.globalAlpha=.3;ctx.lineWidth=12;ctx.beginPath();e.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.globalAlpha=1;polygon(e.x,e.y,20,3,e.age*18);ctx.fill();}
      else {ctx.globalAlpha=Math.max(0,1-e.age*2);for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(e.x,e.y,e.radius*Math.min(1,e.age*3+i*.12),0,TAU);ctx.stroke();}}
      ctx.restore();return;
    }
    if(['pierce','roundBurst','dropBomb','eruption','thunder'].includes(effect.type)){
      const e=effect;ctx.save();ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.lineWidth=2;
      if(e.type==='pierce')for(const b of e.bullets){if(b.delay>0)continue;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);characterOutline('arrow',10);ctx.fill();ctx.restore();}
      else if(e.type==='roundBurst'){ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(e.x,e.y,e.radius,0,TAU);ctx.fill();ctx.globalAlpha=.7;ctx.setLineDash([7,5]);ctx.stroke();ctx.setLineDash([]);ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText('CHARGING',e.x,e.y-e.radius-8);}
      else if(e.type==='dropBomb')for(const b of e.bombs){if(b.delay>0)continue;const t=clamp(b.elapsed/.55,0,1),x=e.x+(b.x-e.x)*t,y=e.y+(b.y-e.y)*t-Math.sin(t*Math.PI)*140;ctx.globalAlpha=.4;ctx.beginPath();ctx.arc(b.x,b.y,18,0,TAU);ctx.stroke();ctx.globalAlpha=1;polygon(x,y,12,6);ctx.fill();ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+7,y-20);ctx.stroke();}
      else if(e.type==='eruption'){
        const t=e.age,fade=clamp((1.65-t)/.45,0,1),rise=clamp(t/.2,0,1);ctx.globalAlpha=fade;
        // Ground flash, expanding shock rings, seven turbulent jets, lava and smoke.
        const glow=ctx.createRadialGradient(e.x,e.y,4,e.x,e.y,e.radius);glow.addColorStop(0,'#fff4bddd');glow.addColorStop(.4,'#ff8d3388');glow.addColorStop(1,'#ff472000');ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(e.x,e.y,e.radius,e.radius*.5,0,0,TAU);ctx.fill();
        ctx.strokeStyle='#e87032';ctx.lineWidth=3;for(let i=0;i<3;i++){const r=((t*150+i*40)%e.radius);ctx.globalAlpha=fade*(1-r/e.radius);ctx.beginPath();ctx.ellipse(e.x,e.y,r,r*.38,0,0,TAU);ctx.stroke();}
        ctx.globalAlpha=fade;for(let i=0;i<7;i++){const x=e.x+(i-3)*15,h=(170+60*Math.sin(i*2.3+t*17))*rise,w=12+7*Math.sin(t*21+i);const g=ctx.createLinearGradient(x,e.y,x,e.y-h);g.addColorStop(0,'#fff4c5');g.addColorStop(.35,'#ffbf49');g.addColorStop(.75,'#f36a27');g.addColorStop(1,'#db442000');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-w,e.y);ctx.bezierCurveTo(x-35,e.y-h*.45,x+25*Math.sin(t*12+i),e.y-h*.8,x+Math.sin(i+t*10)*20,e.y-h);ctx.bezierCurveTo(x+32,e.y-h*.7,x+w,e.y-h*.3,x+w,e.y);ctx.closePath();ctx.fill();}
        for(let i=0;i<32;i++){const age=t-i*.008;if(age<0)continue;const vx=Math.sin(i*17.3)*(95+i*3),vy=-150-(i%7)*26,x=e.x+vx*age,y=e.y+vy*age+170*age*age;ctx.globalAlpha=fade*clamp(1-age/1.5,0,1);ctx.fillStyle=i%3?'#ff9f38':'#fff6c9';polygon(x,y,3+i%4,4,t*5+i);ctx.fill();}
        for(let i=0;i<8;i++){const age=Math.max(0,t-.15-i*.035);ctx.globalAlpha=fade*.16*clamp(age*3,0,1);ctx.fillStyle='#74666d';ctx.beginPath();ctx.arc(e.x+Math.sin(i*5)*55*(1+age),e.y-120-age*100,15+age*32,0,TAU);ctx.fill();}
      }
      else {ctx.globalAlpha=.09;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,e.radius,e.angle-Math.PI/3,e.angle+Math.PI/3);ctx.closePath();ctx.fill();ctx.globalAlpha=clamp((.95-e.age)*2,0,1);ctx.lineWidth=3;for(let i=0;i<11;i++){const a=e.angle-Math.PI/3+i*Math.PI/15;ctx.beginPath();ctx.moveTo(e.x,e.y);for(let j=1;j<=8;j++){const d=e.radius*j/8,wiggle=Math.sin(i*7+j*3+e.age*35)*9;ctx.lineTo(e.x+Math.cos(a)*d-Math.sin(a)*wiggle,e.y+Math.sin(a)*d+Math.cos(a)*wiggle);}ctx.stroke();}}
      ctx.restore();return;
    }
    if(effect.type==='reflectBeam'||effect.type==='plasma'){
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      const segments=effect.type==='plasma'?[{from:effect.source,to:effect.carrier}]:effect.segments;
      for(const seg of segments){
        const progress=effect.type==='plasma'?1:seg.progress;
        if(progress<=0)continue;
        const alpha=effect.type==='plasma'?.8:clamp(1-Math.max(0,effect.elapsed-seg.start-seg.duration)/.45,0,1);
        ctx.beginPath();ctx.moveTo(seg.from.x,seg.from.y);ctx.lineTo(seg.from.x+(seg.to.x-seg.from.x)*progress,seg.from.y+(seg.to.y-seg.from.y)*progress);
        ctx.strokeStyle=effect.color;ctx.globalAlpha=alpha*.22;ctx.lineWidth=effect.width+14;ctx.stroke();
        ctx.globalAlpha=alpha;ctx.lineWidth=effect.width;ctx.stroke();
        ctx.strokeStyle='#fff';ctx.globalAlpha=alpha*.9;ctx.lineWidth=effect.width*.25;ctx.stroke();
      }
      ctx.restore();return;
    }
    if(effect.type==='splitShot'||effect.type==='trident'){
      ctx.save();ctx.fillStyle=effect.color;ctx.strokeStyle=effect.color;ctx.lineWidth=effect.type==='trident'?7:3;
      for(const b of effect.bullets){ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(b.x-b.vx*.025,b.y-b.vy*.025);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);polygon(0,0,effect.type==='trident'?10:5,effect.type==='trident'?3:6);ctx.fill();ctx.restore();}ctx.restore();return;
    }
    if(effect.type==='energyBall'){
      ctx.save();ctx.strokeStyle=effect.color;ctx.fillStyle=effect.color;ctx.lineWidth=12;ctx.globalAlpha=.3;
      if(effect.trail.length){ctx.beginPath();ctx.moveTo(effect.trail[0].x,effect.trail[0].y);for(const p of effect.trail)ctx.lineTo(p.x,p.y);ctx.stroke();}
      ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(effect.x,effect.y,26,0,TAU);ctx.fill();ctx.globalAlpha=1;
      ctx.shadowColor=effect.color;ctx.shadowBlur=20;ctx.beginPath();ctx.arc(effect.x,effect.y,15,0,TAU);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(effect.x-3,effect.y-3,7,0,TAU);ctx.fill();ctx.restore();return;
    }
    if(effect.type==='meteor'){
      if(!effect.impact)return;
      const p=effect.impact,t=clamp(1-effect.wait/METEOR.fall,0,1);
      ctx.save();ctx.strokeStyle=effect.color;ctx.fillStyle=effect.color;
      ctx.globalAlpha=.4;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(p.x,p.y,38,0,TAU);ctx.stroke();ctx.setLineDash([]);
      const x=p.x+42*(1-t),y=p.y-160*(1-t);
      ctx.globalAlpha=.35;ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(x+21,y-72);ctx.lineTo(x,y);ctx.stroke();
      ctx.globalAlpha=1;polygon(x,y,METEOR.visualRadius,6);ctx.fill();ctx.fillStyle='#fff';polygon(x,y,10,4);ctx.fill();ctx.restore();return;
    }
    if(effect.type==='spread'){
      ctx.save();ctx.strokeStyle=effect.color;ctx.fillStyle=effect.color;ctx.lineWidth=2;
      for(const b of effect.bullets){ctx.globalAlpha=.3;ctx.beginPath();ctx.moveTo(b.x-b.vx*.025,b.y-b.vy*.025);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(b.x,b.y,4.5,0,TAU);ctx.fill();}
      ctx.restore();return;
    }
    ctx.save();
    if (effect.type === 'laser') {
      const charging = effect.hitsLeft === effect.hits;
      ctx.lineCap = 'round';
      ctx.strokeStyle = effect.color;
      ctx.beginPath(); ctx.moveTo(effect.x, effect.y); ctx.lineTo(effect.ex, effect.ey);
      if (charging) {
        ctx.globalAlpha = 0.4 + Math.sin(effect.age * 40) * 0.12;
        ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]); ctx.stroke();
      } else {
        ctx.globalAlpha = 0.28 + effect.flash * 0.72;
        ctx.shadowColor = effect.color; ctx.shadowBlur = 16;
        ctx.lineWidth = effect.width * (0.45 + 0.55 * effect.flash); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = effect.width * 0.3 * (0.4 + 0.6 * effect.flash); ctx.stroke();
      }
    } else if (effect.type === 'homing') {
      if (effect.delay <= 0) {
        for (let i = 1; i < effect.trail.length; i++) {
          ctx.globalAlpha = i / effect.trail.length * 0.5;
          ctx.strokeStyle = effect.color; ctx.lineWidth = 2 + i * 0.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(effect.trail[i - 1].x, effect.trail[i - 1].y); ctx.lineTo(effect.trail[i].x, effect.trail[i].y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowColor = effect.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(effect.x, effect.y, 6, 0, TAU); ctx.fillStyle = effect.color; ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(effect.x, effect.y, 2.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
      }
    } else if (effect.type === 'explosion') {
      const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.radius);
      gradient.addColorStop(0, `${effect.color}`);
      gradient.addColorStop(1, `${effect.color}00`);
      ctx.globalAlpha = 0.08 + effect.pulse * 0.34;
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.3 + effect.pulse * 0.5;
      ctx.strokeStyle = effect.color; ctx.lineWidth = 1.5 + effect.pulse * 2; ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (0.92 + 0.08 * effect.pulse), 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawEffects() {
    if (state.trail.length > 1) {
      const unit = state.units[state.activeUnit];
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < state.trail.length; i++) {
        const prev = state.trail[i - 1];
        const current = state.trail[i];
        ctx.globalAlpha = current.life / current.max * 0.3;
        ctx.strokeStyle = unit.color;
        ctx.lineWidth = 8 + 9 * current.life / current.max;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(current.x, current.y); ctx.stroke();
      }
      ctx.restore();
    }
    for (const beam of state.beams) {
      ctx.save(); ctx.globalAlpha = beam.life / beam.max;
      ctx.shadowColor = beam.color; ctx.shadowBlur = 10;
      ctx.lineWidth = beam.width ?? 4; ctx.strokeStyle = beam.color;
      ctx.beginPath(); ctx.moveTo(beam.x1, beam.y1); ctx.lineTo(beam.x2, beam.y2); ctx.stroke();
      ctx.lineWidth = beam.coreWidth ?? 1.5; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
    }
    state.effects.forEach(drawAttackEffect);
    for (const ripple of state.rings) {
      const progress = 1 - ripple.life / ripple.max;
      ctx.save(); ctx.globalAlpha = (1 - progress) * 0.65; ctx.strokeStyle = ripple.color; ctx.lineWidth = 2 * (1 - progress) + 0.5;
      ctx.beginPath(); ctx.arc(ripple.x, ripple.y, 15 + ripple.radius * progress, 0, TAU); ctx.stroke(); ctx.restore();
    }
    for (const particle of state.particles) {
      ctx.save(); ctx.globalAlpha = particle.life / particle.max;
      ctx.translate(particle.x, particle.y); ctx.rotate(particle.rotation); ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size); ctx.restore();
    }
  }

  function drawFloatingLabels() {
    for (const label of state.floats) {
      ctx.save(); ctx.globalAlpha = Math.min(1, label.life * 3);
      ctx.font = `700 ${label.size}px "Space Grotesk", "Arial", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4;
      ctx.strokeText(label.text, label.x, label.y);
      ctx.fillStyle = label.color; ctx.fillText(label.text, label.x, label.y); ctx.restore();
    }
  }

  function drawHUD() {
    if (state.combo >= 2 && state.comboTime > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, state.comboTime * 2);
      ctx.textAlign = 'right'; ctx.fillStyle = '#263e4e';
      ctx.font = '700 36px "Space Grotesk", Arial, sans-serif'; ctx.fillText(String(state.combo).padStart(2, '0'), 565, 106);
      ctx.font = '600 10px "Space Grotesk", Arial, sans-serif'; ctx.fillStyle = '#8496a3'; ctx.fillText('HIT COMBO', 565, 124); ctx.restore();
    }
    if (state.intro && ['ready', 'aiming'].includes(state.phase) && !state.aiming) {
      const unit = state.units[state.activeUnit];
      const y = unit.y + 56;
      ctx.save(); ctx.globalAlpha = 0.68 + Math.sin(state.clock * 3) * 0.12;
      ctx.strokeStyle = '#72a9bb'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(unit.x, y - 14); ctx.lineTo(unit.x, y + 23); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(unit.x - 4, y + 19); ctx.lineTo(unit.x, y + 24); ctx.lineTo(unit.x + 4, y + 19); ctx.stroke();
      ctx.font = '500 11px "Noto Sans JP", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#6a8e9d'; ctx.fillText('ひっぱって、はなす', unit.x, Math.min(y + 44, FIELD.bottom - 8)); ctx.restore();
    }
    if (state.notice) {
      const notice = state.notice;
      const elapsed = notice.max - notice.remaining;
      const alpha = Math.min(1, elapsed * 5, notice.remaining * 2.5);
      const y = state.phase === 'wave' || state.phase === 'victory' ? 355 : 455;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(247,249,251,0.9)';
      ctx.fillRect(148, y - 32, 324, 76);
      ctx.textAlign = 'center'; ctx.fillStyle = '#314a5a';
      ctx.font = '600 23px "Space Grotesk", Arial, sans-serif'; ctx.fillText(notice.title, 310, y);
      ctx.font = '400 11px "Noto Sans JP", sans-serif'; ctx.fillStyle = '#8b9ba6'; ctx.fillText(notice.sub, 310, y + 23); ctx.restore();
    }
    if (state.phase === 'enemy') {
      ctx.save(); ctx.textAlign = 'center'; ctx.font = '600 10px "Space Grotesk", Arial, sans-serif'; ctx.fillStyle = '#c8847a'; ctx.fillText('ENEMY TURN', 310, 667); ctx.restore();
    }
  }

  function render() {
    const scaleX = canvas.width / WIDTH;
    const scaleY = canvas.height / HEIGHT;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    drawGimmicks();
    ctx.save();
    if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    drawAim();
    state.enemies.forEach(drawEnemy);
    if(state.retreatGhost){const g=state.retreatGhost,t=g.age/1.1;ctx.save();ctx.globalAlpha=Math.max(0,1-t);ctx.translate(g.x,g.y-t*170);polygon(0,0,g.r*(1-t*.25),g.sides||8,t*2);ctx.fillStyle=g.tint||'#95aaa8';ctx.fill();ctx.fillStyle='#5e7e86';ctx.textAlign='center';ctx.font='bold 13px Arial';ctx.fillText('RETREAT',0,g.r+20);ctx.restore();}
    drawEffects();
    state.units.filter(unit => unit.id !== state.activeUnit).forEach(drawUnit);
    drawUnit(state.units[state.activeUnit]);
    drawFloatingLabels();
    ctx.restore();
    if (state.skillFlash > 0) { ctx.fillStyle = `rgba(204,245,247,${state.skillFlash * 0.23})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
    drawHUD();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.round((bounds.width || WIDTH) * dpr);
    canvas.height = Math.round((bounds.height || HEIGHT) * dpr);
    render();
  }

  function frame(timestamp) {
    const dt = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.035) : 0;
    previousTime = timestamp;
    if (screen === 'battle') {
      update(dt);
      render();
    }
    requestAnimationFrame(frame);
  }
