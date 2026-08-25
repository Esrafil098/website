// =========================================================
//  CraftBars Network — Main Server
//  Node.js + Express + EJS + MongoDB (Mongoose)
// =========================================================

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const morgan = require('morgan');
const path = require('path');

const Notice = require('./models/Notice');
const Rule = require('./models/Rule');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Prevent the process from crashing on transient/async DB errors
// (e.g. DNS lookups for a MongoDB Atlas SRV record failing while offline).
// The app still runs and serves pages; routes that touch the DB will
// simply fail gracefully until the connection is restored.
process.on('unhandledRejection', (reason) => {
  console.error('⚠️   Unhandled promise rejection:', reason && reason.message ? reason.message : reason);
});

// ---------------------------------------------------------
//  Database Connection
// ---------------------------------------------------------
mongoose.connection.on('connected', () => {
  console.log('✅  MongoDB Atlas connected successfully');
  seedDefaultRules();
});
mongoose.connection.on('error', (err) => {
  console.error('❌  MongoDB connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected — will retry automatically.');
});

mongoose.connect(MONGO_URI).catch((err) => {
  console.error('❌  Initial MongoDB connection failed:', err.message);
});

// Seed default rule categories so the Rules page never renders empty
async function seedDefaultRules() {
  const defaults = [
    {
      category: 'Home',
      rulesArray: [
        'Treat every member of the community with respect — no exceptions.',
        'No harassment, hate speech, discrimination, or bullying of any kind.',
        'Do not spam chat, advertise other servers, or send unsolicited links.',
        'No cheating, exploiting bugs, or using unauthorized third-party software.',
        'Staff decisions are final. Open a support ticket to appeal.'
      ]
    },
    {
      category: 'Minecraft',
      rulesArray: [
        'Griefing, stealing, and raiding outside of designated PvP zones is forbidden.',
        'No X-ray texture packs, hacked clients, or auto-clickers.',
        'Chest, land, and base protection must not be bypassed or exploited.',
        'Duplication glitches must be reported to staff immediately, not abused.',
        'Keep builds appropriate — no offensive imagery, symbols, or structures.'
      ]
    },
    {
      category: 'Discord',
      rulesArray: [
        'Keep conversations in the correct channel — use #general for chit-chat.',
        'No NSFW content, gore, or disturbing media anywhere on the server.',
        'Do not ping @staff or @everyone unless it is a genuine emergency.',
        'Voice channel trolling, soundboards, and mic spam are not allowed.',
        'Usernames and avatars must be appropriate for all audiences.'
      ]
    }
  ];

  for (const rule of defaults) {
    const exists = await Rule.findOne({ category: rule.category });
    if (!exists) {
      await Rule.create(rule);
      console.log(`🌱  Seeded default rules for category: ${rule.category}`);
    }
  }
}

// ---------------------------------------------------------
//  View Engine
// ---------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------
//  Middleware
// ---------------------------------------------------------
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'craftbars_dev_secret',
    resave: false,
    saveUninitialized: false,
    store: MONGO_URI
      ? MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions' })
      : undefined,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4 // 4 hours
    }
  })
);

// Make session data available to every view
app.use((req, res, next) => {
  res.locals.isAdmin = Boolean(req.session.isAdmin);
  res.locals.activePage = '';
  next();
});

// ---------------------------------------------------------
//  Auth Middleware
// ---------------------------------------------------------
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.redirect('/admin/login');
}

// ---------------------------------------------------------
//  Server Stats (static/mock — swap for a real query plugin later)
// ---------------------------------------------------------
const serverStats = {
  ip: 'play.craftbars.net',
  playersOnline: 1466,
  playersMax: 3000,
  discordMembers: 8214,
  discordOnline: 2130,
  votesToday: 342
};

// ---------------------------------------------------------
//  Public Routes
// ---------------------------------------------------------

// Home / Announcements
app.get('/', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ pinned: -1, date: -1 }).limit(20);
    res.render('index', {
      title: 'CraftBars Network | Home',
      activePage: 'home',
      notices,
      stats: serverStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('index', {
      title: 'CraftBars Network | Home',
      activePage: 'home',
      notices: [],
      stats: serverStats
    });
  }
});

