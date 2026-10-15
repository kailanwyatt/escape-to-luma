// Bake the ending demo's original guide score for native playback; no runtime synthesis.
const fs = require('node:fs');
const path = require('node:path');
const rate = 22050, duration = 38, count = rate * duration;
const dry = new Float64Array(count), send = new Float64Array(count);
function note(frequency, start, length, volume, triangle = false) {
  const attack = Math.min(1.6, length * .2);
  for (let i = Math.floor(start * rate); i < Math.min(count, (start + length) * rate); i++) {
    const t = i / rate - start;
    if (t < 0) continue;
    const env = t < attack ? volume * t / attack : volume * Math.pow(.0001 / volume, (t - attack) / (length - attack));
    const sine = Math.sin(2 * Math.PI * frequency * t);
    const sample = env * (triangle ? 2 / Math.PI * Math.asin(sine) : sine);
    dry[i] += sample; if (!triangle) send[i] += sample;
  }
}
const chords = [[146.83,220,293.66,369.99],[130.81,196,261.63,329.63],[164.81,246.94,329.63,392],[146.83,220,293.66,440]];
chords.forEach((chord,i) => chord.forEach((f,v) => { note(f*.5,i*9.3,10.5,.09/(v+1)); note(f*1.002,i*9.3+.02,10.5,.028,true); }));
[440,587.33,659.25,587.33,739.99,880,739.99,659.25,587.33,440].forEach((f,i) => note(f,9.3+i*2.35,4,.09));
const delay = Math.round(.38 * rate), bytes = Buffer.alloc(44 + count * 2);
bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(count*2,40);
for(let i=0;i<count;i++) {
  const echo=i>=delay?send[i-delay]*.23:0;send[i]+=echo;
  const fade=Math.min(1,(count-i)/(rate*1.8));
  bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,(dry[i]+echo)*.28*fade))*32767),44+i*2);
}
fs.writeFileSync(path.join(__dirname,'../assets/sfx/ending-score.wav'),bytes);
