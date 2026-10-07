import {describe,expect,it} from 'vitest';
import {getCampaignLevel} from '../src/campaign/levels';

describe('Ascent ring mastery',()=>{
  it('makes levels 34–36 a fair but meaningful horizontal, vertical, and elliptical ramp',()=>{
    const levels=[34,35,36].map(number=>getCampaignLevel(number)!);
    const rings=levels.map(level=>{
      const ring=level.challenge.obstacles.find(obstacle=>obstacle.type==='movingRing');
      expect(ring?.type).toBe('movingRing');
      return ring!;
    });
    expect(rings.map(ring=>ring.movement.type)).toEqual(['horizontal','vertical','ellipse']);
    expect(rings.map(ring=>ring.movement.speed)).toEqual([.72,.8,.86]);
    expect(rings.map(ring=>ring.radius)).toEqual([.91,.89,.9]);
    expect(levels.map(level=>level.challenge.target.radius)).toEqual([.78,.78,.78]);
    expect(levels.map(level=>Math.abs(level.windX ?? 0))).toEqual([.32,.34,.36]);
    expect(levels.map(level=>level.challenge.obstacles.length)).toEqual([1,1,2]);
    const rear=levels[2].challenge.obstacles[1];
    expect(rear).toMatchObject({type:'movingRing',z:9,radius:1.06,movement:{type:'vertical',speed:.62,phase:Math.PI/2}});
    expect(rings.every(ring=>ring.radius>=.89)).toBe(true);
  });
});
