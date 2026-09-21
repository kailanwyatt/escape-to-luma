import * as THREE from 'three';
import type { EnvironmentId } from '../config/ChallengeConfig';

/** A clear passage surrounded by a projected security screen. Owns all GPU resources. */
export function createAirborneGate(environment: EnvironmentId): THREE.Group {
  const group = new THREE.Group();
  group.name = 'airborne-security-gate';
  const metal = new THREE.MeshPhongMaterial({ color: environment === 'rooftop' ? 0x465b6d : 0x304759, shininess: 95 });
  const dark = new THREE.MeshPhongMaterial({ color: 0x111e2a, shininess: 60 });
  const silver = new THREE.MeshPhongMaterial({ color: 0xa8bec9, shininess: 110 });
  const amber = new THREE.MeshBasicMaterial({ color: 0xffba54 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x79e8ff });
  // A soft rim glow only: no grid or full-screen tint over the environment.
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
  // Unit inner radius; the whole assembly scales with the authored opening radius.
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
  // Four radial stabilizer pods, kept entirely outside the safe opening.
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

export function layoutAirborneGate(group: THREE.Group, radius: number): void {
  group.getObjectByName('gate-hardware')!.scale.setScalar(radius);
  const field = group.getObjectByName('security-field') as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  field.material.uniforms.openingRadius.value = radius;
}
