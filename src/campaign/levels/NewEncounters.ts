import {t} from '../../i18n';
import type {CampaignLevelDefinition} from '../types';
import type {FormationConfig,ObstacleConfig} from '../../config/ObstacleConfig';

export const ENCOUNTER_LESSONS:Record<number,{name:string;body:string;hint:string}>={
 22:{name:t("newencounters.alternating_doors"),body:t("newencounters.rooftop_security_switches_between_two_lanes_one_door_retracts_whi"),hint:t("newencounters.choose_a_lane_then_time_spark_s_arrival_amber_warns_that_the_open")},
 24:{name:t("newencounters.alternating_doors"),body:t("newencounters.the_next_checkpoint_switches_faster_and_the_destination_is_on_the"),hint:t("newencounters.aim_right_watch_the_complete_door_cycle_before_releasing")},
 78:{name:t("newencounters.gravity_slingshot"),body:t("newencounters.a_dense_lunar_fragment_bends_the_route_toward_itself_spark_can_us"),hint:t("newencounters.aim_beside_the_rock_not_into_it_the_cyan_field_attracts_spark_wat")},
 83:{name:t("newencounters.gravity_slingshot"),body:t("newencounters.the_gravity_pocket_is_stronger_on_this_side_of_the_relay"),hint:t("newencounters.allow_for_the_pull_toward_the_right_keep_spark_clear_of_the_solid")},
 92:{name:t("newencounters.asteroid_conveyor"),body:t("newencounters.streams_of_rock_flow_sideways_across_the_next_gate_clear_gaps_tra"),hint:t("newencounters.predict_where_the_gap_will_be_when_spark_arrives_the_solid_rocks_")},
 95:{name:t("newencounters.asteroid_conveyor"),body:t("newencounters.the_current_accelerates_and_the_gate_sits_away_from_the_center"),hint:t("newencounters.aim_left_and_lead_the_moving_gap_a_straight_repeated_throw_will_n")},
 99:{name:t("newencounters.asteroid_conveyor"),body:t("newencounters.two_currents_cross_at_different_depths_and_travel_in_opposite_dir"),hint:t("newencounters.check_both_streams_spark_needs_a_clear_gap_at_each_arrival_time")},
 96:{name:t("newencounters.expanding_debris"),body:t("newencounters.fragments_spread_outward_then_converge_again_around_the_route"),hint:t("newencounters.launch_through_the_center_while_the_rocks_spread_their_return_clo")},
 102:{name:t("newencounters.expanding_debris"),body:t("newencounters.two_debris_clusters_breathe_at_different_rates"),hint:t("newencounters.read_the_near_cluster_then_the_far_one_time_the_whole_flight_rath")},
 108:{name:t("newencounters.phase_columns"),body:t("newencounters.columns_of_condensed_energy_emerge_from_the_nebula_then_fade_back"),hint:t("newencounters.bright_filled_columns_are_solid_dim_outlines_are_passable_amber_w")},
 113:{name:t("newencounters.phase_columns"),body:t("newencounters.a_second_row_of_energy_columns_follows_a_different_rhythm"),hint:t("newencounters.find_a_route_through_both_rows_a_quiet_column_may_be_solid_again_")},
 123:{name:t("newencounters.rotating_maze"),body:t("newencounters.an_ancient_plate_turns_an_off_center_opening_around_its_axis"),hint:t("newencounters.follow_the_amber_aperture_aim_where_the_opening_will_be_when_spar")},
 127:{name:t("newencounters.rotating_maze"),body:t("newencounters.two_ancient_plates_rotate_in_opposite_directions"),hint:t("newencounters.wait_for_a_route_through_both_amber_openings_then_commit_to_the_s")},
 129:{name:t("newencounters.sequential_tunnel"),body:t("newencounters.three_mechanisms_form_one_timed_passage_through_the_network"),hint:t("newencounters.pass_all_three_apertures_in_one_flight_each_opens_in_sequence_pow")},
 142:{name:t("newencounters.sequential_tunnel"),body:t("newencounters.luma_s_approach_repeats_the_sequence_at_a_quicker_rhythm"),hint:t("newencounters.watch_all_three_gates_aim_through_the_entire_passage_and_adjust_p")},
};

/** Deliberate playtest courses; preserve level IDs, rewards, world exits and save progress. */
export function applyNewEncounters(source:CampaignLevelDefinition):CampaignLevelDefinition {
 const lesson=ENCOUNTER_LESSONS[source.levelNumber];if(!lesson)return source;
 const level:CampaignLevelDefinition=JSON.parse(JSON.stringify(source));
 const n=level.levelNumber;
 const formation=(variant:FormationConfig['variant'],z:number,speed:number,phase=0,direction:1|-1=1):FormationConfig=>({type:'formation',variant,z,speed,phase,direction,centerY:3});
 let obstacles:ObstacleConfig[]=[];
 let target={x:0,y:3.1,z:12,radius:.92};
 level.windX=0;level.gravityScale=1;level.gravityWells=[];
 if(n===22||n===24){
  obstacles=[formation('alternatingDoors',6.1,n===22?.3:.39)];
  target.x=n===22?-.95:1.05;
 }else if(n===78||n===83){
  const side=n===78?-1:1;
  level.gravityScale=.72;
  level.gravityWells=[{x:side*1.1,y:2.8,z:6.2,strength:n===78?12:15,radius:4.1}];
  obstacles=[{type:'driftingBlocker',z:6.2,baseX:side*1.1,baseY:2.8,blockerRadius:.57,amplitudeX:0,amplitudeY:0,speed:0}];
  target={x:side*.95,y:3.2,z:12,radius:n===78?1:.86};
 }else if(n===92||n===95||n===99){
  obstacles=[formation('conveyor',5.8,n===92?.85:1.3)];
  if(n===99)obstacles.push(formation('conveyor',8.4,1.05,1,-1));
  target.x=n===95?-1.05:n===99?.75:0;
 }else if(n===96||n===102){
  obstacles=[formation('expandingDebris',6,n===96?1.15:1.4)];
  if(n===102)obstacles.push(formation('expandingDebris',8.6,1.1,1.25));
 }else if(n===108||n===113){
  obstacles=[formation('phaseColumns',5.8,n===108?.32:.4)];
  if(n===113)obstacles.push(formation('phaseColumns',8.4,.35,.4));
  target.x=n===108?.85:-.8;
 }else if(n===123||n===127){
  obstacles=[{...formation('rotatingMaze',5.8,.65),centerY:2.7,openingRadius:1}];
  if(n===127)obstacles.push({...formation('rotatingMaze',8.4,.48,.6,-1),centerY:3.15,openingRadius:1.08});
  target.x=n===123?.6:-.4;
 }else{
  const speed=n===129?2:2.5;
  obstacles=[4.6,7,9.4].map((z,i)=>({type:'iris',sequenceIndex:i,z,centerX:0,centerY:[2.4,2.95,3.25][i],minRadius:.3,maxRadius:n===129?1.35:1.18,speed,phase:-z/9*speed}));
  level.gravityScale=.8;target.y=3.35;
 }
 level.tutorialHint=lesson.hint;
 level.challenge={...level.challenge,template:'COMBINED_HAZARD',obstacles,target,ricochet:undefined,tags:[...(level.challenge.tags??[]),'new-encounter',lesson.name]};
 return level;
}
