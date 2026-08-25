# CraftBars Network

A full-stack Minecraft server website — Node.js, Express, EJS, and MongoDB (Mongoose) —
with a dark, red-accented UI and a working admin panel backed by MongoDB Atlas.

## Features

- **Home** — dark hero banner, live-style stat boxes (players online, Discord, votes), and an announcements feed pulled from MongoDB.
- **Rules** — sidebar-tabbed rules for Home / Minecraft / Discord, editable from the admin panel.
- **Vote** — grid of voting site links with reward callouts.
- **Store** — rank/package cards and a payment-method icon strip.
- **Admin Panel** (`/admin`) — session-protected login; create & delete announcements; edit rules per category. Everything writes straight to MongoDB Atlas.

## Tech Stack

- **Backend:** Node.js, Express.js, Mongoose, dotenv, express-session (+ connect-mongo for session persistence), method-override
- **Frontend:** EJS templates, hand-written CSS3 (no framework), Font Awesome icons, Google Fonts (Rajdhani + Inter)
- **Database:** MongoDB Atlas

## Project Structure

```
craftbars-network/
├── server.js               # Express app, routes, DB connection, admin auth
├── package.json
├── .env.example             # Copy to .env and fill in real values
├── models/
│   ├── Notice.js            # title, content, author, date, tag, pinned
│   └── Rule.js               # category (Home/Minecraft/Discord), rulesArray
├── public/
│   ├── css/style.css         # Full dark theme
│   └── js/main.js            # Nav toggle, IP copy, tab switching, delete confirm
└── views/
    ├── partials/
    │   ├── header.ejs        # <head>, navbar
    │   └── footer.ejs        # footer, closing tags, scripts
    ├── index.ejs              # Home / announcements
    ├── rules.ejs               # Rules with sidebar tabs
    ├── vote.ejs                 # Voting grid
    ├── store.ejs                 # Store packages
    ├── admin.ejs                  # Protected admin dashboard
    ├── admin-login.ejs             # Admin login form
    └── 404.ejs                     # Not-found page
```

## Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your real values:
   ```bash
   cp .env.example .env
   ```
   ```env
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/craftbars?retryWrites=true&w=majority
   PORT=3000
   SESSION_SECRET=some_long_random_string
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=a_strong_password
   NODE_ENV=development
   ```

3. **Get a MongoDB Atlas connection string**
   - Create a free cluster at https://www.mongodb.com/cloud/atlas
   - Database Access → add a user with a password
   - Network Access → allow access from `0.0.0.0/0` (or Render's IPs) so the deployed app can connect
   - Connect → Drivers → copy the `mongodb+srv://...` string into `MONGO_URI`

4. **Run the app**
   ```bash
   npm start
   # or, with auto-reload during development:
   npm run dev
   ```
   Visit `http://localhost:3000`.

5. **Log in to the admin panel**
   Go to `http://localhost:3000/admin` — you'll be redirected to `/admin/login`.
   Use the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set in `.env`.

On first boot, the server automatically **seeds default rules** for the Home,
Minecraft, and Discord categories if none exist yet, so the Rules page is never empty.

## Deploying to Render (24/7 Web Service)

1. Push this project to a GitHub repository.
2. In the Render dashboard: **New → Web Service** → connect your repo.
3. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** pick a plan that supports always-on (Render's free tier spins down on inactivity; use a paid plan for true 24/7 uptime).
4. Add environment variables under **Environment** (mirror your `.env`):
   `MONGO_URI`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NODE_ENV=production`.
   (You don't need to set `PORT` — Render provides it automatically, and `server.js` already reads `process.env.PORT`.)
5. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` so Render's servers can reach your cluster.
6. Deploy. Render will build and start the service; your site will be live at the generated `.onrender.com` URL (or a custom domain you attach).

## Notes & Next Steps

- **Live player count:** the stat box currently reads from a static `serverStats` object in `server.js`. To make it truly live, swap that for a query using a Minecraft server-status library (e.g. `minecraft-server-util`) against your actual server IP/port, on an interval or per-request.
- **Security:** the admin panel uses simple username/password session auth suitable for a small staff team. For multiple staff accounts with distinct permissions, add a `User` model with hashed passwords (e.g. `bcrypt`) instead of the single shared credential in `.env`.
- **Images:** the hero and package cards currently use CSS-only graphics (no external image files) so the project runs immediately with zero missing assets. Drop real artwork into `public/images/` and reference it in the EJS/CSS wherever you'd like to swap in custom art.
