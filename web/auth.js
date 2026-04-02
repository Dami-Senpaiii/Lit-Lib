const STORAGE_DB_KEY = 'litaudio.security-db.v1';
const STORAGE_SESSION_KEY = 'litaudio.session.v1';

const clean = (value) => String(value ?? '').trim();

async function loadSeed() {
  const response = await fetch(new URL('../mock/security_seed.json', import.meta.url));
  if (!response.ok) {
    throw new Error('Security-Seed konnte nicht geladen werden.');
  }
  return response.json();
}

function readDbFromStorage() {
  const raw = localStorage.getItem(STORAGE_DB_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveDbToStorage(db) {
  localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db));
}

export async function initSecurityDb() {
  let db = readDbFromStorage();
  if (db) return db;

  db = await loadSeed();
  saveDbToStorage(db);
  return db;
}

export async function getSecurityDb() {
  return initSecurityDb();
}

function readSession() {
  const raw = localStorage.getItem(STORAGE_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveSession(session) {
  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_SESSION_KEY);
}

export async function getCurrentUser() {
  const db = await initSecurityDb();
  const session = readSession();
  if (!session?.userId) return null;

  const user = db.users.find((item) => item.id === session.userId && item.active);
  return user || null;
}

function getRole(db, roleId) {
  return db.roles.find((role) => role.id === roleId) || null;
}

export async function login(email, password) {
  const db = await initSecurityDb();
  const normalizedMail = clean(email).toLowerCase();

  const user = db.users.find((item) => item.active && item.email.toLowerCase() === normalizedMail);
  if (!user || user.password !== password) {
    throw new Error('Ungültige Login-Daten.');
  }

  saveSession({ userId: user.id, loggedInAt: new Date().toISOString() });
  return user;
}

export async function hasPermission(permissionKey) {
  const db = await initSecurityDb();
  const user = await getCurrentUser();
  if (!user) return false;

  const role = getRole(db, user.role_id);
  return role?.permissions?.includes(permissionKey) || false;
}

export async function canAccessWork(work) {
  const db = await initSecurityDb();
  const user = await getCurrentUser();
  if (!user || !(await hasPermission('work.open'))) return false;

  const role = getRole(db, user.role_id);
  if (!role) return false;

  const policy = db.work_access_policies.find((item) => item.role_id === role.id);
  if (!policy) return false;

  if (policy.scope === 'all') return true;
  if (policy.scope === 'featured_only') return Boolean(work.is_featured);

  return false;
}

export async function protectedFetch(url, permissionKey) {
  const hasAccess = await hasPermission(permissionKey);
  if (!hasAccess) {
    throw new Error('Zugriff verweigert. Fehlende Berechtigung.');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fehler beim Laden: ${url}`);
  }
  return response;
}

export async function listUsers() {
  const db = await initSecurityDb();
  return db.users.map((user) => ({ ...user, password: '••••••' }));
}

export async function listRoles() {
  const db = await initSecurityDb();
  return db.roles;
}

export async function updateUserRole(userId, roleId) {
  const db = await initSecurityDb();
  const user = db.users.find((item) => item.id === userId);
  if (!user) throw new Error('Benutzer nicht gefunden.');

  user.role_id = roleId;
  saveDbToStorage(db);
}

export async function createUser({ name, email, password, roleId }) {
  const db = await initSecurityDb();
  const id = `user_${crypto.randomUUID().slice(0, 8)}`;

  db.users.push({
    id,
    name: clean(name),
    email: clean(email).toLowerCase(),
    password: clean(password),
    role_id: roleId,
    active: true,
  });

  saveDbToStorage(db);
}
