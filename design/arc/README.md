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
| `renders/arc-*.png` | Transparent renders; `*-on-light.png` on the page colour `#faf8f6` |

## Rebuild

```bash
python3.11 -m venv .venv && .venv/bin/pip install bpy==4.5.4   # or use Blender 4.5
.venv/bin/python build_arc.py            # full quality (~10 min on 4 CPU cores)
.venv/bin/python build_arc.py --preview  # quick check (~2 min)
.venv/bin/python build_arc.py --export-only  # just arc.blend and arc.glb
```

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

- Body and back cover: bead-blasted anodised aluminium, silver.
- Buttons: polished aluminium. USB-C cover: grey silicone.
- Back: the 7on mark (`public/logo.png`), laser-engraved at 17 mm wide —
  the anodising is burnt away, leaving a lighter, matte mark.

## Using it

- **Stills:** the transparent renders drop straight onto any background.
- **Video:** open `arc.blend`, animate the `7on ARC` empty (everything is
  parented to it), render with Cycles — a GPU makes 4K practical.
- **Web:** `arc.glb` works with `<model-viewer>` or three.js. The engraving
  and screen travel as textures.
