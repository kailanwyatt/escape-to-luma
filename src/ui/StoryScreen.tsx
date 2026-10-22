import type {StoryMoment} from '../campaign/StoryMoments';
import {StoryTemplate} from './StoryTemplate';
import {storyArtwork} from './storyArtwork';

export function StoryScreen({story,onContinue,onHome,level=1,reduceMotion=false}:{story:StoryMoment;onContinue:()=>void;onHome:()=>void;level?:number;reduceMotion?:boolean}){
 return <StoryTemplate {...story} image={storyArtwork(story, level)} onContinue={onContinue} onSecondary={onHome} reduceMotion={reduceMotion}/>;
}
