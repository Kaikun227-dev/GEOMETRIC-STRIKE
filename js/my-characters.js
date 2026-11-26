'use strict';
const MY_CHARACTER_IDS=['mychar1','mychar2','mychar3','mychar4'];
const MY_ABILITY_GROUPS={
  1:['adw','agb','aw','ms','ab'],4:['antiWind','heal','regen'],
  5:['asw','dash','drain'],6:['fk','gk','pm'],
  7:['sadw','sagb','saw','sms','santiWind','sasw'],8:['dashM','fb','wb','pa'],
  9:['adl','sadl','pk','ek'],10:['bubblyMode','double','fbM']
};
const MY_ABILITY_CHAPTER=Object.fromEntries(Object.entries(MY_ABILITY_GROUPS).flatMap(([chapter,ids])=>ids.map(id=>[id,Number(chapter)])));
const MY_STYLES={balance:'バランス',speed:'スピード',power:'パワー',artillery:'砲撃'};
const MY_CHARACTER_KEY='geometric-my-characters-v1';
const MY_COLORS=['#519daf','#bb7aab','#77a866','#dca355'];
const defaultMyConfig=(id='mychar1')=>({name:'マイキャラ'+(MY_CHARACTER_IDS.indexOf(id)+1),color:MY_COLORS[MY_CHARACTER_IDS.indexOf(id)],mainFragment:'',subFragment:'',shotType:'reflect',battleStyle:'balance',abilities:[]});
let myCharacterConfigs=Object.fromEntries(MY_CHARACTER_IDS.map(id=>[id,defaultMyConfig(id)]));
for(const [i,id] of MY_CHARACTER_IDS.entries()){
  const c={id,name:'MY CHARACTER '+(i+1),kana:'マイキャラ'+(i+1),shape:['hexagon','star','circle','triangle'][i],color:['#519daf','#bb7aab','#77a866','#dca355'][i],type:'反射 / バランス',hp:4400,atk:1200,speed:340,shotType:'reflect',battleStyle:'balance',abilities:[],friendship:{kind:'pierce',power:300,count:4},secondary:{kind:'homing',power:180,count:4}};
  CHARACTERS.push(c);CHAR_BY_ID[id]=c;
}
function applyMyConfigs(){
  for(const id of MY_CHARACTER_IDS){const config=myCharacterConfigs[id];Object.assign(CHAR_BY_ID[id],config,{kana:config.name,friendship:config.mainFragment?{...FRAGMENT_BY_ID[config.mainFragment].combo}:{kind:'pierce',power:300,count:4},secondary:config.subFragment?{...FRAGMENT_BY_ID[config.subFragment].combo}:{kind:'homing',power:180,count:4},abilities:[...config.abilities],type:(config.shotType==='pierce'?'貫通':'反射')+' / '+MY_STYLES[config.battleStyle]});}
}
function fragmentUsedBy(fragment,idToSkip=null){
  if(!fragment)return null;
  return MY_CHARACTER_IDS.find(id=>id!==idToSkip&&['mainFragment','subFragment'].some(slot=>myCharacterConfigs[id][slot]===fragment));
}
function loadMyCharacters(){
  let saved={};try{saved=JSON.parse(localStorage.getItem(MY_CHARACTER_KEY))||{};}catch{}
  const used=new Set(),usedFragments=new Set();
  for(const id of MY_CHARACTER_IDS){
    const raw=saved[id],config=defaultMyConfig(id);
    if(raw&&isCharacterUnlocked(id)){
      if(typeof raw.name==='string'&&raw.name.trim()&&[...raw.name.trim()].length<=20)config.name=raw.name.trim();
      if(typeof raw.color==='string'&&/^#[0-9a-f]{6}$/i.test(raw.color))config.color=raw.color;
      for(const slot of ['mainFragment','subFragment'])if(ownedFragments.includes(raw[slot])&&!usedFragments.has(raw[slot])){config[slot]=raw[slot];usedFragments.add(raw[slot]);}
      if(['reflect','pierce'].includes(raw.shotType))config.shotType=raw.shotType;
      if(Object.hasOwn(MY_STYLES,raw.battleStyle))config.battleStyle=raw.battleStyle;
      for(const ability of Array.isArray(raw.abilities)?raw.abilities:[]){
        if(config.abilities.length>=5)break;
        if(Object.hasOwn(MY_ABILITY_CHAPTER,ability)&&isChapterUnlocked(MY_ABILITY_CHAPTER[ability])&&!used.has(ability)){config.abilities.push(ability);used.add(ability);}
      }
    }
    myCharacterConfigs[id]=config;
  }applyMyConfigs();
}
function saveMyCharacter(id,config){
  if(!MY_CHARACTER_IDS.includes(id)||!isCharacterUnlocked(id))return 'このマイキャラは未入手です。';
  config={...myCharacterConfigs[id],...config};
  if(typeof config.name!=='string'||!config.name.trim()||[...config.name.trim()].length>20)return '名前は1〜20文字で入力してください。';
  config.name=config.name.trim();
  if(typeof config.color!=='string'||!/^#[0-9a-f]{6}$/i.test(config.color))return '有効なカラーを選択してください。';
  if(config.mainFragment&&config.mainFragment===config.subFragment)return '同じ欠片を主・副友情に重複使用できません。';
  for(const slot of ['mainFragment','subFragment'])if(config[slot]&&(!ownedFragments.includes(config[slot])||fragmentUsedBy(config[slot],id)))return '未入手、または他のマイキャラが使用中の欠片です。';
  if(!['reflect','pierce'].includes(config.shotType)||!Object.hasOwn(MY_STYLES,config.battleStyle))return '撃種・戦型を選択してください。';
  if(!Array.isArray(config.abilities)||config.abilities.length>5||new Set(config.abilities).size!==config.abilities.length)return 'アビリティは重複なしで5つまでです。';
  for(const ability of config.abilities){
    if(!Object.hasOwn(MY_ABILITY_CHAPTER,ability)||!isChapterUnlocked(MY_ABILITY_CHAPTER[ability]))return '未解放のアビリティが含まれています。';
    if(MY_CHARACTER_IDS.some(other=>other!==id&&myCharacterConfigs[other].abilities.includes(ability)))return ABILITIES[ability][0]+'は他のマイキャラが使用中です。';
  }
  const next={...myCharacterConfigs,[id]:{name:config.name,color:config.color,mainFragment:config.mainFragment,subFragment:config.subFragment,shotType:config.shotType,battleStyle:config.battleStyle,abilities:[...config.abilities]}};
  try{localStorage.setItem(MY_CHARACTER_KEY,JSON.stringify(next));}catch{return '保存できませんでした。設定は変更していません。';}
  myCharacterConfigs=next;applyMyConfigs();return '';
}


// ===========================================================================
// Dedicated editor: rendering, selection and form events
// ===========================================================================
let selectedMyCharacter=MY_CHARACTER_IDS[0],myCharactersReturn='formation';
function renderMyCharacters(){
  const id=selectedMyCharacter,c=CHAR_BY_ID[id],config=myCharacterConfigs[id],unlocked=isCharacterUnlocked(id);
  $('mycharacters-tabs').innerHTML=MY_CHARACTER_IDS.map(key=>`<button type="button" class="outline-button" data-my-character="${key}" aria-pressed="${key===id}">${escapeHTML(CHAR_BY_ID[key].kana)} ／ ${isCharacterUnlocked(key)?'入手済み':CHARACTER_UNLOCKS[key]+'で入手'}</button>`).join('');
  const usedBy=ability=>MY_CHARACTER_IDS.find(key=>key!==id&&myCharacterConfigs[key].abilities.includes(ability));
  $('mycharacters-editor').innerHTML=`<form id="mycharacters-form"><h3>${escapeHTML(c.kana)}</h3><p>${unlocked?'入手済み':CHARACTER_UNLOCKS[id]+'をクリアすると編集・編成できます。'}</p>
    <fieldset ${unlocked?'':'disabled'}><legend>名前・カラー</legend><div class="mycharacters-types"><label>名前（20文字まで）<input name="characterName" maxlength="40" value="${escapeHTML(config.name)}" required></label><label>カラー<input name="characterColor" type="color" value="${config.color}"></label></div></fieldset>
    <fieldset ${unlocked?'':'disabled'}><legend>撃種・戦型</legend><div class="mycharacters-types"><label>撃種<select name="shotType">${Object.entries({reflect:'反射',pierce:'貫通'}).map(([value,label])=>`<option value="${value}" ${value===config.shotType?'selected':''}>${label}</option>`).join('')}</select></label><label>戦型<select name="battleStyle">${Object.entries(MY_STYLES).map(([value,label])=>`<option value="${value}" ${value===config.battleStyle?'selected':''}>${label}</option>`).join('')}</select></label></div></fieldset>
    <p>HP ${c.hp} ／ 攻撃 ${c.atk} ／ スピード ${c.speed}</p>${myFragmentEditor(id,unlocked)}
    <h4>アビリティ <span id="mycharacters-count">${config.abilities.length} / 5</span></h4>
    ${Object.entries(MY_ABILITY_GROUPS).map(([chapter,abilities])=>`<fieldset ${unlocked&&isChapterUnlocked(chapter)?'':'disabled'}><legend>${chapter==='1'?'初期から選択可能':'第'+chapter+'章解放後'}${isChapterUnlocked(chapter)?'':' ／ 未解放'}</legend><div class="mycharacters-abilities">${abilities.map(ability=>{const other=usedBy(ability);return `<label title="${ABILITIES[ability][1]}"><input type="checkbox" name="ability" value="${ability}" ${config.abilities.includes(ability)?'checked':''} ${other?'disabled':''}><span>${ABILITIES[ability][0]}${other?'<small>'+escapeHTML(CHAR_BY_ID[other].kana)+'が使用中</small>':''}</span></label>`;}).join('')}</div></fieldset>`).join('')}
    <p>別のマイキャラへ移すときは、使用中のキャラから外して保存してください。</p><button class="primary-button" type="submit" ${unlocked?'':'disabled'}>設定を保存</button></form>`;
  syncFragmentSelects();
  setText('mycharacters-status','');
}
function openMyCharacters(from){myCharactersReturn=from;showScreen('mycharacters');}
$('formation-mycharacters').addEventListener('click',()=>openMyCharacters('formation'));
$('mycharacters-back').addEventListener('click',()=>showScreen(myCharactersReturn));
$('mycharacters-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-my-character]');if(!button)return;selectedMyCharacter=button.dataset.myCharacter;renderMyCharacters();});
$('mycharacters-editor').addEventListener('change',event=>{
  if(['mainFragment','subFragment'].includes(event.target.name))syncFragmentSelects();
  if(event.target.name!=='ability'){setText('mycharacters-status','未保存の変更があります。「設定を保存」で確定します。');return;}
  const checked=$('mycharacters-form').querySelectorAll('[name="ability"]:checked');
  if(checked.length>5){event.target.checked=false;setText('mycharacters-status','アビリティは最大5つです。');}
  else setText('mycharacters-status','未保存の変更があります。「設定を保存」で確定します。');
  setText('mycharacters-count',$('mycharacters-form').querySelectorAll('[name="ability"]:checked').length+' / 5');
});
$('mycharacters-editor').addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;
  const error=saveMyCharacter(selectedMyCharacter,{name:form.elements.characterName.value,color:form.elements.characterColor.value,mainFragment:form.elements.mainFragment.value,subFragment:form.elements.subFragment.value,shotType:form.elements.shotType.value,battleStyle:form.elements.battleStyle.value,abilities:[...form.querySelectorAll('[name="ability"]:checked')].map(el=>el.value)});
  if(!error)renderMyCharacters();setText('mycharacters-status',error||'設定を保存しました。編成と次のバトルに反映されます。');
});

