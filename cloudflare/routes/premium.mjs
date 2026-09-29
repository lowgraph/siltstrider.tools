import { timingSafeEqual } from 'node:crypto';
import { json, getCorsHeaders } from '../cors.mjs';
import { readLimitedBytes } from '../../lib/cloud-save-limits.mjs';

export async function handlePremiumCode(request,env,userId) {
  const cors=getCorsHeaders(request,env);
  if(request.method!=='POST')return json({message:'Method not allowed'},405,cors);
  if(!env.KOFI_VERIFICATION_TOKEN)return json({message:'Premium payments are not available yet.'},503,cors);
  const code='SS-'+crypto.randomUUID().replaceAll('-','');
  await env.DB.prepare('INSERT OR IGNORE INTO premium_support_codes (clerk_user_id,code) VALUES (?,?)').bind(userId,code).run();
  const row=await env.DB.prepare('SELECT code FROM premium_support_codes WHERE clerk_user_id=?').bind(userId).first();
  return json({code:row.code,url:'https://ko-fi.com/tmarcalferreira'},200,cors);
}

export function verifyKofi(data,secret) {
  if(typeof secret!=='string'||!secret||typeof data?.verification_token!=='string')return false;
  const a=new TextEncoder().encode(secret),b=new TextEncoder().encode(data.verification_token);
  return a.length===b.length&&timingSafeEqual(a,b);
}
export function paymentDetails(data) {
  // One-time Ko-fi tips and donations activate premium.
  if(!['Tip','Donation'].includes(data?.type)||data?.is_subscription_payment!==false)return null;
  if(typeof data?.currency!=='string'||!/^[A-Z]{3}$/.test(data.currency))return null;
  const amount=typeof data?.amount==='number'?data.amount.toFixed(2):data?.amount;
  if(typeof amount!=='string'||!/^\d{1,7}(\.\d{1,6})?$/.test(amount))return null;
  if(!/[1-9]/.test(amount))return null;
  const rawCodes=typeof data?.message==='string'?data.message.match(/\bSS-[a-f0-9]{32}\b/gi):null;
  if(!rawCodes)return null;
  const codes=rawCodes.map(c=>'SS-'+c.slice(3).toLowerCase());
  if(new Set(codes).size!==1)return null;
  if(typeof data?.kofi_transaction_id!=='string'||!data.kofi_transaction_id||data.kofi_transaction_id.length>200)return null;
  return {code:codes[0],amount,currency:data.currency,transactionId:data.kofi_transaction_id};
}
export async function handleKofiWebhook(request,env) {
  if(request.method!=='POST')return json({message:'Method not allowed'},405);
  if(!env.KOFI_VERIFICATION_TOKEN||!env.DB)return json({message:'Not configured'},503);
  let data;
  try {
    const text=new TextDecoder().decode(await readLimitedBytes(request.body,32768));
    data=JSON.parse(new URLSearchParams(text).get('data'));
  } catch { return json({message:'Invalid payload'},400); }
  if(!verifyKofi(data,env.KOFI_VERIFICATION_TOKEN)) {
    console.warn('[Ko-fi Webhook] Verification token mismatch');
    return json({message:'Unauthorized'},401);
  }
  const payment=paymentDetails(data);
  if(!payment) {
    console.warn('[Ko-fi Webhook] Payment details ignored or invalid:', JSON.stringify({
      type: data?.type,
      is_sub: data?.is_subscription_payment,
      amount: data?.amount,
      currency: data?.currency,
      has_tx: Boolean(data?.kofi_transaction_id),
      message_has_code: typeof data?.message === 'string' && /\bSS-[a-f0-9]{32}\b/i.test(data.message)
    }));
    return json({received:true,activated:false});
  }
  const owner=await env.DB.prepare('SELECT clerk_user_id FROM premium_support_codes WHERE code=?').bind(payment.code).first();
  if(!owner) {
    console.warn('[Ko-fi Webhook] No matching support code found for:', payment.code);
    return json({received:true,activated:false});
  }
  const now=new Date().toISOString();
  console.info(`[Ko-fi Webhook] Upgrading user ${owner.clerk_user_id} via transaction ${payment.transactionId} (${payment.amount} ${payment.currency})`);
  // Atomic and replay-safe: the transaction's recorded owner controls the upgrade.
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO premium_payments (transaction_id,clerk_user_id,amount,currency,received_at) VALUES (?,?,?,?,?)').bind(payment.transactionId,owner.clerk_user_id,payment.amount,payment.currency,now),
    env.DB.prepare("INSERT INTO user_tiers (clerk_user_id,tier,max_saves,max_loadouts,max_challenges,created_at,updated_at) SELECT clerk_user_id,'supporter',25,5,5,?,? FROM premium_payments WHERE transaction_id=? ON CONFLICT(clerk_user_id) DO UPDATE SET tier='supporter',max_saves=MAX(user_tiers.max_saves,25),updated_at=excluded.updated_at").bind(now,now,payment.transactionId)
  ]);
  return json({received:true});
}
