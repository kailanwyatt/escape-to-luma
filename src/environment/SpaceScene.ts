import * as THREE from 'three';
import {containmentMetal} from '../graphics/ContainmentMaterials';
import {createWorldBackdrop} from '../graphics/WorldBackdrop';

/** Static orbital set. All dressing is outside the flight lane; no collision ownership.
 * Shared instanced hardware and procedural planet materials need no texture downloads. */
export function createSpaceScene(chapter:'upper_atmosphere'|'orbit'|'orbital_graveyard'='orbit'): THREE.Group {
  const root = new THREE.Group(); root.name = 'space';
  const steel = containmentMetal(); steel.color.setHex(0x7793a8);
  const dark = new THREE.MeshPhongMaterial({color:0x101e30,shininess:28});
  const trim = new THREE.MeshPhongMaterial({color:0xadc0cb,shininess:85});
  const gold = new THREE.MeshPhongMaterial({color:0xb89958,shininess:55});
  const cells = new THREE.MeshPhongMaterial({color:0x102f67,emissive:0x061733,shininess:95});
  const cyan = new THREE.MeshBasicMaterial({color:0x74c8dc});
  const amber = new THREE.MeshBasicMaterial({color:0xf2b663});
  const batches = new Map<THREE.Material,THREE.Matrix4[]>();
  const t = new THREE.Object3D();
  const box = (m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,rz=0) => {
    t.position.set(x,y,z); t.scale.set(w,h,d); t.rotation.set(0,0,rz); t.updateMatrix();
    const list=batches.get(m)??[]; list.push(t.matrix.clone()); batches.set(m,list);
  };
  // Detached station modules frame free flight; no deck or runway below Spark.
  for(const s of [-1,1]) {
    for(const z of (chapter==='upper_atmosphere'?[]:chapter==='orbital_graveyard'?[14]:[2,8,14])) {
      // Equipment bays: radiator fins, access cover, clamps and status lamps.
      box(dark,s*4.55,.18,z,1.35,.4,1.8);
      box(steel,s*4.55,.8,z,1.17,.95,1.5);
      box(trim,s*4.55,1.31,z,1.23,.09,1.56);
      box(dark,s*4.55,.83,z-.77,.86,.58,.035);
      for(let i=0;i<6;i++)box(trim,s*4.55,.6+i*.085,z-.8,.76,.025,.025);
      box(amber,s*4.9,1.16,z-.81,.09,.045,.035);
      for(const dx of [-.5,.5])box(gold,s*4.55+dx,.83,z-.79,.045,.9,.06);
      // Outboard mounting column with visible diagonal truss braces.
      box(steel,s*5.4,2.5,z,.22,5,.24);
      box(trim,s*5.85,2.5,z,.11,5,.14);
      for(let y=.6;y<5;y+=1.05) {
        box(trim,s*5.62,y,z,.7,.06,.09);
        box(steel,s*5.62,y+.48,z,.055,1.12,.09,-s*.42);
      }
      box(cyan,s*5.37,4.6,z-.15,.1,.45,.025);
    }
    // Readable solar-cell arrays, set beyond the playable obstacle corridor.
    for(const z of (chapter==='upper_atmosphere'?[27]:[11,19,27])) {
      const arrayX=s*(z===27?4.6:7);
      box(trim,arrayX,4.5,z,3.2,.12,.18);
      box(gold,arrayX,4.5,z,2.65,4.45,.16);
      box(dark,arrayX,4.5,z-.1,2.47,4.27,.08);
      for(let row=0;row<8;row++)for(let col=0;col<4;col++){
        if(chapter==='orbital_graveyard'&&(row+col)%3===0)continue;
        box(cells,arrayX+(col-1.5)*.59,4.5+(row-3.5)*.52,z-.16,.56,.49,.04,chapter==='orbital_graveyard'?(row%2?-.14:.12):0);
      }
      box(trim,arrayX,4.5,z-.2,.045,4.25,.025);
    }
  }
  for(const [m,matrices] of batches) {
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),m,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix)); mesh.instanceMatrix.needsUpdate=true; root.add(mesh);
  }
  // Seeded, softly edged stars stay fixed in space, rather than spinning around the player.
  const points:number[]=[],colors:number[]=[]; let seed=419;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<520;i++) {
    points.push((rand()-.5)*110,-2+rand()*40,42+rand()*19);
    const b=.3+rand()*.7;colors.push(b*.78,b*.87,b);
  }
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));starGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const stars=new THREE.Points(starGeo,new THREE.ShaderMaterial({vertexColors:true,depthWrite:false,
    vertexShader:`varying vec3 c; void main(){c=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=1.2+color.b*1.5;}`,
    fragmentShader:`varying vec3 c; void main(){float a=1.-smoothstep(.1,.5,length(gl_PointCoord-.5));if(a<.01)discard;gl_FragColor=vec4(c,a);}`,
    transparent:true}));stars.name='stars';root.add(stars);
  // Upper Atmosphere: closer Earth + warm terminator. Orbit: cooler deep space.
  // Graveyard: wreckage drift plate (Drift chapter uses belt elsewhere).
  const matteId =
    chapter==='upper_atmosphere' ? 'space-orbit' as const :
    chapter==='orbital_graveyard' ? 'space-drift' as const :
    'space-orbit' as const;
  const matte=createWorldBackdrop(matteId);
  (matte.material as THREE.MeshBasicMaterial).color.setHex(
    chapter==='upper_atmosphere' ? 0xd4b896 :
    chapter==='orbital_graveyard' ? 0x6e7f94 :
    0x9eb0c8,
  );
  root.add(matte);
  root.add(createEarth());
  return root;
}

