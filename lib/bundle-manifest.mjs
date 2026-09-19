import {isDeepStrictEqual} from 'node:util';

// Ignore only the informational build timestamp of identical releases.
export function sameBundleManifest(a,b){
 const {builtAtUnix:ignoredA,...left}=a;
 const {builtAtUnix:ignoredB,...right}=b;
 return isDeepStrictEqual(left,right);
}
