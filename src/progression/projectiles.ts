export type ProjectileId =
  | 'classic'
  | 'steel'
  | 'neon'
  | 'fire'
  | 'ice'
  | 'plasma'
  | 'gold'
  | 'void';

export type ProjectileStyle = {
  id: ProjectileId;
  name: string;
  unlockLevel: number;
  color: number;
  emissive: number;
  emissiveIntensity: number;
  shininess: number;
  trailWidth: number;
  trailColor: number;
};

export const PROJECTILE_STYLES: ProjectileStyle[] = [
  {
    id: 'classic',
    name: 'Classic Ball',
    unlockLevel: 1,
    color: 0x7ef0ff,
    emissive: 0x1aa8b8,
    emissiveIntensity: 0.55,
    shininess: 80,
    trailWidth: 0.07,
    trailColor: 0x7ef0ff,
  },
  {
    id: 'steel',
    name: 'Steel Ball',
    unlockLevel: 3,
    color: 0xc5cdd4,
    emissive: 0x4a5860,
    emissiveIntensity: 0.22,
    shininess: 120,
    trailWidth: 0.05,
    trailColor: 0xd5dee4,
  },
  {
    id: 'neon',
    name: 'Neon Ball',
    unlockLevel: 5,
    color: 0xff4ad2,
    emissive: 0xff2fb2,
    emissiveIntensity: 0.85,
    shininess: 60,
    trailWidth: 0.08,
    trailColor: 0xff7ae0,
  },
  {
    id: 'fire',
    name: 'Fireball',
    unlockLevel: 7,
    color: 0xff7a2a,
    emissive: 0xff3b00,
    emissiveIntensity: 0.8,
    shininess: 40,
    trailWidth: 0.09,
    trailColor: 0xffb060,
  },
  {
    id: 'ice',
    name: 'Ice Ball',
    unlockLevel: 9,
    color: 0xe8f6ff,
    emissive: 0x7ec8ff,
    emissiveIntensity: 0.45,
    shininess: 100,
    trailWidth: 0.07,
    trailColor: 0xb8e4ff,
  },
  {
    id: 'plasma',
    name: 'Plasma Ball',
    unlockLevel: 12,
    color: 0xb07cff,
    emissive: 0x6a2bff,
    emissiveIntensity: 0.9,
    shininess: 70,
    trailWidth: 0.08,
    trailColor: 0xc9a0ff,
  },
  {
    id: 'gold',
    name: 'Gold Ball',
    unlockLevel: 15,
    color: 0xffd24a,
    emissive: 0xc48a12,
    emissiveIntensity: 0.4,
    shininess: 110,
    trailWidth: 0.07,
    trailColor: 0xffe08a,
  },
  {
    id: 'void',
    name: 'Void Ball',
    unlockLevel: 20,
    color: 0x6a4ad2,
    emissive: 0xb07cff,
    emissiveIntensity: 0.95,
    shininess: 30,
    trailWidth: 0.1,
    trailColor: 0xd4b8ff,
  },
];

export const DEFAULT_PROJECTILE_ID: ProjectileId = 'classic';

export function projectileStyle(id: string | undefined): ProjectileStyle {
  return PROJECTILE_STYLES.find((style) => style.id === id) ?? PROJECTILE_STYLES[0];
}

export function unlockedProjectileIds(level: number): ProjectileId[] {
  return PROJECTILE_STYLES.filter((style) => style.unlockLevel <= level).map((style) => style.id);
}

export function newlyUnlockedProjectiles(
  previousLevel: number,
  nextLevel: number,
): ProjectileStyle[] {
  return PROJECTILE_STYLES.filter(
    (style) => style.unlockLevel > previousLevel && style.unlockLevel <= nextLevel,
  );
}
