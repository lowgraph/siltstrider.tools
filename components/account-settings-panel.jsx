"use client";
import { useEffect, useRef, useState } from 'react';
import ConfirmationDialog from './confirmation-dialog';
import { useAccountSettings } from './account-settings-context';
import { useShell } from './shell-context';
import { resetAccountSettings, resetAccountToolSettings, updateAccountToolSettings } from '../lib/account-settings.mjs';
import { DIFFICULTY_PRESETS } from '../lib/challenge-math.mjs';

const WORLDS = [['vanilla', 'Morrowind'], ['tr', 'Tamriel Rebuilt'], ['tr_arce', 'Tamriel Rebuilt + ARCE']];
const TRAVEL = [['mageGuild', 'Assume Mages Guild membership'], ['conjurer', 'Assume Conjurer rank or higher'],
  ['divine', 'Include Divine Intervention when available'], ['almsivi', 'Include Almsivi Intervention when available'],
  ['waterWalking', 'Assume constant Water Walking'], ['walking', 'Walk between places'],
  ['questTeleports', 'Include quest teleports']];
const GEAR = [['theft', 'Steal early gear'], ['endgame', 'Include endgame gear early'], ['nearStart', 'Prefer gear near the start'], ['darkBrotherhood', 'Include Dark Brotherhood armor']];
const COUNTS = [['random', 'Random'], ...['1', '2', '3', '4', '5'].map(value => [value, value])];

function BooleanChoice({ label, value, onChange, inherited, fallback = 'Use tool default' }) {
  return <label className="settings-choice">{label}<select value={value === undefined ? 'inherit' : String(value)} onChange={event => onChange(event.target.value === 'inherit' ? undefined : event.target.value === 'true')}>
    <option value="inherit">{inherited ? 'Use shared default' : fallback}</option>
    <option value="true">On</option><option value="false">Off</option>
  </select></label>;
}

