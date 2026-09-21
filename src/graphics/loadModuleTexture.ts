import {Platform} from 'react-native';
import { Asset } from 'expo-asset';
import * as THREE from 'three';

/** Load a Metro-bundled image into a Three.js texture via expo-asset. */
export async function loadModuleTexture(moduleId: number): Promise<THREE.Texture | null> {
  try {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) {
      return null;
    }
    if(Platform.OS !== 'web') {
      // Expo GL decodes {localUri} pixel sources natively for tex(Sub)Image2D.
      // Avoid the DOM ImageLoader, which does not exist in React Native.
      if(!asset.localUri || !asset.width || !asset.height)return null;
      const texture=new THREE.DataTexture();
      texture.image={data:asset as unknown as Uint8Array,width:asset.width,height:asset.height};
      texture.flipY=true;texture.colorSpace=THREE.SRGBColorSpace;
      texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
      texture.generateMipmaps=false;texture.needsUpdate=true;return texture;
    }
    return await new Promise<THREE.Texture>((resolve, reject) => {
      new THREE.TextureLoader().load(
        uri,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 4;
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        reject,
      );
    });
  } catch {
    return null;
  }
}
