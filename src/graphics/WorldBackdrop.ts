import * as THREE from 'three';
export type BackdropWorld = 'nebula'|'network'|'homeward'|'opening';
let loader:((world:BackdropWorld)=>Promise<THREE.Texture|null>)|null=null;
export function setWorldBackdropLoader(next:typeof loader):void {loader=next;}
/** One distant matte draw; gameplay objects remain in 3D. Scene disposal owns the texture. */
export function createWorldBackdrop(world:BackdropWorld):THREE.Mesh {
  const material=new THREE.MeshBasicMaterial({color:0xb3bdc8,depthWrite:false,depthTest:false,fog:false});
  // Clip-space backdrop fits phones and landscape without letterboxing. It is scenery, never collision.
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','gl_Position = vec4(position.xy, .999, 1.);');
  };
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.name=`${world}-distant-matte`;mesh.frustumCulled=false;mesh.renderOrder=-10000;
  mesh.onBeforeRender=(_renderer,_scene,camera)=>{
    if(!material.map || !(camera instanceof THREE.PerspectiveCamera))return;
    const image=material.map.image as {width:number;height:number};
    const ratio=image.width/image.height,view=camera.aspect;
    material.map.repeat.set(Math.min(1,view/ratio),Math.min(1,ratio/view));
    material.map.offset.set((1-material.map.repeat.x)/2,(1-material.map.repeat.y)/2);
    material.map.updateMatrix();
  };
  mesh.visible=false;let disposed=false;
  material.addEventListener('dispose',()=>{disposed=true;});
  if(loader)void loader(world).then(texture=>{
    if(!texture)return;
    if(disposed){texture.dispose();return;}
    material.map=texture;material.needsUpdate=true;mesh.visible=true;
  }).catch(()=>{/* The scene retains its starfield fallback on load failure. */});
  return mesh;
}
