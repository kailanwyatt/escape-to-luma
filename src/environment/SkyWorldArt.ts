import * as THREE from 'three';
import {createWorldBackdrop} from '../graphics/WorldBackdrop';
import {createSkyClouds} from './SkyMoonArt';

/**
 * Ascent uses sunlit → golden. Storm chapter alone owns the storm plate.
 * Early ascent keeps a dark tint so beam hazards stay readable on the sunlit art.
 */
export function skyLook(storm:boolean,level:number){
  if(storm){
    return {
      portrait:'sky-storm' as const,
      wide:'sky-storm-wide' as const,
      key:0xc3d4e7,
      ambient:0x9db6c9,
      tint:0xd0dae6,
      background:0x3f647c,
    };
  }
  if(level>=35){
    return {
      portrait:'sky-golden' as const,
      wide:'sky-golden-wide' as const,
      key:0xffcf93,
      ambient:0xc7b6cb,
      tint:0xe6eaf0,
      background:0x527e9c,
    };
  }
  // Early ascent (incl. L32 ground cutters): sunlit plate, night-read tint for lasers.
  return {
    portrait:'sky-sunlit' as const,
    wide:'sky-sunlit-wide' as const,
    key:0x8fa8d4,
    ambient:0x3d4f6e,
    tint:0x3a4a68,
    background:0x071018,
  };
}

export function createSkyWorldArt(storm:boolean,level:number):THREE.Group{
  const root=new THREE.Group(),look=skyLook(storm,level);
  const night=look.background < 0x204060;
  const matte=createWorldBackdrop(look.portrait,look.wide);
  (matte.material as THREE.MeshBasicMaterial).color.setHex(look.tint);root.add(matte);
  const clouds=createSkyClouds(storm || night);
  clouds.traverse(o=>{
    if(o instanceof THREE.Mesh){
      (o.material as THREE.MeshBasicMaterial).opacity=storm?0.18:night?0.08:0.13;
      if(night)(o.material as THREE.MeshBasicMaterial).color.setHex(0x6a7a96);
    }
  });
  root.add(clouds);
  const time={value:0};
  const mistColor=night?'.18,.24,.38':'.72,.82,.9';
  const mistAlpha=night?'.11':'.075';
  const mistMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{time},
    vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 v;uniform float time;
      void main(){
        float edge=smoothstep(0.,.25,v.x)*(1.-smoothstep(.65,1.,v.x))*sin(v.y*3.14159);
        float flow=.5+.5*sin(v.y*16.+v.x*7.+time*.22+sin(v.x*13.-time*.09));
        gl_FragColor=vec4(${mistColor},edge*flow*${mistAlpha});
      }`,
  });
  const geometry=new THREE.PlaneGeometry(9,15);
  for(const side of [-1,1]){
    const mist=new THREE.Mesh(geometry,mistMaterial);mist.name='sky-edge-mist';
    mist.position.set(side*14,1,35);root.add(mist);
  }
  root.userData.updateAtmosphere=(clock:number,reduced:boolean)=>{time.value=reduced?0:clock;};
  root.userData.skyBackdrop=look.portrait;
  root.userData.skyNight=night;
  return root;
}
