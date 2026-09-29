"use client";
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {ensureClerk,ensureClerkIfSignedIn} from '../lib/clerk-browser.mjs';
import {forgetCharacterForSignIn} from '../lib/sign-in-handoff.mjs';
const Context=createContext(null);
export const useAccount=()=>useContext(Context);
export function AccountProvider({children}) {
 const [profile,setProfile]=useState(null),[user,setUser]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const owner=useRef(null),epoch=useRef(0);
 async function request(method,data,refreshed=false,path='/api/account') {
  const generation=epoch.current;
  const clerk=await ensureClerk();const token=await clerk.session?.getToken({skipCache:refreshed});
  if(!token||generation!==epoch.current)throw new Error('Please sign in again.');
  const res=await fetch(path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  const body=await res.json();
  if(generation!==epoch.current)throw new Error('Account changed. Please retry.');
  if(res.status===401&&!refreshed)return request(method,data,true,path);
  if(res.status===401)throw new Error('Your session could not be renewed. Sign out and sign in again.');
  if(!res.ok)throw new Error(body.message||'Could not load account.');
  return body;
 }
 useEffect(()=>{
  let disposed=false,unsubscribe;
  // Clerk loads here only for a browser that is signed in (clerk-browser.mjs). For anyone
  // else it loads when they choose to sign in, and its silt-auth-ready event attaches us.
  function attach(){
   const clerk=window.Clerk;
   if(disposed||unsubscribe||!clerk?.addListener)return;
   // Signed out, then signed in, without leaving the page: an email sign-in inside
   // Clerk's window. The character kept for a Google or Discord round trip is not
   // needed, so it goes (sign-in-handoff.mjs). Arriving already signed in is that
   // round trip's return, where the builder has taken it back already.
   let seenSignedOut=false;
   unsubscribe=clerk.addListener(state=>{
    const id=state.session&&state.user?.id||null;
    if(!id)seenSignedOut=true;else if(seenSignedOut)forgetCharacterForSignIn();
    if(owner.current===id){setLoading(false);return;}
    owner.current=id;const generation=++epoch.current;setUser(id?state.user:null);setProfile(null);setError('');
    if(!id){setLoading(false);return;}
    setLoading(true);request('GET').then(p=>{if(!disposed&&generation===epoch.current)setProfile(p);}).catch(e=>{if(!disposed&&generation===epoch.current)setError(e.message);}).finally(()=>{if(!disposed&&generation===epoch.current)setLoading(false);});
   });
  }
  window.addEventListener('silt-auth-ready',attach);
  if(window.Clerk?.loaded)attach();
  else ensureClerkIfSignedIn().then(clerk=>{if(disposed)return;if(clerk)attach();else setLoading(false);}).catch(e=>{if(!disposed){setError(e.message);setLoading(false);}});
  return()=>{disposed=true;window.removeEventListener('silt-auth-ready',attach);epoch.current++;owner.current=null;unsubscribe?.();};
 },[]);
 async function save(data){const result=await request('PUT',data);setProfile(previous=>({...previous,...result}));return result;}
 return <Context.Provider value={{profile,user,error,loading,save, refresh: async()=>{const result=await request('GET');setProfile(result);return result;}, premiumCode:()=>request('POST',null,false,'/api/premium/code')}}>{children}</Context.Provider>;
}
