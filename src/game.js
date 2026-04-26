const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const menuOverlay = document.getElementById("menuOverlay");
const titlePanel = document.getElementById("titlePanel");
const settingsPanel = document.getElementById("settingsPanel");
const startGameButton = document.getElementById("startGameButton");
const evolutionModeButton = document.getElementById("evolutionModeButton");
const loadSaveButton = document.getElementById("loadSaveButton");
const openSettingsButton = document.getElementById("openSettingsButton");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const saveSummary = document.getElementById("saveSummary");
const menuStatus = document.getElementById("menuStatus");
const settingAutosave = document.getElementById("settingAutosave");
const settingReducedMotion = document.getElementById("settingReducedMotion");
const settingMusic = document.getElementById("settingMusic");
const settingSfx = document.getElementById("settingSfx");
const exportSaveButton = document.getElementById("exportSaveButton");
const importSaveButton = document.getElementById("importSaveButton");
const importFileInput = document.getElementById("importFileInput");
const touchControls = document.getElementById("touchControls");
const touchMenuButton = document.getElementById("touchMenuButton");
const touchMovementPad = document.getElementById("touchMovementPad");
const touchMovementKnob = document.getElementById("touchMovementKnob");
const touchAttackButton = document.getElementById("touchAttackButton");
const touchInteractButton = document.getElementById("touchInteractButton");
const touchSkillButton = document.getElementById("touchSkillButton");
const touchArtButton = document.getElementById("touchArtButton");

const TILE_SIZE = 48;
const LANDMARK_STRIDE = 18;
const SAFE_ZONE_RADIUS = TILE_SIZE * 5.5;
const NPC_INTERACT_RADIUS = 92;
const LANDMARK_INTERACT_RADIUS = 82;
const TAU = Math.PI * 2;
const WORLD_FONT = '"Kaiti SC", "STKaiti", "Songti SC", "Noto Serif SC", serif';
const SAVE_STORAGE_KEY = "zi-jie-man-you-save-v1";
const SETTINGS_STORAGE_KEY = "zi-jie-man-you-settings-v1";
const CURRENT_SAVE_VERSION = 2;
const TOUCH_JOYSTICK_DEADZONE = 0.16;
const defaultSettings = {
  autosave: true,
  reducedMotion: false,
  music: true,
  sfx: true,
};
const TREASURE_PICKUP_RADIUS = 26;
const TREASURE_MAGNET_RADIUS = 132;
const MARTIAL_ART_FRAGMENT_TARGET = 3;

const evolutionDefinitions = [
  { id: "heart", name: "炉心蜕变", glyph: "炁", color: "#ffb48a", maxRank: 8, summary: "心火上限提升，并立即回复部分生命。", bonus: "+20 心火上限" },
  { id: "stride", name: "疾书身法", glyph: "行", color: "#97e6ff", maxRank: 6, summary: "步势继续改写，永久提高移速。", bonus: "+7% 移速" },
  { id: "edge", name: "锋痕增幅", glyph: "锋", color: "#ffd889", maxRank: 8, summary: "你的字锋继续进化，永久提高伤害。", bonus: "+12% 伤害" },
  { id: "echo", name: "回息分流", glyph: "息", color: "#dcb8ff", maxRank: 6, summary: "回气速度更快，所有主动招式冷却缩短。", bonus: "-6% 冷却" },
  { id: "magnet", name: "牵星引文", glyph: "引", color: "#bfe6ff", maxRank: 6, summary: "吸附更远处的宝物与碎片，并提高残页掉落率。", bonus: "+28 吸附范围" },
  { id: "siphon", name: "汲魄回火", glyph: "汲", color: "#aef7d9", maxRank: 6, summary: "每次击破都会回收心火，首领击破恢复更多。", bonus: "+1 击破回复" },
];

const terrainStyles = {
  deepWater: { glyphs: ["海", "渊", "潮"], color: "#3d79d3", speed: 0.72 },
  water: { glyphs: ["水", "川", "池"], color: "#66b0ff", speed: 0.8 },
  sand: { glyphs: ["沙", "汀", "砂"], color: "#d6ba82", speed: 0.93 },
  grass: { glyphs: ["草", "禾", "芽", "田"], color: "#91df7b", speed: 1 },
  bloom: { glyphs: ["花", "兰", "英"], color: "#f2a8bd", speed: 1.04 },
  forest: { glyphs: ["木", "林", "森", "枝"], color: "#5fc36b", speed: 0.89 },
  stone: { glyphs: ["石", "岩", "岳"], color: "#c1ccd7", speed: 0.84 },
};

const regionDefinitions = {
  village: {
    name: "起笔村",
    centerX: 0,
    centerY: 0,
    radius: TILE_SIZE * 6,
    description: "字界起点，安全的港湾",
    color: "#8ce6ff",
    terrainTheme: "village",
    enemyIds: [],
  },
  marsh: {
    name: "幽冥泽",
    centerX: 2800,
    centerY: 0,
    radius: TILE_SIZE * 9,
    description: "东部沼泽，瘴气弥漫",
    color: "#7d9e5d",
    terrainTheme: "marsh",
    enemyIds: ["marsh-slime", "marsh-miasma"],
    requiredStage: "complete",
    questTarget: 9,
    bossName: "沼母",
    bossHp: 38,
    bossChar: "沼",
    bossSpeed: 66,
    bossTouchDamage: 26,
    bossSize: 64,
    bossSkillInterval: 3.2,
    bossSummonInterval: 5.1,
  },
  volcano: {
    name: "烈焰峡",
    centerX: 0,
    centerY: -2800,
    radius: TILE_SIZE * 9,
    description: "南部火山，烈焰焚心",
    color: "#ff6b4a",
    terrainTheme: "volcano",
    enemyIds: ["volcano-ember", "volcano-molten"],
    requiredStage: "marsh",
    questTarget: 11,
    bossName: "焰魁",
    bossHp: 45,
    bossChar: "焰",
    bossSpeed: 86,
    bossTouchDamage: 30,
    bossSize: 68,
    bossSkillInterval: 2.1,
    bossSummonInterval: 4.2,
  },
  forest: {
    name: "雾隐林",
    centerX: -2800,
    centerY: 0,
    radius: TILE_SIZE * 9,
    description: "西部森林，雾中藏影",
    color: "#5d9e7d",
    terrainTheme: "forest",
    enemyIds: ["forest-shadow", "forest-vine"],
    requiredStage: "volcano",
    questTarget: 12,
    bossName: "林王",
    bossHp: 42,
    bossChar: "王",
    bossSpeed: 112,
    bossTouchDamage: 24,
    bossSize: 60,
    bossSkillInterval: 1.8,
    bossSummonInterval: 3.7,
  },
  monument: {
    name: "字界碑",
    centerX: 0,
    centerY: 2800,
    radius: TILE_SIZE * 10,
    description: "北部高地，字界之心",
    color: "#d4a574",
    terrainTheme: "monument",
    enemyIds: ["monument-stele", "monument-guardian"],
    requiredStage: "forest",
    questTarget: 10,
    bossName: "碑灵",
    bossHp: 72,
    bossChar: "碑",
    bossSpeed: 82,
    bossTouchDamage: 34,
    bossSize: 72,
    bossSkillInterval: 2.3,
    bossSummonInterval: 4.0,
  },
  aurora: {
    name: "天穹海",
    centerX: 2800,
    centerY: -2800,
    radius: TILE_SIZE * 10,
    description: "东北云海，星潮翻涌",
    color: "#7eb9ff",
    terrainTheme: "aurora",
    enemyIds: ["aurora-kite", "aurora-comet"],
    requiredStage: "monument",
    questTarget: 12,
    bossName: "潮君",
    bossHp: 82,
    bossChar: "潮",
    bossSpeed: 96,
    bossTouchDamage: 36,
    bossSize: 74,
    bossSkillInterval: 1.9,
    bossSummonInterval: 3.8,
  },
  abyss: {
    name: "归墟渊",
    centerX: 2800,
    centerY: 2800,
    radius: TILE_SIZE * 10,
    description: "东南裂渊，万字归寂",
    color: "#8fa2d8",
    terrainTheme: "abyss",
    enemyIds: ["abyss-rift", "abyss-devourer"],
    requiredStage: "aurora",
    questTarget: 14,
    bossName: "渊皇",
    bossHp: 104,
    bossChar: "渊",
    bossSpeed: 88,
    bossTouchDamage: 42,
    bossSize: 78,
    bossSkillInterval: 1.7,
    bossSummonInterval: 3.4,
    isFinalBoss: true,
  },
};

const regionOrder = ["village", "marsh", "volcano", "forest", "monument", "aurora", "abyss"];

const regionTerrainStyles = {
  marsh: {
    swamp: { glyphs: ["沼", "泥", "洼"], color: "#5d6e4d", speed: 0.7 },
    mist: { glyphs: ["雾", "瘴", "冥"], color: "#9eae8d", speed: 0.85 },
  },
  volcano: {
    lava: { glyphs: ["岩", "焰", "熔"], color: "#c44a2a", speed: 0.55 },
    ash: { glyphs: ["灰", "烬", "焦"], color: "#7d4a4a", speed: 0.7 },
    ember: { glyphs: ["火", "燎", "燃"], color: "#ff6a4a", speed: 0.6 },
  },
  forest: {
    dense: { glyphs: ["密", "藤", "苔"], color: "#4d7e5d", speed: 1.1 },
    path: { glyphs: ["径", "道", "痕"], color: "#8d9e7d", speed: 1.0 },
    canopy: { glyphs: ["枝", "叶", "森"], color: "#3d6e4d", speed: 0.95 },
  },
  monument: {
    peak: { glyphs: ["巅", "崖", "峻"], color: "#a57d4d", speed: 0.8 },
    plateau: { glyphs: ["台", "垣", "基"], color: "#c49e6d", speed: 0.9 },
    ancient: { glyphs: ["古", "碑", "铭"], color: "#d4b584", speed: 0.85 },
  },
  aurora: {
    surf: { glyphs: ["潮", "浪", "澜"], color: "#6aa7ff", speed: 0.88 },
    cloud: { glyphs: ["云", "岚", "霭"], color: "#c7e7ff", speed: 1.06 },
    star: { glyphs: ["星", "辉", "霜"], color: "#9ed0ff", speed: 0.98 },
  },
  abyss: {
    rift: { glyphs: ["渊", "裂", "壑"], color: "#5b6d95", speed: 0.82 },
    void: { glyphs: ["虚", "寂", "黯"], color: "#8994c4", speed: 0.9 },
    ruin: { glyphs: ["骨", "墟", "骸"], color: "#b6b9d6", speed: 0.86 },
  },
};

const landmarkTypes = [
  { name: "风门", core: "门", ring: ["风", "岚", "云"], color: "#f3d277" },
  { name: "墨泉", core: "泉", ring: ["墨", "水", "波"], color: "#7dcfff" },
  { name: "竹村", core: "村", ring: ["竹", "舍", "灯"], color: "#a8e184" },
  { name: "字塔", core: "塔", ring: ["文", "印", "章"], color: "#ff9a76" },
  { name: "碑林", core: "碑", ring: ["石", "刻", "铭"], color: "#e2ddd3" },
];

const enemyKinds = [
  { char: "魇", color: "#ffab75", speed: 94, touchDamage: 16, hp: 1, size: 30 },
  { char: "厄", color: "#ffc768", speed: 112, touchDamage: 14, hp: 1, size: 28 },
  { char: "祟", color: "#f6949d", speed: 88, touchDamage: 22, hp: 2, size: 32 },
  { char: "魅", color: "#d7a7ff", speed: 100, touchDamage: 18, hp: 2, size: 30 },
  { char: "灾", color: "#ff7f67", speed: 120, touchDamage: 15, hp: 1, size: 28 },
  { char: "霾", color: "#86a9ff", speed: 84, touchDamage: 20, hp: 2, size: 34 },
  { char: "刃", color: "#ffe48b", speed: 134, touchDamage: 18, hp: 1, size: 26 },
];

const regionEnemyKinds = {
  marsh: [
    { id: "marsh-slime", char: "蛊", color: "#8e9e5d", speed: 68, touchDamage: 18, hp: 3, size: 26 },
    { id: "marsh-miasma", char: "瘴", color: "#9eae7d", speed: 52, touchDamage: 24, hp: 2, size: 30 },
  ],
  volcano: [
    { id: "volcano-ember", char: "烬", color: "#ff5a3a", speed: 98, touchDamage: 28, hp: 2, size: 28 },
    { id: "volcano-molten", char: "熔", color: "#ff7a5a", speed: 82, touchDamage: 32, hp: 3, size: 32 },
  ],
  forest: [
    { id: "forest-shadow", char: "影", color: "#5d9e7d", speed: 142, touchDamage: 14, hp: 1, size: 24 },
    { id: "forest-vine", char: "蔓", color: "#7dae8d", speed: 76, touchDamage: 16, hp: 2, size: 28 },
  ],
  monument: [
    { id: "monument-stele", char: "碑", color: "#d4a574", speed: 88, touchDamage: 22, hp: 3, size: 30 },
    { id: "monument-guardian", char: "魁", color: "#e4b584", speed: 72, touchDamage: 36, hp: 5, size: 40 },
  ],
  aurora: [
    { id: "aurora-kite", char: "鸢", color: "#9ed0ff", speed: 150, touchDamage: 18, hp: 2, size: 24 },
    { id: "aurora-comet", char: "陨", color: "#7eb9ff", speed: 94, touchDamage: 28, hp: 4, size: 34 },
  ],
  abyss: [
    { id: "abyss-rift", char: "渊", color: "#7f93c8", speed: 104, touchDamage: 30, hp: 4, size: 34 },
    { id: "abyss-devourer", char: "蚀", color: "#a6b2df", speed: 132, touchDamage: 22, hp: 3, size: 28 },
  ],
};

const wandererProfession = {
  id: "wanderer",
  name: "未定型",
  icon: "我",
  color: "#fff7e6",
  summary: "仍在寻找自己的写法。",
  attack: "J 单发火字",
  skill: "通关新手村后觉醒",
  maxHp: 100,
  speed: 240,
};

const professionOptions = [
  {
    id: "blade",
    name: "剑字使",
    icon: "剑",
    color: "#ffd889",
    summary: "贴身连斩，前压时很凶。",
    attack: "J 三连斩",
    skill: "U 回环斩",
    maxHp: 140,
    speed: 252,
  },
  {
    id: "ranger",
    name: "游墨客",
    icon: "游",
    color: "#97e6ff",
    summary: "远距扇射，机动与压制兼备。",
    attack: "J 扇形三发",
    skill: "U 墨雨齐发",
    maxHp: 118,
    speed: 264,
  },
  {
    id: "mage",
    name: "符术师",
    icon: "符",
    color: "#dcb8ff",
    summary: "追踪符印，范围爆发强。",
    attack: "J 追踪印弹",
    skill: "U 爆印法阵",
    maxHp: 110,
    speed: 236,
  },
];

const professionMap = Object.fromEntries(
  [wandererProfession, ...professionOptions].map((profession) => [profession.id, profession]),
);

const blessingDefinitions = [
  {
    id: "heart",
    name: "心火炉",
    glyph: "炁",
    color: "#ffb48a",
    maxRank: 4,
    costs: [36, 54, 72, 90],
    summary: "把宝气炼进心火，永久提升生存。",
  },
  {
    id: "stride",
    name: "墨行履",
    glyph: "行",
    color: "#97e6ff",
    maxRank: 3,
    costs: [30, 46, 62],
    summary: "借墨风改写步势，永久提升移速。",
  },
  {
    id: "edge",
    name: "破字锋",
    glyph: "锋",
    color: "#ffd889",
    maxRank: 4,
    costs: [42, 60, 78, 96],
    summary: "让你的字锋更重，永久提升伤害。",
  },
  {
    id: "echo",
    name: "回息印",
    glyph: "息",
    color: "#dcb8ff",
    maxRank: 3,
    costs: [40, 56, 72],
    summary: "让招式回气更快，永久缩短战技冷却。",
  },
];

const treasureTypes = [
  { id: "coin", name: "铜钱串", glyph: "钱", color: "#f2bf74", value: 12, heal: 0, weight: 0.48 },
  { id: "jade", name: "玉佩", glyph: "佩", color: "#8ce6ff", value: 24, heal: 8, weight: 0.27 },
  { id: "silk", name: "锦囊", glyph: "囊", color: "#ffb9a1", value: 18, heal: 0, weight: 0.25 },
];

const martialArts = [
  {
    id: "liuyun",
    name: "流云步",
    glyph: "云",
    color: "#a8f0ff",
    fragmentName: "流云步碎片",
    summary: "疾行穿影，短时间内避开锋芒。",
    cooldown: 6.2,
    fragmentTarget: 3,
    unlockRegion: "marsh",
    evolutionLevel: 1,
  },
  {
    id: "huilan",
    name: "回澜式",
    glyph: "澜",
    color: "#ffd894",
    fragmentName: "回澜式碎片",
    summary: "真气回环，荡开周身敌意。",
    cooldown: 7.4,
    fragmentTarget: 3,
    unlockRegion: "volcano",
    evolutionLevel: 2,
  },
  {
    id: "guiyuan",
    name: "归元诀",
    glyph: "诀",
    color: "#dcb8ff",
    fragmentName: "归元诀碎片",
    summary: "收束字气，护体回心火。",
    cooldown: 8.6,
    fragmentTarget: 4,
    unlockRegion: "forest",
    evolutionLevel: 4,
  },
  {
    id: "tafeng",
    name: "踏风行",
    glyph: "风",
    color: "#aef7d9",
    fragmentName: "踏风行碎片",
    summary: "以轻功借风提身，施展后移速提升 100%，持续 10 秒。",
    cooldown: 18,
    fragmentTarget: 5,
    unlockRegion: "monument",
    evolutionLevel: 5,
  },
  {
    id: "xingluo",
    name: "星落式",
    glyph: "星",
    color: "#bfe6ff",
    fragmentName: "星落式残页",
    summary: "引星潮为刃，向四周撒出追索字锋。",
    cooldown: 15.6,
    fragmentTarget: 6,
    unlockRegion: "aurora",
    evolutionLevel: 7,
  },
  {
    id: "zhenyuan",
    name: "镇渊印",
    glyph: "渊",
    color: "#c7d3ff",
    fragmentName: "镇渊印古卷",
    summary: "借归墟之印收束敌势，把周围灾字拉回身前镇落。",
    cooldown: 20.8,
    fragmentTarget: 7,
    unlockRegion: "abyss",
    evolutionLevel: 9,
  },
];

const treasureMap = Object.fromEntries(treasureTypes.map((treasure) => [treasure.id, treasure]));
const martialArtMap = Object.fromEntries(martialArts.map((art) => [art.id, art]));

const musicPlans = {
  menu: {
    stepDuration: 0.74,
    root: 196,
    leadType: "triangle",
    droneType: "sine",
    leadPattern: [0, null, 4, 7, null, 9, 7, 4],
    dronePattern: [0, null, -5, null],
    accents: [0, null, null, 7, null, null, 4, null],
    leadVolume: 0.12,
    droneVolume: 0.05,
    accentVolume: 0.07,
    drum: false,
  },
  village: {
    stepDuration: 0.62,
    root: 220,
    leadType: "triangle",
    droneType: "triangle",
    leadPattern: [0, 2, 4, 7, 4, 2, 0, 4],
    dronePattern: [0, null, 7, null],
    accents: [null, 9, null, 7, null, 4, null, 2],
    leadVolume: 0.11,
    droneVolume: 0.05,
    accentVolume: 0.065,
    drum: false,
  },
  wild: {
    stepDuration: 0.54,
    root: 246.94,
    leadType: "sine",
    droneType: "triangle",
    leadPattern: [0, 4, 7, null, 9, 7, 4, 2],
    dronePattern: [0, null, -3, null],
    accents: [null, 7, null, 9, null, 4, null, 2],
    leadVolume: 0.105,
    droneVolume: 0.045,
    accentVolume: 0.058,
    drum: false,
  },
  boss: {
    stepDuration: 0.38,
    root: 164.81,
    leadType: "sawtooth",
    droneType: "triangle",
    leadPattern: [0, 2, 4, 2, 7, 4, 2, 0],
    dronePattern: [0, null, -5, null],
    accents: [7, null, 4, null, 2, null, 4, null],
    leadVolume: 0.12,
    droneVolume: 0.05,
    accentVolume: 0.055,
    drum: true,
  },
};

function getVillageCheckpoint() {
  return {
    id: "village-core",
    label: "起笔村·字坊",
    x: 0,
    y: 0,
    color: "#8ce6ff",
    glyph: "锚",
  };
}

function checkpointFromLandmark(landmark) {
  return {
    id: `landmark:${landmark.id}`,
    label: landmark.name,
    x: landmark.x,
    y: landmark.y,
    color: landmark.color,
    glyph: "锚",
  };
}

function normalizeCheckpoint(checkpoint) {
  const fallback = getVillageCheckpoint();
  if (!checkpoint || !Number.isFinite(checkpoint.x) || !Number.isFinite(checkpoint.y)) {
    return fallback;
  }

  return {
    id: checkpoint.id || fallback.id,
    label: checkpoint.label || fallback.label,
    x: checkpoint.x,
    y: checkpoint.y,
    color: checkpoint.color || fallback.color,
    glyph: checkpoint.glyph || fallback.glyph,
  };
}

function checkpointEquals(a, b) {
  return Boolean(a && b && a.id === b.id);
}

function createInventoryState() {
  return {
    treasures: Object.fromEntries(treasureTypes.map((treasure) => [treasure.id, 0])),
    treasureScore: 0,
    fragments: Object.fromEntries(martialArts.map((art) => [art.id, 0])),
    learnedArts: [],
    activeArt: null,
  };
}

function createRegionProgressState() {
  return Object.fromEntries(
    regionOrder
      .filter((regionId) => regionId !== "village")
      .map((regionId) => [regionId, { cleared: 0, bossDefeated: false }]),
  );
}

function normalizeRegionProgress(savedProgress) {
  const progress = createRegionProgressState();

  for (const regionId of Object.keys(progress)) {
    progress[regionId] = {
      cleared: Math.max(0, Math.floor(savedProgress?.[regionId]?.cleared ?? 0)),
      bossDefeated: Boolean(savedProgress?.[regionId]?.bossDefeated),
    };
  }

  return progress;
}

function normalizeUnlockedRegions(savedRegions) {
  const validRegions = new Set(Array.isArray(savedRegions) ? savedRegions.filter((regionId) => regionDefinitions[regionId]) : []);
  validRegions.add("village");
  return regionOrder.filter((regionId) => validRegions.has(regionId));
}

function createEvolutionState() {
  return {
    active: false,
    level: 1,
    xp: 0,
    nextXp: 10,
    elapsed: 0,
    bossesDefeated: 0,
    nextBossLevel: 4,
    menuOpen: false,
    selected: 0,
    choices: [],
    ranks: Object.fromEntries(evolutionDefinitions.map((choice) => [choice.id, 0])),
    usedAnchors: new Set(),
  };
}

function createBlessingState() {
  return Object.fromEntries(blessingDefinitions.map((blessing) => [blessing.id, 0]));
}

function normalizeBlessingState(savedBlessings) {
  const blessings = createBlessingState();

  for (const blessing of blessingDefinitions) {
    const rawRank = Math.floor(savedBlessings?.[blessing.id] ?? 0);
    blessings[blessing.id] = Math.max(0, Math.min(blessing.maxRank, rawRank));
  }

  return blessings;
}

function getMartialArtFragmentTarget(artOrId) {
  const art = typeof artOrId === "string" ? martialArtMap[artOrId] : artOrId;
  return art?.fragmentTarget ?? MARTIAL_ART_FRAGMENT_TARGET;
}

function readStorageJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function loadStoredSettings() {
  const stored = readStorageJson(SETTINGS_STORAGE_KEY);
  return {
    autosave: stored?.autosave ?? defaultSettings.autosave,
    reducedMotion: stored?.reducedMotion ?? defaultSettings.reducedMotion,
    music: stored?.music ?? defaultSettings.music,
    sfx: stored?.sfx ?? defaultSettings.sfx,
  };
}

const baseNpcs = [
  {
    id: "guide",
    name: "引路人",
    char: "引",
    x: -TILE_SIZE * 1.5,
    y: -TILE_SIZE * 1.1,
    color: "#ffe29a",
    bobSeed: 0.4,
  },
  {
    id: "healer",
    name: "字医",
    char: "医",
    x: TILE_SIZE * 2.15,
    y: TILE_SIZE * 0.95,
    color: "#8ce6ff",
    bobSeed: 1.8,
  },
  {
    id: "scribe",
    name: "碑书记",
    char: "史",
    x: -TILE_SIZE * 2.1,
    y: TILE_SIZE * 1.8,
    color: "#d9c8ab",
    bobSeed: 3.2,
  },
];

const gatekeeperDefinitions = [
  { id: "gate-east", name: "泽使", char: "泽", region: "marsh", x: TILE_SIZE * 5.5, y: 0, color: "#7d9e5d" },
  { id: "gate-south", name: "焰使", char: "焰", region: "volcano", x: 0, y: TILE_SIZE * 5.5, color: "#ff6b4a" },
  { id: "gate-west", name: "林使", char: "林", region: "forest", x: -TILE_SIZE * 5.5, y: 0, color: "#5d9e7d" },
  { id: "gate-north", name: "碑使", char: "碑", region: "monument", x: 0, y: -TILE_SIZE * 5.5, color: "#d4a574" },
  { id: "gate-northeast", name: "潮使", char: "潮", region: "aurora", x: TILE_SIZE * 4.2, y: -TILE_SIZE * 4.2, color: "#7eb9ff" },
  { id: "gate-southeast", name: "渊使", char: "渊", region: "abyss", x: TILE_SIZE * 4.2, y: TILE_SIZE * 4.2, color: "#8fa2d8" },
];

function createNpcs(unlockedRegions = ["village"]) {
  const npcs = [...baseNpcs];
  const availableRegions = Array.isArray(unlockedRegions) ? unlockedRegions : ["village"];

  for (const keeper of gatekeeperDefinitions) {
    if (availableRegions.includes(keeper.region)) {
      npcs.push({ ...keeper, bobSeed: Math.random() * 4 });
    }
  }

  return npcs;
}

const keys = Object.create(null);
const state = {
  mode: "story",
  width: window.innerWidth,
  height: window.innerHeight,
  lastTime: performance.now(),
  time: 0,
  backgroundGradient: null,
  player: {
    x: 0,
    y: 0,
    facingX: 1,
    facingY: 0,
    speed: wandererProfession.speed,
    cooldown: 0,
    skillCooldown: 0,
    artCooldown: 0,
    speedBoostTimer: 0,
    hp: wandererProfession.maxHp,
    maxHp: wandererProfession.maxHp,
    flash: 0,
    invuln: 0,
    profession: null,
  },
  camera: { x: 0, y: 0 },
  bullets: [],
  enemies: [],
  drops: [],
  particles: [],
  effects: [],
  npcs: createNpcs(["village"]),
  interaction: null,
  dialog: {
    speaker: "字界",
    text: "起笔村在你脚下苏醒。先去和引路人聊聊。",
    timer: 8,
  },
  toast: {
    text: getPrimaryControlHint(),
    color: "#fff2cb",
    timer: 8,
  },
  cleared: 0,
  shotsFired: 0,
  quest: {
    stage: "meet-guide",
    activationTarget: 3,
    clearTarget: 12,
    activatedLandmarks: new Set(),
    bossSpawned: false,
    bossDefeated: false,
    unlockedRegions: ["village"],
    currentRegion: "village",
    regionProgress: createRegionProgressState(),
  },
  professionMenu: {
    open: false,
    selected: 0,
  },
  blessingMenu: {
    open: false,
    selected: 0,
  },
  exitPrompt: {
    open: false,
    selected: 1,
  },
  map: {
    expanded: false,
  },
  checkpoint: getVillageCheckpoint(),
  inventory: createInventoryState(),
  blessings: createBlessingState(),
  evolution: createEvolutionState(),
  settings: loadStoredSettings(),
  menu: {
    screen: "title",
    settingsOpen: false,
    autosavePending: false,
    lastAutosaveAt: 0,
  },
  audio: {
    context: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    noiseBuffer: null,
    nextMusicAt: 0,
    melodyStep: 0,
    currentMode: "menu",
    zoneCue: "menu",
  },
  hurtPulse: 0,
  touch: {
    movePointerId: null,
    moveX: 0,
    moveY: 0,
    attackPointerId: null,
  },
};

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  state.backgroundGradient = ctx.createLinearGradient(0, 0, 0, state.height);
  state.backgroundGradient.addColorStop(0, "#07101a");
  state.backgroundGradient.addColorStop(0.5, "#102436");
  state.backgroundGradient.addColorStop(1, "#143b30");

  updateTouchControlsUi();
}

function supportsTouchInput() {
  return Boolean(
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    navigator.maxTouchPoints > 0,
  );
}

function isCompactViewport() {
  return state.width <= 820 || state.height <= 720;
}

function shouldShowTouchControls() {
  return (
    supportsTouchInput() &&
    state.menu.screen === "playing" &&
    !state.professionMenu.open &&
    !state.blessingMenu.open &&
    !state.evolution.menuOpen &&
    !state.exitPrompt.open &&
    !state.map.expanded
  );
}

function getTouchControlClearance() {
  if (!shouldShowTouchControls()) {
    return 20;
  }

  return Math.round(clamp(Math.min(state.width, state.height) * 0.28, 156, 214));
}

function getPrimaryControlHint() {
  return supportsTouchInput()
    ? "左手摇杆移动，右手按钮攻击、技能与互动。"
    : "方向键或 WASD 移动，J 攻击，U 职业技，K 或空格互动。";
}

function clearPressedKeys() {
  clearPressedKeys();
  resetTouchMovement();
  releaseTouchAttack();
}

function setTouchKnobOffset(offsetX, offsetY) {
  touchMovementKnob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
}

function resetTouchMovement() {
  state.touch.movePointerId = null;
  state.touch.moveX = 0;
  state.touch.moveY = 0;
  setTouchKnobOffset(0, 0);
}

function releaseTouchAttack() {
  state.touch.attackPointerId = null;
  keys.KeyJ = false;
}

