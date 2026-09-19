/**
 * Source of truth for production graphics still needed.
 * Keep this in sync with docs/GRAPHICS-NEEDS.md.
 */

export type GraphicsPriority = 'P0' | 'P1' | 'P2';
export type GraphicsKind =
  | 'brand'
  | 'ui'
  | 'hud'
  | 'projectile'
  | 'target'
  | 'obstacle'
  | 'environment'
  | 'fx'
  | 'store';

export type GraphicsNeed = {
  id: string;
  kind: GraphicsKind;
  priority: GraphicsPriority;
  name: string;
  current: string;
  need: string;
  format: string;
  notes?: string;
};

export const ART_DIRECTION = {
  title: 'Aperture',
  oneLiner: 'Precision arcade throw — industrial aperture fantasy, readable at a glance.',
  palette: {
    ink: '#0A0807',
    cream: '#F4EFE6',
    amber: '#FFD24A',
    copper: '#D06A32',
    cyan: '#7EF0FF',
    heart: '#FF5D6C',
  },
  environments: ['Workshop (warm industrial)', 'Rooftop (daylight metal)', 'Space (cool neon void)'],
  prototypeStatus:
    'All 3D is procedural Three.js primitives (boxes, spheres, toruses). No textures, no GLB models, no hand-authored meshes. UI is pure RN text/views. Store icons are Expo defaults.',
} as const;

