# Vision Glance

Build a clear, motivating life plan in minutes. Vision Glance helps you define what matters, turn it into actionable goals, and track progress without the clutter.

If this repo helps you, please star it on GitHub. It takes 2 seconds and helps a ton.

## What you get

- Fast setup for a Rails + React (Inertia) app
- Typed, modern frontend with a clean component system
- Auth, deployment, and optional SSR baked in

## Quick start

```bash
bin/setup
```

Then open http://localhost:3000

## Optional: enable SSR

1. Open `app/frontend/entrypoints/inertia.ts` and uncomment the SSR hydration block.
2. Open `config/deploy.yml` and uncomment the SSR settings (vite_ssr hosts, env vars, builder dockerfile).

## License

MIT
