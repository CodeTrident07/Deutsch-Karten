// DeutschKarten cloud: accounts, progress sync, leaderboard and activity,
// backed by Firebase (Auth + Firestore). Loaded on every page by site.js.
//
// The rest of the site still reads the signed-in user from localStorage
// ('dk_session' / 'dk_users'); this file keeps those in step with Firebase,
// so older page code keeps working unchanged.
//
// Firestore layout (rules in firestore.rules):
//   progress/{uid}     private: the user's saved progress (localStorage items)
//   leaderboard/{uid}  public:  name, words known, streak, spelling %, level
//   activity/{uid_day} public:  one entry per user per day for the feed
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, updateProfile, signOut as fbSignOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Public web config: safe to ship; access is controlled by the security rules
const firebaseConfig = {
  apiKey: 'AIzaSyCXIiYeUN8O5WyM_exlKK2nGJfq7AupTfw',
  authDomain: 'deutschkarten-92f46.firebaseapp.com',
  projectId: 'deutschkarten-92f46',
  storageBucket: 'deutschkarten-92f46.firebasestorage.app',
  messagingSenderId: '1007085934814',
  appId: '1:1007085934814:web:f4367b28775ebedd600a4f',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Local mirror of the signed-in user ─────────────────────────
const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const rawSet = Storage.prototype.setItem;          // unpatched, for our own writes

function mirrorUser(user) {
  const email = user.email.toLowerCase();
  const users = readJSON('dk_users', {});
  users[email] = { ...(users[email] || {}), name: user.displayName || users[email]?.name || email.split('@')[0], email, cloud: true };
  delete users[email].hash;                        // passwords now live with Firebase only
  rawSet.call(localStorage, 'dk_users', JSON.stringify(users));
  rawSet.call(localStorage, 'dk_session', JSON.stringify({ email, uid: user.uid, ts: Date.now() }));
}
function clearMirror() { localStorage.removeItem('dk_session'); }
const session = () => readJSON('dk_session', null);

// ── Which localStorage items belong to the user's progress ─────
const SHARED_KEYS = ['dk_praep_v1', 'dk_sv_srs_v1', 'dk_wordle_daily'];
const NEVER = ['dk_session', 'dk_users', 'dk_saved_emails', 'dk_srs_migrated'];
function isProgressKey(key, email) {
  if (!email || NEVER.includes(key)) return false;
  return SHARED_KEYS.includes(key) || key.includes(email) || key.includes(email.replace(/[^a-z0-9]/gi, '_'));
}
// Keys are stored with the email swapped for a placeholder, so they move between accounts cleanly
const toCloudKey = (k, email) => k.split(email).join('{me}').split(email.replace(/[^a-z0-9]/gi, '_')).join('{me_}');
const toLocalKey = (k, email) => k.split('{me}').join(email).split('{me_}').join(email.replace(/[^a-z0-9]/gi, '_'));

function collectProgress(email) {
  const items = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (isProgressKey(k, email)) items.push({ k: toCloudKey(k, email), v: localStorage.getItem(k) });
  }
  return items;
}

// Merge a cloud value into the local one without losing either side's work
function mergeValue(local, cloud) {
  if (local == null) return cloud;
  if (cloud == null) return local;
  let a, b;
  try { a = JSON.parse(local); b = JSON.parse(cloud); } catch { return local; }
  if (typeof a === 'number' && typeof b === 'number') return JSON.stringify(Math.max(a, b));
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a)) return local;
  // Streak: keep the one studied most recently, then the longer one
  if ('count' in a && 'last' in a) {
    const pickB = (b.last || '') > (a.last || '') || ((b.last || '') === (a.last || '') && (b.count || 0) > (a.count || 0));
    return JSON.stringify(pickB ? b : a);
  }
  // Wördle: combine the day-by-day history, keep today's game from whichever is further along
  if ('history' in a || 'history' in b) {
    const out = (b.day || 0) > (a.day || 0) || ((b.day || 0) === (a.day || 0) && (b.guesses || []).length > (a.guesses || []).length) ? { ...b } : { ...a };
    out.history = { ...(b.history || {}), ...(a.history || {}) };
    return JSON.stringify(out);
  }
  // Flashcard progress maps ({ cardId: { rep, interval, last, ... } }): newest review wins per card
  const vals = [...Object.values(a), ...Object.values(b)];
  if (vals.length && vals.every(v => v && typeof v === 'object' && ('interval' in v || 'rep' in v || 'due' in v))) {
    const t = r => r ? (r.last || r.lastReviewed || r.due || 0) : -1;
    const out = { ...a };
    for (const id in b) if (t(b[id]) > t(out[id])) out[id] = b[id];
    return JSON.stringify(out);
  }
  return local;
}

