# Bitmap font tools

`make_bitmap_font.py` converts `source/PixelOperator8.ttf` into a Phaser bitmap font. Edit the script and regenerate; don't hand-edit the outputs.

## Run

Needs Pillow (`pip install Pillow`, or `sudo apt install python3-pil` on Debian/Ubuntu).

```
python3 tools/fonts/make_bitmap_font.py
```

Works from any working directory. It prints any requested characters the font doesn't contain.

## Output (committed, in `public/assets/fonts/`)

- `pixel_operator_8.png`: glyph atlas, white on transparent so text can be tinted in game. Rendered at the native 8 px with antialiasing off.
- `pixel_operator_8.xml`: AngelCode BMFont XML descriptor, loaded with `this.load.bitmapFont`.

Characters: printable ASCII plus `á é í ó ú Á É Í Ó Ú ñ Ñ ü Ü ¿ ¡`.

In game, create text with `pixelText()` from `src/systems/pixelText.js`. Use 8 px or integer multiples (16, 24...) to keep edges crisp.

## Font source and license

Pixel Operator by Jayvee Enaguas. Licensed CC0 1.0 (public domain dedication). The TTF is kept in `source/PixelOperator8.ttf`.
