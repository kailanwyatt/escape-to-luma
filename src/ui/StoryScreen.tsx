import type {StoryMoment} from '../campaign/StoryMoments';
import {worldForLevel} from '../campaign/worlds';
import type {RuntimeAssetId} from '../graphics/assetRegistry';
import {StoryTemplate} from './StoryTemplate';
const ART:Record<string,RuntimeAssetId>={containment:'world1.crackEscape',city:'home.cityGateway',sky:'home.cityGateway',atmosphere:'story.05',orbit:'story.05',moon:'story.05',asteroid:'story.05',nebula:'world.nebulaBackdrop',network:'world.networkBackdrop',homeward:'world.homewardBackdrop'};
export function StoryScreen({story,onContinue,onHome,level=1,reduceMotion=false}:{story:StoryMoment;onContinue:()=>void;onHome:()=>void;level?:number;reduceMotion?:boolean}){
 const world=story.id.startsWith('departure.')?story.id.split('.')[1]:worldForLevel(level)?.id??'containment';
 const image=story.visual==='reunion'?'world.homewardBackdrop':story.visual==='key'?'world.networkBackdrop':story.visual==='relay'?'world.nebulaBackdrop':story.id=== 'containment.first-escape'?'story.04':ART[world]??'story.03';
 return <StoryTemplate {...story} image={image} onContinue={onContinue} onSecondary={onHome} reduceMotion={reduceMotion}/>;
}
