# Changelog

## Launch polish — 2026-10-02

- Premade category names, build counts and Expand/Collapse labels stay readable on phones in both themes.

- The Health chart marks the level where Endurance reaches 100 even when it is the final level in your forecast.

- Health forecasts show clean totals with at most one decimal, including Bitter Cup plans. Fractional level-up gains remain intact.


## Ingredient sources and remote journeys — 2026-10-01

- After you edit a premade character, Gear Advisor ranks the whole endgame kit for your current choices, including armour, clothing and jewellery. The kit uses the same character name as Builder and Home; unchanged premades keep their published picks.

- About credits LowGraph and links to the project’s open source code under AGPL-3.0-or-later. It distinguishes the code licence from game and mod data, font and branding rights.

- Faction Journal uses published faction names in friendly and hostile relations and leaves deprecated entries out of its roster. Saved memberships stay intact.

- Premade cards explain how each build plays and its trade-off. Major and Minor skills are written out, and specialization explains which skills it helps; the explanations also appear when browsing by race.

- Alchemy leaves Secret Master’s apparatus out of every world, including Tamriel Rebuilt’s renamed tools. Available tools remain ordered by effectiveness.

- Travel accepts Ald’ruhn, Ald-ruhn and Aldruhn in place searches. While you edit a location, it asks you to choose a result instead of showing the previous trip; cancelling restores it. Shared journeys keep their starting point when a saved character loads.

- Travel finds the everyday Ebonheart–Mournhold teleport in all three worlds, including with walking switched off. Named cities now include teleport-only rooms that were missing from the transport stop list.

- Character Builder's Configure explanations stay inside the screen and above the phone tab bar. They open above their buttons when needed; long text scrolls inside the box. Tap again, tap outside or press Escape to close.

- On phones, Gear Advisor stacks each recommendation's slot, item and source so names stay readable. This applies to early-game equipment, the optimized endgame kit and its runner-ups; desktop tables keep their columns.

- Gear Advisor keeps boots and closed helmets out of beast races' optimized kits and every runner-up list, including after changing weapon preference. Open helmets remain available; ARCE races that are not beasts keep their eligible footwear. Equipping recommendations uses the same race rules.

- Builder, Home and Level Simulator show the same current race, gender and birthsign. After you edit a premade, its old title reads "Based on …" rather than describing the edited character; your own character names stay unchanged.

- Level Simulator keeps fractional Health gains, following the OpenMW 0.51 source. Its chart starts from your character's Health and Endurance, including loaded saves; starting at 30 Endurance reaches 100 at level 15 with +5 each level. Bitter Cup changes future gains when it changes Endurance, without recalculating starting Health.

- Enchanting counts every effect's running cost toward capacity, rounding each down. Two Constant Effects of 5 points now use 75 capacity points; a 5-point, 5-second Target effect fits a Common Ring at 1 point. Self-enchant chance uses the costs before rounding, and the base price uses the final running cost without an extra Constant multiplier, following the OpenMW 0.51 source.

- Share links from imported Cloud Vault saves carry the save's world, race, gender, birthsign and class choices. Challenge links keep the run's world after you switch worlds. A save with choices the site's data cannot resolve shows an error instead of sharing a different character.

- Loading a character build from Cloud Vault selects its saved world before showing its statistics. Signing in keeps this browser's world until you choose a Preferred world in Your account; header changes and loaded saves do not replace that preference.

- **The Morrowind UI looks like the game:** black windows, tan text and the game's frames. Modern UI is unchanged.
- **Keep your character when signing out:** an unsaved Builder character survives the return to Home, including its world, race, birthsign, skill choices and equipment. Loaded saves continue to stay in this browser until cleared.
- **Try a longer journey when needed:** Travel first plans with nearby walks and short swims. If no route is available, it tries long walks and open-water swims, including routes to Ald Redaynia. Normal trips still use transport, and mixed legs show walking and swimming time separately.
- **Where to get an ingredient:** each selected Alchemy ingredient now has a "Where to get it" button. See shops and their stock/restocking, plants and harvest chances, creature drops, and loose finds or deposits with their locations. Sources load when opened; changing an ingredient closes its old sources. The effect finder also keeps its pair shortcut.
- **More useful ingredient sources:** hidden test and holding rooms no longer appear as places to get ingredients. Creature drops leave out rare random loot, so the list focuses on drops you can reasonably gather.

## Easier journeys and first steps — 2026-09-30

- **Walk between city stops:** cities remain one search choice. Search for a particular hall, service or provider to choose a precise stop. Journeys through a city include the outdoor walks between transport stops and show real movement time on each walk. Time spent indoors is still uncounted.
- **Find a potion's ingredients:** choose the effects you want, see ingredient pairs and their additional effects, and load a pair into the Alchemy calculator. Shop availability is not listed yet.
- **Travel starts with a useful trip:** without a save or shared route, start in Seyda Neen and head to Balmora. Least real time favors less outdoor movement, then fewer transport or spell transitions; menus and loading remain uncounted. While the network loads, the route shows a loading message.
- **Alchemy tools you can obtain:** Secretmaster apparatus is removed from the picks, and tools run from strongest to weakest instead of alphabetically.
- **Type the soul you trapped:** Enchanting accepts a custom soul size, including 300 in a Grand Soul Gem. Constant Effect still needs at least 400.
- **Calculators within reach:** wide screens show Alchemy, Enchanting and Spellmaking directly; compact screens group all three under Calculators.
- **Your settings across devices:** signed-in accounts can remember their world, theme, Travel, Gear Advisor and Challenge defaults. Choose shared or world-specific defaults, optionally override save-derived Travel toggles, and reset one tool or everything. Shared links keep their choices; guests keep their own browser preferences.
- **One Travel network status:** the network name and stop count share one plain line. Loading and an error with Retry use that same line, and TR + ARCE is named explicitly.
- **Clearer small print:** Gear Advisor runner-up buttons, Level Simulator preset descriptions, faction ranks and empty equipment slots are easier to read in both themes.
- **See the real-time trade-off:** route results now show “Real Time Approximation” beside the time passing in-game. Walking, swimming and Levitate use your estimated movement speed; transport and spell transitions are counted separately. Cheapest explains how much gold it saves and how much movement it adds compared with Fewest legs using the same options. Combat, menus, loading and time indoors are excluded.
- **Travel remembers your choices:** changes to a loaded save’s guild, Intervention, carried items and movement options stay in this browser for that save and world profile. “Use save defaults” clears those edits. Intervention scrolls start unticked and each journey can use only the number carried. Known spells show estimated cast chance and need enough current Magicka; uncertain or low-chance spells start unticked. Replanning does not spend the save’s items or Magicka.
- **Your journey comes first:** Origin, Destination and “Plan for” now sit above the route answer on every screen size. Character and route options start folded with a summary of your choices; guild, spells, items and carrying have their own group, while walking and quest teleports are under Route style. Quick starting places open on demand, and “How routes are worked out” is at the bottom. Guild and carrying warnings stay beside the route.
- **One search for each end of a journey:** towns, transit stops and named places now share one list. Towns and stops appear first, followed by outdoor locations and rooms such as "Balmora › Council Club". Pelagiad appears once even though it has no transit stop. Each result says how it is reached, and typing a search leaves the route unchanged until you choose a result.

