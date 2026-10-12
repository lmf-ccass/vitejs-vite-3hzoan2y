export const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
export const MAX_SPECIES = 16;
export const ISOLATION_THRESHOLD = 14; // 遺傳距離 ≥ 此值 => 生殖隔離(可調)

export const ENV_DEFS = [
  { key: 'temp', icon: '🌡️', label: '氣候溫度', hint: '低溫→體型變大(伯格曼)、毛/羽保暖;高溫→大耳散熱' },
  { key: 'humidity', icon: '💧', label: '氣候濕度', hint: '潮濕→體色較深(葛洛格法則)' },
  { key: 'oxygen', icon: '🫁', label: '氧氣濃度', hint: '高氧→容許巨大體型,也較易飛行' },
  { key: 'gravity', icon: '⚖️', label: '重力大小', hint: '高重力→體型小、四肢粗短、飛行困難' },
  { key: 'waterDepth', icon: '🌊', label: '水域深度', hint: '約>60 轉為水生;深水光線弱' },
  { key: 'waterWide', icon: '🏞️', label: '水域廣闊度', hint: '廣闊→水生體型大、流線型、尾巴發達' },
  { key: 'preySpeed', icon: '🐇', label: '獵物速度', hint: '獵物快→四肢長、流線型、偏肉食' },
  { key: 'foodHeight', icon: '🌿', label: '食物高度', hint: '食物高→陸生脖子變長' },
  { key: 'predator', icon: '🦖', label: '捕食者威脅', hint: '高→保護色、盔甲,或飛行逃生' },
  { key: 'light', icon: '☀️', label: '光照強度', hint: '低光→大眼睛;極低光→生物發光' },
  { key: 'steep', icon: '⛰️', label: '地形陡峭度', hint: '落差大→翅膀、飛行、羽毛' },
  { key: 'veg', icon: '🌳', label: '植被密度', hint: '茂密→保護色、四肢縮短(蛇形)、偏草食' },
];

// hue:該棲地的保護色色相;bias:額外的性狀目標加成
export const HABITATS = {
  forest: { label: '森林', icon: '🌲', hue: 115, bias: { camo: 8, eye: 4 },
    env: { temp: 55, humidity: 80, oxygen: 60, gravity: 50, waterDepth: 10, waterWide: 15, preySpeed: 45, foodHeight: 75, predator: 55, light: 35, steep: 40, veg: 90 } },
  desert: { label: '沙漠', icon: '🏜️', hue: 38, bias: { ear: 8, pigment: -12, scav: 6 },
    env: { temp: 90, humidity: 8, oxygen: 45, gravity: 50, waterDepth: 0, waterWide: 0, preySpeed: 60, foodHeight: 20, predator: 45, light: 95, steep: 30, veg: 10 } },
  ocean: { label: '海洋', icon: '🌊', hue: 205, bias: { pigment: -5 },
    env: { temp: 50, humidity: 90, oxygen: 50, gravity: 50, waterDepth: 85, waterWide: 85, preySpeed: 65, foodHeight: 0, predator: 60, light: 65, steep: 10, veg: 30 } },
  polar: { label: '極地', icon: '🧊', hue: 195, bias: { pigment: -35, fur: 8, camo: 5, scav: 6 },
    env: { temp: 5, humidity: 30, oxygen: 55, gravity: 50, waterDepth: 25, waterWide: 30, preySpeed: 40, foodHeight: 10, predator: 30, light: 50, steep: 25, veg: 5 } },
  plain: { label: '平原', icon: '🌾', hue: 70, bias: { limb: 5, eye: 3 },
    env: { temp: 60, humidity: 45, oxygen: 50, gravity: 50, waterDepth: 5, waterWide: 10, preySpeed: 70, foodHeight: 30, predator: 60, light: 80, steep: 10, veg: 45 } },
  shore: { label: '岩岸', icon: '🪨', hue: 28, bias: { armor: 8, wing: 6 },
    env: { temp: 50, humidity: 70, oxygen: 55, gravity: 50, waterDepth: 40, waterWide: 50, preySpeed: 50, foodHeight: 30, predator: 40, light: 70, steep: 85, veg: 25 } },
};

export const TRAIT_LABELS = {
  aquatic: '水生程度', size: '體型', limb: '四肢長度', neck: '脖子', ear: '耳朵', wing: '翅膀',
  stream: '流線型', eye: '眼睛', tail: '尾巴', jaw: '顎/喙粗壯', camo: '保護色', glow: '生物發光',
  fur: '毛髮', feather: '羽毛', armor: '盔甲', pigment: '色素深淺',
};
export const DIET_LABELS = { herb: '草食傾向', carn: '肉食傾向', scav: '食腐傾向' };

export const CLADES = {
  reptile: { zh: '爬行類', icon: '🦎', color: '#4ade80' },
  mammal: { zh: '哺乳類', icon: '🐾', color: '#fb923c' },
  bird: { zh: '鳥類', icon: '🐦', color: '#38bdf8' },
};
export const MODE_ICON = { aquatic: '🌊', flying: '🕊️', gliding: '🪂', land: '🦶' };