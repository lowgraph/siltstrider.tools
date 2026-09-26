"use client";
import {useEffect,useState} from 'react';
import {useAccount} from './account-context';
import {useShell} from './shell-context';
import ProfileIcon from './profile-icon';
import {PROFILE_ICONS,validateProfile} from '../lib/account-profile.mjs';
import {ensureClerk} from '../lib/clerk-browser.mjs';
export default function AccountPage(){
 const account=useAccount(),shell=useShell();
 const [support,setSupport]=useState(null);
 useEffect(()=>{setSupport(null);},[account.user?.id]);
 async function prepareSupport(){setBusy(true);try{setSupport(await account.premiumCode());setMessage('');}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 async function checkPayment(){setBusy(true);try{const profile=await account.refresh();setMessage(profile.premium?'Premium is active. Thank you!':'Payment not confirmed yet. Check that your Ko-fi message includes your support code, then try again.');}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 const [username,setUsername]=useState(''),[iconId,setIcon]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setUsername(account.profile?.username||'');setIcon(account.profile?.iconId||0);},[account.profile,account.user?.id]);
 async function submit(event){event.preventDefault();setBusy(true);setMessage('');try{await account.save(validateProfile({username,iconId}));setMessage('Profile saved.');}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 async function auth(action){try{const clerk=await ensureClerk();await clerk[action]();}catch(e){setMessage(e.message);}}
 return <section className="account-page"><h2>Your account</h2><p>Choose how you appear on Silt Strider.</p>
 <p>{account.profile?.premium ? 'Premium supporter · 25 cloud-save slots · thank you for supporting Silt Strider.' : 'Free account · 5 cloud-save slots'}</p>
 <button onClick={()=>shell.navigate('vault')}>Open Cloud Vault →</button>
 {account.loading?<p>Loading account…</p>:!account.user?<button onClick={()=>auth('openSignIn')}>Sign in</button>:<form onSubmit={submit}>
 <div className="account-preview"><ProfileIcon id={iconId} size={80} premium={account.profile?.premium === true}/><strong>{username||'Adventurer'}</strong></div>
 <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" required autoComplete="username" aria-describedby="username-help"/></label>
 <p id="username-help">3–24 letters, numbers or underscores. Usernames are unique, ignoring capitalization.</p>
 <fieldset><legend>Choose your icon</legend><div className="account-icons">{PROFILE_ICONS.map((label,id)=><label key={id} className={iconId===id?'selected':''}><input type="radio" name="profile-icon" value={id} checked={iconId===id} onChange={()=>setIcon(id)}/><ProfileIcon id={id} size={56}/><span>{label}</span></label>)}</div></fieldset>
 <button type="submit" disabled={busy}>{busy?'Saving…':'Save profile'}</button><button type="button" onClick={()=>auth('signOut')}>Sign out</button></form>}
 {account.user&&!account.profile?.premium&&<section aria-label="Premium"><h3>Become a Premium supporter</h3><p>25 shared cloud-save slots and a gold border around your icon. One-time support, no subscription. Pay what you want on Ko-fi; suggested US$3.</p>
 <button disabled={busy} onClick={prepareSupport}>Support on Ko-fi</button>
 {support&&<div><p>Copy this code into your Ko-fi payment message so we can upgrade your account:</p><code style={{overflowWrap:'anywhere'}}>{support.code}</code><p><a href={support.url} target="_blank" rel="noopener noreferrer">Continue to Ko-fi →</a></p><p>Choose a one-time tip in any currency. After paying, return here to check your upgrade.</p><button disabled={busy} onClick={checkPayment}>Check payment status</button></div>}</section>}
 {(message||account.error)&&<p role="status">{message||account.error}</p>}</section>;
}
