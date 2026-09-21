import {createWorldGateHousing} from './WorldGateHousing';
import {disposeThreeObject} from '../utils/disposeThree';
import * as THREE from 'three';

export type JumpGateVisualConfig = {
  frameColor: number; energyColor: number; secondaryEnergyColor: number;
  interiorColor: number; segmentCount: number; particleStyle: 'motes'; pulseStrength: number;
};
export const CONTAINMENT_GATE: JumpGateVisualConfig = {
  frameColor: 0x263f55, energyColor: 0x50e5ff, secondaryEnergyColor: 0x236aff,
  interiorColor: 0x020713, segmentCount: 6, particleStyle: 'motes', pulseStrength: 1,
};
/** Unit aperture radius. No collision or scoring data belongs in this renderer. */
export class JumpGateVisual {
  readonly group = new THREE.Group();
  readonly frame = new THREE.Group();
  private readonly energy: THREE.Group[] = [];
  private readonly energyMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly interiorMaterial: THREE.ShaderMaterial;
  private readonly particles: THREE.Points;
  private readonly positions = new Float32Array(32*3);
  private readonly colors = new Float32Array(32*3);
  private readonly particleTint: THREE.Color;
  private world = 'containment';
  private housing:THREE.Group|null=null;
  private time = 0;
  private response = 0;
  private strength = 0;
  constructor(readonly config: JumpGateVisualConfig = CONTAINMENT_GATE) {
    this.particleTint=new THREE.Color(config.energyColor);
    this.group.name='jump-gate'; this.frame.name='mechanical-outer-ring';
    const metal = new THREE.MeshPhongMaterial({color:config.frameColor,shininess:85,specular:0x557088});
    const cyan = new THREE.MeshBasicMaterial({color:config.energyColor});
    const amber = new THREE.MeshBasicMaterial({color:0xff9e45});
    const outer = new THREE.Mesh(new THREE.TorusGeometry(1.16,.12,8,64),metal);this.frame.add(outer);
    const box = new THREE.BoxGeometry(1,1,1);
    const block=(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material)=>{
      const mesh=new THREE.Mesh(box,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);this.frame.add(mesh);
    };
    for(const side of [-1,1]) {
      block(side*1.4,0,.08,.12,2.85,.3,metal);
      block(0,side*1.4,.08,2.9,.12,.3,metal);
      block(side*1.4,side*.95,-.12,.055,.38,.035,cyan);
      block(side*1.4,-side*.95,-.12,.055,.38,.035,cyan);
      block(side*1.28,-1.43,-.12,.16,.06,.04,amber);
      block(side*1.4,1.25,1.55,.1,.1,3,metal);
      block(side*1.4,-1.25,1.55,.1,.1,3,metal);
    }
    // Segments stay fixed to the mechanical housing; only inner energy moves.
    const segmentGeometry = new THREE.TorusGeometry(1.18,.035,6,6,.2);
    for(let i=0;i<config.segmentCount;i++) {
      const segment=new THREE.Mesh(segmentGeometry,cyan);segment.rotation.z=i*Math.PI*2/config.segmentCount;
      segment.position.z=-.13;this.frame.add(segment);
    }
    this.group.add(this.frame);
    this.interiorMaterial=new THREE.ShaderMaterial({
      uniforms:{dark:{value:new THREE.Color(config.interiorColor)},blue:{value:new THREE.Color(config.secondaryEnergyColor)},cyan:{value:new THREE.Color(config.energyColor)},time:{value:0},flash:{value:0}},
      vertexShader:'varying vec2 coords; void main(){coords=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`
        uniform vec3 dark;uniform vec3 blue;uniform vec3 cyan;uniform float time;uniform float flash;varying vec2 coords;
        void main(){
          float r=length(coords);float a=atan(coords.y,coords.x);
          float swirl=.5+.5*sin(a*7.0-r*18.0+time*.65);
          float edge=pow(r,6.0);
          vec3 col=mix(dark,blue,edge*(.45+.25*swirl));
          col+=cyan*pow(r,22.0)*.65;
          // Broad, off-centre depth light, not a target dot.
          float depth=exp(-length(coords-vec2(-.13,.08))*13.0);
          col+=blue*depth*.28+cyan*flash*.3;
          gl_FragColor=vec4(col,1.0);
          #include <colorspace_fragment>
        }`,side:THREE.DoubleSide,toneMapped:false,
    });
    const interior=new THREE.Mesh(new THREE.CircleGeometry(1,64),this.interiorMaterial);
    interior.name='portal-interior';interior.position.z=.035;this.group.add(interior);
    const halo=new THREE.Mesh(new THREE.RingGeometry(.96,1.32,64),new THREE.ShaderMaterial({
      uniforms:{tint:{value:new THREE.Color(config.energyColor)}},
      vertexShader:'varying vec2 coords;void main(){coords=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform vec3 tint;varying vec2 coords;void main(){float d=abs(length(coords)-1.065);float a=exp(-d*22.0)*.27;gl_FragColor=vec4(tint,a);}',
      transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    }));halo.position.z=-.14;halo.name='energy-halo';this.group.add(halo);
    for(let layer=0;layer<3;layer++) {
      const ring=new THREE.Group();ring.name=`energy-ring-${layer}`;
      const mat=new THREE.MeshBasicMaterial({color:layer===1?config.secondaryEnergyColor:config.energyColor,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false});
      this.energyMaterials.push(mat);
      const geometry=new THREE.TorusGeometry(1.015+layer*.045,.016+layer*.003,6,24,Math.PI*.8);
      for(let arc=0;arc<2;arc++) {
        const mesh=new THREE.Mesh(geometry,mat);mesh.rotation.z=arc*Math.PI+layer*.5;ring.add(mesh);
      }
      ring.position.z=-.08-layer*.015;this.energy.push(ring);this.group.add(ring);
    }
    const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
    particleGeometry.setAttribute('color',new THREE.BufferAttribute(this.colors,3));
    particleGeometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),2);
    this.particles=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0xffffff,vertexColors:true,size:.025,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));
    this.particles.name='portal-particles';this.group.add(this.particles);
    this.update(0,false);
  }
  setWorld(world:string):void {
    if(this.world===world)return;
    this.world=world;
    if(this.housing){this.group.remove(this.housing);disposeThreeObject(this.housing);this.housing=null;}
    this.frame.visible=world==='containment';
    if(!this.frame.visible){this.housing=createWorldGateHousing(world);this.group.add(this.housing);}
  }
  trigger(strength:number):void {this.response=.48;this.strength=strength;}
  reset():void {this.response=0;this.strength=0;this.time=0;this.update(0,false);}
  update(dt:number,reduceMotion:boolean):void {
    if(!reduceMotion)this.time+=dt;
    this.response=Math.max(0,this.response-dt);
    const progress=1-this.response/.48;
    const flash=this.response>0?Math.sin(progress*Math.PI)*this.strength*this.config.pulseStrength:0;
    this.interiorMaterial.uniforms.time.value=reduceMotion?0:this.time;
    this.interiorMaterial.uniforms.flash.value=flash*(reduceMotion?.3:1);
    this.energy.forEach((ring,i)=>{
      ring.rotation.z=reduceMotion?i*.4:this.time*[.25,-.18,.12][i];
      ring.scale.setScalar(reduceMotion?1:1+Math.sin(this.time*1.6+i)*.008+flash*.035*Math.sin(progress*Math.PI*2));
      this.energyMaterials[i].opacity=Math.min(1,.65+flash*.22);
    });
    for(let i=0;i<32;i++) {
      const life=reduceMotion?(i+.5)/32:((i/32+this.time*.13)%1);
      const a=i*2.399+ (reduceMotion?0:this.time*.22);
      const burst=reduceMotion?0:flash*.12;
      const r=1.055-life*.14+burst;
      this.positions.set([Math.cos(a)*r,Math.sin(a)*r,-.14-life*.08],i*3);
      const fade=Math.sin(life*Math.PI);
      this.colors.set([this.particleTint.r*fade,this.particleTint.g*fade,this.particleTint.b*fade],i*3);
    }
    this.particles.geometry.getAttribute('position').needsUpdate=true;
    this.particles.geometry.getAttribute('color').needsUpdate=true;
    const pm=this.particles.material as THREE.PointsMaterial;
    pm.opacity=reduceMotion?.35:.5+flash*.2;pm.size=.022+(reduceMotion?0:flash*.012);
  }
  dispose():void {
    const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
    this.group.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material){for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(mat);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }
}