export function createEarth():THREE.Group {
  const root=new THREE.Group();root.name='earth-system';
  const earth=new THREE.Mesh(new THREE.SphereGeometry(32,64,40),new THREE.ShaderMaterial({
    vertexShader:`varying vec3 p; varying vec3 n; varying vec3 eye; void main(){p=position/32.;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec3 p; varying vec3 n; varying vec3 eye;
    float hash(vec3 q){return fract(sin(dot(q,vec3(127.1,311.7,74.7)))*43758.5453);}
    float noise(vec3 q){vec3 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 q){return noise(q)*.57+noise(q*2.03)*.28+noise(q*4.1)*.15;}
    void main(){vec3 q=normalize(p);float land=smoothstep(.51,.57,fbm(q*5.+3.));
    vec3 sea=mix(vec3(.012,.045,.12),vec3(.025,.22,.38),fbm(q*14.));
    vec3 ground=mix(vec3(.035,.12,.13),vec3(.24,.28,.22),fbm(q*22.));
    float cloud=smoothstep(.49,.7,fbm(q*25.+vec3(sin(q.y*24.)*.7,2.,1.)));
    vec3 col=mix(mix(sea,ground,land),vec3(.79,.88,.94),cloud*.88);
    float day=.28+.72*smoothstep(-.45,.65,dot(q,normalize(vec3(-.6,.7,-1.))));
    float rim=pow(1.-max(0.,dot(normalize(n),normalize(eye))),3.);
    gl_FragColor=vec4(col*day+vec3(.08,.34,.68)*rim*.7,1.);}`
  }));earth.position.set(0,-25,49);earth.rotation.z=-.16;earth.name='earth-horizon';root.add(earth);
  const air=new THREE.Mesh(new THREE.SphereGeometry(32.4,64,40),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec3 n; varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
    fragmentShader:`varying vec3 n;varying vec3 v;void main(){float f=pow(1.-max(0.,dot(normalize(n),normalize(v))),5.);gl_FragColor=vec4(.14,.5,1.,f*.58);}`
  }));air.position.copy(earth.position);air.name='earth-atmosphere';root.add(air);
  return root;
}
