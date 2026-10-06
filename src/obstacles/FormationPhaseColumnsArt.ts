import * as THREE from 'three';
import type { FormationConfig } from '../config/ObstacleConfig';
import { formationParts } from './FormationState';

type IonPhase = 'active' | 'warning' | 'quiet';

type Strand = {
  line: THREE.Line;
  mat: THREE.LineBasicMaterial;
  base: Float32Array;
};

type IonColumn = {
  root: THREE.Group;
  aura: THREE.Mesh;
  auraMat: THREE.ShaderMaterial;
  midGlow: THREE.Mesh;
  midGlowMat: THREE.ShaderMaterial;
  core: THREE.Mesh;
  coreMat: THREE.ShaderMaterial;
  ribbon: THREE.Mesh;
  ribbonMat: THREE.ShaderMaterial;
  strands: Strand[];
  nodeTop: THREE.Mesh;
  nodeBot: THREE.Mesh;
  nodeMat: THREE.ShaderMaterial;
  sparks: THREE.Points;
  sparkMat: THREE.PointsMaterial;
  sparkBase: Float32Array;
};

const ACTIVE = 0xe45eff;
const WARNING = 0xffb449;
const QUIET = 0x8eb4ff;

/** Soft vertical weather volume: wide bloom that fades into nebula air. */
const auraShader = {
  vertexShader: `varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `
    varying vec2 v;uniform vec3 color;uniform float strength;
    void main(){
      float x=abs(v.x); float y=abs(v.y);
      float side=1.-smoothstep(.15,.95,x);
      float bloom=exp(-x*x*2.1)*(1.-smoothstep(.48,1.,y));
      float soft=exp(-x*x*.9)*(1.-smoothstep(.62,1.,y))*.35;
      float a=clamp((bloom+soft)*strength*side,0.,1.);
      gl_FragColor=vec4(color,a);
    }`,
};

/** Mid glow shell — readable corridor without a hard slab edge. */
const midGlowShader = {
  vertexShader: `varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `
    varying vec2 v;uniform vec3 color;uniform float strength;
    void main(){
      float x=abs(v.x); float y=abs(v.y);
      float side=1.-smoothstep(.22,.92,x);
      float shaft=exp(-x*x*8.5)*(1.-smoothstep(.78,1.,y));
      float fringe=exp(-x*x*3.6)*(1.-smoothstep(.7,1.,y))*.4;
      float a=clamp((shaft+fringe)*strength*side,0.,1.);
      gl_FragColor=vec4(color,a);
    }`,
};

/** Bright needle core for active storms. */
const coreShader = {
  vertexShader: `varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `
    varying vec2 v;uniform vec3 color;uniform float strength;uniform float time;
    void main(){
      float x=abs(v.x); float y=v.y;
      float needle=exp(-x*x*90.);
      float fringe=exp(-x*x*22.)*.45;
      float flicker=.82+.18*sin(y*48.+time*7.2);
      float a=clamp((needle+fringe)*strength*flicker*(1.-smoothstep(.94,1.,abs(y))),0.,1.);
      vec3 hot=mix(color,vec3(1.,.94,1.),needle*.7);
      gl_FragColor=vec4(hot,a);
    }`,
};

/** Thin residual ion ribbon — the quiet-lane tell. */
const ribbonShader = {
  vertexShader: `varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `
    varying vec2 v;uniform vec3 color;uniform float strength;uniform float time;
    void main(){
      float x=abs(v.x); float y=v.y;
      float line=exp(-x*x*140.);
      float drift=.9+.1*sin(y*18.+time*1.4);
      float a=clamp(line*strength*drift*(1.-smoothstep(.9,1.,abs(y))),0.,1.);
      gl_FragColor=vec4(color,a);
    }`,
};

