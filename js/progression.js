'use strict';
// Clear flags and first-clear rewards share one save with the inventory so they
// cannot be persisted separately (and grant a reward twice after a reload).
const CHARACTER_UNLOCKS = {eclipse:'5-EX', blossom:'6-EX', sonata:'7-EX', aegisblade:'8-EX', omega:'9-EX'};
const savedClears = chipSave.progress?.cleared;
chipSave.progress = {cleared: Array.isArray(savedClears) ? [...new Set(savedClears.filter(id => STAGE_BY_ID[id]))] : []};
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
  if (!STAGE_BY_ID[id] || !id.endsWith('-EX')) return null;
  const chapter = Number(id.split('-')[0]);
  return {expansions: chapter <= 3 ? 2 : chapter <= 6 ? 3 : chapter <= 9 ? 4 : 5,
    character: Object.keys(CHARACTER_UNLOCKS).find(key => CHARACTER_UNLOCKS[key] === id)};
}
function stageRewardText(id) {
  const reward = stageReward(id);
  return reward ? `拡張 ×${reward.expansions}${reward.character ? ' ／ ' + CHAR_BY_ID[reward.character].kana : ''}` : '';
}
function recordStageClear(stage) {
  if (stage.maker || !isStageUnlocked(stage.id) || isStageCleared(stage.id)) return {first:false, saved:true};
  const previous = chipSave.bag.expand;
  const reward = stageReward(stage.id);
  chipSave.progress.cleared.push(stage.id);
  if (reward) chipSave.bag.expand = (previous || 0) + reward.expansions;
  if (!saveChips()) {
    chipSave.progress.cleared.pop();
    if (previous === undefined) delete chipSave.bag.expand; else chipSave.bag.expand = previous;
    return {first:false, saved:false};
  }
  return {first:true, saved:true};
}
