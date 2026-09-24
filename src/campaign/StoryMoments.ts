import {t} from '../i18n';
import {getCampaignLevel, getPlayableCampaignLevels} from './levels';
import {ENCOUNTER_LESSONS} from './levels/NewEncounters';
import {LIBRARY_LESSONS} from './levels/LibraryEncounters';
import {WORLDS} from './worlds';
import type {WorldId} from './types';

export type StoryMoment = {visual?: 'signal' | 'relay' | 'key' | 'reunion';acknowledgements?: string[]; id: string; eyebrow: string; title: string; body: string; instruction?: string; action: string};
export const FIRST_ESCAPE: StoryMoment = {
  id: 'containment.first-escape', eyebrow: t("storymoments.congratulations"), title: t("storymoments.spark_is_finally_free"),
  body: t("storymoments.the_glass_falls_away_for_the_first_time_since_his_capture_spark_i"),
  instruction: t("storymoments.help_spark_find_his_way_out_of_the_lab_pull_farther_to_add_power_"), action: t("storymoments.enter_the_lab"),
};
const SCENES: Record<number, Omit<StoryMoment,'id'>> = {
  3: {eyebrow:t("storymoments.the_laboratory"),title:t("storymoments.the_lab_is_waking_up"),body:t("storymoments.the_breach_has_triggered_the_security_system_ahead_a_moving_gate_"),instruction:t("storymoments.watch_the_opening_move_release_when_your_path_will_be_clear"),action:t("storymoments.face_the_gate")},
  4: {eyebrow:t("storymoments.service_corridor"),title:t("storymoments.something_is_turning"),body:t("storymoments.spark_slips_into_a_service_passage_a_rotating_security_arm_sweeps"),instruction:t("storymoments.wait_for_the_arm_to_pass_then_throw_through_the_open_space"),action:t("storymoments.continue")},
  8: {eyebrow:t("storymoments.security_checkpoint"),title:t("storymoments.a_wall_of_light"),body:t("storymoments.the_facility_is_tracking_spark_security_beams_sweep_across_the_ch"),instruction:t("storymoments.watch_the_beams_and_their_timing_aim_through_a_clear_gap"),action:t("storymoments.continue")},
  12:{eyebrow:t("storymoments.lockdown"),title:t("storymoments.the_way_out_is_closing"),body:t("storymoments.bulkheads_lock_behind_spark_ahead_the_security_systems_work_toget"),instruction:t("storymoments.read_the_nearest_obstacle_first_then_check_the_path_beyond_it"),action:t("storymoments.continue")},
  15:{eyebrow:t("storymoments.the_escape_chamber"),title:t("storymoments.beyond_these_walls"),body:t("storymoments.a_way_out_lies_just_ahead_beyond_the_final_security_system_the_ci"),instruction:t("storymoments.take_your_time_find_a_safe_path_through_both_obstacles"),action:t("storymoments.make_the_escape")},
};
const WORLD_COPY: Record<WorldId,string> = {
  containment:t("storymoments.spark_has_escaped_his_vessel_now_he_must_find_a_path_through_the_"),
  lockdown:t('story.retrieval.lockdown'),
  city:t("storymoments.spark_has_left_the_laboratory_behind_across_the_rooftops_the_fami"),
  ascent:t('story.retrieval.ascent'),
  storm:t("storymoments.spark_climbs_the_city_s_highest_weather_towers_wind_turbines_and_"),
  upper_atmosphere:t("storymoments.earth_curves_below_an_orbital_transfer_facility_spark_follows_the"),
  orbit:t("storymoments.beyond_the_transfer_facility_abandoned_satellites_circle_earth_lo"),
  orbital_graveyard:t('story.retrieval.graveyard'),
  moon:t("storymoments.spark_reaches_a_deserted_lunar_relay_outpost_antenna_assemblies_t"),
  far_side:'Earth disappears. Quiet precision and null pockets mark the far side.',
  asteroid_belt:t("storymoments.the_lunar_relay_points_beyond_earth_s_neighborhood_spark_travels_"),
  drift:'Sparse deep space makes momentum and timing the only landmarks.',
  nebula:t("storymoments.beyond_the_belt_the_jump_gates_carry_spark_into_luminous_clouds_e"),
  the_null:t('story.retrieval.null'),
  false_home:'A familiar beacon proves to be a relay. Verify destinations before trusting glow.',
  ancient_network:t("storymoments.the_silent_relay_opens_a_route_into_an_ancient_network_its_moving"),
  the_machine:'The network mechanism must be traversed, not fought.',
  the_signal:'True Luma coordinates resolve through synchronized paths.',
  homeward:t("storymoments.the_key_has_revealed_luma_across_the_final_gates_luminous_structu"),
  luma:'Spark reunites with luminous home. The escape is complete.',
  // Legacy authored IDs (remapped by applyWorldBands; keep Record complete).
  sky:t("storymoments.spark_climbs_the_city_s_highest_weather_towers_wind_turbines_and_"),
  atmosphere:t("storymoments.earth_curves_below_an_orbital_transfer_facility_spark_follows_the"),
  asteroid:t("storymoments.the_lunar_relay_points_beyond_earth_s_neighborhood_spark_travels_"),
  network:t("storymoments.the_silent_relay_opens_a_route_into_an_ancient_network_its_moving"),
};
const HINTS: Record<string,string> = {
  rotor:t("storymoments.watch_the_rotating_arms_launch_through_the_space_they_leave_behin"),
  slidingGate:t("storymoments.follow_the_moving_opening_and_time_your_release"),
  laserGrid:t("storymoments.watch_the_beams_and_wait_for_a_clear_path"),
  iris:t("storymoments.the_opening_expands_and_contracts_wait_for_enough_room_to_pass"),
  movingRing:t("storymoments.aim_for_where_the_ring_will_be_when_spark_reaches_it"),
  pendulum:'Let the counterweight pass, then throw through the open arc under the boom.',
  orbiter:t("storymoments.the_amber_eyed_drone_follows_an_orbit_watch_its_loop_then_launch_"),
  driftingBlocker:t("storymoments.rock_fragments_drift_across_the_route_aim_around_their_solid_silh"),
  phaseField:'When the membrane is bright it is solid — wait until it fades to pass.',
  shiftingAperture:t("storymoments.the_amber_opening_moves_and_changes_size_aim_through_its_clear_ce"),
  pistonField:'Floor rams thrust upward — throw through a low tip.',
  clockHands:'The open gap is real — amber means one arm is about to slam across it.',
  elevatorBlocks:'Choose a lane at the crossing height, not where the block is now.',
  pulseRing:'The safe eye drifts — lead it, or time the shockwave as it sweeps the lane.',
  scissorGate:'The hinge sits above the path — throw through the open diamond below.',
  groundCutLasers:'Beams fan open, then cross — slip through while the corridor is clear.',
  speedField:'The marked current multiplies speed — the preview matches flight.',
  splitShutter:'Cyan opens the lane — amber means slam. Throw through the center before they meet.',
  reactiveGate:'Wait for the doors to part; amber means they are about to open.',
  conveyorGate:'Watch the patrol drones. Cross where the gap will be when Spark arrives.',
  billboardFlip:'Face-on is a wall — wait until the board turns edge-on and cyan clears the lane.',
  dockingCollar:'Cyan opens the hatch — amber means the jaws are about to slam.',
  shearLane:'Stay in the quiet band between the streams — they move opposite ways.',
  rotatingGate:'Follow the cyan sector — aim where the opening will be when Spark arrives.',
  energyField:'Lead the cyan circle — aim where the opening will be when Spark arrives.',
  phaseGate:'Wait for the membrane to fade open — bright blue means it is about to solidify.',
  repulsor:'Aim wide of the metal core — the amber rings shove Spark outward.',
  nullTendril:'Throw through the violet gap before the tendrils seal it shut.',
  nullLash:'Violet means the strike is coming — throw through the open lane while it is still coiled.',
  rollingAperture:'Track both size and drift — aim where the opening will be.',
  corkscrewTunnel:'Follow the open sector — aim where the gap will be when Spark arrives.',
  cometCrossing:'Read the loop and throw when the traveler is clear of center.',
  orbitingMoons:'Throw through a gap between beacons — amber means the lasers are about to fire.',
  sequentialTunnel:'Aim only at the currently open aperture.',
  movingSafeZone:'Arrive inside the amber wreck-pocket, not where it was at launch.',
  accretionShredder:'Throw through the quiet center while rock shards spiral past.',
  pulsarBeam:'Throw while the security beam is dark, or stay clear of its band.',
  magnetopause:'The hub is solid — time the open sector in the dish rim.',
  lagrangeNull:'Fly through the quiet pocket — wind and pull cancel inside it.',
  teleportPortal:'Watch where the portal reappears — aim there and time the throw to enter it.',
  entryExitPortal:'Watch the cyan aperture — aim and power so Spark arrives while it is still cyan. Amber and the seal both fail.',
  theNull:'Lead the bright safe hole — aim where it will be when Spark arrives.',
};
/** One card per meaningful entry, authored scenes taking priority over family introductions. */
export function storyForLevel(level: number, seen: readonly string[]): StoryMoment | null {
  if (level === 1) return null;
  if (level === 2) return seen.includes(FIRST_ESCAPE.id) ? null : FIRST_ESCAPE;
  const def = getCampaignLevel(level); if (!def) return null;
  const world = WORLDS.find(item=>item.id===def.worldId)!;
  const isWorld = level===world.firstLevel;
  const worldArrivalId = `arrival.level-${level}`;
  // Chapter entry beats library lessons so Lockdown L9 etc. still introduce the world first.
  if (isWorld && !seen.includes(worldArrivalId)) {
    if (level === 16) {
      return {
        id: worldArrivalId,
        acknowledgements: ['mechanic.rapidShutter.v1'],
        eyebrow: t('storymoments.world', {value1: world.index}),
        title: t('storymoments.the_city'),
        body: WORLD_COPY.city,
        instruction: t('storymoments.rooftop_shutters_retract_then_slam_shut_cyan_open_amber_warning_r'),
        action: t('storymoments.enter_the_city'),
      };
    }
    return {
      id: worldArrivalId,
      eyebrow: t('storymoments.world', {value1: world.index}),
      title: world.name,
      body: WORLD_COPY[world.id],
      instruction: def.tutorialHint,
      action: t('storymoments.continue_journey'),
    };
  }
  const encounter=LIBRARY_LESSONS[level]??ENCOUNTER_LESSONS[level],encounterId=`encounter.${level}.v1`;
  if(encounter)return seen.includes(encounterId)?null:{id:encounterId,eyebrow:encounter.name.toUpperCase(),title:encounter.name,body:encounter.body,instruction:encounter.hint,action:t("storymoments.try_the_challenge")};
  const progressionLessons:Record<number,[string,string]>={53:[t("storymoments.transfer_locks"),t("storymoments.the_transfer_facility_switches_between_two_pressure_lock_lanes")],133:[t("storymoments.the_network_responds"),t("storymoments.an_ancient_aperture_guards_a_row_of_energy_columns_spark_must_pre")],143:[t("storymoments.familiar_rhythms_together"),t("storymoments.a_turning_plate_and_energy_columns_share_the_final_route_toward_l")]};
  const progression=progressionLessons[level],progressionId=`encounter.combination.${level}.v1`;
  if(progression&&!seen.includes(progressionId))return {id:progressionId,eyebrow:t("storymoments.the_route_changes"),title:progression[0],body:progression[1],instruction:def.tutorialHint,action:t("storymoments.continue_journey")};
  const cityLessons:Record<number,[string,string]>={21:[t("storymoments.the_shutters_change_direction"),t("storymoments.top_and_bottom_panels_now_close_the_opening_watch_where_spark_wil")],23:[t("storymoments.a_second_chance_opens"),t("storymoments.the_shutters_open_twice_then_pause_learn_both_windows_before_comm")],26:[t("storymoments.one_opening_beyond_another"),t("storymoments.each_shutter_has_its_own_clock_your_shot_must_clear_both_at_their")],28:[t("storymoments.do_not_trust_the_first_close"),t("storymoments.the_panels_partially_close_and_reopen_before_the_warning_and_full")],29:[t("storymoments.one_side_moves_first"),t("storymoments.the_two_panels_close_slightly_apart_watch_both_edges_of_the_safe_")]};
  const lesson=cityLessons[level],cityLessonId=`city.shutter.${level}.v1`;
  // Library remaps replace city shutter lessons on shared slots — skip duplicate cards.
  if(lesson&&!LIBRARY_LESSONS[level]&&!seen.includes(cityLessonId))return {id:cityLessonId,eyebrow:t("storymoments.city_security"),title:lesson[0],body:lesson[1],instruction:t("storymoments.cyan_open_amber_warning_red_closing_time_spark_s_arrival"),action:t("storymoments.read_the_pattern")};
  if(def.challenge.obstacles.some(o=>o.type==='slidingGate'&&o.movementMode==='rapidShutter')&&!seen.includes('mechanic.rapidShutter.v1'))return {id:'mechanic.rapidShutter.v1',eyebrow:t("storymoments.rooftop_security"),title:t("storymoments.a_moment_to_slip_through"),body:t("storymoments.spark_has_escaped_the_lab_but_the_rooftops_have_their_own_securit"),instruction:t("storymoments.cyan_means_open_amber_warns_of_the_slam_aim_for_the_gap_when_spar"),action:t("storymoments.time_the_shutter")};
  const scene = SCENES[level];
  const types=def.challenge.obstacles.map(o=>o.type??'rotor');
  const pairedId='mechanic.iris-movingRing.v1';
  if (def.worldId === 'upper_atmosphere' && types.includes('iris') && types.includes('movingRing') && !seen.includes(pairedId)) {
    return {id:pairedId,acknowledgements:['mechanic.iris.v2','mechanic.movingRing.v2'],
      eyebrow:t("storymoments.two_barriers_ahead"),title:t("storymoments.one_opening_beyond_another"),
      body:t("storymoments.spark_is_crossing_the_orbital_transfer_facility_a_circular_pressu"),
      instruction:t("storymoments.wait_for_the_openings_to_align_aim_through_the_cyan_circle_then_t"),action:t("storymoments.watch_the_openings")};
  }
  const lessonType=level>=31?types.find(type=>HINTS[type]&&!seen.includes(`mechanic.${type}.v2`)):undefined;
  const ricochet=def.challenge.ricochet;
  const ricochetLesson=ricochet?(ricochet.requiredBounces===2?'double':ricochet.reflectors.some(r=>r.movement)?'moving':'single'):undefined;
  const ricochetId=ricochetLesson?`mechanic.ricochet.${ricochetLesson}.v1`:undefined;
  if(ricochetId&&!seen.includes(ricochetId))return {id:ricochetId,eyebrow:t("storymoments.satellite_ricochet"),title:ricochetLesson==='double'?t("storymoments.two_reflections_one_journey"):ricochetLesson==='moving'?t("storymoments.the_mirror_is_moving"):t("storymoments.light_can_find_another_way"),body:t("storymoments.spark_discovers_a_surface_that_returns_his_light_the_marked_face_"),instruction:ricochetLesson==='double'?t("storymoments.follow_the_complete_guide_through_both_cyan_faces_then_into_the_j"):ricochetLesson==='moving'?t("storymoments.aim_where_the_panel_will_be_at_impact_the_guide_predicts_its_move"):t("storymoments.aim_at_the_cyan_face_the_diamond_marks_the_bounce_follow_the_outg"),action:t("storymoments.try_the_reflection")};
  const lessonId=lessonType?`mechanic.${lessonType}.v2`:undefined;
  if(lessonId&&seen.includes(worldArrivalId))return {id:lessonId,eyebrow:world.name.toUpperCase(),title:lessonType==='iris'?t("storymoments.a_breathing_opening"):t("storymoments.study_the_path_ahead"),body:t("storymoments.spark_encounters_a_new_barrier_on_his_journey_take_a_moment_to_wa"),instruction:HINTS[lessonType!],action:t("storymoments.i_understand")};
  const previousTypes = new Set(getPlayableCampaignLevels().filter(item=>item.levelNumber<level).flatMap(item=>item.challenge.obstacles.map(obstacle=>obstacle.type ?? 'rotor')));
  const newTypes = def.challenge.obstacles.map(obstacle=>obstacle.type ?? 'rotor').filter(type=>!previousTypes.has(type));
  if (!isWorld && !scene && !newTypes.length && !lessonId) return null;
  if (seen.includes(worldArrivalId)&&!lessonId) return null;
  if (scene) return {id:worldArrivalId,...scene};
  const instruction = (lessonType?types.filter(type=>HINTS[type]&&!seen.includes(`mechanic.${type}.v2`)).map(type=>HINTS[type]).join(' '):newTypes.map(type=>HINTS[type]).filter(Boolean).join(' ')) || def.tutorialHint;
  return {id:!isWorld&&lessonId?lessonId:worldArrivalId,acknowledgements:lessonId?types.filter(type=>HINTS[type]).map(type=>`mechanic.${type}.v2`):undefined,eyebrow:isWorld ? t("storymoments.world", {value1: world.index}) : world.name,
    title:isWorld ? world.name : t("storymoments.a_new_challenge_ahead"),
    body:isWorld ? WORLD_COPY[world.id] : t("storymoments.the_path_changes_ahead_spark_pauses_to_study_the_unfamiliar_machi"),
    instruction,action:t("storymoments.continue_journey")};
}

