import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";


const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf8"));

const expected = [
  ["E-2", "scenes.json", "鎚羽影像消失", "ch01_epilogue_unresolved_arc_v01", "question-handoff"],
  ["BE-2", "scenes2.json", "球桿早已留在身後", "ch02_epilogue_motion_continues_v01", "future-echo"],
  ["CE-2", "scenes3.json", "褐色字跡旁忽然透出冷白光", "ch03_future_echo_apollo8_v01", "future-echo"],
  ["CE-2", "scenes3.json", "旅人把岸上那道彎線往前延長", "ch03_epilogue_moon_question_v01", "question-handoff"],
  ["DE-2", "scenes4.json", "旅人筆記的頁角忽然亮起", "ch04_future_echo_sputnik_v01", "future-echo"],
  ["DE-2", "scenes4.json", "桌上有兩張帳", "ch04_epilogue_two_collision_accounts_v01", "question-handoff"],
  ["EE-2", "scenes5.json", "空框裡先落下一點灰", "ch05_future_echo_dart_v01", "future-echo"],
  ["EE-2", "scenes5.json", "短少的那一截沒有消失", "ch05_epilogue_blank_receipt_v01", "question-handoff"],
  ["HE-1", "scenes6.json", "旅人筆記的紙邊忽然泛出冷白光", "ch06_future_echo_fsw_v01", "future-echo"],
  ["HE-1", "scenes6.json", "旅人把兩頁攤在一起", "ch06_epilogue_unmeasured_exchange_v01", "question-handoff"],
];

const failures = [];
const fail = (message) => failures.push(message);

for (const [sceneId, sceneFile, match, assetId, layer] of expected) {
  const sceneData = JSON.parse(
    readFileSync(path.join(here, `../data/${sceneFile}`), "utf8"),
  );
  const scene = sceneData.scenes.find((candidate) => candidate.id === sceneId);
  if (!scene) {
    fail(`${sceneFile} 缺少章末場景 ${sceneId}`);
  } else if (!JSON.stringify(scene).includes(match)) {
    fail(`${sceneId} 不再包含焦點觸發句「${match}」`);
  }

  const mappings = assets.lineFocusVisual.filter(
    (item) => item.scene === sceneId && item.match === match,
  );
  if (mappings.length !== 1) {
    fail(`${sceneId} 應恰有一筆章末焦點映射，目前為 ${mappings.length}`);
    continue;
  }
  if (mappings[0].items?.[0]?.asset !== assetId) {
    fail(`${sceneId} 應使用 ${assetId}`);
  }
  if (mappings[0].epilogue !== true) {
    fail(`${sceneId} 章末焦點必須啟用 epilogue 放大演出`);
  }
  if (mappings[0].epilogueLayer !== layer) {
    fail(`${sceneId}/${match} 應標為 ${layer}`);
  }
  if (!mappings[0].caption || !mappings[0].items?.[0]?.alt) {
    fail(`${sceneId} 章末焦點缺 caption 或 alt`);
  }

  const entry = assets.entries.find((candidate) => candidate.id === assetId);
  if (!entry) {
    fail(`assets.entries 缺少 ${assetId}`);
    continue;
  }
  if (entry.kind !== "bg" || entry.w !== 1920 || entry.h !== 1080) {
    fail(`${assetId} 必須是 1920×1080 bg`);
  }
  for (const relativePath of [
    `public/assets/${entry.path}`,
    entry.sourceMaster,
  ]) {
    if (!relativePath || !existsSync(path.join(repo, relativePath))) {
      fail(`${assetId} 缺少檔案 ${relativePath}`);
    }
  }
}

for (const sceneId of ["CE-2", "DE-2", "EE-2", "HE-1"]) {
  const layers = assets.lineFocusVisual.filter((item) => item.scene === sceneId && item.epilogue)
    .map((item) => item.epilogueLayer);
  if (!layers.includes("future-echo") || !layers.includes("question-handoff"))
    fail(`${sceneId} 沒有同時完成未來顯影與問題交接兩層`);
}

if (failures.length) {
  console.error(`章末圖契約失敗（${failures.length}）`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`章末圖契約通過：10 張末頁／未來顯影圖、兩層語意、觸發句與母圖/runtime 路徑完整。`);