export default function AccountSettingsPanel() {
  const preferences = useAccountSettings();
  const shell = useShell();
  const [editWorld, setEditWorld] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const errorRef = useRef(null);
  useEffect(() => { setConfirmReset(false); }, [preferences?.owner]);
  useEffect(() => {
    if (preferences?.error && document.activeElement === document.body) {
      (errorRef.current?.querySelector('button') || errorRef.current)?.focus();
    }
  }, [preferences?.error, preferences?.conflict]);
  if (!preferences) return null;
  const { settings, owner, ready, dirty, saving, error, conflict } = preferences;
  const selectedWorld = editWorld || shell.profile || settings.world;
  const selection = { world: selectedWorld, modpackId: null, modVersionId: null };
  const scoped = settings.defaultScope === 'dataset';
  const tools = scoped ? settings.datasetOverrides.find(entry => entry.world === selectedWorld && entry.modpackId === null && entry.modVersionId === null)?.toolDefaults || { travel: {}, gear: {}, challenge: {} } : settings.toolDefaults;
  const change = patch => preferences.update(document => ({ ...document, ...patch }));
  const changeTool = (tool, patch) => preferences.update(document => updateAccountToolSettings(document, tool, patch, selection));
  const resetAll = () => {
    if (!ready || conflict) return;
    shell.setProfile('vanilla'); preferences.update(resetAccountSettings);
    setEditWorld(null); setConfirmReset(false);
  };
  const status = !ready ? 'Loading preferences…' : saving ? 'Saving preferences…' : dirty ? 'Preferences have not synced yet.' : owner ? preferences.revision === 0 ? 'Using account defaults. Changes save automatically.' : 'Preferences are saved to your account.' : 'Preferences are kept in this browser. Sign in to save them across devices.';
  return <section className="account-settings-panel space-y-4 mt-6 border-t border-line-9 pt-5" aria-labelledby="settings-heading">
    <h2 id="settings-heading" className="text-xl font-serif text-accent">Your settings</h2>
    <p role="status" aria-live="polite">{status}</p>
    {error && <div role="alert" ref={errorRef} tabIndex={-1}><p>{error}</p>
      {owner && (conflict ? <button type="button" onClick={preferences.reload}>Discard unsaved preferences and reload saved settings</button> : <button type="button" onClick={preferences.retry}>Retry sync</button>)}
    </div>}
    {preferences.adoptable && <div className="p-3 border border-line-9 space-y-2">
      <p>This account has no saved settings. You can copy this browser&apos;s preferences, or keep the account defaults.</p>
      <button type="button" onClick={preferences.adoptGuest}>Use this browser&apos;s preferences</button>{' '}
      <button type="button" onClick={preferences.keepAccountDefaults}>Keep account defaults</button>
    </div>}
    <fieldset disabled={!ready || conflict} className="border-0 p-0 m-0 space-y-4">
      <legend className="sr-only">Account preferences</legend>
      <label className="settings-choice">Preferred world<select value={settings.worldChosen ? settings.world : 'browser'} onChange={event => {
        const world = event.target.value;
        if (world === 'browser') change({ worldChosen: false });
        else { change({ world, worldChosen: true }); shell.setProfile(world); }
      }}><option value="browser">Use this browser&apos;s world</option>{WORLDS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <p className="text-sm text-fg-9">Shared links keep their world and choices. Settings do not change your imported character or its save.</p>
      <label className="settings-choice">Theme<select value={settings.theme} onChange={event => change({ theme: event.target.value })}><option value="ashfall">Modern UI</option><option value="morrowind">Morrowind UI</option></select></label>
      <label className="flex gap-2 items-start"><input type="checkbox" checked={settings.overrideSaveToggles} onChange={event => change({ overrideSaveToggles: event.target.checked })} />Use my stored defaults instead of save-derived Travel toggles</label>
      <p className="text-sm text-fg-9">Only the toggles you set override your save. Turn this off to restore its remembered choices. Assuming guild membership allows guide routes; it does not make your character a member. Intervention still needs an available spell or scroll.</p>
      <label className="settings-choice">Tool default scope<select value={settings.defaultScope} onChange={event => change({ defaultScope: event.target.value })}><option value="global">Shared across worlds</option><option value="dataset">Shared, with world-specific defaults</option></select></label>
      {scoped && <label className="settings-choice">Edit tool defaults for<select value={selectedWorld} onChange={event => setEditWorld(event.target.value)}>{WORLDS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}
      <details open className="p-3 border border-line-9"><summary className="font-serif text-accent">Travel defaults</summary><div className="space-y-3 pt-3">
        <label className="settings-choice">Plan for<select value={tools.travel.objective || 'inherit'} onChange={event => changeTool('travel', { objective: event.target.value === 'inherit' ? undefined : event.target.value })}><option value="inherit">Use {scoped ? 'shared' : 'tool'} default</option><option value="hops">Fewest legs</option><option value="time">Fastest</option><option value="real">Least real time</option><option value="gold">Cheapest</option></select></label>
        {TRAVEL.map(([key, label]) => <BooleanChoice key={key} label={label} value={tools.travel[key]} inherited={scoped} fallback={['walking', 'questTeleports'].includes(key) ? 'Use tool default' : 'Use save or tool default'} onChange={value => changeTool('travel', { [key]: value })} />)}
        <button type="button" onClick={() => preferences.update(document => resetAccountToolSettings(document, 'travel'))}>Reset Travel defaults in every world</button>
      </div></details>
      <details className="p-3 border border-line-9"><summary className="font-serif text-accent">Gear Advisor defaults</summary><div className="space-y-3 pt-3">
        {GEAR.map(([key, label]) => <BooleanChoice key={key} label={label} value={tools.gear[key]} inherited={scoped} onChange={value => changeTool('gear', { [key]: value })} />)}
        <button type="button" onClick={() => preferences.update(document => resetAccountToolSettings(document, 'gear'))}>Reset Gear Advisor defaults in every world</button>
      </div></details>
      <details className="p-3 border border-line-9"><summary className="font-serif text-accent">Challenge defaults</summary><div className="space-y-3 pt-3">
        <label className="settings-choice">Preset<select value={tools.challenge.preset || 'inherit'} onChange={event => {
          const preset = DIFFICULTY_PRESETS[event.target.value];
          changeTool('challenge', !preset ? { preset: undefined } : preset.id === 'custom' ? { preset: preset.id }
            : { preset: preset.id, restrictionCount: String(preset.restrictionsCount), objectiveCount: String(preset.objectivesCount), allowedBands: { ...preset.bands } });
        }}><option value="inherit">Use {scoped ? 'shared' : 'tool'} default</option>{Object.values(DIFFICULTY_PRESETS).map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
        {[['restrictionCount', 'Restrictions'], ['objectiveCount', 'Minor objectives']].map(([key, label]) => <label key={key} className="settings-choice">{label}<select value={tools.challenge[key] || 'inherit'} onChange={event => changeTool('challenge', { [key]: event.target.value === 'inherit' ? undefined : event.target.value })}><option value="inherit">Use {scoped ? 'shared' : 'preset'} default</option>{COUNTS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>)}
        {['Easy', 'Medium', 'Hard', 'Grind'].map(band => <BooleanChoice key={band} label={`${band} restrictions`} value={tools.challenge.allowedBands?.[band]} inherited={scoped} fallback="Use preset default" onChange={value => {
          const allowedBands = { ...tools.challenge.allowedBands, [band]: value };
          if (value === undefined) delete allowedBands[band];
          changeTool('challenge', { allowedBands: Object.keys(allowedBands).length ? allowedBands : undefined });
        }} />)}
        <p className="text-sm text-fg-9">An open run or seed keeps its choices. Use preferred settings in Challenge Runs to start from your defaults.</p>
        <button type="button" onClick={() => preferences.update(document => resetAccountToolSettings(document, 'challenge'))}>Reset Challenge defaults in every world</button>
      </div></details>
      <details className="p-3 border border-line-9"><summary className="font-serif text-accent">Future datasets</summary><div className="space-y-3 pt-3">
        <label className="settings-choice">Modpack<select disabled><option>Not available yet</option></select></label>
        <label className="settings-choice">Mod version<select disabled><option>Not available yet</option></select></label>
        <p className="text-sm text-fg-9">Tools currently use the published dataset. Choosing a modpack or an older version is not available yet; these controls become selectable when their datasets are available. Supported versions will stay selected until you choose an upgrade.</p>
        <label className="flex gap-2 items-start"><input type="checkbox" disabled checked={settings.versionUpdates.notify} readOnly />Dataset update notices (not available yet)</label>
      </div></details>
      <button type="button" onClick={() => setConfirmReset(true)}>Reset all settings</button>
    </fieldset>
    <ConfirmationDialog open={confirmReset} title="Reset all settings?"
      description="This restores Modern UI, Morrowind and tool defaults, and clears your world-specific defaults and save-toggle overrides."
      confirmLabel="Reset settings" onConfirm={resetAll} onCancel={() => setConfirmReset(false)} />
  </section>;
}
