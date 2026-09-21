"use client";
import Script from 'next/script';
import AlchemyDataBridge from './alchemy-data-bridge';
import {memo,useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import SiteHeader from './site-header';
import {ShellProvider,useShell} from './shell-context';
import {getGameDataLoader} from './use-game-data';
import {createCharacterCatalogService,profileFromLocation} from '../lib/character-catalogs.mjs';
import CharacterBuilderRoot from './character-builder/character-builder-root';
import ChallengeRunsRoot from './challenge-runs/challenge-runs-root';
import {CharacterProvider} from './character-context';
import {EnchantingHud,SpellmakingHud,AlchemyHud,TravelHud} from './calculator-hud';
import EnchantingWorkstation from './calculators/enchanting/enchanting-workstation';
import SpellmakingWorkstation from './calculators/spellmaking/spellmaking-workstation';
import AlchemyWorkstation from './calculators/alchemy/alchemy-workstation';
import TravelWorkstation from './calculators/travel/travel-workstation';
import LevelSimulatorRoot from './level-simulator/level-simulator-root';
import CloudVaultModal from './character-vault/cloud-vault-modal';
import CloudVaultWorkstation from './character-vault/cloud-vault-workstation';
import HomeHubRoot from './home-hub/home-hub-root';
import JournalFactionsRoot from './journal-factions/journal-factions-root';
import AboutView from './views/about-view';
import ChangelogView from './views/changelog-view';
import { useActiveCharacter } from './character-context';

const LegacyBody=memo(function LegacyBody({html}){return <div id="legacy-workbench" dangerouslySetInnerHTML={{__html:html}}/>;});

function AboutViewOverlay() {
  const shell = useShell();
  if (shell.view === 'about') {
    return <AboutView />;
  }
  return null;
}

function ChangelogViewOverlay() {
  const shell = useShell();
  if (shell.view === 'changelog') {
    return <ChangelogView />;
  }
  return null;
}

function FactionsViewOverlay() {
  const shell = useShell();
  if (shell.view === 'factions') {
    return <JournalFactionsRoot />;
  }
  return null;
}

function HomeViewOverlay() {
  const shell = useShell();
  if (shell.view === 'home') {
    return <HomeHubRoot />;
  }
  return null;
}

function VaultPortal() {
  const { build, setBuild } = useActiveCharacter();
  return <CloudVaultModal activeBuild={build} onApplyBuild={setBuild} />;
}

function VaultViewOverlay() {
  const shell = useShell();
  if (shell.view === 'vault') {
    return <CloudVaultWorkstation />;
  }
  return null;
}

function ActiveViewOverlay() {
  const shell = useShell();
  if (shell.view === 'builder') {
    return <CharacterBuilderRoot />;
  }
  return null;
}

function ChallengeViewOverlay() {
  const shell = useShell();
  if (shell.view === 'challenge') {
    return <ChallengeRunsRoot />;
  }
  return null;
}

function LevelerViewOverlay() {
  const shell = useShell();
  if (shell.view === 'leveler') {
    return <LevelSimulatorRoot />;
  }
  return null;
}

export default function LegacyWorkbench({html,revision}){
 const isClient = typeof window !== 'undefined';
 const [dataReady,setDataReady]=useState(()=>isClient&&Boolean(window.POOL||window.MAJORS));
 const [slot,setSlot]=useState(null),[mainSlot,setMainSlot]=useState(null),[challengeSlot,setChallengeSlot]=useState(null),[levelerSlot,setLevelerSlot]=useState(null),[vaultSlot,setVaultSlot]=useState(null),[homeSlot,setHomeSlot]=useState(null),[factionsSlot,setFactionsSlot]=useState(null),[aboutSlot,setAboutSlot]=useState(null),[changelogSlot,setChangelogSlot]=useState(null);
 const [catalogReady,setCatalogReady]=useState(()=>isClient&&Boolean(window.siltCharacters?.active));
 const [booted,setBooted]=useState(()=>isClient&&Boolean(window.siltShell));
 const [enchantSlot,setEnchantSlot]=useState(null),[spellSlot,setSpellSlot]=useState(null),[alchemySlot,setAlchemySlot]=useState(null),[travelSlot,setTravelSlot]=useState(null);
 const [status,setStatus]=useState(()=>(isClient&&window.siltCharacters?.active)?{status:'ready'}:{status:'loading'}),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  setSlot(document.getElementById('react-header-slot'));
  setMainSlot(document.getElementById('panel-build') || document.getElementById('main-tools'));
  setChallengeSlot(document.getElementById('panel-challenge'));
  setLevelerSlot(document.getElementById('panel-leveler'));
  setVaultSlot(document.getElementById('panel-vault'));
  setHomeSlot(document.getElementById('panel-home'));
  setFactionsSlot(document.getElementById('panel-factions'));
  setAboutSlot(document.getElementById('panel-about'));
  setChangelogSlot(document.getElementById('panel-changelog'));
  if (isClient) {
    if (window.POOL || window.MAJORS) setDataReady(true);
    if (window.siltShell) setBooted(true);
    if (window.siltCharacters?.active) {
      setCatalogReady(true);
      setStatus({ status: 'ready' });
    }
  }

  function getOrCreateSlot(panelId, slotId) {
    const panel = document.getElementById(panelId);
    if (!panel) return null;
    let s = document.getElementById(slotId);
    if (!s) {
      s = document.createElement('div');
      s.id = slotId;
      const intro = panel.querySelector('p.muted') || panel.querySelector('h2');
      if (intro && intro.nextSibling) {
        panel.insertBefore(s, intro.nextSibling);
      } else {
        panel.appendChild(s);
      }
    }
    return s;
  }

  setEnchantSlot(getOrCreateSlot('panel-enchant', 'react-enchant-hud'));
  setSpellSlot(getOrCreateSlot('panel-spell', 'react-spell-hud'));
  setAlchemySlot(getOrCreateSlot('panel-alchemy', 'react-alchemy-hud'));
  setTravelSlot(getOrCreateSlot('panel-travel', 'react-travel-hud'));

  let current=true;
  const service=window.siltCharacters ||= createCharacterCatalogService(getGameDataLoader());
  service.profileFromLocation=()=>{let storage;try{storage=window.localStorage;}catch{}return profileFromLocation(window.location.hash,storage);};
  const update=e=>setStatus(e.detail);window.addEventListener('silt-character-status',update);
  setStatus({status:'loading'});
  const profile=service.profileFromLocation();
  service.prepare(profile).then(()=>{if(current){service.activate(profile);setCatalogReady(true);setStatus({status:'ready'});}},error=>{if(current)setStatus({status:'error',message:error.message});});
  return ()=>{current=false;window.removeEventListener('silt-character-status',update);};
 },[attempt]);
 const busy=(!booted&&(!isClient||!window.siltShell))||status.status==='loading';
 const retry=()=>{if(status.retry)Promise.resolve(status.retry()).catch(()=>{});else setAttempt(n=>n+1);};
 return <ShellProvider>
  <CharacterProvider>
    {(busy||status.status==='error')&&<div role={status.status==='error'?'alert':'status'} className="game-data-status">{status.status==='error'?<>Character data could not be loaded. <button type="button" onClick={retry}>Retry</button><p>{status.message}</p></>:'Loading character data…'}</div>}
    <div inert={busy||status.status==='error'} aria-busy={busy}>
     <LegacyBody html={html}/>
    </div>
    {slot&&createPortal(<SiteHeader/>,slot)}
    {mainSlot&&createPortal(<ActiveViewOverlay/>,mainSlot)}
    {challengeSlot&&createPortal(<ChallengeViewOverlay/>,challengeSlot)}
    {levelerSlot&&createPortal(<LevelerViewOverlay/>,levelerSlot)}
    {enchantSlot&&createPortal(<EnchantingWorkstation/>,enchantSlot)}
    {spellSlot&&createPortal(<SpellmakingWorkstation/>,spellSlot)}
    {alchemySlot&&createPortal(<><AlchemyDataBridge/><AlchemyWorkstation/></>,alchemySlot)}
    {travelSlot&&createPortal(<TravelWorkstation/>,travelSlot)}
    {vaultSlot&&createPortal(<VaultViewOverlay/>,vaultSlot)}
    {factionsSlot&&createPortal(<FactionsViewOverlay/>,factionsSlot)}
    {homeSlot&&createPortal(<HomeViewOverlay/>,homeSlot)}
    {aboutSlot&&createPortal(<AboutViewOverlay/>,aboutSlot)}
    {changelogSlot&&createPortal(<ChangelogViewOverlay/>,changelogSlot)}
    <VaultPortal />
    <Script id="legacy-data" src={'/legacy/legacy-data.js?v='+revision} strategy="afterInteractive" onReady={()=>setDataReady(true)}/>
    {(dataReady||(isClient&&Boolean(window.POOL)))&&(catalogReady||(isClient&&Boolean(window.siltCharacters?.active)))&&<Script id="legacy-runtime" src={'/legacy/legacy-runtime.js?v='+revision} strategy="afterInteractive" onReady={()=>setBooted(true)} onError={()=>setStatus({status:'error',message:'Application code failed to load. Reload this page.'})}/>}
  </CharacterProvider>
 </ShellProvider>;
}
