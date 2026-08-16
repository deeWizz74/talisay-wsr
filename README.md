# Talisay Stake — Know Your Specialist

A directory app for the Talisay Stake Welfare & Self-Reliance (WSR) organization.
Visitors pick a ward from a dropdown and see everyone's name, photo, and Messenger
contact, laid out as a connected org chart. An admin account (no public sign-up)
can edit names, upload photos, and set Messenger/phone/email info for anyone,
live, from the browser.

Built with Next.js (App Router), TypeScript, Tailwind CSS, and shadcn/ui.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. On first admin login attempt, a random admin
password is printed once in the terminal — copy it before it scrolls away. Log
in at `/admin/login` and use **Change password** to set your own.

## Data

Everyone's info lives in `data/directory.json`, edited entirely through the
admin UI. Uploaded photos are saved to `public/uploads/`.

## Deploying so the whole stake can use it (Render, free)

This app writes real data to disk (`data/directory.json`, uploaded photos, the
admin password), so it needs somewhere that keeps the Next.js server running
and persists that state — not a purely serverless host like Vercel. Render's
free tier works and needs no credit card, with one caveat: **redeploying the
app resets its disk** back to whatever was last committed to GitHub, wiping
any photos or edits made through the admin UI since then. Two things guard
against that:

- **Download backup** in the admin dashboard exports the current data as a
  JSON file at any time — do this occasionally, and definitely right before
  you ask me to push a code update.
- The admin login itself won't reset, because you'll set it via environment
  variables (below), not the auto-generated one that lives on disk.

### 1. Push this repo to GitHub

Create a new **empty** repository at [github.com/new](https://github.com/new)
(no README/license — this project already has one), then run:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Git may open a browser window to sign you in the first time — that's normal.

### 2. Create the Render web service

1. Go to [render.com](https://render.com) and sign up (free, no card required).
2. **New +** → **Web Service** → connect the GitHub repo you just pushed.
3. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Under **Environment**, add:
   - `ADMIN_USER` — the admin username you want (e.g. `admin`)
   - `ADMIN_PASS` — a real password you choose (this becomes the permanent
     login, immune to disk resets — pick it carefully, you won't see it
     printed anywhere)
5. **Create Web Service.** First deploy takes a few minutes.

Render gives you a URL like `https://talisay-wsr-next.onrender.com` — that's
the link to share with the stake. The free tier sleeps after 15 minutes of
inactivity, so the first visit after a quiet stretch takes ~30–60 seconds to
wake up; after that it's fast again.

### Updating the live site later

Whenever you want me to ship a change: I commit it, you `git push`, and
Render redeploys automatically. **Download a backup first** if there have
been photo uploads or edits since the last one — the redeploy will reset the
disk to match GitHub.
