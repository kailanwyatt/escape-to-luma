import { GAME_TUNING } from '../game/gameTuning';
import { clamp, lerp } from '../utils/math';

export class AimSystem {
  screenWidth = 390;
  screenHeight = 844;
  active = false;
  startX = 0;
  startY = 0;
  currentX = 0;
  currentY = 0;
  normalizedX = 0;
  normalizedY = 0;
  aimX = 0;
  aimY = 0;
  power = 0;
  dragDistance = 0;
  maxDragDistance = 0;
  hasEnteredAim = false;
  isCancelReady = false;

  setScreenSize(width: number, height: number): void {
    this.screenWidth = Math.max(1, width);
    this.screenHeight = Math.max(1, height);
  }

  begin(x: number, y: number): void {
    this.active = true;
    this.startX = x;
    this.startY = y;
    this.currentX = x;
    this.currentY = y;
    this.hasEnteredAim = false;
    this.isCancelReady = false;
    this.maxDragDistance = 0;
    this.recompute();
  }

  move(x: number, y: number): boolean {
    if (!this.active) {
      return false;
    }
    const wasCancelReady = this.isCancelReady;
    this.currentX = x;
    this.currentY = y;
    this.recompute();
    return this.isCancelReady && !wasCancelReady;
  }

  shouldLaunch(): boolean {
    return this.hasEnteredAim && !this.isCancelReady;
  }

  end(): { vx: number; vy: number; vz: number } {
    this.recompute();
    this.active = false;
    return this.getLaunchVelocity();
  }

  cancel(): void {
    this.active = false;
    this.hasEnteredAim = false;
    this.isCancelReady = false;
    this.maxDragDistance = 0;
    this.aimX = 0;
    this.aimY = 0;
    this.power = 0;
    this.normalizedX = 0;
    this.normalizedY = 0;
    this.dragDistance = 0;
  }

  getLaunchVelocity(): { vx: number; vy: number; vz: number } {
    const t = GAME_TUNING.projectile;
    return {
      vx: this.aimX * t.maxHorizontalVelocity,
      vy: t.baseVerticalVelocity + this.aimY * t.maxVerticalVelocity,
      vz: lerp(t.minForwardVelocity, t.maxForwardVelocity, this.power),
    };
  }

  private recompute(): void {
    const aiming = GAME_TUNING.aim;
    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    this.normalizedX = deltaX / this.screenWidth;
    this.normalizedY = deltaY / this.screenHeight;
    this.dragDistance = Math.sqrt(
      this.normalizedX * this.normalizedX + this.normalizedY * this.normalizedY,
    );

    const cancelScale = Math.min(this.screenWidth, this.screenHeight);
    const cancelDistance = Math.hypot(deltaX, deltaY) / cancelScale;
    this.maxDragDistance = Math.max(this.maxDragDistance, cancelDistance);

    if (!this.hasEnteredAim && this.maxDragDistance >= aiming.minAimDrag) {
      this.hasEnteredAim = true;
    }

    if (this.hasEnteredAim) {
      if (this.isCancelReady) {
        this.isCancelReady = cancelDistance < aiming.cancelExitRadius;
      } else {
        this.isCancelReady = cancelDistance <= aiming.cancelEnterRadius;
      }
    } else {
      this.isCancelReady = false;
    }

    this.aimX = curveAxis(
      -this.normalizedX,
      aiming.maxHorizontalDrag,
      aiming.horizontalAimExponent,
    );
    this.aimY = curveAxis(
      -this.normalizedY,
      aiming.maxVerticalDrag,
      aiming.verticalAimExponent,
    );
    this.power = clamp(this.dragDistance / aiming.maxDrag, 0, 1);
  }
}

function curveAxis(value: number, span: number, exponent: number): number {
  const raw = clamp(value / span, -1, 1);
  return Math.sign(raw) * Math.pow(Math.abs(raw), exponent);
}
