"use client";
import Script from 'next/script';
import { useState } from 'react';

// Trusted build-time markup only. This compatibility boundary owns its DOM;
// migrate complete tools out of it before introducing React state inside them.
export default function LegacyWorkbench({ html, revision }) {
  const [dataReady,setDataReady] = useState(false);
  return <>
    <div id="legacy-workbench" dangerouslySetInnerHTML={{ __html: html }} />
    <Script id="legacy-data" src={'/legacy/legacy-data.js?v='+revision}
      strategy="afterInteractive" onReady={() => setDataReady(true)} />
    {dataReady && <Script id="legacy-runtime" src={'/legacy/legacy-runtime.js?v='+revision} strategy="afterInteractive" />}
  </>;
}