// Rules
app.get('/rules', async (req, res) => {
  try {
    const rules = await Rule.find();
    const rulesByCategory = {
      Home: rules.find((r) => r.category === 'Home') || { rulesArray: [] },
      Minecraft: rules.find((r) => r.category === 'Minecraft') || { rulesArray: [] },
      Discord: rules.find((r) => r.category === 'Discord') || { rulesArray: [] }
    };
    res.render('rules', {
      title: 'CraftBars Network | Rules',
      activePage: 'rules',
      rulesByCategory
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading rules.');
  }
});

// Vote
app.get('/vote', (req, res) => {
  const voteSites = [
    { name: 'MinecraftServers.org', reward: '2,000 Coins + Vote Key', icon: 'fa-server', url: '#' },
    { name: 'Minecraft-MP.com', reward: '2,000 Coins + Vote Key', icon: 'fa-list', url: '#' },
    { name: 'TopMinecraftServers.org', reward: '2,000 Coins + Vote Key', icon: 'fa-trophy', url: '#' },
    { name: 'Minecraft-Server-List.com', reward: '2,000 Coins + Vote Key', icon: 'fa-star', url: '#' },
    { name: 'PlanetMinecraft.com', reward: '2,000 Coins + Vote Key', icon: 'fa-globe', url: '#' },
    { name: 'ServerMiner.com', reward: '2,000 Coins + Vote Key', icon: 'fa-bolt', url: '#' }
  ];
  res.render('vote', {
    title: 'CraftBars Network | Vote',
    activePage: 'vote',
    voteSites,
    stats: serverStats
  });
});

// Store
app.get('/store', (req, res) => {
  const packages = [
    {
      name: 'Bronze Rank',
      price: '$4.99',
      color: '#cd7f32',
      features: ['Bronze Prefix', '2x Kit Access', '1 Sethome', 'Colored Chat'],
      popular: false
    },
    {
      name: 'Silver Rank',
      price: '$9.99',
      color: '#c0c0c0',
      features: ['Silver Prefix', '4x Kit Access', '3 Sethomes', '/fly in Lobby', 'Colored Chat'],
      popular: true
    },
    {
      name: 'Gold Rank',
      price: '$19.99',
      color: '#ffd700',
      features: ['Gold Prefix', 'All Kits', '6 Sethomes', '/fly in Lobby', 'Particle Effects', 'Priority Queue'],
      popular: false
    },
    {
      name: 'Diamond Rank',
      price: '$34.99',
      color: '#4fc3f7',
      features: ['Diamond Prefix', 'All Kits + Elite', 'Unlimited Sethomes', 'Global /fly', 'Exclusive Cosmetics', 'Priority Support'],
      popular: false
    }
  ];
  const paymentMethods = [
    { name: 'Visa', icon: 'fa-cc-visa' },
    { name: 'Mastercard', icon: 'fa-cc-mastercard' },
    { name: 'PayPal', icon: 'fa-cc-paypal' },
    { name: 'Stripe', icon: 'fa-cc-stripe' },
    { name: 'Apple Pay', icon: 'fa-cc-apple-pay' }
  ];
  res.render('store', {
    title: 'CraftBars Network | Store',
    activePage: 'store',
    packages,
    paymentMethods
  });
});

// ---------------------------------------------------------
//  Admin Auth Routes
// ---------------------------------------------------------
app.get('/admin/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('admin-login', {
    title: 'CraftBars Network | Admin Login',
    activePage: 'admin',
    error: null
  });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USERNAME || 'admin';
  const validPass = process.env.ADMIN_PASSWORD || 'change_this_password';

  if (username === validUser && password === validPass) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }

  res.render('admin-login', {
    title: 'CraftBars Network | Admin Login',
    activePage: 'admin',
    error: 'Invalid username or password.'
  });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ---------------------------------------------------------
//  Admin Panel (Protected)
// ---------------------------------------------------------
app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const notices = await Notice.find().sort({ pinned: -1, date: -1 });
    const rules = await Rule.find();
    const rulesByCategory = {
      Home: rules.find((r) => r.category === 'Home') || { rulesArray: [] },
      Minecraft: rules.find((r) => r.category === 'Minecraft') || { rulesArray: [] },
      Discord: rules.find((r) => r.category === 'Discord') || { rulesArray: [] }
    };
    res.render('admin', {
      title: 'CraftBars Network | Admin Panel',
      activePage: 'admin',
      notices,
      rulesByCategory
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading admin panel.');
  }
});

// Create a new notice
app.post('/admin/notices', requireAdmin, async (req, res) => {
  try {
    const { title, author, content, tag, pinned } = req.body;
    await Notice.create({
      title,
      author: author || 'CraftBars Staff',
      content,
      tag: tag || 'News',
      pinned: pinned === 'on'
    });
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error creating notice: ' + err.message);
  }
});

// Delete a notice
app.delete('/admin/notices/:id', requireAdmin, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error deleting notice: ' + err.message);
  }
});

// Update rules for a given category (rules submitted as newline-separated text)
app.post('/admin/rules/:category', requireAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const { rulesText } = req.body;

    if (!['Home', 'Minecraft', 'Discord'].includes(category)) {
      return res.status(400).send('Invalid rule category.');
    }

    const rulesArray = rulesText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    await Rule.findOneAndUpdate(
      { category },
      { rulesArray, updatedBy: 'Admin' },
      { upsert: true, new: true }
    );

    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error updating rules: ' + err.message);
  }
});

// ---------------------------------------------------------
//  404 Handler
// ---------------------------------------------------------
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found | CraftBars Network',
    activePage: ''
  });
});

// ---------------------------------------------------------
//  Start Server
// ---------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀  CraftBars Network server running on port ${PORT}`);
});
