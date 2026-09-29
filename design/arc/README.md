# ARC — 3D model

A parametric model of 7on ARC, built entirely by `build_arc.py` from the
published dimensions and reference photos. Change a number, rebuild, and
every file below is regenerated.

| File | What it is |
|---|---|
| `build_arc.py` | The model: geometry, materials, studio and cameras |
| `arc.blend` | Blender scene, ready for animation or KeyShot export |
| `arc.glb` | Web / AR model (glTF, real size in metres: 55 mm across) |
| `arc_screen.png` | The screen: dark glass with the red orb from the page |
| `arc_engraving.png` | The laser-engraving mask (the 7on mark, light, with alpha) |
| `renders/arc-*.png` | Transparent renders; `*-on-light.png` on the page colour `#faf8f6`. `arc-macro` is the close-up: dark studio, resting on a table, shallow focus |

## Rebuild

```bash
python3.11 -m venv .venv && .venv/bin/pip install bpy==4.5.4   # or use Blender 4.5
.venv/bin/python build_arc.py                  # full quality (~21 min on 4 CPU cores)
.venv/bin/python build_arc.py --preview        # quick check (~3 min)
.venv/bin/python build_arc.py --only=hero,macro  # just those views
.venv/bin/python build_arc.py --export-only    # just arc.blend and arc.glb
```

Changing a colour or the finish only needs the renders again, not the
geometry: `--only=macro` redoes the close-up in about 9 minutes, `--preview`
shows the look at half size in under a minute per view.

With the Blender app instead: `blender -b -P build_arc.py`.

## What is measured, what is estimated

**From the dimension drawing:** body Ø55.00, glass Ø48.96, display Ø43.76,
thickness 15.05 mm.

**Estimated from the photos** (check against a real unit before production
renders):

- The side profile (`BODY_PROFILE`, `BACK_PROFILE`) — widest at mid-height,
  back cover split about 2.6 mm from the bottom.
- Where each part sits on the rim (`FEATURES`), as angles clockwise from 12
  o'clock looking at the screen: PWR 50°, lanyard holes 349° and 0°,
  microphones 328° and 210°, speaker grille 94°, BOOT 132°, USB-C 183°.
- Sizes of the buttons, holes and the USB-C cover.
- Three small dimples on the back cover (`BACK_DIMPLES`).

## Finish

Machined, not computer-perfect — `brushed()` in the script:

- **Body:** brushed anodised aluminium, silver. Fine lines run around the rim
  (12 per mm, plus a finer set), each with its own depth; now and then a
  deeper tool mark; the lines fade in and out along their length as the brush
  wears; and large, soft patches of slightly different sheen across the part.
  Reflections stretch across the lines, as they do on real brushed metal.
- **Back cover:** the same aluminium, spun on a lathe — concentric rings.
- **Buttons:** brushed along their length, finer and brighter.
- **USB-C cover:** grey silicone.
- **Back:** the 7on mark (`public/logo.png`), laser-engraved at 17 mm wide —
  the anodising is burnt away, leaving a lighter, matte mark.

To tune it, change the numbers passed to `brushed()` in `build()`: `lines`
(lines per mm), `bump` (how deep they read), `variation` (how uneven the
sheen is), `tint` (how much each line differs in tone), `aniso` (how far reflections stretch). The lines are about 0.08 mm
apart, so they read as texture in the close-up and as a soft, stretched sheen
in the full-product shots — as on a real part.

The web model (`arc.glb`) gets plain metal of the same colour and average
roughness: glTF can't carry a procedural texture.

## Lighting

Two studio moods (`MOODS`), chosen per view:

- **light** — bright above, for the page: silver metal on `#faf8f6`.
- **dark** — a dark studio over a white table: grey metal with bright bands,
  black glass. Used for the macro.

## Using it

- **Stills:** the transparent renders drop straight onto any background.
- **Video:** open `arc.blend`, animate the `7on ARC` empty (everything is
  parented to it), render with Cycles — a GPU makes 4K practical.
- **Web:** `arc.glb` works with `<model-viewer>` or three.js — checked in
  three.js: real size, screen and engraving show. glTF is Y-up, so the screen
  faces +Y there.