export const GRAPHICS_NEEDS: GraphicsNeed[] = [
  // Brand / store
  {
    id: 'app-icon',
    kind: 'store',
    priority: 'P0',
    name: 'App icon',
    current: 'Expo default icon.png',
    need: '1024×1024 branded aperture / ball mark',
    format: 'PNG (opaque) + Android adaptive layers',
  },
  {
    id: 'splash',
    kind: 'store',
    priority: 'P0',
    name: 'Splash / launch',
    current: 'Expo splash-icon.png',
    need: 'Centered mark on #1a1612 (or brand ink)',
    format: 'PNG / Expo splash config',
  },
  {
    id: 'wordmark',
    kind: 'brand',
    priority: 'P0',
    name: 'APERTURE wordmark',
    current: 'System bold text on home',
    need: 'Display wordmark + optional monogram',
    format: 'SVG + PNG @1x/@2x/@3x',
  },

  // UI
  {
    id: 'home-backdrop',
    kind: 'ui',
    priority: 'P1',
    name: 'Home backdrop',
    current: 'Flat dark rgba overlay',
    need: 'Still of Workshop corridor or branded gradient with aperture motif',
    format: 'WebP/PNG 1242×2688 safe',
  },
  {
    id: 'menu-buttons',
    kind: 'ui',
    priority: 'P1',
    name: 'Menu button frames',
    current: 'Solid rounded rects',
    need: 'Play primary + secondary panel styles (9-slice or vector)',
    format: 'SVG / 9-slice PNG',
  },
  {
    id: 'settings-iap-badge',
    kind: 'ui',
    priority: 'P2',
    name: 'Remove Ads badge',
    current: 'Text only',
    need: 'Small lock/shield or clean mark',
    format: 'PNG 64–128px',
  },
  {
    id: 'projectile-cards',
    kind: 'ui',
    priority: 'P0',
    name: 'Projectile select cards',
    current: 'Text rows + unicode marks',
    need: '8 ball portraits / turnarounds for select list',
    format: 'PNG square 256–512 transparent',
  },
  {
    id: 'fonts',
    kind: 'ui',
    priority: 'P1',
    name: 'UI typefaces',
    current: 'System default',
    need: '1 display + 1 condensed UI (license for mobile)',
    format: 'OTF/TTF via expo-font',
  },

  // HUD
  {
    id: 'hearts',
    kind: 'hud',
    priority: 'P0',
    name: 'Lives / hearts',
    current: '♥ ♡ glyphs',
    need: 'Filled + empty heart sprites (or vector)',
    format: 'PNG @2x/@3x or SVG',
  },
  {
    id: 'result-banners',
    kind: 'hud',
    priority: 'P1',
    name: 'Result callouts',
    current: 'Plain text HIT/GREAT/BULLSEYE/PERFECT',
    need: 'Optional stamp/burst frames (keep readable)',
    format: 'PNG transparent',
  },
  {
    id: 'close-call',
    kind: 'hud',
    priority: 'P1',
    name: 'Close Call mark',
    current: 'Cyan text',
    need: 'Small flare / chevron accent',
    format: 'PNG transparent',
  },
  {
    id: 'xp-bar',
    kind: 'hud',
    priority: 'P2',
    name: 'XP / level chrome',
    current: 'Flat bar',
    need: 'Bar track + fill + level badge',
    format: '9-slice PNG',
  },
  {
    id: 'continue-panel',
    kind: 'hud',
    priority: 'P1',
    name: 'Keep Going? panel',
    current: 'Dim overlay + text',
    need: 'Continue offer frame (not spammy)',
    format: 'PNG / vector',
  },

  // Projectiles (gameplay mesh + trail)
  {
    id: 'ball-classic',
    kind: 'projectile',
    priority: 'P0',
    name: 'Classic Ball',
    current: 'Cyan Phong sphere',
    need: 'Hero ball mesh or stylized sphere + albedo/emissive',
    format: 'GLB ≤15k tris or textured sphere',
  },
  {
    id: 'ball-steel',
    kind: 'projectile',
    priority: 'P1',
    name: 'Steel Ball',
    current: 'Grey Phong sphere',
    need: 'Brushed metal look',
    format: 'GLB or material set',
  },
  {
    id: 'ball-neon',
    kind: 'projectile',
    priority: 'P1',
    name: 'Neon Ball',
    current: 'Magenta emissive sphere',
    need: 'Glow shell / neon shell',
    format: 'GLB + emissive map',
  },
  {
    id: 'ball-fire',
    kind: 'projectile',
    priority: 'P1',
    name: 'Fireball',
    current: 'Orange emissive sphere',
    need: 'Heat shell + optional flame trail cue',
    format: 'GLB + trail color guide',
  },
  {
    id: 'ball-ice',
    kind: 'projectile',
    priority: 'P1',
    name: 'Ice Ball',
    current: 'Pale blue sphere',
    need: 'Crystal / frosted read',
    format: 'GLB or material set',
  },
  {
    id: 'ball-plasma',
    kind: 'projectile',
    priority: 'P1',
    name: 'Plasma Ball',
    current: 'Purple emissive sphere',
    need: 'Energy orb',
    format: 'GLB + emissive',
  },
  {
    id: 'ball-gold',
    kind: 'projectile',
    priority: 'P1',
    name: 'Gold Ball',
    current: 'Gold Phong sphere',
    need: 'Premium metal',
    format: 'GLB or material set',
  },
  {
    id: 'ball-void',
    kind: 'projectile',
    priority: 'P1',
    name: 'Void Ball',
    current: 'Purple emissive sphere (readability risk in Space)',
    need: 'Dark core + bright rim so it reads on black',
    format: 'GLB + rim light guidance',
  },

  // Target
  {
    id: 'target-rings',
    kind: 'target',
    priority: 'P0',
    name: 'Aperture target',
    current: 'Flat concentric CircleGeometry discs',
    need: 'Dimensional aperture / bullseye with readable rings + bull center',
    format: 'GLB or layered meshes + albedo',
    notes: 'Collision radii must stay exact; art must match hit zones.',
  },

  // Obstacles
  {
    id: 'rotor-workshop',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Rotor — Workshop fan',
    current: 'Torus + box blades + hub',
    need: 'Industrial fan / aperture shutter blades',
    format: 'GLB (animated blades or single spinner)',
  },
  {
    id: 'rotor-rooftop',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Rotor — Rooftop turbine',
    current: 'Primitive turbine stand-in',
    need: 'HVAC / turbine skin',
    format: 'GLB',
  },
  {
    id: 'rotor-space',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Rotor — Space energy',
    current: 'Emissive primitive rotor',
    need: 'Sci-fi energy spinner',
    format: 'GLB',
  },
  {
    id: 'gate',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Sliding gate',
    current: 'Four box panels',
    need: 'Door / blast-door panels with opening read',
    format: 'GLB or modular panels',
  },
  {
    id: 'iris',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Iris aperture',
    current: 'Torus + 8 box petals',
    need: 'Camera-iris petals that clearly show opening radius',
    format: 'GLB (or procedural with better materials)',
    notes: 'Opening radius is gameplay-critical.',
  },
  {
    id: 'pendulum',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Pendulum blocker',
    current: 'Sphere/box on cylinder arm',
    need: 'Wrecking-ball / crate / energy bob by environment',
    format: 'GLB',
  },
  {
    id: 'moving-ring',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Moving ring barrier',
    current: 'RingGeometry + torus hoop',
    need: 'Framed hoop with solid outer barrier',
    format: 'GLB',
  },

  // Environments
  {
    id: 'env-workshop',
    kind: 'environment',
    priority: 'P0',
    name: 'Workshop set',
    current: 'Boxes: floor planks, walls, crates, pipes, lamp',
    need: 'Readable corridor set dressing (not dense clutter)',
    format: 'Modular GLB kit or baked mesh + lightmaps optional',
  },
  {
    id: 'env-rooftop',
    kind: 'environment',
    priority: 'P0',
    name: 'Rooftop set',
    current: 'Flat sky plane, building boxes, AC units, antenna',
    need: 'Sky/city backdrop + roof props',
    format: 'GLB + sky texture or HDRI-lite',
  },
  {
    id: 'env-space',
    kind: 'environment',
    priority: 'P0',
    name: 'Space set',
    current: 'Dark deck + Points stars + emissive strips',
    need: 'Station deck + starfield / nebula backdrop',
    format: 'GLB + star texture / skybox',
  },
  {
    id: 'portals',
    kind: 'environment',
    priority: 'P1',
    name: 'Environment transition portals',
    current: 'Door / tunnel / ring primitive groups',
    need: 'Door, tunnel, ring portal reads during camera travel',
    format: 'GLB ×3',
  },

  // FX
  {
    id: 'trail',
    kind: 'fx',
    priority: 'P1',
    name: 'Projectile trail',
    current: 'Fading sphere nodes',
    need: 'Soft ribbon / streak (still cheap on mobile)',
    format: 'Shader or textured quads',
  },
  {
    id: 'particles-hit',
    kind: 'fx',
    priority: 'P1',
    name: 'Hit / Perfect particles',
    current: 'Tiny colored spheres',
    need: 'Sparks, aperture shards, Perfect burst',
    format: 'Sprite sheets or GPU particles',
  },
  {
    id: 'particles-collision',
    kind: 'fx',
    priority: 'P1',
    name: 'Obstacle impact sparks',
    current: 'Sphere burst',
    need: 'Metal / energy impact by env',
    format: 'Sprites',
  },
  {
    id: 'aim-trajectory',
    kind: 'fx',
    priority: 'P2',
    name: 'Aim trajectory dots',
    current: 'Debug-ish dots',
    need: 'Subtle ghost dots (production-safe)',
    format: 'MeshBasic / sprites',
  },
];

