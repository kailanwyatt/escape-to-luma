import {createWorldGateHousing} from './WorldGateHousing';
import {disposeThreeObject} from '../utils/disposeThree';
import {GAME_TUNING} from '../game/gameTuning';
import * as THREE from 'three';

export type JumpGateVisualConfig = {
  frameColor: number; energyColor: number; secondaryEnergyColor: number;
  interiorColor: number; segmentCount: number; particleStyle: 'motes'; pulseStrength: number;
};
export const CONTAINMENT_GATE: JumpGateVisualConfig = {
  frameColor: 0x263f55, energyColor: 0x50e5ff, secondaryEnergyColor: 0x236aff,
  interiorColor: 0x020713, segmentCount: 6, particleStyle: 'motes', pulseStrength: 1,
};

const ZONES = GAME_TUNING.target.zones;

/** Unit aperture radius. No collision or scoring data belongs in this renderer —
 * zone rings are decorative cues locked to the same fractions as gameplay scoring. */
export class JumpGateVisual {
  readonly group = new THREE.Group();
  readonly frame = new THREE.Group();
  private readonly energy: THREE.Group[] = [];
  private readonly energyMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly zoneMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly interiorMaterial: THREE.ShaderMaterial;
  private readonly throatMaterial: THREE.MeshPhongMaterial;
  private readonly particles: THREE.Points;
  private readonly positions = new Float32Array(40*3);
  private readonly colors = new Float32Array(40*3);
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
    const bevel = new THREE.MeshPhongMaterial({color:0x1a2e40,shininess:40,specular:0x334455});
    const cyan = new THREE.MeshBasicMaterial({color:config.energyColor});
    const amber = new THREE.MeshBasicMaterial({color:0xff9e45});
    // Dimensional outer shell: lip + depth collar (outside unit aperture).
    this.frame.add(new THREE.Mesh(new THREE.TorusGeometry(1.18,.09,10,64),metal));
    const outerLip=new THREE.Mesh(new THREE.TorusGeometry(1.28,.055,8,48),bevel);
    outerLip.position.set(0,0,.06);this.frame.add(outerLip);
    const innerLip=new THREE.Mesh(new THREE.TorusGeometry(1.12,.04,8,48),cyan);
    innerLip.position.set(0,0,-.04);this.frame.add(innerLip);
    const box = new THREE.BoxGeometry(1,1,1);
    const block=(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material)=>{
      const mesh=new THREE.Mesh(box,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);this.frame.add(mesh);
    };
    for(const side of [-1,1]) {
      block(side*1.42,0,.1,.14,2.9,.42,metal);
      block(0,side*1.42,.1,2.95,.14,.42,metal);
      block(side*1.42,side*.95,-.14,.055,.38,.035,cyan);
      block(side*1.42,-side*.95,-.14,.055,.38,.035,cyan);
      block(side*1.3,-1.45,-.14,.16,.06,.04,amber);
      block(side*1.42,1.28,1.65,.11,.11,3.2,metal);
      block(side*1.42,-1.28,1.65,.11,.11,3.2,metal);
      // Depth braces push the aperture toward the camera as a gate, not a sticker.
      block(side*1.05,side*1.05,.55,.08,.08,1.1,bevel);
    }
    const segmentGeometry = new THREE.TorusGeometry(1.2,.032,6,6,.22);
    for(let i=0;i<config.segmentCount;i++) {
      const segment=new THREE.Mesh(segmentGeometry,cyan);segment.rotation.z=i*Math.PI*2/config.segmentCount;
      segment.position.z=-.16;this.frame.add(segment);
    }
    this.group.add(this.frame);

    // Recessed throat — cylindrical tunnel behind the scoring plane.
    this.throatMaterial=new THREE.MeshPhongMaterial({
      color:0x07111c,emissive:config.secondaryEnergyColor,emissiveIntensity:.18,
      shininess:12,side:THREE.BackSide,transparent:true,opacity:.92,
    });
    const throat=new THREE.Mesh(new THREE.CylinderGeometry(0.98,1.02,0.85,48,1,true),this.throatMaterial);
    throat.rotation.x=Math.PI/2;throat.position.z=0.42;throat.name='portal-throat';this.group.add(throat);
    const throatLip=new THREE.Mesh(
      new THREE.TorusGeometry(1.0,.028,8,48),
      new THREE.MeshBasicMaterial({color:config.energyColor,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}),
    );
    throatLip.position.z=0.02;throatLip.name='throat-lip';this.group.add(throatLip);

