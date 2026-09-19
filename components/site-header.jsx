"use client";
import {useEffect,useRef,useState} from 'react';
import {useShell} from './shell-context';
const descriptions={home:'Pick a planner for this playthrough.',challenge:'Roll a character, a major goal, side tasks, and restrictions.',builder:'Premade sheets and a custom class builder. Optimize gear when you are ready.',about:'About this unofficial fan project.',changelog:'What changed on the site, newest first.',enchanting:'Effects, souls, and named enchanters.',spellmaking:'Magicka, cast chance, and spellmaker gold.',alchemy:'Apparatus, ingredients, and brew numbers.',travel:'Fewest hops between towns.'};
export default function SiteHeader(){
 const shell=useShell(),[open,setOpen]=useState(false),root=useRef(null),menu=useRef(null);
 useEffect(()=>setOpen(false),[shell.view]);
 useEffect(()=>{
  const key=e=>{if(e.key==='Escape'&&open){setOpen(false);menu.current?.focus();}};
  const outside=e=>{if(!root.current?.contains(e.target))setOpen(false);};
  document.addEventListener('keydown',key);document.addEventListener('click',outside);
  return ()=>{document.removeEventListener('keydown',key);document.removeEventListener('click',outside);};
 },[open]);
 const navigate=(e,view)=>{e.preventDefault();shell.navigate(view);setOpen(false);};
 return <div className="topbar" ref={root}>
  <div className="brand"><h1><a href="#home" className="brand-home" onClick={e=>navigate(e,'home')}>Silt Strider</a></h1>
   <p className="kicker">siltstrider.tools — Morrowind build planner &amp; challenge run generator<span className="page-sub">{descriptions[shell.view]}</span></p>
  </div>
  <button ref={menu} type="button" className="hamburger" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="react-menu-drawer" onClick={()=>setOpen(!open)}>{open ? '✕' : '☰'}</button>
  <div className={'header-tools menu-drawer'+(open?' open':'')} id="react-menu-drawer">
   <div className="nav-primary">
    <button type="button" id="react-nav-challenge" className={'btn'+(shell.view==='challenge'?' on':'')} disabled={!shell.ready} aria-current={shell.view==='challenge'?'page':undefined} onClick={e=>navigate(e,'challenge')}>Challenge Runs</button>
    <button type="button" id="react-nav-build" className={'btn'+(shell.view==='builder'?' on':'')} disabled={!shell.ready} aria-current={shell.view==='builder'?'page':undefined} onClick={e=>navigate(e,'builder')}>Build Optimizer</button>
   </div>
   <div className="nav-secondary world-bar"><div className="world-controls">
    <span className="drawer-label">Game World Profile</span>
    <div className="seg" role="group" aria-label="World">
     <button type="button" className={'seg-btn'+(shell.world==='vanilla'?' on':'')} disabled={!shell.ready} aria-pressed={shell.world==='vanilla'} onClick={()=>shell.setProfile('vanilla')}>Vanilla</button>
     <button type="button" className={'seg-btn'+(shell.world==='tr'?' on':'')} id="react-world-tr" title="Tamriel Rebuilt" disabled={!shell.ready} aria-pressed={shell.world==='tr'} onClick={()=>shell.setProfile(shell.arce?'tr_arce':'tr')}>Tamriel Rebuilt</button>
    </div>
    {shell.world==='tr'&&<button type="button" id="react-arce" className={'arce-toggle'+(shell.arce?' on':'')} title="ARCE - Extra Races and Classes" aria-pressed={shell.arce} onClick={()=>shell.setProfile(shell.arce?'tr':'tr_arce')}>ARCE - Extra Races and Classes</button>}
   </div></div>
  </div>
 </div>;
}