export const GRAPHICS_SECTIONS: { kind: GraphicsKind; title: string; blurb: string }[] = [
  { kind: 'store', title: 'Store & launch', blurb: 'Icons and splash players see before the game.' },
  { kind: 'brand', title: 'Brand', blurb: 'Identity that must read on home and marketing.' },
  { kind: 'ui', title: 'Menus & UI', blurb: '2D chrome around the 3D playfield.' },
  { kind: 'hud', title: 'In-run HUD', blurb: 'Must stay readable over motion and particles.' },
  { kind: 'projectile', title: 'Projectiles', blurb: 'Cosmetic only — same collision radius for all.' },
  { kind: 'target', title: 'Target', blurb: 'Art must match scoring rings exactly.' },
  { kind: 'obstacle', title: 'Obstacles', blurb: 'Silhouette clarity > detail. Skin per environment.' },
  { kind: 'environment', title: 'Environments', blurb: 'Three sets + portals. Keep play corridor clear.' },
  { kind: 'fx', title: 'FX', blurb: 'Cheap, pooled, Reduce Motion aware.' },
];

export function needsByKind(kind: GraphicsKind): GraphicsNeed[] {
  return GRAPHICS_NEEDS.filter((item) => item.kind === kind);
}

export function countByPriority(): Record<GraphicsPriority, number> {
  return {
    P0: GRAPHICS_NEEDS.filter((item) => item.priority === 'P0').length,
    P1: GRAPHICS_NEEDS.filter((item) => item.priority === 'P1').length,
    P2: GRAPHICS_NEEDS.filter((item) => item.priority === 'P2').length,
  };
}