- **Premade builds first for newcomers:** the first time you open the Character Builder, it starts on the Premade Builds Catalog, since picking a build and changing it is easier than composing a class from nothing. "Build my own instead" goes straight to the Custom Class Builder. After that first visit, or with a shared link, a loaded save or a saved character, the Builder opens as before.
- **Two equal ways to start on Home:** "Start a character" now sits beside "Load your save" as an equal, with its own button to the Character Builder, instead of a small "No save yet?" link further down. On a phone, starting a character comes first, since few people have a save to hand there.
- **Your character is one click from the Builder:** wherever a tool names the character you are using (Alchemy, Enchanting, Spellmaking, Travel, the Faction Journal, and now the Level Simulator), the name links to the Character Builder to change it, and it is the same name Home shows. The Faction Journal's character line, which never appeared, now shows on wider screens. In the calculators, the button for your own numbers says "type your own", so there is only one "change".
- **Header menus from the keyboard:** opening Calculators or More with Enter or Space (or a screen reader) now puts you on the menu's first item, as the arrow keys already did; opening one with the mouse leaves you where you were.
- **The Level Simulator leads with the simulator:** "Drink Bitter Cup before leveling", a niche artifact trick, was the first control on the page; it now waits under a closed "Advanced options", after the progression view, and the group opens by itself while the Bitter Cup is on. The attribute priority list uses the sheet's three-letter names (END, PER, STR…) instead of cut-off ones ("Endur…"); screen readers and the tooltip still give the full name.
- **Cloud saves are checked when they load:** each save in the Cloud Vault carries a checksum taken when it was stored. Loading or exporting one now compares the two first; a save whose stored data no longer matches is not loaded into your tools, and the Vault says so, with a reference to quote in a bug report.
- **Your account in the Cloud Vault's header:** signed in, the Vault's header shows your name, your tier and how many of your saves you use, on screens 640 pixels and wider. A leftover style had hidden it on every screen.
- **One lock per rolled item in Challenge Runs:** race, class and sign each had a lock in the character card and another under "Pinned Slots", and the major objective and restrictions had two as well. Now each rolled item (race, class, birthsign, major objective, restrictions, minor objectives) has one lock, on the sheet beside it, with its own Roll; a locked item's Roll waits. The settings' "Choose instead of rolling" picks a race, class or birthsign, and a choice is locked so the next roll keeps it; "Roll it" gives it back to the dice. The race row shows the race alone, since the lock keeps the race and not the gender.
- **One box per Alchemy slot:** each crucible slot had a dropdown of every ingredient and a separate "Search..." field. It is now one box: type part of a name and the matches appear (names that start with what you typed first), choose with the arrow keys and Enter or a click, and Escape puts back what the slot held. Screen readers hear how many ingredients match.
- **Enchanting starts where you do:** it opens on an Expensive Ring and a Lesser Soul Gem, an enchantment you can afford early, instead of an Exquisite Ring and a Grand Soul Gem, and a new effect starts at 5 points for 5 seconds, so it fits that ring (a Restore Health uses 6 of its 15 points). The item list adds the common, expensive and extravagant rings, amulets, shirts and robes, cheapest first, with the game's capacities; a Common Ring holds a single point.
- **What the site does for you, not how much it counts:** the strip under Home's hero said "27 skills modeled", "103 hand-picked challenge restrictions" and the number of travel stops. It now says what you get: ×5 attribute bonuses planned level by level; any town reached by silt strider, boat, Guild Guide or on foot, at your fare; early gear for your build and where to buy or find it; and the 3 worlds, each from its own game data.
- **More room on a phone:** the header is one row, the site's name and then theme, search, account and menu buttons (search is a magnifier; its taglines are gone), so pages start about 190 pixels higher. In the Character Builder, one row of four sections (Configure, Sheet, Loadouts, Premades) replaces the three stacked tabs and the second Configurator / Character Sheet toggle, and the form starts in the first screen. In the phone menu, Character Builder and Challenge Runs no longer look dimmer than the other tools.
- **The most used tools first:** the menu bar now reads Character Builder, Level Simulator, Travel Planner, Alchemy, Faction Journal and Challenge Runs, and Home lists Travel before Alchemy. On a phone, the bottom bar has Travel in place of Alchemy, which is a tap away in the menu.
- **Two more bits of small print you can read:** for a Khajiit or Argonian, the Equipped Loadouts' Boots slot and its "Beast races cannot wear boots" were faded almost to the background; and a ticked Challenge Runs objective was faded as well as struck through. Both are readable now, in both themes.
- **Tidier Cloud Vault saves:** on each saved character, Rename and Delete no longer sit in grey boxes (Delete was barely readable), renaming keeps its Save and Cancel buttons whole instead of breaking their words, and screen readers now name the box you type the new name in. On Your account, "Become a Premium supporter" is a proper section heading.

## Privacy, sign-in and launch readiness — 2026-09-29

- **Explanations when you need them:** each tool's calculation and rules notes now sit in a closed "How this is calculated" disclosure, with plainer wording and the formulas inside. Travel's route is easier to reach on a phone. The Cloud Vault explains when character data is uploaded and how many saves each account can keep.
- **No cookies unless you sign in:** Clerk loads only for a browser that is signed in or when you click Sign in, so a visit without signing in sets no cookies. The Privacy Policy gains "Cookies, local files and browser storage", covering Clerk's sign-in cookies, browser storage, and Cloudflare Web Analytics, which counts page visits without cookies or storage.
- **Sign-in keeps your character:** Google and Discord sign-in reloads the page, which reset an unsaved character to the default. The builder now keeps it for that round trip only.
- **Compatibility notice:** the save importers and About say OpenMW only; vanilla, Tamriel Rebuilt and TR + ARCE are tested; other mods are untested; `.ess` saves are not supported.
- **Bug reports:** Report a bug in the footer and on About opens an email template that attaches no character data. Server errors show a reference ID, and the matching log holds no payloads or tokens.
- **Accurate privacy claims:** About's FAQ and the Vault's search description no longer promise that nothing leaves the browser.
- **Hosting:** only API requests run the Worker; pages and game data are served directly, so busy days cost far fewer Worker requests. `www` redirects through a Cloudflare rule.
- Ko-fi donations and case-insensitive support codes are recognized. Sharper favicons.
- **Keyboard and screen readers:** every control shows where focus is, in both themes and in Windows high contrast. The challenge pool browser, the equipment picker and the Cloud Vault behave as dialogs: focus moves in, Tab stays inside, Escape closes them and focus returns. Scrolling lists can be scrolled from the keyboard, each tool's heading sits in the main content where Skip to main content lands, and toggles and disclosures report their state. Form controls are labelled and the account page has a proper heading.
- **A proper 404 page:** an unknown address shows a page with links back instead of a bare error.
- **Sturdier share links:** a link naming a JavaScript built-in (such as "constructor") as its race or sign no longer crashes the builder.
- **Security headers:** other sites cannot frame the pages, and responses send nosniff, a referrer policy and HSTS.
- **Open source:** the site is AGPL-3.0 and the data pipeline GPL-3.0; game and mod data stay with their owners.
- **The Level Simulator reads fighters correctly:** a fighter who takes Mercantile and Speechcraft as minor skills, like the default character, was treated as a Diplomat and told to raise Personality at its first level-up. It is now a Warrior (Endurance, Strength and Agility first), and the simulator says why it chose an archetype: "Detected from major skills Long Blade, Heavy Armor and Block."
- **Travel and the Mages Guild:** Guild Guide legs now say they are for Mages Guild members only. With a loaded save whose character is not a member, routes leave Guild Guides out and a note says why: the game's Mages Guild refuses its services to anyone outside the guild.
- **Travel shows what your save decided:** with a loaded save, the Mages Guild, Conjurer rank, Intervention and carried-item options it set say "from your save" until you change them, and an Intervention you only have as a scroll says so: "a scroll, one use".
- **No theft unless you ask:** the Gear Advisor's "Steal early gear" option now starts off, like its other options, so its first suggestions are gear you can buy, find or be given.
- **Travel's place search lists each town once:** a town that spans several map cells, such as Pelagiad or Balmora, appears once, routed to its most central cell, and the place buttons no longer show the browser's grey.
- **Plainer claims:** pages and search descriptions no longer say the formulas are "verified" or the potions "exact"; they say the maths follows OpenMW 0.51's source. The Faction Journal describes what it shows, how each faction regards the others, instead of "inter-faction standing", and no longer puts a fixed number on how that moves an NPC's disposition (it grows with your rank).
- **A new starting character each visit:** instead of the same Dark Elf every time, a fresh visit starts from one of the premade builds, picked at random for the world you play. A shared link, a character kept through sign-in or a loaded save still comes first. Leaving TR + ARCE keeps a character you made and gives it the nearest base-game race (a Khajiit form becomes Khajiit); an untouched premade is swapped for another.
- **ARCE characters in the random start:** with TR + ARCE on, the random starting character now comes from the whole premade catalogue, the ARCE race builds included. It used to draw only base-game races, because it was picked before the page had read your world.
- **One name per tool:** the nav, the tools' headings, buttons, home cards and search say Character Builder, Level Simulator, Travel Planner, Alchemy, Enchanting, Spellmaking, Faction Journal, Challenge Runs and Cloud Vault. The Build Optimizer is now the Character Builder, and the Travel Optimizer the Travel Planner; searching for the old names still finds them. Page titles keep their longer descriptions.
- **Shared links open in their own world:** a vanilla build or challenge link opened by someone who uses TR or TR + ARCE now switches to vanilla, as the link says, instead of showing the character in your world. A link that names no world keeps yours (a challenge link used to reset it to vanilla).
- **No answers before a question:** Spellmaking, Enchanting and Alchemy show a dash and say what to add until there is something to calculate. They used to show a 100% cast chance, a Destruction school and 1 g prices for a spell with no effect, a self-enchant chance for no enchantment, and a brew chance and 0 g with no ingredients.
- Effect lists in Spellmaking and Enchanting show base costs as the game does (Light: base 0.2, not 0.20000000298023224).
- **One row of difficulty presets:** Challenge Runs showed Standard, Hardcore, Cursed and Custom twice, in the seed bar and again in the settings. They are now only in the settings, beside the counts and difficulty bands a preset sets, and screen readers hear which one is on.
- **The Faction Journal in plain words:** ranks go by name and count from 1 ("Eligible for Journeyman", "Swordsman, rank 4 of 10" instead of "Rank 0"), skills by name (Long Blade, not long_blade), and what a promotion still needs reads as "Raise Strength by 5, to 30". "Landlord: 186 placements" and "186 spots" now say the faction owns 186 objects in the world, and its explanation says members of high enough rank can take them without stealing.
- **Easier-to-read small print:** the dimmer text on faction ranks and requirements, equipped loadout stats, premade builds, challenge restrictions and travel labels is brighter, so it reads clearly against every panel it sits on, in both the Modern UI and Morrowind UI themes. The Challenge Runs presets you have not picked are no longer faded.
- **Bigger Level Simulator buttons:** the buttons that move an attribute up or down your priority list are larger, so they are easier to tap.
- **A tidier outline for screen readers:** the Level Simulator's and Cloud Vault's headings now nest in order, so someone using a screen reader can jump from section to section without gaps.
- **Faction quests by name:** the Faction Journal's quest list shows each quest's name and whether it is completed, in progress or available, without internal keys or journal stage numbers ("fg_alofsfarm · Finishes: 100,110", "Active (Stage 30)"). Journal notes that have no quest name, such as the Mages Guild's reminder to pay dues, are left out, as the game's own quest list does.
- **Phones and tablets:** the Ctrl K / ⌘K search hint no longer shows where there is no keyboard to press it, on the home page or in the header; a touchscreen laptop keeps it.
- **TR + ARCE explained:** the world switch says what TR + ARCE is: Tamriel Rebuilt with ARCE (All Races and Classes Enabled), a mod that adds many playable races and classes. It shows in the phone menu, in the button's tooltip, and to screen readers.
- **The Gear Advisor works on its own:** it recommends gear as soon as you change your character, without pressing Optimize Gear, and says what kind of character it read (a warrior, say). "Early gear for this build ↓" at the top of the Character Builder jumps down to it. Its item lists load as you scroll near it, so the Builder opens as quickly as before.
- **Your own numbers in the calculators:** Alchemy, Enchanting and Spellmaking say whose skill and attributes they use ("Using Breton Custom: Alchemy 25") and let you type other numbers, from 0 to 1000, without building a character first. Numbers you type stay, even when you switch world, until "Reset to character sheet" (it used to say "Ingest Character Stats") puts your character's back.
- **Save a character without an account:** "Save this character" in the Character Builder keeps it in this browser, and the list below loads or deletes it. The Cloud Vault's Local Browser Saves tab shows the same characters, ready to sync to your account. If the browser does not let the site keep data (some private windows), the button says so.
- **More small print you can read:** the Equipped Loadouts' slot counts and empty slots, the Faction Journal's ranks you have not reached, Travel's stop labels and the Level Simulator's preset descriptions were too faint against their panels and are brighter, in both themes. Screen readers now name each Challenge Runs objective's checkbox.

