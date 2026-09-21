# Late-world visual pass — 2026-09-20

Nebula, Ancient Network and Homeward now combine original illustrated distant environments with scene-owned Three.js foreground kits. All 15 levels in each world use the corresponding environment. No changes to physics, collisions, save records, rewards or level difficulty.

- Nebula: gas filaments and mineral backdrop, clustered five-sided crystal growths on eroded parent rocks, a distant broken relay. Replaces opaque cloud spheres and isolated octahedrons.
- Network: engraved observatory backdrop, beveled/recessed monoliths, inscribed trim, segmented astrolabe and conduits. Shifting aperture plates gain carved surface/bump detail; the animated safe edge remains authoritative.
- Homeward: branching bioluminescent habitat backdrop, reef-like growths with veins and leaves, irregular floating bases and living lights. Removes the simple repeated overhead hoop canopy.
- Phase fields now show filament energy, keep the blocked-state cross, and fully remove the filled surface while passable.
- Moon dressing also reuses irregular cratered rock geometry in place of low-detail icosahedrons.

Distant artwork is three 1536×1024 JPEGs (~1.1 MB total), loaded for the active world. Portrait/landscape cover crops retain proportions. Static foreground meshes are merged by material (4–6 scene draw calls including the backdrop; excludes gameplay and ambient effects). Lower-detail versions of the asteroid geometry are used for distant bases. Backdrops use native Expo GL file-pixel loading and web TextureLoader. Scene disposal frees loaded textures and discards late async loads.

Validation: typecheck, 127 tests, campaign audit, browser gameplay-camera previews of L106/L121/L136 in portrait and Homeward in landscape, no browser console errors. Added finite-geometry/draw-budget and async-disposal tests. Native image loading and performance require iPhone confirmation; browser verification does not establish native frame rate.

Follow-up: the identified Sky, Moon, shared blocker, Luma foreground and portal improvements are implemented in [Graphics finish pass](GRAPHICS-FINISH-PASS.md). The follow-up removes the floating Luma bases described above. Device review remains outstanding. No Expo builds or submissions run.
