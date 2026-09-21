import {t} from '../i18n';
/** Tentative home-screen identity. Keep renaming separate from campaign/save IDs. */
export const HOME_BRAND = {
  title: t("branding.spark"),
  subtitle: t("branding.escape_to_luma"),
  destination: t("storymoments.luma"),
  eyebrow: t("branding.journey_home"),
  tagline: t("branding.a_small_spark_a_brighter_tomorrow"),
  closing: t("branding.somewhere_out_there_something_is_calling"),
} as const;
