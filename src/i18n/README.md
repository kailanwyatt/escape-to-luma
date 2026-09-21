# English translation source

Edit `en.json` for interface copy, accessibility labels, story scenes, opening captions,
world names, cosmetic names/descriptions, tutorials and gameplay feedback.
`index.ts` exposes a typed `t(key, values)` lookup; no new runtime dependency is needed.
English is the only enabled language. This change does not add a language selector.

## Editing copy

- Keep keys stable even when changing wording. Reused copy may have a key named for its first screen.
- Preserve `{value1}`, `{points}` and other placeholders exactly; values come from real game state.
- `\n` means an intentional line break. Some existing styled text runs are separate entries;
  retain their leading/trailing spaces when applicable.
- Use `t('key', {value1: count})` for dynamic copy, rather than assembling new English strings.
- Use `displayLabel` at rendering boundaries for rank/filter labels. Never translate save keys,
  world IDs, phase names, obstacle types, shop product IDs or analytics events.

## Adding languages later

Create a matching locale JSON catalog and add locale selection/English fallback in `index.ts`.
Initialize the chosen locale before loading campaign/skin data: some names and story tables
are created at module load. A live language switch will require rebuilding those tables.
Add plural rules, locale-aware number formatting, RTL support and device layout checks with
the first additional language. Copy embedded in artwork is separate from this catalog.
