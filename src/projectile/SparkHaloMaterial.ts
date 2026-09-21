import * as THREE from 'three';

/** Soft sphere falloff; one additive draw, no textures or fullscreen bloom pass. */
export class SparkHaloMaterial extends THREE.ShaderMaterial {
  readonly color: THREE.Color;

  constructor(color: number) {
    const tint = new THREE.Color(color);
    super({
      uniforms: { tint: { value: tint }, strength: { value: .12 }, time: { value: 0 }, turbulence: { value: 0 } },
      vertexShader: `
        varying vec3 viewNormal;
        varying vec3 viewDirection;
        varying vec3 localDirection;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          viewNormal = normalize(normalMatrix * normal);
          localDirection = normalize(position);
          viewDirection = -viewPosition.xyz;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 tint;
        uniform float strength;
        uniform float time;
        uniform float turbulence;
        varying vec3 viewNormal;
        varying vec3 viewDirection;
        varying vec3 localDirection;
        void main() {
          float facing = max(dot(normalize(viewNormal), normalize(viewDirection)), 0.0);
          // Uneven tongues of light move outward; the sphere underneath stays solid.
          vec3 direction = normalize(localDirection);
          float angle = atan(direction.y, direction.x);
          float radius = sqrt(max(0.0, 1.0-facing*facing));
          float flow = sin(angle*5.0 + sin(angle*3.0-time*1.7) + radius*9.0-time*2.6);
          float tendrils = pow(.5+.5*sin(angle*9.0+flow*1.4-time*.8),3.0);
          float envelope = pow(facing, mix(3.2,1.7,tendrils*turbulence));
          float wave = .5+.5*sin(radius*13.0-time*3.6+flow*.8);
          float falloff = envelope * (1.0 + turbulence*(flow*.3+tendrils*.65+wave*.25));
          gl_FragColor = vec4(tint, falloff * strength);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.color = tint;
  }

  setActivity(time: number, turbulence: number): void {
    this.uniforms.time.value = time;
    this.uniforms.turbulence.value = Math.max(0, Math.min(1, turbulence));
  }

  setStrength(strength: number): void {
    this.uniforms.strength.value = Math.max(0, Math.min(1, strength));
  }
}
