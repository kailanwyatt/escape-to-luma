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
  | 'store'
  | 'campaign';

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
  title: 'SPARK',
  oneLiner:
    'Precision throw campaign — guide a living energy Spark from containment to home across Earth and deep space.',
  palette: {
    ink: '#0A0807',
    cream: '#F4EFE6',
    amber: '#FFD24A',
    copper: '#D06A32',
    cyan: '#7EF0FF',
    heart: '#FF5D6C',
    energy: '#7EFFB0',
    shard: '#FFE08A',
  },
  environments: [
    'Workshop / Containment (warm industrial — Worlds 1)',
    'Rooftop / City & Sky (daylight → storm — Worlds 2–3)',
    'Space progression (atmosphere → orbit → moon → belt → nebula → network → home — Worlds 4–10)',
  ],
  prototypeStatus:
    'Gameplay 3D is mostly procedural Three.js. Journey banners use chapter art for early worlds; Spark uses layered shader core + halos. Store icons ship; wordmark still text.',
} as const;

export const GRAPHICS_NEEDS: GraphicsNeed[] = [
  // Store & brand
  {
    id: 'app-icon',
    kind: 'store',
    priority: 'P0',
    name: 'App icon',
    current: 'assets/icon.png + Android adaptive set from Escape to Luma key art',
    need: 'Human approval on device masks; optional textless adaptive FG for tiny sizes',
    format: 'PNG (opaque) + Android adaptive FG/BG/mono',
  },
  {
    id: 'splash',
    kind: 'store',
    priority: 'P0',
    name: 'Splash / launch',
    current: 'assets/splash-icon.png (same key art on #050B15)',
    need: 'Optional simplified mark-only splash if full icon feels busy at launch',
    format: 'PNG / Expo splash config',
  },
  {
    id: 'wordmark',
    kind: 'brand',
    priority: 'P0',
    name: 'SPARK wordmark',
    current: 'System bold text on home',
    need: 'Display wordmark + optional monogram (alive energy, not toy-ball logo)',
    format: 'SVG + PNG @1x/@2x/@3x',
  },

  // Campaign / meta UI
  {
    id: 'journey-map',
    kind: 'campaign',
    priority: 'P0',
    name: 'Journey map chrome',
    current: 'World list with chapter banners (containment→storm + late worlds)',
    need: 'Orbit / moon / belt / drift banners; path chrome toward HOME',
    format: 'SVG/PNG frames + optional world thumbnails 256–512',
    notes: 'Destination label UNKNOWN → HOME must read clearly.',
  },
  {
    id: 'home-signal',
    kind: 'campaign',
    priority: 'P1',
    name: 'Home Signal meter',
    current: 'Text strength / distance strings',
    need: 'Signal strength glyph set (faint → home) + optional radar motif',
    format: 'SVG / PNG @2x/@3x',
  },
  {
    id: 'level-ready',
    kind: 'campaign',
    priority: 'P1',
    name: 'Level Ready / Jump Gate card',
    current: 'Plain text panel',
    need: 'Pre-throw briefing frame (world beat, wind/gravity cues, boost slots)',
    format: '9-slice / SVG panel',
  },
  {
    id: 'energy-icon',
    kind: 'campaign',
    priority: 'P0',
    name: 'Energy pip',
    current: 'Numeric energy only',
    need: 'Filled / empty energy cells (campaign lives substitute)',
    format: 'PNG @2x/@3x or SVG',
  },
  {
    id: 'shard-icon',
    kind: 'campaign',
    priority: 'P0',
    name: 'Shard currency icon',
    current: 'Text “shards”',
    need: 'Small crystalline shard mark for HUD / shop / rewards',
    format: 'PNG 64–128 transparent',
  },
  {
    id: 'shop-boost-icons',
    kind: 'campaign',
    priority: 'P1',
    name: 'Boost icons',
    current: 'Text labels',
    need: 'Guidance / Slow Field / Second Chance (+ Hyperjump reserved) icons',
    format: 'PNG 96–128 transparent',
  },
  {
    id: 'out-of-energy',
    kind: 'campaign',
    priority: 'P1',
    name: 'Out of Energy screen art',
    current: 'Text + buttons',
    need: 'Soft empty-cell illustration (not punitive spam)',
    format: 'PNG / WebP illustration',
  },
  {
    id: 'world-complete',
    kind: 'campaign',
    priority: 'P1',
    name: 'World complete / Spark unlock stamp',
    current: 'Text reward copy',
    need: 'Celebration frame + Spark unlock reveal card',
    format: 'PNG transparent',
  },
  {
    id: 'campaign-home-finale',
    kind: 'campaign',
    priority: 'P1',
    name: 'HOME finale stills',
    current: 'Empty hazard level + text beat',
    need: 'Final gate / home silhouette + “SPARK MADE IT HOME” title card',
    format: 'PNG/WebP key art + optional simple 3D set piece',
    notes: 'Level 150 has no dangerous obstacle — art sells the ending.',
  },
  {
    id: 'false-home',
    kind: 'campaign',
    priority: 'P2',
    name: 'False Home (Nebula finale) cue',
    current: 'Story beat text only',
    need: 'Misleading warm “home” glow that reads as wrong vs true HOME',
    format: 'Env tint + VFX guide',
  },

  // Menus & UI
  {
    id: 'home-backdrop',
    kind: 'ui',
    priority: 'P1',
    name: 'Home backdrop',
    current: 'Flat dark overlay',
    need: 'Containment chamber / Jump Gate still or branded energy gradient',
    format: 'WebP/PNG 1242×2688 safe',
  },
  {
    id: 'menu-buttons',
    kind: 'ui',
    priority: 'P1',
    name: 'Menu button frames',
    current: 'Solid rounded rects',
    need: 'Continue / Journey primary + secondary panels',
    format: 'SVG / 9-slice PNG',
  },
  {
    id: 'spark-cards',
    kind: 'ui',
    priority: 'P0',
    name: 'Spark select portraits',
    current: 'Text rows + color swatches',
    need: 'Portrait per Spark skin (see catalog — ~14 forms)',
    format: 'PNG square 256–512 transparent',
    notes:
      'Catalog: original, neon, solar, frost, storm, plasma, lunar, meteor, nebula, void, reactor, ancient, origin, prism (+ aurora world reward).',
  },
  {
    id: 'trail-cards',
    kind: 'ui',
    priority: 'P2',
    name: 'Trail select thumbs',
    current: 'Text only',
    need: '6 trail previews (standard, stardust, lightning, fire, frost, void)',
    format: 'PNG 256 transparent',
  },
  {
    id: 'fonts',
    kind: 'ui',
    priority: 'P1',
    name: 'UI typefaces',
    current: 'System default',
    need: '1 display + 1 condensed UI (mobile license)',
    format: 'OTF/TTF via expo-font',
  },
  {
    id: 'settings-iap-badge',
    kind: 'ui',
    priority: 'P2',
    name: 'Remove Ads / IAP badge',
    current: 'Text only',
    need: 'Small lock/shield mark',
    format: 'PNG 64–128px',
  },

  // HUD
  {
    id: 'hearts',
    kind: 'hud',
    priority: 'P0',
    name: 'Endless hearts',
    current: '♥ ♡ glyphs',
    need: 'Filled + empty heart sprites (Endless Voyage only)',
    format: 'PNG @2x/@3x or SVG',
  },
  {
    id: 'result-banners',
    kind: 'hud',
    priority: 'P1',
    name: 'Result callouts',
    current: 'Plain text CLEAR/GREAT/BULLSEYE/PERFECT',
    need: 'Optional stamp/burst frames (Jump Gate ranks)',
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
    id: 'continue-panel',
    kind: 'hud',
    priority: 'P1',
    name: 'Keep Going? panel',
    current: 'Dim overlay + text',
    need: 'Endless continue-offer frame (not spammy)',
    format: 'PNG / vector',
  },
  {
    id: 'xp-bar',
    kind: 'hud',
    priority: 'P2',
    name: 'XP / mastery chrome',
    current: 'Flat / text stats',
    need: 'Optional mastery track + badge',
    format: '9-slice PNG',
  },

  // Spark (projectile) — alive energy entity
  {
    id: 'spark-original',
    kind: 'projectile',
    priority: 'P0',
    name: 'Original Spark',
    current: 'Layered shader core + dual additive halos + ground pool',
    need: 'Optional portrait/GLB hero polish; keep spherical collider',
    format: 'Shader materials (shipped) or GLB ≤15k tris',
    notes: 'No cartoon face/limbs. Personality via pulse, trail, emissive.',
  },
  {
    id: 'spark-skins-core',
    kind: 'projectile',
    priority: 'P1',
    name: 'Shop Spark skins',
    current: 'Tinted Phong spheres',
    need: 'Neon, Solar, Frost, Storm, Plasma, Void material/mesh variants',
    format: 'GLB or material sets',
  },
  {
    id: 'spark-skins-world',
    kind: 'projectile',
    priority: 'P1',
    name: 'World-completion Sparks',
    current: 'Tinted spheres',
    need: 'Reactor, Neon(city), Storm, Aurora, Solar, Lunar, Meteor, Nebula, Ancient, Origin',
    format: 'GLB or material sets + portrait art',
  },
  {
    id: 'spark-prism',
    kind: 'projectile',
    priority: 'P2',
    name: 'Prism (premium Spark)',
    current: 'Tinted sphere',
    need: 'Premium iridescent form distinct from free skins',
    format: 'GLB + emissive',
  },

  // Target / Jump Gate
  {
    id: 'jump-gate',
    kind: 'target',
    priority: 'P0',
    name: 'Jump Gate target',
    current: 'Flat concentric scoring discs',
    need: 'Dimensional Jump Gate / aperture bullseye; rings match scoring radii',
    format: 'GLB or layered meshes + albedo',
    notes: 'CLEAR/GREAT/BULLSEYE/PERFECT zones must match collision art.',
  },

  // Obstacles — existing families
  {
    id: 'rotor-workshop',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Rotor — Containment / Workshop',
    current: 'Torus + box blades + hub',
    need: 'Industrial fan / shutter / security rotor',
    format: 'GLB',
  },
  {
    id: 'rotor-rooftop',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Rotor — Rooftop turbine',
    current: 'Primitive stand-in',
    need: 'HVAC / turbine skin',
    format: 'GLB',
  },
  {
    id: 'rotor-space',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Rotor — Space energy',
    current: 'Emissive primitive',
    need: 'Sci-fi spinner',
    format: 'GLB',
  },
  {
    id: 'gate',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Sliding gate',
    current: 'Four box panels',
    need: 'Blast-door / security panels; opening must stay readable',
    format: 'GLB or modular panels',
  },
  {
    id: 'iris',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Iris aperture',
    current: 'Torus + box petals',
    need: 'Camera-iris petals; opening radius gameplay-critical',
    format: 'GLB',
  },
  {
    id: 'pendulum',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Pendulum blocker',
    current: 'Sphere on cylinder arm',
    need: 'Debris bob / wrecking mass / energy bob by world',
    format: 'GLB',
  },
  {
    id: 'moving-ring',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Moving ring',
    current: 'RingGeometry + torus',
    need: 'Framed hoop + solid outer barrier (Sky primary)',
    format: 'GLB',
  },

  // Obstacles — new campaign families
  {
    id: 'laser-grid',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Security laser grid',
    current: 'Red box beams (primitive)',
    need: 'Readable red laser bars; clear center gap; dim when pulsed off',
    format: 'GLB strips or emissive quads + VFX glow',
    notes: 'World 1 security: vertical, horizontal, pulse, cross. Opening size is gameplay-critical.',
  },
  {
    id: 'orbiter',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Orbiter',
    current: 'Primitive orbiting sphere',
    need: 'Moon-world satellite / orbital mass; path readable',
    format: 'GLB',
    notes: 'World 6 primary. Collision = blocker sphere.',
  },
  {
    id: 'drifting-blocker',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Drifting blocker',
    current: 'Primitive drifting sphere',
    need: 'Asteroid / debris chunk; lane gaps must read as routes',
    format: 'GLB (2–3 LODs optional)',
    notes: 'World 7 primary. Multiple routes — silhouette clarity.',
  },
  {
    id: 'phase-field',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Phase field',
    current: 'Primitive field disc / torus',
    need: 'Energy field with clear open/closed phase windows',
    format: 'GLB + VFX materials',
    notes: 'World 8 primary. Open ratio is timing-critical.',
  },
  {
    id: 'shifting-aperture',
    kind: 'obstacle',
    priority: 'P0',
    name: 'Shifting aperture',
    current: 'Primitive iris + lateral shift',
    need: 'Ancient Network synchronized aperture (pulse + shift)',
    format: 'GLB',
    notes: 'World 9 primary. Opening + center shift must match collision.',
  },

  // Environments — technical sets + world dressing
  {
    id: 'env-workshop',
    kind: 'environment',
    priority: 'P0',
    name: 'Containment / Workshop set',
    current: 'Boxes: floor, walls, crates, pipes, lamp',
    need: 'Underground facility corridor (World 1); keep aim lane clear',
    format: 'Modular GLB kit',
  },
  {
    id: 'env-rooftop',
    kind: 'environment',
    priority: 'P0',
    name: 'City / Rooftop set',
    current: 'Sky plane + building boxes + AC units',
    need: 'Rooftops, antennas, city lights (World 2) + storm sky variant (World 3)',
    format: 'GLB + sky texture',
  },
  {
    id: 'env-space',
    kind: 'environment',
    priority: 'P0',
    name: 'Space base set',
    current: 'Dark deck + star points',
    need: 'Shared space deck + starfield used by Worlds 4–10',
    format: 'GLB + star/sky textures',
  },
  {
    id: 'env-world-dressing',
    kind: 'environment',
    priority: 'P1',
    name: 'World atmosphere kits',
    current: 'Same space set + fog/color only',
    need: 'Distinct dressing per world: atmosphere haze, orbital debris, moon regolith, asteroid field, nebula clouds, ancient network geometry, homeward approach',
    format: 'Backdrop plates + sparse props (corridor-safe)',
  },
  {
    id: 'portals',
    kind: 'environment',
    priority: 'P1',
    name: 'Transition portals',
    current: 'Door / tunnel / ring primitives',
    need: 'Jump-gate travel reads (door / tunnel / ring)',
    format: 'GLB ×3',
  },

  // FX
  {
    id: 'trail',
    kind: 'fx',
    priority: 'P1',
    name: 'Spark trail',
    current: 'Fading sphere nodes',
    need: 'Soft energy ribbon / streak (trail catalog variants)',
    format: 'Shader or textured quads',
  },
  {
    id: 'wind-vfx',
    kind: 'fx',
    priority: 'P0',
    name: 'Wind / crosswind cues',
    current: 'Invisible (physics only) + occasional copy',
    need: 'Always-visible wind: particles, flags, or streak field',
    format: 'GPU particles / sprites',
    notes: 'Architecture requirement: wind must never be silent.',
  },
  {
    id: 'gravity-well-vfx',
    kind: 'fx',
    priority: 'P0',
    name: 'Gravity well visualization',
    current: 'Invisible attractor volumes',
    need: 'Readable well rings / warp haze (strength + radius)',
    format: 'Transparent mesh + shader',
    notes: 'World 6+. Trajectory preview must match.',
  },
  {
    id: 'particles-hit',
    kind: 'fx',
    priority: 'P1',
    name: 'Gate hit / Perfect particles',
    current: 'Tiny colored spheres',
    need: 'Energy shards, Perfect burst, CLEAR soft enter',
    format: 'Sprite sheets or GPU particles',
  },
  {
    id: 'particles-collision',
    kind: 'fx',
    priority: 'P1',
    name: 'Obstacle impact sparks',
    current: 'Sphere burst',
    need: 'Metal vs energy vs debris by world',
    format: 'Sprites',
  },
  {
    id: 'aim-trajectory',
    kind: 'fx',
    priority: 'P2',
    name: 'Aim trajectory ghosts',
    current: 'Debug-ish dots',
    need: 'Subtle production-safe dots (Guidance boost = full ribbon)',
    format: 'MeshBasic / sprites',
  },
  {
    id: 'slow-field-vfx',
    kind: 'fx',
    priority: 'P2',
    name: 'Slow Field overlay',
    current: 'dt scale only',
    need: 'Brief world-desaturate / ripple when boost active',
    format: 'Fullscreen tint / shader',
  },
];

export const GRAPHICS_SECTIONS: { kind: GraphicsKind; title: string; blurb: string }[] = [
  { kind: 'store', title: 'Store & launch', blurb: 'Icons and splash players see before the game.' },
  { kind: 'brand', title: 'Brand', blurb: 'SPARK identity on home and marketing.' },
  { kind: 'campaign', title: 'Campaign & meta', blurb: 'Journey, energy, shards, story beats — new since vertical slice.' },
  { kind: 'ui', title: 'Menus & UI', blurb: '2D chrome around the 3D playfield.' },
  { kind: 'hud', title: 'In-run HUD', blurb: 'Readable over motion; Endless hearts vs campaign energy.' },
  { kind: 'projectile', title: 'Sparks', blurb: 'Living energy cosmetics — same collision radius for all.' },
  { kind: 'target', title: 'Jump Gate', blurb: 'Art must match scoring rings exactly.' },
  { kind: 'obstacle', title: 'Obstacles', blurb: 'Nine families. Silhouette clarity > detail.' },
  { kind: 'environment', title: 'Environments', blurb: 'Three technical sets + world dressing. Keep corridor clear.' },
  { kind: 'fx', title: 'FX', blurb: 'Wind and gravity wells must be visible. Reduce Motion aware.' },
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
