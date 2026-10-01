import { validateSave, profileForSave, buildFromSave } from './omwsave-import.mjs';
import { createCharacterCatalogService } from './character-catalogs.mjs';
import { generateBuildShareUrl, sanitizeBuild } from './character-vault.mjs';

/** Resolve the save itself, without applying it or borrowing the visitor's character. */
export async function generateSaveShareUrl(save, loader, origin = '') {
  validateSave(save);
  const { profile } = profileForSave(save);
  const catalogs = await createCharacterCatalogService(loader).prepare(profile);
  const { build, unresolved } = buildFromSave(save, catalogs, { profile });
  if (unresolved.length) {
    const fields = [...new Set(unresolved.map(({ field }) => field))].join(', ');
    throw new Error(`Cannot share this save as a build: ${fields} could not be resolved in its world. You can export the save instead.`);
  }
  if (!sanitizeBuild(build)?.maj || build.fav1 === build.fav2) {
    throw new Error('Cannot share this save as a build: its class needs ten distinct skills and two different favored attributes. You can export the save instead.');
  }
  return generateBuildShareUrl(build, origin);
}
