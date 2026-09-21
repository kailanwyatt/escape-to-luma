# Luma finale — approved two-page revision

## Presentation
- Dedicated `FinaleScreen.tsx`; the earlier LumaCompletionScreen and LumaCelebration were removed.
- Page 1: supplied `assets/art/worlds/finale.png`, a gathering of 16 independently rendered smiling Sparks, “You made it.” and NEXT.
- Page 2: `assets/art/worlds/finale-voyage.png`, a 13-Spark travelling formation with trails, “Now we travel together.” and EXPLORE TOGETHER.
- The large lead Spark uses the equipped campaign Spark colour. Other Sparks use cyan, gold, pink, purple and turquoise.
- Body copy types out in reserved space; tapping reveals it. NEXT is available immediately. Page dots support returning to page one. No automatic page changes.
- Story/reward cards, the generic story header and the HOME AT LAST action have been removed from the finale.

## Layered art and motion
`FinaleScene.tsx` clips each character from a six-character transparent RGBA atlas, with a separate pulsing halo and gentle floating transform. No characters are baked into either background. The neutral pearl character provides the equipped-colour lead.

Glowing scene points use coordinates tied to the uncropped artwork. Four shooting stars share one flight clock and travel in formation, then return at alternating intervals of about 6–9 seconds. Animation stops while backgrounded, stops on unmount and becomes static with Reduce Motion. Body text remains fully readable in Reduce Motion or with a screen reader.

## Layout
The art fills the screen and continues behind a dark lower text gradient. The illustrated foreground is framed above the measured copy. Landscape phones, tablets and desktop use a wider art-and-copy composition. Safe areas are respected; large accessibility text can scroll within the copy region.

## Progression
The UI grants no rewards. The existing campaign completion remains authoritative. EXPLORE TOGETHER acknowledges the final reunion, clears pending ending presentation and starts Endless Voyage directly at READY. The game method rejects repeated calls after the session changes to endless.

Settings → Development → Preview Luma Ending opens the two pages using the equipped colour without granting campaign rewards. The preview has a close control; its Explore action starts an actual Endless Voyage without fabricating campaign completion.

## Artwork provenance
Built-in image-generation mode was used. User-supplied finale.png is retained unchanged.

### Second background prompt
Use case: stylized-concept. Create a polished portrait 2:3 background artwork for page two of a mobile game ending. Input image 1 is the exact visual world/style reference; input image 2 is a two-page layout reference, emulate the RIGHT PAGE environment only. Luma is a magnificent luminous world of floating islands, delicate golden bridges, luminous waterfalls, trees with gold filigree branches, blue-violet starfields, soft peach clouds. A graceful winding golden/cyan road leads from the LOWER LEFT foreground, curves up through the middle-right around floating islands and reaches a radiant spiral galaxy / golden beacon in the upper middle. The scene should feel like a journey opening to infinity. Rich 3D cinematic illustration, matching the detail and colors of input 1. The lower 25 percent has darker softly defocused foliage and blue shadow where we will place UI. Absolutely NO characters, NO orbs, NO faces, NO Spark figures, no text, no UI, no buttons, no frame. We will animate individual characters separately along the route. Full bleed, no border.

### Transparent Spark atlas prompt
Use case: stylized-concept. Asset type: transparent game sprite atlas, 3 columns by 2 rows, six smiling Spark characters separately spaced. Reference image: smiling energy spheres in the supplied ending mockup. Generate a 1536x1024 TRANSPARENT RGBA image, 3x2 equal square cells, each sprite centered in its own 512x512 cell with ample transparent padding, no overlap. Top row: cyan blue, warm gold, bright pink; bottom row: violet purple, mint turquoise, neutral pearl WHITE/grey (no color). All six are the same character design: a beautiful luminous translucent energy sphere, dimensional glassy light body with swirling internal luminous texture, delighted CLOSED curved eyes and tiny smiling mouth glowing WHITE, vibrant bright rim, subtle halo with fade to full transparency, little glints. NO orbital rings, limbs, objects, bases, shadows on floors, backgrounds, frames, labels, writing, panels, checkered pattern. Spheres fill 68 percent of each cell, glow within 90 percent. Similar to a high-end 3D animated-film living light, adorable but refined. The pearl sixth character should use only white and grey so it can be used for additional player colours.

## Validation
TypeScript passed, together with all 28 targeted campaign, story, translation, save and Voyage tests. Browser visual verification is blocked because the browser tool cannot verify its admin-enforced security policy for localhost:8088. No alternate browser or bypass was used. Final on-phone composition, motion and native performance remain for device review. No build or submission was run.
