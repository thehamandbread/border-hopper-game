# Prototype art generator

`make_sample_art.py` generates the prototype sprites and tiles. Edit the script and regenerate; don't hand-edit the PNGs.

## Run

Needs Pillow (`pip install Pillow`, or `sudo apt install python3-pil` on Debian/Ubuntu).

```
python3 tools/art/make_sample_art.py
```

Works from any working directory.

## Output

- `public/assets/images/mateo_walk.png` and `border_tiles.png`: the game assets (committed).
- `tools/art/previews/`: preview PNGs and a walk GIF for inspection (git-ignored).
