// Local developer preview only; never imported by Expo or production UI.
const {build}=require('esbuild');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const http=require('node:http');
(async()=>{const root=path.resolve(__dirname,'..');const out=fs.mkdtempSync(path.join(os.tmpdir(),'spark-rotors-'));
await build({entryPoints:[path.join(root,'dev/rotor-gallery.ts')],bundle:true,platform:'browser',outfile:path.join(out,'gallery.js')});
fs.copyFileSync(path.join(root,'dev/rotor-gallery.html'),path.join(out,'index.html'));
const server=http.createServer((req,res)=>{const file=req.url==='/gallery.js'?'gallery.js':'index.html';res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(path.join(out,file)));});
server.listen(8784,'127.0.0.1',()=>console.log('Rotor gallery: http://localhost:8784'));
process.on('SIGINT',()=>{server.close();fs.rmSync(out,{recursive:true,force:true});process.exit(0);});})();