/** Soft charged region at column ends — not machinery rings. */
const nodeShader = {
  vertexShader: `varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `
    varying vec2 v;uniform vec3 color;uniform float strength;
    void main(){
      float r=length(v);
      float soft=exp(-r*r*4.2);
      float a=clamp(soft*strength,0.,1.);
      gl_FragColor=vec4(color,a);
    }`,
};

/**
 * Ion Columns — three weather systems in the nebula.
 * Quiet = thin residual ribbon; warning = amber heat-up; active = storm corridor.
 * FormationState.active / warning remain authoritative; visuals only.
 */
export class FormationPhaseColumnsArt {
  readonly group = new THREE.Group();
  private readonly columns: IonColumn[] = [];
  private readonly accent: THREE.PointLight;
  private readonly centerY: number;
  private readonly tmpColor = new THREE.Color();

  constructor(private readonly config: FormationConfig) {
    this.group.name = 'formation-phase-columns-art';
    this.centerY = config.centerY ?? 3;

    formationParts(config, 0).forEach((_, i) => {
      this.columns.push(this.buildColumn(i));
    });

    this.accent = new THREE.PointLight(ACTIVE, 8, 11, 2);
    this.accent.name = 'phase-columns-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  private buildColumn(index: number): IonColumn {
    const root = new THREE.Group();
    root.name = `phase-column-${index}`;
    this.group.add(root);

    const auraMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      uniforms: {
        color: { value: new THREE.Color(ACTIVE) },
        strength: { value: 0.2 },
      },
      ...auraShader,
    });
    const aura = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.18), auraMat);
    aura.name = 'ion-aura';
    aura.position.z = -0.07;
    root.add(aura);

    const midGlowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      uniforms: {
        color: { value: new THREE.Color(ACTIVE) },
        strength: { value: 0.2 },
      },
      ...midGlowShader,
    });
    const midGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.1), midGlowMat);
    midGlow.name = 'ion-glow';
    midGlow.position.z = -0.045;
    root.add(midGlow);

    const coreMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      uniforms: {
        color: { value: new THREE.Color(ACTIVE) },
        strength: { value: 1 },
        time: { value: 0 },
      },
      ...coreShader,
    });
    const core = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.04), coreMat);
    core.name = 'ion-core';
    core.position.z = -0.02;
    root.add(core);

    const ribbonMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      uniforms: {
        color: { value: new THREE.Color(QUIET) },
        strength: { value: 0.35 },
        time: { value: 0 },
      },
      ...ribbonShader,
    });
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1.02), ribbonMat);
    ribbon.name = 'ion-ribbon';
    ribbon.position.z = -0.015;
    root.add(ribbon);

    const strands: Strand[] = [];
    const strandCount = 5;
    for (let s = 0; s < strandCount; s++) {
      const seed = index * 17.1 + s * 9.3;
      const pts = this.strandPoints(seed, s, strandCount);
      const geo = new THREE.BufferGeometry();
      const base = new Float32Array(pts.length * 3);
      for (let p = 0; p < pts.length; p++) {
        base[p * 3] = pts[p]!.x;
        base[p * 3 + 1] = pts[p]!.y;
        base[p * 3 + 2] = pts[p]!.z;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
      const mat = new THREE.LineBasicMaterial({
        color: ACTIVE,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const line = new THREE.Line(geo, mat);
      line.name = `ion-strand-${s}`;
      root.add(line);
      strands.push({ line, mat, base });
    }

    const nodeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      uniforms: {
        color: { value: new THREE.Color(ACTIVE) },
        strength: { value: 0.35 },
      },
      ...nodeShader,
    });
    const nodeTop = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), nodeMat);
    nodeTop.name = 'ion-node-top';
    nodeTop.position.set(0, 0.5, -0.01);
    root.add(nodeTop);
    const nodeBot = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), nodeMat.clone());
    nodeBot.name = 'ion-node-bot';
    nodeBot.position.set(0, -0.5, -0.01);
    root.add(nodeBot);

    const sparkCount = 8;
    const sparkBase = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const u = (i + 0.5) / sparkCount;
      sparkBase[i * 3] = Math.sin(index * 2.1 + i * 1.7) * 0.08;
      sparkBase[i * 3 + 1] = u - 0.5;
      sparkBase[i * 3 + 2] = -0.03;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkBase.slice(), 3));
    const sparkMat = new THREE.PointsMaterial({
      color: ACTIVE,
      size: 0.045,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    sparks.name = 'ion-sparks';
    root.add(sparks);

    return {
      root,
      aura,
      auraMat,
      midGlow,
      midGlowMat,
      core,
      coreMat,
      ribbon,
      ribbonMat,
      strands,
      nodeTop,
      nodeBot,
      nodeMat,
      sparks,
      sparkMat,
      sparkBase,
    };
  }

  private strandPoints(seed: number, strand: number, count: number): THREE.Vector3[] {
    const x0 = (strand - (count - 1) / 2) * 0.055;
    const wobble = 0.05 + (seed % 1) * 0.04;
    const mid = [
      { y: -0.5, x: x0 * 0.7 },
      { y: -0.28, x: x0 + Math.sin(seed) * wobble },
      { y: -0.05, x: x0 - Math.cos(seed * 1.3) * wobble * 1.2 },
      { y: 0.18, x: x0 + Math.sin(seed * 0.7) * wobble },
      { y: 0.38, x: x0 - Math.sin(seed * 1.1) * wobble * 0.95 },
      { y: 0.5, x: x0 * 0.75 },
    ];
    return mid.map((p) => new THREE.Vector3(p.x, p.y, -0.012 + (strand % 3) * 0.006));
  }

  private phaseOf(active: boolean, warning: boolean): IonPhase {
    if (warning) return 'warning';
    if (active) return 'active';
    return 'quiet';
  }

  update(time: number) {
    const parts = formationParts(this.config, time);
    let activeCount = 0;

    parts.forEach((p, i) => {
      const col = this.columns[i];
      if (!col) return;

      col.root.position.set(p.x, p.y, 0);
      col.root.scale.set(Math.max(0.001, p.width), Math.max(0.001, p.height), 1);
      col.root.visible = p.height > 0.002;

      const phase = this.phaseOf(p.active, p.warning);
      if (p.active) activeCount += 1;

      const breathe =
        phase === 'quiet'
          ? 1 + Math.sin(time * 0.9 + i) * 0.012
          : 1 + Math.sin(time * 2.1 + i) * 0.045;
      const pulse = 0.84 + 0.16 * Math.sin(time * 3.2 + i * 1.1);
      const warnPulse = 0.7 + 0.3 * Math.sin(time * 9.2 + i);

      col.aura.scale.set(breathe * (phase === 'active' ? 1.12 : 0.92), 1, 1);
      col.midGlow.scale.set(breathe, 1, 1);
      col.core.scale.set(
        phase === 'active' ? 1.25 * pulse : phase === 'warning' ? 0.55 + 0.45 * warnPulse : 0.22,
        1,
        1,
      );
      col.ribbon.scale.set(
        phase === 'quiet' ? 1 : phase === 'warning' ? 0.7 + 0.55 * warnPulse : 0.35,
        1,
        1,
      );

      let colorHex = QUIET;
      let auraStr = 0.045;
      let midStr = 0.04;
      let coreStr = 0.05;
      let ribbonStr = 0.42;
      let strandOp = 0.06;
      let nodeStr = 0.12;
      let sparkOp = 0.1;
      let sparkSize = 0.03;

      if (phase === 'active') {
        colorHex = ACTIVE;
        auraStr = 0.78 * pulse;
        midStr = 0.72 * pulse;
        coreStr = 1.25 * pulse;
        ribbonStr = 0.15;
        strandOp = 0.98;
        nodeStr = 0.7 * pulse;
        sparkOp = 0.72;
        sparkSize = 0.065;
      } else if (phase === 'warning') {
        // Quiet ribbon heats amber and densifies before the storm snaps on.
        colorHex = WARNING;
        auraStr = 0.28 * warnPulse;
        midStr = 0.38 * warnPulse;
        coreStr = 0.55 * warnPulse;
        ribbonStr = 0.55 + 0.45 * warnPulse;
        strandOp = 0.35 + 0.45 * warnPulse;
        nodeStr = 0.4 * warnPulse;
        sparkOp = 0.35 + 0.25 * warnPulse;
        sparkSize = 0.045;
      }

      this.tmpColor.setHex(colorHex);
      col.auraMat.uniforms.color.value.copy(this.tmpColor);
      col.auraMat.uniforms.strength.value = auraStr;
      col.midGlowMat.uniforms.color.value.copy(this.tmpColor);
      col.midGlowMat.uniforms.strength.value = midStr;
      col.coreMat.uniforms.color.value.copy(this.tmpColor);
      col.coreMat.uniforms.strength.value = coreStr;
      col.coreMat.uniforms.time.value = time;
      col.ribbonMat.uniforms.color.value.setHex(phase === 'quiet' ? QUIET : colorHex);
      col.ribbonMat.uniforms.strength.value = ribbonStr;
      col.ribbonMat.uniforms.time.value = time;
      col.nodeMat.uniforms.color.value.copy(this.tmpColor);
      col.nodeMat.uniforms.strength.value = nodeStr;
      const nodeBotMat = col.nodeBot.material as THREE.ShaderMaterial;
      nodeBotMat.uniforms.color.value.copy(this.tmpColor);
      nodeBotMat.uniforms.strength.value = nodeStr;
      col.sparkMat.color.setHex(phase === 'quiet' ? QUIET : colorHex);
      col.sparkMat.opacity = sparkOp;
      col.sparkMat.size = sparkSize;

      const nodeScale =
        phase === 'active'
          ? 0.95 + 0.1 * Math.sin(time * 2.6 + i)
          : phase === 'warning'
            ? 0.75 + 0.2 * warnPulse
            : 0.55;
      col.nodeTop.scale.setScalar(nodeScale);
      col.nodeBot.scale.setScalar(nodeScale * 0.98);

      col.strands.forEach((strand, s) => {
        const quietFade = s === 2 ? 0.55 : 0.12; // one faint middle thread in quiet
        strand.mat.color.setHex(phase === 'quiet' ? QUIET : colorHex);
        strand.mat.opacity =
          phase === 'quiet'
            ? strandOp * quietFade
            : strandOp * (0.5 + 0.5 * ((s + 1) / col.strands.length));
        strand.line.visible = phase !== 'quiet' || s === 2;

        const pos = strand.line.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let v = 0; v < pos.count; v++) {
          const bx = strand.base[v * 3]!;
          const by = strand.base[v * 3 + 1]!;
          const bz = strand.base[v * 3 + 2]!;
          const jitterAmp =
            phase === 'quiet'
              ? 0.003
              : phase === 'warning'
                ? 0.012 + 0.01 * warnPulse
                : 0.028;
          const jitterFreq = phase === 'warning' ? 8.2 : phase === 'active' ? 6.4 : 1.1;
          const flicker = Math.sin(time * jitterFreq + i * 2 + s + v * 0.85) * jitterAmp;
          // Warning: strands pull slightly inward as the storm condenses.
          const converge = phase === 'warning' ? 1 - 0.35 * warnPulse : 1;
          pos.setXYZ(v, bx * converge + flicker, by, bz);
        }
        pos.needsUpdate = true;
      });

      const sparkPos = col.sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
      const sparkSpeed = phase === 'quiet' ? 0.08 : phase === 'warning' ? 0.22 : 0.32;
      for (let s = 0; s < sparkPos.count; s++) {
        const bx = col.sparkBase[s * 3]!;
        const by = col.sparkBase[s * 3 + 1]!;
        const drift = ((time * sparkSpeed + s * 0.13 + i * 0.07) % 1) - 0.5;
        const spread = phase === 'active' ? 0.028 : phase === 'warning' ? 0.018 : 0.006;
        sparkPos.setXYZ(
          s,
          bx * (phase === 'quiet' ? 0.35 : 1) + Math.sin(time * 1.8 + s) * spread,
          by * (phase === 'quiet' ? 0.08 : 0.2) + drift,
          col.sparkBase[s * 3 + 2]!,
        );
      }
      sparkPos.needsUpdate = true;
    });

    const pulse = 0.75 + 0.25 * Math.sin(time * 2.4);
    this.accent.color.setHex(activeCount > 0 ? ACTIVE : QUIET);
    this.accent.intensity = 5.5 + activeCount * 1.8 + pulse * 2.5;
    this.accent.position.set(0, this.centerY, -1.05);
  }

  dispose() {
    for (const col of this.columns) {
      col.aura.geometry.dispose();
      col.auraMat.dispose();
      col.midGlow.geometry.dispose();
      col.midGlowMat.dispose();
      col.core.geometry.dispose();
      col.coreMat.dispose();
      col.ribbon.geometry.dispose();
      col.ribbonMat.dispose();
      col.nodeTop.geometry.dispose();
      col.nodeMat.dispose();
      (col.nodeBot.material as THREE.Material).dispose();
      col.nodeBot.geometry.dispose();
      col.sparks.geometry.dispose();
      col.sparkMat.dispose();
      for (const strand of col.strands) {
        strand.line.geometry.dispose();
        strand.mat.dispose();
      }
    }
    this.group.clear();
    this.group.removeFromParent();
  }
}
