#!/usr/bin/env node
/** Local asset + obstacle + cinematic lookdev server. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { build } = require('esbuild');

const root = path.resolve(__dirname, '..');
const assetsRoot = path.join(root, 'assets');
const viewerHtml = path.join(__dirname, 'asset-viewer.html');
const obstacleHtml = path.join(__dirname, 'obstacle-gallery.html');
const pistonHtml = path.join(__dirname, 'cinematic-piston.html');
const gateHtml = path.join(__dirname, 'cinematic-gate.html');
const shutterHtml = path.join(__dirname, 'cinematic-shutter.html');
const elevatorHtml = path.join(__dirname, 'cinematic-elevator.html');
const scissorHtml = path.join(__dirname, 'cinematic-scissor.html');
const port = Number(process.env.PORT || 8765);
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'etl-review-'));

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const AUDIO_EXT = new Set(['.wav', '.mp3', '.m4a', '.ogg']);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function categoryFor(rel) {
  const p = rel.replace(/\\/g, '/');
  if (p.startsWith('assets/sfx/')) return 'audio';
  if (p.startsWith('assets/art/worlds/')) return 'background';
  if (p.startsWith('assets/art/home/')) return 'background';
  if (p === 'assets/art/landing-hero.jpg') return 'background';
  if (p.startsWith('assets/art/sparks/')) return 'spark';
  if (p.startsWith('assets/art/story/')) return 'story';
  if (p.startsWith('assets/art/shop/')) return 'ui';
  if (p.startsWith('assets/art/world1/')) return 'world1';
  if (/^assets\/(icon|splash|favicon|android-icon)/.test(p)) return 'brand';
  return 'other';
}

function labelFor(rel) {
  const base = path.basename(rel).replace(/\.[^.]+$/, '');
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCatalog() {
  if (!fs.existsSync(assetsRoot)) return [];
  return walk(assetsRoot)
    .map((full) => {
      const rel = path.relative(root, full).replace(/\\/g, '/');
      const ext = path.extname(full).toLowerCase();
      const kind = IMAGE_EXT.has(ext) ? 'image' : AUDIO_EXT.has(ext) ? 'audio' : null;
      if (!kind) return null;
      const stat = fs.statSync(full);
      return {
        id: rel,
        path: rel,
        label: labelFor(rel),
        category: categoryFor(rel),
        kind,
        bytes: stat.size,
        folder: path.posix.dirname(rel),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.path.localeCompare(b.path));
}

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

const ROUTES = {
  '/': viewerHtml,
  '/index.html': viewerHtml,
  '/obstacles': obstacleHtml,
  '/obstacles/': obstacleHtml,
  '/piston': pistonHtml,
  '/piston/': pistonHtml,
  '/gate': gateHtml,
  '/gate/': gateHtml,
  '/shutter': shutterHtml,
  '/shutter/': shutterHtml,
  '/elevator': elevatorHtml,
  '/elevator/': elevatorHtml,
  '/scissor': scissorHtml,
  '/scissor/': scissorHtml,
  '/obstacle-gallery.js': path.join(outDir, 'obstacle-gallery.js'),
  '/cinematic-piston.js': path.join(outDir, 'cinematic-piston.js'),
  '/cinematic-gate.js': path.join(outDir, 'cinematic-gate.js'),
  '/cinematic-shutter.js': path.join(outDir, 'cinematic-shutter.js'),
  '/cinematic-elevator.js': path.join(outDir, 'cinematic-elevator.js'),
  '/cinematic-scissor.js': path.join(outDir, 'cinematic-scissor.js'),
};

function resolveFile(urlPath) {
  if (ROUTES[urlPath]) return ROUTES[urlPath];
  const rel = urlPath.replace(/^\//, '');
  return path.normalize(path.join(root, rel));
}

async function main() {
  await build({
    entryPoints: [
      path.join(__dirname, 'obstacle-gallery.ts'),
      path.join(__dirname, 'cinematic-piston.ts'),
      path.join(__dirname, 'cinematic-gate.ts'),
      path.join(__dirname, 'cinematic-shutter.ts'),
      path.join(__dirname, 'cinematic-elevator.ts'),
      path.join(__dirname, 'cinematic-scissor.ts'),
    ],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outdir: outDir,
    logLevel: 'warning',
  });

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

    if (urlPath === '/api/catalog') {
      send(res, 200, 'application/json', JSON.stringify({ generatedAt: new Date().toISOString(), assets: buildCatalog() }));
      return;
    }

    const file = resolveFile(urlPath);
    if (!file.startsWith(root) && !file.startsWith(outDir)) {
      send(res, 403, 'text/plain', 'Forbidden');
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        send(res, 404, 'text/plain', 'Not found: ' + urlPath);
        return;
      }
      send(res, 200, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', data);
    });
  });

  const cleanup = () => {
    server.close();
    fs.rmSync(outDir, { recursive: true, force: true });
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  server.listen(port, '127.0.0.1', () => {
    console.log(`Asset viewer:      http://127.0.0.1:${port}/`);
    console.log(`Obstacle gallery:  http://127.0.0.1:${port}/obstacles`);
    console.log(`Cinematic piston:  http://127.0.0.1:${port}/piston`);
    console.log(`Cinematic gate:    http://127.0.0.1:${port}/gate`);
    console.log(`Cinematic shutter: http://127.0.0.1:${port}/shutter`);
    console.log(`Cinematic elevator: http://127.0.0.1:${port}/elevator`);
    console.log(`Cinematic scissor:  http://127.0.0.1:${port}/scissor`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
