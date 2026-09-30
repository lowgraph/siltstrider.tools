"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAccount } from './account-context';
import { ensureClerk } from '../lib/clerk-browser.mjs';
import { AccountSettingsSession } from '../lib/account-settings-client.mjs';
import { defaultAccountSettings } from '../lib/account-settings.mjs';

const Context = createContext(null);
export const useAccountSettings = () => useContext(Context);

async function requestSettings(method, data, signal, owner, refreshed = false) {
  const clerk = await ensureClerk();
  if (signal.aborted || clerk.user?.id !== owner) throw new Error('Account changed. Please retry.');
  const token = await clerk.session?.getToken({ skipCache: refreshed });
  if (!token || signal.aborted || clerk.user?.id !== owner) throw new Error('Please sign in again.');
  const response = await fetch('/api/settings', { method, signal,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}) });
  if (response.status === 401 && !refreshed) return requestSettings(method, data, signal, owner, true);
  const body = await response.json();
  if (!response.ok) throw Object.assign(new Error(body.message || 'Could not sync settings. Please retry.'), { code: body.error });
  return body;
}

export function AccountSettingsProvider({ children }) {
  const account = useAccount();
  const owner = account?.user?.id || null;
  const [state, setState] = useState(() => ({ owner: null, settings: defaultAccountSettings(), ready: false }));
  const session = useRef(null);
  useEffect(() => {
    let storage = null;
    try { storage = window.localStorage; } catch {}
    const current = new AccountSettingsSession({ request: requestSettings, storage, onChange: setState });
    session.current = current;
    void current.start(owner);
    return () => { current.stop(); if (session.current === current) session.current = null; };
  }, [owner]);
  const update = useCallback(edit => {
    if (session.current?.state.owner === owner) session.current.update(edit);
  }, [owner]);
  // Never expose another owner's document while the effect switches sessions.
  const visible = state.owner === owner ? state : { owner, settings: defaultAccountSettings(), ready: false };
  return <Context.Provider value={{ ...visible, update,
    retry: () => session.current?.state.ready ? session.current.save() : session.current?.start(owner, { keepPending: true }),
    reload: () => session.current?.start(owner), adoptGuest: () => session.current?.adoptGuest(),
    keepAccountDefaults: () => session.current?.publish({ adoptable: false }) }}>
    {children}
  </Context.Provider>;
}
