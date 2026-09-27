import {describe,it,expect} from 'vitest';
import en from '../src/i18n/en.json';
import {t,displayLabel} from '../src/i18n';
import {resultLabel} from '../src/target/TargetScoring';

describe('English translations',()=>{
 it('preserves dynamic values, including zero and dollar signs',()=>{
  expect(t('results.PERFECT',{points:0})).toBe('PERFECT +0');
  expect(t('gameplaycontrols.level_of',{value1:13,value2:5,value3:7,value4:'$& Lockdown'})).toBe('Level 13, 5 of 7 in $& Lockdown');
  expect(t('gameplaycontrols.l',{value1:13,value2:5,value3:7,value4:'LOCKDOWN'})).toBe('L13 · 5/7 · LOCKDOWN');
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