function setTouchMovementFromPoint(clientX, clientY) {
  const rect = touchMovementPad.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radius = rect.width * 0.36;
  const deltaX = (clientX - centerX) / radius;
  const deltaY = (clientY - centerY) / radius;
  const length = Math.hypot(deltaX, deltaY);

  if (!length || length < TOUCH_JOYSTICK_DEADZONE) {
    state.touch.moveX = 0;
    state.touch.moveY = 0;
    setTouchKnobOffset(0, 0);
    return;
  }

  const directionX = deltaX / length;
  const directionY = deltaY / length;
  const magnitude = clamp((Math.min(1, length) - TOUCH_JOYSTICK_DEADZONE) / (1 - TOUCH_JOYSTICK_DEADZONE), 0, 1);
  const knobDistance = magnitude * radius * 0.72;

  state.touch.moveX = directionX * magnitude;
  state.touch.moveY = directionY * magnitude;
  setTouchKnobOffset(directionX * knobDistance, directionY * knobDistance);
}

function updateTouchControlsUi() {
  const visible = shouldShowTouchControls();
  touchControls.classList.toggle("hidden", !visible);
  touchControls.setAttribute("aria-hidden", String(!visible));

  if (!visible) {
    resetTouchMovement();
    releaseTouchAttack();
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function fract(value) {
  return value - Math.floor(value);
}

function hash2(x, y, seed = 0) {
  return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123);
}

function valueNoise(x, y, seed = 0) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);

  const n0 = lerp(hash2(x0, y0, seed), hash2(x1, y0, seed), sx);
  const n1 = lerp(hash2(x0, y1, seed), hash2(x1, y1, seed), sx);
  return lerp(n0, n1, sy);
}

function fbm(x, y, seed = 0) {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let octave = 0; octave < 4; octave += 1) {
    total += valueNoise(x * frequency, y * frequency, seed + octave * 13) * amplitude;
    frequency *= 2;
    amplitude *= 0.5;
  }

  return total;
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWrappedText(text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const chars = Array.from(text);
  let line = "";
  let lineCount = 0;

  for (let index = 0; index < chars.length; index += 1) {
    const nextLine = line + chars[index];
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = chars[index];
      lineCount += 1;
      if (lineCount >= maxLines) {
        return lineCount + 1;
      }
    } else {
      line = nextLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
  }

  return lineCount + 1;
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y);
  if (!length) {
    return { x: 0, y: 0 };
  }

  return { x: x / length, y: y / length };
}

function rotateVector(x, y, angle) {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  };
}

function frequencyFromSemitone(root, semitone) {
  return root * 2 ** (semitone / 12);
}

function pickWeighted(list) {
  const total = list.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;

  for (const item of list) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item;
    }
  }

  return list[list.length - 1];
}

function getActiveMartialArt() {
  return state.inventory.activeArt ? martialArtMap[state.inventory.activeArt] || null : null;
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.25), context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
  }

  return buffer;
}

function updateAudioSettings() {
  if (!state.audio.context) {
    return;
  }

  const now = state.audio.context.currentTime;
  state.audio.masterGain.gain.cancelScheduledValues(now);
  state.audio.musicGain.gain.cancelScheduledValues(now);
  state.audio.sfxGain.gain.cancelScheduledValues(now);
  state.audio.masterGain.gain.setTargetAtTime(0.62, now, 0.08);
  state.audio.musicGain.gain.setTargetAtTime(state.settings.music ? 0.34 : 0.0001, now, 0.08);
  state.audio.sfxGain.gain.setTargetAtTime(state.settings.sfx ? 0.42 : 0.0001, now, 0.08);
}

function ensureAudioReady() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    return null;
  }

  try {
    if (!state.audio.context) {
      const context = new AudioCtor();
      const masterGain = context.createGain();
      const musicGain = context.createGain();
      const sfxGain = context.createGain();
      masterGain.connect(context.destination);
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);

      state.audio.context = context;
      state.audio.masterGain = masterGain;
      state.audio.musicGain = musicGain;
      state.audio.sfxGain = sfxGain;
      state.audio.noiseBuffer = createNoiseBuffer(context);
      state.audio.nextMusicAt = context.currentTime + 0.08;
      state.audio.melodyStep = 0;
      state.audio.currentMode = "menu";
      state.audio.zoneCue = "menu";
      updateAudioSettings();
    }

    if (state.audio.context.state === "suspended") {
      state.audio.context.resume().catch(() => null);
    }
  } catch (error) {
    console.warn("Audio initialization failed:", error);
    state.audio.context = null;
    state.audio.masterGain = null;
    state.audio.musicGain = null;
    state.audio.sfxGain = null;
    state.audio.noiseBuffer = null;
    return null;
  }

  return state.audio.context;
}

function scheduleTone(destination, options) {
  if (!state.audio.context || !destination) {
    return;
  }

  const {
    time,
    frequency,
    type = "triangle",
    duration = 0.22,
    volume = 0.05,
    attack = 0.012,
    release = duration,
    slide = 1,
  } = options;
  const oscillator = state.audio.context.createOscillator();
  const gain = state.audio.context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(24, frequency), time);
  if (slide !== 1) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, frequency * slide), time + duration);
  }

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + release);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.05);
}

function scheduleNoise(destination, options) {
  if (!state.audio.context || !state.audio.noiseBuffer || !destination) {
    return;
  }

  const {
    time,
    volume = 0.04,
    duration = 0.16,
    frequency = 900,
    q = 0.8,
  } = options;
  const source = state.audio.context.createBufferSource();
  const filter = state.audio.context.createBiquadFilter();
  const gain = state.audio.context.createGain();
  source.buffer = state.audio.noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, time);
  filter.Q.value = q;
  gain.gain.setValueAtTime(Math.max(0.0001, volume), time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(time);
  source.stop(time + duration + 0.05);
}

function getMusicMode() {
  if (state.menu.screen !== "playing") {
    return "menu";
  }

  if (state.quest.stage === "boss-trial" && getBossEnemy()) {
    return "boss";
  }

  if (Math.hypot(state.player.x, state.player.y) <= SAFE_ZONE_RADIUS + 120) {
    return "village";
  }

  return "wild";
}

function playZoneCue(mode) {
  if (!state.audio.context || !state.settings.sfx) {
    return;
  }

  const base =
    mode === "boss" ? 220 : mode === "wild" ? 392 : mode === "village" ? 330 : 294;
  const now = state.audio.context.currentTime + 0.01;
  scheduleTone(state.audio.sfxGain, { time: now, frequency: base, type: "triangle", duration: 0.18, volume: 0.03 });
  scheduleTone(state.audio.sfxGain, { time: now + 0.08, frequency: base * 1.5, type: "sine", duration: 0.22, volume: 0.026 });
}

function updateMusic() {
  if (!state.audio.context || !state.settings.music || state.audio.context.state !== "running") {
    return;
  }

  const mode = getMusicMode();
  if (mode !== state.audio.currentMode) {
    state.audio.currentMode = mode;
    state.audio.melodyStep = 0;
    state.audio.nextMusicAt = Math.max(state.audio.context.currentTime + 0.08, state.audio.nextMusicAt);
    if (mode !== state.audio.zoneCue) {
      state.audio.zoneCue = mode;
      playZoneCue(mode);
    }
  }

  const plan = musicPlans[mode];
  while (state.audio.nextMusicAt < state.audio.context.currentTime + 0.8) {
    const step = state.audio.melodyStep;
    const time = state.audio.nextMusicAt;
    const lead = plan.leadPattern[step % plan.leadPattern.length];
    const drone = plan.dronePattern[step % plan.dronePattern.length];
    const accent = plan.accents[step % plan.accents.length];

    if (lead !== null) {
      scheduleTone(state.audio.musicGain, {
        time,
        frequency: frequencyFromSemitone(plan.root, lead),
        type: plan.leadType,
        duration: plan.stepDuration * 0.8,
        release: time + plan.stepDuration * 0.72 - time,
        volume: plan.leadVolume,
        slide: 0.985,
      });
    }

    if (drone !== null) {
      scheduleTone(state.audio.musicGain, {
        time,
        frequency: frequencyFromSemitone(plan.root / 2, drone),
        type: plan.droneType,
        duration: plan.stepDuration * 1.55,
        release: plan.stepDuration * 1.45,
        attack: 0.04,
        volume: plan.droneVolume,
        slide: 0.998,
      });
    }

    if (accent !== null) {
      scheduleTone(state.audio.musicGain, {
        time: time + plan.stepDuration * 0.18,
        frequency: frequencyFromSemitone(plan.root * 2, accent),
        type: "sine",
        duration: plan.stepDuration * 0.45,
        release: plan.stepDuration * 0.42,
        volume: plan.accentVolume,
        slide: 1.01,
      });
    }

    if (plan.drum && step % 2 === 0) {
      scheduleTone(state.audio.musicGain, {
        time,
        frequency: 84,
        type: "sine",
        duration: 0.18,
        release: 0.18,
        volume: 0.055,
        slide: 0.46,
      });
      scheduleNoise(state.audio.musicGain, {
        time: time + 0.01,
        volume: 0.02,
        duration: 0.09,
        frequency: 520,
        q: 0.6,
      });
    }

    state.audio.nextMusicAt += plan.stepDuration;
    state.audio.melodyStep += 1;
  }
}

function playSfx(type, options = {}) {
  if (!state.audio.context || !state.settings.sfx || state.audio.context.state !== "running") {
    return;
  }

  const time = state.audio.context.currentTime + 0.01;
  switch (type) {
    case "menu":
      scheduleTone(state.audio.sfxGain, { time, frequency: 660, type: "triangle", duration: 0.16, volume: 0.035 });
      scheduleTone(state.audio.sfxGain, { time: time + 0.05, frequency: 880, type: "sine", duration: 0.18, volume: 0.026 });
      break;
    case "talk":
      scheduleTone(state.audio.sfxGain, { time, frequency: 520, type: "sine", duration: 0.12, volume: 0.03 });
      break;
    case "attack":
      if (options.profession === "blade") {
        scheduleNoise(state.audio.sfxGain, { time, volume: 0.03, duration: 0.08, frequency: 1800, q: 0.9 });
        scheduleTone(state.audio.sfxGain, { time, frequency: 440, type: "sawtooth", duration: 0.14, volume: 0.028, slide: 0.72 });
      } else if (options.profession === "ranger") {
        scheduleTone(state.audio.sfxGain, { time, frequency: 620, type: "triangle", duration: 0.12, volume: 0.028, slide: 1.08 });
        scheduleNoise(state.audio.sfxGain, { time: time + 0.01, volume: 0.018, duration: 0.09, frequency: 1200, q: 1.2 });
      } else if (options.profession === "mage") {
        scheduleTone(state.audio.sfxGain, { time, frequency: 300, type: "sine", duration: 0.18, volume: 0.03, slide: 1.65 });
      } else {
        scheduleTone(state.audio.sfxGain, { time, frequency: 520, type: "triangle", duration: 0.15, volume: 0.03, slide: 0.88 });
      }
      break;
    case "skill":
      scheduleTone(state.audio.sfxGain, { time, frequency: options.base || 320, type: "sawtooth", duration: 0.3, volume: 0.04, slide: 1.42 });
      scheduleTone(state.audio.sfxGain, { time: time + 0.06, frequency: (options.base || 320) * 1.5, type: "triangle", duration: 0.34, volume: 0.032, slide: 0.9 });
      scheduleNoise(state.audio.sfxGain, { time: time + 0.02, volume: 0.022, duration: 0.11, frequency: 1100, q: 0.7 });
      break;
    case "martial":
      scheduleTone(state.audio.sfxGain, { time, frequency: options.base || 360, type: "triangle", duration: 0.34, volume: 0.038, slide: 1.18 });
      scheduleTone(state.audio.sfxGain, { time: time + 0.08, frequency: (options.base || 360) * 1.5, type: "sine", duration: 0.4, volume: 0.03, slide: 0.92 });
      break;
    case "pickup-treasure":
      scheduleTone(state.audio.sfxGain, { time, frequency: 760, type: "triangle", duration: 0.12, volume: 0.022 });
      break;
    case "pickup-fragment":
      scheduleTone(state.audio.sfxGain, { time, frequency: 540, type: "triangle", duration: 0.16, volume: 0.03 });
      scheduleTone(state.audio.sfxGain, { time: time + 0.08, frequency: 808, type: "sine", duration: 0.2, volume: 0.028 });
      break;
    case "learn-art":
      scheduleTone(state.audio.sfxGain, { time, frequency: 392, type: "triangle", duration: 0.24, volume: 0.035 });
      scheduleTone(state.audio.sfxGain, { time: time + 0.09, frequency: 587, type: "sine", duration: 0.34, volume: 0.032 });
      scheduleTone(state.audio.sfxGain, { time: time + 0.18, frequency: 784, type: "sine", duration: 0.44, volume: 0.03 });
      break;
    case "hurt":
      scheduleTone(state.audio.sfxGain, { time, frequency: 180, type: "sawtooth", duration: 0.18, volume: 0.03, slide: 0.66 });
      scheduleNoise(state.audio.sfxGain, { time, volume: 0.018, duration: 0.08, frequency: 760, q: 0.9 });
      break;
    case "respawn":
      scheduleTone(state.audio.sfxGain, { time, frequency: 280, type: "sine", duration: 0.4, volume: 0.03, slide: 1.52 });
      scheduleTone(state.audio.sfxGain, { time: time + 0.12, frequency: 420, type: "triangle", duration: 0.48, volume: 0.028, slide: 1.28 });
      break;
    case "checkpoint":
      scheduleTone(state.audio.sfxGain, { time, frequency: 440, type: "triangle", duration: 0.22, volume: 0.032 });
      scheduleTone(state.audio.sfxGain, { time: time + 0.1, frequency: 660, type: "sine", duration: 0.3, volume: 0.028 });
      break;
    case "boss":
      scheduleTone(state.audio.sfxGain, { time, frequency: 110, type: "sawtooth", duration: 0.34, volume: 0.042, slide: 0.54 });
      scheduleNoise(state.audio.sfxGain, { time: time + 0.01, volume: 0.024, duration: 0.14, frequency: 460, q: 0.7 });
      break;
    case "switch-art":
      scheduleTone(state.audio.sfxGain, { time, frequency: 620, type: "sine", duration: 0.12, volume: 0.024 });
      break;
    default:
      break;
  }
}

function showToast(text, color = "#fff7e8", timer = 3.2) {
  state.toast = { text, color, timer };
}

function say(speaker, text, timer = 5.8) {
  state.dialog = { speaker, text, timer };
}

function getMotionFactor() {
  return state.settings.reducedMotion ? 0.28 : 1;
}

function getBlessingRank(id) {
  return state.blessings?.[id] ?? 0;
}

function getBlessingCost(blessing) {
  const rank = getBlessingRank(blessing.id);
  return blessing.costs[rank] ?? null;
}

function getBlessingBonusText(blessing, rank = getBlessingRank(blessing.id)) {
  switch (blessing.id) {
    case "heart":
      return `心火上限 +${rank * 18}`;
    case "stride":
      return `移速 +${rank * 8}%`;
    case "edge":
      return `伤害 +${rank * 15}%`;
    case "echo":
      return `冷却 -${rank * 10}%`;
    default:
      return `等级 ${rank}`;
  }
}

function getBlessingPreviewText(blessing, rank = getBlessingRank(blessing.id)) {
  const nextRank = Math.min(blessing.maxRank, rank + 1);
  return getBlessingBonusText(blessing, nextRank);
}

function getBlessingSummaryLine() {
  return `字印：炉${getBlessingRank("heart")} 履${getBlessingRank("stride")} 锋${getBlessingRank("edge")} 息${getBlessingRank("echo")}`;
}

function getPlayerMaxHp(profession = getActiveProfession()) {
  return profession.maxHp + getBlessingRank("heart") * 18 + getEvolutionMaxHpBonus();
}

function getPlayerMoveSpeed(profession = getActiveProfession()) {
  return profession.speed * (1 + getBlessingRank("stride") * 0.08 + getEvolutionSpeedBonus());
}

function getPlayerDamageMultiplier() {
  return 1 + getBlessingRank("edge") * 0.15 + getEvolutionDamageBonus();
}

function getPlayerCooldownMultiplier() {
  return Math.max(0.4, 1 - getBlessingRank("echo") * 0.1 - getEvolutionCooldownBonus());
}

function scalePlayerDamage(baseDamage) {
  return baseDamage * getPlayerDamageMultiplier();
}

function applyCooldownReduction(baseCooldown) {
  return baseCooldown * getPlayerCooldownMultiplier();
}

function refreshPlayerDerivedStats({ refillHp = false, keepMissingHp = false } = {}) {
  const profession = getActiveProfession();
  const previousMaxHp = Number.isFinite(state.player.maxHp) ? state.player.maxHp : profession.maxHp;
  const currentHp = Number.isFinite(state.player.hp) ? state.player.hp : profession.maxHp;
  const nextMaxHp = getPlayerMaxHp(profession);

  state.player.maxHp = nextMaxHp;
  state.player.speed = getPlayerMoveSpeed(profession);

  if (refillHp) {
    state.player.hp = nextMaxHp;
    return;
  }

  if (keepMissingHp) {
    state.player.hp = clamp(currentHp + (nextMaxHp - previousMaxHp), 0, nextMaxHp);
    return;
  }

  state.player.hp = clamp(currentHp, 0, nextMaxHp);
}

function persistSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
}

function setMenuStatus(text, tone = "default") {
  menuStatus.textContent = text;
  menuStatus.dataset.tone = tone;
}

function getCurrentCheckpoint() {
  return normalizeCheckpoint(state.checkpoint);
}

function hasStoredSave() {
  // Electron 环境
  if (window.electronAPI && window.electronAPI.saveExists) {
    // 返回 false，因为是异步检查
    // 实际检查在 refreshSaveSummary 中进行
    return false;
  }
  // 浏览器环境
  return Boolean(readStorageJson(SAVE_STORAGE_KEY));
}

function formatSaveTime(value) {
  if (!value) {
    return "未知时间";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }

  return date.toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStageLabel(stage) {
  switch (stage) {
    case "meet-guide":
      return "序章";
    case "activate-landmarks":
      return "点亮遗迹";
    case "clear-corruption":
      return "净化灾字";
    case "boss-trial":
      return "村口试炼";
    case "choose-class":
      return "职业觉醒";
    case "complete":
      return "远行诸域";
    case "game-complete":
      return "字界终章";
    default:
      return "远行中";
  }
}

function refreshSaveSummary() {
  // Electron 环境
  if (window.electronAPI && window.electronAPI.readSave) {
    window.electronAPI.readSave().then((save) => {
      try {
        const available = Boolean(save);
        loadSaveButton.disabled = !available;

        if (!available) {
          saveSummary.textContent = '暂无存档。点击"进入游戏"开始新的旅程。';
          return;
        }

        const profession =
          save.player?.profession && professionMap[save.player.profession]
            ? professionMap[save.player.profession]
            : wandererProfession;
        const stageLabel = getStageLabel(save.quest?.stage);
        const currentRegionId = save.quest?.currentRegion || "village";
        const currentRegion = regionDefinitions[currentRegionId] || regionDefinitions.village;
        saveSummary.textContent = `保存于 ${formatSaveTime(save.savedAt)} · 区域：${currentRegion.name} · 职业：${profession.name} · 进度：${stageLabel}`;
      } catch (e) {
        console.error("refreshSaveSummary error:", e);
      }
    }).catch((e) => {
      console.error("readSave error:", e);
    });
    return;
  }

  // 浏览器环境
  const save = readStorageJson(SAVE_STORAGE_KEY);
  const available = Boolean(save);
  loadSaveButton.disabled = !available;

  if (!available) {
    saveSummary.textContent = '暂无存档。点击"进入游戏"开始新的旅程。';
    return;
  }

  const profession =
    save.player?.profession && professionMap[save.player.profession]
      ? professionMap[save.player.profession]
      : wandererProfession;
  const stageLabel = getStageLabel(save.quest?.stage);
  const currentRegionId = save.quest?.currentRegion || "village";
  const currentRegion = regionDefinitions[currentRegionId] || regionDefinitions.village;
  saveSummary.textContent = `保存于 ${formatSaveTime(save.savedAt)} · 区域：${currentRegion.name} · 职业：${profession.name} · 进度：${stageLabel}`;
}

function applySettingsToUi() {
  settingAutosave.checked = state.settings.autosave;
  settingReducedMotion.checked = state.settings.reducedMotion;
  settingMusic.checked = state.settings.music;
  settingSfx.checked = state.settings.sfx;
}

function updateMenuUi() {
  const titleVisible = state.menu.screen === "title";
  menuOverlay.classList.toggle("hidden", !titleVisible);
  titlePanel.classList.toggle("hidden", state.menu.settingsOpen);
  settingsPanel.classList.toggle("hidden", !state.menu.settingsOpen);
  applySettingsToUi();
  refreshSaveSummary();
  updateTouchControlsUi();
}

function getSaveSnapshot() {
  return {
    version: CURRENT_SAVE_VERSION,
    savedAt: new Date().toISOString(),
    player: {
      x: state.player.x,
      y: state.player.y,
      facingX: state.player.facingX,
      facingY: state.player.facingY,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      speed: state.player.speed,
      profession: state.player.profession,
      artCooldown: state.player.artCooldown,
      speedBoostTimer: state.player.speedBoostTimer,
    },
    camera: {
      x: state.camera.x,
      y: state.camera.y,
    },
    checkpoint: {
      ...getCurrentCheckpoint(),
    },
    cleared: state.cleared,
    shotsFired: state.shotsFired,
    quest: {
      stage: state.quest.stage,
      activationTarget: state.quest.activationTarget,
      clearTarget: state.quest.clearTarget,
      activatedLandmarks: [...state.quest.activatedLandmarks],
      bossSpawned: state.quest.bossSpawned,
      bossDefeated: state.quest.bossDefeated,
      unlockedRegions: state.quest.unlockedRegions,
      currentRegion: state.quest.currentRegion,
      regionProgress: state.quest.regionProgress,
    },
    inventory: {
      treasures: { ...state.inventory.treasures },
      treasureScore: state.inventory.treasureScore,
      fragments: { ...state.inventory.fragments },
      learnedArts: [...state.inventory.learnedArts],
      activeArt: state.inventory.activeArt,
    },
    blessings: {
      ...state.blessings,
    },
  };
}

function saveGame(showFeedback = false) {
  if (isEvolutionMode()) {
    state.menu.autosavePending = false;
    return;
  }

  const saveSnapshot = getSaveSnapshot();

  // 如果在 Electron 环境中，自动保存到本地文件
  if (window.electronAPI) {
    window.electronAPI.writeSave(saveSnapshot).then((success) => {
      if (success) {
        state.menu.autosavePending = false;
        state.menu.lastAutosaveAt = performance.now();
        if (showFeedback) {
          setMenuStatus("存档已写入本地文件。", "success");
          showToast("已保存当前进度。", "#8ce6ff", 3);
        }
      }
    });
  } else {
    // 浏览器环境，使用 localStorage
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveSnapshot));
    state.menu.autosavePending = false;
    state.menu.lastAutosaveAt = performance.now();
    refreshSaveSummary();

    if (showFeedback) {
      setMenuStatus("存档已写入，可以随时读取。", "success");
      showToast("已保存当前进度。", "#8ce6ff", 3);
    }
  }
}

