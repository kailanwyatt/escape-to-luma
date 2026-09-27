import * as THREE from 'three';
import type { EnvironmentId } from '../config/ChallengeConfig';
import { FacilityArtKit } from './FacilityArtKit';
import { RING_VISUAL_VARIANT } from './RingVisualVariant';

/** Legacy Phong airborne gate (pre-cinematic). */
function createAirborneGateLegacy(environment: EnvironmentId): THREE.Group {
  const group = new THREE.Group();
  group.name = 'airborne-security-gate';
  const metal = new THREE.MeshPhongMaterial({ color: environment === 'rooftop' ? 0x465b6d : 0x304759, shininess: 95 });
  const dark = new THREE.MeshPhongMaterial({ color: 0x111e2a, shininess: 60 });
  const silver = new THREE.MeshPhongMaterial({ color: 0xa8bec9, shininess: 110 });
  const amber = new THREE.MeshBasicMaterial({ color: 0xffba54 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x79e8ff });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { openingRadius: { value: 1 } },
    vertexShader: `varying vec2 point; void main(){ point=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision mediump float; varying vec2 point; uniform float openingRadius;
      void main(){ float r=length(point); if(r<openingRadius) discard;
        float edge=exp(-max(0.0,r-openingRadius)*8.0);
        float alpha=edge*0.16;
        gl_FragColor=vec4(vec3(1.0,0.60,0.20),alpha); }`,
  }));
  field.name = 'security-field';
  field.position.z = 0.06;
  group.add(field);
  const hardware = new THREE.Group();
  hardware.name = 'gate-hardware';
  group.add(hardware);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const addBox = (parent: THREE.Group, mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
    const mesh = new THREE.Mesh(box, mat); mesh.position.set(x,y,z); mesh.scale.set(w,h,d); parent.add(mesh); return mesh;
  };
  const shape = new THREE.Shape(); shape.absarc(0,0,1.18,0,Math.PI*2,false);
  const hole = new THREE.Path(); hole.absarc(0,0,1,0,Math.PI*2,true); shape.holes.push(hole);
  const casing = new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:0.19,bevelEnabled:false,curveSegments:48}),metal);
  casing.position.z=-0.1; hardware.add(casing);
  for (const [radius,tube,mat] of [[1.014,0.012,amber],[1.155,0.015,silver],[1.08,0.024,dark]] as const) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius,tube,6,64),mat); rim.position.z=-0.115; hardware.add(rim);
  }
  const segmentGeo = new THREE.TorusGeometry(1.09,0.019,5,8,0.20);
  for(let i=0;i<12;i++) {
    const segment=new THREE.Mesh(segmentGeo,amber); segment.rotation.z=i*Math.PI/6; segment.position.z=-0.144; hardware.add(segment);
  }
  for(let i=0;i<4;i++) {
    const pod=new THREE.Group(); pod.rotation.z=Math.PI/4+i*Math.PI/2; hardware.add(pod);
    addBox(pod,dark,1.21,0,0,0.34,0.27,0.28);
    addBox(pod,metal,1.25,0,-0.04,0.27,0.23,0.27);
    addBox(pod,silver,1.25,0,-0.19,0.21,0.20,0.025);
    addBox(pod,dark,1.25,0,-0.21,0.16,0.15,0.025);
    for(const y of [-0.045,0,0.045]) addBox(pod,cyan,1.25,y,-0.229,0.11,0.018,0.012);
    const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(0.072,0.095,0.13,12),dark);
    nozzle.rotation.z=-Math.PI/2; nozzle.position.x=1.44; pod.add(nozzle);
    const exhaust=new THREE.Mesh(new THREE.ConeGeometry(0.058,0.19,12),new THREE.MeshBasicMaterial({color:0x80eeff,transparent:true,opacity:0.24,depthWrite:false}));
    exhaust.rotation.z=-Math.PI/2; exhaust.position.x=1.59; pod.add(exhaust);
  }
  return group;
}

