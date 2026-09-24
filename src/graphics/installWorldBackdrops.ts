import {setWorldBackdropLoader} from './WorldBackdrop';
import {loadModuleTexture} from './loadModuleTexture';
const sources={opening:require('../../assets/art/worlds/opening-space.png'),nebula:require('../../assets/art/worlds/nebula.jpg'),network:require('../../assets/art/worlds/network.jpg'),homeward:require('../../assets/art/worlds/homeward.jpg'),
 'city-sunset':require('../../assets/art/worlds/city/sunset.png'),
 'city-construction':require('../../assets/art/worlds/city/construction.png'),
 'city-neon-night':require('../../assets/art/worlds/city/neon-night.png'),
 'city-rainy':require('../../assets/art/worlds/city/rainy-city.png'),
 'city-sunset-wide':require('../../assets/art/worlds/city/sunset-wide.png'),
 'city-construction-wide':require('../../assets/art/worlds/city/construction-wide.png'),
 'city-neon-night-wide':require('../../assets/art/worlds/city/neon-night-wide.png'),
 'city-rainy-wide':require('../../assets/art/worlds/city/rainy-city-wide.png'),
 'sky-sunlit':require('../../assets/art/worlds/sky/sunlit-updraft.png'),
 'sky-golden':require('../../assets/art/worlds/sky/golden-cloudfalls.png'),
 'sky-storm':require('../../assets/art/worlds/sky/stormfront-drift.png'),
 'sky-sunlit-wide':require('../../assets/art/worlds/sky/sunlit-updraft-wide.png'),
 'sky-golden-wide':require('../../assets/art/worlds/sky/golden-cloudfalls-wide.png'),
 'sky-storm-wide':require('../../assets/art/worlds/sky/stormfront-drift-wide.png'),
 'space-orbit':require('../../assets/art/worlds/space/orbit-wide.jpg'),
 'space-moon':require('../../assets/art/worlds/space/moon-wide.jpg'),
 'space-belt':require('../../assets/art/worlds/space/belt-wide.jpg'),
 'space-drift':require('../../assets/art/worlds/space/drift-wide.jpg'),
};
setWorldBackdropLoader(world=>loadModuleTexture(sources[world]));
