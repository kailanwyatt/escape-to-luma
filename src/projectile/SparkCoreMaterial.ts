import * as THREE from 'three';

/** Round silhouette, white-hot centre and slow internal currents; no textures. */
export class SparkCoreMaterial extends THREE.ShaderMaterial {
  readonly color: THREE.Color;
  constructor() {
    const color = new THREE.Color(0x50deff);
    super({
      uniforms: {tint: {value: color}, time: {value: 0}, energy: {value: 1}},
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
        void main() {
          float facing = max(dot(normalize(viewNormal),normalize(viewDirection)),0.0);
          float current = sin(localPosition.y*8.0 + sin(localPosition.x*6.0 + time*1.1) + time*1.6)
            * sin(localPosition.z*7.0 - time*.85);
          float filament = pow(1.0-abs(current),16.0) * (1.0-facing);
          float heat = smoothstep(.12,.94,facing) + current*.1 + filament*.25;
          vec3 light = mix(tint,vec3(.94,1.0,1.0),clamp(heat,0.0,1.0));
          gl_FragColor = vec4(light * energy,1.0);
          #include <colorspace_fragment>
        }`,
      toneMapped: false,
    });
    this.color = color;
  }
}
