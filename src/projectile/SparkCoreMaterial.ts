import * as THREE from 'three';

/** Living energy core — white-hot heart, roaming filaments, soft limb swirl. Collider stays spherical. */
export class SparkCoreMaterial extends THREE.ShaderMaterial {
  readonly color: THREE.Color;
  constructor() {
    const color = new THREE.Color(0x50deff);
    super({
      uniforms: { tint: { value: color }, time: { value: 0 }, energy: { value: 1 } },
      vertexShader: `
        varying vec3 viewNormal; varying vec3 viewDirection; varying vec3 localPosition;
        void main() {
          vec4 p = modelViewMatrix * vec4(position,1.0);
          viewNormal = normalize(normalMatrix * normal); viewDirection = -p.xyz;
          localPosition = normalize(position); gl_Position = projectionMatrix * p;
        }`,
      fragmentShader: `
        uniform vec3 tint; uniform float time; uniform float energy;
        varying vec3 viewNormal; varying vec3 viewDirection; varying vec3 localPosition;
        float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
        void main() {
          vec3 n = normalize(viewNormal);
          vec3 v = normalize(viewDirection);
          float facing = max(dot(n,v),0.0);
          // Roaming energy filaments (alive, not a flat ball).
          float swirl = atan(localPosition.y, localPosition.x) + time * 1.35;
          float band = sin(localPosition.y * 9.0 + swirl * 2.0 + sin(time * 0.9) * 1.4);
          float filament = pow(1.0 - abs(band), 14.0) * (0.35 + 0.65 * (1.0 - facing));
          float filament2 = pow(1.0 - abs(sin(localPosition.z * 8.0 - swirl * 1.6 + time * 1.1)), 18.0)
            * (1.0 - facing) * 0.55;
          float grain = hash(floor(localPosition * 18.0 + time * 0.4)) * 0.08;
          float core = pow(facing, 2.4);
          float rim = pow(1.0 - facing, 2.8);
          float heat = core * 1.15 + filament * 0.55 + filament2 * 0.4 + grain + rim * 0.12;
          vec3 hot = vec3(0.96, 0.99, 1.0);
          vec3 mid = mix(tint, hot, 0.35);
          vec3 light = mix(tint * 0.55, mid, clamp(heat, 0.0, 1.0));
          light = mix(light, hot, clamp(core * 0.85 + filament * 0.25, 0.0, 1.0));
          gl_FragColor = vec4(light * energy, 1.0);
          #include <colorspace_fragment>
        }`,
      toneMapped: false,
    });
    this.color = color;
  }
}
