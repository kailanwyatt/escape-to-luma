import * as THREE from 'three';

/** Sculpted depth, never a displaced XY hit silhouette. No decorative hit targets. */
export function createConveyorAsteroid(seed: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 64, 40);
  const positions = geometry.getAttribute('position');
  const colors: number[] = [];
  const craters = Array.from({length: 5}, (_, i) => {
    const angle = seed * 2.399 + i * 2.07;
    const distance = .18 + (i % 3) * .22;
    return {x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, r: .16 + (i % 2) * .09};
  });
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const ridge = Math.sin(x * 9 + seed) * Math.cos(y * 11 - seed);
    const grain = Math.sin(x * 43 + y * 27) * Math.cos(y * 39 - x * 17);
    let relief = .86 + ridge * .1 + grain * .025;
    let basin = 0;
    for (const crater of craters) {
      const distance = Math.hypot(x - crater.x, y - crater.y) / crater.r;
      basin += Math.exp(-distance * distance * 3);
      relief += .09 * Math.exp(-Math.pow((distance - .95) * 5, 2));
    }
    // Impact bowls and raised crater lips have real depth on both visible faces.
    positions.setZ(i, z * Math.max(.38, relief - basin * .24));
    const strata = Math.sin(y * 18 + x * 7 + ridge * 2 + seed);
    const mineral = Math.pow(Math.max(0, strata), 14);
    const shade = .48 + ridge * .09 + grain * .045 - Math.min(basin, 1) * .1;
    color.setRGB(shade + mineral * .22, shade * .85 + mineral * .18, shade * .7 + mineral * .13);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshPhongMaterial({
    color: seed % 2 ? 0xd7ccc0 : 0xbac6d0,
    vertexColors: true, shininess: 9, specular: 0x383330,
    flatShading: true,
  });
  const body = new THREE.Mesh(geometry, material);
  body.name = 'conveyor-impact-sculpted-asteroid';
  return body;
}
