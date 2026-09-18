"use client";
import {useEffect,useState} from 'react';
import {createBundleLoader} from '../lib/bundle-loader.mjs';
import {useShell} from './shell-context';
let loader;
export function getGameDataLoader(){
  return loader ||= createBundleLoader({baseUrl:process.env.NEXT_PUBLIC_GAME_DATA_URL || '/game-data/'});
}
// Call only inside the active tool. No downloads occur until enabled and shell ready.
export function useGameData(feature,{enabled=true}={}){
  const {profile,ready}=useShell();
  const [attempt,setAttempt]=useState(0),[state,setState]=useState(null);
  const active=enabled&&ready;
  const requestKey=profile+':'+feature+':'+attempt;
  useEffect(()=>{
    if(!active)return;
    let current=true;
    setState({key:requestKey,status:'loading',data:null,error:null});
    getGameDataLoader().loadFeature(profile,feature).then(
      data=>{if(current)setState({key:requestKey,status:'ready',data,error:null});},
      error=>{if(current)setState({key:requestKey,status:'error',data:null,error});}
    );
    return ()=>{current=false;};
  },[active,profile,feature,requestKey]);
  const visible=active?(state?.key===requestKey?state:{status:'loading',data:null,error:null}):{status:'idle',data:null,error:null};
  return {...visible,retry:()=>setAttempt(n=>n+1)};
}
