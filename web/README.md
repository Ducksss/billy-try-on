# Billy web app

The Next.js app contains Billy's landing page, try-on Studio, fictional catalogue, ÉTAGE demo store, optional live mirror and provider API routes.

Start with the [project README](../README.md) for features, screenshots and extension installation, or the [development guide](../docs/DEVELOPMENT.md) for configuration, API details, tests and deployment.

From this directory:

```sh
npm ci
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local before running a live try-on.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Committed demo photos and the landing page's pre-rendered examples work without an API key. Live generation spends provider credits.

```sh
npm run lint
npm run build
```

Run the Chrome extension tests from the repository root with the development server running: `npm run test:extension -- --skip-generate`.
