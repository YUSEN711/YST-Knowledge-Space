# YST Knowledge Space

A React 19 + Vite + TypeScript knowledge management app, powered by Google Gemini AI. Deployed to GitHub Pages via GitHub Actions.

## Tech Stack

| Tool | Version |
|------|---------|
| React | ^19 |
| Vite | ^6 |
| TypeScript | ~5.8 |
| @google/genai | ^1.41 |
| lucide-react | ^0.564 |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/YST-Knowledge-Space.git
cd YST-Knowledge-Space
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root (never commit this):

```bash
cp .env.example .env   # if example exists, otherwise create manually
```

`.env` content:

```
GEMINI_API_KEY=your_gemini_api_key_here
VITE_ADMIN_PASSWORD=your_admin_password_here
```

### 4. Start the dev server

```bash
npm run dev
# → http://localhost:3000/YST-Knowledge-Space/
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 3000) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
| `npm run deploy` | Manual deploy via `gh-pages` |

---

## Deployment

### Automated — GitHub Actions (recommended)

On every push to `main`, the workflow at `.github/workflows/deploy.yml` will:

1. Install dependencies (`npm ci`)
2. Build the app (`npm run build`)
3. Deploy `dist/` to GitHub Pages automatically

**Setup steps:**

1. Go to your repo → **Settings** → **Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Add your secret: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - Name: `GEMINI_API_KEY`
   - Value: your actual API key
4. Push to `main` — the action will trigger automatically
5. You can also trigger it manually from **Actions** → **Deploy to GitHub Pages** → **Run workflow**

### Manual deploy

```bash
npm run deploy
```

This runs `vite build` then pushes `dist/` to the `gh-pages` branch via the `gh-pages` package.

---

## Project Structure

```
.
├── .github/workflows/deploy.yml  # CI/CD pipeline
├── components/                   # React components
├── services/                     # API / service layer
├── App.tsx                       # Root component
├── index.tsx                     # Entry point
├── constants.ts                  # App-wide constants
├── types.ts                      # TypeScript types
├── vite.config.ts                # Vite config (base path, env)
└── .env                          # Local secrets (gitignored)
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Push and open a Pull Request