/** Cinematic climb ring — FacilityArtKit metals, same silhouette as legacy. */
function createAirborneGateCinematic(environment: EnvironmentId): THREE.Group {
  const group = new THREE.Group();
  group.name = 'airborne-security-gate';
  group.userData.cinematicRing = true;
  const kit = new FacilityArtKit({ cinematic: true });
  group.userData.kit = kit;
  const metal = kit.metal(environment === 'rooftop' ? 0x465b6d : 0x304759, 0.32);
  const dark = kit.metal(0x111e2a, 0.55, false);
  const silver = kit.metal(0xa8bec9, 0.2);
  const lamp = kit.lamp();
  lamp.color.setHex(0xffba54);
  lamp.emissive.setHex(0xff9a32);
  const cyan = kit.lampCore();
  cyan.color.setHex(0x79e8ff);
  cyan.emissive.setHex(0x4aa7c9);

  const field = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { openingRadius: { value: 1 } },
    vertexShader: `varying vec2 point; void main(){ point=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `precision mediump float; varying vec2 point; uniform float openingRadius;
      void main(){ float r=length(point); if(r<openingRadius) discard;
        float edge=exp(-max(0.0,r-openingRadius)*8.0);
        float alpha=edge*0.18;
        gl_FragColor=vec4(vec3(1.0,0.62,0.22),alpha); }`,
  }));
  field.name = 'security-field';
  field.position.z = 0.06;
  group.add(field);

  const hardware = new THREE.Group();
  hardware.name = 'gate-hardware';
  group.add(hardware);

  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.18, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 1, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const casing = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.19, bevelEnabled: false, curveSegments: 48 }),
    metal,
  );
  casing.position.z = -0.1;
  hardware.add(casing);

  for (const [radius, tube, mat] of [
    [1.014, 0.012, lamp],
    [1.155, 0.015, silver],
    [1.08, 0.024, dark],
  ] as const) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 64), mat);
    rim.position.z = -0.115;
    hardware.add(rim);
  }
  const segmentGeo = new THREE.TorusGeometry(1.09, 0.019, 6, 8, 0.2);
  for (let i = 0; i < 12; i++) {
    const segment = new THREE.Mesh(segmentGeo, lamp);
    segment.rotation.z = (i * Math.PI) / 6;
    segment.position.z = -0.144;
    hardware.add(segment);
  }

  for (let i = 0; i < 4; i++) {
    const pod = new THREE.Group();
    pod.rotation.z = Math.PI / 4 + (i * Math.PI) / 2;
    hardware.add(pod);
    kit.box(pod, 'pod-dark', 0.34, 0.27, 0.28, 1.21, 0, 0, dark, 0.012);
    kit.box(pod, 'pod-armor', 0.27, 0.23, 0.27, 1.25, 0, -0.04, metal, 0.01);
    kit.box(pod, 'pod-plate', 0.21, 0.2, 0.025, 1.25, 0, -0.19, silver, 0.004);
    kit.box(pod, 'pod-recess', 0.16, 0.15, 0.025, 1.25, 0, -0.21, dark, 0);
    for (const y of [-0.045, 0, 0.045]) {
      kit.box(pod, 'pod-cyan', 0.11, 0.018, 0.012, 1.25, y, -0.229, cyan, 0);
    }
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.095, 0.13, 12), dark);
    nozzle.rotation.z = -Math.PI / 2;
    nozzle.position.x = 1.44;
    pod.add(nozzle);
    const exhaust = new THREE.Mesh(
      new THREE.ConeGeometry(0.058, 0.19, 12),
      new THREE.MeshBasicMaterial({ color: 0x80eeff, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    exhaust.rotation.z = -Math.PI / 2;
    exhaust.position.x = 1.59;
    pod.add(exhaust);
  }

  const accent = new THREE.PointLight(0xffba54, 8, 8, 2);
  accent.name = 'ring-accent';
  accent.position.set(0, 0, -1.05);
  group.add(accent);
  return group;
}

/** A clear passage surrounded by a projected security screen. Owns all GPU resources. */
export function createAirborneGate(environment: EnvironmentId): THREE.Group {
  return RING_VISUAL_VARIANT === 'legacy'
    ? createAirborneGateLegacy(environment)
    : createAirborneGateCinematic(environment);
}

export function layoutAirborneGate(group: THREE.Group, radius: number): void {
  group.getObjectByName('gate-hardware')!.scale.setScalar(radius);
  const field = group.getObjectByName('security-field') as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  field.material.uniforms.openingRadius.value = radius;
  const accent = group.getObjectByName('ring-accent') as THREE.PointLight | undefined;
  if (accent) accent.intensity = 7 + Math.min(4, radius);
}