function exportSave() {
  // Electron 环境使用系统对话框
  if (window.electronAPI) {
    const save = getSaveSnapshot();
    window.electronAPI.exportSave(save).then((result) => {
      if (result.success) {
        setMenuStatus("存档已导出到: " + result.filePath, "success");
        showToast("存档已导出。", "#8ce6ff", 3);
      } else if (result.filePath === null) {
        // 用户取消
      } else {
        setMenuStatus("导出失败: " + result.error, "error");
      }
    });
    return;
  }

  // 浏览器环境使用下载
  const save = getSaveSnapshot();
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `zijie-save-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setMenuStatus("存档已导出为本地文件。", "success");
  showToast("存档已导出。", "#8ce6ff", 3);
}

function importSave() {
  // Electron 环境使用系统对话框
  if (window.electronAPI) {
    window.electronAPI.importSave().then((result) => {
      if (result.success && result.saveData) {
        window.electronAPI.writeSave(result.saveData).then((writeSuccess) => {
          if (writeSuccess) {
            setMenuStatus("存档已导入，正在加载...", "success");
            showToast("存档已导入。", "#8ce6ff", 3);
            setTimeout(() => {
              location.reload();
            }, 1000);
          }
        });
      } else if (result.error) {
        setMenuStatus("导入失败: " + result.error, "error");
      }
      // 用户取消不显示错误
    });
    return;
  }

  // 浏览器环境使用文件选择
  importFileInput.click();
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const save = JSON.parse(e.target.result);
      if (!save || !save.version || !save.player) {
        setMenuStatus("导入失败：存档文件无效。", "error");
        showToast("存档文件无效。", "#ff7f67", 3);
        return;
      }
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
      setMenuStatus("存档已导入，正在加载...", "success");
      showToast("存档已导入。", "#8ce6ff", 3);
      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (err) {
      setMenuStatus("导入失败：文件解析错误。", "error");
      showToast("文件解析错误。", "#ff7f67", 3);
    }
  };
  reader.readAsText(file);
  importFileInput.value = "";
}

function queueAutoSave() {
  if (isEvolutionMode() || !state.settings.autosave || state.menu.screen !== "playing") {
    return;
  }

  state.menu.autosavePending = true;
}

function setCheckpoint(checkpoint, { showFeedback = true, saveNow = true } = {}) {
  const normalized = normalizeCheckpoint(checkpoint);
  const wasSame = checkpointEquals(state.checkpoint, normalized);
  state.checkpoint = normalized;

  if (showFeedback) {
    showToast(`${normalized.label} 已设为存档点。`, normalized.color, 3.8);
    say("存档点", "字形已经在这里留下锚点。心火归零时，你会从这里重新聚形。", 6);
  }

  if (saveNow && state.menu.screen === "playing") {
    saveGame(false);
  } else if (!wasSame) {
    queueAutoSave();
  }
}

function clearTransientWorldState() {
  state.bullets = [];
  state.enemies = [];
  state.drops = [];
  state.particles = [];
  state.effects = [];
  state.interaction = null;
  state.npcs = createNpcs(state.quest?.unlockedRegions);
  state.professionMenu.open = false;
  state.professionMenu.selected = 0;
  state.blessingMenu.open = false;
  state.blessingMenu.selected = 0;
  state.exitPrompt.open = false;
  state.exitPrompt.selected = 1;
  state.map.expanded = false;
  state.hurtPulse = 0;
  canvas.style.cursor = "default";

  clearPressedKeys();
  resetTouchMovement();
  releaseTouchAttack();
}

function resetGameState() {
  state.mode = "story";
  state.player.x = 0;
  state.player.y = 0;
  state.player.facingX = 1;
  state.player.facingY = 0;
  state.player.speed = wandererProfession.speed;
  state.player.cooldown = 0;
  state.player.skillCooldown = 0;
  state.player.artCooldown = 0;
  state.player.speedBoostTimer = 0;
  state.player.hp = wandererProfession.maxHp;
  state.player.maxHp = wandererProfession.maxHp;
  state.player.flash = 0;
  state.player.invuln = 0;
  state.player.profession = null;
  state.camera.x = 0;
  state.camera.y = 0;
  state.cleared = 0;
  state.shotsFired = 0;
  state.quest = {
    stage: "meet-guide",
    activationTarget: 3,
    clearTarget: 12,
    activatedLandmarks: new Set(),
    bossSpawned: false,
    bossDefeated: false,
    unlockedRegions: ["village"],
    currentRegion: "village",
    regionProgress: createRegionProgressState(),
  };
  state.checkpoint = getVillageCheckpoint();
  state.inventory = createInventoryState();
  state.blessings = createBlessingState();
  state.evolution = createEvolutionState();
  refreshPlayerDerivedStats({ refillHp: true });
  clearTransientWorldState();
  state.dialog = {
    speaker: "字界",
    text: "起笔村在你脚下苏醒。先去和引路人聊聊。",
    timer: 8,
  };
  state.toast = {
    text: getPrimaryControlHint(),
    color: "#fff2cb",
    timer: 8,
  };
}

function restoreSave(save) {
  resetGameState();

  state.player.x = Number.isFinite(save.player?.x) ? save.player.x : 0;
  state.player.y = Number.isFinite(save.player?.y) ? save.player.y : 0;
  state.player.facingX = Number.isFinite(save.player?.facingX) ? save.player.facingX : 1;
  state.player.facingY = Number.isFinite(save.player?.facingY) ? save.player.facingY : 0;
  state.blessings = normalizeBlessingState(save.blessings);
  state.player.profession = save.player?.profession && professionMap[save.player.profession] ? save.player.profession : null;

  refreshPlayerDerivedStats();
  state.player.hp = clamp(save.player?.hp ?? state.player.maxHp, 1, state.player.maxHp);
  state.player.artCooldown = clamp(save.player?.artCooldown ?? 0, 0, 30);
  state.player.speedBoostTimer = clamp(save.player?.speedBoostTimer ?? 0, 0, 10);
  state.camera.x = Number.isFinite(save.camera?.x) ? save.camera.x : state.player.x;
  state.camera.y = Number.isFinite(save.camera?.y) ? save.camera.y : state.player.y;
  state.checkpoint = normalizeCheckpoint(save.checkpoint);
  state.cleared = Number.isFinite(save.cleared) ? save.cleared : 0;
  state.shotsFired = Number.isFinite(save.shotsFired) ? save.shotsFired : 0;
  const savedCurrentRegion = save.quest?.currentRegion;
  const currentRegion = regionDefinitions[savedCurrentRegion] ? savedCurrentRegion : "village";
  const unlockedRegions = normalizeUnlockedRegions(
    currentRegion === "village" ? save.quest?.unlockedRegions : [...(save.quest?.unlockedRegions || []), currentRegion],
  );
  state.quest = {
    stage: save.quest?.stage || "meet-guide",
    activationTarget: Number.isFinite(save.quest?.activationTarget) ? save.quest.activationTarget : 3,
    clearTarget: Number.isFinite(save.quest?.clearTarget) ? save.quest.clearTarget : 12,
    activatedLandmarks: new Set(Array.isArray(save.quest?.activatedLandmarks) ? save.quest.activatedLandmarks : []),
    bossSpawned: Boolean(save.quest?.bossSpawned),
    bossDefeated: Boolean(save.quest?.bossDefeated),
    unlockedRegions,
    currentRegion,
    regionProgress: normalizeRegionProgress(save.quest?.regionProgress),
  };
  refreshNpcRoster();
  state.inventory = createInventoryState();

  for (const treasure of treasureTypes) {
    state.inventory.treasures[treasure.id] = Math.max(0, Math.floor(save.inventory?.treasures?.[treasure.id] ?? 0));
  }

  state.inventory.treasureScore = Math.max(0, Math.floor(save.inventory?.treasureScore ?? 0));

  for (const art of martialArts) {
    const learned = Array.isArray(save.inventory?.learnedArts) && save.inventory.learnedArts.includes(art.id);
    const rawCount = Math.max(0, Math.floor(save.inventory?.fragments?.[art.id] ?? 0));
    const fragmentTarget = getMartialArtFragmentTarget(art);
    state.inventory.fragments[art.id] = learned ? fragmentTarget : clamp(rawCount, 0, fragmentTarget);
    if (learned) {
      state.inventory.learnedArts.push(art.id);
    }
  }

  state.inventory.activeArt =
    save.inventory?.activeArt && state.inventory.learnedArts.includes(save.inventory.activeArt)
      ? save.inventory.activeArt
      : state.inventory.learnedArts[0] || null;

  if (state.player.speedBoostTimer > 0) {
    const art = martialArtMap.tafeng;
    spawnMartialEffect({
      kind: "tafeng-aura",
      x: state.player.x,
      y: state.player.y,
      color: art.color,
      glyph: art.glyph,
      life: state.player.speedBoostTimer,
      followPlayer: true,
    });
  }

  if (state.quest.stage === "choose-class" && !state.player.profession) {
    state.professionMenu.open = true;
  }

  restorePendingBosses();
}

function startNewGame() {
  resetGameState();
  state.menu.screen = "playing";
  state.menu.settingsOpen = false;
  menuOverlay.classList.add("hidden");
  setMenuStatus("新的旅程开始了。", "success");
  updateMenuUi();
}

function rollEvolutionChoices() {
  const pool = evolutionDefinitions.filter((choice) => getEvolutionRank(choice.id) < choice.maxRank);
  const choices = [];
  const available = [...pool];

  while (available.length && choices.length < Math.min(3, pool.length)) {
    const index = Math.floor(Math.random() * available.length);
    choices.push(available.splice(index, 1)[0].id);
  }

  return choices;
}

function openEvolutionMenu() {
  const choices = rollEvolutionChoices();
  if (!choices.length) {
    state.player.hp = clamp(state.player.hp + 18, 0, state.player.maxHp);
    return;
  }

  state.evolution.menuOpen = true;
  state.evolution.choices = choices;
  state.evolution.selected = 0;
  showToast(`进化阶 ${state.evolution.level}：选择一条蜕变。`, "#bfe6ff", 4.6);
  playSfx("learn-art");
}

function applyEvolutionChoice(choiceId) {
  const choice = getEvolutionChoiceById(choiceId);
  if (!choice || getEvolutionRank(choice.id) >= choice.maxRank) {
    return;
  }

  state.evolution.ranks[choice.id] += 1;
  state.evolution.menuOpen = false;
  state.evolution.choices = [];
  state.evolution.selected = 0;
  refreshPlayerDerivedStats({ keepMissingHp: choice.id === "heart" });

  if (choice.id === "heart") {
    state.player.hp = clamp(state.player.hp + 24, 0, state.player.maxHp);
    spawnCombatText(state.player.x, state.player.y - 34, "+24", choice.color, { size: 20, life: 0.82, rise: 48 });
  }

  spawnImpact(state.player.x, state.player.y, choice.color, [choice.glyph, "变", "进", "化"]);
  showToast(`进化完成：${choice.name} ${getEvolutionRank(choice.id)}/${choice.maxRank}`, choice.color, 4.2);
  say("字界", `${choice.summary}当前效果：${choice.bonus}。`, 6.4);
  tryAdvanceEvolutionLevel();
}

function confirmEvolutionChoice() {
  const choiceId = state.evolution.choices[state.evolution.selected];
  if (choiceId) {
    applyEvolutionChoice(choiceId);
  }
}

function grantEvolutionXp(amount) {
  if (!isEvolutionMode() || amount <= 0) {
    return;
  }

  state.evolution.xp += amount;
  tryAdvanceEvolutionLevel();
}

function tryAdvanceEvolutionLevel() {
  if (!isEvolutionMode() || state.evolution.menuOpen) {
    return;
  }

  while (state.evolution.xp >= state.evolution.nextXp) {
    state.evolution.xp -= state.evolution.nextXp;
    state.evolution.level += 1;
    state.evolution.nextXp = getEvolutionNextXp(state.evolution.level);
    openEvolutionMenu();
    return;
  }
}

function maybeSpawnEvolutionBoss(showFeedback = true) {
  if (!isEvolutionMode() || state.evolution.menuOpen || getBossEnemy() || state.evolution.level < state.evolution.nextBossLevel) {
    return;
  }

  const regionId = state.quest.currentRegion === "village" ? "monument" : state.quest.currentRegion;
  const region = regionDefinitions[regionId] || regionDefinitions.monument;
  const angle = Math.random() * TAU;
  const distance = 280;
  const scale = getEvolutionEnemyScale();
  const level = state.evolution.level;

  state.enemies.push({
    tier: "boss",
    evolutionBoss: true,
    region: regionId,
    name: `进化魁·${level}`,
    x: state.player.x + Math.cos(angle) * distance,
    y: state.player.y + Math.sin(angle) * distance,
    vx: 0,
    vy: 0,
    char: level >= 8 ? "劫" : "魁",
    color: region.color,
    speed: 78 * scale,
    touchDamage: Math.round(18 + level * 2.6),
    size: 66 + Math.min(18, level),
    seed: Math.random() * 1000,
    wanderAngle: 0,
    wanderTimer: 1,
    hp: Math.round((38 + level * 12) * scale),
    maxHp: Math.round((38 + level * 12) * scale),
    skillTimer: Math.max(1.35, 2.3 - level * 0.04),
    skillInterval: Math.max(1.35, 2.3 - level * 0.04),
    summonTimer: Math.max(2.8, 4.2 - level * 0.05),
    summonInterval: Math.max(2.8, 4.2 - level * 0.05),
    attackCooldown: 0.22,
  });

  if (showFeedback) {
    showToast(`进化魁降临：第 ${state.evolution.nextBossLevel} 阶试炼开始。`, region.color, 5.2);
    say("字界", "更深一层的灾字开始反写你了。先镇住这头进化魁。", 6.8);
    playSfx("boss");
  }
}

function handleEvolutionBossDefeat(enemy) {
  state.evolution.bossesDefeated += 1;
  state.evolution.nextBossLevel += 4;
  grantEvolutionXp(8 + Math.floor(state.evolution.level * 0.5));
  showToast(`${enemy.name} 已被镇落。下一头会在第 ${state.evolution.nextBossLevel} 阶出现。`, enemy.color, 5.2);
  say("字界", "你压住了这一轮异变，但字界还会继续试探你。", 6.4);
}

function startEvolutionMode() {
  resetGameState();
  state.mode = "evolution";
  state.evolution.active = true;
  state.evolution.level = 1;
  state.evolution.xp = 0;
  state.evolution.nextXp = getEvolutionNextXp(1);
  state.evolution.elapsed = 0;
  state.evolution.bossesDefeated = 0;
  state.evolution.nextBossLevel = 4;
  state.quest.stage = "complete";
  state.quest.unlockedRegions = [...regionOrder];
  state.quest.currentRegion = "monument";
  state.player.x = regionDefinitions.monument.centerX;
  state.player.y = regionDefinitions.monument.centerY;
  state.camera.x = state.player.x;
  state.camera.y = state.player.y;
  state.checkpoint = {
    id: "evolution-core",
    label: "进化战场",
    x: state.player.x,
    y: state.player.y,
    color: "#bfe6ff",
    glyph: "进",
  };
  refreshNpcRoster();
  state.menu.screen = "playing";
  state.menu.settingsOpen = false;
  menuOverlay.classList.add("hidden");
  state.dialog = {
    speaker: "字界",
    text: "进化模式开始。击破灾字积累字魄，每次进阶都能重写自己。",
    timer: 7.2,
  };
  state.toast = {
    text: "进化模式：选择职业后开始生存。达到下一阶会出现三选一蜕变。",
    color: "#bfe6ff",
    timer: 6.2,
  };
  setMenuStatus("进化模式已启动。该模式不会覆盖主线存档。", "success");
  updateMenuUi();
  openProfessionMenu();
}

function endEvolutionRun(reason = "心火熄灭") {
  const summary = `${reason} · 存活 ${formatRunDuration(state.evolution.elapsed)} · 进化阶 ${state.evolution.level} · 击破 ${state.cleared} · 首领 ${state.evolution.bossesDefeated}`;
  state.menu.autosavePending = false;
  state.menu.screen = "title";
  state.menu.settingsOpen = false;
  state.professionMenu.open = false;
  state.blessingMenu.open = false;
  state.exitPrompt.open = false;
  state.map.expanded = false;
  state.evolution.menuOpen = false;
  state.evolution.active = false;
  state.mode = "story";
  state.interaction = null;
  canvas.style.cursor = "default";
  setMenuStatus(summary, "warning");
  updateMenuUi();
  playSfx("menu");
}

function loadSavedGame() {
  // Electron 环境
  if (window.electronAPI && window.electronAPI.readSave) {
    window.electronAPI.readSave().then((save) => {
      try {
        if (!save) {
          setMenuStatus("当前没有可读取的存档。", "warning");
          return;
        }
        restoreSave(save);
        state.menu.screen = "playing";
        state.menu.settingsOpen = false;
        menuOverlay.classList.add("hidden");
        updateMenuUi();
        showToast("已读取存档。", "#8ce6ff", 3.2);
        say("字界", "你曾写下的痕迹已经回来了。", 5.4);
      } catch (e) {
        console.error("loadSavedGame error:", e);
        setMenuStatus("读取存档失败。", "error");
      }
    }).catch((e) => {
      console.error("readSave error:", e);
      setMenuStatus("读取存档失败。", "error");
    });
    return;
  }

  // 浏览器环境
  const save = readStorageJson(SAVE_STORAGE_KEY);
  if (!save) {
    setMenuStatus("当前没有可读取的存档。", "warning");
    return;
  }

  restoreSave(save);
  state.menu.screen = "playing";
  state.menu.settingsOpen = false;
  menuOverlay.classList.add("hidden");
  updateMenuUi();
  showToast("已读取存档。", "#8ce6ff", 3.2);
  say("字界", "你曾写下的痕迹已经回来了。", 5.4);
}

function openExitPrompt() {
  if (state.menu.screen !== "playing" || state.exitPrompt.open) {
    return;
  }

  state.exitPrompt.open = true;
  state.exitPrompt.selected = 1;
  showToast("退出确认已打开。", "#ffe4bf", 2.4);
  playSfx("menu");
}

function closeExitPrompt() {
  if (!state.exitPrompt.open) {
    return;
  }

  state.exitPrompt.open = false;
  state.exitPrompt.selected = 1;
  playSfx("menu");
}

function exitToTitleWithoutSaving() {
  const wasEvolution = isEvolutionMode();
  state.menu.autosavePending = false;
  state.menu.screen = "title";
  state.menu.settingsOpen = false;
  state.blessingMenu.open = false;
  state.exitPrompt.open = false;
  state.exitPrompt.selected = 1;
  state.map.expanded = false;
  state.evolution.menuOpen = false;
  if (wasEvolution) {
    state.evolution.active = false;
    state.mode = "story";
  }
  state.interaction = null;
  canvas.style.cursor = "default";

  for (const code of Object.keys(keys)) {
    keys[code] = false;
  }

  setMenuStatus(wasEvolution ? "已结束当前进化轮次。该模式不会写入主线存档。" : "已返回开始界面。当前未保存进度已丢弃。", "warning");
  updateMenuUi();
  playSfx("menu");
}

function confirmExitPrompt() {
  if (state.exitPrompt.selected === 0) {
    exitToTitleWithoutSaving();
    return;
  }

  closeExitPrompt();
}

function openWorldMap() {
  if (
    state.menu.screen !== "playing" ||
    state.professionMenu.open ||
    state.blessingMenu.open ||
    state.evolution.menuOpen ||
    state.exitPrompt.open ||
    state.map.expanded
  ) {
    return;
  }

  state.map.expanded = true;
  clearPressedKeys();
  resetTouchMovement();
  releaseTouchAttack();
  showToast("大地图已展开。按 M 或点击右上角关闭。", "#d7efff", 2.8);
  playSfx("menu");
}

function closeWorldMap(playSound = true) {
  if (!state.map.expanded) {
    return;
  }

  state.map.expanded = false;
  canvas.style.cursor = "default";
  clearPressedKeys();
  resetTouchMovement();
  releaseTouchAttack();

  if (playSound) {
    playSfx("menu");
  }
}

function toggleWorldMap() {
  if (state.map.expanded) {
    closeWorldMap();
  } else {
    openWorldMap();
  }
}

function openSettings() {
  state.menu.settingsOpen = true;
  updateMenuUi();
}

function closeSettings() {
  state.menu.settingsOpen = false;
  updateMenuUi();
}

function openBlessingMenu() {
  if (state.blessingMenu.open) {
    return;
  }

  state.blessingMenu.open = true;
  state.blessingMenu.selected = clamp(state.blessingMenu.selected, 0, blessingDefinitions.length - 1);
  showToast(
    supportsTouchInput() ? "字印台已展开。点击卡片选择，点右下按钮拓印。" : "字印台已展开。方向键选择，Enter 购买，Esc 返回。",
    "#d9c8ab",
    4.2,
  );
  playSfx("menu");
}

function closeBlessingMenu(playSound = true) {
  if (!state.blessingMenu.open) {
    return;
  }

  state.blessingMenu.open = false;
  if (playSound) {
    playSfx("menu");
  }
}

function selectBlessing(index) {
  if (index < 0 || index >= blessingDefinitions.length) {
    return;
  }

  if (state.blessingMenu.selected !== index) {
    state.blessingMenu.selected = index;
    playSfx("menu");
  }
}

function moveBlessingSelection(delta) {
  const total = blessingDefinitions.length;
  if (!total) {
    return;
  }

  const nextIndex = (state.blessingMenu.selected + delta + total) % total;
  selectBlessing(nextIndex);
}

function purchaseSelectedBlessing() {
  const blessing = blessingDefinitions[state.blessingMenu.selected];
  if (!blessing) {
    return;
  }

  const rank = getBlessingRank(blessing.id);
  if (rank >= blessing.maxRank) {
    showToast(`${blessing.name} 已臻满阶。`, blessing.color, 2.8);
    say("碑书记", `这枚${blessing.name}已经拓到极致了。`, 5.8);
    playSfx("menu");
    return;
  }

  const cost = getBlessingCost(blessing);
  if (!Number.isFinite(cost) || state.inventory.treasureScore < cost) {
    const shortage = Math.max(0, (cost || 0) - state.inventory.treasureScore);
    showToast(`宝物值不足，还差 ${shortage}。`, "#ffb29c", 3.2);
    say("碑书记", "这道字印还缺些宝气。再带些战利品来吧。", 5.8);
    playSfx("menu");
    return;
  }

  state.inventory.treasureScore -= cost;
  state.blessings[blessing.id] = rank + 1;
  refreshPlayerDerivedStats({ keepMissingHp: blessing.id === "heart" });
  spawnImpact(state.player.x, state.player.y, blessing.color, [blessing.glyph, "印", "铭", "光"]);
  spawnCombatText(state.player.x, state.player.y - 34, `${blessing.name} ${rank + 1}/${blessing.maxRank}`, blessing.color, {
    size: 18,
    life: 0.9,
    rise: 52,
  });
  showToast(`已拓成 ${blessing.name}。${getBlessingBonusText(blessing)}`, blessing.color, 4.6);
  say("碑书记", `${blessing.summary}当前 ${getBlessingBonusText(blessing)}。`, 6.6);
  playSfx("learn-art");
  queueAutoSave();
}

function refreshNpcRoster() {
  state.npcs = createNpcs(state.quest?.unlockedRegions);
}

function makeLandmarkId(landmark) {
  return `${landmark.name}:${landmark.cellX}:${landmark.cellY}`;
}

function getActiveProfession() {
  return state.player.profession ? professionMap[state.player.profession] : wandererProfession;
}

function isEvolutionMode() {
  return state.mode === "evolution" && state.evolution.active;
}

function getBossEnemy() {
  if (isEvolutionMode()) {
    return state.enemies.find((enemy) => enemy.tier === "boss" && enemy.evolutionBoss) || null;
  }

  if (state.quest.stage === "boss-trial") {
    return state.enemies.find((enemy) => enemy.tier === "boss" && (!enemy.region || enemy.region === "village")) || null;
  }

  const currentRegion = state.quest.currentRegion || "village";
  return state.enemies.find((enemy) => enemy.tier === "boss" && enemy.region === currentRegion) || null;
}

function getEvolutionRank(id) {
  return state.evolution?.ranks?.[id] ?? 0;
}

function getEvolutionChoiceById(id) {
  return evolutionDefinitions.find((choice) => choice.id === id) || null;
}

function getEvolutionMaxHpBonus() {
  return getEvolutionRank("heart") * 20;
}

function getEvolutionSpeedBonus() {
  return getEvolutionRank("stride") * 0.07;
}

function getEvolutionDamageBonus() {
  return getEvolutionRank("edge") * 0.12;
}

function getEvolutionCooldownBonus() {
  return getEvolutionRank("echo") * 0.06;
}

function getEvolutionMagnetRadiusBonus() {
  return getEvolutionRank("magnet") * 28;
}

function getEvolutionFragmentLuckBonus() {
  return getEvolutionRank("magnet") * 0.05;
}

function getEvolutionKillHealBonus(enemy = null) {
  const base = getEvolutionRank("siphon");
  if (!enemy) {
    return base;
  }
  return enemy.tier === "boss" ? base * 4 : enemy.tier === "elite" ? base * 2 : base;
}

function getTreasureMagnetRadius() {
  return TREASURE_MAGNET_RADIUS + getEvolutionMagnetRadiusBonus();
}

function formatRunDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

function getEvolutionNextXp(level) {
  return 10 + Math.floor((level - 1) * 6 + Math.max(0, level - 4) * 1.5);
}

function getEvolutionEnemyScale() {
  if (!isEvolutionMode()) {
    return 1;
  }

  return 1 + Math.max(0, state.evolution.level - 1) * 0.08 + state.evolution.bossesDefeated * 0.04;
}

function getAvailableEnemyKinds(regionId) {
  if (regionId !== "village" && regionEnemyKinds[regionId]) {
    return regionEnemyKinds[regionId];
  }

  return enemyKinds;
}

function grantStarterMartialArt(artId = "liuyun") {
  const art = martialArtMap[artId];
  if (!art) {
    return;
  }

  state.inventory.fragments[art.id] = getMartialArtFragmentTarget(art);
  if (!state.inventory.learnedArts.includes(art.id)) {
    state.inventory.learnedArts.push(art.id);
  }
  state.inventory.activeArt = art.id;
}

function isMartialArtDropUnlocked(art) {
  if (isEvolutionMode()) {
    return state.evolution.level >= (art?.evolutionLevel ?? 1);
  }

  if (!art?.unlockRegion || art.unlockRegion === "village") {
    return true;
  }

  return state.quest.unlockedRegions.includes(art.unlockRegion);
}

function getMartialArtStatusText(art) {
  if (state.inventory.learnedArts.includes(art.id)) {
    return state.inventory.activeArt === art.id ? "已学·当前" : "已学";
  }

  if (!isMartialArtDropUnlocked(art)) {
    const region = regionDefinitions[art.unlockRegion];
    return region ? `需抵达${region.name}` : "未现世";
  }

  return `${state.inventory.fragments[art.id]}/${getMartialArtFragmentTarget(art)}`;
}

function findNearestEnemy(x, y, maxDistance = Infinity) {
  let nearest = null;

  for (const enemy of state.enemies) {
    const distance = Math.hypot(enemy.x - x, enemy.y - y);
    if (distance > maxDistance) {
      continue;
    }

    if (!nearest || distance < nearest.distance) {
      nearest = { enemy, distance };
    }
  }

  return nearest;
}

function getAimDirection() {
  const facing = normalizeVector(state.player.facingX, state.player.facingY);
  if (facing.x || facing.y) {
    return facing;
  }

  const nearest = findNearestEnemy(state.player.x, state.player.y, 500);
  if (nearest) {
    return normalizeVector(nearest.enemy.x - state.player.x, nearest.enemy.y - state.player.y);
  }

  return { x: 1, y: 0 };
}

function getVillageTile(tileX, tileY) {
  const ax = Math.abs(tileX);
  const ay = Math.abs(tileY);
  const ring = Math.max(ax, ay);
  if (ring > 5) {
    return null;
  }

  if (ax === 5 || ay === 5) {
    return {
      glyph: (tileX + tileY) % 2 === 0 ? "竹" : "灯",
      color: "#7fd78d",
      speed: 1.04,
      village: true,
      landmark: null,
      strong: false,
      activated: false,
    };
  }

  if (tileX === 0 && tileY === 0) {
    return {
      glyph: "坊",
      color: "#ffe1a1",
      speed: 1.08,
      village: true,
      landmark: null,
      strong: true,
      activated: true,
    };
  }

  if (tileX === 0 || tileY === 0) {
    return {
      glyph: "路",
      color: "#d6bf92",
      speed: 1.08,
      village: true,
      landmark: null,
      strong: false,
      activated: false,
    };
  }

  if ((ax === 2 && ay === 2) || (ax === 3 && ay === 1) || (ax === 1 && ay === 3)) {
    return {
      glyph: "舍",
      color: "#f1c488",
      speed: 1.02,
      village: true,
      landmark: null,
      strong: false,
      activated: false,
    };
  }

  if ((ax === 4 && ay === 2) || (ax === 2 && ay === 4) || (ax === 3 && ay === 3)) {
    return {
      glyph: "墙",
      color: "#90adbd",
      speed: 0.98,
      village: true,
      landmark: null,
      strong: false,
      activated: false,
    };
  }

  return {
    glyph: hash2(tileX, tileY, 101) > 0.48 ? "庭" : "井",
    color: hash2(tileX, tileY, 73) > 0.52 ? "#d9c89f" : "#a9d9b2",
    speed: 1.04,
    village: true,
    landmark: null,
    strong: false,
    activated: false,
  };
}

function getLandmarkForCell(cellX, cellY) {
  if (Math.hypot(cellX, cellY) < 1.7 || hash2(cellX, cellY, 91) < 0.968) {
    return null;
  }

  const type = landmarkTypes[Math.floor(hash2(cellX, cellY, 13) * landmarkTypes.length)];
  const offsetX = 4 + Math.floor(hash2(cellX, cellY, 17) * (LANDMARK_STRIDE - 8));
  const offsetY = 4 + Math.floor(hash2(cellX, cellY, 27) * (LANDMARK_STRIDE - 8));
  const landmark = {
    ...type,
    cellX,
    cellY,
    tileX: cellX * LANDMARK_STRIDE + offsetX,
    tileY: cellY * LANDMARK_STRIDE + offsetY,
  };

  landmark.id = makeLandmarkId(landmark);
  landmark.x = landmark.tileX * TILE_SIZE;
  landmark.y = landmark.tileY * TILE_SIZE;
  return landmark;
}

function isLandmarkActivated(landmark) {
  return state.quest.activatedLandmarks.has(landmark.id);
}

function getLandmarkTile(tileX, tileY) {
  const baseCellX = Math.floor(tileX / LANDMARK_STRIDE);
  const baseCellY = Math.floor(tileY / LANDMARK_STRIDE);

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const landmark = getLandmarkForCell(baseCellX + offsetX, baseCellY + offsetY);
      if (!landmark) {
        continue;
      }

      const dx = tileX - landmark.tileX;
      const dy = tileY - landmark.tileY;
      const reach = Math.max(Math.abs(dx), Math.abs(dy));
      if (reach > 2) {
        continue;
      }

      const activated = isLandmarkActivated(landmark);
      const activeColor = activated ? "#fff0b4" : landmark.color;

      if (dx === 0 && dy === 0) {
        return {
          glyph: landmark.core,
          color: activeColor,
          speed: 1.08,
          landmark,
          strong: true,
          activated,
          village: false,
        };
      }

      const ringIndex = Math.abs(dx * 7 + dy * 11) % landmark.ring.length;
      return {
        glyph: activated && reach === 1 ? "辉" : landmark.ring[ringIndex],
        color: activeColor,
        speed: 1.03,
        landmark,
        strong: false,
        activated,
        village: false,
      };
    }
  }

  return null;
}

function getRegionAtPosition(x, y) {
  const tileX = x / TILE_SIZE;
  const tileY = y / TILE_SIZE;

  for (const regionId of regionOrder) {
    const region = regionDefinitions[regionId];
    if (!region || regionId === "village") continue;

    const dx = tileX - region.centerX / TILE_SIZE;
    const dy = tileY - region.centerY / TILE_SIZE;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < region.radius / TILE_SIZE) {
      return regionId;
    }
  }

  return "village";
}

function generateRegionTerrainTile(tileX, tileY, regionId) {
  const regionStyles = regionTerrainStyles[regionId];
  if (!regionStyles) {
    // Fallback to default grass
    return {
      glyph: terrainStyles.grass.glyphs[0],
      color: terrainStyles.grass.color,
      speed: terrainStyles.grass.speed,
      landmark: null,
      strong: false,
      activated: false,
      village: false,
    };
  }

  const styleKeys = Object.keys(regionStyles);
  const styleIndex = Math.floor(hash2(tileX, tileY, 17 + regionId.length) * styleKeys.length);
  const styleKey = styleKeys[styleIndex] || styleKeys[0];
  const style = regionStyles[styleKey];

  const variant = Math.floor(hash2(tileX, tileY, 31) * style.glyphs.length);

  return {
    glyph: style.glyphs[variant],
    color: style.color,
    speed: style.speed,
    landmark: null,
    strong: false,
    activated: false,
    village: false,
  };
}

function getTerrainTile(tileX, tileY) {
  const villageTile = getVillageTile(tileX, tileY);
  if (villageTile) {
    return villageTile;
  }

  const landmarkTile = getLandmarkTile(tileX, tileY);
  if (landmarkTile) {
    return landmarkTile;
  }

  const worldX = tileX * TILE_SIZE;
  const worldY = tileY * TILE_SIZE;
  const regionId = getRegionAtPosition(worldX, worldY);

  // Generate region-specific terrain
  if (regionId !== "village" && regionTerrainStyles[regionId]) {
    return generateRegionTerrainTile(tileX, tileY, regionId);
  }

  // Default terrain generation
  const elevation = fbm(tileX * 0.055, tileY * 0.055, 1);
  const humidity = fbm(tileX * 0.08 + 90, tileY * 0.08 - 43, 2);
  const river = fbm(tileX * 0.03 - 140, tileY * 0.03 + 320, 7);
  const blossom = fbm(tileX * 0.11 + 32, tileY * 0.11 - 12, 19);
  const riverBand = Math.abs(river - 0.5);

  let style = terrainStyles.grass;
  if (elevation < 0.19) {
    style = terrainStyles.deepWater;
  } else if (riverBand < 0.032 || elevation < 0.28) {
    style = terrainStyles.water;
  } else if (elevation > 0.74) {
    style = terrainStyles.stone;
  } else if (humidity > 0.58) {
    style = terrainStyles.forest;
  } else if (humidity < 0.34) {
    style = terrainStyles.sand;
  }

  if (style === terrainStyles.grass && blossom > 0.62) {
    style = terrainStyles.bloom;
  }

  const variant = Math.floor(hash2(tileX, tileY, 31) * style.glyphs.length);
  return {
    glyph: style.glyphs[variant],
    color: style.color,
    speed: style.speed,
    landmark: null,
    strong: false,
    activated: false,
    village: false,
  };
}

function getTerrainSpeedAt(x, y) {
  const tileX = Math.round(x / TILE_SIZE);
  const tileY = Math.round(y / TILE_SIZE);
  return getTerrainTile(tileX, tileY).speed;
}

function getNearbyLandmarks(cellRadius = 4) {
  const tileX = Math.round(state.player.x / TILE_SIZE);
  const tileY = Math.round(state.player.y / TILE_SIZE);
  const cellX = Math.floor(tileX / LANDMARK_STRIDE);
  const cellY = Math.floor(tileY / LANDMARK_STRIDE);
  const seen = new Set();
  const landmarks = [];

  for (let offsetY = -cellRadius; offsetY <= cellRadius; offsetY += 1) {
    for (let offsetX = -cellRadius; offsetX <= cellRadius; offsetX += 1) {
      const landmark = getLandmarkForCell(cellX + offsetX, cellY + offsetY);
      if (!landmark || seen.has(landmark.id)) {
        continue;
      }

      seen.add(landmark.id);
      landmark.distance = Math.hypot(landmark.x - state.player.x, landmark.y - state.player.y);
      landmarks.push(landmark);
    }
  }

  landmarks.sort((a, b) => a.distance - b.distance);
  return landmarks;
}

function getNearestLandmark(maxDistance = Infinity) {
  return getNearbyLandmarks(4).find((landmark) => landmark.distance <= maxDistance) || null;
}

function getNearbyNpc(maxDistance = NPC_INTERACT_RADIUS) {
  let nearest = null;

  for (const npc of state.npcs) {
    const distance = Math.hypot(npc.x - state.player.x, npc.y - state.player.y);
    if (distance > maxDistance) {
      continue;
    }

    if (!nearest || distance < nearest.distance) {
      nearest = { ...npc, distance };
    }
  }

  return nearest;
}

function findNpcById(id) {
  return state.npcs.find((npc) => npc.id === id) || null;
}

function getNearestUnactivatedLandmark(searchRadius = 10) {
  for (let radius = 4; radius <= searchRadius; radius += 2) {
    const landmark = getNearbyLandmarks(radius).find((candidate) => !isLandmarkActivated(candidate));
    if (landmark) {
      return landmark;
    }
  }

  return null;
}

function getNearbyCheckpoint(maxDistance = LANDMARK_INTERACT_RADIUS) {
  let nearest = null;
  const villageCheckpoint = getVillageCheckpoint();
  const villageDistance = Math.hypot(villageCheckpoint.x - state.player.x, villageCheckpoint.y - state.player.y);

  if (villageDistance <= maxDistance) {
    nearest = { ...villageCheckpoint, distance: villageDistance };
  }

  for (const landmark of getNearbyLandmarks(4)) {
    if (!isLandmarkActivated(landmark) || landmark.distance > maxDistance) {
      continue;
    }

    const checkpoint = {
      ...checkpointFromLandmark(landmark),
      distance: landmark.distance,
    };

    if (!nearest || checkpoint.distance < nearest.distance) {
      nearest = checkpoint;
    }
  }

  return nearest;
}

function getInteractionTarget() {
  if (state.professionMenu.open || state.blessingMenu.open || state.evolution.menuOpen) {
    return null;
  }

  const npc = getNearbyNpc();
  const nearestLandmark = getNearestLandmark(LANDMARK_INTERACT_RADIUS);
  const landmark = nearestLandmark && !isLandmarkActivated(nearestLandmark) ? nearestLandmark : null;
  const checkpoint = getNearbyCheckpoint();
  const candidates = [];

  if (npc) {
    candidates.push({ type: "npc", npc, distance: npc.distance });
  }

  if (landmark) {
    candidates.push({ type: "landmark", landmark, distance: landmark.distance });
  }

  if (checkpoint) {
    candidates.push({ type: "checkpoint", checkpoint, distance: checkpoint.distance });
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0] || null;
}

function getInteractionPromptSpec(target) {
  if (target.type === "npc") {
    if (target.npc.id === "scribe") {
      return { text: "K 拓印强化", width: 132 };
    }
    return { text: "K 交谈", width: 104 };
  }

  if (isEvolutionMode()) {
    if (target.type === "checkpoint") {
      const used = state.evolution.usedAnchors.has(target.checkpoint.id);
      return { text: used ? "K 观测锚迹" : "K 汲火稳形", width: used ? 146 : 150 };
    }

    return { text: "K 收束锚迹", width: 138 };
  }

  if (target.type === "checkpoint") {
    return { text: "K 设为存档点", width: 142 };
  }

  return { text: "K 点亮", width: 104 };
}

function getQuestStageName() {
  if (isEvolutionMode()) {
    return `进化模式 · 第 ${state.evolution.level} 阶`;
  }

  switch (state.quest.stage) {
    case "meet-guide":
      return "序章";
    case "activate-landmarks":
      return "点亮遗迹";
    case "clear-corruption":
      return "净化灾字";
    case "boss-trial":
      return "村口试炼";
    case "choose-class":
      return "职业觉醒";
    case "complete":
      return "远行诸域";
    case "game-complete":
      return "字界终章";
    default:
      return "远行开始";
  }
}

function getQuestObjectiveText() {
  if (isEvolutionMode()) {
    return getBossEnemy()
      ? "击败进化魁，守住这一阶的写法。"
      : "击破灾字积累字魄，每达到新一阶就从三条异文中选择一种。";
  }

  switch (state.quest.stage) {
    case "meet-guide":
      return "和起笔村的引路人交谈。";
    case "activate-landmarks":
      return `点亮 ${state.quest.activationTarget} 座遗迹。`;
    case "clear-corruption":
      return `净化 ${state.quest.clearTarget} 个灾字。`;
    case "boss-trial":
      return "击败村口的试字魁。";
    case "choose-class":
      return "按 1/2/3 选择职业并确认。";
    case "complete": {
      const currentRegion = state.quest.currentRegion;
      const region = regionDefinitions[currentRegion];
      const regionProgress = state.quest.regionProgress[currentRegion];

      if (currentRegion !== "village" && region && regionProgress && !regionProgress.bossDefeated) {
        if (regionProgress.cleared >= region.questTarget) {
          return `击败 ${region.name} 的 ${region.bossName}。`;
        }
        return `在 ${region.name} 净化 ${region.questTarget} 个灾字。`;
      }

      return "前往已解锁区域，与守门人交谈继续远行。";
    }
    case "game-complete":
      return "字界已完整书成。";
    default:
      return "搜集宝物与秘技碎片，继续探索字界。";
  }
}

function getQuestProgressText() {
  if (isEvolutionMode()) {
    const boss = getBossEnemy();
    return boss
      ? `${boss.name} ${Math.ceil(boss.hp)}/${boss.maxHp}`
      : `${state.evolution.xp}/${state.evolution.nextXp}`;
  }

  if (state.quest.stage === "activate-landmarks") {
    return `${state.quest.activatedLandmarks.size}/${state.quest.activationTarget}`;
  }

  if (state.quest.stage === "clear-corruption") {
    return `${Math.min(state.cleared, state.quest.clearTarget)}/${state.quest.clearTarget}`;
  }

  if (state.quest.stage === "boss-trial") {
    const boss = getBossEnemy();
    return boss ? `${Math.ceil(boss.hp)}/${boss.maxHp}` : state.quest.bossDefeated ? "1/1" : "0/1";
  }

  if (state.quest.stage === "choose-class") {
    return "待选择";
  }

  if (state.quest.stage === "game-complete") {
    return "已完成";
  }

  if (state.quest.stage === "complete" && state.quest.currentRegion === "village") {
    const nextRegionId = regionOrder.find(
      (regionId) =>
        regionId !== "village" &&
        state.quest.unlockedRegions.includes(regionId) &&
        !state.quest.regionProgress[regionId]?.bossDefeated,
    );
    return nextRegionId ? `下一站：${regionDefinitions[nextRegionId].name}` : "自由探索";
  }

  // Show region progress when in a region other than village
  const currentRegion = state.quest.currentRegion;
  if (currentRegion !== "village" && state.quest.unlockedRegions.includes(currentRegion)) {
    const regionProgress = state.quest.regionProgress[currentRegion];
    const region = regionDefinitions[currentRegion];
    if (regionProgress && region) {
      if (regionProgress.bossDefeated) {
        return `${region.name}已征服`;
      }
      return `${regionProgress.cleared}/${region.questTarget}`;
    }
  }

  if (state.player.profession) {
    return professionMap[state.player.profession].name;
  }

  return "0/1";
}

function getQuestRouteTarget() {
  if (state.professionMenu.open || state.blessingMenu.open || state.evolution.menuOpen) {
    return null;
  }

  if (isEvolutionMode()) {
    const boss = getBossEnemy();
    if (boss) {
      return {
        x: boss.x,
        y: boss.y,
        distance: Math.hypot(boss.x - state.player.x, boss.y - state.player.y),
        label: boss.name,
        subtitle: "进化首领已现身",
        color: boss.color,
        glyph: boss.char,
      };
    }

    const nearestEnemy = findNearestEnemy(state.player.x, state.player.y, Infinity);
    if (nearestEnemy) {
      return {
        x: nearestEnemy.enemy.x,
        y: nearestEnemy.enemy.y,
        distance: nearestEnemy.distance,
        label: "灾字潮",
        subtitle: `字魄 ${state.evolution.xp}/${state.evolution.nextXp}`,
        color: nearestEnemy.enemy.color,
        glyph: nearestEnemy.enemy.char,
      };
    }

    const region = regionDefinitions[state.quest.currentRegion] || regionDefinitions.monument;
    return {
      x: region.centerX,
      y: region.centerY,
      distance: Math.hypot(region.centerX - state.player.x, region.centerY - state.player.y),
      label: region.name,
      subtitle: "向异变更深处推进",
      color: region.color,
      glyph: "进",
    };
  }

  if (state.quest.stage === "meet-guide") {
    const guide = findNpcById("guide");
    return guide
      ? {
          x: guide.x,
          y: guide.y,
          distance: Math.hypot(guide.x - state.player.x, guide.y - state.player.y),
          label: guide.name,
          subtitle: "前往引路人处",
          color: guide.color,
          glyph: guide.char,
        }
      : null;
  }

  if (state.quest.stage === "activate-landmarks") {
    const landmark = getNearestUnactivatedLandmark();
    return landmark
      ? {
          x: landmark.x,
          y: landmark.y,
          distance: landmark.distance,
          label: landmark.name,
          subtitle: "前往未点亮遗迹",
          color: landmark.color,
          glyph: landmark.core,
        }
      : null;
  }

  if (state.quest.stage === "clear-corruption") {
    const nearestEnemy = findNearestEnemy(state.player.x, state.player.y, Infinity);
    if (nearestEnemy) {
      return {
        x: nearestEnemy.enemy.x,
        y: nearestEnemy.enemy.y,
        distance: nearestEnemy.distance,
        label: nearestEnemy.enemy.tier === "elite" ? "精英灾字" : "灾字",
        subtitle: "前往净化目标",
        color: nearestEnemy.enemy.color,
        glyph: nearestEnemy.enemy.char,
      };
    }

    const fallbackY = -(SAFE_ZONE_RADIUS + 260);
    return {
      x: 0,
      y: fallbackY,
      distance: Math.hypot(state.player.x, state.player.y - fallbackY),
      label: "灾字踪迹",
      subtitle: "离开村口寻找灾字",
      color: "#ffb988",
      glyph: "灾",
    };
  }

  if (state.quest.stage === "boss-trial") {
    const boss = getBossEnemy();
    if (boss) {
      return {
        x: boss.x,
        y: boss.y,
        distance: Math.hypot(boss.x - state.player.x, boss.y - state.player.y),
        label: boss.name,
        subtitle: "前往首领试炼",
        color: boss.color,
        glyph: boss.char,
      };
    }

    const bossY = -(SAFE_ZONE_RADIUS + 320);
    return {
      x: 0,
      y: bossY,
      distance: Math.hypot(state.player.x, state.player.y - bossY),
      label: "试炼场",
      subtitle: "前往村口试炼",
      color: "#ffb988",
      glyph: "魁",
    };
  }

  if (state.quest.stage === "choose-class") {
    const guide = findNpcById("guide");
    return guide
      ? {
          x: guide.x,
          y: guide.y,
          distance: Math.hypot(guide.x - state.player.x, guide.y - state.player.y),
          label: "职业觉醒",
          subtitle: "返回引路人附近",
          color: "#fff0b4",
          glyph: "门",
        }
      : null;
  }

  if (state.quest.stage === "complete") {
    const currentRegion = state.quest.currentRegion;
    const currentRegionDefinition = regionDefinitions[currentRegion];
    const regionProgress = state.quest.regionProgress[currentRegion];

    if (currentRegion !== "village" && currentRegionDefinition && regionProgress && !regionProgress.bossDefeated) {
      const regionBoss = state.enemies.find((enemy) => enemy.tier === "boss" && enemy.region === currentRegion);
      if (regionBoss) {
        return {
          x: regionBoss.x,
          y: regionBoss.y,
          distance: Math.hypot(regionBoss.x - state.player.x, regionBoss.y - state.player.y),
          label: regionBoss.name,
          subtitle: `征服 ${currentRegionDefinition.name}`,
          color: regionBoss.color,
          glyph: regionBoss.char,
        };
      }

      if (regionProgress.cleared >= currentRegionDefinition.questTarget) {
        return {
          x: currentRegionDefinition.centerX,
          y: currentRegionDefinition.centerY,
          distance: Math.hypot(currentRegionDefinition.centerX - state.player.x, currentRegionDefinition.centerY - state.player.y),
          label: currentRegionDefinition.bossName,
          subtitle: `${currentRegionDefinition.name} 的首领已苏醒`,
          color: currentRegionDefinition.color,
          glyph: "魁",
        };
      }

      const nearestEnemy = findNearestEnemy(state.player.x, state.player.y, Infinity);
      if (nearestEnemy) {
        return {
          x: nearestEnemy.enemy.x,
          y: nearestEnemy.enemy.y,
          distance: nearestEnemy.distance,
          label: currentRegionDefinition.name,
          subtitle: `净化灾字 ${regionProgress.cleared}/${currentRegionDefinition.questTarget}`,
          color: currentRegionDefinition.color,
          glyph: nearestEnemy.enemy.char,
        };
      }
    }

    const nextRegionId = regionOrder.find(
      (regionId) =>
        regionId !== "village" &&
        state.quest.unlockedRegions.includes(regionId) &&
        !state.quest.regionProgress[regionId]?.bossDefeated,
    );
    const gatekeeper = gatekeeperDefinitions.find((keeper) => keeper.region === nextRegionId);
    const nextRegion = nextRegionId ? regionDefinitions[nextRegionId] : null;

    if (gatekeeper && nextRegion) {
      return {
        x: gatekeeper.x,
        y: gatekeeper.y,
        distance: Math.hypot(gatekeeper.x - state.player.x, gatekeeper.y - state.player.y),
        label: nextRegion.name,
        subtitle: `前往 ${gatekeeper.name}`,
        color: gatekeeper.color,
        glyph: gatekeeper.char,
      };
    }

    return null;
  }

  if (state.quest.stage === "game-complete") {
    return null;
  }

  const landmark = getNearestUnactivatedLandmark() || getNearestLandmark(2600);
  return landmark
    ? {
        x: landmark.x,
        y: landmark.y,
        distance: landmark.distance,
        label: landmark.name,
        subtitle: "继续探索字界",
        color: landmark.color,
        glyph: landmark.core,
      }
    : null;
}

function getPendingMartialArts() {
  return martialArts.filter((art) => !state.inventory.learnedArts.includes(art.id) && isMartialArtDropUnlocked(art));
}

function spawnDrop(options) {
  const angle = Math.random() * TAU;
  const speed = 36 + Math.random() * 90;
  state.drops.push({
    id: `${options.kind}:${options.itemId}:${performance.now()}:${Math.random()}`,
    kind: options.kind,
    itemId: options.itemId,
    x: options.x,
    y: options.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 36,
    life: 18 + Math.random() * 7,
    bobSeed: Math.random() * 1000,
  });
}

function rollEnemyDrops(enemy) {
  let treasureDrops = 0;
  if (enemy.tier === "boss") {
    treasureDrops = 3;
  } else if (enemy.tier === "elite") {
    treasureDrops = Math.random() < 0.78 ? 2 : 1;
  } else if (Math.random() < 0.42) {
    treasureDrops = 1;
  }

  for (let count = 0; count < treasureDrops; count += 1) {
    const treasure = pickWeighted(treasureTypes);
    spawnDrop({ kind: "treasure", itemId: treasure.id, x: enemy.x, y: enemy.y });
  }

  const pendingArts = getPendingMartialArts();
  if (!pendingArts.length) {
    return;
  }

  const fragmentDrops =
    enemy.tier === "boss"
      ? 2
      : enemy.tier === "elite"
        ? (Math.random() < 0.34 ? 1 : 0)
        : Math.random() < 0.14
          ? 1
          : 0;

  for (let count = 0; count < fragmentDrops; count += 1) {
    const art = pendingArts[Math.floor(Math.random() * pendingArts.length)];
    spawnDrop({ kind: "fragment", itemId: art.id, x: enemy.x, y: enemy.y });
  }

  if (fragmentDrops > 0 && Math.random() < getEvolutionFragmentLuckBonus()) {
    const art = pendingArts[Math.floor(Math.random() * pendingArts.length)];
    spawnDrop({ kind: "fragment", itemId: art.id, x: enemy.x, y: enemy.y });
  }
}

function showPickupToast(text, color, important = false) {
  if (important || state.toast.timer <= 1 || /^拾得/.test(state.toast.text)) {
    showToast(text, color, important ? 4.8 : 1.8);
  }
}

function learnMartialArt(artId) {
  const art = martialArtMap[artId];
  if (!art || state.inventory.learnedArts.includes(art.id)) {
    return;
  }

  state.inventory.learnedArts.push(art.id);
  state.inventory.fragments[art.id] = getMartialArtFragmentTarget(art);
  if (!state.inventory.activeArt) {
    state.inventory.activeArt = art.id;
  }

  spawnImpact(state.player.x, state.player.y, art.color, [art.glyph, "武", "诀", "成"]);
  showToast(`悟得武功：${art.name}。按 I 施展${state.inventory.learnedArts.length > 1 ? "，按 O 切换武功" : ""}。`, art.color, 5.4);
  say("字界", `你把 ${art.fragmentName} 拼成了完整武学"${art.name}"。${art.summary}`, 7);
  playSfx("learn-art");
  queueAutoSave();
}

function collectDrop(drop, index) {
  if (drop.kind === "treasure") {
    const treasure = treasureMap[drop.itemId];
    if (!treasure) {
      state.drops.splice(index, 1);
      return;
    }

    state.inventory.treasures[treasure.id] += 1;
    state.inventory.treasureScore += treasure.value;
    if (treasure.heal > 0) {
      state.player.hp = clamp(state.player.hp + treasure.heal, 0, state.player.maxHp);
    }
    spawnImpact(drop.x, drop.y, treasure.color, [treasure.glyph, "宝", "藏", "光"]);
    showPickupToast(`拾得${treasure.name} · 宝物值 +${treasure.value}`, treasure.color, false);
    playSfx("pickup-treasure");
  } else {
    const art = martialArtMap[drop.itemId];
    if (!art) {
      state.drops.splice(index, 1);
      return;
    }

    const fragmentTarget = getMartialArtFragmentTarget(art);
    const nextCount = clamp(state.inventory.fragments[art.id] + 1, 0, fragmentTarget);
    state.inventory.fragments[art.id] = nextCount;
    spawnImpact(drop.x, drop.y, art.color, [art.glyph, "碎", "页", "诀"]);
    showPickupToast(`拾得${art.fragmentName} (${nextCount}/${fragmentTarget})`, art.color, true);
    playSfx("pickup-fragment");

    if (nextCount >= fragmentTarget) {
      learnMartialArt(art.id);
    }
  }

  state.drops.splice(index, 1);
  queueAutoSave();
}

function cycleMartialArt(direction = 1) {
  const learned = state.inventory.learnedArts;
  if (!learned.length) {
    showToast("尚未集齐任何秘技碎片。", "#f7dfb3", 2.8);
    return;
  }

  if (learned.length === 1) {
    const art = getActiveMartialArt();
    if (art) {
      showToast(`当前武功：${art.name}`, art.color, 2.6);
    }
    return;
  }

  const currentIndex = Math.max(0, learned.indexOf(state.inventory.activeArt));
  const nextIndex = (currentIndex + direction + learned.length) % learned.length;
  state.inventory.activeArt = learned[nextIndex];
  const art = getActiveMartialArt();
  if (art) {
    showToast(`当前武功：${art.name}`, art.color, 2.6);
    playSfx("switch-art");
  }
}

function useMartialArt() {
  const art = getActiveMartialArt();
  if (!art) {
    showToast("还没有学会武功，先去搜集秘技碎片。", "#f7dfb3", 3.4);
    return;
  }

  if (state.player.artCooldown > 0) {
    showToast(`${art.name} 还需 ${state.player.artCooldown.toFixed(1)}s`, art.color, 2);
    return;
  }

  const direction = getAimDirection();

  if (art.id === "liuyun") {
    const startX = state.player.x;
    const startY = state.player.y;
    state.player.x += direction.x * 156;
    state.player.y += direction.y * 156;
    state.player.invuln = Math.max(state.player.invuln, 0.75);
    state.player.flash = 0.18;
    spawnMartialEffect({
      kind: "liuyun-dash",
      fromX: startX,
      fromY: startY,
      toX: state.player.x,
      toY: state.player.y,
      color: art.color,
      glyph: art.glyph,
      life: 0.42,
    });
    spawnImpact(startX, startY, art.color, ["云", "影", "步", "轻"]);
    spawnImpact(state.player.x, state.player.y, art.color, ["云", "风", "影", "轻"]);
    damageEnemiesInRadius(state.player.x, state.player.y, 84, 2, art.color, ["云", "裂", "步", "影"]);
    showToast("流云步展开。", art.color, 2.4);
    playSfx("martial", { base: 460 });
  } else if (art.id === "huilan") {
    const angles = Array.from({ length: 12 }, (_, step) => (TAU / 12) * step);
    for (const angle of angles) {
      spawnPlayerProjectile({
        x: state.player.x + Math.cos(angle) * 18,
        y: state.player.y + Math.sin(angle) * 18,
        direction: { x: Math.cos(angle), y: Math.sin(angle) },
        speed: 400,
        life: 0.7,
        glyph: "澜",
        color: art.color,
        radius: 15,
        damage: 1.65,
        pierce: 1,
      });
    }
    spawnMartialEffect({
      kind: "huilan-wave",
      x: state.player.x,
      y: state.player.y,
      color: art.color,
      glyph: art.glyph,
      life: 0.72,
    });
    damageEnemiesInRadius(state.player.x, state.player.y, 148, 2.5, art.color, ["澜", "回", "锋", "气"]);
    showToast("回澜式荡开四周。", art.color, 2.6);
    playSfx("martial", { base: 360 });
  } else if (art.id === "guiyuan") {
    state.player.hp = clamp(state.player.hp + 36, 0, state.player.maxHp);
    state.player.invuln = Math.max(state.player.invuln, 1.05);
    spawnCombatText(state.player.x, state.player.y - 36, "+36", art.color, { size: 20, life: 0.9, rise: 54 });
    spawnMartialEffect({
      kind: "guiyuan-guard",
      x: state.player.x,
      y: state.player.y,
      color: art.color,
      glyph: art.glyph,
      life: 1.05,
      followPlayer: true,
    });
    damageEnemiesInRadius(state.player.x, state.player.y, 116, 1.8, art.color, ["诀", "元", "护", "光"]);
    spawnImpact(state.player.x, state.player.y, art.color, ["诀", "元", "息", "光"]);
    showToast("归元诀护住心火。", art.color, 2.8);
    playSfx("martial", { base: 320 });
  } else if (art.id === "tafeng") {
    state.effects = state.effects.filter((effect) => effect.kind !== "tafeng-aura");
    state.player.speedBoostTimer = 10;
    spawnMartialEffect({
      kind: "tafeng-aura",
      x: state.player.x,
      y: state.player.y,
      color: art.color,
      glyph: art.glyph,
      life: 10,
      followPlayer: true,
    });
    spawnImpact(state.player.x, state.player.y, art.color, ["风", "轻", "行", "疾"]);
    showToast("踏风行发动，移速提升 100%。", art.color, 3.2);
    playSfx("martial", { base: 520 });
  } else if (art.id === "xingluo") {
    const angles = Array.from({ length: 14 }, (_, step) => (TAU / 14) * step);
    for (const [index, angle] of angles.entries()) {
      const shotDirection = { x: Math.cos(angle), y: Math.sin(angle) };
      spawnPlayerProjectile({
        x: state.player.x + shotDirection.x * 22,
        y: state.player.y + shotDirection.y * 22,
        direction: shotDirection,
        speed: 430 + (index % 2) * 70,
        life: 1.1,
        glyph: "星",
        color: art.color,
        radius: 14,
        damage: 1.8,
        pierce: 1,
        homing: index % 2 === 0 ? 1.2 : 0,
      });
    }
    state.player.invuln = Math.max(state.player.invuln, 0.42);
    spawnMartialEffect({
      kind: "xingluo-burst",
      x: state.player.x,
      y: state.player.y,
      color: art.color,
      glyph: art.glyph,
      life: 0.9,
    });
    damageEnemiesInRadius(state.player.x, state.player.y, 162, 2.4, art.color, ["星", "落", "潮", "锋"]);
    showToast("星落式铺开了星潮。", art.color, 3);
    playSfx("martial", { base: 560 });
  } else if (art.id === "zhenyuan") {
    let healed = 0;
    for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = state.enemies[index];
      const dx = enemy.x - state.player.x;
      const dy = enemy.y - state.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 240) {
        continue;
      }

      const pull = normalizeVector(-dx, -dy);
      const pullDistance = Math.min(72, distance * 0.32);
      enemy.x += pull.x * pullDistance;
      enemy.y += pull.y * pullDistance;
      enemy.vx *= 0.28;
      enemy.vy *= 0.28;
      enemy.hp -= scalePlayerDamage(enemy.tier === "boss" ? 2.9 : 4.4);
      spawnImpact(enemy.x, enemy.y, art.color, ["渊", "镇", "坠", "息"]);

      if (enemy.hp <= 0) {
        healed += enemy.tier === "boss" ? 24 : enemy.tier === "elite" ? 12 : 6;
        defeatEnemy(index);
      } else {
        healed += enemy.tier === "boss" ? 8 : 4;
      }
    }

    healed = Math.min(42, healed);
    state.player.hp = clamp(state.player.hp + healed, 0, state.player.maxHp);
    state.player.invuln = Math.max(state.player.invuln, 0.9);
    if (healed > 0) {
      spawnCombatText(state.player.x, state.player.y - 34, `+${healed}`, art.color, { size: 22, life: 0.9, rise: 50 });
    }
    spawnMartialEffect({
      kind: "zhenyuan-pulse",
      x: state.player.x,
      y: state.player.y,
      color: art.color,
      glyph: art.glyph,
      life: 1,
      followPlayer: true,
    });
    spawnImpact(state.player.x, state.player.y, art.color, ["渊", "印", "镇", "坠"]);
    showToast("镇渊印压住了周围敌势。", art.color, 3.2);
    playSfx("martial", { base: 300 });
  }

  state.player.artCooldown = applyCooldownReduction(art.cooldown);
}

function spawnImpact(x, y, color, glyphs) {
  for (let index = 0; index < 8; index += 1) {
    const angle = Math.random() * TAU;
    const speed = 80 + Math.random() * 130;
    const life = 0.4 + Math.random() * 0.35;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      glyph: glyphs[index % glyphs.length],
      color,
      size: 14 + Math.random() * 10,
    });
  }
}

function spawnCombatText(x, y, text, color, { size = 18, life = 0.7, rise = 42 } = {}) {
  state.effects.push({
    kind: "text",
    x,
    y,
    vx: (Math.random() - 0.5) * 18,
    vy: -rise,
    life,
    maxLife: life,
    text,
    color,
    size,
  });
}

function spawnMartialEffect(effect) {
  state.effects.push({
    maxLife: effect.life,
    ...effect,
  });
}

function spawnPlayerProjectile({
  x,
  y,
  direction,
  speed,
  life,
  glyph,
  color,
  radius = 12,
  damage = 1,
  pierce = 0,
  homing = 0,
}) {
  state.bullets.push({
    x,
    y,
    vx: direction.x * speed,
    vy: direction.y * speed,
    life,
    maxLife: life,
    glyph,
    color,
    radius,
    damage: scalePlayerDamage(damage),
    pierce,
    homing,
  });
}

function shootSpread(angles, settings) {
  const direction = getAimDirection();
  for (const angle of angles) {
    const rotated = rotateVector(direction.x, direction.y, angle);
    spawnPlayerProjectile({
      x: state.player.x + rotated.x * settings.offset,
      y: state.player.y + rotated.y * settings.offset,
      direction: rotated,
      speed: settings.speed,
      life: settings.life,
      glyph: settings.glyph,
      color: settings.color,
      radius: settings.radius,
      damage: settings.damage,
      pierce: settings.pierce || 0,
      homing: settings.homing || 0,
    });
  }
}

function usePrimaryAttack() {
  const profession = getActiveProfession();

  if (profession.id === "blade") {
    shootSpread([-0.25, 0, 0.25], {
      offset: 26,
      speed: 360,
      life: 0.22,
      glyph: "刃",
      color: profession.color,
      radius: 22,
      damage: 1.35,
    });
    state.player.cooldown = 0.22;
    state.shotsFired += 3;
    playSfx("attack", { profession: profession.id });
    return;
  }

  if (profession.id === "ranger") {
    shootSpread([-0.16, 0, 0.16], {
      offset: 24,
      speed: 760,
      life: 1.05,
      glyph: "羽",
      color: profession.color,
      radius: 11,
      damage: 1,
    });
    state.player.cooldown = 0.16;
    state.shotsFired += 3;
    playSfx("attack", { profession: profession.id });
    return;
  }

  if (profession.id === "mage") {
    shootSpread([0], {
      offset: 22,
      speed: 440,
      life: 1.25,
      glyph: "印",
      color: profession.color,
      radius: 14,
      damage: 2,
      homing: 1,
      pierce: 1,
    });
    state.player.cooldown = 0.22;
    state.shotsFired += 1;
    playSfx("attack", { profession: profession.id });
    return;
  }

  shootSpread([0], {
    offset: 22,
    speed: 620,
    life: 1,
    glyph: "火",
    color: "#ffd27b",
    radius: 12,
    damage: 1,
  });
  state.player.cooldown = 0.16;
  state.shotsFired += 1;
  playSfx("attack", { profession: profession.id });
}

function damageEnemiesInRadius(x, y, radius, damage, color, glyphs) {
  let hits = 0;
  const actualDamage = scalePlayerDamage(damage);

  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    if (Math.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.size * 0.45) {
      enemy.hp -= actualDamage;
      spawnImpact(enemy.x, enemy.y, color, glyphs);
      if (enemy.hp <= 0) {
        defeatEnemy(index);
      }
      hits += 1;
    }
  }

  return hits;
}

function useClassSkill() {
  const profession = getActiveProfession();
  if (profession.id === "wanderer") {
    showToast("完成新手村试炼后才会觉醒职业技。", "#ffe4bf", 3.4);
    return;
  }

  if (state.player.skillCooldown > 0) {
    return;
  }

  if (profession.id === "blade") {
    const angles = Array.from({ length: 10 }, (_, index) => -1.1 + index * 0.24);
    shootSpread(angles, {
      offset: 18,
      speed: 420,
      life: 0.28,
      glyph: "裂",
      color: profession.color,
      radius: 24,
      damage: 2,
    });
    state.player.invuln = 0.45;
    state.player.skillCooldown = applyCooldownReduction(5.2);
    showToast("回环斩释放。", profession.color, 2.6);
    spawnImpact(state.player.x, state.player.y, profession.color, ["剑", "刃", "裂", "光"]);
    playSfx("skill", { base: 310 });
    return;
  }

  if (profession.id === "ranger") {
    const angles = Array.from({ length: 9 }, (_, index) => -0.72 + index * 0.18);
    shootSpread(angles, {
      offset: 24,
      speed: 820,
      life: 1.12,
      glyph: "雨",
      color: profession.color,
      radius: 12,
      damage: 1.35,
      pierce: 1,
    });
    state.player.skillCooldown = applyCooldownReduction(4.8);
    showToast("墨雨齐发。", profession.color, 2.6);
    spawnImpact(state.player.x, state.player.y, profession.color, ["游", "雨", "墨", "风"]);
    playSfx("skill", { base: 380 });
    return;
  }

  if (profession.id === "mage") {
    const angles = Array.from({ length: 12 }, (_, index) => (TAU / 12) * index);
    for (const angle of angles) {
      spawnPlayerProjectile({
        x: state.player.x + Math.cos(angle) * 10,
        y: state.player.y + Math.sin(angle) * 10,
        direction: { x: Math.cos(angle), y: Math.sin(angle) },
        speed: 360,
        life: 0.9,
        glyph: "印",
        color: profession.color,
        radius: 16,
        damage: 2.3,
        pierce: 1,
      });
    }
    damageEnemiesInRadius(state.player.x, state.player.y, 156, 3, profession.color, ["符", "印", "爆", "光"]);
    state.player.skillCooldown = applyCooldownReduction(5.8);
    showToast("爆印法阵展开。", profession.color, 2.8);
    spawnImpact(state.player.x, state.player.y, profession.color, ["符", "印", "阵", "光"]);
    playSfx("skill", { base: 260 });
  }
}

function openProfessionMenu() {
  if (state.professionMenu.open || state.player.profession) {
    return;
  }

  state.professionMenu.open = true;
  state.professionMenu.selected = 0;
  if (isEvolutionMode()) {
    showToast(
      supportsTouchInput() ? "进化模式：点击职业卡选择，再点下方按钮确认。" : "进化模式：按 1 / 2 / 3 选择开局职业，Enter 确认。",
      "#bfe6ff",
      6,
    );
    say("字界", "先决定你的第一种写法，后面的进化会围绕它展开。", 7);
  } else {
    showToast(
      supportsTouchInput() ? "职业觉醒：点击职业卡选择，再点下方按钮确认。" : "职业觉醒：按 1 / 2 / 3 选择，Enter 确认。",
      "#fff0b4",
      6,
    );
    say("引路人", "新手村的试炼已经结束。现在，决定你未来的写法。", 7);
  }
  queueAutoSave();
}

function applyProfession(professionId) {
  const profession = professionMap[professionId];
  if (!profession || profession.id === "wanderer") {
    return;
  }

  state.player.profession = profession.id;
  refreshPlayerDerivedStats({ refillHp: true });
  state.player.cooldown = 0;
  state.player.skillCooldown = 0;
  state.player.artCooldown = 0;
  state.professionMenu.open = false;

  if (isEvolutionMode()) {
    state.quest.stage = "complete";
    grantStarterMartialArt("liuyun");
    spawnImpact(state.player.x, state.player.y, profession.color, [profession.icon, "进", "化", "启"]);
    showToast(`进化起手：${profession.name}。击破敌人积累字魄，达到 ${state.evolution.nextXp} 点进入下一阶。`, profession.color, 6);
    say("字界", `${profession.name} 已被写入本轮进化。每 4 阶会有进化魁前来截杀。`, 7.2);
    playSfx("learn-art");
    return;
  }

  state.quest.stage = "complete";

  // Unlock marsh region after completing tutorial
  if (!state.quest.unlockedRegions.includes("marsh")) {
    state.quest.unlockedRegions.push("marsh");
  }
  refreshNpcRoster();

  spawnImpact(state.player.x, state.player.y, profession.color, [profession.icon, "光", "印", "文"]);
  showToast(`已成为 ${profession.name}。${profession.skill}`, profession.color, 5.6);
  showToast("新区域已解锁：幽冥泽。前往东方的泽使处。", "#7d9e5d", 6);
  say("字界", `${profession.name} 已应答于你。${profession.attack}，${profession.skill}。`, 7);
  playSfx("learn-art");
  queueAutoSave();
}

function confirmProfessionChoice() {
  const profession = professionOptions[state.professionMenu.selected];
  if (profession) {
    applyProfession(profession.id);
  }
}

function startBossTrial() {
  if (state.quest.stage === "boss-trial" || state.quest.bossDefeated) {
    return;
  }

  state.quest.stage = "boss-trial";
  state.quest.bossSpawned = false;
  showToast("新目标：击败村口的试字魁。", "#ffe29a", 5);
  say("引路人", "灾字已退，但最后的试炼刚刚苏醒。去击败试字魁，职业之门就会向你打开。", 7);
  spawnQuestBoss();
  queueAutoSave();
}

function spawnQuestBoss({ showFeedback = true } = {}) {
  if (state.quest.bossSpawned || state.quest.bossDefeated || getBossEnemy()) {
    return;
  }

  state.quest.bossSpawned = true;
  state.enemies.push({
    tier: "boss",
    name: "试字魁",
    x: 0,
    y: -(SAFE_ZONE_RADIUS + 320),
    vx: 0,
    vy: 0,
    char: "魁",
    color: "#ff9f6c",
    speed: 86,
    touchDamage: 34,
    size: 70,
    seed: Math.random() * 1000,
    wanderAngle: 0,
    wanderTimer: 1,
    hp: 28,
    maxHp: 28,
    skillTimer: 2.5,
    skillInterval: 2.5,
    summonTimer: 4.5,
    summonInterval: 4.5,
    attackCooldown: 0.22,
  });
  if (showFeedback) {
    showToast("试字魁现身了。", "#ffb988", 4.2);
    playSfx("boss");
  }
}

function respawnPlayer() {
  if (isEvolutionMode()) {
    endEvolutionRun("本轮进化结束");
    return;
  }

  const player = state.player;
  const checkpoint = getCurrentCheckpoint();
  spawnImpact(player.x, player.y, "#ffe4bf", ["我", "念", "光", "火"]);
  spawnCombatText(player.x, player.y - 30, "心火归零", "#ffd2b8", { size: 18, life: 0.9, rise: 56 });
  player.x = checkpoint.x;
  player.y = checkpoint.y;
  player.hp = player.maxHp;
  player.flash = 0.35;
  player.invuln = 1;
  player.speedBoostTimer = 0;
  state.hurtPulse = 0;
  state.effects = state.effects.filter((effect) => effect.kind !== "tafeng-aura");
  state.camera.x = checkpoint.x;
  state.camera.y = checkpoint.y;
  state.enemies = state.enemies.filter(
    (enemy) => enemy.tier === "boss" || Math.hypot(enemy.x - checkpoint.x, enemy.y - checkpoint.y) > 260,
  );
  spawnImpact(checkpoint.x, checkpoint.y, checkpoint.color, [checkpoint.glyph, "光", "回", "息"]);
  spawnCombatText(checkpoint.x, checkpoint.y - 34, `归于 ${checkpoint.label}`, checkpoint.color, {
    size: 18,
    life: 1,
    rise: 42,
  });
  showToast(`你从 ${checkpoint.label} 重新聚形了。`, checkpoint.color, 4.4);
  say("字医", "心火熄灭时，离你最近的存档点会接住你。", 5.8);
  playSfx("respawn");
}

function damagePlayer(amount, enemyDx, enemyDy) {
  const player = state.player;
  if (player.invuln > 0 || state.professionMenu.open || state.blessingMenu.open || state.evolution.menuOpen) {
    return;
  }

  const damage = Math.max(1, Math.round(amount));
  player.hp = clamp(player.hp - damage, 0, player.maxHp);
  player.flash = 0.18;
  player.invuln = 0.48;
  state.hurtPulse = Math.min(1, state.hurtPulse + damage / Math.max(20, player.maxHp * 0.34));
  spawnImpact(player.x, player.y, "#ff9f7d", ["伤", "痛", "裂", "火"]);
  spawnCombatText(player.x, player.y - 34, `-${damage}`, "#ffb5a0", { size: 20, life: 0.72, rise: 48 });
  playSfx("hurt");

  const direction = normalizeVector(enemyDx, enemyDy);
  player.x += direction.x * 12;
  player.y += direction.y * 12;

  if (player.hp <= 0) {
    respawnPlayer();
  }
}

function defeatEnemy(index) {
  const enemy = state.enemies[index];
  if (!enemy) {
    return;
  }

  spawnImpact(enemy.x, enemy.y, enemy.color, [enemy.char, "火", "光"]);
  rollEnemyDrops(enemy);

  if (isEvolutionMode() && enemy.evolutionBoss) {
    state.enemies.splice(index, 1);
    state.cleared += 1;
    state.player.hp = clamp(state.player.hp + 2 + getEvolutionKillHealBonus(enemy), 0, state.player.maxHp);
    handleEvolutionBossDefeat(enemy);
    return;
  }

  // Handle region boss defeat
  if (enemy.tier === "boss" && enemy.region && enemy.region !== "village") {
    state.enemies.splice(index, 1);
    handleRegionBossDefeat(enemy.region);
    return;
  }

  state.enemies.splice(index, 1);

  if (enemy.tier === "boss") {
    state.quest.bossDefeated = true;
    state.quest.stage = "choose-class";
    showToast("试字魁已败。新手村试炼完成。", "#fff0b4", 5.4);
    say("引路人", "很好。现在，去选择你的职业吧。", 6.2);
    openProfessionMenu();
    queueAutoSave();
    return;
  }

  state.cleared += 1;

  // Update region progress if in a region
  if (!isEvolutionMode() && enemy.region && enemy.region !== "village") {
    const regionProgress = state.quest.regionProgress[enemy.region];
    if (regionProgress) {
      regionProgress.cleared += 1;
      checkRegionProgress(enemy.region);
    }
  }

  if (isEvolutionMode()) {
    grantEvolutionXp(enemy.tier === "elite" ? 3 : 1);
  }

  state.player.hp = clamp(state.player.hp + 2 + getEvolutionKillHealBonus(enemy), 0, state.player.maxHp);
  queueAutoSave();

  if (state.quest.stage === "clear-corruption" && state.cleared >= state.quest.clearTarget) {
    startBossTrial();
  }
}

function handleRegionBossDefeat(regionId) {
  const region = regionDefinitions[regionId];
  const regionProgress = state.quest.regionProgress[regionId];

  if (!region || !regionProgress) return;

  regionProgress.bossDefeated = true;

  // Unlock next region
  const currentIndex = regionOrder.indexOf(regionId);
  const nextRegion = regionOrder[currentIndex + 1];
  const nextRegionDefinition = nextRegion ? regionDefinitions[nextRegion] : null;
  const nextArt = martialArts.find((art) => art.unlockRegion === nextRegion);

  if (nextRegion && nextRegion !== "village") {
    if (!state.quest.unlockedRegions.includes(nextRegion)) {
      state.quest.unlockedRegions.push(nextRegion);
    }
    refreshNpcRoster();
    showToast(`${region.name}已被征服。新的区域已解锁。`, region.color, 5.4);
    say(
      "字界",
      `${region.name}的${region.bossName}已被击败。${nextRegionDefinition?.name || "新的区域"}向你敞开。${nextArt ? `新的秘技碎片"${nextArt.name}"也开始流转。` : ""}`,
      7.4,
    );
  } else if (region.isFinalBoss) {
    state.quest.stage = "game-complete";
    showToast(`${region.name}已被彻底镇定。字界终章完成。`, region.color, 6);
    say("字界", `${region.name}的核心终于回应了你。整座字界都承认了你的写法。`, 8);
  } else {
    showToast(`${region.name}已被征服。`, region.color, 5.4);
    say("字界", `${region.name}的${region.bossName}已被击败。`, 6);
  }

  queueAutoSave();
}

function checkRegionProgress(regionId, options = {}) {
  if (isEvolutionMode()) return;

  const region = regionDefinitions[regionId];
  const regionProgress = state.quest.regionProgress[regionId];

  if (!region || !regionProgress) return;

  if (regionProgress.cleared >= region.questTarget && !regionProgress.bossDefeated) {
    // Spawn region boss
    spawnRegionBoss(regionId, options);
  }
}

function spawnRegionBoss(regionId, { showFeedback = true } = {}) {
  const region = regionDefinitions[regionId];
  const regionProgress = state.quest.regionProgress[regionId];
  if (!region || !regionProgress || regionProgress.bossDefeated) return;

  const existingBoss = state.enemies.find((enemy) => enemy.tier === "boss" && enemy.region === regionId);
  if (existingBoss) {
    return;
  }

  const bossX = region.centerX;
  const bossY = region.centerY;

  state.enemies.push({
    tier: "boss",
    region: regionId,
    name: region.bossName,
    x: bossX,
    y: bossY,
    vx: 0,
    vy: 0,
    char: region.bossChar || "魁",
    color: region.color,
    speed: region.bossSpeed || 72,
    touchDamage: region.bossTouchDamage || 32,
    size: region.bossSize || 70,
    seed: Math.random() * 1000,
    wanderAngle: 0,
    wanderTimer: 1,
    hp: region.bossHp,
    maxHp: region.bossHp,
    skillTimer: region.bossSkillInterval || 2.5,
    skillInterval: region.bossSkillInterval || 2.5,
    summonTimer: region.bossSummonInterval || 4.5,
    summonInterval: region.bossSummonInterval || 4.5,
    attackCooldown: 0.22,
  });

  if (showFeedback) {
    showToast(`${region.bossName}现身于${region.name}。`, region.color, 5);
    playSfx("boss");
  }
}

function restorePendingBosses() {
  if (isEvolutionMode()) {
    return;
  }

  if (state.quest.stage === "boss-trial" && !state.quest.bossDefeated && !getBossEnemy()) {
    state.quest.bossSpawned = false;
    spawnQuestBoss({ showFeedback: false });
    return;
  }

  const currentRegion = state.quest.currentRegion || "village";
  if (currentRegion === "village") {
    return;
  }

  const region = regionDefinitions[currentRegion];
  const regionProgress = state.quest.regionProgress[currentRegion];
  if (!region || !regionProgress || regionProgress.bossDefeated) {
    return;
  }

  if (regionProgress.cleared >= region.questTarget) {
    checkRegionProgress(currentRegion, { showFeedback: false });
  }
}

function interactWithNpc(npc) {
  // Handle gatekeeper NPCs
  if (npc.id && npc.id.startsWith("gate-")) {
    interactWithGatekeeper(npc);
    return;
  }

  playSfx("talk");
  if (npc.id === "guide") {
    if (state.quest.stage === "meet-guide") {
      state.quest.stage = "activate-landmarks";
      showToast(`新目标：点亮 ${state.quest.activationTarget} 座遗迹。`, "#ffe29a", 4.8);
      say("引路人", `你就是"我"。先去点亮 ${state.quest.activationTarget} 座遗迹，让字界认出你的脚步。`, 6.4);
      queueAutoSave();
      return;
    }

    if (state.quest.stage === "activate-landmarks") {
      const remaining = Math.max(0, state.quest.activationTarget - state.quest.activatedLandmarks.size);
      say("引路人", remaining ? `还有 ${remaining} 座遗迹沉睡着。靠近它们，按 K 或空格点亮。` : "遗迹都已应答。接下来去净化那些灾字。", 6);
      return;
    }

    if (state.quest.stage === "clear-corruption") {
      const remaining = Math.max(0, state.quest.clearTarget - state.cleared);
      say("引路人", remaining ? `再净化 ${remaining} 个灾字，起笔村才算真正安定。` : "你已经做到了，最后的试炼马上开始。", 6);
      if (state.cleared >= state.quest.clearTarget) {
        startBossTrial();
      }
      return;
    }

    if (state.quest.stage === "boss-trial") {
      const boss = getBossEnemy();
      say("引路人", boss ? `试字魁就在村口。它还剩 ${Math.ceil(boss.hp)} 点心火。` : "试炼结束了。现在，去决定你的职业吧。", 6);
      if (!boss && state.quest.bossDefeated) {
        openProfessionMenu();
      }
      return;
    }

    if (state.quest.stage === "choose-class") {
      openProfessionMenu();
      return;
    }

    const profession = getActiveProfession();
    say("引路人", `你已经是${profession.name}了。带着这份写法，去更远的字界吧。`, 6);
    return;
  }

  if (npc.id === "healer") {
    state.player.hp = state.player.maxHp;
    spawnImpact(npc.x, npc.y, npc.color, ["医", "泉", "愈", "息"]);
    showToast("心火已充盈。", "#8ce6ff", 3.6);
    say("字医", "职业只决定你怎么战斗，不决定你能走多远。", 5.6);
    return;
  }

  if (npc.id === "scribe") {
    const totalBlessings = blessingDefinitions.reduce((sum, blessing) => sum + getBlessingRank(blessing.id), 0);
    say(
      "碑书记",
      `把宝物中的字气拓成常驻印记吧。你现在有 ${state.inventory.treasureScore} 点宝物值，已拓 ${totalBlessings} 重字印。${getBlessingSummaryLine()}`,
      7.4,
    );
    openBlessingMenu();
    return;
  }

  const nearestLandmark = getNearestLandmark(1600);
  const landmarkHint = nearestLandmark ? `最近的遗迹是 ${nearestLandmark.name}。` : "今天的风太稳，附近像是没有新遗迹。";
  const profession = getActiveProfession();
  say("字界", `你现在是${profession.name}。已点亮 ${state.quest.activatedLandmarks.size} 座遗迹，净化 ${state.cleared} 个灾字。${landmarkHint}`, 6.8);
}

function interactWithGatekeeper(gatekeeper) {
  const region = regionDefinitions[gatekeeper.region];
  if (!region) return;

  playSfx("talk");

  const regionProgress = state.quest.regionProgress[gatekeeper.region];
  const bossDefeated = regionProgress?.bossDefeated;
  const isUnlocked = state.quest.unlockedRegions.includes(gatekeeper.region);
  const isCurrentRegion = state.quest.currentRegion === gatekeeper.region;

  if (isCurrentRegion) {
    // Player is already in this region
    const cleared = regionProgress?.cleared || 0;
    if (bossDefeated) {
      say(gatekeeper.name, `这里的${region.bossName}已被击败。你可以继续探索其他区域。`, 6);
    } else {
      say(gatekeeper.name, `你已在${region.name}中。继续净化灾字（${cleared}/${region.questTarget}），直到${region.bossName}现身。`, 6);
    }
    return;
  }

  if (!isUnlocked) {
    // Region not unlocked yet
    const requiredStage = region.requiredStage;
    if (requiredStage === "complete") {
      say(gatekeeper.name, `${region.name}还未向你敞开。先完成新手村的试炼。`, 6);
    } else {
      const prevRegion = regionDefinitions[requiredStage];
      say(gatekeeper.name, `${region.name}还未向你敞开。先去${prevRegion?.name || "前一区域"}证明你的实力。`, 6);
    }
    return;
  }

  // Teleport player to the region
  state.quest.currentRegion = gatekeeper.region;
  state.player.x = region.centerX;
  state.player.y = region.centerY;
  state.checkpoint = {
    id: `region:${gatekeeper.region}`,
    label: `${region.name}·入口`,
    x: region.centerX,
    y: region.centerY,
    color: region.color,
    glyph: "锚",
  };
  state.camera.x = region.centerX;
  state.camera.y = region.centerY;

  // Rebuild the local combat state when entering a new region so old bosses do not leak across maps.
  state.bullets = [];
  state.enemies = [];
  state.drops = [];
  state.particles = [];
  state.effects = [];

  showToast(`已进入${region.name}。${region.description}`, region.color, 5);
  say(gatekeeper.name, `欢迎来到${region.name}。净化${region.questTarget}个灾字，${region.bossName}就会出现。`, 7);
  queueAutoSave();
}

function interactWithCheckpoint(checkpoint) {
  if (isEvolutionMode()) {
    const normalized = normalizeCheckpoint(checkpoint);
    const used = state.evolution.usedAnchors.has(normalized.id);

    if (used) {
      showToast(`${normalized.label} 的余火已经耗尽。`, normalized.color, 3.2);
      say("锚迹", "这道锚迹只够稳住你一次。它不会保存本轮进化，也不能让你复生。", 6);
      playSfx("menu");
      return;
    }

    state.evolution.usedAnchors.add(normalized.id);
    state.checkpoint = normalized;
    const healAmount = Math.max(16, Math.round(state.player.maxHp * 0.22));
    state.player.hp = clamp(state.player.hp + healAmount, 0, state.player.maxHp);
    spawnImpact(normalized.x, normalized.y, normalized.color, [normalized.glyph, "稳", "息", "火"]);
    spawnCombatText(normalized.x, normalized.y - 34, `+${healAmount}`, normalized.color, {
      size: 18,
      life: 0.86,
      rise: 42,
    });
    showToast(`${normalized.label} 稳住了你的心火。`, normalized.color, 3.8);
    say("锚迹", "这里只能临时补给心火。若你倒下，这一轮进化仍会直接结束。", 6);
    playSfx("checkpoint");
    return;
  }

  if (checkpointEquals(getCurrentCheckpoint(), checkpoint)) {
    showToast(`${checkpoint.label} 已是当前存档点。`, checkpoint.color, 3.2);
    say("存档点", "锚点稳定，若你倒下，将会从这里归来。", 5.4);
    playSfx("checkpoint");
    return;
  }

  spawnImpact(checkpoint.x, checkpoint.y, checkpoint.color, [checkpoint.glyph, "记", "光", "印"]);
  setCheckpoint(checkpoint, { showFeedback: true, saveNow: true });
  playSfx("checkpoint");
}

function interactWithLandmark(landmark) {
  if (isEvolutionMode()) {
    if (isLandmarkActivated(landmark)) {
      say(landmark.name, "这道锚迹已经被你收束过了。它不会保存本轮进化，只会留下路径。", 5.8);
      return;
    }

    state.quest.activatedLandmarks.add(landmark.id);
    const checkpoint = {
      ...checkpointFromLandmark(landmark),
      label: `${landmark.name}·锚迹`,
    };
    state.checkpoint = checkpoint;
    state.evolution.usedAnchors.add(checkpoint.id);
    const healAmount = Math.max(20, Math.round(state.player.maxHp * 0.24));
    state.player.hp = clamp(state.player.hp + healAmount, 0, state.player.maxHp);
    spawnImpact(landmark.x, landmark.y, landmark.color, [landmark.core, "锚", "迹", "息"]);
    spawnCombatText(landmark.x, landmark.y - 34, `+${healAmount}`, landmark.color, {
      size: 18,
      life: 0.86,
      rise: 42,
    });
    showToast(`${landmark.name} 已被收束为临时锚迹。`, landmark.color, 4.4);
    say(landmark.name, `"${landmark.core}"字被你压成了临时锚迹。它只会稳住心火，不会保存这一轮进化。`, 6.4);
    playSfx("checkpoint");
    return;
  }

  if (state.quest.stage === "meet-guide") {
    say(landmark.name, "它还在沉睡。先回起笔村，问问引路人怎么让遗迹应答。", 5.8);
    return;
  }

  if (isLandmarkActivated(landmark)) {
    say(landmark.name, "它已经在稳定地发光。继续去更远的地方吧。", 5.4);
    return;
  }

  state.quest.activatedLandmarks.add(landmark.id);
  const checkpoint = checkpointFromLandmark(landmark);
  spawnImpact(landmark.x, landmark.y, landmark.color, [landmark.core, "光", "印", "文"]);
  showToast(
    `${landmark.name} 已点亮，并设为存档点 (${state.quest.activatedLandmarks.size}/${state.quest.activationTarget})`,
    landmark.color,
    4.4,
  );
  say(landmark.name, `"${landmark.core}"字震了一下，整个遗迹都开始回响。`, 5.8);
  setCheckpoint(checkpoint, { showFeedback: false, saveNow: true });
  playSfx("checkpoint");

  if (state.quest.stage === "activate-landmarks" && state.quest.activatedLandmarks.size >= state.quest.activationTarget) {
    state.quest.stage = "clear-corruption";
    showToast(`新目标：净化 ${state.quest.clearTarget} 个灾字。`, "#ffe29a", 4.8);
    say("引路人", `很好。遗迹都亮了，现在去净化 ${state.quest.clearTarget} 个灾字，让起笔村真正安静下来。`, 6.6);
  }
  queueAutoSave();
}

function attemptInteraction() {
  if (state.professionMenu.open) {
    confirmProfessionChoice();
    return;
  }

  if (state.evolution.menuOpen) {
    confirmEvolutionChoice();
    return;
  }

  const target = getInteractionTarget();
  if (!target) {
    showToast("附近没有可互动的字灵或遗迹。", "#d9d2c4", 2.8);
    return;
  }

  if (target.type === "npc") {
    interactWithNpc(target.npc);
    return;
  }

  if (target.type === "checkpoint") {
    interactWithCheckpoint(target.checkpoint);
    return;
  }

  interactWithLandmark(target.landmark);
}

function spawnEnemyNear(x, y, minDistance = 120, maxDistance = 220) {
  const currentRegion = state.quest.currentRegion || "village";
  const kinds = getAvailableEnemyKinds(currentRegion);
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const angle = Math.random() * TAU;
  const distance = minDistance + Math.random() * (maxDistance - minDistance);
  const scale = getEvolutionEnemyScale();

  state.enemies.push({
    tier: "normal",
    region: currentRegion,
    x: x + Math.cos(angle) * distance,
    y: y + Math.sin(angle) * distance,
    vx: 0,
    vy: 0,
    char: kind.char,
    color: kind.color,
    speed: kind.speed * scale,
    touchDamage: Math.round(kind.touchDamage * (isEvolutionMode() ? 0.92 + scale * 0.14 : 1)),
    size: kind.size,
    seed: Math.random() * 1000,
    wanderAngle: Math.random() * TAU,
    wanderTimer: 0.8 + Math.random() * 1.6,
    hp: Math.max(1, Math.round(kind.hp * scale)),
    maxHp: Math.max(1, Math.round(kind.hp * scale)),
    tierScale: 1,
    attackCooldown: 0.18,
  });
}

function spawnEnemy() {
  const currentRegion = state.quest.currentRegion || "village";
  const availableKinds = getAvailableEnemyKinds(currentRegion);
  const kind = availableKinds[Math.floor(Math.random() * availableKinds.length)];
  let spawnX = state.player.x;
  let spawnY = state.player.y;
  let placed = false;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const angle = Math.random() * TAU;
    const distance = 520 + Math.random() * 620;
    const candidateX = state.player.x + Math.cos(angle) * distance;
    const candidateY = state.player.y + Math.sin(angle) * distance;
    if (Math.hypot(candidateX, candidateY) > SAFE_ZONE_RADIUS + 180) {
      spawnX = candidateX;
      spawnY = candidateY;
      placed = true;
      break;
    }
  }

  if (!placed) {
    const angle = Math.random() * TAU;
    spawnX = state.player.x + Math.cos(angle) * 760;
    spawnY = state.player.y + Math.sin(angle) * 760;
  }

  const scaleFactor = getEvolutionEnemyScale();
  const eliteChance = isEvolutionMode()
    ? Math.min(0.42, 0.1 + state.evolution.level * 0.018)
    : Math.min(0.22, 0.06 + state.cleared * 0.01);
  const elite = Math.random() < eliteChance;
  const hp = Math.max(1, Math.round((kind.hp + (elite ? 2 : 0)) * scaleFactor));
  const scale = elite ? 1.18 : 1;

  state.enemies.push({
    tier: elite ? "elite" : "normal",
    region: currentRegion,
    x: spawnX,
    y: spawnY,
    vx: 0,
    vy: 0,
    char: elite ? "煞" : kind.char,
    color: elite ? "#ffd0a0" : kind.color,
    speed: kind.speed * (elite ? 0.94 : 1) * scaleFactor,
    touchDamage: Math.round((kind.touchDamage + (elite ? 5 : 0)) * (isEvolutionMode() ? 0.94 + scaleFactor * 0.12 : 1)),
    size: kind.size * scale,
    seed: Math.random() * 1000,
    wanderAngle: Math.random() * TAU,
    wanderTimer: 0.8 + Math.random() * 1.6,
    hp,
    maxHp: hp,
    tierScale: scale,
    attackCooldown: 0.18,
  });
}

function ensureEnemies() {
  const currentRegion = state.quest.currentRegion || "village";
  state.enemies = state.enemies.filter(
    (enemy) =>
      enemy.tier !== "boss" ||
      (isEvolutionMode()
        ? Boolean(enemy.evolutionBoss)
        : state.quest.stage === "boss-trial"
          ? !enemy.region || enemy.region === "village"
          : enemy.region === currentRegion),
  );

  if (!isEvolutionMode() && currentRegion !== "village") {
    checkRegionProgress(currentRegion, { showFeedback: false });
  }

  if (isEvolutionMode()) {
    maybeSpawnEvolutionBoss(false);
  }

  const boss = getBossEnemy();
  const desired = boss ? 5 : state.quest.stage === "boss-trial" ? 6 : 10 + Math.min(12, Math.floor(state.cleared / 4));

  if (state.quest.stage === "boss-trial" && !boss) {
    spawnQuestBoss();
  }

  while (state.enemies.length < desired + (boss ? 1 : 0)) {
    spawnEnemy();
  }
}

function updatePlayer(dt) {
  const player = state.player;
  let moveX = state.touch.moveX;
  let moveY = state.touch.moveY;

  if (keys.ArrowLeft || keys.KeyA) moveX -= 1;
  if (keys.ArrowRight || keys.KeyD) moveX += 1;
  if (keys.ArrowUp || keys.KeyW) moveY -= 1;
  if (keys.ArrowDown || keys.KeyS) moveY += 1;

  const moveLength = Math.hypot(moveX, moveY);
  const moveScale = Math.min(1, moveLength);
  const move = moveLength ? { x: moveX / moveLength, y: moveY / moveLength } : { x: 0, y: 0 };
  if (moveScale > 0) {
    player.facingX = move.x;
    player.facingY = move.y;
  }

  const speedMultiplier = player.speedBoostTimer > 0 ? 2 : 1;
  const speed = player.speed * speedMultiplier * getTerrainSpeedAt(player.x, player.y);
  player.x += move.x * moveScale * speed * dt;
  player.y += move.y * moveScale * speed * dt;
  player.cooldown = Math.max(0, player.cooldown - dt);
  player.skillCooldown = Math.max(0, player.skillCooldown - dt);
  player.artCooldown = Math.max(0, player.artCooldown - dt);
  player.speedBoostTimer = Math.max(0, player.speedBoostTimer - dt);
  player.flash = Math.max(0, player.flash - dt);
  player.invuln = Math.max(0, player.invuln - dt);

  const inVillage = Math.hypot(player.x, player.y) < SAFE_ZONE_RADIUS;
  const regen = isEvolutionMode() ? 1.6 + getEvolutionRank("siphon") * 0.18 : inVillage ? 12 : 3.4;
  player.hp = clamp(player.hp + dt * regen, 0, player.maxHp);

  // Update current region when player moves
  const newRegion = getRegionAtPosition(player.x, player.y);
  if (newRegion !== state.quest.currentRegion) {
    state.quest.currentRegion = newRegion;
  }

  if (keys.KeyJ && player.cooldown <= 0) {
    usePrimaryAttack();
  }

  state.camera.x = lerp(state.camera.x, player.x, 1 - Math.exp(-dt * 7));
  state.camera.y = lerp(state.camera.y, player.y, 1 - Math.exp(-dt * 7));
}

function updateDrops(dt) {
  for (let index = state.drops.length - 1; index >= 0; index -= 1) {
    const drop = state.drops[index];
    drop.life -= dt;
    if (drop.life <= 0) {
      state.drops.splice(index, 1);
      continue;
    }

    const dx = state.player.x - drop.x;
    const dy = state.player.y - drop.y;
    const distance = Math.hypot(dx, dy);
    const magnetRadius = getTreasureMagnetRadius();
    if (distance < magnetRadius) {
      const pull = 210 + (1 - distance / magnetRadius) * 430;
      const direction = normalizeVector(dx, dy);
      drop.vx += direction.x * pull * dt;
      drop.vy += direction.y * pull * dt;
    }

    drop.x += drop.vx * dt;
    drop.y += drop.vy * dt;
    drop.vx = lerp(drop.vx, 0, 1 - Math.exp(-dt * 4));
    drop.vy = lerp(drop.vy, 0, 1 - Math.exp(-dt * 4));

    if (distance <= TREASURE_PICKUP_RADIUS) {
      collectDrop(drop, index);
    }
  }
}

function updateBullets(dt) {
  for (let bulletIndex = state.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
    const bullet = state.bullets[bulletIndex];
    bullet.life -= dt;

    if (bullet.homing > 0) {
      const target = findNearestEnemy(bullet.x, bullet.y, 300);
      if (target) {
        const speed = Math.hypot(bullet.vx, bullet.vy);
        const aim = normalizeVector(target.enemy.x - bullet.x, target.enemy.y - bullet.y);
        const turn = 1 - Math.exp(-dt * 7 * bullet.homing);
        bullet.vx = lerp(bullet.vx, aim.x * speed, turn);
        bullet.vy = lerp(bullet.vy, aim.y * speed, turn);
      }
    }

    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    let removeBullet = bullet.life <= 0;

    for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = state.enemies[enemyIndex];
      const dx = enemy.x - bullet.x;
      const dy = enemy.y - bullet.y;
      if (Math.hypot(dx, dy) < bullet.radius + enemy.size * 0.48) {
        enemy.hp -= bullet.damage;
        spawnImpact(bullet.x, bullet.y, bullet.color, [bullet.glyph, "光", "火"]);

        if (enemy.hp <= 0) {
          defeatEnemy(enemyIndex);
        }

        if (bullet.pierce > 0) {
          bullet.pierce -= 1;
        } else {
          removeBullet = true;
        }

        break;
      }
    }

    if (removeBullet) {
      state.bullets.splice(bulletIndex, 1);
    }
  }
}

function updateEnemies(dt) {
  const player = state.player;

  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    enemy.attackCooldown = Math.max(0, (enemy.attackCooldown || 0) - dt);
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy);

    if (
      enemy.tier !== "boss" &&
      (distance > 1900 || (!isEvolutionMode() && Math.hypot(enemy.x, enemy.y) < SAFE_ZONE_RADIUS - 12))
    ) {
      state.enemies.splice(index, 1);
      continue;
    }

    let targetX = 0;
    let targetY = 0;

    if (enemy.tier === "boss") {
      const chase = normalizeVector(dx, dy);
      const lowHealthFactor = enemy.hp < enemy.maxHp * 0.45 ? 1.22 : 1;
      targetX = chase.x * enemy.speed * lowHealthFactor;
      targetY = chase.y * enemy.speed * lowHealthFactor;
      enemy.skillTimer -= dt;
      enemy.summonTimer -= dt;

      if (enemy.skillTimer <= 0) {
        enemy.skillTimer = enemy.skillInterval || 2.6;
        enemy.vx += chase.x * 180;
        enemy.vy += chase.y * 180;
        spawnImpact(enemy.x, enemy.y, enemy.color, ["魁", "震", "裂", "压"]);
        if (distance < 190) {
          damagePlayer(18, dx, dy);
        }
      }

      if (enemy.summonTimer <= 0 && state.enemies.length < 10) {
        enemy.summonTimer = enemy.summonInterval || 4.3;
        spawnEnemyNear(enemy.x, enemy.y, 110, 170);
        spawnEnemyNear(enemy.x, enemy.y, 110, 170);
      }
    } else if (distance < 320) {
      const chase = normalizeVector(dx, dy);
      targetX = chase.x * enemy.speed;
      targetY = chase.y * enemy.speed;
    } else {
      enemy.wanderTimer -= dt;
      if (enemy.wanderTimer <= 0) {
        enemy.wanderTimer = 0.8 + Math.random() * 1.8;
        enemy.wanderAngle += (Math.random() - 0.5) * 1.6;
      }
      targetX = Math.cos(enemy.wanderAngle) * enemy.speed * 0.42;
      targetY = Math.sin(enemy.wanderAngle) * enemy.speed * 0.42;
    }

    enemy.vx = lerp(enemy.vx, targetX, 1 - Math.exp(-dt * 3));
    enemy.vy = lerp(enemy.vy, targetY, 1 - Math.exp(-dt * 3));
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    const hitDx = player.x - enemy.x;
    const hitDy = player.y - enemy.y;
    const hitDistance = Math.hypot(hitDx, hitDy);
    if (hitDistance < enemy.size * 0.8 + 12 && enemy.attackCooldown <= 0) {
      enemy.attackCooldown = enemy.tier === "boss" ? 0.76 : enemy.tier === "elite" ? 0.88 : 0.96;
      damagePlayer(enemy.touchDamage, hitDx, hitDy);
    }
  }
}

function updateParticles(dt) {
  for (let index = state.particles.length - 1; index >= 0; index -= 1) {
    const particle = state.particles[index];
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.vy += 10 * dt;

    if (particle.life <= 0) {
      state.particles.splice(index, 1);
    }
  }
}

function updateEffects(dt) {
  for (let index = state.effects.length - 1; index >= 0; index -= 1) {
    const effect = state.effects[index];
    effect.life -= dt;

    if (effect.kind === "text") {
      effect.x += effect.vx * dt;
      effect.y += effect.vy * dt;
      effect.vx *= 0.96;
      effect.vy *= 0.94;
    } else if (effect.followPlayer) {
      effect.x = state.player.x;
      effect.y = state.player.y;
    }

    if (effect.life <= 0) {
      state.effects.splice(index, 1);
    }
  }
}

function updateUiState(dt) {
  if (state.toast.timer > 0) {
    state.toast.timer = Math.max(0, state.toast.timer - dt);
  }

  if (state.dialog.timer > 0) {
    state.dialog.timer = Math.max(0, state.dialog.timer - dt);
  }

  if (isEvolutionMode() && state.menu.screen === "playing" && !state.evolution.menuOpen && !state.exitPrompt.open) {
    state.evolution.elapsed += dt;
  }

  state.hurtPulse = Math.max(0, state.hurtPulse - dt * 1.8);
  updateTouchControlsUi();
}

function getCameraBounds() {
  return {
    left: state.camera.x - state.width / 2,
    top: state.camera.y - state.height / 2,
  };
}

function worldToScreen(x, y, bounds) {
  return {
    x: x - bounds.left,
    y: y - bounds.top,
  };
}

function getMiniMapLayout() {
  const compact = isCompactViewport();
  const radius = Math.round(
    compact
      ? Math.min(78, Math.max(56, Math.min(state.width, state.height) * 0.095))
      : Math.min(92, Math.max(66, Math.min(state.width, state.height) * 0.108)),
  );
  return {
    centerX: state.width - radius - (compact ? 18 : 26),
    centerY: compact ? radius + 18 : state.height - radius - 24,
    radius,
    mapRadius: radius - (compact ? 12 : 14),
  };
}

function getExpandedMapLayout() {
  const panelWidth = Math.min(820, state.width - 92);
  const panelHeight = Math.min(780, state.height - 84);
  const panelX = (state.width - panelWidth) / 2;
  const panelY = (state.height - panelHeight) / 2;
  const mapRadius = Math.min(panelWidth, panelHeight) * 0.335;
  return {
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    centerX: panelX + panelWidth / 2,
    centerY: panelY + panelHeight / 2 + 14,
    radius: mapRadius + 16,
    mapRadius,
    closeButton: {
      x: panelX + panelWidth - 56,
      y: panelY + 22,
      width: 32,
      height: 32,
    },
  };
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function getBlessingMenuLayout() {
  const compact = state.width <= 760;
  const panelWidth = Math.min(compact ? 680 : 920, state.width - (compact ? 24 : 40));
  const panelHeight = Math.min(compact ? state.height - 24 : 620, state.height - (compact ? 24 : 40));
  const panelX = (state.width - panelWidth) / 2;
  const panelY = (state.height - panelHeight) / 2;
  const headerHeight = compact ? 94 : 102;
  const detailHeight = compact ? 122 : 126;
  const gap = compact ? 12 : 18;
  const rowCount = Math.ceil(blessingDefinitions.length / 2);
  const availableHeight = panelHeight - headerHeight - detailHeight - 42 - gap * Math.max(0, rowCount - 1);
  const cardHeight = clamp(Math.floor(availableHeight / Math.max(1, rowCount)), compact ? 100 : 114, compact ? 136 : 148);
  const cardWidth = (panelWidth - 48 - gap) / 2;
  const cardsStartY = panelY + headerHeight;
  const cards = blessingDefinitions.map((_, index) => ({
    index,
    x: panelX + 24 + (index % 2) * (cardWidth + gap),
    y: cardsStartY + Math.floor(index / 2) * (cardHeight + gap),
    width: cardWidth,
    height: cardHeight,
  }));
  const detailX = panelX + 24;
  const detailY = panelY + panelHeight - detailHeight - 18;
  const detailWidth = panelWidth - 48;
  const purchaseButtonWidth = compact ? 112 : 138;
  const purchaseButtonHeight = 40;

  return {
    compact,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    cards,
    detailX,
    detailY,
    detailWidth,
    detailHeight,
    purchaseButton: {
      x: detailX + detailWidth - purchaseButtonWidth - 16,
      y: detailY + detailHeight - purchaseButtonHeight - 14,
      width: purchaseButtonWidth,
      height: purchaseButtonHeight,
    },
    closeButton: {
      x: panelX + panelWidth - 54,
      y: panelY + 18,
      width: 36,
      height: 36,
    },
  };
}

function getProfessionMenuLayout() {
  const compact = state.width <= 760;
  const titleY = compact ? Math.max(42, state.height * 0.06) : Math.max(96, state.height * 0.12);
  const gap = compact ? 10 : 18;

  if (compact) {
    const cardWidth = state.width - 32;
    const confirmHeight = 46;
    const cardsY = titleY + 58;
    const availableHeight = state.height - cardsY - confirmHeight - 34 - gap * Math.max(0, professionOptions.length - 1);
    const cardHeight = clamp(Math.floor(availableHeight / professionOptions.length), 94, 128);
    const cards = professionOptions.map((_, index) => ({
      index,
      x: 16,
      y: cardsY + index * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
    }));
    const lastCard = cards[cards.length - 1];
    const confirmY = lastCard.y + lastCard.height + 16;

    return {
      compact,
      titleY,
      cards,
      confirmButton: {
        x: (state.width - Math.min(320, state.width - 40)) / 2,
        y: confirmY,
        width: Math.min(320, state.width - 40),
        height: confirmHeight,
      },
    };
  }

  const cardWidth = Math.min(250, (state.width - 80 - gap * 2) / 3);
  const cardHeight = 270;
  const totalWidth = cardWidth * 3 + gap * 2;
  const startX = (state.width - totalWidth) / 2;
  const y = titleY + 70;
  const cards = professionOptions.map((_, index) => ({
    index,
    x: startX + index * (cardWidth + gap),
    y,
    width: cardWidth,
    height: cardHeight,
  }));

  return {
    compact,
    titleY,
    cards,
    confirmButton: {
      x: (state.width - Math.min(360, state.width - 60)) / 2,
      y: y + cardHeight + 18,
      width: Math.min(360, state.width - 60),
      height: 48,
    },
  };
}

function getEvolutionMenuLayout() {
  const compact = state.width <= 760;
  const titleY = compact ? Math.max(42, state.height * 0.06) : Math.max(92, state.height * 0.11);
  const gap = compact ? 10 : 18;

  if (compact) {
    const cardWidth = state.width - 32;
    const confirmHeight = 46;
    const cardsY = titleY + 58;
    const availableHeight = state.height - cardsY - confirmHeight - 34 - gap * Math.max(0, state.evolution.choices.length - 1);
    const cardHeight = clamp(Math.floor(availableHeight / Math.max(1, state.evolution.choices.length)), 92, 124);
    const cards = state.evolution.choices.map((choiceId, index) => ({
      index,
      choiceId,
      x: 16,
      y: cardsY + index * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
    }));
    const lastCard = cards[cards.length - 1] || { y: cardsY, height: 0 };
    const confirmY = lastCard.y + lastCard.height + 16;

    return {
      compact,
      titleY,
      cards,
      confirmButton: {
        x: (state.width - Math.min(320, state.width - 40)) / 2,
        y: confirmY,
        width: Math.min(320, state.width - 40),
        height: confirmHeight,
      },
    };
  }

  const cardWidth = Math.min(252, (state.width - 80 - gap * 2) / 3);
  const cardHeight = 262;
  const totalWidth = cardWidth * 3 + gap * 2;
  const startX = (state.width - totalWidth) / 2;
  const y = titleY + 72;
  const cards = state.evolution.choices.map((choiceId, index) => ({
    index,
    choiceId,
    x: startX + index * (cardWidth + gap),
    y,
    width: cardWidth,
    height: cardHeight,
  }));

  return {
    compact,
    titleY,
    cards,
    confirmButton: {
      x: (state.width - Math.min(360, state.width - 60)) / 2,
      y: y + cardHeight + 18,
      width: Math.min(360, state.width - 60),
      height: 48,
    },
  };
}

function getMapWorldRadius(detail = "mini") {
  const routeTarget = getQuestRouteTarget();
  const checkpoint = getCurrentCheckpoint();
  let farthest = Math.max(
    840,
    Math.hypot(state.player.x, state.player.y),
    Math.hypot(checkpoint.x, checkpoint.y),
  );

  for (const landmark of getNearbyLandmarks(detail === "large" ? 8 : 6)) {
    farthest = Math.max(farthest, Math.hypot(landmark.x, landmark.y));
  }

  if (routeTarget) {
    farthest = Math.max(farthest, Math.hypot(routeTarget.x, routeTarget.y));
  }

  return clamp(farthest + (detail === "large" ? 520 : 380), 960, detail === "large" ? 6400 : 5600);
}

function worldToMap(x, y, layout, worldRadius) {
  const nx = clamp(x / worldRadius, -1, 1);
  const ny = clamp(y / worldRadius, -1, 1);
  return {
    x: layout.centerX + nx * layout.mapRadius,
    y: layout.centerY + ny * layout.mapRadius,
  };
}

function getMapHitTarget(x, y) {
  if (state.menu.screen !== "playing") {
    return null;
  }

  if (state.map.expanded) {
    const layout = getExpandedMapLayout();
    const button = layout.closeButton;
    const insideClose =
      x >= button.x &&
      x <= button.x + button.width &&
      y >= button.y &&
      y <= button.y + button.height;
    return insideClose ? "map-close" : "map-panel";
  }

  const mini = getMiniMapLayout();
  return Math.hypot(x - mini.centerX, y - mini.centerY) <= mini.radius ? "map-mini" : null;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * state.width,
    y: ((event.clientY - rect.top) / rect.height) * state.height,
  };
}

function getExitPromptLayout() {
  const width = Math.min(520, state.width - 40);
  const height = 244;
  const x = (state.width - width) / 2;
  const y = (state.height - height) / 2;
  const buttonWidth = 146;
  const buttonHeight = 52;
  const gap = 18;
  const startX = state.width / 2 - buttonWidth - gap / 2;
  const buttonY = y + 162;

  return {
    width,
    height,
    x,
    y,
    buttons: [
      { index: 0, x: startX, y: buttonY, width: buttonWidth, height: buttonHeight },
      { index: 1, x: startX + buttonWidth + gap, y: buttonY, width: buttonWidth, height: buttonHeight },
    ],
  };
}

function getExitPromptHitTarget(x, y) {
  if (!state.exitPrompt.open) {
    return null;
  }

  const layout = getExitPromptLayout();
  return (
    layout.buttons.find(
      (button) =>
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height,
    ) || null
  );
}

function updateCanvasCursor(point = null) {
  if (point && state.exitPrompt.open) {
    canvas.style.cursor = getExitPromptHitTarget(point.x, point.y) ? "pointer" : "default";
    return;
  }

  if (state.professionMenu.open || state.blessingMenu.open || state.evolution.menuOpen) {
    canvas.style.cursor = "default";
    return;
  }

  const target = point ? getMapHitTarget(point.x, point.y) : null;
  canvas.style.cursor = target === "map-mini" || target === "map-close" ? "pointer" : "default";
}

function handleBlessingMenuTap(point) {
  const layout = getBlessingMenuLayout();
  if (pointInRect(point.x, point.y, layout.closeButton)) {
    closeBlessingMenu();
    return true;
  }

  const card = layout.cards.find((candidate) => pointInRect(point.x, point.y, candidate));
  if (card) {
    if (state.blessingMenu.selected === card.index) {
      purchaseSelectedBlessing();
    } else {
      selectBlessing(card.index);
    }
    return true;
  }

  if (pointInRect(point.x, point.y, layout.purchaseButton)) {
    purchaseSelectedBlessing();
    return true;
  }

  return pointInRect(point.x, point.y, {
    x: layout.panelX,
    y: layout.panelY,
    width: layout.panelWidth,
    height: layout.panelHeight,
  });
}

function handleProfessionMenuTap(point) {
  const layout = getProfessionMenuLayout();
  const card = layout.cards.find((candidate) => pointInRect(point.x, point.y, candidate));
  if (card) {
    if (state.professionMenu.selected === card.index) {
      confirmProfessionChoice();
    } else {
      state.professionMenu.selected = card.index;
      playSfx("menu");
    }
    return true;
  }

  if (pointInRect(point.x, point.y, layout.confirmButton)) {
    confirmProfessionChoice();
    return true;
  }

  return false;
}

function handleEvolutionMenuTap(point) {
  const layout = getEvolutionMenuLayout();
  const card = layout.cards.find((candidate) => pointInRect(point.x, point.y, candidate));
  if (card) {
    if (state.evolution.selected === card.index) {
      confirmEvolutionChoice();
    } else {
      state.evolution.selected = card.index;
      playSfx("menu");
    }
    return true;
  }

  if (pointInRect(point.x, point.y, layout.confirmButton)) {
    confirmEvolutionChoice();
    return true;
  }

  return false;
}

function handleCanvasTap(point) {
  if (state.menu.screen !== "playing") {
    return false;
  }

  const exitHit = getExitPromptHitTarget(point.x, point.y);
  if (exitHit) {
    state.exitPrompt.selected = exitHit.index;
    confirmExitPrompt();
    return true;
  }

  if (state.professionMenu.open) {
    return handleProfessionMenuTap(point);
  }

  if (state.blessingMenu.open) {
    return handleBlessingMenuTap(point);
  }

  if (state.evolution.menuOpen) {
    return handleEvolutionMenuTap(point);
  }

  if (state.exitPrompt.open) {
    return false;
  }

  const hitTarget = getMapHitTarget(point.x, point.y);
  if (hitTarget === "map-mini") {
    openWorldMap();
    return true;
  }

  if (hitTarget === "map-close") {
    closeWorldMap();
    return true;
  }

  return hitTarget === "map-panel";
}

function drawBackground() {
  const motion = getMotionFactor();
  ctx.fillStyle = state.backgroundGradient;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.globalAlpha = 0.28;
  for (let index = 0; index < 22; index += 1) {
    const drift = index * 173;
    const x = (drift * 0.37 + state.time * (8 + index * 0.5) * motion) % (state.width + 120) - 60;
    const y = (drift * 0.21 + state.time * (4 + index * 0.3) * motion) % (state.height + 120) - 60;
    ctx.fillStyle = index % 3 === 0 ? "#5ba7ff" : index % 3 === 1 ? "#7be0b1" : "#f2bf74";
    ctx.font = `${18 + (index % 4) * 5}px ${WORLD_FONT}`;
    ctx.fillText(index % 2 === 0 ? "丶" : "文", x, y);
  }
  ctx.restore();
}

function drawSanctuary(bounds) {
  const center = worldToScreen(0, 0, bounds);
  const pulse = SAFE_ZONE_RADIUS + Math.sin(state.time * 1.8) * 8 * getMotionFactor();

  ctx.save();
  ctx.strokeStyle = "rgba(123, 224, 177, 0.22)";
  ctx.fillStyle = "rgba(123, 224, 177, 0.05)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, pulse, 0, TAU);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `18px ${WORLD_FONT}`;
  ctx.fillStyle = "rgba(214, 255, 226, 0.8)";
  ctx.fillText("起笔村", center.x, center.y - SAFE_ZONE_RADIUS - 22);
  ctx.restore();
}

function drawWorld(bounds) {
  const motion = getMotionFactor();
  const startX = Math.floor(bounds.left / TILE_SIZE) - 1;
  const endX = Math.ceil((bounds.left + state.width) / TILE_SIZE) + 1;
  const startY = Math.floor(bounds.top / TILE_SIZE) - 1;
  const endY = Math.ceil((bounds.top + state.height) / TILE_SIZE) + 1;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let tileY = startY; tileY <= endY; tileY += 1) {
    for (let tileX = startX; tileX <= endX; tileX += 1) {
      const tile = getTerrainTile(tileX, tileY);
      const screenX = tileX * TILE_SIZE - bounds.left + TILE_SIZE / 2;
      const screenY = tileY * TILE_SIZE - bounds.top + TILE_SIZE / 2;
      const oscillation = Math.sin(tileX * 0.4 + tileY * 0.6 + state.time * 0.8) * 1.2 * motion;

      ctx.globalAlpha = tile.strong ? 1 : tile.village ? 0.96 : tile.landmark ? 0.92 : 0.84;
      ctx.fillStyle = tile.color;
      ctx.font = `${tile.strong ? TILE_SIZE * 0.9 : tile.landmark ? TILE_SIZE * 0.78 : TILE_SIZE * 0.72}px ${WORLD_FONT}`;
      if (tile.landmark || tile.village) {
        ctx.shadowColor = tile.color;
        ctx.shadowBlur = tile.activated ? 18 : 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillText(tile.glyph, screenX, screenY + oscillation);
    }
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawLandmarkAuras(bounds) {
  const landmarks = getNearbyLandmarks(4);
  const motion = getMotionFactor();

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const landmark of landmarks) {
    const screen = worldToScreen(landmark.x, landmark.y, bounds);
    if (screen.x < -100 || screen.x > state.width + 100 || screen.y < -100 || screen.y > state.height + 100) {
      continue;
    }

    const activated = isLandmarkActivated(landmark);
    const radius = activated ? 32 + Math.sin(state.time * 3 + landmark.cellX) * 3 * motion : 22;
    ctx.strokeStyle = activated ? "rgba(255, 239, 180, 0.42)" : "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = activated ? 2 : 1;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, TAU);
    ctx.stroke();

    if (landmark.distance < 280 || activated) {
      ctx.fillStyle = activated ? "#fff2bf" : "rgba(242, 235, 216, 0.72)";
      ctx.font = `15px ${WORLD_FONT}`;
      ctx.fillText(landmark.name, screen.x, screen.y - 40);
    }
  }

  ctx.restore();
}

function drawBullets(bounds) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const bullet of state.bullets) {
    const screen = worldToScreen(bullet.x, bullet.y, bounds);
    ctx.font = `24px ${WORLD_FONT}`;
    ctx.fillStyle = bullet.color;
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 12;
    ctx.fillText(bullet.glyph, screen.x, screen.y);
  }

  ctx.shadowBlur = 0;
}

function drawDrops(bounds) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const drop of state.drops) {
    const screen = worldToScreen(drop.x, drop.y, bounds);
    if (screen.x < -40 || screen.x > state.width + 40 || screen.y < -40 || screen.y > state.height + 40) {
      continue;
    }

    const item = drop.kind === "treasure" ? treasureMap[drop.itemId] : martialArtMap[drop.itemId];
    if (!item) {
      continue;
    }

    const bob = Math.sin(state.time * 3.8 + drop.bobSeed) * 5;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y + 10, 16, 0, TAU);
    ctx.fill();

    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = drop.kind === "fragment" ? 18 : 12;
    ctx.font = `${drop.kind === "fragment" ? 26 : 24}px ${WORLD_FONT}`;
    ctx.fillText(item.glyph, screen.x, screen.y + bob);
    ctx.shadowBlur = 0;

    if (drop.kind === "fragment") {
      ctx.font = `12px ${WORLD_FONT}`;
      ctx.fillStyle = "rgba(255, 244, 224, 0.9)";
      ctx.fillText("碎片", screen.x, screen.y - 22 + bob);
    }
  }

  ctx.restore();
}

function drawEnemyHealthBar(screenX, screenY, enemy) {
  if (enemy.maxHp <= 1) {
    return;
  }

  const width = enemy.tier === "boss" ? 84 : 40;
  const height = enemy.tier === "boss" ? 8 : 5;
  const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
  const x = screenX - width / 2;
  const y = screenY - enemy.size * 0.9;

  ctx.fillStyle = "rgba(10, 16, 24, 0.74)";
  roundRect(x, y, width, height, 4);
  ctx.fill();
  ctx.fillStyle = enemy.color;
  roundRect(x + 1, y + 1, (width - 2) * ratio, height - 2, 3);
  ctx.fill();
}

function drawEnemies(bounds) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const motion = getMotionFactor();

  for (const enemy of state.enemies) {
    const screen = worldToScreen(enemy.x, enemy.y, bounds);
    const bob = Math.sin(enemy.seed + state.time * 5) * 2.2 * motion;
    ctx.fillStyle = enemy.color;
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = enemy.tier === "boss" ? 18 : 12;
    ctx.font = `${enemy.size}px ${WORLD_FONT}`;
    ctx.fillText(enemy.char, screen.x, screen.y + bob);
    ctx.shadowBlur = 0;
    drawEnemyHealthBar(screen.x, screen.y, enemy);

    if (enemy.tier === "boss") {
      ctx.font = `16px ${WORLD_FONT}`;
      ctx.fillStyle = "#ffe4bf";
      ctx.fillText(enemy.name, screen.x, screen.y - enemy.size * 1.15);
    }
  }
}

function drawCheckpointMarkers(bounds) {
  const checkpoints = [];
  const villageCheckpoint = getVillageCheckpoint();
  const villageDistance = Math.hypot(villageCheckpoint.x - state.player.x, villageCheckpoint.y - state.player.y);
  if (villageDistance < 1800) {
    checkpoints.push({ ...villageCheckpoint, distance: villageDistance });
  }

  for (const landmark of getNearbyLandmarks(4)) {
    if (!isLandmarkActivated(landmark)) {
      continue;
    }
    checkpoints.push({
      ...checkpointFromLandmark(landmark),
      distance: landmark.distance,
    });
  }

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const activeCheckpoint = getCurrentCheckpoint();

  for (const checkpoint of checkpoints) {
    const screen = worldToScreen(checkpoint.x, checkpoint.y, bounds);
    if (screen.x < -100 || screen.x > state.width + 100 || screen.y < -100 || screen.y > state.height + 100) {
      continue;
    }

    const active = checkpointEquals(activeCheckpoint, checkpoint);
    ctx.strokeStyle = active ? "rgba(255, 241, 189, 0.72)" : "rgba(140, 230, 255, 0.26)";
    ctx.lineWidth = active ? 2.4 : 1.3;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, active ? 26 : 18, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = active ? "#fff0bf" : checkpoint.color;
    ctx.font = `18px ${WORLD_FONT}`;
    ctx.fillText(checkpoint.glyph, screen.x, screen.y);

    if (checkpoint.distance < 180 || active) {
      ctx.fillStyle = active ? "#fff0bf" : "rgba(242, 235, 216, 0.74)";
      ctx.font = `14px ${WORLD_FONT}`;
      ctx.fillText(active ? `${checkpoint.label} · 当前存档点` : checkpoint.label, screen.x, screen.y - 30);
    }
  }

  ctx.restore();
}

function drawNpcs(bounds) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const motion = getMotionFactor();

  for (const npc of state.npcs) {
    const screen = worldToScreen(npc.x, npc.y, bounds);
    if (screen.x < -60 || screen.x > state.width + 60 || screen.y < -60 || screen.y > state.height + 60) {
      continue;
    }

    const pulse = 24 + Math.sin(state.time * 3 + npc.bobSeed) * 4 * motion;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, pulse, 0, TAU);
    ctx.fill();

    ctx.fillStyle = npc.color;
    ctx.shadowColor = npc.color;
    ctx.shadowBlur = 15;
    ctx.font = `32px ${WORLD_FONT}`;
    ctx.fillText(npc.char, screen.x, screen.y + Math.sin(state.time * 2.6 + npc.bobSeed) * 2 * motion);
    ctx.shadowBlur = 0;

    ctx.font = `14px ${WORLD_FONT}`;
    ctx.fillStyle = "rgba(255, 244, 224, 0.86)";
    ctx.fillText(npc.name, screen.x, screen.y - 30);
  }
}

function drawPlayer(bounds) {
  const player = state.player;
  const screen = worldToScreen(player.x, player.y, bounds);
  const facing = normalizeVector(player.facingX, player.facingY);
  const profession = getActiveProfession();
  const motion = getMotionFactor();

  ctx.save();
  ctx.translate(screen.x, screen.y);

  const auraRadius = 42 + Math.sin(state.time * 4) * 4 * motion;
  const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, auraRadius);
  aura.addColorStop(
    0,
    player.flash > 0 ? "rgba(255, 165, 120, 0.38)" : `rgba(${profession.id === "mage" ? "220, 184, 255" : profession.id === "ranger" ? "151, 230, 255" : profession.id === "blade" ? "255, 216, 137" : "255, 238, 207"}, 0.3)`,
  );
  aura.addColorStop(1, "rgba(255, 238, 207, 0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, TAU);
  ctx.fill();

  if (player.invuln > 0 && Math.floor(state.time * 18) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  ctx.fillStyle = player.flash > 0 ? "#ffd9b0" : "#fff7e6";
  ctx.shadowColor = player.flash > 0 ? "#ff915a" : profession.color;
  ctx.shadowBlur = 18;
  ctx.font = `42px ${WORLD_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("我", 0, 0);

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 235, 198, 0.78)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(facing.x * 18, facing.y * 18);
  ctx.lineTo(facing.x * 28, facing.y * 28);
  ctx.stroke();

  const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
  const barWidth = 60;
  const barHeight = 8;
  const barX = -barWidth / 2;
  const barY = -54;
  ctx.fillStyle = "rgba(6, 10, 18, 0.76)";
  roundRect(barX, barY, barWidth, barHeight, 4);
  ctx.fill();
  ctx.fillStyle = hpRatio > 0.55 ? "#8fe08e" : hpRatio > 0.25 ? "#f2bf74" : "#ff8d7a";
  roundRect(barX + 1, barY + 1, (barWidth - 2) * hpRatio, barHeight - 2, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  roundRect(barX, barY, barWidth, barHeight, 4);
  ctx.stroke();
  ctx.restore();
}

function drawParticles(bounds) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const particle of state.particles) {
    const screen = worldToScreen(particle.x, particle.y, bounds);
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.font = `${particle.size}px ${WORLD_FONT}`;
    ctx.fillText(particle.glyph, screen.x, screen.y);
  }

  ctx.globalAlpha = 1;
}

