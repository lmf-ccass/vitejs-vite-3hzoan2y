import { HABITATS, clamp, MAX_SPECIES, ISOLATION_THRESHOLD } from './data';

export const TRAIT_KEYS = ['aquatic', 'size', 'limb', 'neck', 'ear', 'wing', 'stream', 'eye', 'tail',
  'jaw', 'camo', 'glow', 'fur', 'feather', 'armor', 'pigment'];
export const DIET_KEYS = ['herb', 'carn', 'scav'];
const BIAS_KEYS = ['size', 'limb', 'neck', 'ear', 'wing', 'eye', 'tail', 'jaw', 'camo', 'fur', 'feather', 'armor', 'herb', 'carn', 'scav'];

const PROTO = { aquatic: 3, size: 30, limb: 45, neck: 20, ear: 10, wing: 0, stream: 15, eye: 30, tail: 50,
  jaw: 35, camo: 25, glow: 0, fur: 0, feather: 0, armor: 20, pigment: 45, hue: 90 };

/* ---------- 隨機數(狀態存在 world.seed,方便 structuredClone) ---------- */
export function makeRng(world) {
  return () => {
    world.seed = (world.seed + 0x6D2B79F5) | 0;
    let t = Math.imul(world.seed ^ (world.seed >>> 15), 1 | world.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- 世界 / 樹 ---------- */
export function createWorld(seed = Math.floor(Math.random() * 1e6)) {
  const root = {
    id: 1, parent: null, children: [], bornGen: 0, endGen: null,
    habitat: 'plain', env: { ...HABITATS.plain.env }, clade: 'reptile',
    traits: { ...PROTO }, diet: { herb: 40, carn: 40, scav: 10 }, bias: {},
    form: null, pend: null, pendN: 0, isolated: false,
    log: [{ gen: 0, text: '原始爬行類出現' }],
  };
  const w = { gen: 0, seed, nextId: 2, rootId: 1, nodes: { 1: root } };
  root.form = analyze(root).zh;
  return w;
}
export const leavesOf = (w) => Object.values(w.nodes).filter((n) => !n.children.length);
export function lineage(w, id) {
  const path = [];
  for (let n = w.nodes[id]; n; n = n.parent ? w.nodes[n.parent] : null) path.unshift(n);
  return path;
}

/* ---------- 演化目標:環境壓力 → 各性狀的「理想值」 ---------- */
export function computeTargets(sp) {
  const E = sp.env, H = HABITATS[sp.habitat], B = sp.bias || {}, T = sp.traits, D = sp.diet, clade = sp.clade;
  const n = (k) => E[k] / 100;
  const t = n('temp'), hu = n('humidity'), ox = n('oxygen'), g = n('gravity'), wd = n('waterDepth'),
    ww = n('waterWide'), ps = n('preySpeed'), fh = n('foodHeight'), pr = n('predator'),
    li = n('light'), st = n('steep'), vg = n('veg');
  const b = (k) => (B[k] || 0) + (H.bias[k] || 0);
  const a = T.aquatic / 100, isAq = T.aquatic > 50;
  const liEff = li * (1 - 0.75 * wd); // 深水光線衰減
  const tg = {};

  tg.aquatic = clamp((wd - 0.2) * 125 + b('aquatic'));

  // 體型:伯格曼、氧氣、重力、水域廣闊、捕食者;會飛的有體型上限
  let size = 38 + (1 - t) * 25 + (ox - 0.5) * 50 - (g - 0.5) * 40 * (1 - 0.7 * a) + a * ww * 30 + pr * 8 - vg * 10 + b('size');
  if (!isAq && T.wing > 50) size = Math.min(size, (clade === 'bird' ? 72 : 50) - (g - 0.5) * 30 + (ox - 0.5) * 30);
  tg.size = clamp(size);

  tg.limb = isAq ? clamp(28 + ps * 25 + b('limb'))
    : clamp(35 + ps * 28 + (0.5 - g) * 40 + st * 8 - vg * (8 + (1 - ps) * 28) + b('limb') + (clade === 'bird' ? ps * 6 : 0));

  let neck = (1 - a) * (12 + fh * 72) + b('neck');
  if (clade === 'bird' && ww > 0.4 && wd > 0.1 && wd < 0.5) neck += 15;
  tg.neck = isAq ? 0 : clamp(neck);

  tg.ear = isAq ? 0 : clamp((12 + t * 55 + (1 - li) * 18) * (clade === 'mammal' ? 1 : 0.45) + b('ear'));
  tg.tail = clamp(30 + ps * 15 + a * (10 + ww * 45) + (1 - g) * 10 + b('tail'));

  const sLand = 10 + ps * 25 + (T.wing > 55 ? 12 : 0), sWater = 30 + ww * 35 + ps * 35;
  tg.stream = clamp(sLand + (sWater - sLand) * a);

  tg.eye = clamp(22 + (1 - liEff) * 60 + pr * 8 + b('eye'));
  tg.glow = clamp(Math.max(0, (0.2 - liEff) / 0.2) * (55 + 45 * a) + b('glow'));

  // 毛髮 vs 羽毛:先達 55 者「定型」,之後另一種被壓到 0
  const furP = (1 - t) * 55 + (1 - li) * 25 + vg * 15 + hu * 5 + ps * 25 + b('fur');
  const featherP = st * 45 + pr * 20 + (1 - vg) * 15 + fh * 10 + (1 - t) * 25 + b('feather');
  if (clade === 'mammal') { tg.fur = clamp(Math.max(furP, 60) - a * 25); tg.feather = 0; }
  else if (clade === 'bird') { tg.feather = clamp(Math.max(featherP, 60)); tg.fur = 0; }
  else { tg.fur = clamp(furP); tg.feather = clamp(featherP); }

  tg.armor = clamp((pr * 45 + (1 - ps) * 30 + g * 10 - 15) * (clade === 'reptile' ? 1 : 0.4) * (T.wing > 35 ? 0.3 : 1) + b('armor'));
  tg.camo = clamp(pr * 70 + vg * 40 - 10 + b('camo'));
  tg.pigment = clamp(15 + hu * 70 + (1 - li) * 8 + b('pigment'));

  // 飛行:壓力 − 代價。鳥類羽毛有加成,哺乳類較難
  const press = st * 45 + pr * 25 + fh * 20 + (clade === 'bird' ? 18 : clade === 'mammal' ? -5 : 0) + b('wing');
  const cost = g * 40 + Math.max(0, T.size - 50) * 0.8 + (1 - ox) * 15 + Math.max(0, T.aquatic - 30) * 1.2;
  const mult = clade === 'bird' ? 1.25 : clade === 'mammal' ? 0.7 : 0.9;
  tg.wing = isAq ? 0 : clamp((press - cost) * 1.6 * mult);

  // 食性
  tg.herb = clamp((1 - a) * (vg * 55 + hu * 25 + fh * 10 + (t > 0.3 ? 10 : 0)) + a * (ww * 20 + li * 25) + b('herb'));
  tg.carn = clamp(15 + ps * 50 + a * 30 + (1 - vg) * 10 + b('carn'));
  tg.scav = clamp(pr * 40 + (1 - vg) * 20 + (1 - hu) * 25 - ps * 10 + b('scav'));
  tg.jaw = clamp(20 + 0.45 * D.carn + 0.35 * D.scav + (1 - vg) * 0.2 * D.herb + b('jaw'));
  return tg;
}

/* ---------- 單物種一代 ---------- */
function stepSpecies(sp, strength, rng) {
  const tg = computeTargets(sp), T = sp.traits, D = sp.diet;
  for (const k of TRAIT_KEYS) T[k] = clamp(T[k] + (tg[k] - T[k]) * strength + (rng() - 0.5) * 0.6); // 突變 ±0.3
  for (const k of DIET_KEYS) D[k] = clamp(D[k] + (tg[k] - D[k]) * strength + (rng() - 0.5) * 0.6);
  const d = ((HABITATS[sp.habitat].hue - T.hue + 540) % 360) - 180; // 色相走最短弧
  T.hue = (T.hue + d * strength * (0.4 + (sp.env.predator / 100) * 0.8) + (rng() - 0.5) * 0.6 + 360) % 360;
}

function updateClade(sp, gen) {
  if (sp.clade !== 'reptile') return;
  const { fur, feather } = sp.traits;
  if (feather >= 55 && feather >= fur) { sp.clade = 'bird'; sp.log.push({ gen, text: '🪶 羽毛定型:演化成鳥類譜系' }); }
  else if (fur >= 55 && fur > feather) { sp.clade = 'mammal'; sp.log.push({ gen, text: '🧶 毛髮定型:演化成哺乳類譜系' }); }
}

function trackForm(sp, gen) { // 新型態需連續 12 代才確認,避免閾值附近來回跳
  const f = analyze(sp).zh;
  if (f === sp.form) { sp.pend = null; sp.pendN = 0; return; }
  if (sp.pend === f) sp.pendN++; else { sp.pend = f; sp.pendN = 1; }
  if (sp.pendN >= 12) { sp.log.push({ gen, text: `形態改變:${sp.form} → ${f}` }); sp.form = f; sp.pend = null; sp.pendN = 0; }
}

export function distance(a, b) {
  let s = 0, c = 0;
  for (const k of TRAIT_KEYS) { const d = a.traits[k] - b.traits[k]; s += d * d; c++; }
  for (const k of DIET_KEYS) { const d = a.diet[k] - b.diet[k]; s += d * d; c++; }
  let dh = Math.abs(a.traits.hue - b.traits.hue); dh = Math.min(dh, 360 - dh);
  s += (dh / 180 * 50) ** 2; c++;
  return Math.sqrt(s / c) + (a.clade !== b.clade ? 10 : 0);
}

// 基因流:同棲地、尚未生殖隔離的姊妹族群互相拉近;一旦隔離達成就永久隔離
function geneFlow(world) {
  for (const p of Object.values(world.nodes)) {
    if (p.children.length !== 2) continue;
    const a = world.nodes[p.children[0]], b = world.nodes[p.children[1]];
    if (a.children.length || b.children.length || a.isolated) continue;
    if (distance(a, b) >= ISOLATION_THRESHOLD) {
      a.isolated = b.isolated = true;
      const msg = { gen: world.gen, text: '🧬 生殖隔離達成:成為不同物種' };
      a.log.push(msg); b.log.push({ ...msg });
      continue;
    }
    if (a.habitat !== b.habitat || a.clade !== b.clade) continue;
    for (const [grp, keys] of [['traits', TRAIT_KEYS.filter((k) => k !== 'aquatic')], ['diet', DIET_KEYS]]) {
      for (const k of keys) {
        const m = (a[grp][k] + b[grp][k]) / 2;
        a[grp][k] += (m - a[grp][k]) * 0.03; b[grp][k] += (m - b[grp][k]) * 0.03;
      }
    }
  }
}

export function advance(world, gens, strength) {
  const rng = makeRng(world);
  for (let i = 0; i < gens; i++) {
    world.gen++;
    const leaves = leavesOf(world);
    for (const sp of leaves) { stepSpecies(sp, strength, rng); updateClade(sp, world.gen); trackForm(sp, world.gen); }
    geneFlow(world);
  }
  return world;
}

/* ---------- 分支:A 留原地、B 遷往新棲地;雙方帶相反方向偏差 ---------- */
export function splitNode(world, id, newHabitat) {
  const p = world.nodes[id];
  if (!p || p.children.length || leavesOf(world).length >= MAX_SPECIES) return false;
  const rng = makeRng(world);
  const pool = [...BIAS_KEYS];
  const picks = [0, 1].map(() => pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  const mags = picks.map(() => 10 + rng() * 8);
  const mk = (sign) => {
    const nid = world.nextId++;
    const node = {
      id: nid, parent: id, children: [], bornGen: world.gen, endGen: null,
      habitat: p.habitat, env: { ...p.env }, clade: p.clade, traits: { ...p.traits }, diet: { ...p.diet },
      bias: { ...p.bias }, form: p.form, pend: null, pendN: 0, isolated: false, log: [],
    };
    picks.forEach((k, i) => { node.bias[k] = (node.bias[k] || 0) + sign * mags[i]; });
    world.nodes[nid] = node;
    return node;
  };
  const A = mk(1), B = mk(-1);
  p.children = [A.id, B.id]; p.endGen = world.gen;
  A.log.push({ gen: world.gen, text: '族群分裂(留在原棲地)' });
  B.log.push({ gen: world.gen, text: `族群分裂(遷往${HABITATS[newHabitat]?.label ?? '同棲地'})` });
  if (newHabitat && newHabitat !== p.habitat) { B.habitat = newHabitat; B.env = { ...HABITATS[newHabitat].env }; }
  return true;
}

/* ---------- 分類:性狀 → 型態/食性/飛行能力 ---------- */
export function flightInfo(sp) {
  const T = sp.traits, E = sp.env;
  const lift = T.wing * (1 + (E.oxygen - 50) / 150) * (1 - (E.gravity - 50) / 150);
  const load = T.size * (sp.clade === 'bird' ? 0.8 : 1) + 10;
  return { lift, load, canFly: T.aquatic <= 50 && T.wing >= 55 && lift >= load };
}

export function dietOf(sp) {
  const { herb, carn, scav } = sp.diet, T = sp.traits, max = Math.max(herb, carn, scav), water = T.aquatic > 25;
  let key;
  if (herb >= 45 && carn >= 45 && Math.abs(herb - carn) < 20) key = 'omnivore';
  else if (scav >= 40 && scav >= max - 4) key = 'scavenger';
  else if (carn >= herb) key = 'carnivore';
  else key = 'herbivore';
  const M = {
    omnivore: ['雜食', 'omnivorous'],
    scavenger: ['食腐', 'scavenging on carrion'],
    carnivore: water ? ['肉食(食魚)', 'piscivorous predator'] : T.size < 30 ? ['肉食(食蟲)', 'insect-hunting'] : ['肉食', 'carnivorous predator'],
    herbivore: water ? ['草食(藻類/浮游)', 'grazing on algae and plankton'] : T.neck > 55 ? ['草食(啃食樹葉)', 'browsing on tall foliage'] : ['草食', 'herbivorous grazer'],
  }[key];
  return { key, zh: M[0], en: M[1] };
}

export function analyze(sp) {
  const T = sp.traits, c = sp.clade, d = dietOf(sp), fl = flightInfo(sp);
  const aq = T.aquatic > 50, semi = !aq && T.aquatic > 25;
  const mode = aq ? 'aquatic' : fl.canFly ? 'flying' : T.wing >= 35 ? 'gliding' : 'land';
  const dk = d.key;
  let r;
  if (c === 'bird') {
    if (aq) r = ['潛水不飛鳥(企鵝型)', 'flightless diving bird with flipper-like wings, penguin-like'];
    else if (mode === 'flying') {
      if (semi && T.neck > 50) r = ['涉禽(鷺鶴型)', 'long-legged long-necked wading bird in flight'];
      else if (semi) r = ['海鳥(信天翁型)', 'soaring seabird with long narrow wings'];
      else if (dk === 'scavenger') r = ['食腐猛禽(禿鷲型)', 'large soaring vulture-like scavenging bird'];
      else if (dk === 'carnivore') r = T.size < 30 ? ['食蟲飛鳥(燕型)', 'small agile insect-hunting flying bird'] : ['捕食猛禽(鷹型)', 'powerful flying raptor with hooked beak and talons'];
      else if (dk === 'herbivore') r = ['食果/種子飛鳥(雀型)', 'small perching bird eating seeds and fruit'];
      else r = ['雜食飛鳥(烏鴉型)', 'intelligent crow-like omnivorous flying bird'];
    } else if (mode === 'gliding') r = ['短程飛行地棲鳥(雉雞型)', 'ground-dwelling pheasant-like bird capable of short bursts of flight'];
    else if (T.size >= 65 && T.limb >= 50) r = ['大型走禽(鴕鳥型)', 'huge flightless running bird like an ostrich with powerful legs'];
    else if (T.size >= 65) r = ['巨型不飛鳥(恐鳥型)', 'giant heavy flightless bird with tiny vestigial wings'];
    else if (semi && T.neck > 45) r = ['涉禽(鶴型,不善飛)', 'long-legged wading bird'];
    else r = ['地棲不飛鳥(渡渡鳥型)', 'plump flightless ground bird with vestigial wings, dodo-like'];
  } else if (c === 'mammal') {
    if (aq) r = T.size >= 65 ? ['大型鯨類', 'giant whale-like filter-feeding marine mammal'] : T.stream >= 55 ? ['海豚型海洋哺乳類', 'sleek dolphin-like marine mammal'] : ['海豹型海洋哺乳類', 'seal-like marine mammal with blubber and flippers'];
    else if (mode === 'flying') r = ['蝙蝠型飛行哺乳類', 'bat-like flying mammal with leathery wings'];
    else if (mode === 'gliding') r = ['滑翔哺乳類(鼯鼠型)', 'gliding mammal with a skin membrane between its limbs'];
    else if (T.neck >= 60) r = ['長頸草食獸', 'tall long-necked browsing mammal like a giraffe'];
    else if (T.size >= 72) r = dk === 'carnivore' ? ['巨型食肉獸(熊型)', 'huge powerful bear-like predatory mammal'] : ['巨型陸生哺乳類(象型)', 'massive elephant-like mammal'];
    else if (T.ear >= 55) r = ['大耳獸(狐/兔型)', 'large-eared mammal like a fennec fox'];
    else if (semi) r = ['半水生哺乳類(水獺型)', 'semi-aquatic otter-like mammal'];
    else if (dk === 'carnivore') r = ['食肉獸(貓科型)', 'sleek feline-like predatory mammal'];
    else if (dk === 'scavenger') r = ['食腐獸(鬣狗型)', 'hyena-like scavenging mammal'];
    else if (dk === 'herbivore') r = T.limb >= 55 ? ['奔跑草食獸(羚羊型)', 'swift long-legged antelope-like grazing mammal'] : ['草食獸(野豬型)', 'sturdy grazing mammal'];
    else r = ['雜食小型獸(鼠/熊型)', 'omnivorous small-to-medium mammal'];
  } else {
    if (aq) r = T.armor >= 55 ? ['海龜型', 'sea-turtle-like marine reptile with shell and flippers'] : T.stream >= 55 ? ['魚龍型海生爬行類', 'ichthyosaur-like streamlined marine reptile'] : ['滄龍型海生爬行類', 'mosasaur-like marine reptile with a long powerful tail'];
    else if (mode === 'flying') r = ['翼龍型飛行爬行類', 'pterosaur-like flying reptile with leathery wings'];
    else if (mode === 'gliding') r = ['滑翔蜥蜴(飛蜥型)', 'gliding lizard with skin membranes'];
    else if (T.limb < 22) r = ['蛇型無足爬行類', 'legless serpentine reptile'];
    else if (T.armor >= 62) r = ['甲殼爬行類(陸龜/甲龍型)', 'heavily armored tortoise-like or ankylosaur-like reptile'];
    else if (T.size >= 72) r = T.neck >= 55 ? ['蜥腳型巨龍', 'huge long-necked sauropod-like reptile'] : dk === 'carnivore' ? ['大型肉食龍(暴龍型)', 'large predatory theropod-like reptile'] : ['大型草食龍(角龍型)', 'massive horned herbivorous dinosaur-like reptile'];
    else if (T.neck >= 55 && dk === 'herbivore') r = ['長頸草食爬行類', 'long-necked browsing reptile'];
    else if (semi && T.size >= 50) r = ['鱷型半水生爬行類', 'crocodile-like semi-aquatic reptile'];
    else if (T.glow >= 40) r = ['洞穴發光蜥蜴', 'cave-dwelling bioluminescent lizard'];
    else if (T.limb >= 60 && T.size < 45) r = ['奔跑小型爬行類', 'fast long-legged small running reptile'];
    else r = ['蜥蜴型爬行類', 'lizard-like reptile'];
  }
  return { zh: r[0], en: r[1], mode, clade: c, diet: d, flight: fl };
}