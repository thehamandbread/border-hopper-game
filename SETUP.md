# Project Setup Instructions (for Claude Code)

You are setting up a new 2D browser game project. Follow every phase in order. After each phase, report what you did and what you found. **Stop and ask the user** whenever a step needs `sudo`, a login, a browser, or a decision. Never run `sudo` yourself; print the exact command and let the user run it.

## Project facts

- Engine: **Phaser 4** (NOT Phaser 3). Phaser 3 APIs such as FX pipelines, the old pipeline system, and v3-style masks must not be used. Phaser 4 replaced them with render nodes and a unified Filter system.
- Language: JavaScript, bundled with Vite.
- Targets: desktop browsers on Linux, ChromeOS (Chromebooks), and macOS.
- Hosting: GitHub Pages, deployed with GitHub Actions.
- The user edits in VS Code and works with you from the VS Code terminal.

---

## Phase 1: Check the tools

Run and report the versions of:

- `node --version` (need the current LTS or at least v20)
- `npm --version`
- `git --version`
- `gh --version` (GitHub CLI)
- `code --version` (confirm this is regular VS Code, not the WPILib/FRC copy; if `code` points to the WPILib install, tell the user)

For anything missing or outdated, detect the Linux distro (`cat /etc/os-release`) and give the user the exact install command for that distro. Wait for them to confirm before continuing.

Check the git identity with `git config --global user.name` and `git config --global user.email`. If either is empty, ask the user for the value and set it.

## Phase 2: Connect GitHub

1. Run `gh auth status`.
2. If not logged in, tell the user to run `gh auth login` themselves (it is interactive and opens a browser). Recommend: GitHub.com, HTTPS, "Login with a web browser", and "yes" to authenticating Git with GitHub credentials.
3. Once they confirm, run `gh auth status` again to verify.

## Phase 3: Create the project

Work in the current folder. Leave SETUP.md in place.

1. Scaffold Vite without interactive prompts:
   `npm create vite@latest game -- --template vanilla`
   Then move the contents of `game/` into the current folder and delete `game/`. If the create command still prompts, stop and tell the user.
2. Install Phaser 4: `npm install phaser@^4`
3. Confirm the installed version with `npm ls phaser`. It must be 4.x.
4. Replace the Vite demo code with a minimal Phaser 4 game:
   - `src/main.js` creates a `Phaser.Game` with `Phaser.AUTO`, an 800x600 base size, `scale.mode: Phaser.Scale.FIT`, `scale.autoCenter: Phaser.Scale.CENTER_BOTH`, `pixelArt: true`, and a single scene.
   - `src/scenes/BootScene.js` shows centered text reading "Game setup OK".
   - Clean `index.html` and the CSS down to a full-window black page with the canvas centered.
5. Create `vite.config.js` with `base: './'` so the build works on GitHub Pages at any repo path.
6. Run `npm run build`. It must succeed. Then tell the user to run `npm run dev` and open the URL to confirm the text appears.

Create these folders:

```
src/scenes/
src/objects/
src/systems/
public/assets/images/
public/assets/audio/
public/assets/data/
docs/
```

Create `docs/GAME_DESIGN.md` with only a title line: `# Game Design Document`.

## Phase 4: Install skills

### 4a. Official Phaser 4 skills (primary)

Phaser 4 ships agent skills in a `skills/` folder.

1. Check `node_modules/phaser/skills/`.
2. If it isn't there, clone the Phaser repo shallowly into a temp folder (`git clone --depth 1 https://github.com/phaserjs/phaser.git /tmp/phaser-src`) and look for `skills/` there.
3. Copy each skill folder into `.claude/skills/` in this project. Each skill folder must contain a `SKILL.md`.
4. List every skill you installed with a one-line description.

### 4b. Game-dev skill collection (secondary)

This third-party collection targets Phaser 3 for engine-specific material. Its discipline skills (dialogue, save systems, game AI, procedural generation, audio) are the valuable part.

1. Before installing, fetch and read the repo's README and `router/SKILL.md` at https://github.com/gamedev-skills/awesome-gamedev-agent-skills. Report anything that runs scripts, makes network calls, or looks unsafe. Continue only if the user approves.
2. Tell the user to run these commands in a separate terminal, or run them yourself if the user approves:
   ```
   claude plugin marketplace add gamedev-skills/awesome-gamedev-agent-skills
   claude plugin install router@awesome-gamedev-agent-skills
   claude plugin install web-engines@awesome-gamedev-agent-skills
   ```
   If those plugin names fail, run `claude plugin marketplace list` or check the repo's `docs/INSTALLATION.md` for the correct names, then report back.
3. Note that plugins may need a Claude Code restart to load.

### Conflict rule

When a Phaser 3-era skill conflicts with the official Phaser 4 skills or Phaser 4 documentation, **Phaser 4 wins.**

## Phase 5: CLAUDE.md

Run `/init` if CLAUDE.md doesn't exist yet, or create it directly. It must contain:

- Everything under "Project facts" above.
- The skill conflict rule from Phase 4.
- Folder layout and what goes in each folder.
- Commands: `npm run dev`, `npm run build`, `npm run preview`.
- Workflow rules:
  - `docs/GAME_DESIGN.md` is the source of truth for design. Read it before building features. Don't invent design decisions; ask.
  - Make small, focused changes. Explain the plan before large changes.
  - Run `npm run build` after changes to confirm nothing broke.
  - Commit after each working feature with a clear message. Never force-push.
  - Assets go in `public/assets/`. Never hotlink images or audio from the internet.
  - Keep performance reasonable for low-end Chromebooks: avoid huge textures, and cap particle counts.

## Phase 6: Git and GitHub Pages

1. Create a `.gitignore` covering `node_modules/`, `dist/`, `.DS_Store`, and `*.log`.
2. `git init`, `git add .`, then commit with the message `Initial Phaser 4 setup`.
3. Ask the user for a repo name and whether it should be public or private. Note that GitHub Pages on a free account requires a **public** repo.
4. Create and push the repo: `gh repo create <name> --<public|private> --source=. --push`
5. Create `.github/workflows/deploy.yml`, a GitHub Actions workflow that runs on pushes to `main` and does the following:
   - checks out the code
   - sets up Node LTS with npm caching
   - runs `npm ci` and `npm run build`
   - uploads `dist/` with `actions/upload-pages-artifact`
   - deploys with `actions/deploy-pages`
   - sets permissions `pages: write` and `id-token: write`
6. Commit and push the workflow.
7. Tell the user to open the repo on GitHub, go to **Settings → Pages**, and set **Source** to **GitHub Actions**. Then check the Actions tab for the run and give the user the resulting Pages URL (`https://<username>.github.io/<repo>/`).

## Phase 7: Final report

Give the user:

- A checklist of every phase: done, skipped, or needs action.
- The installed skills and plugins.
- The live GitHub Pages URL, or what is blocking it.
- Anything they still need to do manually.

Do not start building game features. That comes next, from `docs/GAME_DESIGN.md`.
