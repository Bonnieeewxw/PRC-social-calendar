# PRC Social Calendar

A GitHub Pages-ready social calendar app for PRC organic social planning.

It includes:
- Team realtime editing through Supabase Realtime
- Month calendar with post cards and platform color badges
- Monthly priorities and upcoming campaign/event panel
- Campaign/Event management
- Create, edit, delete, and drag-to-reschedule posts
- Excel export with all post details, links, campaigns, and monthly planning
- FY27 Operation Calendar seed data

## 1. Quick local preview

```bash
npm install
npm run dev
```

Without Supabase environment variables, the app runs in local demo mode using the included FY27 seed data. Edits are stored only in your browser.

## 2. Enable team realtime editing

GitHub Pages is static, so realtime team editing requires a backend. This package uses Supabase because it supports hosted Postgres and realtime subscriptions.

### Create Supabase project
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. In Supabase Settings > API, copy:
   - Project URL
   - anon public key

### Add GitHub repository secrets
In your GitHub repo:
- Settings > Secrets and variables > Actions > New repository secret
- Add:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - Optional: `VITE_REQUIRE_AUTH=false`

### Seed FY27 data
After deployment, open the app and click **Load FY27 seed** once. This writes the included FY27 calendar data to Supabase.

## 3. Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to Settings > Pages.
3. Source: GitHub Actions.
4. Push to `main` or run the `Deploy to GitHub Pages` workflow manually.

## 4. Team usage

- Share the GitHub Pages URL with the PRC team.
- Everyone edits in the app UI.
- Changes sync in realtime across open browsers when Supabase is configured.

## 5. Data model

### posts
- publish_date
- title
- platforms
- owner
- csa
- objective
- source_category
- campaign
- status
- link
- notes

### campaigns
- title
- start_date
- end_date
- type
- notes

### monthly_plans
- month
- focus
- priorities
- events
- source_counts
- outcome_counts

## 6. Security note

The default SQL policy is open for demo convenience. For production, replace the demo policies with authenticated-only policies and configure Supabase Auth / Microsoft Entra ID.
