import {describe,expect,it} from 'vitest';
import {homeLayout} from '../src/ui/homeLayout';

describe('foldable home layout',()=>{
  it('keeps both columns and the gap inside the safe content width through fold transitions',()=>{
    for(const [width,height] of [[339,760],[678,466],[904,621],[621,904],[760,339],[1024,768],[390,844]]){
      for(const right of [0,44,84]){
        const layout=homeLayout(width,height,{left:0,right,top:20,bottom:20});
        if(layout.landscape){
          expect(layout.sceneWidth+layout.controlsWidth+layout.gap).toBe(layout.pageWidth);
          expect(layout.sceneWidth).toBeGreaterThanOrEqual(240);
          expect(layout.controlsWidth).toBeGreaterThanOrEqual(260);
        }else expect(layout.controlsWidth).toBeLessThanOrEqual(layout.pageWidth);
        expect(layout.pageWidth+right+24).toBe(width);
      }
    }
  });
});
