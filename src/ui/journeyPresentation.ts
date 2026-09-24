import type {RuntimeAssetId} from '../graphics/assetRegistry';

type JourneyLook = {
  image: RuntimeAssetId | null;
  accent: string;
  sky: readonly [string, string, string];
  motif: string;
};

/** Replaceable artwork slots. Null means intentional lightweight menu illustration. */
const LOOKS = {
  lab: {image: 'world1.crackEscape' as RuntimeAssetId, accent: '#68E3F2', sky: ['#071827', '#164458', '#04101c'] as const, motif: 'capture'},
  lockdown: {image: 'world.lockdownBanner' as RuntimeAssetId, accent: '#F2BB68', sky: ['#08131d', '#293a47', '#0b1520'] as const, motif: 'capture'},
  city: {image: 'world.cityBanner' as RuntimeAssetId, accent: '#F3BD76', sky: ['#102538', '#7e6271', '#efb16a'] as const, motif: 'patrol'},
  cloud: {image: 'world.ascentBanner' as RuntimeAssetId, accent: '#9ACEEB', sky: ['#10263c', '#427c9e', '#b9dde8'] as const, motif: 'patrol'},
  storm: {image: 'world.stormBanner' as RuntimeAssetId, accent: '#7EB8D8', sky: ['#0c1c2c', '#2f5570', '#6a9bb0'] as const, motif: 'pulse'},
  earth: {image: 'world.ascentBanner' as RuntimeAssetId, accent: '#7DAAF4', sky: ['#050d1a', '#102c56', '#4685c4'] as const, motif: 'earth'},
  orbit: {image: null, accent: '#839CF4', sky: ['#040b18', '#182640', '#050d1b'] as const, motif: 'orbit'},
  graveyard: {image: null, accent: '#6F86C8', sky: ['#030910', '#121c30', '#2a3348'] as const, motif: 'ports'},
  moon: {image: null, accent: '#CAD4DB', sky: ['#030b17', '#172337', '#455360'] as const, motif: 'moon'},
  farSide: {image: null, accent: '#9AA7B2', sky: ['#02070f', '#0f1826', '#2c3642'] as const, motif: 'moon'},
  rocks: {image: null, accent: '#B99B7D', sky: ['#060c18', '#263244', '#0a1423'] as const, motif: 'rocks'},
  drift: {image: null, accent: '#A89074', sky: ['#040910', '#1a2434', '#08101b'] as const, motif: 'current'},
  nebula: {image: 'world.nebulaBackdrop' as RuntimeAssetId, accent: '#C8A2FB', sky: ['#100d24', '#482469', '#171a36'] as const, motif: 'nebula'},
  theNull: {image: 'world.nebulaBackdrop' as RuntimeAssetId, accent: '#8B6FC0', sky: ['#080612', '#241538', '#0c0a18'] as const, motif: 'void'},
  falseHome: {image: 'world.nebulaBackdrop' as RuntimeAssetId, accent: '#D4B4FF', sky: ['#120e28', '#55307a', '#1c2040'] as const, motif: 'relay'},
  network: {image: 'world.networkBackdrop' as RuntimeAssetId, accent: '#EDCF84', sky: ['#071726', '#665039', '#0d1e2a'] as const, motif: 'network'},
  machine: {image: 'world.networkBackdrop' as RuntimeAssetId, accent: '#E0BC6E', sky: ['#05141f', '#5a4630', '#0a1822'] as const, motif: 'network'},
  signal: {image: 'world.homewardBackdrop' as RuntimeAssetId, accent: '#9FE8C7', sky: ['#061629', '#174455', '#8dceca'] as const, motif: 'signal'},
  homeward: {image: 'world.homewardBackdrop' as RuntimeAssetId, accent: '#9FE8C7', sky: ['#061629', '#174455', '#8dceca'] as const, motif: 'signal'},
  luma: {image: 'world.homewardBackdrop' as RuntimeAssetId, accent: '#B8F5DC', sky: ['#072028', '#1a5a5c', '#a8e0d8'] as const, motif: 'reunion'},
} satisfies Record<string, JourneyLook>;

export const JOURNEY_PRESENTATION: Record<string, JourneyLook> = {
  containment: LOOKS.lab,
  lockdown: LOOKS.lockdown,
  city: LOOKS.city,
  ascent: LOOKS.cloud,
  storm: LOOKS.storm,
  sky: LOOKS.cloud,
  upper_atmosphere: LOOKS.earth,
  atmosphere: LOOKS.earth,
  orbit: LOOKS.orbit,
  orbital_graveyard: LOOKS.graveyard,
  moon: LOOKS.moon,
  far_side: LOOKS.farSide,
  asteroid_belt: LOOKS.rocks,
  asteroid: LOOKS.rocks,
  drift: LOOKS.drift,
  nebula: LOOKS.nebula,
  the_null: LOOKS.theNull,
  false_home: LOOKS.falseHome,
  ancient_network: LOOKS.network,
  network: LOOKS.network,
  the_machine: LOOKS.machine,
  the_signal: LOOKS.signal,
  homeward: LOOKS.homeward,
  luma: LOOKS.luma,
};

export const FALLBACK_JOURNEY_LOOK: JourneyLook = LOOKS.orbit;

export function journeyLookFor(id: string): JourneyLook {
  return JOURNEY_PRESENTATION[id] ?? FALLBACK_JOURNEY_LOOK;
}