## Gear Advisor ranks for your build — 2026-09-28

- Clothing rows carry a shortlist of candidates, and the advisor ranks them for the character using the Level Simulator's archetype: spellcasters are shown Mentor's Ring in vanilla and Tamriel Rebuilt.
- Two ring slots: a second, different ring for the other hand, equipped on the right.
- Weapons and armor follow major skills before minor ones.

## Current-only application and saves — 2026-09-28

- Removed the standalone HTML application, archived runtimes, bridges, extraction harness and prototype test API. Native tests cover the current tools.
- Share URLs now use canonical paths plus query parameters; hash routes and view aliases are no longer supported.
- Cloud codec version 2 requires all snapshot sections and rejects version 1 payloads and wrapped builds. Existing old binary saves must be reimported from their original OpenMW files.
- React owns the character catalog service; retired global hooks and events are gone. Applied migration history is retained. A guarded migration retires the empty prototype table, refusing if rows appear; current cloud saves are untouched.

## Native handoff and alchemy cleanup — 2026-09-28

- Removed retired DOM writes and synthetic optimizer clicks from Challenge → Builder; React owns the handoff.
- Removed the alchemy effect-name fallback. Effect support now comes only from canonical EffectRules, with malformed or missing rules marked unsupported.
- Retired the old alchemy bridge test in favor of native coverage and removed the dev:legacy command. The remaining standalone fixtures and their obsolete-only tests were subsequently removed.

## Travel planning, save persistence and gear ranking — 2026-09-27

- Choose routes by fewest legs, lowest fare, or shortest estimated travel time.
- Start or finish at any catalogued place. Walking legs connect nearby transport stops and name the doors used to enter or leave interiors; connected interior rooms can reach teleport stops without an exterior door.
- Terrain-aware walking avoids steep ground, the Ghostfence, and open sea, with limited near-shore swimming. Fixed overly long walking connections that displaced sensible transit routes.
- Include Divine and Almsivi Intervention, Propylon indices, Mournhold transport, and item teleports. Quest teleports are optional; item routes depend on the required items.
- Imported saves supply the starting location, guild ranks, carried gold, pack weight, and constant movement effects. Travel warns when a fare exceeds the character's gold.
- Carrying weight, Feather, Burden, constant Levitate, and Water Walking affect movement estimates. Player-made equipment retains its weight and constant effects when imported.
- Copy route links containing origin, destination, planning objective, and walking/quest choices.
- Loaded OpenMW saves persist in this browser across reloads until cleared or replaced by a shared build or challenge handoff.
- Enchanted gear ranks by useful effect value; removed duplicate shield recommendations.

## Navigation, presentation and discoverability — 2026-09-27

- Added consistent two-row desktop headers across themes, fixing overlapping navigation and clipped titles.
- Added Silt Strider favicons and app icons, clearer site branding, and a permanent www-to-apex redirect.
- Expanded tool headings, descriptions, social sharing cards, breadcrumbs, and structured data. Added mechanics explanations to tool pages.
- Stabilized the shell's server snapshot to avoid React render-loop warnings.

## Account routing and profile-link fixes — 2026-09-27

- Added an exported Account route so direct links and refreshes work.
- World selection overrides query-string settings while retaining unrelated parameters.
- Navigation, mixed query/hash links, and shared challenges preserve their selected game profile.

## Early-game gear, from testing — 2026-09-27

Gear recommendations follow new early-game gear rows. They appear once the rows are rebuilt and the site is redeployed.

- **Vault and chapel gear is theft:** a new character belongs to no faction, so Redoran vault and Imperial Cult chapel gear needs the steal toggle.
- **No Ordinator uniforms:** the Indoril helmets and cuirasses that make Ordinators attack you are no longer recommended. The rest of the set still is.
- **A bow for Marksman:** darts and stars are used up as you throw them, so they only appear when no bow qualifies.
- **Devil, Demon and Fiend weapons:** each is ranked by the Bound weapon it conjures, which says its damage, duration and casts per charge. They now count as endgame gear.
- **Travel names its vehicles:** pack guar caravans, sky lamps and carriages instead of generic transport.
- **Where and from whom:** a source names the place ("Ald-ruhn", not a grid cell) and, on a purchase, the merchant rather than their crate.
- **Locked doors count:** gear behind a locked door is refused, like a locked chest. This covers the Dwemer Helm in Briricca's bank vault and the Old Ebonheart Mages Guild storeroom.
- **Merchants sell what is near them:** a merchant's stock kept in their house or another building is theft, as in the game. Tamriel Rebuilt's hidden holding cells no longer count.
- **Dark Brotherhood armor toggle:** the light armor worn by Tribunal's assassin, who may attack while you rest from level 1, at 30 armor a piece.
- **Enchanted before blank:** rings and amulets that are already enchanted come before blank ones with more room, so Mentor's Ring beats an Exquisite Ring. Enchanted items list their effects.

