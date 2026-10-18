---
name: generate-sprite
description: Generates, cleans, and packages pixel-art spritesheets and tilesets. Use when creating characters, environmental tiles, or inventory items.
---

# Sprite Generation & Sanitization Workflow

When creating or modifying 2D sprites, tilesets, or UI elements for *Bramble & Pip*:

1. **Source Generation:**
   - Generate raw pixel-art frames against a `#FF00FF` magenta chroma-key background.
   - For characters, use top-down oblique view (3/4 angle) at $48 \times 48$ px.
   - For tiles, use $16 \times 16$ or $32 \times 32$ px.

2. **Programmatic Sanitization:**
   - Execute the asset processing script:
     ```bash
     node scripts/process-sprite.js --input=<raw_file.png> --output=<public/assets/processed.png>
     ```
   - This strips the magenta background to transparent alpha (`a = 0`), removes semi-transparent edge halos (`a = 255`), and clamps all color values to the nearest color in the 16-color "Whispering Woods" master palette.

3. **Palette Compliance Audit:**
   - Run the local art MCP audit tool or audit script:
     ```bash
     node -e "import('./scripts/art-pipeline-mcp.js')"
     ```
   - Ensure zero non-compliant pixels exist.

4. **Visual Inspection:**
   - Open `testbed.html` on the local preview server to verify that pixels align with the native $320 \times 288$ letterbox without mixels or edge bleed.
