import { defaultAccountSettings, validateAccountSettings } from './account-settings.mjs';

export const GUEST_SETTINGS_KEY = 'silt-guest-settings-v1';

export function readGuestSettings(storage) {
  try {
    const raw = storage?.getItem(GUEST_SETTINGS_KEY);
    if (raw) return validateAccountSettings(JSON.parse(raw));
  } catch { /* Unreadable preferences must not prevent the tools opening. */ }
  const settings = defaultAccountSettings();
  try {
    settings.world = storage?.getItem('mw-world') === 'tr'
      ? storage?.getItem('mw-arce') === '1' ? 'tr_arce' : 'tr' : 'vanilla';
    settings.theme = storage?.getItem('silt-theme') === 'morrowind' ? 'morrowind' : 'ashfall';
    const challenge = JSON.parse(storage?.getItem('silt-challenge-settings') || 'null');
    if (challenge) settings.toolDefaults.challenge = validateAccountSettings({ version: 1, toolDefaults: { challenge } }).toolDefaults.challenge;
  } catch {}
  return settings;
}

function readResult(body) {
  if (!Number.isSafeInteger(body?.revision) || body.revision < 0) throw new Error('The settings response could not be read.');
  return { settings: validateAccountSettings(body.settings), revision: body.revision };
}

/** One owner-bound session, with serialized writes and retained unsaved edits.
 * No account document is cached in shared browser storage. Guest data is separate.
 */
export class AccountSettingsSession {
  constructor({ request, storage, onChange = () => {} }) {
    this.request = request;
    this.storage = storage;
    this.onChange = onChange;
    this.epoch = 0;
    this.state = { owner: null, settings: defaultAccountSettings(), revision: 0,
      ready: false, dirty: false, saving: false, error: '', conflict: false, adoptable: false };
  }
  publish(patch) {
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }
  stop() {
    this.epoch++;
    this.controller?.abort();
    clearTimeout(this.timer);
  }
  async start(owner, { keepPending = false } = {}) {
    const pending = keepPending && this.state.owner === owner && !this.state.ready ? this.pending || [] : [];
    const pendingSettings = pending.length ? this.state.settings : null;
    this.stop();
    const epoch = this.epoch;
    this.controller = new AbortController();
    this.serial = 0;
    this.pending = pending;
    this.guest = readGuestSettings(this.storage);
    this.publish({ owner, settings: pendingSettings || (owner ? defaultAccountSettings() : this.guest), revision: 0,
      ready: !owner, dirty: pending.length > 0, saving: false, error: '', conflict: false, adoptable: false });
    if (!owner) return;
    try {
      const result = readResult(await this.request('GET', null, this.controller.signal, owner));
      if (epoch !== this.epoch) return;
      let settings = result.settings;
      for (const edit of this.pending) settings = validateAccountSettings(edit(settings));
      const dirty = this.pending.length > 0;
      this.pending = [];
      this.publish({ ...result, settings, ready: true, dirty, adoptable: result.revision === 0 && !dirty });
      if (dirty) this.schedule();
    } catch (error) {
      if (epoch !== this.epoch) return;
      this.publish({ error: error.message, conflict: error.code === 'UNSUPPORTED_SETTINGS' });
    }
  }
  update(edit) {
    if (this.state.conflict) return;
    const settings = validateAccountSettings(edit(this.state.settings));
    if (JSON.stringify(settings) === JSON.stringify(this.state.settings) && (!this.state.owner || this.state.ready)) return;
    this.serial++;
    if (this.state.owner && !this.state.ready) this.pending.push(edit);
    this.publish({ settings, dirty: Boolean(this.state.owner), error: '', adoptable: false });
    if (!this.state.owner) {
      try {
        if (!this.storage) throw new Error('Storage unavailable');
        this.storage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(settings));
      } catch { this.publish({ error: 'Browser storage is unavailable. Preferences last until this page closes.' }); }
    } else if (this.state.ready) this.schedule();
  }
  schedule() {
    clearTimeout(this.timer);
    if (this.state.saving || !this.state.dirty || this.state.conflict) return;
    this.timer = setTimeout(() => { void this.save(); }, 350);
  }
  async save() {
    clearTimeout(this.timer);
    if (!this.state.owner || !this.state.ready || !this.state.dirty || this.state.saving || this.state.conflict) return;
    const epoch = this.epoch, serial = this.serial;
    const payload = { settings: this.state.settings, revision: this.state.revision };
    this.publish({ saving: true, error: '' });
    try {
      const result = readResult(await this.request('PUT', payload, this.controller.signal, this.state.owner));
      if (epoch !== this.epoch) return;
      const dirty = serial !== this.serial;
      this.publish({ revision: result.revision, ...(dirty ? {} : { settings: result.settings }), dirty, saving: false });
      if (dirty) this.schedule();
    } catch (error) {
      if (epoch !== this.epoch) return;
      this.publish({ saving: false, error: error.message, conflict: error.code === 'REVISION_CONFLICT' || error.code === 'UNSUPPORTED_SETTINGS' });
    }
  }
  adoptGuest() {
    if (this.state.owner && this.state.ready && this.state.revision === 0 && this.state.adoptable) this.update(() => this.guest);
    this.publish({ adoptable: false });
  }
}