## Clean HTML5 path routing and hash migration — 2026-09-27

- Transitioned workstation and tool navigation from URL hash fragments (`#builder`, `#alchemy`, etc.) to clean HTML5 History API path routing (`/builder`, `/leveler`, etc.).
- Added automatic legacy hash migration via `window.history.replaceState` and `popstate` support for browser Back and Forward history traversal.
- Initially retained hash permalink compatibility during the routing transition; the September 28 cleanup replaced it with path/query links only.

## Distinct Khajiit vault labels — 2026-09-27

- Reused the builder's seven Khajiit variant labels in cloud-save cards, such as Khajiit (Cathay-raht) and Khajiit (Ohmes).
- Exact record IDs take precedence over shared in-game names; unknown races retain their original fallback.

## Readable cloud-save identities — 2026-09-27

- OpenMW cloud-save cards resolve race and birthsign IDs to published catalog names, including Chimeri-Quey and The Atronach.
- Requests are shared across cards. Unknown or conflicting IDs and unavailable catalogs fall back to the original values; stored saves remain unchanged.

## Remaining builder bridges removed — 2026-09-27

- Gear Advisor now uses React state and bundle data exclusively, with independent loading, error, and retry states for early and late-game recommendations.
- Removed legacy optimizer calls, HTML injection, DOM checkbox synchronization, and mutation observers.
- The saved-characters entry retains its native vault action without moving old DOM nodes or modifying browser saves.

## Stylesheet consolidation — 2026-09-27

- Consolidated shared styles into `app/globals.css` and removed the separate legacy stylesheet import.
- Removed retired control selectors and duplicate definitions while preserving cascade order, both themes, dynamic vital bars, and the Pelagiad license.
- Added stylesheet guards and desktop/mobile visual comparisons across all 13 views in both themes.

## Native JavaScript state cleanup — 2026-09-27

- Removed the dormant legacy script loader, old DOM synchronization, global catalog/shell fallbacks, and unused calculator HUD and alchemy bridge.
- Calculator stat ingestion continues through React state; the vault uses Clerk directly for session tokens.
- Preserved existing permalink formats, shared legacy CSS, and the historical HTML regression fixture.
- Added adversarial tests for stale DOM controls, poisoned legacy globals, and malformed build links.

All notable changes to the **Silt Strider** Morrowind character planner, calculators, and tools will be documented in this file.

## Support payments, legal pages and theme build — 2026-09-26

- One-time Ko-fi tips activate premium through the current Tip webhook event and accept any positive supported currency amount, including tips below the suggested US$3.
- Published Privacy Policy and Terms of Service pages; preserved production sign-in configuration in builds and deployments.
- Inlined theme tokens to eliminate the CSS import-resolution diagnostic in production builds.

## Accounts, premium and cloud-save reliability — 2026-09-25

- Added Your account with a chosen username and built-in Morrowind profile icons.
- Added permanent premium upgrades through one-time, pay-what-you-want Ko-fi tips: 25 cloud-save slots instead of 5, plus a profile-icon badge. No subscription is required.
- Wired production vault sign-in and retry a rejected session token once after refreshing it. Account changes isolate cached saves and in-flight requests.
- Saving an imported OpenMW character now preserves its actual level, class, gold, and progress instead of saving a level-one build. Build snapshots retain loadouts, factions, and Bitter Cup.
- Validated imports before changing the active character and bounded cloud upload parsing and magic-effect inputs.
- Kept favored attributes distinct, clamped level-planning bounds, excluded unavailable profile equipment from totals, and used live character attributes for faction eligibility.

## Builder and Level Optimizer fixes — 2026-09-24

- QA fixes: calculators use current character/save attributes; gear transfer equips displayed recommendations; Equipment Studio uses full profile catalogs, source plugins, and extracted enchantments.
- Level reset retains its planning range, manual choices update subsequent progression, and the stepper shows every level including the final state.
- Magic editors enforce casting ranges and effect targets and retain stable effect IDs during catalog loading.
- Travel respects guild membership and Conjurer requirements. Faction edits and tool drafts survive navigation.
- Apparatus quality labels are rounded, and the public changelog includes the September 24 changes.

- Gear recommendations now switch between one-handed + shield and two-handed setups, updating both early-game and endgame picks immediately.

- Restored Challenge Runs to the primary navigation and mobile menu.
- Show catalog-backed racial powers, passive abilities, and spells with their effects.
- Keep attribute totals on one line while long bonus explanations wrap.
- Moved Bitter Cup to the Level Optimizer; the build remembers the choice and progression recalculates. Imported saves retain their recorded attributes.

## Open a Save — 2026-09-22

