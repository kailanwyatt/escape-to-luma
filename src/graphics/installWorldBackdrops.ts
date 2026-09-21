import {setWorldBackdropLoader} from './WorldBackdrop';
import {loadModuleTexture} from './loadModuleTexture';
const sources={nebula:require('../../assets/art/worlds/nebula.jpg'),network:require('../../assets/art/worlds/network.jpg'),homeward:require('../../assets/art/worlds/homeward.jpg')};
setWorldBackdropLoader(world=>loadModuleTexture(sources[world]));
