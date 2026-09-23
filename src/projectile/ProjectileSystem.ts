import type { Projectile } from './Projectile';
import { integrateMotion, type GravityWell, type PhysicsForces } from './physics';
import type { LagrangeNullConfig, SpeedFieldConfig } from '../config/ObstacleConfig';

export class ProjectileSystem {
  windX = 0;
  gravityScale = 1;
  wells: GravityWell[] = [];
  speedFields: SpeedFieldConfig[] = [];
  speedFieldTime = 0;
  lagrangeNulls: LagrangeNullConfig[] = [];

  forces(): PhysicsForces {
    return {
      windX: this.windX,
      gravityScale: this.gravityScale,
      wells: this.wells,
      speedFields: this.speedFields,
      speedFieldTime: this.speedFieldTime,
      lagrangeNulls: this.lagrangeNulls,
    };
  }

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
    // Runtime Entry/Exit warp stays collision-gated in Game (not portalWarps here).
    integrateMotion(state, dt, this.forces());
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