### Highlights
- **Open an OpenMW save without signing in:** the vault's new "Open a Save in Silt Strider" input reads a `.omwsave` in the browser; nothing is uploaded.
- **The builder takes the character over:** name, race, gender, birthsign, class (custom classes included, with specialization and favoured attributes) and the matching game profile (Vanilla, TR or TR + ARCE, chosen from the save's content files).
- **Everything the save could not carry is listed, not guessed:** a notice names mod classes, races, signs and items the catalogs do not know, and, for level-1 saves, every value where the save's mods differ from Morrowind's rules.
- **Equipment Studio:** a "Worn by <name>" loadout with the gear the character is wearing, rated with their real skills and attributes.
- **Level Simulator:** plan from the save's level and stats, or from the build at level 1.
- **Journal:** factions, ranks and quest progress come from the save.
- **Cloud saves** keep gender, specialization and favoured attributes; older saved payloads still load.
- 356 site tests pass.

### Front page and navigation
- **Drop a save to start:** the home page leads with a drop zone for OpenMW saves (drop anywhere on the page, or choose a file). "Start a new build" is the second option, right under the world choice.
- **World choice up top:** Vanilla, Tamriel Rebuilt or TR + ARCE is picked in the hero instead of at the bottom of the page; the header switch stays on every page.
- **Tools weighted by use:** Alchemy and Travel get large cards (Alchemy shows your brew chance); Challenge Runs and Cloud Vault move to a slim row.
- **Header:** Alchemy and Travel join the nav row; Challenge Runs moves under More; the Cloud Vault is an account button beside search. The phone tab bar swaps Challenge for Alchemy.
- 367 site tests pass.

### Fixes from testing
- **Challenge runs stay put:** leaving the page (to open the character in the Build Optimizer, say) no longer clears the run, and a reload keeps it.
- **Difficulty ticks are respected:** Generate no longer rolls Hard or Grind restrictions with those bands unticked; "Reach level 50" now counts as Grind.
- **Seeds reproduce runs:** a seed carries the world, difficulty bands and counts, and rolls the same run wherever it is loaded.
- **Permalinks work:** Share copies a link that opens the exact run, in its world. Copy Build Link, and the vault's share, now copy a link that opens the character too.
- **Send the build back:** a character sent to the Build Optimizer can go back to its challenge run, with any changes.
- **Your settings are remembered:** your preferred bands and counts are kept on this device; a loaded seed's settings are only for its run.
- **Enchant capacity on the game's scale:** the Gear Advisor showed record points (Exquisite Shirt 600); it now shows what the game shows (60). Silver Staff on the Enchanting page is 5.6, not 30.
- **Dead buttons fixed:** Level Optimizer, Back to Character Builder and the vault's shortcuts navigate again.
- **TR + ARCE in the top bar:** the world switch offers Vanilla, Tamriel Rebuilt and TR + ARCE side by side.
- 383 site tests pass.

## [Phase 13] Legacy Cleanup & Architecture Archival — 2026-09-21

### Highlights
- **Legacy Harness Archival (`archive/legacy/`):**
  - Moved obsolete DOM workbench `components/legacy-workbench.jsx` to `archive/legacy/components/`.
  - Moved legacy extraction scripts (`scripts/extract-legacy.cjs`, `scripts/connect-character-runtime.cjs`, `scripts/connect-alchemy-runtime.cjs`) and preview dev server (`scripts/dev-server.cjs`) to `archive/legacy/scripts/`.
  - Moved legacy migration event bridges (`migration/shell-bridge.js`, `migration/character-bridge.js`) to `archive/legacy/migration/`.
  - Created `archive/legacy/README.md` documenting the historical context of the DOM-slicing migration harness.
- **Native Style Bundling & Entry Point Decoupling (`app/legacy-compat.css`, `app/layout.jsx`):**
  - Ingested baseline legacy styles into `app/legacy-compat.css` with local fonts (`/fonts/Pelagiad.ttf`) and textures (`/textures/mw-*.png`).
  - Imported `legacy-compat.css` directly into `app/layout.jsx`, eliminating external runtime stylesheet links (`<link rel="stylesheet" href="/legacy/legacy.css" />`) from `app/page.jsx`.
  - Completely cleaned and removed `public/legacy/` from disk while maintaining `.gitignore` protection.
- **Build & Cloudflare Pipeline Decoupling:**
  - Decoupled `scripts/build-cloudflare.cjs` to remove `extract-legacy.cjs` execution.
  - Removed `"extract:legacy"` script from `package.json` and repointed `"dev:legacy"` to the archived dev server.
- **Regression Test Re-anchoring:**
  - Re-anchored `test/migration.test.js`, `test/character-catalogs.test.js`, `test/alchemy-catalogs.test.js`, and `test/auth.test.js` to archived script locations.
  - 100% test pass rate across 297 site tests (`npm test`) and 482 pipeline tests (`unittest discover`).

## [Phase 12] Modern App Shell & Architecture Decoupling — 2026-09-21

### Highlights
- **Native React App Shell (`components/app-shell.jsx`):**
  - Completely replaced the legacy HTML extraction harness (`LegacyWorkbench.jsx`, `dangerouslySetInnerHTML`, and 11 `createPortal` mounts) with a declarative, native React 19 / Next.js 16 application layout.
  - Renders all 12 tools (`home`, `builder`, `challenge`, `leveler`, `factions`, `enchanting`, `spellmaking`, `alchemy`, `travel`, `vault`, `about`, `changelog`) cleanly inside `<main className="site-main">`.
  - Automatic `view-${view}` body class synchronization and persistent `<SiteHeader />`, `<SiteFooter />`, and `<CloudVaultModal />`.
- **Pure ESM Permalink Codec & Hash Sync Engine (`lib/permalink-codec.mjs`):**
  - Universal safe UTF-8 Base64URL encoder and decoder for character build states, challenge runs, and game profile flags (`vanilla`, `tr`, `tr_arce`).
  - Strict input sanitation with prototype pollution defense and safe fallbacks for corrupted hashes or legacy aliases (`#optimizer`, `#TR`, `#ARCE`).
  - Bidirectional hash event synchronization via modernized `components/shell-context.jsx` preserving seamless browser back/forward history navigation.
- **Challenge Engine Decoupling (`lib/challenge-engine.mjs`):**
  - Extracted card aspect rolling, seed reproducibility, lock preservation, and mutual restriction conflict resolution into a pure ESM engine.
- **Native React Static Views (`components/views/` & `components/site-footer.jsx`):**
  - Replaced legacy static markup for `#panel-about` and `#panel-changelog` with responsive, accessible React components (`AboutView` and `ChangelogView`).
  - Implemented authentic CRPG footer with legal disclaimers, open-source attribution, and keyboard-accessible modal navigation hooks.
- **Asset Ingestion & CRPG Design Tokens (`app/globals.css`):**
  - Ingested local Pelagiad font (`public/fonts/Pelagiad.ttf`) and Morrowind 9-slice border textures (`public/textures/mw-border.png`, `mw-bevel.png`, `mw-groove.png`).
  - Established formal `:root` tokens for `--ink`, `--paper`, `--gold`, and procedural 9-slice border styles without external or inline asset dependencies.
- **Legacy Extraction Hook Deprecation (`package.json`, `app/page.jsx`):**
  - Retired `scripts/extract-legacy.cjs` from `predev` and `prebuild` npm hooks.
  - Decoupled `app/page.jsx` from `manifest.json` and query parameters, rendering `<AppShell />` directly.
  - Next.js production build compile time reduced to **592ms** (down from >6s).
- **Test Integrity & Adversarial QA:**
  - Authored unit and adversarial test suites for permalinks (`test/permalink-codec.test.js`), challenge engine (`test/challenge-engine.test.js`), and app shell routing (`test/app-shell.test.js`).
  - 100% test pass rate across 297 site tests (`npm test`) and 482 pipeline tests (`unittest discover`).

## [Best-In-Slot Gear Advisor & Bundle Integration] — 2026-09-20

### Highlights
- **Best-In-Slot Bundle Feature Integration (`lib/bundle-loader.mjs`):**
  - Added `bestInSlot: Object.freeze(['BestInSlot', 'Armor', 'Clothing', 'Weapons'])` to `FEATURE_CATALOGS`.
  - Added contract verification in `test/bundle-contract.test.js` ensuring all 4 catalogs load cleanly across `vanilla`, `tr`, and `tr_arce` profiles.
- **Client-Side Best-In-Slot Scoring & Resolution Engine (`lib/best-in-slot.mjs`):**
  - Implemented `picksForBuild`, `deriveBuildTraits`, `scoreItem`, `findClosestBuildRecord`, and `resolveBestInSlotPicks` adhering strictly to `best-in-slot-types.ts` and `build_best_in_slot_catalog.py` specifications.
  - Matches 122 pre-computed `BuildPicks` records for canonical premade builds and dynamically scores custom characters using the catalog's embedded scoring model.
  - Evaluates drawback rules and severities (disqualifying vs significant with mitigations), fortify skills and attributes, armor rating scaling, weapon damage contributions, and beast race equipment filters (beast races excluded from closed helmets and footwear).
  - Categorizes resolved recommendations into 3 clean groups: Optimized Armor & Shield, Optimized Weapons, and Constant-Effect Clothing & Jewelry (featuring distinct Ring 1 and Ring 2 picks).
- **CRPG Best-In-Slot UI View (`components/character-builder/best-in-slot-view.jsx`):**
  - Designed authentic Morrowind-themed late-game equipment dossier under `<details open className="best-in-slot-recommendations"><summary>Optimized endgame kit</summary>`.
  - Renders slot labels, item names with gold highlights, key combat stats (AR, damage, effect summary), score badges, scoring rationale chips, and drawback warnings with mitigations.
  - Displays rich acquisition details (placed in world with easiest level, quest reward tags, and formidable level warnings).
  - Supports expandable runner-up / alternative picks per slot.
- **Gear Advisor Wiring (`components/character-builder/gear-advisor.jsx`):**
  - Wired `useGameData('bestInSlot')` into `GearAdvisor` and `GearAdvisorView`.
  - Renders live `BestInSlotView` recommendations when bundle is ready upon clicking "Optimize Gear", with clean backward-compatible fallback to legacy `gearHtml`.
  - Fully responds to character changes, beast race restrictions, and the "Endgame gear early" toggle (`allowFormidableSources`).
- **Comprehensive Automated QA & Adversarial Edge Cases:**
  - Added `test/best-in-slot.test.js` with 12 unit, integration, and adversarial tests covering:
    - Pre-computed picks and formidable toggle behavior (e.g. King Helseth's Royal Signet Ring inclusion/exclusion).
    - Drain Magicka disqualification on casters vs non-casters.
    - Beast race footwear/helmet exclusion.
    - React UI rendering of `BestInSlotView` and `GearAdvisorView` with runner-up toggling.
    - 3 adversarial edge-case suites (Rule 3): null/undefined/malformed inputs, exact boundary level 30 vs 31 with quest overrides, and empty custom characters.
  - 100% test pass rate: 275/275 tests in `A:\Claude\morrowind-tools`, 445/445 tests in `OpenMW Decompiler`.

## [Phase 11] Faction Journal & Promotion Deficit Engine — 2026-09-20

### Highlights
- **Faction Journal Workstation (`components/journal-factions/`):** Introduced a full-featured CRPG Faction Journal workstation for tracking faction affiliations, rank promotions, attribute/skill deficits, inter-faction diplomacy, and linked guild quests. Designed strictly with authentic Morrowind UI aesthetics: Pelagiad font, `--mw-bevel` button styling, `--mw-groove` dividers, warm parchment `#f3e6c8`, gold headings `#d4b06a`, and deep inset frames.
  - **Master Split-Pane Workspace (`journal-factions-root.jsx`):** Features responsive split-pane layout, profile-aware live game bundle status (`• Live: 27 Factions (VANILLA)`), active character build summary from `CharacterContext`, and interactive join/leave faction membership toggle with vault save synchronization.
  - **Searchable Faction Roster (`faction-roster.jsx`):** Provides real-time text search across faction names, favoured attributes, and skills, with 8 category filter tabs (`All Factions`, `Guilds`, `Great Houses`, `Imperial`, `Religion & Cults`, `Native & Ashlanders`, `Vampire Clans`, `My Memberships`), active faction selection, owned world placement counts, and status badges (`Eligible to Join`, `Unqualified`, `Non-joinable`, `Member · Rank Name`, `⚠ Expelled`).
  - **Interactive Faction Dossier View (`faction-detail-view.jsx`):**
    - **10-Rank Stepper Track:** Displays ranks 0 through 9 with current rank badge, reputation thresholds, and click-to-inspect requirements for any rank.
    - **Promotion Requirements & Deficit Solver:** Evaluates character attributes and skills against canonical FADT thresholds. Displays individual progress meters with color-coded qualification indicators (`✓` or `(Need +X)`), and aggregates promotion gaps into actionable instructions.
    - **Simulated Reputation Control:** Interactive input allowing players to simulate different faction reputation values to test future promotion eligibility.
    - **Mutual Exclusivity Warning:** Automatically detects and alerts on rival faction conflicts (e.g. Great House Hlaalu vs Redoran/Telvanni, rival vampire clans).
    - **Diplomatic Standing & Inter-Faction Relations:** Maps allied reactions (+1 to +3) and hostile/rival reactions (-1 to -3) with disposition adjustments.
    - **Associated Faction Quests Ledger:** Displays all quests associated with the faction prefix with quest key, finish index, and progress status.
- **Canonical Morrowind Faction Promotion Engine (`lib/faction-math.mjs`):**
  - Implemented pure calculation functions: `normalizeStatKey`, `getStatValue`, `joinableFactions`, `meetsRank`, `getHighestEligibleRank`, `solvePromotionGaps`, `MUTUAL_EXCLUSIONS`, `getMutualExclusionConflict`, `getFactionReactions`, and `getFactionQuests`.
  - Strictly models canonical Morrowind FADT promotion rules: requires both favoured attributes $\ge$ rank thresholds; requires 1 skill $\ge$ primary skill threshold, and 2 other favoured skills $\ge$ favoured skill threshold; faction reputation $\ge$ rank reputation.
- **Bundle Loader & Game Data Integration:**
  - Added `factions: Object.freeze(['Factions', 'Quests', 'Skills', 'Attributes'])` to `FEATURE_CATALOGS` in `lib/bundle-loader.mjs`.
  - Wired into `useGameData('factions')` for seamless content-addressed loading with graceful fallback.
- **Navigation & Legacy Shell Integration:**
  - Registered `factions: 'factions'` in `migration/shell-bridge.js`.
  - Added `#panel-factions` panel to `index.html` and wired through `showView('factions')`, `calcViews`, and `deskNavIds`.
  - Added Faction Journal to site header desktop dropdown (`#react-desk-factions`) and mobile drawer, preserving single-row desktop header invariant.
  - Added Faction Journal launcher card to Home Hub directory (`tool-directory-grid.jsx`), expanding canonical tools to 9.
  - Mounted `JournalFactionsRoot` via React portal in `components/legacy-workbench.jsx`.
- **Legacy HTML Byte Budget Compliance:**
  - Extracted legacy body: 48,906 bytes (strict budget < 50,000 bytes with 1,094 bytes headroom).
- **Automated QA & Adversarial Test Coverage:**
  - Added `test/faction-math.test.js` (7 test suites) and `test/journal-factions-ui.test.js` (7 UI integration & adversarial test suites).
  - Updated `test/home-hub-ui.test.js` and `test/bundle-contract.test.js`.
  - 100% test pass rate: 262/262 tests in `A:\Claude\morrowind-tools`, 445/445 tests in `OpenMW Decompiler`.
  - Headless Chrome CDP visual layout verification at 1440x950 and 390x844 viewports.

---



### Highlights
- **Specialized Workstations Live Data Rewiring:** Completely wired all 4 specialized workstations (`Enchanting`, `Spellmaking`, `Alchemy`, `Travel`) to the content-addressed game data bundle loader (`lib/bundle-loader.mjs` and `useGameData`), moving off static legacy extracts to dynamic, profile-aware bundle data with clean fallbacks.
- **Bundle Loader Feature Catalog Expansion (`lib/bundle-loader.mjs`):**
  - Expanded `FEATURE_CATALOGS` to include:
    - `travel: Object.freeze(['Travel', 'Places'])`
    - `enchanting: Object.freeze(['MagicEffects', 'GameSettings', 'Enchantments', 'EffectRules', 'Merchants'])`
    - `spellmaking: Object.freeze(['MagicEffects', 'GameSettings', 'EffectRules', 'Merchants'])`
  - Validated immutable profile inheritance and delta resolution across `vanilla`, `tr`, and `tr_arce`.
- **Dynamic Travel Graph Adapter (`lib/travel-graph.mjs`):**
  - Implemented `adaptTravelGraph(records, nodes)` to dynamically compile live transit networks from bundle `Travel` records and node metadata.
  - Normalizes settlement names (strips Guild of Mages, Wolverine Hall, and Vivec canton suffixes) and maps transit modes (`silt_strider`, `guild_guide`, `gondola`, `riverstrider`).
  - Extended `buildNetworkGraph`, `getAvailableTransitStops`, and `findFewestHopsRoute` to accept dynamic custom graphs with seamless fallback to static network tables.
- **Three-Toggle Gear Acquisition Policy & Gear Advisor Integration:**
  - Added `#gear-near-start` ("Near starting areas") toggle to `index.html` `.gear-toggles` group and wired through `earlyGearOptions()`.
  - Updated `components/character-builder/gear-advisor.jsx` with bi-directional DOM synchronization (`handleToggleNearStart`), `resolveRanking()`, and direct connection to `useGameData('gear')`.
- **Live Workstations Features:**
  - **Alchemy Workstation (`alchemy-workstation.jsx`):** Consumes `useGameData('alchemy')`, dynamically loads live ingredients and apparatus tiers from bundle catalogs via `adaptAlchemy`, and displays live status badge `• Live: 126 Ing. (PROFILE)`.
  - **Enchanting Workstation (`enchanting-workstation.jsx`):** Consumes `useGameData('enchanting')`, filters effects using `allowEnchanting === true` from live `EffectRules`, extracts enchanters using `servicesRaw & 65536` (`0x10000` service bit) from live `Merchants`, and displays live status badge `• Live: 129 Effects · 24 Vendors (PROFILE)`.
  - **Spellmaking Workstation (`spellmaking-workstation.jsx`):** Consumes `useGameData('spellmaking')`, filters spells using `allowSpellmaking === true` from live `EffectRules`, extracts spellmakers using `servicesRaw & 32768` (`0x8000` service bit) from live `Merchants`, and displays live status badge `• Live: 129 Spells · 43 Vendors (PROFILE)`.
  - **Travel Workstation (`travel-workstation.jsx`):** Consumes `useGameData('travel')`, dynamically builds network graphs via `adaptTravelGraph`, and displays live status badge `• Live: 21 Stops (PROFILE)`.
- **Automated QA & Adversarial Test Coverage:**
  - Added contract tests in `test/bundle-contract.test.js` verifying `loadFeature` decoding for `travel`, `enchanting`, and `spellmaking`.
  - Created `test/live-workstations.test.js` targeting edge conditions: malformed records, missing nodes, self-loops, disconnected transit networks, all 8 boolean toggle permutations for gear policy, and merchant bitmask service isolation.
  - 100% test pass rate across all 247 site test suites and 396 pipeline test suites.
  - Turbopack production build compiled and statically optimized in 1.2s with zero errors.

---

## [Phase 9] Equipped Loadouts & Equipment Inspector — 2026-09-20

### Highlights
- **Categorized CRPG Equipment Ledger (`components/equipment-studio/equipment-ledger.jsx`):** Introduced a clean, structured CRPG equipment ledger organizing all 19 canonical equipment slots into distinct Defense and Attire rosters with a compact tactical character identity banner. Purges any paper doll or mannequin concepts in favor of authentic CRPG table ergonomics. Designed strictly with Morrowind UI invariants: procedural CRPG SVG glyphs, 4px `--mw-bevel` buttons, `--mw-groove` dividers, warm parchment `#f3e6c8`, gold headings `#d4b06a`, deep inset frames, zero emojis, and zero modern neon hues.
- **Tactile Equipment Slot Cards (`equipment-slot-card.jsx`):** Renders all 19 canonical equipment slots (Helmet, Pauldrons, Cuirass, Gauntlets, Greaves, Boots, Shield, Weapons, Ammunition, Robe, Shirt, Pants, Skirt, Rings, Amulet, Belt) with procedural SVG silhouette glyphs, item names, armor rating & weight chips, unequip `✕` actions, and responsive layout.
- **Mathematical Calculations Engine (`lib/equipment-math.mjs`):**
  - **Weighted Total Armor Rating (AR):** Implements Morrowind's canonical slot weighting ratios (Cuirass 30%, Shield 10%, Helmet 10%, Greaves 10%, Boots 10%, Pauldrons 10% each, Gauntlets 5% each) and Unarmored skill formula ($\lfloor \text{UnarmoredSkill}^2 \times 0.0065 \rfloor$) with dynamic skill-scaling armor formulas.
  - **Encumbrance & Carry Capacity:** Accurately models $\text{Strength} \times 5$ carrying capacity with active weight tallying, percentage cap indicator, and tactile visual progress meter.
  - **Main-Hand Weapon Combat Profile:** Computes weapon damage ranges across all three attack types (Chop, Slash, Thrust min-max), weapon speed, reach, and automatic fallback to Hand-to-Hand when unarmed.
  - **Two-Handed vs. Shield Mutual Exclusion:** Equipping a two-handed weapon (claymore, battle axe, warhammer, halberd, staff, bow, crossbow) automatically un-equips the off-hand shield or light source with clear feedback.
  - **Beast Race Equipment Restrictions:** Authentic lore fidelity barring Argonian and Khajiit characters from equipping footwear and closed helmets, with explanatory badge overlays and item picker warnings.
  - **Constant Effect Enchantment Aggregation:** Automatically scans equipped items and aggregates passive constant effect enchantments (attributes, skill fortifications, resistances) into a structured combat ledger.
- **Multi-Loadout Presets System (`loadout-tabs-bar.jsx`):** Up to 4 named equipment loadouts per character (`Primary Combat`, `Secondary / Alternate`, `Stealth & Infiltration`, `Arcane & Utility`) with 1-click tab switching, duplication, renaming, clearing, and curated starter/endgame kit templates (`Seyda Neen Scout`, `Ghostgate Glass Champion`, `Daedric Warlord`).
- **Interactive Item Picker & Custom Forging Drawer (`item-picker-drawer.jsx`):** Slide-in modal drawer with embedded game item catalog across all slots, category filter chips (`ALL`, `LIGHT`, `MEDIUM`, `HEAVY`), instant search, beast restriction indicators, and a custom item forge form for homebrew/artifact gear.
- **Cross-Tool Architecture & Integrations:**
  - **3-Way Studio Mode Bar (`character-builder-root.jsx`):** Expanded Character Builder top navigation to seamlessly toggle between `Custom Class Builder`, `Equipped Loadouts`, and `Premade Builds Catalog`.
  - **Character Sheet Quick Launch (`character-sheet.jsx`):** Added `[ Equipped Loadout → ]` direct navigation button in the Character Sheet quick launch grid.
  - **Gear Advisor Direct Equip Bridge (`gear-advisor.jsx`):** Added `[ Equip Kit to Loadout → ]` action button to equip the algorithmic gear recommendation directly into the active loadout via decoupled event dispatching.
- **Automated QA & Adversarial Test Coverage:** Added 17 unit and adversarial UI tests across `test/equipment-math.test.js` and `test/equipment-studio-ui.test.js`. 100% test pass rate across all 242 site test suites and 335 pipeline test suites.

---

## [Phase 8] Home Hub & Tool Directory Overhaul — 2026-09-20

### Highlights
- **Home Hub CRPG Transformation (`components/home-hub/`):** Transformed the legacy `#panel-home` landing page into an authentic Morrowind CRPG directory hub enclosed in canonical 6-pixel ornate parchment borders (`--mw-border`), Pelagiad typography, warm parchment `#f3e6c8`, gold `#d4b06a`, and deep inset shading.
- **Active Character Session Plaque (`active-session-banner.jsx`):** Integrated a real-time session banner connected to `useActiveCharacter()` from `CharacterContext`. Displays active character identity (Name, Race, Class, Birthsign, Specialization) along with authentic color-coded vitals chips (Health `#b83b3b`, Magicka `#3b6bb8`, Fatigue `#3bb852`) and 1-click continuation controls (`[ Resume Build Optimizer → ]`, `[ Level Simulator → ]`, `[ Cloud Vault ]`). Includes graceful empty-state fallback when no character is active.
- **8-Tool Directory Grid (`tool-directory-grid.jsx` & `tool-launcher-card.jsx`):** Unified all 8 site planning and calculation modules (`builder`, `leveler`, `vault`, `challenge`, `enchanting`, `spellmaking`, `alchemy`, `travel`) into a responsive CRPG grid. Each card features canonical subtitles, feature tags, status badges (`POPULAR`, `NEW`), and tactile `--mw-bevel` action buttons.
- **Game World Profiles Guide (`world-profiles-guide.jsx`):** Added an interactive parchment guide explaining Vanilla Vvardenfell, Tamriel Rebuilt Mainland, and TR + ARCE Rebalance profiles with 1-click profile switching via `window.siltShell.setProfile`.
- **Project Colophon Bulletin (`colophon-bulletin.jsx`):** Established official project metadata, Bethesda/Tamriel Rebuilt data provenance, Pelagiad typeface licensing attribution, and direct links to About, Changelog, and community support.
- **Master Window Isolation & Seamless Hydration:** Enforced `#panel-home:has(.home-hub-root) > *:not(.home-hub-root) { display: none !important; }` in `app/globals.css` to eliminate legacy markup flash during hydration while maintaining preflight fallback compatibility.
- **Adversarial QA & Test Suite:** Added 9 new unit and adversarial test suites (`test/home-hub-ui.test.js`) verifying all 8 launcher cards, rapid profile switching, empty session states, and cross-platform CustomEvent dispatching. All 225 site test suites and 233 pipeline test suites pass with 100% success.
- **Aesthetic Invariants:** 100% adherence to authentic CRPG aesthetic standards: zero emojis, zero modern neon hues, Pelagiad font, `--mw-groove` dividers, and `--mw-bevel` buttons.

---

## [Phase 7] Cloud Character Vault & OpenMW Binary Save Ingestion — 2026-09-20

### Highlights
- **Cloud Character Vault Workstation (`#panel-vault` & Modal Portal):** Introduced an authentic CRPG dossier management portal enclosed in canonical 6-pixel ornate parchment borders (`--mw-border`), accessible from the persistent site header, mobile navigation drawer, and Build Optimizer.
- **Workstation Frame & Panel Isolation:** Configured `#panel-vault` with master window framing (`--mw-border` 6px), deep inset shading, and strict CSS panel hiding (`body.view-vault #panel-home { display: none !important; }`), ensuring an isolated, distraction-free dossier management view matching Character Builder and Level Simulator.
- **Home Launcher Grid Harmonization:** Expanded the Home page launcher grid to 8 cards with the addition of the Cloud Character Vault card (`#btn-go-vault`), balancing the 2x4 layout and wiring seamless `#vault` hash navigation.
- **Client-Side OpenMW Binary Save Parser (`lib/omwsave-parser.mjs`):** Direct in-browser parsing of `.omwsave` binary files (format v37+ and legacy formats). Automatically extracts character name, race, class, birthsign, level, attributes, skills, dynamic vitals, gold, cell/location, inventory, and completed journal quest milestones with zero Node.js/native dependencies.
- **SLT1 Binary Codec & Ultra-Compact Serialization (`lib/cloud-save-codec.mjs`):** Proprietary byte-packed binary codec compressing large ~35 KB character dossiers down to ~1.4 KB BLOBs (~96% compression ratio) for efficient Cloudflare D1 edge database storage.
- **Tiered Cloud Quota Model:**
  - **Free Tier:** 5 cloud character slots with full inventory, quests, and challenge data persistence.
  - **Paid / Supporter Tier:** 25 cloud character slots with automatic tier enforcement via SQLite triggers (`COALESCE(max_saves, 5)`).
- **Offline-First Hybrid Sync Engine (`lib/character-vault.mjs`):** Zero-latency local browser caching in `localStorage` paired with seamless cloud synchronization to Cloudflare D1 via Clerk JWT authentication.
- **1-Click Local Migration & Backup:** Dedicated button allowing players to migrate offline character builds to the cloud in a single click, with bi-directional JSON export/import for complete data portability.
- **Cross-Tool Navigation & Shell Integration:** Quick launch buttons embedded in the Character Sheet header, Local Characters panel, and desktop navigation bar (`[ Cloud Vault ]`).
- **CRPG Aesthetic Standards:** 100% adherence to authentic Morrowind styling: Pelagiad typography, `--mw-bevel` 4px buttons, `--mw-groove` dividers, warm parchment `#f3e6c8`, gold `#d4b06a` accents, zero modern emojis, and zero neon hues.

---

## [Phase 6] Character Level Simulator & Build Progression Optimizer — 2026-09-19

### Highlights
- **Character Level Simulator Workstation (`#panel-leveler`):** Introduced a dedicated progression planning workstation enclosed in the canonical 6-pixel ornate parchment window frame (`--mw-border`) with deep inset shading, fully responsive across desktop and mobile.
- **Dual Progression Modes:**
  - **Stats Only Mode:** High-level attribute goal planning for players who want to set target attributes and see their level cap and health trajectory instantly.
  - **Stats & Skills Mode:** Detailed, level-by-level progression matrix across all 27 skills with filter tabs for Combat, Magic, and Stealth.
- **1-Click Optimization Presets:**
  - **Auto-Calculate Optimal Build:** Detects character archetype (Warrior, Assassin, Mage, Battlemage, Nightblade, Diplomat) and solves the most efficient attribute allocation path to cap attributes with maximum speed.
  - **Rush Endurance (+5):** Prioritizes reaching 100 Endurance as early as possible to maximize non-retroactive level-up health gains.
  - **Triple +5:** Aggressive powerleveling path aiming for three +5 attribute multipliers on every level up.
  - **Efficient (+5/+5/+1 Luck):** Ensures consistent +1 Luck investment on every level up while securing two +5 attribute multipliers.
- **Automated Miscellaneous Skill Trainer Solver:**
  - Dynamically calculates the exact skill training deficit required to earn 5x attribute multipliers.
  - Recommends which specific off-class (Miscellaneous) skills to train each level, picking the lowest and cheapest skills first to avoid burning valuable Major or Minor skill headroom.
  - Computes exact in-game Septims trainer costs for every prescribed training session.
- **Interactive SVG Health Growth Projection Curve:**
  - Dynamic visual chart contrasting optimal Endurance rushing vs. delayed Endurance growth up to the character's exact theoretical level cap.
  - Displays maximum health potential, total stat efficiency percentage, and level cap.
- **Daedric Bitter Cup Toggle:**
  - Seamlessly integrated across character formulas (`lib/character-math.mjs`, `lib/level-math.mjs`), the Character Builder UI, and the Level Simulator.
  - Accurately models the artifact's permanent +20 to highest attribute and -20 to lowest attribute with live stat and health recalculations.
- **Cross-Tool Quick Launch Bridge:**
  - Added a 1-click launch button directly inside the Character Sheet header in Build Optimizer, passing the active build state directly into the simulator without manual configuration.
- **Pure CRPG Authentic Aesthetic Refinement:**
  - Complete elimination of all emojis (`📥`, `⚡`, `🛡️`, `⚔️`, `🍀`, `🔄`, `🎯`, `🪙`, `✓`, `⚠️`, `📈`, `🔗`) across the Level Simulator and Character Builder.
  - Eradicated all bright modern neon text colors (`#4ade80`, `#ef4444`, `#f87171`, `#fde047`, `#fdba74`, etc.).
  - Unified typography under authentic Morrowind gold (`#d4b06a`), warm parchment (`#f3e6c8`), and muted brass (`#9e8b6b` / `#8c7853`).
  - Styled SVG chart curves with solid gold (`#d4b06a`) for optimal path and muted brass (`#8c7853`) for delayed path.

---

## [Phase 5] Specialized Calculator Workstations — 2026-09-19

- **Enchanting Workstation:** Live visual capacity gauge bar (0 / 120 pts) with base item presets, soul gem selector from Petty to Grand with 400-soul Constant Effect indicator, When Used / On Strike / Constant Effect toggles, multi-effect stack builder, self-enchant success chance %, and ranked barter pricing for 21 Vanilla and 15 Tamriel Rebuilt enchanters with live search.
- **Spellmaking Workstation:** Custom spell naming, magic school filter tabs (Alteration, Conjuration, Destruction, Illusion, Mysticism, Restoration), multi-effect stack editor with min/max magnitude, duration, area, and range inputs, exact OpenMW magicka cost formula, cast reliability rating badge, governing school indicator, and ranked barter pricing for 38 named spellmakers.
- **Alchemy Workstation:** Apparatus rack with Mortar & Pestle, Alembic, Calcinator, and Retort across five quality tiers, four crucible slots with live ingredient search, effect pills, and a filter to show only ingredients sharing effects with Slot 1. Live potion preview calculates brew success chance %, gold value, magnitude, and duration.
- **Alchemy Crucible Clear Controls:** Crucible slots initialize clean and empty, with a new Clear All Ingredients button in the crucible subheader to reset all slots, search queries, and custom names in one click, plus individual per-slot Clear buttons.
- **Travel Optimizer Workstation:** Shortest-hop BFS transit network router across Silt Striders, Boats, Guild Guides, and River Striders. Features searchable origin and destination listboxes, fast-select travel hubs, quick origin/destination swap, turn-by-turn navigation cards, and complete waypoint breadcrumb chain.
- **Authentic Dark CRPG Scrollbars:** Added global dark color-scheme on root and all form elements, standard scrollbar-color (`#4e3c23` thumb on `#14100a` track), and custom WebKit scrollbars across all scrollable containers and listbox elements (`select[size]`), permanently eliminating white browser scrollbars.

---

## [Phase 4] Challenge Runs Workstation Overhaul — 2026-09-19

- **Two-Pane CRPG Workstation:** Transformed Challenge Runs into an authentic two-pane workstation with interactive card controls, live character summary sheet, and full mobile drawer integration.
- **Individual Card Locking and Pinning:** Every parameter card (Race, Gender, Class, Sign, Major Objective, Restrictions, Skills) features individual lock and reroll buttons, allowing players to pin favorite choices while "Randomize All" rerolls only the unlocked cards.
- **Deterministic Seed Engine:** Compact, shareable seed strings encoding world profile, locked slots, difficulty filters, and rolled attributes, enabling 1-click URL sharing and identical run recreation.
- **Difficulty Band Selector:** Quick preset filters (Easy, Normal, Hard, Grind) that dynamically tailor objective and restriction pools according to desired run intensity.
- **Searchable Pool Browser Modal:** Accessible in-app reference catalog detailing all hand-curated objectives and restrictions with category tags and difficulty ratings.
- **Send to Build Optimizer Bridge:** 1-click bridge action serializing the rolled character state directly into the Character Builder.
- **Automated Conflict Resolution Engine:** Built-in rules validator that detects mutually conflicting objectives, incompatible restrictions, and redundant level caps to guarantee 100% playable, lore-friendly runs.

---

## [Phase 1-3] Modern Architecture & Character Builder Foundation — 2026-09-18

- **Next.js 16 & React 19 Architecture:** Silt Strider migrated to Next.js 16 App Router with React 19, static export, and on-demand game data loading for Vanilla, Tamriel Rebuilt, and ARCE profiles.
- **Two-Pane Character Builder:** Interactive Configurator, live Character Sheet, Premade Builds catalogue browser, and decoupled Gear Advisor, preserving URL permalinks and local saves.
- **Art Direction Overhaul & 3-Tier Frame Hierarchy:** Eliminated line tangencies across the site. The 6-pixel ornate scrollwork frame is reserved for primary panels, 2-pixel etched grooves for plaques and banners, and 4-pixel bevels exclusively for buttons and dropdowns.
- **Accessible Focus States & Contrast:** High-contrast gold focus outlines on keyboard navigation across all interactive elements, with muted text contrast meeting WCAG AA standards.
- **Cross-Tool Calculator State Integration:** Calculators dynamically ingest character stats, skills, and fatigue from the active character sheet via `useActiveCharacter`, with bidirectional DOM synchronization.
