const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DIRECTORY_FILE = path.join(DATA_DIR, 'directory.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SECRET_FILE = path.join(DATA_DIR, 'session-secret.txt');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- bootstrap session secret (persists across restarts) ---
if (!fs.existsSync(SECRET_FILE)) {
  fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'));
}
const SESSION_SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim();

// --- bootstrap admin account (single account, no public signup) ---
function bootstrapAdmin() {
  if (fs.existsSync(ADMIN_FILE)) return;
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS || crypto.randomBytes(6).toString('base64url');
  const passwordHash = bcrypt.hashSync(password, 10);
  fs.writeFileSync(ADMIN_FILE, JSON.stringify({ username, passwordHash }, null, 2));
  console.log('========================================================');
  console.log(' Admin account created:');
  console.log('   username:', username);
  console.log('   password:', password);
  console.log(' Log in at /admin/login and change the password after.');
  console.log('========================================================');
}
bootstrapAdmin();

function readAdmin() {
  return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
}
function writeAdmin(admin) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2));
}

// --- data store (simple JSON file, read/write through) ---
function readDirectory() {
  return JSON.parse(fs.readFileSync(DIRECTORY_FILE, 'utf8'));
}
function writeDirectory(dir) {
  dir.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(DIRECTORY_FILE, JSON.stringify(dir, null, 2));
}

function wardGroups(ward) {
  const groups = [...(ward.leadership || []), ward.lead, ...ward.roles];
  for (const r of ward.roles) {
    if (r.viceChair) groups.push(r.viceChair);
  }
  if (ward.secretary) groups.push(ward.secretary);
  return groups;
}

function findPerson(dir, personId) {
  for (const ward of dir.wards) {
    const groups = wardGroups(ward);
    for (const g of groups) {
      const idx = g.people.findIndex((p) => p.id === personId);
      if (idx !== -1) return { ward, group: g, person: g.people[idx], idx };
    }
  }
  return null;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
  })
);
app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  if (req.path.startsWith('/admin/api')) return res.status(401).json({ error: 'Not authenticated' });
  return res.redirect('/admin/login');
}

app.get('/directory', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'directory.html'));
});

// ---------- Public API ----------
app.get('/api/meta', (req, res) => {
  const dir = readDirectory();
  res.json(dir.meta);
});

app.get('/api/wards', (req, res) => {
  const dir = readDirectory();
  res.json(dir.wards.map((w) => ({ slug: w.slug, name: w.name, isStake: !!w.isStake })));
});

app.get('/api/stats', (req, res) => {
  const dir = readDirectory();
  let filledRoleSlots = 0;
  let totalRoleSlots = 0;
  let totalPeople = 0;
  let peopleWithMessenger = 0;
  for (const ward of dir.wards) {
    const roleGroups = [ward.lead, ...ward.roles];
    for (const g of roleGroups) {
      totalRoleSlots += 1;
      if (g.people.length > 0) filledRoleSlots += 1;
    }
    const allGroups = wardGroups(ward);
    for (const g of allGroups) {
      for (const p of g.people) {
        totalPeople += 1;
        if (p.messenger) peopleWithMessenger += 1;
      }
    }
  }
  res.json({
    wardsCount: dir.wards.length,
    totalRoleSlots,
    filledRoleSlots,
    vacantRoleSlots: totalRoleSlots - filledRoleSlots,
    totalPeople,
    peopleWithMessenger,
  });
});

app.get('/api/wards/:slug', (req, res) => {
  const dir = readDirectory();
  const ward = dir.wards.find((w) => w.slug === req.params.slug);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });
  res.json(ward);
});

// ---------- Admin auth ----------
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = readAdmin();
  if (username === admin.username && bcrypt.compareSync(password || '', admin.passwordHash)) {
    req.session.isAdmin = true;
    req.session.username = username;
    return res.redirect('/admin');
  }
  res.redirect('/admin/login?error=1');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/admin/api/whoami', requireAdmin, (req, res) => {
  res.json({ username: req.session.username });
});

app.post('/admin/api/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = readAdmin();
  if (!bcrypt.compareSync(currentPassword || '', admin.passwordHash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  writeAdmin(admin);
  res.json({ ok: true });
});

// ---------- Admin data API ----------
app.get('/admin/api/wards', requireAdmin, (req, res) => {
  const dir = readDirectory();
  res.json(dir.wards);
});

// Download the current directory data as a dated backup file. Free hosting
// tiers can lose disk state on redeploy, so this lets the admin keep an
// off-server copy they can restore from if that ever happens.
app.get('/admin/api/backup', requireAdmin, (req, res) => {
  const dateStamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="talisay-wsr-backup-${dateStamp}.json"`);
  res.sendFile(DIRECTORY_FILE);
});

app.put('/admin/api/person/:id', requireAdmin, (req, res) => {
  const dir = readDirectory();
  const found = findPerson(dir, req.params.id);
  if (!found) return res.status(404).json({ error: 'Person not found' });
  const { name, messenger, phone, email } = req.body;
  if (typeof name === 'string') found.person.name = name.trim();
  if (typeof messenger === 'string') found.person.messenger = messenger.trim();
  if (typeof phone === 'string') found.person.phone = phone.trim();
  if (typeof email === 'string') found.person.email = email.trim();
  writeDirectory(dir);
  res.json(found.person);
});

app.delete('/admin/api/person/:id', requireAdmin, (req, res) => {
  const dir = readDirectory();
  const found = findPerson(dir, req.params.id);
  if (!found) return res.status(404).json({ error: 'Person not found' });
  if (found.person.photo) {
    const p = path.join(__dirname, 'public', found.person.photo);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  found.group.people.splice(found.idx, 1);
  writeDirectory(dir);
  res.json({ ok: true });
});

app.post('/admin/api/ward/:slug/add-person', requireAdmin, (req, res) => {
  const { groupKind, roleIndex, name } = req.body; // groupKind: 'lead' | 'role' | 'leadership' | 'roleViceChair' | 'secretary'
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const dir = readDirectory();
  const ward = dir.wards.find((w) => w.slug === req.params.slug);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });
  let group;
  if (groupKind === 'lead') group = ward.lead;
  else if (groupKind === 'roleViceChair') group = (ward.roles[roleIndex] || {}).viceChair;
  else if (groupKind === 'secretary') group = ward.secretary;
  else if (groupKind === 'leadership') group = (ward.leadership || [])[roleIndex];
  else group = ward.roles[roleIndex];
  if (!group) return res.status(404).json({ error: 'Role not found' });
  const id = 'p' + Date.now() + Math.floor(Math.random() * 1000);
  const person = { id, name: name.trim(), photo: '', messenger: '', phone: '', email: '' };
  group.people.push(person);
  writeDirectory(dir);
  res.json(person);
});

// ---------- Photo upload ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  },
});

app.post('/admin/api/person/:id/photo', requireAdmin, upload.single('photo'), (req, res) => {
  const dir = readDirectory();
  const found = findPerson(dir, req.params.id);
  if (!found) return res.status(404).json({ error: 'Person not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (found.person.photo) {
    const old = path.join(__dirname, 'public', found.person.photo);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  found.person.photo = '/uploads/' + req.file.filename;
  writeDirectory(dir);
  res.json(found.person);
});

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Talisay Stake WSR Directory running at http://localhost:${PORT}`);
});
