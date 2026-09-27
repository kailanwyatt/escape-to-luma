import * as THREE from 'three';

/** Living energy core — white-hot heart, roaming filaments, soft limb swirl. Collider stays spherical. */
export class SparkCoreMaterial extends THREE.ShaderMaterial {
  readonly color: THREE.Color;
  constructor() {
    const color = new THREE.Color(0x50deff);
    super({
      uniforms: {
        tint: { value: color },
        time: { value: 0 },
        energy: { value: 1 },
        /** 0 calm, 1 reactor, 2 neon, 3 storm */
        style: { value: 0 },
      },
      vertexShader: `
        varying vec3 viewNormal; varying vec3 viewDirection; varying vec3 localPosition;
        void main() {
          vec4 p = modelViewMatrix * vec4(position,1.0);
          viewNormal = normalize(normalMatrix * normal); viewDirection = -p.xyz;
          localPosition = normalize(position); gl_Position = projectionMatrix * p;
        }`,
      fragmentShader: `
        uniform vec3 tint; uniform float time; uniform float energy; uniform float style;
        varying vec3 viewNormal; varying vec3 viewDirection; varying vec3 localPosition;
        float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
        void main() {
          vec3 n = normalize(viewNormal);
          vec3 v = normalize(viewDirection);
          float facing = max(dot(n,v),0.0);
          float swirlSpeed = mix(1.35, mix(1.9, mix(2.4, 3.1, step(2.5, style)), step(1.5, style)), step(0.5, style));
          float bandTight = mix(14.0, mix(11.0, mix(18.0, 9.0, step(2.5, style)), step(1.5, style)), step(0.5, style));
          float swirl = atan(localPosition.y, localPosition.x) + time * swirlSpeed;
          float band = sin(localPosition.y * 9.0 + swirl * 2.0 + sin(time * 0.9) * 1.4);
          float filament = pow(1.0 - abs(band), bandTight) * (0.35 + 0.65 * (1.0 - facing));
          float filament2 = pow(1.0 - abs(sin(localPosition.z * 8.0 - swirl * 1.6 + time * 1.1)), 18.0)
            * (1.0 - facing) * 0.55;
          // Neon: sharp meridian arcs. Storm: crackle grain. Reactor: hot core bias.
          float neonArc = style > 1.5 && style < 2.5
            ? pow(1.0 - abs(sin(atan(localPosition.y, localPosition.x) * 3.0 + time * 4.0)), 22.0) * 0.7
            : 0.0;
          float stormCrack = style > 2.5
            ? hash(floor(localPosition * 28.0 + time * 2.2)) * (1.0 - facing) * 0.55
            : 0.0;
          float grain = hash(floor(localPosition * 18.0 + time * 0.4)) * 0.08;
          float core = pow(facing, mix(2.4, 1.6, step(0.5, style) * (1.0 - step(1.5, style))));
          float rim = pow(1.0 - facing, 2.8);
          float heat = core * 1.15 + filament * 0.55 + filament2 * 0.4 + grain + rim * 0.12 + neonArc + stormCrack;
          vec3 hot = vec3(0.96, 0.99, 1.0);
          vec3 mid = mix(tint, hot, 0.35);
          vec3 light = mix(tint * 0.55, mid, clamp(heat, 0.0, 1.0));
          light = mix(light, hot, clamp(core * 0.85 + filament * 0.25, 0.0, 1.0));
          if (style > 2.5) light = mix(light, vec3(0.85, 0.92, 1.0), stormCrack);
          gl_FragColor = vec4(light * energy, 1.0);
          #include <colorspace_fragment>
        }`,
      toneMapped: false,
    });
    this.color = color;
  }

  setStyle(orbitStyle: 'calm' | 'reactor' | 'neon' | 'storm'): void {
    const map = { calm: 0, reactor: 1, neon: 2, storm: 3 } as const;
    this.uniforms.style.value = map[orbitStyle];
  }
}
