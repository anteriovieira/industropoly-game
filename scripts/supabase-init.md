# Supabase setup

This project uses Supabase as a hosted backend (no local Docker stack). The CLI is used only for managing migrations.

## One-time, per developer

1. Install the Supabase CLI: `brew install supabase/tap/supabase` (macOS) or see https://supabase.com/docs/guides/cli/getting-started.
2. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the project dashboard (Project Settings → API).
3. Link the local repo to the cloud project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
   (You will be prompted for the database password.)

## Applying migrations

```bash
supabase db push
```
This applies any new migrations under `supabase/migrations/` to the linked cloud project.

## Inspecting the database

Use the Supabase Studio at https://supabase.com/dashboard/project/<your-project-ref>/editor.
