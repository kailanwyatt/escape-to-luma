import {t} from '../i18n';
/** Canonical opening. Times are seconds; no physics or save mutations. */
export const OPENING_BEATS = [
  { duration: 5, title: t("firstrunstoryscreen.a_living_light"), caption: t("openingsequence.somewhere_beyond_earth_a_small_light_drifts_alone") },
  { duration: 7, title: t("openingsequence.discovery"), caption: t("openingsequence.a_deep_space_probe_detects_spark_its_collection_chamber_closes") },
  { duration: 7, title: t("firstrunstoryscreen.specimen_s_01"), caption: t("openingsequence.brought_to_earth_hidden_beneath_a_city_treated_as_a_power_source") },
  { duration: 6, title: t("openingsequence.the_signal"), caption: t("openingsequence.something_distant_answers_something_that_feels_like_home") },
  { duration: 6, title: t("openingsequence.containment_failure"), caption: t("openingsequence.the_field_falters_beyond_the_broken_glass_a_way_out") },
  { duration: 4, title: t("openingsequence.your_journey_begins"), caption: t("openingsequence.guide_spark_through_the_opening_find_the_source_of_the_signal") },
] as const;
export const OPENING_DURATION = OPENING_BEATS.reduce((sum, beat) => sum + beat.duration, 0);
export function sampleOpening(elapsed: number) {
  let remaining = Math.max(0, elapsed);
  for (let stage = 0; stage < OPENING_BEATS.length; stage++) {
    const beat = OPENING_BEATS[stage];
    if (remaining < beat.duration || stage === OPENING_BEATS.length - 1) {
      return { stage, progress: Math.min(1, remaining / beat.duration), complete: elapsed >= OPENING_DURATION };
    }
    remaining -= beat.duration;
  }
  throw new Error(t("openingsequence.opening_requires_at_least_one_beat"));
}

function smoothstep(from: number, to: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** Choreography shares the score's scan (5.2s), capture (9.6s), and lab (12s) cues. */
export function sampleOpeningChoreography(elapsed: number, reduceMotion = false) {
  return {
    approach: reduceMotion ? 1 : smoothstep(5, 9.4, elapsed),
    capture: smoothstep(9.6, 11.1, elapsed),
    // Conceal the location cut with a short fade, not a camera teleport or flash.
    transferOpacity: elapsed < 12
      ? smoothstep(11.25, 12, elapsed)
      : 1 - smoothstep(12, 12.85, elapsed),
  };
}