function drawEffects(bounds) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const effect of state.effects) {
    const ratio = clamp(effect.life / effect.maxLife, 0, 1);
    const alpha = ratio * (effect.kind === "text" ? 1 : 0.92);

    if (effect.kind === "text") {
      const screen = worldToScreen(effect.x, effect.y, bounds);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = 10;
      ctx.font = `${effect.size}px ${WORLD_FONT}`;
      ctx.fillText(effect.text, screen.x, screen.y);
      ctx.shadowBlur = 0;
      continue;
    }

    if (effect.kind === "liuyun-dash") {
      const from = worldToScreen(effect.fromX, effect.fromY, bounds);
      const to = worldToScreen(effect.toX, effect.toY, bounds);
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, "rgba(168, 240, 255, 0)");
      gradient.addColorStop(0.28, "rgba(168, 240, 255, 0.22)");
      gradient.addColorStop(1, "rgba(168, 240, 255, 0.78)");
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 18 * (1 - ratio * 0.22);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      for (let index = 0; index < 4; index += 1) {
        const t = index / 3;
        const ghostX = lerp(from.x, to.x, t);
        const ghostY = lerp(from.y, to.y, t);
        ctx.fillStyle = `rgba(225, 251, 255, ${0.18 + (1 - t) * 0.18})`;
        ctx.font = `${28 - index * 4}px ${WORLD_FONT}`;
        ctx.fillText(index === 3 ? "我" : "云", ghostX, ghostY);
      }
      continue;
    }

    if (effect.kind === "huilan-wave") {
      const screen = worldToScreen(effect.x, effect.y, bounds);
      ctx.globalAlpha = alpha;
      for (let wave = 0; wave < 3; wave += 1) {
        const waveT = 1 - clamp(ratio + wave * 0.18, 0, 1);
        const radius = 48 + waveT * 122;
        ctx.strokeStyle = `rgba(255, 216, 148, ${0.28 - wave * 0.06})`;
        ctx.lineWidth = 4 - wave * 0.8;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius, 0, TAU);
        ctx.stroke();

        for (let index = 0; index < 8; index += 1) {
          const angle = (TAU / 8) * index + state.time * 1.8 + wave * 0.2;
          const glyphX = screen.x + Math.cos(angle) * radius;
          const glyphY = screen.y + Math.sin(angle) * radius;
          ctx.fillStyle = `rgba(255, 239, 198, ${0.28 - wave * 0.05})`;
          ctx.font = `${16 - wave * 2}px ${WORLD_FONT}`;
          ctx.fillText(index % 2 === 0 ? "澜" : "回", glyphX, glyphY);
        }
      }
      continue;
    }

    if (effect.kind === "guiyuan-guard") {
      const screen = worldToScreen(effect.x, effect.y, bounds);
      const shieldRadius = 60 + Math.sin((1 - ratio) * 8) * 6;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(220, 184, 255, 0.74)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, shieldRadius, 0, TAU);
      ctx.stroke();

      ctx.strokeStyle = "rgba(245, 229, 255, 0.36)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, shieldRadius - 12, 0, TAU);
      ctx.stroke();

      for (let index = 0; index < 6; index += 1) {
        const angle = state.time * 2.2 + (TAU / 6) * index;
        const glyphX = screen.x + Math.cos(angle) * shieldRadius;
        const glyphY = screen.y + Math.sin(angle) * shieldRadius;
        ctx.fillStyle = "rgba(248, 238, 255, 0.88)";
        ctx.font = `18px ${WORLD_FONT}`;
        ctx.fillText(index % 2 === 0 ? "诀" : "元", glyphX, glyphY);
      }
      continue;
    }

    if (effect.kind === "tafeng-aura") {
      const screen = worldToScreen(effect.x, effect.y, bounds);
      const spin = state.time * 3.6;
      const radius = 54 + Math.sin(state.time * 8) * 4;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(174, 247, 217, 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, TAU);
      ctx.stroke();

      ctx.strokeStyle = "rgba(236, 255, 248, 0.24)";
      ctx.lineWidth = 1.8;
      for (let band = 0; band < 3; band += 1) {
        const bandRadius = radius + 10 + band * 12;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, bandRadius, spin + band * 0.7, spin + Math.PI + band * 0.7);
        ctx.stroke();
      }

      for (let index = 0; index < 8; index += 1) {
        const angle = spin + (TAU / 8) * index;
        const glyphX = screen.x + Math.cos(angle) * (radius + 16);
        const glyphY = screen.y + Math.sin(angle) * (radius + 16);
        ctx.fillStyle = "rgba(236, 255, 248, 0.86)";
        ctx.font = `${index % 2 === 0 ? 16 : 14}px ${WORLD_FONT}`;
        ctx.fillText(index % 2 === 0 ? "风" : "轻", glyphX, glyphY);
      }
      continue;
    }

    if (effect.kind === "xingluo-burst") {
      const screen = worldToScreen(effect.x, effect.y, bounds);
      const burst = 1 - ratio;
      ctx.globalAlpha = alpha;
      for (let index = 0; index < 10; index += 1) {
        const angle = state.time * 2.4 + (TAU / 10) * index;
        const inner = 42 + burst * 24;
        const outer = 112 + burst * 64;
        const fromX = screen.x + Math.cos(angle) * inner;
        const fromY = screen.y + Math.sin(angle) * inner;
        const toX = screen.x + Math.cos(angle) * outer;
        const toY = screen.y + Math.sin(angle) * outer;
        ctx.strokeStyle = `rgba(191, 230, 255, ${0.26 + burst * 0.24})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.fillStyle = "rgba(240, 248, 255, 0.9)";
        ctx.font = `16px ${WORLD_FONT}`;
        ctx.fillText(index % 2 === 0 ? "星" : "潮", toX, toY);
      }
      continue;
    }

    if (effect.kind === "zhenyuan-pulse") {
      const screen = worldToScreen(effect.x, effect.y, bounds);
      const collapse = 1 - ratio;
      ctx.globalAlpha = alpha;
      for (let ring = 0; ring < 3; ring += 1) {
        const radius = 46 + ring * 28 + collapse * 36;
        ctx.strokeStyle = `rgba(199, 211, 255, ${0.36 - ring * 0.08})`;
        ctx.lineWidth = 4 - ring * 0.9;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius, 0, TAU);
        ctx.stroke();
      }

      for (let index = 0; index < 8; index += 1) {
        const angle = -state.time * 2.1 + (TAU / 8) * index;
        const glyphX = screen.x + Math.cos(angle) * (84 + collapse * 20);
        const glyphY = screen.y + Math.sin(angle) * (84 + collapse * 20);
        ctx.fillStyle = "rgba(235, 240, 255, 0.84)";
        ctx.font = `${index % 2 === 0 ? 18 : 16}px ${WORLD_FONT}`;
        ctx.fillText(index % 2 === 0 ? "渊" : "镇", glyphX, glyphY);
      }
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawDamageOverlay() {
  if (state.hurtPulse <= 0) {
    return;
  }

  const alpha = clamp(state.hurtPulse, 0, 1) * 0.26;
  const vignette = ctx.createRadialGradient(
    state.width / 2,
    state.height / 2,
    Math.min(state.width, state.height) * 0.14,
    state.width / 2,
    state.height / 2,
    Math.max(state.width, state.height) * 0.78,
  );
  vignette.addColorStop(0, "rgba(255, 120, 96, 0)");
  vignette.addColorStop(1, `rgba(255, 88, 72, ${alpha})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawMapContents(layout, detail = "mini") {
  const worldRadius = getMapWorldRadius(detail);
  const safeRadius = (SAFE_ZONE_RADIUS / worldRadius) * layout.mapRadius;
  const routeTarget = getQuestRouteTarget();
  const checkpoint = getCurrentCheckpoint();
  const mapPoints = [];
  const sampleCount = detail === "large" ? 18 : 11;
  const cellSize = (layout.mapRadius * 2) / sampleCount;

  ctx.save();
  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, layout.mapRadius, 0, TAU);
  ctx.clip();

  const bg = ctx.createRadialGradient(
    layout.centerX,
    layout.centerY,
    layout.mapRadius * 0.12,
    layout.centerX,
    layout.centerY,
    layout.mapRadius,
  );
  bg.addColorStop(0, "rgba(18, 40, 58, 0.96)");
  bg.addColorStop(0.56, "rgba(10, 24, 38, 0.94)");
  bg.addColorStop(1, "rgba(6, 12, 20, 0.98)");
  ctx.fillStyle = bg;
  ctx.fillRect(layout.centerX - layout.mapRadius, layout.centerY - layout.mapRadius, layout.mapRadius * 2, layout.mapRadius * 2);

  for (let row = 0; row < sampleCount; row += 1) {
    for (let col = 0; col < sampleCount; col += 1) {
      const nx = (col + 0.5) / sampleCount * 2 - 1;
      const ny = (row + 0.5) / sampleCount * 2 - 1;
      if (Math.hypot(nx, ny) > 1) {
        continue;
      }

      const worldX = nx * worldRadius;
      const worldY = ny * worldRadius;
      const tile = getTerrainTile(Math.round(worldX / TILE_SIZE), Math.round(worldY / TILE_SIZE));
      const screenX = layout.centerX + nx * layout.mapRadius;
      const screenY = layout.centerY + ny * layout.mapRadius;
      ctx.fillStyle = tile.color;
      ctx.globalAlpha = detail === "large" ? 0.22 : 0.18;
      ctx.fillRect(screenX - cellSize / 2, screenY - cellSize / 2, cellSize + 1, cellSize + 1);
    }
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let grid = -2; grid <= 2; grid += 1) {
    const offset = (grid / 2) * layout.mapRadius;
    ctx.beginPath();
    ctx.moveTo(layout.centerX + offset, layout.centerY - layout.mapRadius);
    ctx.lineTo(layout.centerX + offset, layout.centerY + layout.mapRadius);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(layout.centerX - layout.mapRadius, layout.centerY + offset);
    ctx.lineTo(layout.centerX + layout.mapRadius, layout.centerY + offset);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(123, 224, 177, 0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, safeRadius, 0, TAU);
  ctx.stroke();

  mapPoints.push({
    x: 0,
    y: 0,
    label: "起笔村",
    glyph: "坊",
    color: "#ffe1a1",
    kind: "village",
  });

  mapPoints.push({
    x: checkpoint.x,
    y: checkpoint.y,
    label: checkpoint.label,
    glyph: checkpoint.glyph,
    color: checkpoint.color,
    kind: "checkpoint",
  });

  for (const npc of state.npcs) {
    mapPoints.push({
      x: npc.x,
      y: npc.y,
      label: npc.name,
      glyph: npc.char,
      color: npc.color,
      kind: "npc",
    });
  }

  for (const landmark of getNearbyLandmarks(detail === "large" ? 8 : 6)) {
    mapPoints.push({
      x: landmark.x,
      y: landmark.y,
      label: landmark.name,
      glyph: landmark.core,
      color: landmark.color,
      kind: isLandmarkActivated(landmark) ? "landmark-active" : "landmark",
    });
  }

  if (routeTarget) {
    mapPoints.push({
      x: routeTarget.x,
      y: routeTarget.y,
      label: routeTarget.label,
      glyph: routeTarget.glyph,
      color: routeTarget.color,
      kind: "target",
    });
  }

  const seen = new Set();
  for (const point of mapPoints) {
    const key = `${point.kind}:${Math.round(point.x)}:${Math.round(point.y)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const mapped = worldToMap(point.x, point.y, layout, worldRadius);
    if (Math.hypot(mapped.x - layout.centerX, mapped.y - layout.centerY) > layout.mapRadius + 2) {
      continue;
    }

    const isTarget = point.kind === "target";
    const size =
      point.kind === "village" ? (detail === "large" ? 16 : 13)
      : point.kind === "checkpoint" ? (detail === "large" ? 14 : 11)
      : isTarget ? (detail === "large" ? 18 : 14)
      : detail === "large" ? 14 : 11;

    if (isTarget) {
      ctx.strokeStyle = `${point.color}bb`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mapped.x, mapped.y, size + 8 + Math.sin(state.time * 5) * 2, 0, TAU);
      ctx.stroke();
    }

    ctx.fillStyle = point.color;
    ctx.shadowColor = point.color;
    ctx.shadowBlur = detail === "large" ? 14 : 9;
    ctx.font = `${size}px ${WORLD_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(point.glyph, mapped.x, mapped.y);
    ctx.shadowBlur = 0;

    if (detail === "large" && (isTarget || point.kind === "checkpoint" || point.kind === "village")) {
      ctx.fillStyle = "rgba(255, 245, 220, 0.9)";
      ctx.font = `14px ${WORLD_FONT}`;
      ctx.fillText(point.label, mapped.x, mapped.y - 22);
    }
  }

  const playerPoint = worldToMap(state.player.x, state.player.y, layout, worldRadius);
  ctx.fillStyle = "#fff7e6";
  ctx.shadowColor = "#fff7e6";
  ctx.shadowBlur = 16;
  ctx.font = `${detail === "large" ? 24 : 18}px ${WORLD_FONT}`;
  ctx.fillText("我", playerPoint.x, playerPoint.y);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(playerPoint.x, playerPoint.y, detail === "large" ? 16 : 11, 0, TAU);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = detail === "large" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.14)";
  ctx.lineWidth = detail === "large" ? 2 : 1.6;
  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, layout.mapRadius, 0, TAU);
  ctx.stroke();
}

function drawMiniMap() {
  if (state.menu.screen !== "playing" || state.map.expanded) {
    return;
  }

  const layout = getMiniMapLayout();
  ctx.save();
  ctx.fillStyle = "rgba(4, 11, 17, 0.76)";
  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, layout.radius, 0, TAU);
  ctx.fill();
  drawMapContents(layout, "mini");

  ctx.fillStyle = "rgba(255, 245, 220, 0.88)";
  ctx.font = `${isCompactViewport() ? 13 : 14}px ${WORLD_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("地图", layout.centerX, layout.centerY - layout.radius - 12);
  ctx.font = `${isCompactViewport() ? 11 : 12}px ${WORLD_FONT}`;
  ctx.fillStyle = "rgba(215, 239, 255, 0.8)";
  ctx.fillText(isCompactViewport() ? "点按展开" : "点击或 M 展开", layout.centerX, layout.centerY + layout.radius + 12);
  ctx.restore();
}

function drawExpandedMap() {
  if (!state.map.expanded || state.menu.screen !== "playing") {
    return;
  }

  const layout = getExpandedMapLayout();
  const checkpoint = getCurrentCheckpoint();
  const routeTarget = getQuestRouteTarget();
  const tileX = Math.round(state.player.x / TILE_SIZE);
  const tileY = Math.round(state.player.y / TILE_SIZE);

  ctx.save();
  ctx.fillStyle = "rgba(3, 8, 14, 0.68)";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.fillStyle = "rgba(5, 10, 18, 0.92)";
  roundRect(layout.panelX, layout.panelY, layout.panelWidth, layout.panelHeight, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff2cc";
  ctx.font = `28px ${WORLD_FONT}`;
  ctx.fillText("字界地图", layout.panelX + 28, layout.panelY + 38);
  ctx.font = `15px ${WORLD_FONT}`;
  ctx.fillStyle = "rgba(242, 235, 216, 0.82)";
  ctx.fillText(`当前位置：${tileX}，${tileY}`, layout.panelX + 28, layout.panelY + 70);
  ctx.fillText(`存档点：${checkpoint.label}`, layout.panelX + 28, layout.panelY + 94);
  ctx.fillText(`目标：${routeTarget ? routeTarget.label : "自由探索"}`, layout.panelX + 28, layout.panelY + 118);

  const button = layout.closeButton;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(button.x, button.y, button.width, button.height, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff3dc";
  ctx.font = `20px ${WORLD_FONT}`;
  ctx.fillText("×", button.x + button.width / 2, button.y + button.height / 2 + 1);

  drawMapContents(layout, "large");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(242, 235, 216, 0.82)";
  ctx.font = `15px ${WORLD_FONT}`;
  ctx.fillText("M 或右上角关闭", layout.centerX, layout.panelY + layout.panelHeight - 28);
  ctx.restore();
}

function drawInteractionPrompt(bounds) {
  if (!state.interaction || state.professionMenu.open || state.blessingMenu.open || state.evolution.menuOpen) {
    return;
  }

  const target = state.interaction;
  const worldX = target.type === "npc" ? target.npc.x : target.type === "checkpoint" ? target.checkpoint.x : target.landmark.x;
  const worldY = target.type === "npc" ? target.npc.y : target.type === "checkpoint" ? target.checkpoint.y : target.landmark.y;
  const prompt = getInteractionPromptSpec(target);
  const screen = worldToScreen(worldX, worldY, bounds);
  const text = prompt.text;
  const width = prompt.width;
  const height = 34;
  const x = screen.x - width / 2;
  const y = screen.y - 74;

  ctx.fillStyle = "rgba(4, 11, 17, 0.76)";
  roundRect(x, y, width, height, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();

  ctx.fillStyle = "#fff7e6";
  ctx.font = `16px ${WORLD_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, screen.x, y + height / 2 + 1);
}

