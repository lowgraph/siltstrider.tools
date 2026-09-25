import { PROFILE_ICONS } from '../lib/account-profile.mjs';
export default function ProfileIcon({id=0, size=40}) {
 const shapes=[
  <><path d="M20 5a11 11 0 1 0 7 18A12 12 0 0 1 20 5Z"/><path d="m26 5 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z"/></>,
  <g transform="scale(1.25)"><ellipse cx="16" cy="10" rx="8.5" ry="5" fill="currentColor"/><path d="M9.5 12.5 5.5 20 3.5 29M13.5 14.6 11.5 22 10.5 29M18.5 14.6 20.5 22 21.5 29M22.5 12.5 26.5 20 28.5 29" strokeWidth="2.2" strokeLinecap="round"/></g>,
  <><path d="m4 33 12-22 5 8 4-7 12 21Z"/><path d="m16 11 1-6m5 5 3-7m-7 19 3 5 3-7"/></>,
  <><path d="M6 18c0-16 28-16 28 0Z M17 19l-2 15h12l-4-15M19 27h4v7"/><circle cx="15" cy="12" r="2"/><circle cx="26" cy="13" r="2"/></>,
  <><path d="m16 4 8 0 1 6 5 3 6-1 2 7-5 4-1 5 3 5-6 5-5-4-6 0-5 4-6-5 3-5-1-5-5-4 2-7 6 1 5-3Z"/><circle cx="20" cy="21" r="7"/></>,
  <><path d="M5 19C3 0 37 0 35 19Q20 25 5 19Z M10 22q-6 7 1 12m6-10q-4 7 0 13m6-13q5 6 0 13m7-15q7 7 1 12"/></>
 ];
 const safe=Number.isInteger(id)&&id>=0&&id<shapes.length?id:0;
 return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-label={PROFILE_ICONS[safe]} role="img">{shapes[safe]}</svg>;
}
