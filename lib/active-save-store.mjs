/**
 * The loaded save, kept in this browser across page reloads until it is cleared.
 *
 * The parsed save is packed with the cloud vault's own SLT1 codec (a few kilobytes,
 * compressed and hash-checked) and stored as base64. Only this browser has it; nothing
 * leaves the machine. Anything that does not read back cleanly is discarded, never
 * half-restored.
 */
// The async codec: the browser compresses with CompressionStream. The synchronous one
// needs node:zlib, so it works in the tests and throws in every browser.
import { SAVE_TYPES, packCloudSaveAsync, unpackCloudSaveAsync } from "./cloud-save-codec.mjs";

export const ACTIVE_SAVE_KEY = "silt-active-save";
const VERSION = 1;

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const defaultStorage = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

/** Keep `save` for the next page load. Resolves false when storage is unavailable or full. */
export async function rememberSave(save, storage = defaultStorage()) {
  if (!storage || !save) return false;
  try {
    const payload = toBase64((await packCloudSaveAsync(SAVE_TYPES.OPENMW_SAVE, save)).packed);
    storage.setItem(ACTIVE_SAVE_KEY, JSON.stringify({ version: VERSION, storedAt: Date.now(), payload }));
    return true;
  } catch (err) {
    console.warn("The save could not be kept in this browser:", err?.message || err);
    return false;
  }
}

/** The kept save, or null. A record that does not decode is removed. */
export async function recallSave(storage = defaultStorage()) {
  if (!storage) return null;
  let raw = null;
  try { raw = storage.getItem(ACTIVE_SAVE_KEY); } catch { return null; }
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (record?.version !== VERSION || typeof record.payload !== "string") throw new Error("unknown record");
    const { saveType, data } = await unpackCloudSaveAsync(fromBase64(record.payload));
    if (saveType !== SAVE_TYPES.OPENMW_SAVE) throw new Error("not a save");
    return data;
  } catch {
    forgetSave(storage);
    return null;
  }
}

/** Stop keeping the save. */
export function forgetSave(storage = defaultStorage()) {
  if (!storage) return;
  try { storage.removeItem(ACTIVE_SAVE_KEY); } catch {}
}
