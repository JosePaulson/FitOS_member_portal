# FitOS Member Portal

A separate mobile-first React app for gym members. Runs on **port 5174** alongside the gym admin app (port 5173) and shares the same Express backend (port 5000).

---

## Features

| Page         | What members can do                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Home**     | View membership status, expiry countdown, monthly check-in bar chart, quick links                                     |
| **Plans**    | See current plan with progress bar + all gym plans with pricing                                                       |
| **Billing**  | Full invoice history, per-invoice receipt with GST breakdown                                                          |
| **Workouts** | View assigned workout plans (exercises, sets, reps), diet plans (meals, macros), PT session history + remaining count |
| **Profile**  | Attendance calendar with streak counter, change PIN, sign out                                                         |

---

## Quick start

```bash
cd fitos-member-portal
npm install
npm run dev
# → http://localhost:5174
```

The backend must be running on port 5000 (Vite proxies `/api` automatically).

---

## How member login works

Members log in with:

1. **Gym ID** — the gym's subdomain (e.g. `ironzone` for `ironzone.fitos.in`)
2. **Phone number** — the one on file at the gym
3. **PIN** — a 4–6 digit PIN set by gym staff

### Setting up a member's PIN (gym staff)

In the gym admin dashboard → **Members** → find the member → click **Set PIN**.
Enter a temporary PIN and share it with the member. They can change it in their **Profile** page.

### API route used

```
POST /api/member-portal/auth/set-pin
Body: { memberId, gymId, pin }
```

This endpoint is unprotected so staff can call it from the gym admin — in production you should add staff auth middleware here.

---

## Architecture

```
Member logs in
  → POST /api/member-portal/auth/login  { subdomain, phone, pin }
  ← { accessToken, refreshToken, member, gym }

All data routes require Bearer token (MEMBER_JWT_SECRET)
  GET /api/member-portal/me
  GET /api/member-portal/plans
  GET /api/member-portal/invoices
  GET /api/member-portal/attendance
  GET /api/member-portal/pt-sessions
  GET /api/member-portal/workout-plans
  GET /api/member-portal/diet-plans
```

Member tokens are signed with **MEMBER_JWT_SECRET** (separate from staff JWT_SECRET), so a member token cannot be used to access any staff/admin route.

---

## Deployment

Deploy as a separate static site (Vercel, Netlify, or S3+CloudFront):

```bash
VITE_API_URL=https://api.fitos.in/api npm run build
# Upload dist/ to your static host
```

Suggested domain: `members.fitos.in` or `app.fitos.in`
