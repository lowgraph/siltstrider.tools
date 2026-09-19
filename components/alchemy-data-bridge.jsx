"use client";
import {useLayoutEffect,useState} from 'react';
import {useGameData} from './use-game-data';
import {useShell} from './shell-context';
import {adaptAlchemy} from '../lib/alchemy-catalogs.mjs';
export default function AlchemyDataBridge(){
  const {view,ready,profile}=useShell();
  const result=useGameData('alchemy',{enabled:view==='alchemy'});
  const [error,setError]=useState(null);
  useLayoutEffect(()=>{
    if(!ready)return;
    const runtime=window.siltAlchemyRuntime;
    runtime?.clear();setError(null);
    if(result.status==='ready'){
      try{if(!runtime)throw Error('Alchemy runtime is unavailable');runtime.install(adaptAlchemy(result.data,window.__MW_EFFECTS));}
      catch(e){runtime?.clear();setError(e.message);}
    }
  },[ready,profile,result.status,result.data]);
  if(view!=='alchemy')return null;
  if(error||result.status==='error')return <div role="alert">Alchemy data could not be loaded. {error||result.error?.message} <button className="mw-btn" onClick={result.retry}>Retry alchemy data</button></div>;
  return result.status!=='ready'?<p role="status">Loading alchemy data...</p>:null;
}
