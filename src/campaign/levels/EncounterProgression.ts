import {t} from '../../i18n';
import type {CampaignLevelDefinition} from '../types';
import {applyNewEncounters} from './NewEncounters';

/** Authored variations retain existing IDs/rewards. Finals and bank-shot courses stay intact. */
const COURSES:Record<number,{base:number;pace:number;side:number;targetX:number;hint:string;combine?:boolean}>={
 27:{base:24,pace:1.08,side:-1,targetX:-1.1,hint:t("encounterprogression.left_lane_read_the_quicker_door_change")},
 53:{base:22,pace:1.18,side:1,targetX:1.05,hint:t("encounterprogression.transfer_lock_aim_right_and_time_the_open_lane")},
 56:{base:24,pace:1.15,side:-1,targetX:-1.15,hint:t("encounterprogression.left_transfer_lock_watch_the_amber_warning")},
 81:{base:78,pace:1.08,side:-1,targetX:1.05,hint:t("encounterprogression.aim_beside_the_rock_allow_for_the_rightward_pull")},
 89:{base:83,pace:1.08,side:-1,targetX:-1.15,hint:t("encounterprogression.strong_leftward_pull_curve_around_the_solid_core")},
 94:{base:92,pace:1.12,side:-1,targetX:.85,hint:t("encounterprogression.reversed_current_lead_the_gap_to_the_right")},
 98:{base:96,pace:1.1,side:-1,targetX:.55,hint:t("encounterprogression.aim_right_of_center_as_the_cluster_expands")},
 101:{base:99,pace:.98,side:1,targetX:-.55,hint:t("encounterprogression.cross_the_stream_then_the_expanding_cluster"),combine:true},
 104:{base:99,pace:1.12,side:-1,targetX:-.9,hint:t("encounterprogression.two_opposing_currents_check_both_arrival_times")},
 109:{base:108,pace:1.08,side:-1,targetX:-.95,hint:t("encounterprogression.follow_the_quiet_column_on_the_left")},
 112:{base:108,pace:1.17,side:1,targetX:1.05,hint:t("encounterprogression.quicker_phase_changes_aim_for_the_right_hand_route")},
 116:{base:113,pace:1.08,side:-1,targetX:.9,hint:t("encounterprogression.two_rows_wait_for_the_far_columns_too")},
 118:{base:113,pace:1.16,side:1,targetX:-1.05,hint:t("encounterprogression.predict_both_rows_amber_means_the_field_is_returning")},
 124:{base:123,pace:1.12,side:-1,targetX:-.7,hint:t("encounterprogression.reversed_rotation_lead_the_amber_opening")},
 128:{base:127,pace:1.08,side:-1,targetX:.65,hint:t("encounterprogression.opposing_plates_find_the_complete_route")},
 131:{base:129,pace:1.07,side:1,targetX:.25,hint:t("encounterprogression.three_gates_match_power_to_the_opening_sequence")},
 133:{base:127,pace:1.05,side:1,targetX:-.6,hint:t("encounterprogression.pass_the_ancient_plate_then_the_quiet_energy_column"),combine:true},
 134:{base:142,pace:.98,side:1,targetX:-.25,hint:t("encounterprogression.three_narrower_openings_time_the_whole_flight")},
 137:{base:113,pace:1.18,side:-1,targetX:1.05,hint:t("encounterprogression.familiar_energy_cross_both_quiet_rows")},
 139:{base:127,pace:1.18,side:1,targetX:-.65,hint:t("encounterprogression.two_turning_apertures_commit_when_the_route_aligns")},
 143:{base:127,pace:1.12,side:-1,targetX:.6,hint:t("encounterprogression.rotating_plate_and_phase_columns_read_both_rhythms"),combine:true},
 146:{base:142,pace:1.06,side:1,targetX:.3,hint:t("encounterprogression.three_gates_adjust_power_for_the_quicker_sequence")},
 148:{base:142,pace:1.12,side:1,targetX:-.3,hint:t("encounterprogression.final_tunnel_practice_keep_all_three_openings_in_view")},
};
export function applyEncounterProgression(source:CampaignLevelDefinition):CampaignLevelDefinition {
 const recipe=COURSES[source.levelNumber];
 if(!recipe||source.isWorldFinale||source.challenge.ricochet)return source;
 const course=applyNewEncounters({...source,levelNumber:recipe.base});
 course.levelNumber=source.levelNumber;
 course.tutorialHint=recipe.hint;
 course.challenge.target.x=recipe.targetX;
 course.challenge.target.radius=Math.max(.8,course.challenge.target.radius-.025);
 for(const [i,o] of course.challenge.obstacles.entries()){
  if(o.type==='formation'){
   o.speed*=recipe.pace;o.direction=((o.direction??1)*recipe.side) as 1|-1;
   o.phase=(o.phase??0)+.19*(source.levelNumber%4)+i*.11;
   if(recipe.combine&&i===1){o.variant=source.worldId==='asteroid'||source.worldId==='asteroid_belt'||source.worldId==='drift'?'expandingDebris':'phaseColumns';o.speed=o.variant==='phaseColumns'?.39:1.25;o.centerY=3.15;}
  }else if(o.type==='iris'){
   o.speed*=recipe.pace;o.phase=(o.phase??0)*recipe.pace;
   o.centerX=recipe.targetX*(o.z/12);
  }else if(o.type==='driftingBlocker')o.baseX*=recipe.side;
 }
 for(const well of course.gravityWells??[]){well.x*=recipe.side;well.strength*=recipe.pace;}
 course.challenge.tags=['encounter-progression',...(course.challenge.tags??[])];
 return course;
}
export const ENCOUNTER_PROGRESSION_LEVELS=Object.keys(COURSES).map(Number);
