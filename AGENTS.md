# Project Rules & Operational Directives

## Production Deployments (Vercel & Live URL)
- The user tests and operates exclusively on `https://riane-portfolio-one.vercel.app/`.
- Pushing to GitHub (`origin main`) alone does NOT trigger Vercel auto-deployments for this project.
- You MUST ALWAYS execute `npx -y vercel deploy --prod --yes` directly in `/Users/richard/Developer/riane-portfolio` after every code change.
- Never claim a change is live until `npx vercel deploy --prod --yes` completes with `▲ Aliased https://riane-portfolio-one.vercel.app`.

## Bank Detection Rules
- When 0 bank transactions are detected for a category (PEA, Livret A, Revolut), default percentage and detected amount MUST strictly be `0` (never synthetic hardcoded percentages like 35% or 7%).
- Monthly flows over multi-month periods MUST strictly compute the monthly average (`total / (periodDays / 30.4375)`), never a raw multi-month sum.
