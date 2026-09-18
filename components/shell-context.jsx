"use client";
import {createContext,useContext,useSyncExternalStore} from 'react';
const initial=Object.freeze({ready:false,world:'vanilla',arce:false,profile:'vanilla',view:'home'});
const subscribe=listener=>{window.addEventListener('silt-shell-change',listener);return ()=>window.removeEventListener('silt-shell-change',listener);};
const getSnapshot=()=>window.siltShell?.getSnapshot() || initial;
const getServerSnapshot=()=>initial;
const ShellContext=createContext(null);
export function ShellProvider({children}) {
  const state=useSyncExternalStore(subscribe,getSnapshot,getServerSnapshot);
  return <ShellContext.Provider value={{...state,navigate:view=>window.siltShell?.navigate(view),setProfile:profile=>window.siltShell?.setProfile(profile)}}>{children}</ShellContext.Provider>;
}
export function useShell(){const shell=useContext(ShellContext);if(!shell)throw new Error('ShellProvider required');return shell;}
