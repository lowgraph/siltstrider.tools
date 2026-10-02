"use client";

/**
 * ChangelogView: Native modern React implementation of the Changelog panel.
 * Replaces legacy #panel-changelog markup with responsive CRPG ledger styling.
 */
export default function ChangelogView() {
  return (
    <div className="changelog-view-root w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6" id="changelog-content">
      <div className="border-b border-accent pb-4">
        <h2 className="text-2xl md:text-3xl font-serif text-accent tracking-wide">Silt Strider Tools Changelog &amp; Version History</h2>
        <p className="text-sm text-fg-11 mt-1 font-serif">What changed on Silt Strider, newest first.</p>
      </div>

      <div className="space-y-6 text-sm text-fg-2">
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-10-02">October 2, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Gear Advisor explains that beast races can wear compatible open helmets, including Helm of Oreyn Bearclaw, while closed helmets and boots remain excluded.</li>
            <li>Alchemy explains that the effect finder suggests pairs only, extra ingredients belong in the calculator, and changing worlds clears the recipe while keeping typed stats on the open page.</li>
            <li>Premades explain the separate By Playstyle and By Race collections, show filtered counts, and give the right first-visit hint for each group.</li>
            <li>New-player guidance explains where to start, world choices, Builder numbers and game-entry steps, gear alternatives, save differences, Travel options, potion recovery and leveling terms.</li>
            <li>Gear Advisor describes the endgame kit as ranked for the current character, without calling an edited premade its class archetype.</li>
            <li>Faction Journal uses 1 rank for factions such as Twin Lamps.</li>
            <li>Level Simulator shows 0 HP, rather than -0 HP, when delaying Endurance loses no Health.</li>
            <li>Travel maps keep their heading and counts separate, with larger, clearer region labels and legends on phones.</li>
            <li>Home identity labels, loadout actions and premade Specialization descriptions stay whole on phones.</li>
            <li>Alchemy keeps Show more pairs visibly separate from the scrollable ingredient list, including after showing more results.</li>
            <li>Gear Advisor starts with two hands for Spear and Marksman builds, and one hand plus shield for other weapons. Your chosen setup takes priority.</li>
            <li>Global search finds Ald'ruhn, Ald-ruhn and Aldruhn as the same place. Results keep the place's original name and open the correct Travel destination.</li>
            <li>Deleting a character saved in this browser asks for confirmation. Cancel keeps it, and focus returns to the saved-character list after deletion.</li>
            <li>Health forecasts show clean totals with at most one decimal, including Bitter Cup plans. Fractional level-up gains remain intact.</li>
            <li>The Health chart marks the level where Endurance reaches 100 even when it is the final level in your forecast.</li>
            <li>Premade category names, build counts and Expand/Collapse labels stay readable on phones in both themes.</li>
            <li>Alchemy apparatus choices show their full selected names and quality multipliers on phones in both themes.</li>
          </ul>
        </section>
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-10-01">October 1, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>After you edit a premade character, Gear Advisor ranks the whole endgame kit for your current choices, including armour, clothing and jewellery. The kit uses the same character name as Builder and Home; unchanged premades keep their published picks.</li>
            <li>Alchemy names ingredient variants with catalog weight, value, effects and origin instead of raw record IDs.</li>
            <li>Vault controls stay readable and reachable on small screens, including Close and Duplicate.</li>
            <li>Reset all settings now asks for confirmation before restoring the defaults.</li>
            <li>Deleting a cloud save now opens a keyboard-accessible confirmation and restores focus afterward, including when the Vault refreshes or closes.</li>
            <li>Travel now explains why rounded in-game leg estimates can differ slightly from the total.</li>
            <li>Search now uses singular and plural faction rank labels correctly.</li>
            <li>Level Simulator keeps Prev, Next and training skill names readable on phones. Navigation gets its own row and training details wrap at whole words.</li>
            <li>Faction Journal keeps the active faction name visible above its details, even when search or scrolling hides the selected list entry.</li>
            <li>Travel distinguishes routing stops from mapped locations. Map dots group nearby stops by town and include positioned points along the chosen journey.</li>
            <li>Alchemy shows a calculated 0% brew chance when shared effects round to zero, while incomplete recipes keep the empty-result dash.</li>
            <li>Challenge Runs clears an invalid-seed message after generating or loading a valid run.</li>
            <li>Enchanting offers cast styles that suit the item. Switching to armor or clothing clears On Strike; custom items let you choose their kind.</li>
            <li>About credits LowGraph and links to the project’s open source code under AGPL-3.0-or-later. It distinguishes the code licence from game and mod data, font and branding rights.</li>
            <li>Faction Journal uses published faction names in friendly and hostile relations and leaves deprecated entries out of its roster. Saved memberships stay intact.</li>
            <li>Premade cards explain how each build plays and its trade-off. Major and Minor skills are written out, and specialization explains which skills it helps; the explanations also appear when browsing by race.</li>
            <li>Alchemy leaves Secret Master’s apparatus out of every world, including Tamriel Rebuilt’s renamed tools. Available tools remain ordered by effectiveness.</li>
            <li>Travel accepts Ald’ruhn, Ald-ruhn and Aldruhn in place searches. While you edit a location, it asks you to choose a result instead of showing the previous trip; cancelling restores it. Shared journeys keep their starting point when a saved character loads.</li>
            <li>Travel finds the everyday Ebonheart–Mournhold teleport in all three worlds, including with walking switched off. Named cities now include teleport-only rooms that were missing from the transport stop list.</li>
            <li>Character Builder&apos;s Configure explanations stay inside the screen and above the phone tab bar. They open above their buttons when needed; long text scrolls inside the box. Tap again, tap outside or press Escape to close.</li>
            <li>On phones, Gear Advisor stacks each recommendation&apos;s slot, item and source so names stay readable. This applies to early-game equipment, the optimized endgame kit and its runner-ups; desktop tables keep their columns.</li>
            <li>Gear Advisor keeps boots and closed helmets out of beast races&apos; optimized kits and every runner-up list, including after changing weapon preference. Open helmets remain available; ARCE races that are not beasts keep their eligible footwear. Equipping recommendations uses the same race rules.</li>
            <li>Builder, Home and Level Simulator show the same current race, gender and birthsign. After you edit a premade, its old title reads &ldquo;Based on …&rdquo; rather than describing the edited character; your own character names stay unchanged.</li>
            <li>Level Simulator keeps fractional Health gains, following the OpenMW 0.51 source. Its chart starts from your character&apos;s Health and Endurance, including loaded saves; starting at 30 Endurance reaches 100 at level 15 with +5 each level. Bitter Cup changes future gains when it changes Endurance, without recalculating starting Health.</li>
            <li>Enchanting counts every effect&apos;s running cost toward capacity, rounding each down. Two Constant Effects of 5 points now use 75 capacity points; a 5-point, 5-second Target effect fits a Common Ring at 1 point. Self-enchant chance uses the costs before rounding, and the base price uses the final running cost without an extra Constant multiplier, following the OpenMW 0.51 source.</li>
            <li>Share links from imported Cloud Vault saves carry the save&apos;s world, race, gender, birthsign and class choices. Challenge links keep the run&apos;s world after you switch worlds. A save with choices the site&apos;s data cannot resolve shows an error instead of sharing a different character.</li>
            <li>Loading a character build from Cloud Vault selects its saved world before showing its statistics. Signing in keeps this browser&apos;s world until you choose a Preferred world in Your account; header changes and loaded saves do not replace that preference.</li>
            <li>The Morrowind UI now looks like the game&apos;s menus: black windows, tan text and the game&apos;s frames. Modern UI is unchanged.</li>
            <li>Signing out keeps your unsaved Builder character when you return to Home, including its world, race, birthsign, skill choices and equipment. Loaded saves continue to stay in this browser until cleared.</li>
            <li>Travel first plans with nearby walks and short swims. If no route is available, it tries long walks and open-water swims, including routes to Ald Redaynia. Normal trips still use transport, and mixed legs show walking and swimming time separately.</li>
            <li>Each selected Alchemy ingredient has a &ldquo;Where to get it&rdquo; button: shops and their stock/restocking, plants and harvest chances, creature drops, and loose finds or deposits with their locations. Sources load when opened, and changing the ingredient closes its old sources. The effect finder keeps its pair shortcut.</li>
            <li>Ingredient sources leave out hidden test and holding rooms. Creature drops leave out rare random loot, so the list focuses on drops you can reasonably gather.</li>
          </ul>
        </section>
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-09-30">September 30, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Cities remain one search choice. Search for a particular hall, service or provider to choose a precise stop. Journeys through a city include the outdoor walks between transport stops and show real movement time on each walk. Time spent indoors is still uncounted.</li>
            <li>Choose the potion effects you want to find ingredient pairs, see their additional effects, and load a pair into the Alchemy calculator. Shop availability is not listed yet.</li>
            <li>Travel starts with Seyda Neen to Balmora without a save or shared route. Least real time favors less outdoor movement, then fewer transport or spell transitions; menus and loading remain uncounted. The route shows a loading message while its network arrives.</li>
            <li>Alchemy removes Secretmaster apparatus from its picks and orders tools from strongest to weakest.</li>
            <li>Enchanting lets you type the trapped soul&apos;s size, including 300 in a Grand Soul Gem. Constant Effect still needs at least 400.</li>
            <li>Wide screens show Alchemy, Enchanting and Spellmaking directly; compact screens group all three under Calculators.</li>
            <li>Your account can remember your world, theme, Travel, Gear Advisor and Challenge defaults across devices. Choose shared or world-specific defaults, optionally override save-derived Travel toggles, and reset one tool or all settings. Shared links keep their choices; guests keep their own browser preferences.</li>
            <li>The first time you open the Character Builder, it starts on the premade builds, so you can pick one and change it instead of composing a class from nothing. &ldquo;Build my own instead&rdquo; goes straight to the Custom Class Builder, and later visits open as before.</li>
            <li>Home offers two equal ways to start: &ldquo;Start a character&rdquo; beside &ldquo;Load your save&rdquo;, instead of a small &ldquo;No save yet?&rdquo; link. On a phone, starting a character comes first.</li>
            <li>Wherever a tool names your character, the name links to the Character Builder to change it, and it matches the name on Home. The Level Simulator names it too, and the Faction Journal&apos;s character line now shows on wider screens.</li>
            <li>Opening the Calculators or More menu with Enter or Space puts you on its first item.</li>
            <li>In the Level Simulator, the Bitter Cup moves under &ldquo;Advanced options&rdquo; instead of leading the page, and the attribute priority list uses three-letter names (END, PER, STR) instead of cut-off ones.</li>
            <li>A Cloud Vault save is checked against the checksum taken when it was stored before it loads; one that no longer matches is not loaded, and the Vault says so.</li>
            <li>Signed in, the Cloud Vault&apos;s header shows your name, tier and saves used on screens 640 pixels and wider; a leftover style had hidden it everywhere.</li>
            <li>Challenge Runs has one lock per rolled item, on the sheet beside it, instead of two places to lock the same thing; choosing a race, class or birthsign in the settings keeps it when you roll.</li>
            <li>Each Alchemy slot is one search box instead of a dropdown and a separate search field: type, then pick with the arrow keys and Enter or a click.</li>
            <li>Enchanting opens on an Expensive Ring and a Lesser Soul Gem instead of an Exquisite Ring and a Grand Soul Gem, a new effect starts small enough to fit it, and the item list adds the common to extravagant rings, amulets, shirts and robes.</li>
            <li>Home&apos;s strip of numbers (&ldquo;27 skills modeled&rdquo;, &ldquo;103 restrictions&rdquo;) now says what you get: ×5 level-ups planned, any town by strider, boat, Guild Guide or on foot, early gear and where to find it, and the 3 worlds.</li>
            <li>On a phone, the header is a single row with a search button, and the Character Builder has one row of sections (Configure, Sheet, Loadouts, Premades) instead of two rows of tabs, so its form starts in the first screen.</li>
            <li>The menu bar puts the most used tools first: Character Builder, Level Simulator, Travel Planner, Alchemy, then Faction Journal and Challenge Runs. On a phone, the bottom bar has Travel in place of Alchemy, which is in the menu.</li>
            <li>For a Khajiit or Argonian, the Boots slot in Equipped Loadouts and its &ldquo;Beast races cannot wear boots&rdquo; are readable instead of faded, and so is a ticked Challenge Runs objective.</li>
            <li>Travel has one plain network status with the network name and stop count. Loading and an error with Retry appear in the same place; TR + ARCE is named explicitly.</li>
            <li>Gear Advisor runner-up buttons, Level Simulator preset descriptions, faction ranks and empty equipment slots have clearer small print in both themes.</li>
            <li>Travel shows &ldquo;Real Time Approximation&rdquo; beside in-game time, with movement minutes and transport or spell transitions listed separately. Cheapest compares its fare and movement with Fewest legs using your current options. Combat, menus, loading and time indoors are excluded.</li>
            <li>Travel remembers edits to a loaded save&apos;s guild, Intervention, items and movement options in this browser for that save and world profile. &ldquo;Use save defaults&rdquo; clears them. Scrolls start unticked and have a limited number of uses per journey; known spells show estimated cast chance and need enough Magicka. Replanning does not spend anything in your save.</li>
            <li>Travel puts Origin, Destination and &ldquo;Plan for&rdquo; above the route answer. Character and route options start folded with a summary of your choices; quick starting places open on demand, and &ldquo;How routes are worked out&rdquo; is at the bottom. Guild and carrying warnings stay beside the route.</li>
            <li>Travel has one search for each end of a journey. Towns and transit stops come first, then outdoor places and rooms such as &ldquo;Balmora › Council Club&rdquo;. Pelagiad appears once, and typing a search keeps your route until you choose a result.</li>
            <li>On each Cloud Vault save, Rename and Delete no longer sit in grey boxes, renaming keeps its Save and Cancel buttons whole, and screen readers name the rename box. &ldquo;Become a Premium supporter&rdquo; on Your account is a proper section heading.</li>
          </ul>
        </section>
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-09-29">September 29, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Each tool&apos;s rules and formulas are now in a closed &ldquo;How this is calculated&rdquo; disclosure, written in plainer words. Travel&apos;s route is easier to reach on a phone, and the Cloud Vault explains uploads and save limits without technical jargon.</li>
            <li>No cookies unless you sign in: sign-in now loads only when you use it. The Privacy Policy explains cookies, browser storage, and the cookie-free page-view analytics.</li>
            <li>Signing in with Google or Discord no longer resets an unsaved character in the Character Builder.</li>
            <li>The save importers and About page say what is tested: OpenMW with vanilla Morrowind, Tamriel Rebuilt, and TR + ARCE. Other mods are untested, and Morrowind.exe .ess saves are not supported.</li>
            <li>Report a bug from the footer or the About page. The email template asks for the steps, profile, and browser, and attaches no character data. Server errors show a reference to include.</li>
            <li>About and search descriptions are clearer about privacy: opening a save reads it in your browser, and saving to Cloud Vault sends it to our service.</li>
            <li>Supporter payments recognize Ko-fi donations and support codes in any capitalization. Sharper browser tab icons.</li>
            <li>Keyboard and screen reader fixes: focus is visible on every control in both themes and in Windows high contrast; the pool browser, equipment picker and Cloud Vault behave as dialogs that Escape closes; scrolling lists work from the keyboard; each tool&apos;s heading sits where Skip to main content lands.</li>
            <li>An unknown address shows a proper page with links back, and a malformed share link no longer crashes the Character Builder.</li>
            <li>Security headers stop other sites from framing the pages.</li>
            <li>Silt Strider is open source: the site under AGPL-3.0 and the data pipeline under GPL-3.0. Game and mod data belong to their owners.</li>
            <li>The Level Simulator no longer treats a fighter with Mercantile and Speechcraft as minor skills as a Diplomat, and says which skills it read the archetype from.</li>
            <li>Travel: Guild Guide legs say they are for Mages Guild members only, and a loaded save that is not in the guild gets a note explaining why its routes leave them out.</li>
            <li>Travel marks the options a loaded save set with &ldquo;from your save&rdquo;, and says when an Intervention is only a scroll (one use).</li>
            <li>The Gear Advisor no longer suggests stealing unless you tick &ldquo;Steal early gear&rdquo;.</li>
            <li>Travel&apos;s place search lists a town that spans several map cells once, and its buttons match the page instead of the browser&apos;s grey.</li>
            <li>Plainer wording: the site says its maths follows OpenMW&apos;s source instead of calling it &ldquo;verified&rdquo; or &ldquo;exact&rdquo;, and the Faction Journal describes faction relations as what they are.</li>
            <li>A fresh visit starts from a random premade build instead of the same Dark Elf; a shared link, your signed-in character or a loaded save still comes first.</li>
            <li>With TR + ARCE on, the random starting character can now be one of the ARCE race builds too.</li>
            <li>One name per tool everywhere on screen: Character Builder (formerly Build Optimizer), Level Simulator, Travel Planner (formerly Travel Optimizer), Alchemy, Enchanting, Spellmaking, Faction Journal, Challenge Runs and Cloud Vault.</li>
            <li>Shared build and challenge links open in the world they were made for, even if you last used another; a link that names no world keeps yours.</li>
            <li>Spellmaking, Enchanting and Alchemy show a dash and a prompt until you add an effect or ingredients, instead of numbers that looked like answers.</li>
            <li>Effect lists show base costs as the game does: Light is base 0.2, not 0.20000000298023224.</li>
            <li>Challenge Runs has one row of difficulty presets, in the settings beside what they change, instead of two identical rows.</li>
            <li>The Faction Journal names ranks and counts them from 1, shows skills by name, says plainly what a promotion still needs, and explains the objects a faction owns.</li>
            <li>The dimmer small print on faction ranks, loadout stats, premade builds, challenge restrictions and travel labels is brighter and easier to read, in both themes.</li>
            <li>The Level Simulator&apos;s buttons for reordering attribute priorities are bigger and easier to tap.</li>
            <li>The Level Simulator and Cloud Vault headings nest in order, so screen reader users can move between sections easily.</li>
            <li>Faction quests are listed by name with a plain status (completed, in progress or available), without internal keys or stage numbers.</li>
            <li>No Ctrl K search hint on phones and tablets.</li>
            <li>The world switch explains TR + ARCE: Tamriel Rebuilt with ARCE (All Races and Classes Enabled), a mod that adds many playable races and classes.</li>
            <li>The Gear Advisor recommends gear as soon as you change your character, and &ldquo;Early gear for this build &darr;&rdquo; at the top of the Character Builder jumps down to it.</li>
            <li>Alchemy, Enchanting and Spellmaking let you type your own skill and attribute numbers; they stay when you switch world, until &ldquo;Reset to character sheet&rdquo; puts your character&apos;s back.</li>
            <li>&ldquo;Save this character&rdquo; in the Character Builder keeps a character in this browser, no account needed; the list below it loads or deletes them.</li>
            <li>Faint small print in Equipped Loadouts, the Faction Journal, Travel and the Level Simulator is brighter, and Challenge Runs objective checkboxes are named for screen readers.</li>
          </ul>
        </section>

        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-09-28">September 28, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Early-game clothing and jewelry are ranked for your character: spellcasters are shown Mentor&apos;s Ring, and fighters rings that suit their skills.</li>
            <li>Two ring slots: the Gear Advisor suggests a second, different ring for the other hand, and Equip puts it there.</li>
            <li>Weapons and armor follow your major skills first: an Assassin leads with Short Blade, not a minor Long Blade.</li>
            <li>Removed the old standalone application and compatibility bridges. The tools now use the native application throughout.</li>
            <li>Share links now use page paths and query parameters. Old hash links no longer restore characters or challenge runs; create a new link with the Share buttons.</li>
            <li>Updated the site-save format. Older cloud saves and browser-kept binary saves must be recreated; reimport the original .omwsave file for an imported character. Current OpenMW file import remains available.</li>
            <li>Removed the unused prototype save API and its empty database table.</li>
          </ul>
        </section>

        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-09-27">September 27, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Early gear respects the rules a new character plays by: vault and chapel gear is theft, gear behind locked doors is refused, and Ordinator uniforms are left out.</li>
            <li>Merchants sell what they keep near them, and sources name the merchant and the place instead of a crate and a grid cell.</li>
            <li>Marksman gets a bow over darts. Devil, Demon and Fiend weapons rank by the Bound weapon they conjure and count as endgame gear.</li>
            <li>New Dark Brotherhood armor toggle: the light set worn by the assassin who may attack while you rest.</li>
            <li>Enchanted rings and amulets come before blank ones, and enchanted items list their effects.</li>
            <li>Travel names pack guar caravans, sky lamps and carriages.</li>
            <li>Travel can optimize for fewest legs, cheapest fare, or shortest estimated time, with walking connections to catalogued places and directions through interior doors.</li>
            <li>Walking routes follow terrain around steep ground, the Ghostfence, and open sea, with limited swimming near shore. Fixed overly long walking legs that bypassed useful transport.</li>
            <li>Routes can include Divine and Almsivi Intervention, Propylons, Mournhold transport, and item teleports. Quest teleports are optional and required items can be selected.</li>
            <li>Loaded saves provide your starting location, guild ranks, gold, pack weight, and constant movement effects. Carrying weight, Feather, Burden, Levitate, and Water Walking affect travel estimates.</li>
            <li>Copy route links to share the destination and planning choices. Loaded saves stay in this browser across reloads until cleared or replaced.</li>
            <li>Player-made equipment keeps its weight and constant enchantments on import. Gear recommendations rank useful enchantment effects and no longer repeat the same shield.</li>
            <li>Vault cards show readable race and birthsign names, including distinct Khajiit variants. Account links work on refresh, and navigation keeps the selected world.</li>
            <li>Fixed overlapping desktop navigation and title clipping in both themes. Added site icons, richer search and social previews, tool explanations, and a www redirect.</li>

          </ul>
        </section>

        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-09-26">September 26, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Ko-fi premium activation accepts one-time tips in any supported currency, including amounts below the suggested US$3.</li>
            <li>Published Privacy Policy and Terms of Service pages and corrected the theme-token build issue.</li>
          </ul>
        </section>

        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-09-25">September 25, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Added Your account: choose a username and a built-in Morrowind profile icon.</li>
            <li>One-time, pay-what-you-want Ko-fi support unlocks 25 cloud-save slots instead of 5 and a special profile-icon badge. No recurring payment.</li>
            <li>Cloud saves preserve imported characters with their actual level, class, gold, and progress. Build snapshots retain equipment loadouts, factions, and Bitter Cup.</li>
            <li>Improved sign-in and session renewal, isolated saves when switching accounts, and validated imports before changing the active character.</li>
            <li>Fixed duplicate favored attributes, out-of-range level plans, unavailable equipment affecting totals, and faction eligibility using outdated stats.</li>
          </ul>
        </section>
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12"><time dateTime="2026-09-24">September 24, 2026</time></h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Challenge Runs is back in the main navigation. Character sheets show racial powers and keep attribute totals on one line.</li>
            <li>Bitter Cup is available in the Level Optimizer. Gear recommendations support one-handed and shield or two-handed setups.</li>
            <li>Equip the displayed early- or late-game recommendations directly into a loadout. Equipment browsing uses the selected profile’s full catalog, enchantments, and source plugins.</li>
            <li>Alchemy, Enchanting, and Spellmaking use character and imported-save attributes. Apparatus quality labels are rounded for readability.</li>
            <li>The level planner keeps its range after reset, applies manual choices to later progression, and shows every level in sequence.</li>
            <li>Magic editors respect allowed casting ranges and attribute or skill targets. Selected effects keep their identity as catalogs load.</li>
            <li>Travel respects Mages Guild membership and TR Conjurer rank. Faction membership edits and unfinished tool drafts survive page navigation.</li>
          </ul>
        </section>
        {/* September 22, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-22">September 22, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>
              <strong className="text-fg-2">Ashfall Default Theme:</strong> Made Ashfall the default color palette site-wide, with Morrowind Classic available as a toggle in the menu.
            </li>
            <li>
              <strong className="text-fg-2">Home Page Rebuild:</strong> Rebuilt the landing page around the active character — quick-access cards for every tool, live stat preview, and one-tap navigation.
            </li>
            <li>
              <strong className="text-fg-2">Site Search:</strong> Added a universal search palette (Ctrl+K / Cmd+K) indexing every view, action, and game term across the site.
            </li>
            <li>
              <strong className="text-fg-2">Phone Tab Bar:</strong> Added a bottom navigation bar on mobile with quick access to the five most-used tools.
            </li>
            <li>
              <strong className="text-fg-2">Transit Map:</strong> Added a visual transit network map to the Travel Optimizer showing all routes at a glance.
            </li>
            <li>
              <strong className="text-fg-2">Send to Build Optimizer Fix:</strong> Rewired the Challenge Runs &quot;Send to Build Optimizer&quot; bridge to write through CharacterContext, fixing the broken handoff after the Phase 13 legacy cleanup.
            </li>
            <li>
              <strong className="text-fg-2">Open an OpenMW Save:</strong> Open a <code className="text-accent">.omwsave</code> from the Cloud Vault without signing in; it is read in your browser and never uploaded. The builder takes over the character (custom classes included) and switches to the save&apos;s game profile, and anything the save&apos;s mods add that Silt Strider does not know is listed rather than guessed.
            </li>
            <li>
              <strong className="text-fg-2">Challenge Runs Fixes:</strong> The run stays when you leave the page, Generate respects your difficulty ticks, seeds carry your settings and world so they roll the same run anywhere, Share links open the exact run (and Copy Build Link now opens the character), a character sent to the Build Optimizer can be sent back, and your preferred settings are remembered.
            </li>
            <li>
              <strong className="text-fg-2">Enchant Capacity and Buttons:</strong> The Gear Advisor shows enchant capacity as the game does (an Exquisite Shirt holds 60, not 600). The Level Optimizer and other go-to buttons work again, and TR + ARCE sits in the top bar beside Vanilla and Tamriel Rebuilt.
            </li>
            <li>
              <strong className="text-fg-2">Front Page Leads with Your Save:</strong> Drop an OpenMW save anywhere on the home page to load it, or pick your world (Vanilla, Tamriel Rebuilt, TR + ARCE) and start a new build. Alchemy and Travel get large cards, with your brew chance on the Alchemy card.
            </li>
            <li>
              <strong className="text-fg-2">Navigation:</strong> Alchemy and Travel join the top menu, Challenge Runs moves under More, and the Cloud Vault is the account button beside search. On phones, the tab bar now has Alchemy.
            </li>
            <li>
              <strong className="text-fg-2">Your Save Across the Tools:</strong> The Equipment Studio gets a &quot;Worn by&quot; loadout with the character&apos;s gear and real stats, the Level Simulator can plan from the save&apos;s level, and the Journal shows its factions and quests. Cloud saves now keep gender, specialization and favoured attributes.
            </li>
          </ul>
        </section>

        {/* September 21, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-21">September 21, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>
              <strong className="text-fg-2">Theme Tokens Refactor:</strong> Routed every component color through semantic design tokens, enabling site-wide palette swaps with a single theme file.
            </li>
            <li>
              <strong className="text-fg-2">Health Growth Chart:</strong> Made the Level Simulator&apos;s Health projection chart readable at a glance with clearer labels and contrast.
            </li>
            <li>
              <strong className="text-fg-2">Page Centering Fix:</strong> Corrected the page column and header alignment for consistent centering across all viewports.
            </li>
            <li>
              <strong className="text-fg-2">Legacy Cleanup &amp; Architecture Archival (Phase 13):</strong> Archived obsolete transition harnesses (<code className="text-accent">components/legacy-workbench.jsx</code>, extraction scripts, and bridges) into <code className="text-accent">archive/legacy/</code>.
            </li>
            <li>
              <strong className="text-fg-2">Native Styling Bundling:</strong> Ingested base legacy styling into <code className="text-accent">app/legacy-compat.css</code> and removed runtime <code className="text-accent">/legacy/legacy.css</code> stylesheet links from the page root.
            </li>
            <li>
              <strong className="text-fg-2">Architecture &amp; Shell Decoupling (Phase 12):</strong> Completed full architectural transition away from the legacy extraction harness towards a native, declarative React 19 / Next.js 16 layout.
            </li>
            <li>
              <strong className="text-fg-2">Native React App Shell:</strong> Implemented <code className="text-accent">components/app-shell.jsx</code> mounting all 12 tools cleanly with zero DOM portal or legacy innerHTML dependencies.
            </li>
            <li>
              <strong className="text-fg-2">Pure ESM Permalink Codec:</strong> Built universal UTF-8 Base64URL encoder/decoder and URL hash state engine in <code className="text-accent">lib/permalink-codec.mjs</code> supporting all 12 tools and preserving 100% backward compatibility with bookmarked links.
            </li>
            <li>
              <strong className="text-fg-2">Challenge Engine Decoupling:</strong> Extracted card rolling, lock preservation, and conflict resolution into pure ESM <code className="text-accent">lib/challenge-engine.mjs</code>.
            </li>
            <li>
              <strong className="text-fg-2">Asset Ingestion &amp; Design Tokens:</strong> Ingested Pelagiad font and Morrowind 9-slice border textures as native static assets with formal CSS variables.
            </li>
            <li>
              <strong className="text-fg-2">Dynamic Best-In-Slot Resolution:</strong> Repointed late-game gear recommendations to dynamically consume <code className="text-accent">public/game-data/current.json</code> with synthetic fixture fallbacks for CI.
            </li>
          </ul>
        </section>

        {/* September 20, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-20">September 20, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>
              <strong className="text-fg-2">Faction Journal &amp; Promotion Deficit Engine:</strong> Full workstation tracking memberships, FADT rank requirements, promotion deficits, mutual exclusions (Great Houses &amp; Vampire Clans), and inter-faction diplomacy.
            </li>
            <li>
              <strong className="text-fg-2">Live bundle data:</strong> Wired Enchanting, Spellmaking, Alchemy, and Travel to content-addressed catalogs with live badges.
            </li>
            <li>
              <strong className="text-fg-2">Gear Advisor:</strong> Added &quot;Near starting areas&quot; policy toggle alongside Steal and Endgame with dynamic filtering.
            </li>
            <li>
              <strong className="text-fg-2">Equipped Loadouts:</strong> 19-slot categorized CRPG equipment ledger with weighted AR, carry capacity, and multi-loadouts.
            </li>
            <li>
              <strong className="text-fg-2">Cloud Character Vault:</strong> Authentic save workstation (<code className="text-accent">#panel-vault</code>) and modal portal with OpenMW .omwsave import.
            </li>
            <li>
              <strong className="text-fg-2">SLT1 binary codec:</strong> ~96% compression for fast Cloudflare D1 cloud saves and offline-first local storage.
            </li>
          </ul>
        </section>

        {/* September 19, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-19">September 19, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>
              <strong className="text-fg-2">Character Level Simulator:</strong> Introduced an interactive leveling workstation framed in 6px ornate parchment with &quot;Stats Only&quot; and &quot;Stats &amp; Skills&quot; progression modes.
            </li>
            <li>
              <strong className="text-fg-2">1-Click optimization presets:</strong> Auto-Calculate Optimal Build, Rush Endurance (+5), Triple +5, and Efficient (+5/+5/+1 Luck).
            </li>
            <li>
              <strong className="text-fg-2">Training solver:</strong> Calculates exact miscellaneous training deficits required for 5x attribute multipliers each level.
            </li>
            <li>
              <strong className="text-fg-2">Health projection curve:</strong> Dynamic SVG chart contrasting optimal vs. delayed Endurance scaling.
            </li>
            <li>
              <strong className="text-fg-2">Four specialized workstations:</strong> Overhauled Enchanting, Spellmaking, Alchemy, and Travel into two-pane CRPG workstations consuming active character stats.
            </li>
            <li>
              <strong className="text-fg-2">Challenge Runs overhaul:</strong> Interactive card controls, deterministic seed engine, card locking, and conflict resolution validator.
            </li>
          </ul>
        </section>

        {/* September 18, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-18">September 18, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Next.js 16 with React 19 architecture, static export, and on-demand game data loading for Vanilla, Tamriel Rebuilt, and ARCE profiles.</li>
            <li>Rebuilt Character Planner in React: interactive Configurator, live Character Sheet, Premade Builds catalogue browser, and decoupled Gear Advisor.</li>
            <li>Art direction overhaul and 3-tier frame hierarchy with high-contrast gold focus outlines meeting WCAG AA standards.</li>
            <li>Cross-tool calculator integration: live character HUD banners reflecting Intelligence, Willpower, Luck, and fatigue.</li>
          </ul>
        </section>

        {/* September 17, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-17">September 17, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Enchanting calculator: effects, souls, Constant Effect rules, and named enchanters with barter pricing.</li>
            <li>Spellmaking calculator: magicka cost, cast chance, and spellmaker gold based on player skills.</li>
            <li>Alchemy calculator: named apparatus across 5 tiers, 4 ingredient slots, and potion preview.</li>
            <li>Travel optimizer: fewest hops transit network routing across Vvardenfell, Solstheim, and mainland Morrowind.</li>
          </ul>
        </section>

        {/* September 15, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-15">September 15, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Challenge run individual card locking and pinning with conflict resolution against overlapping restrictions.</li>
            <li>Starting spells and powers computation based on race, birthsign, and magic skills.</li>
            <li>Beast race gear filtering: Argonians and Khajiit receive open helmets and no footwear.</li>
            <li>Early-game gear rules: Steal early gear toggle and proximity ranking starting near Seyda Neen.</li>
          </ul>
        </section>

        {/* September 14, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-14">September 14, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Place regions for gear locations and objectives read from game data.</li>
            <li>ARCE races and classes integration from ARCE 4.1 and Tamriel_Data.</li>
            <li>Shared sheet calculation between custom builder and challenge runs.</li>
          </ul>
        </section>

        {/* September 13, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-13">September 13, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>First public release of the build planner and challenge run generator.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
