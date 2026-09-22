"use client";
import {Fragment} from 'react';
import {buildGearGroups,enchantCapacity,enchantMultiplier,gearRowLabel} from '../../lib/gear-rows.mjs';

function SourceRow({row,pick,alternative=false,enchantMult=0.1}){
  return <tr className={alternative?'gear-alt':undefined}>
    <td className="capitalize">{alternative?'or':gearRowLabel(row)}</td>
    <td><span className="gear-name">{pick?.name || 'None found'}</span>
      {pick&&<span className="gear-note">
        Base {row.category==='weapon'?'damage':row.category==='clothing'?'enchant capacity':'armor rating'}: {row.category==='clothing'?enchantCapacity(pick.strength,enchantMult):pick.strength}.
        {pick.condition&&` Condition: ${pick.condition.raw}/${pick.condition.maximum}.`}
        {pick.needsRepair&&' Broken: repair before use. Repair cost is not included.'}
        {pick.evidenceTruncated&&' Source search was capped; a better source may exist.'}
      </span>}
    </td>
    <td>{pick?<><span className="where">{pick.cellKey.replace(/^interior:/,'')}{pick.holder?` — ${pick.holder}`:''}</span>
      <span className="gear-note">{pick.acquisition}{pick.acquisition==='purchase'?` · Estimated value: ${pick.price ?? 'unknown'} gold`:''}{pick.theftRequired?' · Theft required':''} · {pick.nearStart?'Near starting area':'Farther away'}</span>
    </>:<span>No eligible source found in the published evidence.</span>}</td>
  </tr>;
}

export function GearSourcesView({build,beast=false,result,toggles,ranking}){
  const groups=result.status==='ready'?buildGearGroups(result.data.catalogs,build,toggles,ranking,{beast}):[];
  const enchantMult=enchantMultiplier(result.data?.catalogs?.GameSettings);
  return <details open><summary>Early game</summary>
    <p className="muted">Equipment for your major and minor skills, within the published early-game acquisition rules. Choose one armor set and one weapon. Ring recommendations identify one copy; a second copy is not assumed. Broken equipment must be repaired before use. Purchase values are condition-scaled estimates, not merchant quotes.</p>
    {beast&&<p className="muted">Equipment covering the head or feet is excluded for this race. Open helmets are checked against item body parts.</p>}
    {(result.status==='idle'||result.status==='loading')&&<p role="status">Loading early-game equipment...</p>}
    {result.status==='error'&&<p role="alert">Early-game equipment could not be loaded. <button type="button" className="mw-btn" onClick={result.retry}>Retry</button></p>}
    {result.status==='ready'&&<>
      <table><thead><tr><th>Slot</th><th>Item</th><th>Where</th></tr></thead><tbody>
        {groups.map(group=>{
          return group.rows.length?<Fragment key={group.label}><tr><th colSpan="3">{group.label}</th></tr>
            {group.rows.map(row=><Fragment key={row.key}><SourceRow row={row} pick={row.primary} enchantMult={enchantMult}/>{row.alternative&&<SourceRow row={row} pick={row.alternative} alternative enchantMult={enchantMult}/>}</Fragment>)}
          </Fragment>:null;
        })}
      </tbody></table>
      {!groups.some(g=>g.rows.length)&&<p>No equipment rows match these skills and settings.</p>}
    </>}
  </details>;
}
