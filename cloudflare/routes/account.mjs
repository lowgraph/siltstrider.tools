import { json, getCorsHeaders } from '../cors.mjs';
import { readLimitedBytes } from '../../lib/cloud-save-limits.mjs';
import { validateProfile } from '../../lib/account-profile.mjs';
export async function handleAccount(request, env, userId) {
  const cors = getCorsHeaders(request, env);
  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT username, icon_id AS iconId FROM account_profiles WHERE clerk_user_id = ?').bind(userId).first();
    return json(row || {username:'', iconId:0}, 200, cors);
  }
  if (request.method !== 'PUT') return json({message:'Method not allowed'},405,cors);
  let profile;
  try { profile = validateProfile(JSON.parse(new TextDecoder().decode(await readLimitedBytes(request.body,1024)))); }
  catch (error) { return json({message:error.message},400,cors); }
  try {
    await env.DB.prepare('INSERT INTO account_profiles (clerk_user_id, username, icon_id, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(clerk_user_id) DO UPDATE SET username=excluded.username, icon_id=excluded.icon_id, updated_at=excluded.updated_at').bind(userId,profile.username,profile.iconId,new Date().toISOString()).run();
    return json(profile,200,cors);
  } catch(error) {
    if (/UNIQUE constraint failed: account_profiles.username/.test(error.message)) return json({message:'That username is already taken.'},409,cors);
    return json({message:'Could not save your profile. Please retry.'},500,cors);
  }
}