async function pullProgress(user) {
  const email = user.email.toLowerCase();
  const snap = await getDoc(doc(db, 'progress', user.uid));
  if (!snap.exists()) return false;
  let changed = false;
  for (const { k, v } of snap.data().items || []) {
    const key = toLocalKey(k, email);
    const local = localStorage.getItem(key);
    const merged = mergeValue(local, v);
    if (merged !== local) { rawSet.call(localStorage, key, merged); changed = true; }
  }
  return changed;
}

let pushTimer = null, pushing = false;
async function pushProgress() {
  clearTimeout(pushTimer);
  const user = auth.currentUser;
  if (!user || pushing) return;
  pushing = true;
  try {
    await setDoc(doc(db, 'progress', user.uid), { items: collectProgress(user.email.toLowerCase()), updatedAt: Date.now() });
  } catch (e) { console.warn('[cloud] progress not saved', e.code || e); }
  pushing = false;
}
const schedulePush = () => { clearTimeout(pushTimer); pushTimer = setTimeout(pushProgress, 4000); };

// Notice progress writes anywhere on the site and save them shortly after
Storage.prototype.setItem = function (key, value) {
  rawSet.call(this, key, value);
  const s = this === localStorage && auth.currentUser ? session() : null;
  if (s && isProgressKey(key, s.email)) schedulePush();
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pushProgress(); });

// ── Accounts ───────────────────────────────────────────────────
const MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/invalid-email': 'Please enter a valid email.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/missing-email': 'Please enter your email.',
};
const friendly = e => MESSAGES[e?.code] || 'Something went wrong. Please try again.';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Progress made as a guest becomes the new account's progress (only where the account has none yet)
function adoptGuestProgress(email) {
  const safe = email.replace(/[^a-z0-9]/gi, '_');
  const pairs = [
    ['srs_data_v1', 'srs_data_v1_' + email], ['dk_streak_guest', 'dk_streak_' + email],
    ['dk_goal_guest', 'dk_goal_' + email], ['dk_goaldone_guest', 'dk_goaldone_' + email],
    ['dk_sprint_hs_guest', 'dk_sprint_hs_' + email], ['dk_ddd_guest', 'dk_ddd_' + safe],
  ];
  for (const [from, to] of pairs) {
    const v = localStorage.getItem(from);
    if (v != null && localStorage.getItem(to) == null) rawSet.call(localStorage, to, v);
  }
}

async function afterSignIn(user) {
  mirrorUser(user);
  adoptGuestProgress(user.email.toLowerCase());
  try { await pullProgress(user); } catch (e) { console.warn('[cloud] progress not loaded', e.code || e); }
  await pushProgress();          // first sign-in from this device uploads what's here
  await publishStats();
  try { sessionStorage.setItem('dk_pulled_' + user.uid, '1'); } catch {}
}

async function signUp(name, email, password) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });
    await afterSignIn(user);
    return { ok: true, name };
  } catch (e) { return { ok: false, error: friendly(e) }; }
}

async function signIn(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await afterSignIn(user);
    return { ok: true, name: user.displayName };
  } catch (e) {
    // An account that only existed in this browser: if the password matches,
    // create it in Firebase with the same details and carry its progress over
    const old = readJSON('dk_users', {})[email];
    if (old && old.hash && ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(e.code)
        && old.hash === await sha256(password)) {
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: old.name });
        await afterSignIn(user);
        return { ok: true, name: old.name, migrated: true };
      } catch (e2) {
        if (e2.code === 'auth/email-already-in-use') return { ok: false, error: 'Email or password is incorrect.' };
        return { ok: false, error: friendly(e2) };
      }
    }
    return { ok: false, error: friendly(e) };
  }
}

