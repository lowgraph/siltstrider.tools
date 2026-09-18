"use client";
import Script from 'next/script';
import {memo,useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import SiteHeader from './site-header';
import {ShellProvider} from './shell-context';
// Keep React updates from replacing calculator DOM and in-progress user input.
const LegacyBody=memo(function LegacyBody({html}){return <div id="legacy-workbench" dangerouslySetInnerHTML={{__html:html}}/>;});
export default function LegacyWorkbench({html,revision}){
 const [dataReady,setDataReady]=useState(false),[slot,setSlot]=useState(null);
 useEffect(()=>setSlot(document.getElementById('react-header-slot')),[]);
 return <ShellProvider>
  <LegacyBody html={html}/>
  {slot&&createPortal(<SiteHeader/>,slot)}
  <Script id="legacy-data" src={'/legacy/legacy-data.js?v='+revision} strategy="afterInteractive" onReady={()=>setDataReady(true)}/>
  {dataReady&&<Script id="legacy-runtime" src={'/legacy/legacy-runtime.js?v='+revision} strategy="afterInteractive"/>}
 </ShellProvider>;
}
