import * as THREE from 'three';
import {createRooftopScene} from './RooftopScene';
import {createWorldBackdrop} from '../graphics/WorldBackdrop';

export function cityLook(level:number){
  if(level<=19)return {backdrop:'city-sunset' as const,background:0x714f59,ambient:0xd8b7b3,key:0xffbd79,fill:0x8da9cb};
  if(level<=23)return {backdrop:'city-construction' as const,background:0x7294aa,ambient:0xc1d3df,key:0xffe3b8,fill:0x91b4cc};
  if(level<=27)return {backdrop:'city-neon-night' as const,background:0x06132a,ambient:0x839fbc,key:0xc7dbff,fill:0x9260c4};
  return {backdrop:'city-rainy' as const,background:0x142539,ambient:0x8ba2b8,key:0xb2cee4,fill:0x9874ba};
}

/** Matte sky/city only; real rooftop, gameplay and camera stay live in Three.js. */
export function createCityWorldArt(level:number):THREE.Group {
  const root=createRooftopScene(false);root.name='world-city';
  const look=cityLook(level),matte=createWorldBackdrop(look.backdrop,`${look.backdrop}-wide`);
  (matte.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
  root.add(matte);root.userData.cityBackdrop=look.backdrop;
  return root;
}
