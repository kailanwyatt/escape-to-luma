import { GAME_TUNING } from '../game/gameTuning';
import type { Projectile } from './Projectile';

export class ProjectileSystem {
  integrate(projectile: Projectile, dt: number): void {
    projectile.previousPosition.copy(projectile.position);
    projectile.velocity.y -= GAME_TUNING.gravity * dt;
    projectile.position.x += projectile.velocity.x * dt;
    projectile.position.y += projectile.velocity.y * dt;
    projectile.position.z += projectile.velocity.z * dt;
  }

  interpolateAtZ(
    projectile: Projectile,
    planeZ: number,
  ): { x: number; y: number; z: number } {
    const prevZ = projectile.previousPosition.z;
    const currZ = projectile.position.z;
    const span = currZ - prevZ;
    const t = span === 0 ? 1 : (planeZ - prevZ) / span;
    return {
      x:
        projectile.previousPosition.x +
        (projectile.position.x - projectile.previousPosition.x) * t,
      y:
        projectile.previousPosition.y +
        (projectile.position.y - projectile.previousPosition.y) * t,
      z: planeZ,
    };
  }

  crossedPlane(projectile: Projectile, planeZ: number): boolean {
    return projectile.previousPosition.z < planeZ && projectile.position.z >= planeZ;
  }
}