function drawQuestRoute(bounds) {
  if (state.menu.screen !== "playing" || state.professionMenu.open || state.blessingMenu.open || state.evolution.menuOpen || state.exitPrompt.open) {
    return;
  }

  const target = getQuestRouteTarget();
  if (!target || target.distance < 18) {
    return;
  }

  const playerScreen = worldToScreen(state.player.x, state.player.y, bounds);
  const targetScreen = worldToScreen(target.x, target.y, bounds);
  const direction = normalizeVector(target.x - state.player.x, target.y - state.player.y);
  const margin = 58;
  const edgeRadius = Math.min(state.width, state.height) * 0.36;
  const edgeX = clamp(state.width / 2 + direction.x * edgeRadius, margin, state.width - margin);
  const edgeY = clamp(state.height / 2 + direction.y * edgeRadius, margin, state.height - margin);
  const onScreen =
    targetScreen.x >= margin &&
    targetScreen.x <= state.width - margin &&
    targetScreen.y >= margin &&
    targetScreen.y <= state.height - margin;
  const routeEnd = onScreen ? targetScreen : { x: edgeX, y: edgeY };
  const glyphs = ["引", "路", "迹", target.glyph];
  const pulse = 0.82 + Math.sin(state.time * 4.6) * 0.12;

  ctx.save();
  ctx.strokeStyle = `${target.color}88`;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(playerScreen.x, playerScreen.y);
  ctx.lineTo(routeEnd.x, routeEnd.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const markerCount = clamp(Math.floor(Math.hypot(routeEnd.x - playerScreen.x, routeEnd.y - playerScreen.y) / 86), 3, 8);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let index = 1; index <= markerCount; index += 1) {
    const t = index / (markerCount + 1);
    const markerX = lerp(playerScreen.x, routeEnd.x, t);
    const markerY = lerp(playerScreen.y, routeEnd.y, t);
    ctx.fillStyle = `${target.color}${index % 2 === 0 ? "cc" : "99"}`;
    ctx.font = `${12 + (index % 2) * 2}px ${WORLD_FONT}`;
    ctx.fillText(glyphs[index % glyphs.length], markerX, markerY);
  }

  if (onScreen) {
    ctx.strokeStyle = `${target.color}aa`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(targetScreen.x, targetScreen.y, 26 + pulse * 8, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = "rgba(4, 11, 17, 0.76)";
    roundRect(targetScreen.x - 84, targetScreen.y - 64, 168, 36, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();
    ctx.fillStyle = "#fff7e6";
    ctx.font = `15px ${WORLD_FONT}`;
    ctx.fillText(`${target.subtitle} · ${Math.round(target.distance)}`, targetScreen.x, targetScreen.y - 46);
  } else {
    ctx.save();
    ctx.translate(edgeX, edgeY);
    ctx.rotate(Math.atan2(direction.y, direction.x));
    ctx.fillStyle = target.color;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-10, -12);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(4, 11, 17, 0.76)";
    roundRect(edgeX - 82, edgeY - 48, 164, 34, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();
    ctx.fillStyle = "#fff7e6";
    ctx.font = `14px ${WORLD_FONT}`;
    ctx.fillText(`${target.label} · ${Math.round(target.distance)}`, edgeX, edgeY - 31);
  }

  ctx.restore();
}

function drawToast() {
  if (state.toast.timer <= 0) {
    return;
  }

  const compact = isCompactViewport();
  const width = Math.min(compact ? state.width - 24 : 580, state.width - 24);
  const x = (state.width - width) / 2;
  const y = compact ? 12 : 18;
  const height = compact ? 42 : 46;

  ctx.fillStyle = "rgba(5, 10, 18, 0.72)";
  roundRect(x, y, width, height, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();

  ctx.font = `${compact ? 15 : 18}px ${WORLD_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = state.toast.color;
  ctx.fillText(state.toast.text, state.width / 2, y + height / 2);
}

function drawDialog() {
  if (state.dialog.timer <= 0) {
    return;
  }

  const compact = isCompactViewport();
  const width = Math.min(compact ? state.width - 24 : 640, state.width - 24);
  const height = compact ? 112 : 96;
  const x = (state.width - width) / 2;
  const y = state.height - height - getTouchControlClearance();

  ctx.fillStyle = "rgba(4, 11, 17, 0.76)";
  roundRect(x, y, width, height, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#f7e7c8";
  ctx.font = `${compact ? 16 : 18}px ${WORLD_FONT}`;
  ctx.fillText(state.dialog.speaker, x + 18, y + 14);

  ctx.fillStyle = "rgba(242, 235, 216, 0.92)";
  ctx.font = `${compact ? 14 : 16}px ${WORLD_FONT}`;
  drawWrappedText(state.dialog.text, x + 18, y + (compact ? 42 : 46), width - 36, compact ? 20 : 22, compact ? 3 : 2);
}

function drawCompactHud(skillLabel, martialLabel, routeTarget, checkpoint) {
  const currentRegion = regionDefinitions[state.quest.currentRegion] || regionDefinitions.village;
  const panelWidth = Math.min(state.width - 26, Math.max(210, state.width - (getMiniMapLayout().radius * 2 + 52)));
  const panelX = 12;
  const panelY = 12;
  const panelHeight = isEvolutionMode() ? 134 : 122;

  ctx.fillStyle = "rgba(4, 11, 17, 0.68)";
  roundRect(panelX, panelY, panelWidth, panelHeight, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff7e8";
  ctx.font = `18px ${WORLD_FONT}`;
  ctx.fillText(`心火 ${Math.round(state.player.hp)}/${state.player.maxHp}`, panelX + 16, panelY + 14);

  ctx.fillStyle = "rgba(242, 235, 216, 0.88)";
  ctx.font = `13px ${WORLD_FONT}`;
  ctx.fillText(`区域：${currentRegion.name}`, panelX + 16, panelY + 42);
  ctx.fillText(`章节：${getQuestStageName()}`, panelX + 16, panelY + 62);
  drawWrappedText(`任务：${routeTarget ? routeTarget.label : getQuestObjectiveText()}`, panelX + 16, panelY + 82, panelWidth - 32, 18, 2);

  const footerY = panelY + panelHeight - 22;
  ctx.fillStyle = "rgba(151, 230, 255, 0.9)";
  ctx.font = `12px ${WORLD_FONT}`;
  ctx.fillText(isEvolutionMode() ? `进化 ${state.evolution.level} 阶 · 字魄 ${state.evolution.xp}/${state.evolution.nextXp}` : `存档点：${checkpoint.label}`, panelX + 16, footerY);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(242, 235, 216, 0.78)";
  ctx.fillText(skillLabel, panelX + panelWidth - 16, panelY + 14);
  ctx.fillText(martialLabel, panelX + panelWidth - 16, panelY + 34);
}

function drawHud() {
  const nearestLandmark = getNearestLandmark(2000);
  const routeTarget = getQuestRouteTarget();
  const checkpoint = getCurrentCheckpoint();
  const tileX = Math.round(state.player.x / TILE_SIZE);
  const tileY = Math.round(state.player.y / TILE_SIZE);
  const accuracy = state.shotsFired ? Math.round((state.cleared / state.shotsFired) * 100) : 0;
  const profession = getActiveProfession();
  const martialArt = getActiveMartialArt();
  const skillLabel = profession.id === "wanderer"
    ? "未觉醒"
    : state.player.skillCooldown > 0
      ? `${profession.skill} ${state.player.skillCooldown.toFixed(1)}s`
      : `${profession.skill} 就绪`;
  const martialLabel = martialArt
    ? martialArt.id === "tafeng" && state.player.speedBoostTimer > 0
      ? `${martialArt.name} 疾行 ${state.player.speedBoostTimer.toFixed(1)}s`
      : state.player.artCooldown > 0
      ? `${martialArt.name} ${state.player.artCooldown.toFixed(1)}s`
      : `${martialArt.name} 就绪`
    : "未习得";
  const totalTreasures = Object.values(state.inventory.treasures).reduce((sum, count) => sum + count, 0);

  if (isCompactViewport()) {
    drawCompactHud(skillLabel, martialLabel, routeTarget, checkpoint);
    return;
  }

  const leftPanelHeight = isEvolutionMode() ? 220 : 196;
  const leftPanelY = state.height - leftPanelHeight - 26;

  ctx.fillStyle = "rgba(4, 11, 17, 0.58)";
  roundRect(18, leftPanelY, 378, leftPanelHeight, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();

  ctx.fillStyle = "#fff7e8";
  ctx.font = `20px ${WORLD_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("主角：我", 36, leftPanelY + 16);
  ctx.font = `15px ${WORLD_FONT}`;
  ctx.fillStyle = "rgba(242, 235, 216, 0.86)";
  ctx.fillText(`坐标：${tileX}，${tileY}`, 36, leftPanelY + 46);
  ctx.fillText(`心火：${Math.round(state.player.hp)} / ${state.player.maxHp}`, 36, leftPanelY + 68);
  ctx.fillText(`职业：${profession.name}`, 36, leftPanelY + 90);
  ctx.fillText(`职业技：${skillLabel}`, 36, leftPanelY + 112);
  ctx.fillText(`武功：${martialLabel}`, 36, leftPanelY + 134);
  if (isEvolutionMode()) {
    ctx.fillText(`进化：第 ${state.evolution.level} 阶    字魄 ${state.evolution.xp}/${state.evolution.nextXp}`, 36, leftPanelY + 156);
    ctx.fillText(`击破：${state.cleared}    首领：${state.evolution.bossesDefeated}`, 36, leftPanelY + 178);
    ctx.fillText(`存活：${formatRunDuration(state.evolution.elapsed)}    宝物 ${state.inventory.treasureScore}`, 36, leftPanelY + 200);
  } else {
    ctx.fillText(`净化：${state.cleared}    命中率：${accuracy}%`, 36, leftPanelY + 156);
    ctx.fillText(`宝物值：${state.inventory.treasureScore}    共 ${totalTreasures} 件`, 36, leftPanelY + 178);
    ctx.fillText(`存档点：${checkpoint.label}`, 36, leftPanelY + 200);
  }

  const panelWidth = 332;
  roundRect(state.width - panelWidth - 18, 78, panelWidth, 234, 18);
  ctx.fillStyle = "rgba(4, 11, 17, 0.56)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.stroke();

  ctx.fillStyle = "#f7e7c8";
  ctx.font = `18px ${WORLD_FONT}`;
  ctx.fillText("当前目标", state.width - panelWidth, 96);
  ctx.font = `15px ${WORLD_FONT}`;
  ctx.fillStyle = "rgba(242, 235, 216, 0.88)";

  // Show current region name
  const currentRegion = regionDefinitions[state.quest.currentRegion] || regionDefinitions.village;
  ctx.fillText(`区域：${currentRegion.name}`, state.width - panelWidth, 122);
  ctx.fillText(`章节：${getQuestStageName()}`, state.width - panelWidth, 144);
  drawWrappedText(`任务：${getQuestObjectiveText()}`, state.width - panelWidth, 168, panelWidth - 46, 20, 2);
  ctx.fillText(`进度：${getQuestProgressText()}`, state.width - panelWidth, 210);
  ctx.fillText(`指引：${routeTarget ? routeTarget.label : "已完成当前目标"}`, state.width - panelWidth, 232);
  ctx.fillText("移动：方向键 / WASD", state.width - panelWidth, 254);
  ctx.fillText("互动：K / 空格    攻击：J", state.width - panelWidth, 276);
  ctx.fillText("职业技：U", state.width - panelWidth, 298);
  ctx.fillText("武功：I    切换：O", state.width - panelWidth, 320);

  const inventoryPanelHeight = 108 + martialArts.length * 24;
  const inventoryPanelY = state.height - inventoryPanelHeight - 18;
  roundRect(state.width - panelWidth - 18, inventoryPanelY, panelWidth, inventoryPanelHeight, 18);
  ctx.fillStyle = "rgba(4, 11, 17, 0.52)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.stroke();

  ctx.fillStyle = "#f7e7c8";
  ctx.font = `18px ${WORLD_FONT}`;
  ctx.fillText("行囊与碎片", state.width - panelWidth, inventoryPanelY + 18);
  ctx.font = `15px ${WORLD_FONT}`;
  ctx.fillStyle = "rgba(242, 235, 216, 0.84)";
  if (nearestLandmark) {
    ctx.fillText(`附近遗迹：${nearestLandmark.name} · ${Math.round(nearestLandmark.distance)}`, state.width - panelWidth, inventoryPanelY + 44);
  } else {
    ctx.fillText("附近暂无遗迹", state.width - panelWidth, inventoryPanelY + 44);
  }

  ctx.fillText(
    `铜钱串 ${state.inventory.treasures.coin} · 玉佩 ${state.inventory.treasures.jade} · 锦囊 ${state.inventory.treasures.silk}`,
    state.width - panelWidth,
    inventoryPanelY + 70,
  );

  let martialLineY = inventoryPanelY + 96;
  for (const art of martialArts) {
    ctx.fillStyle = state.inventory.activeArt === art.id ? art.color : "rgba(242, 235, 216, 0.84)";
    ctx.fillText(`${state.inventory.activeArt === art.id ? "> " : ""}${art.name} ${getMartialArtStatusText(art)}`, state.width - panelWidth, martialLineY);
    martialLineY += 24;
  }
}

function drawBlessingMenu() {
  if (!state.blessingMenu.open) {
    return;
  }

  const selectedBlessing = blessingDefinitions[state.blessingMenu.selected];
  if (!selectedBlessing) {
    return;
  }

  const layout = getBlessingMenuLayout();
  const compact = layout.compact;
  const selectedRank = getBlessingRank(selectedBlessing.id);
  const nextCost = getBlessingCost(selectedBlessing);

  ctx.fillStyle = "rgba(3, 8, 14, 0.78)";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.fillStyle = "rgba(5, 10, 18, 0.92)";
  roundRect(layout.panelX, layout.panelY, layout.panelWidth, layout.panelHeight, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff1cc";
  ctx.font = `${compact ? 24 : 30}px ${WORLD_FONT}`;
  ctx.fillText("碑书记的字印台", layout.panelX + 24, layout.panelY + 22);

  ctx.fillStyle = "rgba(242, 235, 216, 0.88)";
  ctx.font = `${compact ? 14 : 16}px ${WORLD_FONT}`;
  ctx.fillText("把宝物值拓成常驻印记，强化之后会永久保存在存档中。", layout.panelX + 24, layout.panelY + (compact ? 56 : 62));

  const scoreWidth = compact ? 172 : 212;
  const scoreX = layout.panelX + layout.panelWidth - scoreWidth - 68;
  const scoreY = layout.panelY + 22;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(scoreX, scoreY, scoreWidth, 54, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f7e7c8";
  ctx.font = `${compact ? 14 : 16}px ${WORLD_FONT}`;
  ctx.fillText(`宝物值 ${state.inventory.treasureScore}`, scoreX + scoreWidth / 2, scoreY + 27);

  const closeButton = layout.closeButton;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff3dc";
  ctx.font = `18px ${WORLD_FONT}`;
  ctx.fillText("×", closeButton.x + closeButton.width / 2, closeButton.y + closeButton.height / 2 + 1);

  for (const card of layout.cards) {
    const blessing = blessingDefinitions[card.index];
    const rank = getBlessingRank(blessing.id);
    const selected = card.index === state.blessingMenu.selected;
    const cost = getBlessingCost(blessing);
    const affordable = Number.isFinite(cost) && state.inventory.treasureScore >= cost;

    ctx.fillStyle = selected ? "rgba(16, 34, 52, 0.96)" : "rgba(255,255,255,0.04)";
    roundRect(card.x, card.y, card.width, card.height, 20);
    ctx.fill();
    ctx.strokeStyle = selected ? blessing.color : "rgba(255,255,255,0.12)";
    ctx.lineWidth = selected ? 2.4 : 1;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = blessing.color;
    ctx.font = `${compact ? 13 : 15}px ${WORLD_FONT}`;
    ctx.fillText(`${card.index + 1}`, card.x + 16, card.y + 14);
    ctx.font = `${compact ? 32 : 42}px ${WORLD_FONT}`;
    ctx.fillText(blessing.glyph, card.x + 16, card.y + (compact ? 32 : 34));

    ctx.font = `${compact ? 18 : 22}px ${WORLD_FONT}`;
    ctx.fillText(blessing.name, card.x + 70, card.y + 20);

    ctx.fillStyle = "rgba(242, 235, 216, 0.88)";
    ctx.font = `${compact ? 12 : 14}px ${WORLD_FONT}`;
    ctx.fillText(`阶位 ${rank}/${blessing.maxRank}`, card.x + 70, card.y + (compact ? 46 : 52));
    ctx.fillText(`当前：${getBlessingBonusText(blessing, rank)}`, card.x + 70, card.y + (compact ? 66 : 76));
    drawWrappedText(blessing.summary, card.x + 16, card.y + (compact ? 86 : 102), card.width - 32, compact ? 18 : 20, 2);

    ctx.textAlign = "right";
    ctx.fillStyle =
      rank >= blessing.maxRank ? blessing.color : affordable ? "#fff4dc" : "#ffcab0";
    ctx.font = `${compact ? 12 : 15}px ${WORLD_FONT}`;
    ctx.fillText(rank >= blessing.maxRank ? "已满阶" : `消耗 ${cost}`, card.x + card.width - 16, card.y + card.height - 18);

    if (selected) {
      ctx.textAlign = "center";
      ctx.fillStyle = blessing.color;
      ctx.font = `${compact ? 12 : 14}px ${WORLD_FONT}`;
      ctx.fillText(supportsTouchInput() ? "点按卡片或下方按钮拓印" : "Enter 拓印", card.x + card.width / 2, card.y + card.height - 16);
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(layout.detailX, layout.detailY, layout.detailWidth, layout.detailHeight, 20);
  ctx.fill();
  ctx.strokeStyle = selectedBlessing.color;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = selectedBlessing.color;
  ctx.font = `${compact ? 18 : 20}px ${WORLD_FONT}`;
  ctx.fillText(`${selectedBlessing.name} · ${selectedBlessing.glyph}`, layout.detailX + 18, layout.detailY + 14);

  ctx.fillStyle = "rgba(242, 235, 216, 0.9)";
  ctx.font = `${compact ? 13 : 15}px ${WORLD_FONT}`;
  ctx.fillText(`当前效果：${getBlessingBonusText(selectedBlessing, selectedRank)}`, layout.detailX + 18, layout.detailY + 42);
  ctx.fillText(
    selectedRank >= selectedBlessing.maxRank
      ? "下一阶：已经封顶"
      : `下一阶：${getBlessingPreviewText(selectedBlessing, selectedRank)} · 消耗 ${nextCost}`,
    layout.detailX + 18,
    layout.detailY + 64,
  );

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(
    layout.purchaseButton.x,
    layout.purchaseButton.y,
    layout.purchaseButton.width,
    layout.purchaseButton.height,
    14,
  );
  ctx.fill();
  ctx.strokeStyle = selectedBlessing.color;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = selectedBlessing.color;
  ctx.font = `${compact ? 13 : 15}px ${WORLD_FONT}`;
  ctx.fillText("拓印", layout.purchaseButton.x + layout.purchaseButton.width / 2, layout.purchaseButton.y + layout.purchaseButton.height / 2 + 1);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(242, 235, 216, 0.76)";
  ctx.font = `${compact ? 12 : 14}px ${WORLD_FONT}`;
  ctx.fillText(
    supportsTouchInput() ? "点击卡片选择，点右下按钮拓印，右上角关闭" : "方向键 / 1-4 选择，Enter 购买，Esc 关闭",
    layout.detailX + layout.detailWidth - 18,
    layout.detailY + layout.detailHeight - 22,
  );
}

function drawProfessionMenu() {
  if (!state.professionMenu.open) {
    return;
  }

  const evolutionMode = isEvolutionMode();
  const layout = getProfessionMenuLayout();
  ctx.fillStyle = "rgba(3, 8, 14, 0.72)";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff2c6";
  ctx.font = `${layout.compact ? 26 : 30}px ${WORLD_FONT}`;
  ctx.fillText(evolutionMode ? "进化模式" : "新手村已通关", state.width / 2, layout.titleY);
  ctx.font = `${layout.compact ? 15 : 17}px ${WORLD_FONT}`;
  ctx.fillStyle = "rgba(242, 235, 216, 0.9)";
  ctx.fillText(
    evolutionMode ? "选择开局职业，之后靠击破敌人不断进阶变强。" : "选择你的职业，之后 J 与 U 的技能都会变化。",
    state.width / 2,
    layout.titleY + 34,
  );

  for (const card of layout.cards) {
    const profession = professionOptions[card.index];
    const selected = card.index === state.professionMenu.selected;

    ctx.fillStyle = selected ? "rgba(16, 34, 52, 0.94)" : "rgba(5, 10, 18, 0.82)";
    roundRect(card.x, card.y, card.width, card.height, 22);
    ctx.fill();
    ctx.strokeStyle = selected ? profession.color : "rgba(255,255,255,0.12)";
    ctx.lineWidth = selected ? 2.5 : 1;
    ctx.stroke();

    ctx.fillStyle = profession.color;
    ctx.textAlign = layout.compact ? "left" : "center";
    ctx.font = `${layout.compact ? 14 : 16}px ${WORLD_FONT}`;
    ctx.fillText(`${card.index + 1}`, card.x + (layout.compact ? 18 : 28), card.y + (layout.compact ? 16 : 28));
    ctx.font = `${layout.compact ? 30 : 44}px ${WORLD_FONT}`;
    ctx.fillText(profession.icon, layout.compact ? card.x + 34 : card.x + card.width / 2, card.y + (layout.compact ? 46 : 66));
    ctx.font = `${layout.compact ? 20 : 24}px ${WORLD_FONT}`;
    ctx.fillText(profession.name, layout.compact ? card.x + 116 : card.x + card.width / 2, card.y + (layout.compact ? 34 : 112));

    ctx.font = `${layout.compact ? 13 : 15}px ${WORLD_FONT}`;
    ctx.fillStyle = "rgba(242, 235, 216, 0.86)";
    if (layout.compact) {
      ctx.textAlign = "left";
      drawWrappedText(profession.summary, card.x + 68, card.y + 60, card.width - 86, 18, 2);
      ctx.fillText(`心火 ${profession.maxHp}`, card.x + 68, card.y + card.height - 42);
      ctx.fillText(profession.skill, card.x + 68, card.y + card.height - 22);
    } else {
      ctx.textAlign = "left";
      drawWrappedText(profession.summary, card.x + 18, card.y + 138, card.width - 36, 20, 2);
      ctx.textAlign = "center";
      ctx.fillText(`心火上限：${profession.maxHp}`, card.x + card.width / 2, card.y + 188);
      ctx.fillText(profession.attack, card.x + card.width / 2, card.y + 214);
      ctx.fillText(profession.skill, card.x + card.width / 2, card.y + 238);
    }

    if (selected) {
      ctx.fillStyle = profession.color;
      ctx.font = `${layout.compact ? 12 : 15}px ${WORLD_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(
        supportsTouchInput() ? "点按卡片或下方按钮确认" : "Enter 确认",
        card.x + card.width / 2,
        card.y + card.height - 14,
      );
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(
    layout.confirmButton.x,
    layout.confirmButton.y,
    layout.confirmButton.width,
    layout.confirmButton.height,
    16,
  );
  ctx.fill();
  ctx.strokeStyle = professionOptions[state.professionMenu.selected].color;
  ctx.stroke();
  ctx.fillStyle = professionOptions[state.professionMenu.selected].color;
  ctx.font = `${layout.compact ? 15 : 16}px ${WORLD_FONT}`;
  ctx.fillText("确认选择", layout.confirmButton.x + layout.confirmButton.width / 2, layout.confirmButton.y + layout.confirmButton.height / 2 + 1);

  ctx.fillStyle = "rgba(242, 235, 216, 0.84)";
  ctx.font = `${layout.compact ? 13 : 16}px ${WORLD_FONT}`;
  ctx.fillText(
    supportsTouchInput()
      ? "点击职业卡选择，点下方按钮确认。"
      : evolutionMode
        ? "左右方向键切换，或直接按 1 / 2 / 3，Enter 确认开局。"
        : "左右方向键切换，或直接按 1 / 2 / 3，Enter 确认。",
    state.width / 2,
    layout.confirmButton.y + layout.confirmButton.height + 22,
  );
}

function drawEvolutionMenu() {
  if (!state.evolution.menuOpen) {
    return;
  }

  const layout = getEvolutionMenuLayout();
  ctx.fillStyle = "rgba(3, 8, 14, 0.78)";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e9f6ff";
  ctx.font = `${layout.compact ? 27 : 32}px ${WORLD_FONT}`;
  ctx.fillText(`第 ${state.evolution.level} 阶进化`, state.width / 2, layout.titleY);
  ctx.font = `${layout.compact ? 15 : 17}px ${WORLD_FONT}`;
  ctx.fillStyle = "rgba(242, 235, 216, 0.9)";
  ctx.fillText("选择一条蜕变，把这一轮写法推得更远。", state.width / 2, layout.titleY + 34);

  for (const card of layout.cards) {
    const choice = getEvolutionChoiceById(card.choiceId);
    if (!choice) {
      continue;
    }

    const selected = card.index === state.evolution.selected;
    const currentRank = getEvolutionRank(choice.id);

    ctx.fillStyle = selected ? "rgba(14, 30, 48, 0.96)" : "rgba(5, 10, 18, 0.82)";
    roundRect(card.x, card.y, card.width, card.height, 22);
    ctx.fill();
    ctx.strokeStyle = selected ? choice.color : "rgba(255,255,255,0.12)";
    ctx.lineWidth = selected ? 2.4 : 1;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = choice.color;
    ctx.font = `${layout.compact ? 14 : 15}px ${WORLD_FONT}`;
    ctx.fillText(`${card.index + 1}`, card.x + 16, card.y + 16);
    ctx.font = `${layout.compact ? 30 : 40}px ${WORLD_FONT}`;
    ctx.fillText(choice.glyph, card.x + 16, card.y + (layout.compact ? 34 : 42));
    ctx.font = `${layout.compact ? 20 : 24}px ${WORLD_FONT}`;
    ctx.fillText(choice.name, card.x + 68, card.y + 22);

    ctx.fillStyle = "rgba(242, 235, 216, 0.84)";
    ctx.font = `${layout.compact ? 12 : 14}px ${WORLD_FONT}`;
    ctx.fillText(`阶位 ${currentRank}/${choice.maxRank}`, card.x + 68, card.y + (layout.compact ? 50 : 56));
    drawWrappedText(choice.summary, card.x + 18, card.y + (layout.compact ? 72 : 110), card.width - 36, layout.compact ? 18 : 22, layout.compact ? 2 : 3);

    ctx.fillStyle = "#fff3dd";
    ctx.font = `${layout.compact ? 13 : 16}px ${WORLD_FONT}`;
    ctx.fillText(`收益：${choice.bonus}`, card.x + 18, card.y + (layout.compact ? card.height - 30 : 192));

    if (selected) {
      ctx.textAlign = "center";
      ctx.fillStyle = choice.color;
      ctx.font = `${layout.compact ? 12 : 15}px ${WORLD_FONT}`;
      ctx.fillText(
        supportsTouchInput() ? "点按卡片或下方按钮进化" : "Enter 进化",
        card.x + card.width / 2,
        card.y + card.height - 16,
      );
    }
  }

  const selectedChoice = getEvolutionChoiceById(state.evolution.choices[state.evolution.selected]);
  const confirmColor = selectedChoice ? selectedChoice.color : "#d7efff";
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(
    layout.confirmButton.x,
    layout.confirmButton.y,
    layout.confirmButton.width,
    layout.confirmButton.height,
    16,
  );
  ctx.fill();
  ctx.strokeStyle = confirmColor;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = confirmColor;
  ctx.font = `${layout.compact ? 15 : 16}px ${WORLD_FONT}`;
  ctx.fillText("确认进化", layout.confirmButton.x + layout.confirmButton.width / 2, layout.confirmButton.y + layout.confirmButton.height / 2 + 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(242, 235, 216, 0.82)";
  ctx.font = `${layout.compact ? 13 : 16}px ${WORLD_FONT}`;
  ctx.fillText(
    supportsTouchInput() ? "点击蜕变卡选择，点下方按钮确认。" : "左右方向键切换，或直接按 1 / 2 / 3，Enter 确认。",
    state.width / 2,
    layout.confirmButton.y + layout.confirmButton.height + 22,
  );
}

function drawExitPrompt() {
  if (!state.exitPrompt.open) {
    return;
  }

  const layout = getExitPromptLayout();

  ctx.fillStyle = "rgba(3, 8, 14, 0.62)";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.fillStyle = "rgba(5, 10, 18, 0.88)";
  roundRect(layout.x, layout.y, layout.width, layout.height, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff1cc";
  ctx.font = `30px ${WORLD_FONT}`;
  ctx.fillText("是否退出？", state.width / 2, layout.y + 48);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(242, 235, 216, 0.88)";
  ctx.font = `17px ${WORLD_FONT}`;
  drawWrappedText(
    "返回开始界面后，只会保留最近一次存档。当前未保存进度不会被保存。",
    layout.x + 34,
    layout.y + 86,
    layout.width - 68,
    26,
    3,
  );

  const options = [
    { label: "退出", color: "#ffb29c" },
    { label: "继续游戏", color: "#8ce6ff" },
  ];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const button of layout.buttons) {
    const option = options[button.index];
    const selected = state.exitPrompt.selected === button.index;
    ctx.fillStyle = selected ? "rgba(16, 34, 52, 0.96)" : "rgba(255,255,255,0.04)";
    roundRect(button.x, button.y, button.width, button.height, 18);
    ctx.fill();
    ctx.strokeStyle = selected ? option.color : "rgba(255,255,255,0.12)";
    ctx.lineWidth = selected ? 2.2 : 1;
    ctx.stroke();

    ctx.fillStyle = selected ? option.color : "#fff3dd";
    ctx.font = `20px ${WORLD_FONT}`;
    ctx.fillText(option.label, button.x + button.width / 2, button.y + button.height / 2 + 1);
  }

  ctx.fillStyle = "rgba(242, 235, 216, 0.74)";
  ctx.font = `15px ${WORLD_FONT}`;
  ctx.fillText(
    supportsTouchInput() ? "点按按钮确认，点空白处无操作。" : "左右方向键切换，Enter 确认，Esc 取消。",
    state.width / 2,
    layout.y + layout.height - 22,
  );
}

function render() {
  drawBackground();
  const bounds = getCameraBounds();
  drawSanctuary(bounds);
  drawWorld(bounds);
  drawLandmarkAuras(bounds);
  drawCheckpointMarkers(bounds);
  drawDrops(bounds);
  drawParticles(bounds);
  drawBullets(bounds);
  drawEnemies(bounds);
  drawNpcs(bounds);
  drawPlayer(bounds);
  drawEffects(bounds);
  drawQuestRoute(bounds);
  drawInteractionPrompt(bounds);
  drawDamageOverlay();
  drawToast();
  drawHud();
  drawMiniMap();
  drawDialog();
  drawBlessingMenu();
  drawProfessionMenu();
  drawEvolutionMenu();
  drawExitPrompt();
  drawExpandedMap();
}

function loop(now) {
  const delta = clamp((now - state.lastTime) / 1000, 0, 0.033);
  state.lastTime = now;
  state.time += delta;

  if (
    state.menu.screen === "playing" &&
    !state.professionMenu.open &&
    !state.blessingMenu.open &&
    !state.evolution.menuOpen &&
    !state.exitPrompt.open &&
    !state.map.expanded
  ) {
    ensureEnemies();
    updatePlayer(delta);
    updateBullets(delta);
    updateDrops(delta);
    updateEnemies(delta);
  }

  if (
    state.menu.screen === "playing" &&
    !state.exitPrompt.open &&
    state.settings.autosave &&
    state.menu.autosavePending &&
    now - state.menu.lastAutosaveAt > 1200
  ) {
    saveGame(false);
  }

  updateParticles(delta);
  updateEffects(delta);
  updateUiState(delta);
  updateMusic();
  state.interaction = state.menu.screen === "playing" ? getInteractionTarget() : null;
  render();

  requestAnimationFrame(loop);
}

function preventScrolling(event) {
  if (
    [
      "Escape",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyJ",
      "KeyK",
      "KeyI",
      "KeyM",
      "KeyO",
      "KeyU",
      "Space",
      "Enter",
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
    ].includes(event.code)
  ) {
    event.preventDefault();
  }
}

window.addEventListener("keydown", (event) => {
  preventScrolling(event);

  if (state.menu.screen !== "playing") {
    return;
  }

  ensureAudioReady();

  if (state.exitPrompt.open) {
    if (event.code === "Escape" && !event.repeat) {
      closeExitPrompt();
    } else if (event.code === "ArrowLeft" || event.code === "KeyA") {
      state.exitPrompt.selected = 0;
      playSfx("menu");
    } else if (event.code === "ArrowRight" || event.code === "KeyD") {
      state.exitPrompt.selected = 1;
      playSfx("menu");
    } else if ((event.code === "Enter" || event.code === "Space" || event.code === "KeyK") && !event.repeat) {
      confirmExitPrompt();
    }
    return;
  }

  if (state.evolution.menuOpen) {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      state.evolution.selected = (state.evolution.selected + state.evolution.choices.length - 1) % state.evolution.choices.length;
      playSfx("menu");
    } else if (event.code === "ArrowRight" || event.code === "KeyD") {
      state.evolution.selected = (state.evolution.selected + 1) % state.evolution.choices.length;
      playSfx("menu");
    } else if (event.code === "Digit1") {
      state.evolution.selected = 0;
    } else if (event.code === "Digit2" && state.evolution.choices.length > 1) {
      state.evolution.selected = 1;
    } else if (event.code === "Digit3" && state.evolution.choices.length > 2) {
      state.evolution.selected = 2;
    } else if ((event.code === "Enter" || event.code === "Space" || event.code === "KeyK") && !event.repeat) {
      confirmEvolutionChoice();
    }
    return;
  }

  if (state.map.expanded) {
    if ((event.code === "Escape" || event.code === "KeyM") && !event.repeat) {
      closeWorldMap();
    }
    return;
  }

  if (state.blessingMenu.open) {
    if (event.code === "Escape" && !event.repeat) {
      closeBlessingMenu();
    } else if (event.code === "ArrowLeft" || event.code === "KeyA") {
      moveBlessingSelection(-1);
    } else if (event.code === "ArrowRight" || event.code === "KeyD") {
      moveBlessingSelection(1);
    } else if (event.code === "ArrowUp" || event.code === "KeyW") {
      moveBlessingSelection(-2);
    } else if (event.code === "ArrowDown" || event.code === "KeyS") {
      moveBlessingSelection(2);
    } else if (event.code === "Digit1") {
      selectBlessing(0);
    } else if (event.code === "Digit2") {
      selectBlessing(1);
    } else if (event.code === "Digit3") {
      selectBlessing(2);
    } else if (event.code === "Digit4") {
      selectBlessing(3);
    } else if ((event.code === "Enter" || event.code === "Space" || event.code === "KeyK") && !event.repeat) {
      purchaseSelectedBlessing();
    }
    return;
  }

  if (event.code === "Escape" && !event.repeat) {
    openExitPrompt();
    return;
  }

  if (state.professionMenu.open) {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      state.professionMenu.selected = (state.professionMenu.selected + professionOptions.length - 1) % professionOptions.length;
    } else if (event.code === "ArrowRight" || event.code === "KeyD") {
      state.professionMenu.selected = (state.professionMenu.selected + 1) % professionOptions.length;
    } else if (event.code === "Digit1") {
      state.professionMenu.selected = 0;
    } else if (event.code === "Digit2") {
      state.professionMenu.selected = 1;
    } else if (event.code === "Digit3") {
      state.professionMenu.selected = 2;
    } else if ((event.code === "Enter" || event.code === "Space" || event.code === "KeyK") && !event.repeat) {
      confirmProfessionChoice();
    }
    return;
  }

  if (event.code === "KeyM" && !event.repeat) {
    toggleWorldMap();
    return;
  }

  keys[event.code] = true;

  if ((event.code === "KeyK" || event.code === "Space") && !event.repeat) {
    attemptInteraction();
  }

  if (event.code === "KeyJ" && !event.repeat && state.player.cooldown <= 0) {
    usePrimaryAttack();
  }

  if (event.code === "KeyU" && !event.repeat) {
    useClassSkill();
  }

  if (event.code === "KeyI" && !event.repeat) {
    useMartialArt();
  }

  if (event.code === "KeyO" && !event.repeat) {
    cycleMartialArt(1);
  }
});

window.addEventListener("keyup", (event) => {
  preventScrolling(event);
  keys[event.code] = false;
});

window.addEventListener("blur", () => {
  clearPressedKeys();
  resetTouchMovement();
  releaseTouchAttack();
  canvas.style.cursor = "default";
});

touchMovementPad.addEventListener("pointerdown", (event) => {
  if (!shouldShowTouchControls()) {
    return;
  }

  event.preventDefault();
  ensureAudioReady();
  state.touch.movePointerId = event.pointerId;
  touchMovementPad.setPointerCapture?.(event.pointerId);
  setTouchMovementFromPoint(event.clientX, event.clientY);
});

touchMovementPad.addEventListener("pointermove", (event) => {
  if (state.touch.movePointerId !== event.pointerId) {
    return;
  }

  event.preventDefault();
  setTouchMovementFromPoint(event.clientX, event.clientY);
});

for (const eventName of ["pointerup", "pointercancel"]) {
  touchMovementPad.addEventListener(eventName, (event) => {
    if (state.touch.movePointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    resetTouchMovement();
  });
}

touchAttackButton.addEventListener("pointerdown", (event) => {
  if (!shouldShowTouchControls()) {
    return;
  }

  event.preventDefault();
  ensureAudioReady();
  state.touch.attackPointerId = event.pointerId;
  touchAttackButton.setPointerCapture?.(event.pointerId);
  keys.KeyJ = true;
  if (state.player.cooldown <= 0) {
    usePrimaryAttack();
  }
});

for (const eventName of ["pointerup", "pointercancel"]) {
  touchAttackButton.addEventListener(eventName, (event) => {
    if (state.touch.attackPointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    releaseTouchAttack();
  });
}

function bindTouchAction(button, handler) {
  button.addEventListener("pointerdown", (event) => {
    if (!shouldShowTouchControls()) {
      return;
    }

    event.preventDefault();
    ensureAudioReady();
    handler();
  });
}

function bindMenuButton(button, handler) {
  let armedPointerId = null;
  let guardUntil = 0;

  const runHandler = (event = null) => {
    const now = performance.now();
    if (now < guardUntil) {
      if (event) {
        event.preventDefault();
      }
      return;
    }

    if (event) {
      event.preventDefault();
    }

    guardUntil = now + 320;

    try {
      handler();
    } catch (error) {
      console.error("Menu action failed:", error);
      setMenuStatus("启动失败，请重试。", "error");
    }
  };

  button.addEventListener("pointerdown", (event) => {
    armedPointerId = event.pointerId;
  });

  button.addEventListener("pointerup", (event) => {
    if (armedPointerId !== null && event.pointerId !== armedPointerId) {
      return;
    }

    armedPointerId = null;
    runHandler(event);
  });

  button.addEventListener("pointercancel", () => {
    armedPointerId = null;
  });

  button.addEventListener("touchend", (event) => {
    runHandler(event);
  }, { passive: false });

  button.addEventListener("click", (event) => {
    runHandler(event);
  });
}

bindTouchAction(touchMenuButton, openExitPrompt);
bindTouchAction(touchInteractButton, attemptInteraction);
bindTouchAction(touchSkillButton, useClassSkill);
bindTouchAction(touchArtButton, useMartialArt);

canvas.addEventListener("mousemove", (event) => {
  const point = getCanvasPoint(event);
  const exitHit = getExitPromptHitTarget(point.x, point.y);
  if (exitHit && state.exitPrompt.selected !== exitHit.index) {
    state.exitPrompt.selected = exitHit.index;
  }
  updateCanvasCursor(point);
});

canvas.addEventListener("mouseleave", () => {
  canvas.style.cursor = "default";
});

canvas.addEventListener("pointerup", (event) => {
  if (state.menu.screen !== "playing") {
    return;
  }

  const point = getCanvasPoint(event);
  handleCanvasTap(point);
  updateCanvasCursor(point);
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", () => {
  if (state.menu.screen === "playing" && state.settings.autosave && !isEvolutionMode()) {
    saveGame(false);
  }
});

bindMenuButton(startGameButton, () => {
  setMenuStatus("正在进入游戏...", "success");
  ensureAudioReady();
  playSfx("menu");
  startNewGame();
});

bindMenuButton(evolutionModeButton, () => {
  setMenuStatus("正在进入进化模式...", "success");
  ensureAudioReady();
  playSfx("menu");
  startEvolutionMode();
});

bindMenuButton(loadSaveButton, () => {
  ensureAudioReady();
  playSfx("menu");
  loadSavedGame();
});

bindMenuButton(openSettingsButton, () => {
  ensureAudioReady();
  playSfx("menu");
  openSettings();
});

bindMenuButton(closeSettingsButton, () => {
  playSfx("menu");
  closeSettings();
});

settingAutosave.addEventListener("change", () => {
  state.settings.autosave = settingAutosave.checked;
  persistSettings();
  updateMenuUi();
  playSfx("menu");
  setMenuStatus(state.settings.autosave ? "自动存档已开启。" : "自动存档已关闭。", "success");
});

settingReducedMotion.addEventListener("change", () => {
  state.settings.reducedMotion = settingReducedMotion.checked;
  persistSettings();
  updateMenuUi();
  playSfx("menu");
  setMenuStatus(state.settings.reducedMotion ? "已减弱动态效果。" : "动态效果已恢复。", "success");
});

settingMusic.addEventListener("change", () => {
  state.settings.music = settingMusic.checked;
  if (state.settings.music) {
    ensureAudioReady();
  }
  persistSettings();
  updateAudioSettings();
  updateMenuUi();
  playSfx("menu");
  setMenuStatus(state.settings.music ? "背景音乐已开启。" : "背景音乐已关闭。", "success");
});

settingSfx.addEventListener("change", () => {
  state.settings.sfx = settingSfx.checked;
  if (state.settings.sfx) {
    ensureAudioReady();
  }
  persistSettings();
  updateAudioSettings();
  updateMenuUi();
  playSfx("menu");
  setMenuStatus(state.settings.sfx ? "音效已开启。" : "音效已关闭。", "success");
});

exportSaveButton.addEventListener("click", () => {
  playSfx("menu");
  exportSave();
});

importSaveButton.addEventListener("click", () => {
  playSfx("menu");
  importSave();
});

importFileInput.addEventListener("change", handleFileImport);

resizeCanvas();
updateMenuUi();
requestAnimationFrame(loop);
