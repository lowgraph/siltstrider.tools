// One initialization shared by the vault modal and workstation.
const pending = new WeakMap();
export function clerkDomain(key) {
  if (!/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key || '')) throw new Error('Sign-in is not configured.');
  const decoded = atob(key.split('_')[2].replace(/-/g, '+').replace(/_/g, '/'));
  if (!decoded.endsWith('$') || !/^[a-z0-9.-]+\.[a-z]+\$$/i.test(decoded)) throw new Error('Invalid sign-in configuration.');
  return decoded.slice(0, -1);
}
// Loading Clerk sets its cookies for whoever loaded it, so the site loads it up front only
// for a browser with a live sign-in; everyone else gets it when they choose to sign in.
// Clerk keeps the time of the last sign-in in __client_uat (suffixed per instance on some
// setups), readable by the page, and sets it to 0 on sign-out.
export function hasClerkSession(doc = document) {
  return String(doc?.cookie || '').split(';').some(part => {
    const [name, value] = part.trim().split('=');
    return /^__client_uat(_[A-Za-z0-9-]+)?$/.test(name) && /^\d+$/.test(value || '') && Number(value) > 0;
  });
}
export function ensureClerkIfSignedIn(win = window) {
  return hasClerkSession(win.document) ? ensureClerk(win) : Promise.resolve(null);
}
export function ensureClerk(win = window) {
  if (pending.has(win)) return pending.get(win);
  if (win.Clerk?.loaded || (win.Clerk?.addListener && !win.Clerk?.load)) return Promise.resolve(win.Clerk);
  const task = (async () => {
    const key = win.document.querySelector('meta[name="clerk-publishable-key"]')?.content;
    const domain = clerkDomain(key);
    async function script(path, sdk = false) {
      await new Promise((resolve, reject) => {
        const el = win.document.createElement('script');
        const timer = win.setTimeout(() => { el.remove(); reject(new Error('Sign-in timed out. Please retry.')); }, 20000);
        el.src = `https://${domain}/npm/${path}`;
        el.async = true;
        el.crossOrigin = 'anonymous';
        if (sdk) el.setAttribute('data-clerk-publishable-key', key);
        el.onload = () => { win.clearTimeout(timer); resolve(); };
        el.onerror = () => { win.clearTimeout(timer); el.remove(); reject(new Error('Unable to load sign-in. Check your connection and retry.')); };
        win.document.head.appendChild(el);
      });
    }
    await script('@clerk/ui@1/dist/ui.browser.js');
    await script('@clerk/clerk-js@6/dist/clerk.browser.js', true);
    await win.Clerk.load({ ui: { ClerkUI: win.__internal_ClerkUICtor } });
    win.dispatchEvent(new win.Event('silt-auth-ready'));
    return win.Clerk;
  })();
  pending.set(win, task);
  task.catch(() => pending.delete(win));
  return task;
}
