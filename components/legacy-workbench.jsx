"use client";
import Script from 'next/script';
import {memo,useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import SiteHeader from './site-header';
import {ShellProvider,useShell} from './shell-context';
import {getGameDataLoader} from './use-game-data';
import {createCharacterCatalogService,profileFromLocation} from '../lib/character-catalogs.mjs';
import CharacterBuilderRoot from './character-builder/character-builder-root';

const LegacyBody=memo(function LegacyBody({html}){return <div id="legacy-workbench" dangerouslySetInnerHTML={{__html:html}}/>;});

function ActiveViewOverlay() {
  const shell = useShell();
  if (shell.view === 'builder') {
    return <CharacterBuilderRoot />;
  }
  return null;
}

export default function LegacyWorkbench({html,revision}){
 const [dataReady,setDataReady]=useState(false),[slot,setSlot]=useState(null),[mainSlot,setMainSlot]=useState(null),[catalogReady,setCatalogReady]=useState(false),[booted,setBooted]=useState(false);
 const [status,setStatus]=useState({status:'loading'}),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  setSlot(document.getElementById('react-header-slot'));
  setMainSlot(document.getElementById('panel-build') || document.getElementById('main-tools'));
  let current=true;
  const service=window.siltCharacters ||= createCharacterCatalogService(getGameDataLoader());
  service.profileFromLocation=()=>{let storage;try{storage=window.localStorage;}catch{}return profileFromLocation(window.location.hash,storage);};
  const update=e=>setStatus(e.detail);window.addEventListener('silt-character-status',update);
  setStatus({status:'loading'});
  const profile=service.profileFromLocation();
  service.prepare(profile).then(()=>{if(current){service.activate(profile);setCatalogReady(true);setStatus({status:'ready'});}},error=>{if(current)setStatus({status:'error',message:error.message});});
  return ()=>{current=false;window.removeEventListener('silt-character-status',update);};
 },[attempt]);
 const busy=!booted||status.status==='loading';
 const retry=()=>{if(status.retry)Promise.resolve(status.retry()).catch(()=>{});else setAttempt(n=>n+1);};
 return <ShellProvider>
  {(busy||status.status==='error')&&<div role={status.status==='error'?'alert':'status'} className="game-data-status">{status.status==='error'?<>Character data could not be loaded. <button type="button" onClick={retry}>Retry</button><p>{status.message}</p></>:'Loading character data…'}</div>}
  <div inert={busy||status.status==='error'} aria-busy={busy}>
   <LegacyBody html={html}/>
  </div>
  {slot&&createPortal(<SiteHeader/>,slot)}
  {mainSlot&&createPortal(<ActiveViewOverlay/>,mainSlot)}
  <Script id="legacy-data" src={'/legacy/legacy-data.js?v='+revision} strategy="afterInteractive" onReady={()=>setDataReady(true)}/>
  {dataReady&&catalogReady&&<Script id="legacy-runtime" src={'/legacy/legacy-runtime.js?v='+revision} strategy="afterInteractive" onReady={()=>setBooted(true)} onError={()=>setStatus({status:'error',message:'Application code failed to load. Reload this page.'})}/>}
 </ShellProvider>;
}
