// Stable IDs: append icons; never renumber existing choices.
export const PROFILE_ICONS = Object.freeze(['Moon and Star', 'Silt Strider', 'Red Mountain', 'Mushroom Tower', 'Dwemer Cog', 'Netch']);
export function validateProfile(value) {
  if (!value || typeof value.username !== 'string' || !/^[A-Za-z0-9_]{3,24}$/.test(value.username)) throw new Error('Use 3–24 letters, numbers or underscores for your username.');
  if (!Number.isInteger(value.iconId) || value.iconId < 0 || value.iconId >= PROFILE_ICONS.length) throw new Error('Choose an available profile icon.');
  return { username: value.username, iconId: value.iconId };
}
