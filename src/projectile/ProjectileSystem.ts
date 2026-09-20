import type { Projectile } from './Projectile';
import { integrateMotion, type GravityWell } from './physics';

export class ProjectileSystem {
  windX = 0;
  gravityScale = 1;
  wells: GravityWell[] = [];

  integrate(projectile: Projectile, dt: number): void {
    projectile.previousPosition.copy(projectile.position);
    const state = {
      x: projectile.position.x,
      y: projectile.position.y,
      z: projectile.position.z,
      vx: projectile.velocity.x,
      vy: projectile.velocity.y,
      vz: projectile.velocity.z,
    };
    integrateMotion(state, dt, {
      windX: this.windX,
      gravityScale: this.gravityScale,
      wells: this.wells,
    });
    projectile.position.set(state.x, state.y, state.z);
    projectile.velocity.set(state.vx, state.vy, state.vz);
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