function myFragmentEditor(id,unlocked){
 const config=myCharacterConfigs[id];
 const select=slot=>'<label>'+(slot==='mainFragment'?'主友情':'副友情')+'<select name="'+slot+'"><option value="">初期：'+(slot==='mainFragment'?'貫通弾（4）':'ホーミング（4）')+'</option>'+[1,2,3,4].map(r=>'<optgroup label="'+'★'.repeat(r)+'">'+FRAGMENTS.filter(f=>f.rarity===r&&ownedFragments.includes(f.id)).map(f=>{const owner=fragmentUsedBy(f.id,id);return '<option value="'+f.id+'"'+(config[slot]===f.id?' selected':'')+(owner?' disabled':'')+'>'+fragmentLabel(f.id)+(owner?'（'+escapeHTML(CHAR_BY_ID[owner].kana)+'が使用中）':'')+'</option>';}).join('')+'</optgroup>').join('')+'</select><small id="'+slot+'-description"></small></label>';
 return '<fieldset class="mycharacters-friendships"'+(unlocked?'':' disabled')+'><legend>友情コンボの欠片</legend><p>所持 '+ownedFragments.length+' / '+FRAGMENTS.length+'種類</p><div class="mycharacters-types">'+select('mainFragment')+select('subFragment')+'</div><p>同じ欠片は全マイキャラの主・副を通じて1枠だけ使用可能。外して保存すると移せます。初期友情は共用できます。</p></fieldset><details class="fragment-collection"><summary>欠片図鑑・ドロップ率</summary><p>クリア時にチップと別枠で0〜3個。基本は3回×35％（平均1.05個）。採掘は編成全員の補正を加算。所持済みは再抽選対象外です。</p><p>レア度比率：第1章70／25／4／1％ → 第10章10／20／40／30％（★〜★★★★）。Sは第10章と同率。未所持がないレア度は残りへ再配分します。</p>'+[1,2,3,4].map(r=>'<h4>'+'★'.repeat(r)+'</h4><ul>'+FRAGMENTS.filter(f=>f.rarity===r).map(f=>'<li class="'+(ownedFragments.includes(f.id)?'is-owned':'')+'">'+f.name+' ／ '+(ownedFragments.includes(f.id)?'入手済み':'未入手')+'</li>').join('')+'</ul>').join('')+'</details>';
}
function syncFragmentSelects(){
 const form=$('mycharacters-form');if(!form)return;
 for(const slot of ['mainFragment','subFragment']){
  const select=form.elements[slot],other=form.elements[slot==='mainFragment'?'subFragment':'mainFragment'].value;
  for(const option of select.options)option.disabled=!!option.value&&(!!fragmentUsedBy(option.value,selectedMyCharacter)||option.value===other);
  const fragment=FRAGMENT_BY_ID[select.value];
  setText(slot+'-description',fragment?FRIENDSHIP_KINDS[fragment.combo.kind].describe(fragment.combo)+' ／ 基礎威力 '+fragment.combo.power:'初期友情（欠片不要）');
 }
}
