import {expect,it} from 'vitest';
import {homeArtworkLayout} from '../src/ui/homeArtworkLayout';
import {homeLayout} from '../src/ui/homeLayout';

it('anchors Spark to the same portal pixel through folds, rotations, and safe-area changes',()=>{
  for(const [width,height] of [[339,760],[760,339],[678,466],[466,678],[904,621],[621,904],[600,600],[900,850],[850,900]]){
    for(const right of [0,44,84]){
      const layout=homeLayout(width,height,{left:0,right,top:20,bottom:20});
      const result=homeArtworkLayout(width,height,layout.landscape,layout.landscape?12+layout.sceneWidth/2:width/2);
      const original=layout.landscape?{w:1672,h:941,x:447,y:550}:{w:1024,h:1536,x:512,y:724};
      const scale=result.image.width/original.w;
      expect(result.portal.x).toBeCloseTo(result.image.left+original.x*scale,8);
      expect(result.portal.y).toBeCloseTo(result.image.top+original.y*scale,8);
      expect(result.spark.x).toBeCloseTo(result.portal.x,8);
      expect(result.spark.y).toBeGreaterThan(result.portal.y);
      expect(result.launchAngle).toBeCloseTo(0,8);
      expect(result.image.height/original.h).toBeCloseTo(scale,8);
      expect(result.image.left).toBeLessThanOrEqual(.0001);expect(result.image.top).toBeLessThanOrEqual(.0001);
      expect(result.image.left+result.image.width).toBeGreaterThanOrEqual(width-.0001);
      expect(result.image.top+result.image.height).toBeGreaterThanOrEqual(height-.0001);
      expect(result.portal.x).toBeGreaterThan(0);expect(result.portal.x).toBeLessThan(width);
      expect(result.portal.y).toBeGreaterThan(0);expect(result.portal.y).toBeLessThan(height);
    }
  }
});
