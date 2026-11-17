# EDGE OF SURVIVAL
> **Face the crisis. Unlock the secrets and protect the kingdom.**  
> *Presented by Abad, Chua, Napiza — Edge Computing & Edge AI*

An interactive **2.5D isometric/angled-camera browser game** built with **React 19, TypeScript, Vite, Tailwind CSS, and Three.js (`@react-three/fiber` & `@react-three/drei`)**, paired with an optional **Node.js + Express + Socket.io + Prisma (SQLite)** live classroom leaderboard server.

---

## Architecture & Repository Structure

```text
edge-of-survival/
├── .github/workflows/
│   └── deploy-pages.yml      # Automated GitHub Pages build & deploy
├── client/                   # 2.5D React + Three.js Frontend (Vite base: './')
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameWorld25D.tsx
│   │   │   ├── HUD.tsx
│   │   │   ├── TitleScreen.tsx
│   │   │   ├── CodexModal.tsx
│   │   │   ├── LeaderboardModal.tsx
│   │   │   ├── VictoryModal.tsx
│   │   │   └── puzzles/      # Chapters 1–7, 9, 10 interactive mechanics
│   │   ├── data/chapters.ts  # All 12 chapters, PH Edge examples & citations
│   │   ├── services/
│   │   │   ├── AudioEngine.ts    # Procedural Web Audio API synthesizer
│   │   │   └── StorageService.ts # Live API + Socket.io + localStorage fallback
│   │   └── types/game.ts
│   ├── vite.config.ts
│   └── package.json
├── server/                   # Optional Live Leaderboard & Milestone Server
│   ├── prisma/schema.prisma  # Player, GameRun, CodexUnlock models
│   ├── src/index.ts          # Express + Socket.io + Prisma endpoints
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## Controls
- **Move John:** `W A S D` or `Arrow Keys` (or on-screen virtual joystick on mobile)
- **Interact:** `E` / `Space` near a glowing 3D pedestal, or **click any unlocked 3D pedestal directly**
- **Climax Defense:** Click red **Cyber Spoofing/Tampering** cubes in the 3D storm using Chapter 10 Security & Ethics shields, then trigger the sub-10ms **Sensor → Local Inference → Hydraulic Actuator** loop!

---

## Local Development

### 1. Frontend Only (GitHub Pages Static Mode)
```bash
cd client
npm install
npm run dev
```
Open the printed local URL. The game automatically uses `localStorage` for progress, Codex unlocks, and leaderboard rankings when no backend is configured.

### 2. Full-Stack Mode (With Live Classroom Leaderboard & Socket.io)
```bash
# Terminal 1 — Backend
cd server
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev

# Terminal 2 — Frontend pointing to local backend
cd client
VITE_API_URL=http://localhost:3001 npm run dev
```

---

## Deploying to GitHub & GitHub Pages

### Step 1: Initialize Git & Push to GitHub
Run these commands inside `/home/antigravity/edge-of-survival` (or your project root):

```bash
git init
git add .
git commit -m "feat: Edge of Survival 2.5D Edge Computing & Edge AI game"
git branch -M main

# Create and push the GitHub repository using GitHub CLI:
gh repo create edge-of-survival --public --source=. --remote=origin --push
```

*(If you prefer creating the repo manually on github.com, run `git remote add origin https://github.com/<username>/edge-of-survival.git && git push -u origin main` instead.)*

### Step 2: Enable GitHub Pages (Source: GitHub Actions)
1. Open your repository on GitHub: `https://github.com/<username>/edge-of-survival`
2. Go to **Settings** → **Pages** (in the left sidebar under *Code and automation*).
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Go to the **Actions** tab and verify the **Deploy Edge of Survival to GitHub Pages** workflow runs and succeeds (it triggers automatically on every push to `main`).
5. Once complete, your live 2.5D game will be playable for the whole class at:
   ```text
   https://<username>.github.io/edge-of-survival/
   ```

*(Optional)* If you host `/server` on Render, Railway, or Fly.io, add a Repository Variable named `VITE_API_URL` in **Settings → Secrets and variables → Actions → Variables** pointing to your server URL, and re-run the workflow.
