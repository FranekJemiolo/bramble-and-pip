# Visual Invariant Guardrails for Bramble & Pip

These rules govern every visual asset, sprite, tileset, and render pipeline in Bramble & Pip.

## Resolution & Grid
- **Base virtual display resolution:** strictly $320 \times 288$ (2× Game Boy integer scale).
- **Tile units:** strictly $16 \times 16$ or $32 \times 32$ pixels.
- **Character frames:** fit within a $48 \times 48$ bounding box.
- **Zero "mixels":** All on-screen assets must share the identical native pixel scale. No floating-point scales or subpixel offsets.

## Color Palette Enforcement
- Every asset must clamp to the 16-color **"Whispering Woods"** master palette.
- Never allow soft gradients, airbrushing, or anti-aliased edge halos.
- Enforce binary alpha (alpha is either 0 or 255; no semi-transparent halos).
- Contrast must remain gentle; luminance deltas between adjacent terrain tiles cannot exceed 35%.

## Perspective & Lighting
- Top-down oblique perspective (3/4 top-down, classic 16-bit RPG angle).
- Light source is uniformly top-left, casting short, soft downward shadows.
- Flashlight cone is 60° radial sector extending 96px with 3-tier concentric Bayer dither.

## Kinetic Pacing
- Walk cycle: 6 fps (4-frame cycle: Contact, Pass, Contact, Pass).
- Pip hop: 8 fps.
- Zero screen-shake or sudden strobe flashes.
