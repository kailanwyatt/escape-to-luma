import * as THREE from 'three';

export type SpaceFinish='current'|'radiation'|'magnetic'|'void'|'relay'|'ice'|'organic'|'solar'|'pulse'|'calm';
/** Color/roughness detail only. Never displaces vertices or changes safe apertures. */
export function spaceFinish(material:THREE.MeshBasicMaterial|THREE.MeshStandardMaterial,kind:SpaceFinish,time:{value:number}){
 material.customProgramCacheKey=()=>`space-finish-v2-${kind}`;
 material.onBeforeCompile=shader=>{
  shader.uniforms.spaceTime=time;
  shader.vertexShader='varying vec3 spaceP; varying vec2 spaceUV;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nspaceP=position;spaceUV=uv;');
  shader.fragmentShader=`varying vec3 spaceP;varying vec2 spaceUV;uniform float spaceTime;
   float sh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float sn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(sh(i),sh(i+vec3(1,0,0)),f.x),mix(sh(i+vec3(0,1,0)),sh(i+vec3(1,1,0)),f.x),f.y),
     mix(mix(sh(i+vec3(0,0,1)),sh(i+vec3(1,0,1)),f.x),mix(sh(i+vec3(0,1,1)),sh(i+vec3(1,1,1)),f.x),f.y),f.z);}
  `+shader.fragmentShader;
  const effects:Record<SpaceFinish,string>={
   current:'float streak=pow(.5+.5*sin(spaceUV.x*110.+sn(spaceP*5.)*3.),14.);float flow=.5+.5*sin(spaceUV.y*40.-spaceTime*3.2);diffuseColor.rgb*=.62+streak*.78+flow*.32;',
   radiation:'float wave=.5+.5*sin(spaceP.y*22.+spaceP.x*14.-spaceTime*4.2);diffuseColor.rgb*=.78+wave*.32;',
   magnetic:'float line=pow(.5+.5*sin(length(spaceP.xy)*54.+atan(spaceP.y,spaceP.x)*3.-spaceTime),12.);diffuseColor.rgb*=.5+line*1.05;',
   void:'float cloud=sn(spaceP*4.2+vec3(spaceTime*.1,0.,0.));diffuseColor.rgb=mix(diffuseColor.rgb*.4,vec3(.032,.015,.05),cloud*.72);',
   relay:'vec2 cell=abs(fract(spaceP.xy*3.2)-.5);float seam=smoothstep(.45,.49,max(cell.x,cell.y));float etch=pow(.5+.5*sin(atan(spaceP.y,spaceP.x)*36.),26.);diffuseColor.rgb*=.6+sn(spaceP*24.)*.28;diffuseColor.rgb+=vec3(.05,.1,.12)*(seam+etch*.35);',
   ice:'float crack=pow(1.-abs(sn(spaceP*13.)*2.-1.),20.);diffuseColor.rgb*=.55+sn(spaceP*8.)*.55;diffuseColor.rgb+=vec3(.14,.24,.28)*crack;',
   organic:'float vein=pow(1.-abs(sn(spaceP*8.5)*2.-1.),16.);diffuseColor.rgb*=.5+sn(spaceP*22.)*.48;diffuseColor.rgb+=vec3(.07,.2,.15)*vein;',
   solar:'vec2 cell=abs(fract(spaceUV*vec2(20.,6.))-.5);float grid=smoothstep(.43,.49,max(cell.x,cell.y));diffuseColor.rgb*=.64+sn(vec3(floor(spaceUV*vec2(20.,6.)),1.))*.36;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.17,.21,.26),grid*.7);',
   pulse:'float arc=.5+.5*sin(atan(spaceP.y,spaceP.x)*24.-spaceTime*3.2+sn(spaceP*7.)*2.);diffuseColor.rgb*=.7+arc*.5;',
   calm:'float rim=pow(abs(spaceUV.y-.5)*2.,4.5);diffuseColor.rgb*=.45+rim*.5;',
  };
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+effects[kind]);
 };
}

/** Four contour rows: front/back and inner/outer. Shared indices remain fixed. */
export function ringVolume(segments:number){
 const g=new THREE.BufferGeometry(),n=segments+1;
 g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*4*3),3));
 const uv=new Float32Array(n*4*2);for(let row=0;row<4;row++)for(let j=0;j<n;j++){uv[(row*n+j)*2]=j/segments;uv[(row*n+j)*2+1]=row%2;}
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 const indices:number[]=[];const quad=(a:number,b:number,c:number,d:number)=>indices.push(a,b,c,a,c,d);
 for(let j=0;j<segments;j++){
  quad(j,j+1,n+j+1,n+j);quad(2*n+j,3*n+j,3*n+j+1,2*n+j+1);
  quad(j,2*n+j,2*n+j+1,j+1);quad(n+j,n+j+1,3*n+j+1,3*n+j);
 }
 quad(0,n,3*n,2*n);quad(segments,2*n+segments,3*n+segments,n+segments);
 g.setIndex(indices);return g;
}