/** World exits are shown only after success. IDs remain independent of reward claims. */
const WORLD_EXITS: Record<WorldId, Omit<StoryMoment,'id'>> = {
 containment:{eyebrow:t("storymoments.lockdown_broken"),title:'Lockdown Ahead',body:t('story.retrieval.containment_exit'),instruction:'Read the next gates carefully.',action:'Enter Lockdown'},
 lockdown:{eyebrow:t("storymoments.lockdown_broken"),title:t("storymoments.open_air"),body:t("storymoments.the_last_bulkhead_falls_silent_behind_spark_above_the_laboratory_"),instruction:t("storymoments.follow_the_signal_across_the_rooftops"),action:t("storymoments.enter_the_city")},
 city:{eyebrow:t("storymoments.skybreak"),title:t("storymoments.above_the_city"),body:t("storymoments.spark_reaches_the_highest_roof_weather_towers_rise_through_the_cl"),instruction:t("storymoments.watch_the_gusts_and_moving_rings_as_you_climb"),action:'Begin the Ascent'},
 ascent:{eyebrow:t("storymoments.the_storm"),title:'Into the Storm',body:t('story.retrieval.ascent_exit'),instruction:'Watch the weather systems ahead.',action:t("storymoments.take_to_the_sky")},
 storm:{eyebrow:t("storymoments.the_storm"),title:t("storymoments.the_clouds_part"),body:t("storymoments.spark_clears_the_storm_earth_curves_below_above_an_orbital_transf"),instruction:t("storymoments.its_pressure_shutters_open_and_close_find_the_timing_that_carries"),action:t("storymoments.approach_the_facility")},
 upper_atmosphere:{eyebrow:t("storymoments.escape_velocity"),title:t("storymoments.earth_falls_away"),body:t("storymoments.the_final_transfer_lock_opens_spark_leaves_the_launch_platforms_b"),instruction:t("storymoments.watch_the_swinging_equipment_before_crossing_the_orbital_graveyar"),action:t("storymoments.enter_orbit")},
 orbit:{eyebrow:t("storymoments.orbital_graveyard"),title:'Orbital Graveyard',body:t('story.retrieval.orbit_exit'),instruction:'Read the dead airlocks and wreck pockets ahead.',action:'Enter the Graveyard'},
 orbital_graveyard:{eyebrow:t("storymoments.orbital_graveyard"),title:t("storymoments.a_light_on_the_moon"),body:t("storymoments.beyond_the_drifting_wreckage_a_lunar_relay_answers_spark_s_pulse_"),instruction:t("storymoments.the_outpost_s_antennas_and_gravity_pockets_will_change_the_route_"),action:t("storymoments.follow_the_lunar_signal")},
 moon:{eyebrow:t("storymoments.far_side"),title:'Far Side',body:t('story.retrieval.moon_exit'),instruction:'Quiet precision waits on the far side.',action:'Cross to the Far Side'},
 far_side:{eyebrow:t("storymoments.far_side"),title:t("storymoments.beyond_earth_s_shadow"),body:t("storymoments.on_the_far_side_the_signal_sharpens_a_dormant_jump_gate_wakes_ben"),instruction:t("storymoments.choose_a_clear_lane_through_the_moving_debris"),action:t("storymoments.cross_the_gate")},
 asteroid_belt:{eyebrow:t("storymoments.collision_course"),title:'The Drift',body:t('story.retrieval.belt_exit'),instruction:'Master long shots with few cues.',action:'Enter the Drift'},
 drift:{eyebrow:t("storymoments.collision_course"),title:t("storymoments.a_familiar_glow"),body:t("storymoments.spark_slips_beyond_the_last_tumbling_fragments_through_the_next_g"),instruction:t("storymoments.the_energy_fields_ahead_become_passable_only_during_their_quiet_p"),action:t("storymoments.enter_the_nebula")},
 nebula:{visual:'relay',eyebrow:t("storymoments.false_home"),title:'The Null',body:t('story.retrieval.nebula_exit'),instruction:'Escape the Null — do not fight it.',action:'Face the Null'},
 the_null:{visual:'signal',eyebrow:t("storymoments.a_familiar_glow"),title:t("storymoments.a_familiar_glow"),body:t('story.retrieval.null_exit'),instruction:'Follow the familiar beacon carefully — verify before you trust the glow.',action:t("storymoments.continue_journey")},
 false_home:{visual:'key',eyebrow:t("storymoments.the_key"),title:'Ancient Network',body:t('story.retrieval.false_exit'),instruction:'Learn the synchronized apertures.',action:'Enter the Network'},
 ancient_network:{visual:'key',eyebrow:t("storymoments.the_key"),title:'The Machine',body:t('story.retrieval.network_exit'),instruction:'Controlled complexity ahead.',action:'Enter the Machine'},
 the_machine:{visual:'key',eyebrow:t("storymoments.the_key"),title:t("storymoments.home_has_a_name"),body:t("storymoments.the_central_mechanism_recognizes_spark_s_pulse_its_rings_align_in"),instruction:t("storymoments.the_destination_is_now_revealed_on_your_journey_map"),action:t("storymoments.set_course_for_luma")},
 the_signal:{eyebrow:'Signal Locked',title:'Homeward',body:'True coordinates resolve across the last distance. No new families wait ahead — only mastery of everything Spark has already learned.',instruction:'No new families — only mastery.',action:'Set course Homeward'},
 homeward:{visual:'signal',eyebrow:t("storymoments.luma"),title:t("storymoments.luma"),body:t('story.retrieval.homeward_exit'),instruction:'Cross the arrival gates. Lights are gathering beyond them.',action:t("storymoments.continue_journey")},
 luma:{visual:'reunion',eyebrow:t("storymoments.luma"),title:t("storymoments.you_were_never_the_only_light"),body:t("storymoments.spark_crosses_the_final_gate_lights_rise_from_the_luminous_fields"),instruction:t("storymoments.your_escape_is_complete_endless_voyage_lets_spark_explore_the_ope"),action:t("storymoments.home_at_last")},
 sky:{eyebrow:t("storymoments.the_storm"),title:t("storymoments.the_clouds_part"),body:t("storymoments.spark_clears_the_storm_earth_curves_below_above_an_orbital_transf"),instruction:t("storymoments.its_pressure_shutters_open_and_close_find_the_timing_that_carries"),action:t("storymoments.approach_the_facility")},
 atmosphere:{eyebrow:t("storymoments.escape_velocity"),title:t("storymoments.earth_falls_away"),body:t("storymoments.the_final_transfer_lock_opens_spark_leaves_the_launch_platforms_b"),instruction:t("storymoments.watch_the_swinging_equipment_before_crossing_the_orbital_graveyar"),action:t("storymoments.enter_orbit")},
 asteroid:{eyebrow:t("storymoments.collision_course"),title:t("storymoments.a_familiar_glow"),body:t("storymoments.spark_slips_beyond_the_last_tumbling_fragments_through_the_next_g"),instruction:t("storymoments.the_energy_fields_ahead_become_passable_only_during_their_quiet_p"),action:t("storymoments.enter_the_nebula")},
 network:{visual:'key',eyebrow:t("storymoments.the_key"),title:t("storymoments.home_has_a_name"),body:t("storymoments.the_central_mechanism_recognizes_spark_s_pulse_its_rings_align_in"),instruction:t("storymoments.the_destination_is_now_revealed_on_your_journey_map"),action:t("storymoments.set_course_for_luma")},
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
