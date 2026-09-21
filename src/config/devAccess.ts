/** Session-only override. Never persisted or enabled in production builds. */
let unlockAll=false;
export function devLevelsUnlocked():boolean {return typeof __DEV__!=='undefined'&&__DEV__&&unlockAll;}
export function setDevLevelsUnlocked(value:boolean):void {unlockAll=typeof __DEV__!=='undefined'&&__DEV__&&value;}
