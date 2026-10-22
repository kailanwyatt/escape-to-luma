/** First launch stays on the opening. A player who has seen it lands on home. */
export function initialBootRoute(hasSeenOpening: boolean): 'opening' | 'home' {
  return hasSeenOpening ? 'home' : 'opening';
}

/** The opaque boot cover stays up until that route has been applied. */
export function holdBootCover(webArcade: boolean, routeReady: boolean): boolean {
  return !webArcade && !routeReady;
}
