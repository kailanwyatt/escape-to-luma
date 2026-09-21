import {getCampaignLevel, getPlayableCampaignLevels} from './levels';
import {ENCOUNTER_LESSONS} from './levels/NewEncounters';
import {WORLDS} from './worlds';
import type {WorldId} from './types';

export type StoryMoment = {visual?: 'signal' | 'relay' | 'key' | 'reunion';acknowledgements?: string[]; id: string; eyebrow: string; title: string; body: string; instruction?: string; action: string};
export const FIRST_ESCAPE: StoryMoment = {
  id: 'containment.first-escape', eyebrow: 'CONGRATULATIONS', title: 'Spark is finally free.',
  body: 'The glass falls away. For the first time since his capture, Spark is beyond the vessel. But the laboratory still stands between him and the signal calling from far away.',
  instruction: 'Help Spark find his way out of the lab. Pull farther to add power, then release to launch.', action: 'ENTER THE LAB',
};
const SCENES: Record<number, Omit<StoryMoment,'id'>> = {
  3: {eyebrow:'THE LABORATORY',title:'The lab is waking up.',body:'The breach has triggered the security system. Ahead, a moving gate begins to seal the corridor.',instruction:'Watch the opening move. Release when your path will be clear.',action:'FACE THE GATE'},
  4: {eyebrow:'SERVICE CORRIDOR',title:'Something is turning.',body:'Spark slips into a service passage. A rotating security arm sweeps across his only way forward.',instruction:'Wait for the arm to pass, then throw through the open space.',action:'CONTINUE'},
  8: {eyebrow:'SECURITY CHECKPOINT',title:'A wall of light.',body:'The facility is tracking Spark. Security beams sweep across the checkpoint, searching for the escaped energy.',instruction:'Watch the beams and their timing. Aim through a clear gap.',action:'CONTINUE'},
  12:{eyebrow:'LOCKDOWN',title:'The way out is closing.',body:'Bulkheads lock behind Spark. Ahead, the security systems work together to block his escape.',instruction:'Read the nearest obstacle first, then check the path beyond it.',action:'CONTINUE'},
  15:{eyebrow:'THE ESCAPE CHAMBER',title:'Beyond these walls.',body:'A way out lies just ahead. Beyond the final security system, the city waits under an open sky.',instruction:'Take your time. Find a safe path through both obstacles.',action:'MAKE THE ESCAPE'},
};
const WORLD_COPY: Record<WorldId,string> = {
  containment:'Spark has escaped his vessel. Now he must find a path through the facility.',
  city:'Spark has left the laboratory behind. Across the rooftops, the familiar signal calls him toward the sky.',
  sky:'Spark climbs the city’s highest weather towers. Wind turbines and stabilizing rings mark a route through the clouds; their motion offers openings between gusts.',
  atmosphere:'Earth curves below an orbital transfer facility. Spark follows the signal along its service platforms. Pressure shutters and sliding doors regulate the launch route; satellite reflectors offer another way through.',
  orbit:'Beyond the transfer facility, abandoned satellites circle Earth. Loose booms swing across the service route. Spark follows the signal from one surviving Jump Gate to the next, toward the Moon.',
  moon:'Spark reaches a deserted lunar relay outpost. Antenna assemblies turn above the silent surface, and pockets of gravity bend his path. The signal is strongest beyond the far side.',
  asteroid:'The lunar relay points beyond Earth’s neighborhood. Spark travels through linked Jump Gates into a belt of fractured rock and abandoned machinery. Moving debris makes every clear lane temporary.',
  nebula:'Beyond the belt, the Jump Gates carry Spark into luminous clouds. Energy fields pulse with a familiar rhythm. The signal seems to surround him. Could this be home?',
  network:'The silent relay opens a route into an ancient network. Its moving apertures respond to the same pulse Spark carries within him. He must reach the central mechanism to understand where the signal began.',
  homeward:'The Key has revealed Luma. Across the final gates, luminous structures echo Spark’s own energy. Familiar challenges guard the route, but now he knows where he belongs.',
};
const HINTS: Record<string,string> = {
  rotor:'Watch the rotating arms. Launch through the space they leave behind.',
  slidingGate:'Follow the moving opening and time your release.',
  laserGrid:'Watch the beams and wait for a clear path.',
  iris:'The opening expands and contracts. Wait for enough room to pass.',
  movingRing:'Aim for where the ring will be when Spark reaches it.',
  pendulum:'The suspended counterweight swings across the route. Let the weight and arm pass before you launch.',
  orbiter:'The amber-eyed drone follows an orbit. Watch its loop, then launch past it.',
  driftingBlocker:'Rock fragments drift across the route. Aim around their solid silhouettes.',
  phaseField:'A red field with an X is active. When the surface and X disappear, the field is open.',
  shiftingAperture:'The amber opening moves and changes size. Aim through its clear center; the shutter sectors are solid.',
};
/** One card per meaningful entry, authored scenes taking priority over family introductions. */
export function storyForLevel(level: number, seen: readonly string[]): StoryMoment | null {
  if (level === 1) return null;
  if (level === 2) return seen.includes(FIRST_ESCAPE.id) ? null : FIRST_ESCAPE;
  const def = getCampaignLevel(level); if (!def) return null;
  const encounter=ENCOUNTER_LESSONS[level],encounterId=`encounter.${level}.v1`;
  if(encounter)return seen.includes(encounterId)?null:{id:encounterId,eyebrow:encounter.name.toUpperCase(),title:encounter.name,body:encounter.body,instruction:encounter.hint,action:'TRY THE CHALLENGE'};
  if(level===16)return seen.includes('arrival.level-16')?null:{id:'arrival.level-16',acknowledgements:['mechanic.rapidShutter.v1'],eyebrow:'WORLD 2',title:'The City',body:WORLD_COPY.city,instruction:'Rooftop shutters retract, then slam shut. Cyan: open. Amber: warning. Red: slam. Time Spark’s arrival.',action:'ENTER THE CITY'};
  const cityLessons:Record<number,[string,string]>={21:['The shutters change direction.','Top and bottom panels now close the opening. Watch where Spark will arrive.'],23:['A second chance opens.','The shutters open twice, then pause. Learn both windows before committing.'],26:['One opening beyond another.','Each shutter has its own clock. Your shot must clear both at their arrival times.'],28:['Do not trust the first close.','The panels partially close and reopen before the warning and full slam. Read the complete pattern.'],29:['One side moves first.','The two panels close slightly apart. Watch both edges of the safe opening.']};
  const lesson=cityLessons[level],cityLessonId=`city.shutter.${level}.v1`;
  if(lesson&&!seen.includes(cityLessonId))return {id:cityLessonId,eyebrow:'CITY SECURITY',title:lesson[0],body:lesson[1],instruction:'Cyan: open. Amber: warning. Red: closing. Time Spark’s arrival.',action:'READ THE PATTERN'};
  if(def.challenge.obstacles.some(o=>o.type==='slidingGate'&&o.movementMode==='rapidShutter')&&!seen.includes('mechanic.rapidShutter.v1'))return {id:'mechanic.rapidShutter.v1',eyebrow:'ROOFTOP SECURITY',title:'A moment to slip through.',body:'Spark has escaped the lab, but the rooftops have their own security. The city shutters retract, pause, then slam shut. Spark must commit before the opening disappears.',instruction:'Cyan means open. Amber warns of the slam. Aim for the gap when Spark arrives, not when you release.',action:'TIME THE SHUTTER'};
  const world = WORLDS.find(item=>item.id===def.worldId)!;
  const isWorld = level===world.firstLevel;
  const scene = SCENES[level];
  const types=def.challenge.obstacles.map(o=>o.type??'rotor');
  const pairedId='mechanic.iris-slidingGate.v1';
  if (def.worldId === 'atmosphere' && types.includes('iris') && types.includes('slidingGate') && !seen.includes(pairedId)) {
    return {id:pairedId,acknowledgements:['mechanic.iris.v2','mechanic.slidingGate.v2'],
      eyebrow:'TWO BARRIERS AHEAD',title:'One opening beyond another.',
      body:'Spark is crossing the orbital transfer facility. A circular pressure shutter guards the approach; behind it, an amber-edged door slides across the route to the blue portal.',
      instruction:'Wait for the openings to align. Aim through the cyan circle, then the amber rectangle, into the blue portal.',action:'WATCH THE OPENINGS'};
  }
  const lessonType=level>=31?types.find(type=>HINTS[type]&&!seen.includes(`mechanic.${type}.v2`)):undefined;
  const ricochet=def.challenge.ricochet;
  const ricochetLesson=ricochet?(ricochet.requiredBounces===2?'double':ricochet.reflectors.some(r=>r.movement)?'moving':'single'):undefined;
  const ricochetId=ricochetLesson?`mechanic.ricochet.${ricochetLesson}.v1`:undefined;
  if(ricochetId&&!seen.includes(ricochetId))return {id:ricochetId,eyebrow:'SATELLITE RICOCHET',title:ricochetLesson==='double'?'Two reflections. One journey.':ricochetLesson==='moving'?'The mirror is moving.':'Light can find another way.',body:'Spark discovers a surface that returns his light. The marked face can redirect him toward the signal.',instruction:ricochetLesson==='double'?'Follow the complete guide through both cyan faces, then into the Jump Gate.':ricochetLesson==='moving'?'Aim where the panel will be at impact. The guide predicts its movement.':'Aim at the cyan face. The diamond marks the bounce; follow the outgoing path to the gate. The dark back and frame are solid.',action:'TRY THE REFLECTION'};
  const lessonId=lessonType?`mechanic.${lessonType}.v2`:undefined;
  if(lessonId&&seen.includes(`arrival.level-${level}`))return {id:lessonId,eyebrow:world.name.toUpperCase(),title:lessonType==='iris'?'A breathing opening.':'Study the path ahead.',body:'Spark encounters a new barrier on his journey. Take a moment to watch how it moves.',instruction:HINTS[lessonType!],action:'I UNDERSTAND'};
  const previousTypes = new Set(getPlayableCampaignLevels().filter(item=>item.levelNumber<level).flatMap(item=>item.challenge.obstacles.map(obstacle=>obstacle.type ?? 'rotor')));
  const newTypes = def.challenge.obstacles.map(obstacle=>obstacle.type ?? 'rotor').filter(type=>!previousTypes.has(type));
  if (!isWorld && !scene && !newTypes.length && !lessonId) return null;
  const id = `arrival.level-${level}`;
  if (seen.includes(id)&&!lessonId) return null;
  if (scene) return {id,...scene};
  const instruction = (lessonType?types.filter(type=>HINTS[type]&&!seen.includes(`mechanic.${type}.v2`)).map(type=>HINTS[type]).join(' '):newTypes.map(type=>HINTS[type]).filter(Boolean).join(' ')) || def.tutorialHint;
  return {id:!isWorld&&lessonId?lessonId:id,acknowledgements:lessonId?types.filter(type=>HINTS[type]).map(type=>`mechanic.${type}.v2`):undefined,eyebrow:isWorld ? `WORLD ${world.index}` : world.name,
    title:isWorld ? world.name : 'A new challenge ahead.',
    body:isWorld ? WORLD_COPY[world.id] : 'The path changes ahead. Spark pauses to study the unfamiliar machinery before moving closer.',
    instruction,action:'CONTINUE JOURNEY'};
}

