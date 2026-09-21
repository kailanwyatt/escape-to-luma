import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {Target} from '../src/target/Target';
import {JumpGateVisual} from '../src/target/JumpGateVisual';
import {Projectile} from '../src/projectile/Projectile';
import {scoreTarget} from '../src/target/TargetScoring';
describe('Jump Gate visual contract',()=>{
  it('keeps one aperture at the scoring radius and leaves scoring untouched during feedback',()=>{
    const target=new Target();target.applyConfig({x:.3,y:3,radius:1.18,z:12});
    const before=[0,.2,.5,.9,1.4].map(distance=>scoreTarget(distance,target.radius));
    const circles:THREE.Mesh<THREE.CircleGeometry>[]=[];
    target.group.traverse(child=>{if(child instanceof THREE.Mesh && child.geometry instanceof THREE.CircleGeometry)circles.push(child);});
    expect(circles).toHaveLength(1);
    expect(circles[0].geometry.parameters.radius*target.group.scale.x).toBeCloseTo(1.18);
    target.triggerPulse(1.6);target.updateVisual(.15,false);
    expect(target.group.position.toArray()).toEqual([.3,3,12]);expect(target.group.scale.x).toBe(1.18);
    expect([0,.2,.5,.9,1.4].map(distance=>scoreTarget(distance,target.radius))).toEqual(before);
  });
  it('keeps mechanical hardware fixed, particles bounded and reduced motion stationary',()=>{
    const gate=new JumpGateVisual();const particle=gate.group.getObjectByName('portal-particles') as THREE.Points;
    const geometry=particle.geometry;const children=gate.group.children.length;
    for(let i=0;i<500;i++)gate.update(1/60,false);
    expect(gate.frame.rotation.toArray().slice(0,3)).toEqual([0,0,0]);
    expect(particle.geometry).toBe(geometry);expect(geometry.getAttribute('position').count).toBe(32);expect(gate.group.children).toHaveLength(children);
    gate.update(.1,true);const positions=Array.from(geometry.getAttribute('position').array);gate.update(10,true);
    expect(Array.from(geometry.getAttribute('position').array)).toEqual(positions);
  });
  it('gives perfect a stronger flash than clear',()=>{
    const clear=new JumpGateVisual(),perfect=new JumpGateVisual();
    clear.trigger(.55);perfect.trigger(1.6);clear.update(.2,false);perfect.update(.2,false);
    const value=(gate:JumpGateVisual)=>((gate.group.getObjectByName('portal-interior') as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.flash.value;
    expect(value(perfect)).toBeGreaterThan(value(clear)*2);
  });
  it('absorbs the rendered Spark without changing physics and restores it on retry',()=>{
    const spark=new Projectile();spark.position.set(.2,3,12);spark.velocity.set(0,0,0);spark.syncMesh();const position=spark.position.clone();
    spark.beginPortalEntry();
    for(let i=0;i<30;i++){spark.syncMesh();spark.updateVisual(i/60,false,'success',true,1/60);}
    expect(spark.position.equals(position)).toBe(true);expect(spark.mesh.visible).toBe(false);
    spark.reset();expect(spark.mesh.visible).toBe(true);expect(spark.mesh.scale.x).toBe(1);
  });
});
