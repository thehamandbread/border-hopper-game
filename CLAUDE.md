# Border Hopper

## Project facts

- Engine: **Phaser 4** (NOT Phaser 3). Phaser 3 APIs such as FX pipelines, the old pipeline system, and v3-style masks must not be used. Phaser 4 replaced them with render nodes and a unified Filter system.
- Language: JavaScript, bundled with Vite.
- Targets: desktop browsers on Linux, ChromeOS (Chromebooks), and macOS.
- Hosting: GitHub Pages, deployed with GitHub Actions.
- The user edits in VS Code and works with Claude from the VS Code terminal.

## Skills

- Official Phaser 4 skills live in `.claude/skills/` (copied from `node_modules/phaser/skills/`). Use them for all engine API questions.
- Third-party plugins `router` and `disciplines` (from `awesome-gamedev-agent-skills`) provide engine-agnostic guidance: dialogue, save systems, game AI, procedural generation, audio, etc.
- **Conflict rule:** when a Phaser 3-era skill conflicts with the official Phaser 4 skills or Phaser 4 documentation, **Phaser 4 wins.**

## Folder layout

```
src/main.js          Phaser.Game config and entry point
src/scenes/          Scene classes (BootScene, menus, levels)
src/objects/         Custom game objects (player, enemies, pickups)
src/systems/         Reusable logic (input, save, dialogue, AI)
public/assets/images/  Sprites, tilesets, backgrounds
public/assets/audio/   Music and sound effects
public/assets/data/    JSON data (levels, dialogue, config)
docs/                Design docs; GAME_DESIGN.md is the source of truth
.claude/skills/      Official Phaser 4 agent skills
.github/workflows/   GitHub Pages deploy workflow
```

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally

## Workflow rules

- `docs/GAME_DESIGN.md` is the source of truth for design. Read it before building features. Don't invent design decisions; ask.
- Make small, focused changes. Explain the plan before large changes.
- Run `npm run build` after changes to confirm nothing broke.
- Commit after each working feature with a clear message. Never force-push.
- Assets go in `public/assets/`. Never hotlink images or audio from the internet.
- Keep performance reasonable for low-end Chromebooks: avoid huge textures, and cap particle counts.
