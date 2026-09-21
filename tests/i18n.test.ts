import {describe,it,expect} from 'vitest';
import en from '../src/i18n/en.json';
import {t,displayLabel} from '../src/i18n';
import {resultLabel} from '../src/target/TargetScoring';

describe('English translations',()=>{
 it('preserves dynamic values, including zero and dollar signs',()=>{
  expect(t('results.PERFECT',{points:0})).toBe('PERFECT +0');
  expect(t('gameplaycontrols.level_of',{value1:2,value2:15,value3:'$& Lab'})).toBe('Level 2 of 15, $& Lab');
 });
 it('keeps missing placeholders visible rather than silently dropping copy',()=>{
  expect(t('results.PERFECT')).toBe('PERFECT +{points}');
 });
 it('keeps catalog values and interpolation valid',()=>{
  for(const [key,value] of Object.entries(en)){
   expect(value.trim(),key).not.toBe('');
   const params=Object.fromEntries([...value.matchAll(/\{(\w+)\}/g)].map(m=>[m[1],17]));
   expect(t(key as keyof typeof en,params),key).not.toMatch(/\{\w+\}/);
  }
 });
 it('renders ranks without changing scoring identifiers',()=>{
  expect(displayLabel('PERFECT')).toBe('PERFECT');
  expect(resultLabel('HIT',10,true)).toBe('CLEAR +10');
  expect(resultLabel('HIT',10)).toBe('HIT +10');
  expect(resultLabel('ROTOR_HIT',0)).toBe('BLOCKED');
  expect(resultLabel('MISS',0)).toBe('MISS');
 });
});
