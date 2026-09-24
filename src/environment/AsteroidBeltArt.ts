import * as THREE from 'three';
import {createAsteroidGeometry} from './AsteroidGeometry';

const fract = (n: number) => n - Math.floor(n);
function noise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const hash = (a: number, b: number) => fract(Math.sin(a * 127.1 + b * 311.7 + seed) * 43758.5453);
  const u = fract(x), v = fract(y), sx = u*u*(3-2*u), sy = v*v*(3-2*v);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),sx),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),sx),sy);
}

/** Baked once per chapter level; no animated full-screen noise or downloaded asset. */
function nebulaTexture(seed: number): THREE.DataTexture {
  const w=256,h=512,data=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const u=x/w,v=y/h;
    let cloud=0,weight=.55;
    for(let octave=0;octave<4;octave++){
      cloud+=noise(u*7*2**octave,v*10*2**octave,seed)*weight;weight*=.5;
    }
    const ribbon=Math.exp(-Math.pow((u-.48-.19*Math.sin(v*8+cloud*3))*5,2));
    const dust=Math.pow(Math.max(0,cloud-.27),1.6)*ribbon;
    const purple=.5+.5*Math.sin(v*12+seed);
    const index=(y*w+x)*4;
    data[index]=5+dust*(40+purple*40);
    data[index+1]=9+dust*(75-purple*25);
    data[index+2]=18+dust*145;
    data[index+3]=255;
  }
  const texture=new THREE.DataTexture(data,w,h);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
  return texture;
}

/** Environment only. No obstacle registration, hit geometry, physics, or gameplay state. */
export function createAsteroidBeltArt(level=95): THREE.Group {
  const root=new THREE.Group();root.name='asteroid-belt-depth-environment';
  let seed=(7919+level*104729)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(120,100),new THREE.MeshBasicMaterial({map:nebulaTexture(level),side:THREE.DoubleSide,fog:false,depthWrite:false}));
  backdrop.name='belt-nebula';backdrop.position.set(0,4,68);root.add(backdrop);

  const stars:number[]=[],colors:number[]=[];
  for(let i=0;i<900;i++){
    stars.push((random()-.5)*76,(random()-.5)*70,63+random()*3);
    const intensity=.25+random()*.55;colors.push(intensity*.7,intensity*.83,intensity);
  }
  const starGeometry=new THREE.BufferGeometry();
  starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  starGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const starfield=new THREE.Points(starGeometry,new THREE.PointsMaterial({size:.045,vertexColors:true,fog:false,depthWrite:false}));
  starfield.name='belt-stars';root.add(starfield);

  const planetGeometry=createAsteroidGeometry(27181,64,40);
  const surface=planetGeometry.getAttribute('position'),point=new THREE.Vector3();
  for(let i=0;i<surface.count;i++){
    point.fromBufferAttribute(surface,i).normalize();
    surface.setXYZ(i,point.x,point.y,point.z);
  }
  planetGeometry.computeVertexNormals();planetGeometry.computeBoundingSphere();
  const planet=new THREE.Mesh(planetGeometry,new THREE.MeshPhongMaterial({color:0x464f69,vertexColors:true,shininess:2,fog:false}));
  planet.name='belt-distant-moon';planet.position.set(13+(level%3)*.5,14,57);planet.scale.set(7,7,7);root.add(planet);
  const rim=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.BackSide,
    vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 n; varying vec3 v;void main(){float edge=pow(1.-abs(dot(normalize(n),normalize(v))),5.);gl_FragColor=vec4(.38,.48,.7,edge*.25);}',
  }));
  rim.name='belt-moon-rim';rim.position.copy(planet.position);rim.scale.copy(planet.scale).multiplyScalar(1.12);root.add(rim);

  // One cheap shader quad provides a soft solar halo, not volumetrics or postprocessing.
  const sun=new THREE.Mesh(new THREE.PlaneGeometry(19,19),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:'varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 p;void main(){float r=length(p);float halo=exp(-r*8.)*.45;float core=1.-smoothstep(.07,.12,r);gl_FragColor=vec4(1.,.68,.34,(halo+core*.7)*(1.-smoothstep(.65,1.,r)));}',
  }));
  sun.name='belt-distant-sun';sun.position.set(-14,7,60);root.add(sun);

  const rockMaterial=new THREE.MeshPhongMaterial({color:0x766e67,vertexColors:true,shininess:2,fog:false});
  const stream=new THREE.InstancedMesh(createAsteroidGeometry(771,8,6),rockMaterial,360);
  stream.name='belt-distant-stream';const transform=new THREE.Object3D();
  const slope=-.18-(level%4)*.025;
  for(let i=0;i<stream.count;i++){
    const x=(random()-.5)*65,z=43+random()*13;
    transform.position.set(x,9+x*slope+(random()-.5)*1.6,z);
    transform.rotation.set(random()*6,random()*6,random()*6);
    transform.scale.setScalar(.045+random()**3*.25);transform.updateMatrix();stream.setMatrixAt(i,transform.matrix);
  }
  root.add(stream);
  const mid=new THREE.InstancedMesh(createAsteroidGeometry(331,16,12),rockMaterial,28);
  mid.name='belt-midground-rocks';
  for(let i=0;i<mid.count;i++){
    transform.position.set((i%2?1:-1)*(6+random()*14),-7+random()*24,25+random()*17);
    transform.rotation.set(random()*6,random()*6,random()*6);
    transform.scale.setScalar(.18+random()*.65);transform.updateMatrix();mid.setMatrixAt(i,transform.matrix);
  }
  root.add(mid);
  // Only side-edge fragments near the viewer. Never move them inward across the flight lane.
  for(const side of [-1,1]){
    const rock=new THREE.Mesh(createAsteroidGeometry(444+side,24,16),new THREE.MeshPhongMaterial({color:0x51463e,vertexColors:true,shininess:1,fog:false}));
    rock.name='belt-foreground-edge';rock.position.set(side*5.5,-2,5);rock.scale.set(1.8,2.1,1.5);root.add(rock);
  }
  root.userData.updateAtmosphere=(time:number,reduced:boolean)=>{
    // Bounded environmental drift supplements natural perspective parallax; no camera edits.
    const t=reduced?0:time;
    stream.position.x=Math.sin(t*.025)*.1;
    mid.position.y=Math.sin(t*.04)*.06;
  };
  root.userData.decorativeOnly=true;
  return root;
}
