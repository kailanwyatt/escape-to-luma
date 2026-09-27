import {describe,it,expect} from 'vitest';
import {failTip} from '../src/game/failTips';

describe('fail tips',()=>{
 it('coaches the player instead of naming Ring B / Gate A',()=>{
  expect(failTip('movingRing')).toBe('LEAD THE RING — AIM WHERE IT WILL BE');
  expect(failTip('rotor')).toBe('TIME THE GAP BETWEEN THE BLADES');
  expect(failTip('slidingGate')).toBe('WAIT FOR THE OPENING');
  expect(failTip('unknownThing')).toBe('READ THE PATH, THEN COMMIT');
  expect(failTip('movingRing')).not.toMatch(/RING [A-Z]/);
 });
});
