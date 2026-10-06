# Current Status

## Operating Posture

Revived on 2026-10-06 for the 2026 midterm (election day 2026-11-03). The September 4 review checkpoint was missed. A short sprint fixed data errors, refreshed every dataset, and added shareable matchup URLs with social preview images.

Open items after the sprint:

- statmerica.com served a parked "/lander" page on 2026-10-06. Only the vercel.app URL served the site.
- Set `NEXT_PUBLIC_SITE_URL` on Vercel once the custom domain points at the project.
- Data refresh is manual (`pnpm fetch:all`). No scheduled job exists yet.

## Why Reconsider It

The repo’s administration-comparison framing is likely to become more relevant as the 2026 U.S. election cycle becomes more active.

## Resume Note

Reconsider reviving this project in two checkpoints:

1. Start a serious review by **Friday, September 4, 2026**, when the FEC’s 60-day general-election communications period begins for the **Tuesday, November 3, 2026** federal general election.
2. If that window is missed, use **Tuesday, November 3, 2026** as the hard outer marker for deciding whether the project should be revived for the 2026 cycle at all.

If only one reminder survives, keep the September 4, 2026 date.

## Practical Reading

Until that review window, this project is best treated as:

- a strong homepage/data prototype
- a repo with reusable metric-fetching infrastructure
- a candidate for revival when election-season relevance is closer and easier to evaluate

## Source Notes

The dates above come from current FEC materials:

- The FEC lists the 2026 general election as **11/03/2026**.
- The FEC lists the 2026 general-election electioneering communications period as **09/04/2026 - 11/03/2026**.
