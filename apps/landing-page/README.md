# FormFully landing page

The public FormFully website is a React, Vite, Tailwind CSS, and strict TypeScript workspace application.

Run commands from the repository root:

```bash
pnpm install
pnpm dev:landing
pnpm build:landing
pnpm --filter @formfully/landing-page lint
```

The Vite base path remains `/FormFully/` for the existing GitHub Pages URL. Managed Sites metadata is stored in `.openai/hosting.json`, and `pnpm build:sites` prepares the compatible worker output.
