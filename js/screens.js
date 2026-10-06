'use strict';
// タイトル・編成・ステージ選択画面
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。
  // ---------------------------------------------------------------------------
  // SCREENS: title / formation / stage select / battle
  // ---------------------------------------------------------------------------
  const SCREEN_NAMES = ['title', 'formation', 'stage', 'battle'];

  function showScreen(name, options = {}) {
    if (!SCREEN_NAMES.includes(name)) return;
    if (screen === 'battle' && name !== 'battle') cancelAim();
    screen = name;
    SCREEN_NAMES.forEach(n => { const el = $(`screen-${n}`); if (el) el.hidden = n !== name; });
    document.body.dataset.screen = name;
    if (name === 'formation') renderFormation();
    if (name === 'stage') renderStageSelect();
    if (name === 'battle') resize();
    if (options.focus !== false) {
      const target = { title: $('title-start'), formation: $('formation-heading'), stage: $('stage-heading'), battle: canvas }[name];
      if (target) target.focus({ preventScroll: true });
    }
    if (options.scroll !== false) window.scrollTo(0, 0);
  }

  function startBattle(stageId) {
    currentStage = STAGE_BY_ID[stageId] || STAGES[0];
    selectedStageId = currentStage.id;
    previousTime = 0;
    resetGame();
    showScreen('battle', { focus: false });
    canvas.focus({ preventScroll: true });
  }

  function leaveBattle(destination = 'stage') {
    cancelAim();
    hideOverlay();
    showScreen(destination);
  }

  // Re-render a screen but keep keyboard focus on the same control.
  const FOCUS_KEYS = [['inspect', 'data-inspect'], ['toggle', 'data-toggle'], ['detailToggle', 'data-detail-toggle'], ['move', 'data-move'], ['remove', 'data-remove'], ['stage', 'data-stage']];
  function rerenderKeepingFocus(root, render) {
    const active = document.activeElement;
    let selector = null;
    if (active && root.contains(active)) {
      for (const [key, attr] of FOCUS_KEYS) {
        if (active.dataset[key] !== undefined) {
          selector = `[${attr}="${active.dataset[key]}"]` + (key === 'move' ? `[data-dir="${active.dataset.dir}"]` : '');
          break;
        }
      }
    }
    render();
    if (selector) {
      const next = root.querySelector(selector);
      if (next && !next.disabled) next.focus({ preventScroll: true });
    }
  }

  const teamHp = ids => ids.reduce((sum, id) => sum + CHAR_BY_ID[id].hp, 0);

  function statRow(label, value, max) {
    return `<div class="stat-row"><dt>${label}</dt><dd><span class="stat-value">${fmt(value)}</span><span class="stat-bar"><i style="width:${Math.min(100, Math.round(value / max * 100))}%"></i></span></dd></div>`;
  }

  function setFormationNote(message) {
    setText('formation-note', message || '');
  }

  const rosterFilters={shot:'',ability:'',friendship:''};
  function filteredCharacters(){return CHARACTERS.filter(c=>(!rosterFilters.shot||c.shotType===rosterFilters.shot)&&(!rosterFilters.ability||c.abilities.includes(rosterFilters.ability))&&(!rosterFilters.friendship||[c.friendship,c.secondary].some(f=>f?.kind===rosterFilters.friendship)));}
  $('filter-ability').innerHTML+=[...new Set(CHARACTERS.flatMap(c=>c.abilities))].sort((a,b)=>ABILITIES[a][0].localeCompare(ABILITIES[b][0],'ja')).map(id=>'<option value="'+id+'">'+ABILITIES[id][0]+'</option>').join('');
  $('filter-friendship').innerHTML+=[...new Set(CHARACTERS.flatMap(c=>[c.friendship.kind,c.secondary.kind]))].sort((a,b)=>FRIENDSHIP_KINDS[a].name.localeCompare(FRIENDSHIP_KINDS[b].name,'ja')).map(id=>'<option value="'+id+'">'+FRIENDSHIP_KINDS[id].name+'</option>').join('');
  for(const key of ['shot','ability','friendship'])$('filter-'+key).addEventListener('change',event=>{
    rosterFilters[key]=event.target.value;const matches=filteredCharacters();if(matches.length&&!matches.some(c=>c.id===selectedCharId))selectedCharId=matches[0].id;renderFormation();
  });
  $('filter-reset').addEventListener('click',()=>{for(const key of Object.keys(rosterFilters)){rosterFilters[key]='';$('filter-'+key).value='';}renderFormation();});
  function renderFormation() {
    if (!selectedCharId || !CHAR_BY_ID[selectedCharId]) selectedCharId = team[0];
    setText('formation-count', `${team.length} / ${MAX_TEAM}`);
    setText('formation-hp', fmt(teamHp(team)));
    const confirm = $('formation-confirm');
    if (confirm) confirm.disabled = team.length < 1;

    $('team-slots').innerHTML = Array.from({ length: MAX_TEAM }, (_, i) => {
      const id = team[i];
      if (!id) return `<li class="team-slot is-empty"><span class="slot-order">${i + 1}</span><span class="slot-empty">空き</span></li>`;
      const c = CHAR_BY_ID[id];
      return `<li class="team-slot${id === selectedCharId ? ' is-selected' : ''}" style="${colorVars(c.color)}">
        <button type="button" class="slot-body" data-inspect="${id}" aria-label="${c.name}のステータスを見る（${i + 1}番手）">
          <span class="slot-order">${i + 1}</span><span class="slot-avatar">${shapeHTML(c)}</span>
          <span class="slot-name">${c.name}<small>${c.kana}</small></span>
        </button>
        <span class="slot-tools">
          <button type="button" data-move="${i}" data-dir="-1" aria-label="${c.name}を前に出す"${i === 0 ? ' disabled' : ''}>◀</button>
          <button type="button" data-move="${i}" data-dir="1" aria-label="${c.name}を後ろに下げる"${i === team.length - 1 ? ' disabled' : ''}>▶</button>
          <button type="button" data-remove="${id}" aria-label="${c.name}を編成から外す"${team.length <= 1 ? ' disabled' : ''}>×</button>
        </span></li>`;
    }).join('');

    const matches=filteredCharacters();setText('filter-count',matches.length+' / '+CHARACTERS.length+'体');
    $('roster').innerHTML = matches.map(c => {
      const inTeam = team.includes(c.id);
      const full = !inTeam && team.length >= MAX_TEAM;
      return `<div class="roster-card${inTeam ? ' in-team' : ''}${c.id === selectedCharId ? ' is-selected' : ''}" style="${colorVars(c.color)}">
        <button type="button" class="roster-main" data-inspect="${c.id}" aria-label="${c.name}のステータスを見る">
          <span class="roster-avatar">${shapeHTML(c)}</span>
          <span class="roster-name">${c.name}<small>${c.kana}</small></span>
          <span class="roster-meta">${c.type}</span>
          <span class="roster-abilities">${abilityNames(c)}</span>
          <span class="roster-friend">主：${friendshipTitle(c.friendship)}<br>副：${friendshipTitle(c.secondary)}</span>
        </button>
        <button type="button" class="roster-toggle" data-toggle="${c.id}"${full ? ' disabled' : ''}${inTeam && team.length <= 1 ? ' disabled' : ''}>${inTeam ? '外す' : full ? '満員' : '加える'}</button>
      </div>`;
    }).join('');

    if(!matches.length)$('roster').innerHTML='<p class="roster-empty">条件に合うキャラクターがいません。絞り込み条件を変更してください。</p>';
    const c = CHAR_BY_ID[selectedCharId];
    const f = c.friendship;
    const inTeam = team.includes(c.id);
    const full = !inTeam && team.length >= MAX_TEAM;
    const lastOne = inTeam && team.length <= 1;
    const detail = $('char-detail');
    detail.setAttribute('style', colorVars(c.color));
    detail.innerHTML = `
      <div class="detail-head"><span class="detail-avatar">${shapeHTML(c, 'big')}</span>
        <div><p class="eyebrow">STATUS</p><h3>${c.name}<small>${c.kana}</small></h3><p class="detail-type">${c.type}</p></div></div>
      <p class="style-ability">${BATTLE_STYLES[c.battleStyle]}<br>${isPiercing(c)?'敵を貫通して移動。':'敵に当たると反射。'} 敵接触後の速度：${Math.round(enemyHitRetention(c)*100)}%。</p><div class="ability-box">${c.abilities.map(id=>'<p><strong>'+ABILITIES[id][0]+'</strong><br>'+ABILITIES[id][1]+'</p>').join('')}</div>
      <dl class="stat-list">${statRow('HP', c.hp, 5000)}${statRow('攻撃', c.atk, 1500)}${statRow('スピード', c.speed, 300)}</dl>
      <div class="friend-box"><p class="friend-label">友情コンボ</p><p class="friend-name">${friendshipTitle(f)}</p><p class="friend-desc">${FRIENDSHIP_KINDS[f.kind].describe(f)}</p></div>
      <div class="friend-box"><p class="friend-label">副友情コンボ</p><p class="friend-name">${friendshipTitle(c.secondary)}</p><p class="friend-desc">${FRIENDSHIP_KINDS[c.secondary.kind].describe(c.secondary)}</p></div>
      <button type="button" class="${inTeam ? 'outline-button' : 'primary-button'} wide-button" data-detail-toggle="${c.id}"${full || lastOne ? ' disabled' : ''}>${inTeam ? '編成から外す' : full ? '編成がいっぱいです' : '編成に加える'}</button>`;
  }

  function toggleMember(id) {
    const index = team.indexOf(id);
    if (index >= 0) {
      if (team.length <= 1) { setFormationNote('編成には最低1体が必要です。'); return; }
      team.splice(index, 1);
    } else {
      if (team.length >= MAX_TEAM) { setFormationNote(`編成は最大${MAX_TEAM}体までです。`); return; }
      team.push(id);
    }
    setFormationNote('');
    saveTeam();
  }

  function moveMember(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= team.length) return;
    [team[index], team[target]] = [team[target], team[index]];
    saveTeam();
  }

  function confirmFormation() {
    saveTeam();
    setFormationNote('');
    showScreen(formationReturn);
  }

  const formationScreen = $('screen-formation');
  if (formationScreen) {
    formationScreen.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.disabled || !formationScreen.contains(button)) return;
      rerenderKeepingFocus(formationScreen, () => {
        if (button.dataset.inspect) selectedCharId = button.dataset.inspect;
        else if (button.dataset.toggle) { selectedCharId = button.dataset.toggle; toggleMember(button.dataset.toggle); }
        else if (button.dataset.detailToggle) toggleMember(button.dataset.detailToggle);
        else if (button.dataset.move !== undefined) moveMember(Number(button.dataset.move), Number(button.dataset.dir));
        else if (button.dataset.remove) toggleMember(button.dataset.remove);
        else return;
        renderFormation();
      });
    });
  }
  if ($('formation-confirm')) $('formation-confirm').addEventListener('click', confirmFormation);

  const chapterSelections={};
  function selectChapter(chapter,focus=false){
    chapterSelections[selectedStageId.split('-')[0]]=selectedStageId;
    selectedStageId=chapterSelections[chapter]||STAGES.find(s=>s.id.split('-')[0]===chapter).id;
    renderStageSelect();if(focus)$('chapter-tab-'+chapter).focus();
  }
  function renderStageSelect() {
    if (!STAGE_BY_ID[selectedStageId]) selectedStageId = STAGES[0].id;
    const chapter=selectedStageId.split('-')[0];
    const chapters=[...new Set(STAGES.map(s=>s.id.split('-')[0]))];
    $('chapter-tabs').innerHTML=chapters.map(id=>'<button type="button" role="tab" id="chapter-tab-'+id+'" data-chapter="'+id+'" aria-controls="stage-panel" aria-selected="'+(id===chapter)+'" tabindex="'+(id===chapter?0:-1)+'">第'+id+'章</button>').join('');
    $('stage-panel').setAttribute('aria-labelledby','chapter-tab-'+chapter);
    const bossOf = stage => stage.waves.some(w => w.enemies.some(e => e.boss));
    $('stage-list').innerHTML = STAGES.filter(s=>s.id.split('-')[0]===chapter).map(stage => {
      const selected = stage.id === selectedStageId;
      const bestScore = loadBest(stage.id);
      return `<button type="button" class="stage-card${selected ? ' is-selected' : ''}" role="listitem" data-stage="${stage.id}" aria-pressed="${selected}">
        <span class="stage-number">${stage.id}</span>
        <span class="stage-body"><strong>STAGE ${stage.id}</strong><span class="stage-name">${stage.name}</span>
        <small>${stage.waves.length}ウェーブ${bossOf(stage) ? '・ボスあり' : ''}</small></span>
        <span class="stage-best"><small>BEST</small>${String(bestScore).padStart(6, '0')}</span></button>`;
    }).join('') + '<div class="stage-card is-coming" role="listitem"><span class="stage-number">…</span><span class="stage-body"><span class="stage-name">次のステージは準備中です</span></span></div>';

    const stage = STAGE_BY_ID[selectedStageId];
    $('stage-detail').innerHTML = `<div class="section-label"><h3>STAGE ${stage.id}</h3><span class="tag">${stage.waves.length} WAVES</span></div>
      <p class="stage-detail-name">${stage.name}</p><p class="style-ability stage-gimmicks">${stageGimmickNames(stage).join('・')||'ギミックなし'}</p>
      <ol class="stage-waves">${stage.waves.map((w, i) => `<li><span>${pad2(i + 1)}</span>${w.name}${w.bossPhase ? '<em>BOSS '+w.bossPhase+'/2</em>' : w.enemies.some(e => e.boss) ? '<em>BOSS</em>' : ''}</li>`).join('')}</ol>`;

    $('stage-team').innerHTML = team.map(id => { const c = CHAR_BY_ID[id]; return `<span class="stage-team-member" style="${colorVars(c.color)}" title="${c.name}"><span class="roster-avatar">${shapeHTML(c)}</span><span>${c.name}</span></span>`; }).join('');
    setText('stage-team-hp', `HP ${fmt(teamHp(team))}`);
  }

  $('chapter-tabs').addEventListener('click',event=>{const tab=event.target.closest('[data-chapter]');if(tab)selectChapter(tab.dataset.chapter,true);});
  $('chapter-tabs').addEventListener('keydown',event=>{const tabs=[...$('chapter-tabs').querySelectorAll('[data-chapter]')],i=tabs.indexOf(event.target);if(i<0)return;let n=i;if(event.key==='ArrowRight')n=(i+1)%tabs.length;else if(event.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')n=0;else if(event.key==='End')n=tabs.length-1;else return;event.preventDefault();selectChapter(tabs[n].dataset.chapter,true);});
  const stageList = $('stage-list');
  if (stageList) {
    stageList.addEventListener('click', event => {
      const card = event.target.closest('[data-stage]');
      if (!card) return;
      rerenderKeepingFocus(stageList, () => { selectedStageId = card.dataset.stage; renderStageSelect(); });
    });
  }
  if ($('stage-start')) $('stage-start').addEventListener('click', () => { unlockAudio(); startBattle(selectedStageId); });
  if ($('stage-formation')) $('stage-formation').addEventListener('click', () => { formationReturn = 'stage'; showScreen('formation'); });
  if ($('stage-back')) $('stage-back').addEventListener('click', () => showScreen('title'));
  if ($('title-start')) $('title-start').addEventListener('click', () => { unlockAudio(); showScreen('stage'); });
  if ($('title-formation')) $('title-formation').addEventListener('click', () => { formationReturn = 'title'; showScreen('formation'); });
