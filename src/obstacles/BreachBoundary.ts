/** One authored fracture polygon drives the mesh, aim prediction and collision.
 * Counterclockwise, deliberately asymmetric; dimensions scale the same outline. */
const OUTLINE: ReadonlyArray<readonly [number, number]> = [
  [-.8,-1.02],[-.25,-1.15],[.08,-.94],[.55,-1.08],[.78,-.68],
  [1.2,-.46],[.98,-.12],[1.14,.3],[.83,.45],[.94,.83],
  [.4,1.12],[.12,.96],[-.3,1.18],[-.58,.86],[-1.05,.72],
  [-.91,.34],[-1.18,.12],[-.99,-.28],[-1.12,-.69],
];
export const VESSEL = {halfWidth: 2.55, frontHalfWidth: 1.9, height: 6.4, rearZ: -9.6, frontZ: 5.75, thickness: .045} as const;
export function breachBoundary(x: number, y: number, width: number, height: number): Array<[number, number]> {
  return OUTLINE.map(([u,v]) => [x + u * width / 2, y + v * height / 2]);
}
/** Signed distance to a concave polygon, reduced by the projectile's radius. */
export function breachClearance(px: number, py: number, radius: number, x: number, y: number, width: number, height: number): number {
  const points = breachBoundary(x, y, width, height);
  let inside = false, distance = Infinity;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax,ay] = points[j], [bx,by] = points[i];
    if ((ay > py) !== (by > py) && px < (bx-ax)*(py-ay)/(by-ay)+ax) inside = !inside;
    const dx = bx-ax, dy = by-ay;
    const t = Math.max(0, Math.min(1, ((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));
    distance = Math.min(distance, Math.hypot(px-ax-t*dx, py-ay-t*dy));
  }
  return (inside ? distance : -distance) - radius;
}
