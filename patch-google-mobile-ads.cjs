/**
 * The ads package throws during Gradle configuration when app.json is present
 * but the extra property was stored under the wrong name. EAS installs a fresh
 * node_modules, so this runs from postinstall.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'node_modules/react-native-google-mobile-ads/android');
const appJsonGradle = path.join(root, 'app-json.gradle');
const buildGradle = path.join(root, 'build.gradle');

function replace(file, from, to) {
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes(from)) {
    if (!source.includes(to)) throw new Error(`Could not patch ${path.basename(file)}`);
    return;
  }
  fs.writeFileSync(file, source.replace(from, to));
}

replace(
  appJsonGradle,
  'rootProject.ext.googleAdsJson = false',
  'rootProject.ext.googleMobileAdsJson = false',
);

replace(
  buildGradle,
  `def requestedAndroidBackend = (
  project.findProperty("RNGMA_ANDROID_BACKEND") ?:
    (rootProject.ext.googleMobileAdsJson
      ? rootProject.ext.googleMobileAdsJson.getStringValue("android_sdk", "classic")
      : "classic")
).toString().toLowerCase()`,
  `def adsJson = rootProject.ext.has("googleMobileAdsJson") ? rootProject.ext.googleMobileAdsJson : false
def requestedAndroidBackend = (
  project.findProperty("RNGMA_ANDROID_BACKEND") ?:
    (adsJson ? adsJson.getStringValue("android_sdk", "classic") : "classic")
).toString().toLowerCase()`,
);
