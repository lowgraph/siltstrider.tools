"use client";
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {ensureClerk} from '../lib/clerk-browser.mjs';
const Context=createContext(null);
export const useAccount=()=>useContext(Context);
export function AccountProvider({children}) {
 const [profile,setProfile]=useState(null),[user,setUser]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const owner=useRef(null),epoch=useRef(0);
 async function request(method,data,refreshed=false) {
  const generation=epoch.current;
  const clerk=await ensureClerk();const token=await clerk.session?.getToken({skipCache:refreshed});
  if(!token||generation!==epoch.current)throw new Error('Please sign in again.');
  const res=await fetch('/api/account',{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  const body=await res.json();
  if(generation!==epoch.current)throw new Error('Account changed. Please retry.');
  if(res.status===401&&!refreshed)return request(method,data,true);
  if(res.status===401)throw new Error('Your session could not be renewed. Sign out and sign in again.');
  if(!res.ok)throw new Error(body.message||'Could not load account.');
  return body;
 }
 useEffect(()=>{
  let disposed=false,unsubscribe;
  ensureClerk().then(clerk=>{if(disposed)return;unsubscribe=clerk.addListener(state=>{
   const id=state.session&&state.user?.id||null;
   if(owner.current===id){setLoading(false);return;}
   owner.current=id;const generation=++epoch.current;setUser(id?state.user:null);setProfile(null);setError('');
   if(!id){setLoading(false);return;}
   setLoading(true);request('GET').then(p=>{if(!disposed&&generation===epoch.current)setProfile(p);}).catch(e=>{if(!disposed&&generation===epoch.current)setError(e.message);}).finally(()=>{if(!disposed&&generation===epoch.current)setLoading(false);});
  });}).catch(e=>{if(!disposed){setError(e.message);setLoading(false);}});
  return()=>{disposed=true;epoch.current++;owner.current=null;unsubscribe?.();};
 },[]);
 async function save(data){const result=await request('PUT',data);setProfile(result);return result;}
 return <Context.Provider value={{profile,user,error,loading,save}}>{children}</Context.Provider>;
}
