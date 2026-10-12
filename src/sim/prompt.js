import { analyze } from './engine';

const SCENE = {
  forest: 'dense misty forest at dawn, shafts of light through the canopy',
  desert: 'harsh midday sun over shimmering sand dunes, heat haze',
  ocean: 'open ocean, blue water',
  polar: 'snow and ice field under soft blue twilight light',
  plain: 'open grassland at golden hour, long grass',
  shore: 'rocky coastline with crashing waves and sea spray',
};

export function hueName(h, pigment) {
  const hues = [[15, 'reddish-brown'], [40, 'earthy brown'], [65, 'sandy ochre'], [95, 'olive'], [160, 'mossy green'],
    [200, 'teal'], [250, 'slate blue'], [290, 'violet-gray'], [340, 'plum'], [361, 'rust red']];
  const name = hues.find(([m]) => h < m)[1];
  if (pigment < 12) return 'almost white';
  return `${pigment > 65 ? 'dark, deeply pigmented ' : pigment < 28 ? 'pale, sun-bleached ' : ''}${name}`;
}

export function buildPrompt(sp) {
  const a = analyze(sp), T = sp.traits, E = sp.env;
  const p = [];
  p.push('A highly detailed, hyper-realistic National Geographic wildlife photograph of an undiscovered animal species,');
  p.push(`a ${a.en}, ${a.diet.en}.`);
  p.push(`Coloration: ${hueName(T.hue, T.pigment)}.`);

  if (sp.clade === 'bird') p.push('Body covered in feathers.');
  else if (sp.clade === 'mammal') p.push(T.fur > 75 ? 'Thick dense fur.' : 'Short fur coat.');
  else p.push(T.feather > 35 ? 'Scaly skin with primitive proto-feathers.' : 'Textured scaly reptilian skin.');

  if (a.mode === 'aquatic') {
    p.push('Marine creature, streamlined body, flippers, shown underwater.');
    if (E.waterWide > 70) p.push('Vast open ocean, massive highly hydrodynamic body built for long-distance cruising.');
    if (E.light < 40 || E.waterDepth > 75) p.push('Deep dark water, faint light from above.');
  } else if (a.mode === 'flying') p.push('Flying creature soaring high in the sky, large wings fully spread.');
  else if (a.mode === 'gliding') p.push('Gliding through the air between heights with wings or membranes spread.');
  else {
    p.push('Terrestrial animal standing in its natural habitat.');
    if (E.gravity > 65) p.push('Thick, short, sturdy limbs.');
    else if (E.gravity < 35) p.push('Tall, delicate, elongated skeletal structure.');
  }

  if (T.size > 75) p.push('Enormous size.'); else if (T.size < 22) p.push('Tiny size.');
  if (T.neck > 60) p.push('Notably long neck.');
  if (T.eye > 60) p.push('Huge, prominent eyes adapted for low light.');
  if (T.ear > 60) p.push('Enormous ears for heat dissipation.');
  if (T.camo > 60) p.push('Natural camouflage patterns.');
  if (T.jaw > 70) p.push('Strong, thick beak or jaw for crushing hard food.');
  if (T.armor > 55) p.push('Armored plates or a protective shell.');
  if (T.glow > 40) p.push('Bioluminescent glowing spots along its body.');

  if (a.mode !== 'aquatic') p.push(`Setting: ${SCENE[sp.habitat]}.`);
  p.push('Cinematic lighting, 8k resolution, photorealistic, highly detailed texture, shot on 35mm lens, depth of field.');
  return p.join(' ');
}