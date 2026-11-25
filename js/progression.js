'use strict';
// Clear flags and first-clear rewards share one save with the inventory so they
// cannot be persisted separately (and grant a reward twice after a reload).
const CHARACTER_UNLOCKS = {eclipse:'5-EX', blossom:'6-EX', sonata:'7-EX', aegisblade:'8-EX', omega:'9-EX', neo:'10-EX', maestro:'S-1'};
const savedClears = chipSave.progress?.cleared;
const savedSpecialBonus = chipSave.progress?.specialFriendL === true;
chipSave.progress = {cleared: Array.isArray(savedClears) ? [...new Set(savedClears.filter(id => STAGE_BY_ID[id]))] : [], specialFriendL:savedSpecialBonus};
function isStageCleared(id) { return chipSave.progress.cleared.includes(id); }
function chapterStages(chapter) { return STAGES.filter(s => s.id.split('-')[0] === String(chapter) && !s.id.endsWith('-EX')); }
function chapterClearCount(chapter) { return chapterStages(chapter).filter(s => isStageCleared(s.id)).length; }
function totalClearCount() { return chipSave.progress.cleared.filter(id=>!STAGE_BY_ID[id]?.category).length; }
function isChapterUnlocked(chapter) {
  if(chapter==='S')return true;
  const n = Number(chapter);
  return Number.isInteger(n) && n >= 1 && n <= 10 && totalClearCount() >= (n - 1) * 4;
}
function isStageUnlocked(id) {
  if (!STAGE_BY_ID[id]) return false;
  const chapter = id.split('-')[0];
  return isChapterUnlocked(chapter) && (!id.endsWith('-EX') || chapterClearCount(chapter) === chapterStages(chapter).length);
}
function isCharacterUnlocked(id) { return !!CHAR_BY_ID[id] && (!CHARACTER_UNLOCKS[id] || isStageCleared(CHARACTER_UNLOCKS[id])); }
function stageReward(id) {
  if(id==='S-1'&&STAGE_BY_ID[id])return {expansions:0,character:'maestro',chips:{'friend:2':3}};
  if (!STAGE_BY_ID[id] || !id.endsWith('-EX')) return null;
  const chapter = Number(id.split('-')[0]);
  return {expansions: chapter <= 3 ? 2 : chapter <= 6 ? 3 : chapter <= 9 ? 4 : 5,
    character: Object.keys(CHARACTER_UNLOCKS).find(key => CHARACTER_UNLOCKS[key] === id)};
}
function stageRewardText(id) {
  const reward = stageReward(id);
  return reward ? [reward.expansions ? `拡張 ×${reward.expansions}` : '', reward.character ? CHAR_BY_ID[reward.character].kana : '', reward.chips ? '友撃L ×3' : ''].filter(Boolean).join(' ／ ') : '';
}
// New reward for previously cleared S-1 saves: inventory and claim marker commit together.
function grantSpecialClearBonus() {
  if(!isStageCleared('S-1')||chipSave.progress.specialFriendL)return true;
  const previous=chipSave.bag['friend:2'];
  chipSave.bag['friend:2']=(previous||0)+3;chipSave.progress.specialFriendL=true;
  if(saveChips())return true;
  if(previous===undefined)delete chipSave.bag['friend:2'];else chipSave.bag['friend:2']=previous;
  chipSave.progress.specialFriendL=false;return false;
}
grantSpecialClearBonus();
function recordStageClear(stage) {
  if (stage.maker || !isStageUnlocked(stage.id)) return {first:false, saved:true};
  if(isStageCleared(stage.id))return {first:false,saved:stage.id==='S-1'?grantSpecialClearBonus():true};
  const previousFriend=chipSave.bag['friend:2'],previousClaim=chipSave.progress.specialFriendL;
  const previous = chipSave.bag.expand;
  const reward = stageReward(stage.id);
  chipSave.progress.cleared.push(stage.id);
  if (reward?.expansions) chipSave.bag.expand = (previous || 0) + reward.expansions;
  if(reward?.chips){chipSave.bag['friend:2']=(previousFriend||0)+3;chipSave.progress.specialFriendL=true;}
  if (!saveChips()) {
    chipSave.progress.cleared.pop();
    if (previous === undefined) delete chipSave.bag.expand; else chipSave.bag.expand = previous;
    if(previousFriend===undefined)delete chipSave.bag['friend:2'];else chipSave.bag['friend:2']=previousFriend;
    chipSave.progress.specialFriendL=previousClaim;
    return {first:false, saved:false};
  }
  return {first:true, saved:true};
}