    this.interiorMaterial=new THREE.ShaderMaterial({
      uniforms:{dark:{value:new THREE.Color(config.interiorColor)},blue:{value:new THREE.Color(config.secondaryEnergyColor)},cyan:{value:new THREE.Color(config.energyColor)},time:{value:0},flash:{value:0}},
      vertexShader:'varying vec2 coords; void main(){coords=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`
        uniform vec3 dark;uniform vec3 blue;uniform vec3 cyan;uniform float time;uniform float flash;varying vec2 coords;
        void main(){
          float r=length(coords);float a=atan(coords.y,coords.x);
          float swirl=.5+.5*sin(a*7.0-r*16.0+time*.65);
          float tunnel=smoothstep(1.0,.15,r);
          vec3 col=mix(dark,blue,tunnel*(.55+.2*swirl));
          // Soft radial falloff sells depth without painting a bullseye dot.
          float vortex=exp(-r*r*2.8);
          col=mix(col,cyan*.35+blue*.45,vortex*.55);
          col+=cyan*pow(r,18.0)*.55;
          float depth=exp(-length(coords-vec2(-.1,.07))*11.0);
          col+=blue*depth*.22+cyan*flash*.35;
          gl_FragColor=vec4(col,1.0);
          #include <colorspace_fragment>
        }`,side:THREE.DoubleSide,toneMapped:false,
    });
    const interior=new THREE.Mesh(new THREE.CircleGeometry(1,64),this.interiorMaterial);
    interior.name='portal-interior';interior.position.z=.02;this.group.add(interior);

    // Scoring-aligned zone rings (unit aperture = 1). Subtle — teach precision, don't look like a painted target.
    const zoneSpecs:[number,number,number][]=[
      [ZONES.great,0x7adfff,.22],
      [ZONES.bullseye,0x9aefff,.16],
      [ZONES.perfect,0xd8f6ff,.11],
    ];
    for(const [radius,color,opacity] of zoneSpecs){
      const mat=new THREE.MeshBasicMaterial({
        color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,
      });
      this.zoneMaterials.push(mat);
      const ring=new THREE.Mesh(new THREE.RingGeometry(radius*.94,radius,48),mat);
      ring.position.z=-.03;ring.name=`zone-${radius}`;this.group.add(ring);
    }

    const halo=new THREE.Mesh(new THREE.RingGeometry(.94,1.36,64),new THREE.ShaderMaterial({
      uniforms:{tint:{value:new THREE.Color(config.energyColor)}},
      vertexShader:'varying vec2 coords;void main(){coords=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform vec3 tint;varying vec2 coords;void main(){float d=abs(length(coords)-1.08);float a=exp(-d*18.0)*.32;gl_FragColor=vec4(tint,a);}',
      transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    }));halo.position.z=-.18;halo.name='energy-halo';this.group.add(halo);

    for(let layer=0;layer<3;layer++) {
      const ring=new THREE.Group();ring.name=`energy-ring-${layer}`;
      const mat=new THREE.MeshBasicMaterial({color:layer===1?config.secondaryEnergyColor:config.energyColor,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false});
      this.energyMaterials.push(mat);
      const geometry=new THREE.TorusGeometry(1.02+layer*.05,.018+layer*.004,6,28,Math.PI*.85);
      for(let arc=0;arc<2;arc++) {
        const mesh=new THREE.Mesh(geometry,mat);mesh.rotation.z=arc*Math.PI+layer*.5;mesh.position.z=.08+layer*.04;ring.add(mesh);
      }
      ring.position.z=-.1-layer*.02;this.energy.push(ring);this.group.add(ring);
    }
    const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
    particleGeometry.setAttribute('color',new THREE.BufferAttribute(this.colors,3));
    particleGeometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),2);
    this.particles=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0xffffff,vertexColors:true,size:.028,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));
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
    this.throatMaterial.emissiveIntensity=.14+flash*.35+(reduceMotion?0:.04*Math.sin(this.time*1.4));
    this.energy.forEach((ring,i)=>{
      ring.rotation.z=reduceMotion?i*.4:this.time*[.25,-.18,.12][i];
      ring.scale.setScalar(reduceMotion?1:1+Math.sin(this.time*1.6+i)*.008+flash*.035*Math.sin(progress*Math.PI*2));
      this.energyMaterials[i].opacity=Math.min(1,.65+flash*.22);
    });
    this.zoneMaterials.forEach((mat,i)=>{
      mat.opacity=(i===0?.2:i===1?.14:.1)+flash*.12;
    });
    for(let i=0;i<40;i++) {
      const life=reduceMotion?(i+.5)/40:((i/40+this.time*.13)%1);
      const a=i*2.399+ (reduceMotion?0:this.time*.22);
      const burst=reduceMotion?0:flash*.12;
      const r=1.04-life*.18+burst;
      this.positions.set([Math.cos(a)*r,Math.sin(a)*r,.05+life*.55],i*3);
      const fade=Math.sin(life*Math.PI);
      this.colors.set([this.particleTint.r*fade,this.particleTint.g*fade,this.particleTint.b*fade],i*3);
    }
    this.particles.geometry.getAttribute('position').needsUpdate=true;
    this.particles.geometry.getAttribute('color').needsUpdate=true;
    const pm=this.particles.material as THREE.PointsMaterial;
    pm.opacity=reduceMotion?.35:.55+flash*.2;pm.size=.024+(reduceMotion?0:flash*.014);
  }
  dispose():void {
    const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
    this.group.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material){for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(mat);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }
}
