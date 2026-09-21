import type { MovementConfig } from '../config/MovementConfig';
export type ReflectorVisualVariant = 'satelliteReflector'|'solarArrayReflector'|'lunarDishReflector'|'crystalReflector'|'energyCrystalReflector'|'ancientReflector'|'lumaReflector';
export type Vec3 = {x:number;y:number;z:number};
export interface ReflectorConfig {
  id:string;
  position:Vec3;
  /** Unit direction pointing OUT of the marked active face. */
  normal:Vec3;
  width:number;
  height:number;
  active?:boolean;
  visualVariant?:ReflectorVisualVariant;
  movement?:MovementConfig;
}
export interface RicochetConfig {
  reflectors:ReflectorConfig[];
  maxBounces:1|2;
  requiredBounces:1|2;
  fullGuide?:boolean;
}

export const WORLD_REFLECTOR_VARIANTS = {
 atmosphere:'satelliteReflector',orbit:'solarArrayReflector',moon:'lunarDishReflector',asteroid:'crystalReflector',nebula:'energyCrystalReflector',network:'ancientReflector',homeward:'lumaReflector',
} as const;