/** World exits are shown only after success. IDs remain independent of reward claims. */
const WORLD_EXITS: Record<WorldId, Omit<StoryMoment,'id'>> = {
 containment:{eyebrow:'LOCKDOWN BROKEN',title:'Open air.',body:'The last bulkhead falls silent behind Spark. Above the laboratory, the city glows. The familiar signal is still far away, but for the first time there is sky overhead.',instruction:'Follow the signal across the rooftops.',action:'ENTER THE CITY'},
 city:{eyebrow:'SKYBREAK',title:'Above the city.',body:'Spark reaches the highest roof. Weather towers rise through the cloud cover, their lights tracing a path upward. The city’s machinery gives way to the force of the wind.',instruction:'Watch the gusts and moving rings as you climb.',action:'TAKE TO THE SKY'},
 sky:{eyebrow:'THE STORM',title:'The clouds part.',body:'Spark clears the storm. Earth curves below; above, an orbital transfer facility connects the last atmospheric platforms to the satellite lanes.',instruction:'Its pressure shutters open and close. Find the timing that carries Spark through.',action:'APPROACH THE FACILITY'},
 atmosphere:{eyebrow:'ESCAPE VELOCITY',title:'Earth falls away.',body:'The final transfer lock opens. Spark leaves the launch platforms behind and enters a silent field of satellites. Between broken machines, the next gate points toward the Moon.',instruction:'Watch the swinging equipment before crossing the orbital graveyard.',action:'ENTER ORBIT'},
 orbit:{eyebrow:'ORBITAL GRAVEYARD',title:'A light on the Moon.',body:'Beyond the drifting wreckage, a lunar relay answers Spark’s pulse. It is not the source, but it offers a path onward. Spark turns toward the quiet surface.',instruction:'The outpost’s antennas and gravity pockets will change the route of each throw.',action:'FOLLOW THE LUNAR SIGNAL'},
 moon:{eyebrow:'FAR SIDE',title:'Beyond Earth’s shadow.',body:'On the far side, the signal sharpens. A dormant Jump Gate wakes beneath Spark’s light, connecting the lunar outpost to a distant trail of shattered rock.',instruction:'Choose a clear lane through the moving debris.',action:'CROSS THE GATE'},
 asteroid:{eyebrow:'COLLISION COURSE',title:'A familiar glow.',body:'Spark slips beyond the last tumbling fragments. Through the next gate, vast clouds pulse with the rhythm he remembers. The signal is stronger than ever.',instruction:'The energy fields ahead become passable only during their quiet phase.',action:'ENTER THE NEBULA'},
 nebula:{visual:'relay',eyebrow:'FALSE HOME',title:'An echo, not an answer.',body:'Spark reaches the heart of the glow—and the signal falls silent. No other lights approach. This place has been repeating a message from somewhere else. As Spark answers it, the relay reveals a path into an ancient network.',instruction:'Follow the newly opened route. The source is still beyond it.',action:'FOLLOW THE RELAY'},
 network:{visual:'key',eyebrow:'THE KEY',title:'Home has a name.',body:'The central mechanism recognizes Spark’s pulse. Its rings align into a map, tracing the signal back to a luminous world: Luma. For the first time, Spark sees the way home.',instruction:'The destination is now revealed on your journey map.',action:'SET COURSE FOR LUMA'},
 homeward:{visual:'reunion',eyebrow:'LUMA',title:'You were never the only light.',body:'Spark crosses the final gate. Lights rise from the luminous fields to meet him, each answering with the pulse he has carried all this way. The distant signal becomes a chorus. Spark is home.',instruction:'Your escape is complete. Endless Voyage lets Spark explore the open network freely, with home always waiting.',action:'HOME AT LAST'},
};
export function storyAfterWorld(level:number,seen:readonly string[]):StoryMoment|null {
 const world=WORLDS.find(w=>w.lastLevel===level);if(!world)return null;
 const id=`departure.${world.id}.v1`;
 return seen.includes(id)?null:{id,...WORLD_EXITS[world.id]};
}
/** Recover only the immediately preceding completed milestone, never unseen future events. */
export function pendingWorldStory(level:number,seen:readonly string[],completed:Record<string,{cleared:boolean}>):StoryMoment|null {
 const world=WORLDS.find(w=>w.firstLevel===level);
 const previous=world&&world.index>1?getCampaignLevel(level-1):null;
 if(previous&&completed[previous.id]?.cleared)return storyAfterWorld(level-1,seen);
 if(level===150){const last=getCampaignLevel(150)!;if(completed[last.id]?.cleared)return storyAfterWorld(150,seen);}
 return null;
}
