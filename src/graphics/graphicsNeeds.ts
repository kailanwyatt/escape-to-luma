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
    'Journey banners cover all chapters. Spark uses layered shader core + orbitStyle material variants + halos. Currency icons ship via shop atlas. SPARK wordmark image on home/menus. Orbitron + Barlow Condensed UI fonts. Catalog spark portraits + Endless heart sprites. Level Ready briefing frame + world-complete unlock stamp. Home Signal meter glyphs. Result stamp / Close Call chevron / Endless continue frame. Jump Gate dimensional throat. Phase field / shifting aperture teach windows. Pendulum wrecking boom + cinematic moving ring. Transition portals (door/tunnel/ring). Soft energy trail ribbon + shard hit particles. Workshop corridor panels. Rotor/iris/laser/orbiter/debris silhouette pass shipped.',
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
    priority: 'P1',
    name: 'SPARK wordmark',
    current: 'BrandWordmark RGBA PNG on home / journey / sparks / stats (+ text fallback)',
    need: 'Optional monogram for tiny chrome',
    format: 'SVG + PNG @1x/@2x/@3x',
  },

  // Campaign / meta UI
  {
    id: 'journey-map',
    kind: 'campaign',
    priority: 'P1',
    name: 'Journey map chrome',
    current: 'Full chapter banners (city→space→home) on world cards',
    need: 'Path chrome toward HOME + optional node polish',
    format: 'SVG/PNG frames + optional world thumbnails 256–512',
    notes: 'Destination label UNKNOWN → HOME must read clearly.',
  },
  {
    id: 'home-signal',
    kind: 'campaign',
    priority: 'P1',
    name: 'Home Signal meter',
    current: 'Radar + bar glyph set on Journey cards, chapter hero, Home, Level Ready, unlock stamp',
    need: 'Optional denser radar motif / animated pulse',
    format: 'SVG / PNG @2x/@3x',
  },
  {
    id: 'level-ready',
    kind: 'campaign',
    priority: 'P1',
    name: 'Level Ready / Jump Gate card',
    current: 'BriefingFrame with wind/gravity cues + Home Signal + boost slots',
    need: 'Optional illustrated Jump Gate still behind frame',
    format: '9-slice / SVG panel',
  },
  {
    id: 'energy-icon',
    kind: 'campaign',
    priority: 'P1',
    name: 'Energy pip',
    current: 'Shop atlas CurrencyIcon (filled cell) on HUD / home / out-of-energy',
    need: 'Optional empty-cell variant + pip strip for max energy',
    format: 'PNG @2x/@3x or SVG',
  },
  {
    id: 'shard-icon',
    kind: 'campaign',
    priority: 'P1',
    name: 'Shard currency icon',
    current: 'Shop atlas CurrencyIcon on HUD / shop / menus',
    need: 'Optional higher-res mark for reward stamps',
    format: 'PNG 64–128 transparent',
  },
  {
    id: 'out-of-energy',
    kind: 'campaign',
    priority: 'P2',
    name: 'Out of Energy screen art',
    current: 'Soft energy hero + CurrencyIcon layout',
    need: 'Optional dedicated illustration still',
    format: 'PNG / WebP illustration',
  },
  {
    id: 'shop-boost-icons',
    kind: 'campaign',
    priority: 'P2',
    name: 'Boost icons',
    current: 'Workshop atlas tiles on shop + Level Ready',
    need: 'Optional compact HUD glyphs for equipped boosts',
    format: 'PNG 96–128 transparent',
  },
  {
    id: 'world-complete',
    kind: 'campaign',
    priority: 'P1',
    name: 'World complete / Spark unlock stamp',
    current: 'BriefingFrame + dashed UnlockStamp on CompletionScreen',
    need: 'Optional hand-painted celebration still',
    format: 'PNG transparent',
  },
  {
    id: 'campaign-home-finale',
    kind: 'campaign',
    priority: 'P1',
    name: 'HOME finale stills',
    current: 'FinaleScreen pages (finale.png + finale-voyage.png) + luma celebration banner',
    need: 'Optional “SPARK MADE IT HOME” title card overlay polish',
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
    current: 'city-gateway.jpg full-bleed + gradient veil',
    need: 'Optional containment / Jump Gate still variant',
    format: 'WebP/PNG 1242×2688 safe',
  },
  {
    id: 'menu-buttons',
    kind: 'ui',
    priority: 'P1',
    name: 'Menu button frames',
    current: 'Inner frame lip on Home nav tiles + primary CTA chrome',
    need: 'Optional 9-slice Continue / Journey panels',
    format: 'SVG / 9-slice PNG',
  },
  {
    id: 'spark-cards',
    kind: 'ui',
    priority: 'P1',
    name: 'Spark select portraits',
    current: 'Per-skin PNG portraits on Sparks screen / unlock cards (procedural fallback)',
    need: 'Optional hand-painted hero variants; keep spherical collider for gameplay Spark',
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
    current: 'Orbitron (display) + Barlow Condensed (UI) via expo-font / Google Fonts OFL',
    need: 'Optional config-plugin embed for release builds',
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
    priority: 'P1',
    name: 'Endless hearts',
    current: 'Filled + empty heart sprites on Endless Voyage HUD',
    need: 'Optional denser atlas crop shared with other HUD pips',
    format: 'PNG @2x/@3x or SVG',
  },
  {
    id: 'result-banners',
    kind: 'hud',
    priority: 'P1',
    name: 'Result callouts',
    current: 'Stamp/burst frames on CLEAR/GREAT/BULLSEYE/PERFECT',
    need: 'Optional illustrated rank stamps',
    format: 'PNG transparent',
  },
  {
    id: 'close-call',
    kind: 'hud',
    priority: 'P1',
    name: 'Close Call mark',
    current: 'Pill + chevron flare accent on HUD',
    need: 'Optional denser flare sprite',
    format: 'PNG transparent',
  },
  {
    id: 'continue-panel',
    kind: 'hud',
    priority: 'P1',
    name: 'Keep Going? panel',
    current: 'BriefingFrame continue-offer (not spammy)',
    need: 'Optional illustrated Endless still',
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
    current: 'Shader core orbitStyle variants (calm/reactor/neon/storm) + tint/halo/trail',
    need: 'Optional GLB hero meshes; keep spherical collider',
    format: 'GLB or material sets',
  },
  {
    id: 'spark-skins-world',
    kind: 'projectile',
    priority: 'P1',
    name: 'World-completion Sparks',
    current: 'Shader variants + portraits for Reactor, Neon, Aurora, Lunar, Meteor, Nebula, Origin…',
    need: 'Optional denser mesh kits',
    format: 'GLB or material sets + portrait art',
  },
  {
    id: 'spark-prism',
    kind: 'projectile',
    priority: 'P2',
    name: 'Prism (premium Spark)',
    current: 'Neon orbitStyle + iridescent tint',
    need: 'Premium iridescent form distinct from free skins',
    format: 'GLB + emissive',
  },

  // Target / Jump Gate
  {
    id: 'jump-gate',
    kind: 'target',
    priority: 'P1',
    name: 'Jump Gate target',
    current: 'Dimensional throat + housing + scoring-aligned zone rings (unit aperture)',
    need: 'Optional world-tint energy palettes; keep rings locked to GAME_TUNING zones',
    format: 'Procedural meshes + shader interior',
    notes: 'Unit visual aperture equals scoring radius. Zone rings are cues, not colliders.',
  },

  // Obstacles — existing families
  {
    id: 'rotor-workshop',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Rotor — Containment / Workshop',
    current: 'Security shutter arms with tip paddle, bevels, warning strips (collision AABB intact)',
    need: 'Optional GLB hero kit; keep arm bounds',
    format: 'Procedural / GLB',
  },
  {
    id: 'rotor-rooftop',
    kind: 'obstacle',
    priority: 'P2',
    name: 'Rotor — Rooftop turbine',
    current: 'cityVentilation / skyTurbine variants with blade bevels',
    need: 'Optional denser HVAC skin',
    format: 'Procedural / GLB',
  },
  {
    id: 'rotor-space',
    kind: 'obstacle',
    priority: 'P2',
    name: 'Rotor — Space energy',
    current: 'orbit / antenna / wreckage / energy variants with tip silhouette',
    need: 'Optional emissive hero pass',
    format: 'Procedural / GLB',
  },
  {
    id: 'gate',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Sliding gate',
    current: 'Blast-door security panels (workshop/rooftop) + orbital pressure door with face ribs; cyan/amber opening lip',
    need: 'Optional world-tint kits; keep opening rectangle authoritative',
    format: 'Procedural / modular panels',
  },
  {
    id: 'iris',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Iris aperture',
    current: 'Extruded iris petals + orbital sector shutters with depth collar',
    need: 'Optional world-tint petal materials',
    format: 'Procedural / GLB',
  },
  {
    id: 'pendulum',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Pendulum blocker',
    current: 'Wrecking boom: twin cables, hazard sleeve, bob collar + ReadableBlocker mass (AABB intact)',
    need: 'Optional GLB hero kit by world',
    format: 'Procedural / GLB',
  },
  {
    id: 'moving-ring',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Moving ring',
    current: 'Cinematic framed hoop + security field barrier (Sky primary); collision unchanged',
    need: 'Optional denser thruster pods',
    format: 'Procedural / GLB',
  },

  // Obstacles — new campaign families
  {
    id: 'laser-grid',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Security laser grid',
    current: 'Hot-core beams + emitter housings; dim safe-ghost when pulsed off; gap brackets on crossing grids',
    need: 'Optional volumetric bloom polish',
    format: 'Emissive quads + VFX glow',
    notes: 'World 1 security: vertical, horizontal, pulse, cross. Opening size is gameplay-critical.',
  },
  {
    id: 'orbiter',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Orbiter',
    current: 'Satellite body + additive orbit path ring (circular hit disk unchanged)',
    need: 'Optional world-tint path colors',
    format: 'Procedural',
    notes: 'World 6 primary. Collision = blocker sphere.',
  },
  {
    id: 'drifting-blocker',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Drifting blocker',
    current: 'Faceted mineral debris with interior chips (unit XY silhouette)',
    need: 'Optional 2–3 seeded LODs',
    format: 'Procedural',
    notes: 'World 7 primary. Multiple routes — silhouette clarity.',
  },
  {
    id: 'phase-field',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Phase field',
    current: 'Warm solid membrane when closed; cyan passable ghost + rim when open',
    need: 'Optional volumetric bloom; keep openRatio timing authoritative',
    format: 'Shader disc + VFX rim',
    notes: 'World 8 primary. Open ratio is timing-critical.',
  },
  {
    id: 'shifting-aperture',
    kind: 'obstacle',
    priority: 'P1',
    name: 'Shifting aperture',
    current: 'Ancient orbital iris + amber opening wash + lateral shift ticks',
    need: 'Optional denser carved kit; opening + center shift must match collision',
    format: 'Procedural / GLB',
    notes: 'World 9 primary. Opening + center shift must match collision.',
  },

  // Environments — technical sets + world dressing
  {
    id: 'env-workshop',
    kind: 'environment',
    priority: 'P1',
    name: 'Containment / Workshop set',
    current: 'Facility corridor with rails, bulkhead bay, wall panels, cable trays, crates',
    need: 'Optional modular GLB kit; keep aim lane clear',
    format: 'Modular GLB kit',
  },
  {
    id: 'env-rooftop',
    kind: 'environment',
    priority: 'P1',
    name: 'City / Rooftop set',
    current: 'Live rooftop kit + city sunset/construction/neon/rain mattes by level band',
    need: 'Optional denser mid-ground props; keep aim lane clear',
    format: 'GLB + sky texture',
  },
  {
    id: 'env-space',
    kind: 'environment',
    priority: 'P1',
    name: 'Space base set',
    current: 'Station modules + Earth + orbit/drift/moon/belt mattes from space plates',
    need: 'Optional modular deck kit polish; star density pass',
    format: 'GLB + star/sky textures',
  },
  {
    id: 'env-world-dressing',
    kind: 'environment',
    priority: 'P1',
    name: 'World atmosphere kits',
    current: 'Chapter motifs + sky sunlit/gold/storm + space/late mattes per chapter',
    need: 'HOME finale silhouette + False Home warm-wrong cue',
    format: 'Backdrop plates + sparse props (corridor-safe)',
  },
  {
    id: 'portals',
    kind: 'environment',
    priority: 'P1',
    name: 'Transition portals',
    current: 'Jump-gate travel reads — blast door, tunnel throat rings, orbital hoop',
    need: 'Optional animated energy fill',
    format: 'Procedural / GLB ×3',
  },

  // FX
  {
    id: 'trail',
    kind: 'fx',
    priority: 'P1',
    name: 'Spark trail',
    current: 'Additive energy ribbon quads oriented along flight',
    need: 'Optional trail-catalog shape variants (stardust/lightning…)',
    format: 'Shader or textured quads',
  },
  {
    id: 'wind-vfx',
    kind: 'fx',
    priority: 'P1',
    name: 'Wind / crosswind cues',
    current: 'Streak sheet + side chevrons; stays visible under reduce-motion',
    need: 'Optional denser GPU particle pass / world flags',
    format: 'GPU particles / sprites',
    notes: 'Wind must never be silent — direction cues remain when motion is reduced.',
  },
  {
    id: 'gravity-well-vfx',
    kind: 'fx',
    priority: 'P1',
    name: 'Gravity well visualization',
    current: 'Radius-matched haze + boundary rings + flow packets (attract cyan / repulse amber)',
    need: 'Optional warp shader polish; keep radius = physics well.radius',
    format: 'Transparent mesh + shader',
    notes: 'World 6+. Trajectory preview must match.',
  },
  {
    id: 'particles-hit',
    kind: 'fx',
    priority: 'P1',
    name: 'Gate hit / Perfect particles',
    current: 'Energy shards + Perfect burst + HIT soft enter',
    need: 'Optional sprite-sheet denser Perfect',
    format: 'Sprite sheets or GPU particles',
  },
  {
    id: 'particles-collision',
    kind: 'fx',
    priority: 'P1',
    name: 'Obstacle impact sparks',
    current: 'Shard burst (shared pool with gate hits)',
    need: 'Optional metal vs energy vs debris palettes by world',
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