async function resetPassword(email) {
  try { await sendPasswordResetEmail(auth, email); return { ok: true }; }
  catch (e) {
    // Don't reveal whether an account exists
    if (e.code === 'auth/user-not-found') return { ok: true };
    return { ok: false, error: friendly(e) };
  }
}

async function signOut() {
  await pushProgress();
  await fbSignOut(auth);
  clearMirror();
}

// ── Leaderboard and activity ───────────────────────────────────
function myStats(email) {
  const srs = readJSON('srs_data_v1_' + email, {});
  const wordsKnown = Object.values(srs).filter(c => c && c.interval >= 4).length;
  const sd = readJSON('dk_streak_' + email, null);
  const streak = sd ? sd.count || 0 : 0;
  const sa = readJSON('dk_spell_acc_' + email, null);
  const spellingAcc = sa ? Math.round(sa.pct || 0) : 0;
  let level = 'A1';
  for (const l of ['A1', 'A2', 'B1', 'B2', 'C1']) if (Object.keys(srs).some(id => id.startsWith(l + ':'))) level = l;
  return { wordsKnown, streak, spellingAcc, level };
}

async function publishStats() {
  const user = auth.currentUser;
  if (!user) return;
  const email = user.email.toLowerCase();
  const name = (user.displayName || readJSON('dk_users', {})[email]?.name || 'Learner').slice(0, 40);
  const s = myStats(email);
  const today = new Date().toISOString().slice(0, 10);
  try {
    await setDoc(doc(db, 'leaderboard', user.uid), { name, ...s, updatedAt: Date.now(), today });
    if (s.wordsKnown > 0 || s.streak > 0) {
      await setDoc(doc(db, 'activity', user.uid + '_' + today), { uid: user.uid, name, wordsKnown: s.wordsKnown, streak: s.streak, ts: Date.now() });
    }
  } catch (e) { console.warn('[cloud] stats not published', e.code || e); }
}

async function getLeaderboard() {
  const snap = await getDocs(query(collection(db, 'leaderboard'), orderBy('wordsKnown', 'desc'), limit(100)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function getActivity() {
  const snap = await getDocs(query(collection(db, 'activity'), orderBy('ts', 'desc'), limit(20)));
  return snap.docs.map(d => d.data());
}

// ── Start-up ───────────────────────────────────────────────────
let resolveReady;
const ready = new Promise(r => { resolveReady = r; });
let firstState = true;

onAuthStateChanged(auth, async user => {
  if (user) {
    mirrorUser(user);
    // Once per visit, bring in progress saved from other devices
    let pulled = false;
    try { pulled = sessionStorage.getItem('dk_pulled_' + user.uid) === '1'; } catch {}
    if (!pulled) {
      try { sessionStorage.setItem('dk_pulled_' + user.uid, '1'); } catch {}
      try {
        const changed = await pullProgress(user);
        if (changed && firstState && !/login\.html$/.test(location.pathname)) { location.reload(); return; }
      } catch (e) { console.warn('[cloud] progress not loaded', e.code || e); }
    }
  } else {
    // Signed out in Firebase: drop any old browser-only session so the
    // person signs in again (which moves an old account to the cloud)
    if (session()) {
      clearMirror();
      if (firstState && !/login\.html$/.test(location.pathname)) { location.reload(); return; }
    }
  }
  firstState = false;
  resolveReady(user);
  document.dispatchEvent(new CustomEvent('dkcloud-auth', { detail: { user } }));
});

window.dkCloud = { ready, signUp, signIn, resetPassword, signOut, publishStats, getLeaderboard, getActivity, pushProgress, currentUser: () => auth.currentUser };
document.dispatchEvent(new Event('dkcloud-ready'));
