# Web test deploy

Static SPA export for online playtesting (story / art WIP).

## Build + zip

```bash
npm run zip:web
```

Creates `aperture-web-test.zip` from `dist/`.

Or:

```bash
npm run build:web
# then upload the dist/ folder, or:
cd dist && zip -r ../aperture-web-test.zip .
```

## Host

Upload **the contents** of the zip (or `dist/`) to any static host:

- Netlify / Cloudflare Pages / Vercel / S3 / nginx — publish directory = unzipped root (`index.html` at top level)
- Local smoke test: `npx serve dist`

### Subfolder (LAMP / `/game2/`)

This project is configured for:

```text
https://game.kailanwyatt.com/game2/
```

via `experiments.baseUrl: "/game2"` in `app.json`.

1. Rebuild + zip: `npm run zip:web`
2. Upload zip contents into the `game2/` folder on the server
3. Keep `_expo/` and `assets/` beside `index.html`

If you move it to a different path later, change `baseUrl` to that path (leading slash, no trailing slash) and rebuild.

## Notes

- Portrait arcade loop; best on phone browser or narrow desktop window
- WebGL required (`expo-gl` + three.js)
- Ads/IAP are simulated; fine for playtest
- Prototype art labels remain on purpose
