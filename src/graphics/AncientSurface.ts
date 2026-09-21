import * as THREE from 'three';
/** Neutral carved surface map shared by the aperture plates; no text or UI baked in. */
export function ancientSurface():THREE.DataTexture {
  const size=256,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x-size/2,v=y-size/2,r=Math.hypot(u,v),a=Math.atan2(v,u);
    let shade=128+((x*17+y*31+x*y*3)%19)-9;
    const radial=r%27;if(radial<1.5)shade=58;else if(radial<3)shade=176;
    const sector=((a+Math.PI)*24/Math.PI)%1;
    if(r>45&&r<112&&sector<.025)shade=60;
    // Broken angular strokes look engraved, rather than a flat checkerboard.
    const gx=x%24,gy=y%29;
    if(r>50&&((gx>8&&gx<10&&gy>7&&gy<21)||(gy>7&&gy<9&&gx>8&&gx<17)))shade=190;
    const i=(y*size+x)*4;data[i]=shade;data[i+1]=shade;data[i+2]=shade;data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}
