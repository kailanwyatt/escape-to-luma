import {StoryTemplate} from './StoryTemplate';
import type {RuntimeAssetId} from '../graphics/assetRegistry';
import { useState } from 'react';
import {Text} from 'react-native';
import type {ContainmentVariant} from '../design/components/ContainmentScene';

const STORY = [
  {
    eyebrow: 'WHAT IS SPARK?',
    title: 'A LIVING LIGHT',
    body: 'Spark is a living energy entity—curious, resilient and alive. Not a machine. Not a weapon.',
    variant: 'living' as ContainmentVariant,
    tag: 'S-01 · SPECIMEN',
  },
  {
    eyebrow: 'SPECIMEN S-01',
    title: 'FOUND FAR FROM HOME',
    body: 'A deep-space probe captured Spark and brought it to Earth. Researchers sealed it beneath the city.',
    variant: 'found' as ContainmentVariant,
    tag: 'S-01 · CONTAINMENT',
  },
  {
    eyebrow: 'SIGNAL DETECTED',
    title: 'SOMETHING IS CALLING',
    body: 'From inside containment, Spark hears a distant signal. It feels familiar. It sounds like home.',
    variant: 'signal' as ContainmentVariant,
    tag: 'SIGNAL · UNKNOWN',
  },
  {
    eyebrow: 'SYSTEM FAILURE',
    title: 'THE WAY IS OPEN',
    body: 'Containment is failing, but every security system stands between Spark and the surface.',
    variant: 'breach' as ContainmentVariant,
    tag: 'BREACH · ALERT',
  },
  {
    eyebrow: 'YOUR MISSION',
    title: 'GUIDE SPARK HOME',
    body: 'Aim each throw, predict every moving obstacle and help Spark follow the signal across Earth and the stars.',
    variant: 'mission' as ContainmentVariant,
    tag: 'MISSION · ESCAPE',
  },
] as const;

type Props = {
  onComplete: () => void;
  reduceMotion?: boolean;
};

export function FirstRunStoryScreen({onComplete,reduceMotion=false}:Props){
 const [page,setPage]=useState(0);const story=STORY[page];
 const images:RuntimeAssetId[]=['story.01','story.02','story.03','story.04','story.05'];
 return <StoryTemplate id={`welcome.${page}`} image={images[page]} eyebrow={story.eyebrow} title={story.title} body={story.body} instruction={page===4?'Drag to aim, pull farther for power, then release. Watch where obstacles will be when Spark arrives.':undefined} action={page===4?'BEGIN JOURNEY':'NEXT'} onContinue={()=>page===4?onComplete():setPage(page+1)} secondaryLabel="SKIP INTRODUCTION" onSecondary={onComplete} reduceMotion={reduceMotion} progress={<Text style={{color:'#70d7eb',textAlign:'center',marginTop:18,letterSpacing:3}}>{page+1} / {STORY.length}</Text>}/>;
}
