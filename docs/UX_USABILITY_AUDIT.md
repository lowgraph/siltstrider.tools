# Silt Strider — Usability and UX Audit

**Date:** 29 September 2026
**Target:** the live site, release `b5a0813` (Worker `65f849c7`)
**Scope:** clarity, user satisfaction and the psychology of the interface, before the UX pass.
Accessibility is covered separately in [QA_ADVERSARIAL_A11Y_AUDIT.md](QA_ADVERSARIAL_A11Y_AUDIT.md)
and the second-audit fixes in COORDINATION.

## How this was done

A heuristic review and a cognitive walkthrough: every page was used as a player would, in
headless Chrome at 1366×900 and at phone width (390×844), in the default (modern) theme with
spot checks of the Morrowind theme, in Vanilla and Tamriel Rebuilt. Tasks were run as four
players:

| Player | Situation | Typical question |
| --- | --- | --- |
| **Newcomer** | Arrives from a Reddit post, often on a phone, no save to hand | "What is this, and is it useful to me?" |
| **New campaign** | Level 1 in Seyda Neen, not in any guild, little gold, no spells | "How do I get to Ald'ruhn? What can I afford?" |
| **Save loader** | An OpenMW player mid-campaign who drops in their `.omwsave` | "What should I do next with *my* character?" |
| **Veteran** | Knows the ×5 system and the formulas | "Is this tool right, and faster than the wiki?" |

This is an expert review, not a test with real users: it finds most problems but cannot say
how often they bite. A five-person test script is at the end. Not covered: signed-in Cloud
Vault flows, TR + ARCE beyond the world switch, and screen-reader use (the accessibility audits
cover that). Screenshots are in `A:\Cache\ux` (not in the repository).

Findings have an ID, a severity for launch visitors (**High**: many visitors hit it and lose
trust or the answer; **Medium**: slows or confuses; **Low**: polish), the principle behind it,
and a recommendation with a rough effort (S, M, L).

## The ten that matter most

1. **Defaults assume a character the player does not have** (TRV-1, BLD-1, TRV-6, ENC-1, HOME-2).
   Mages Guild membership is on for everyone, the Gear Advisor steals by default, a loaded save
   silently re-ticks Intervention on every visit, Enchanting starts with end-game items, and an
   unexplained "Dark Elf Custom" drives every number. People accept defaults as advice (the
   default effect), so each wrong default is a wrong answer most visitors never question.
2. **Travel's search gives two answers to one question** (TRV-2, TRV-3): a stop list and a
   separate "Places" list, one saying "0 stops found" while the other lists Pelagiad twice, in
   browser-grey buttons.
3. **The answer sits below the controls** (TRV-4, BLD-2): on a phone the route comes after the
   options, both pickers and a page of engine rules; the Gear Advisor, the Builder's most
   useful output, is at the bottom and empty until clicked.
4. **The Level Simulator reads the default warrior as a Diplomat** (LVL-1) and tells it to raise
   Personality first, on the home page and the simulator alike. Veterans will judge the whole
   site by that line.
5. **One tool, four names** (SITE-1): Build Optimizer, Character Builder & Class Planner,
   Character Builder & Build Optimizer, and a "Level Optimizer" button that opens the Level
   Simulator.
6. **Text written for developers** (SITE-2): "invariants" boxes on every page, "Ingest
   Character Stats", "Live: 22 Stops (VANILLA)", `long_blade`, "Rank 0", "Landlord: 186
   placements", "ArrayBuffer" and "atomic SQLite triggers in Cloudflare D1".
7. **Results before input** (CALC-1): Spellmaking shows 100% cast reliability and a governing
   school before any effect is chosen; Alchemy shows a 13% brew chance with no ingredients.
8. **No way to use your own numbers** (CALC-2): the calculators take skills only from the active
   character, so "what is my chance at Alchemy 45?" means building a character first.
9. **Duplicate controls** (CHL-1, CALC-3): Challenge Runs has two identical rows of difficulty
   presets; every Alchemy slot has a dropdown and a separate search box.
10. **The phone experience is a shrunken desktop** (MOB-1 to MOB-4): a header that fills a third
    of the screen, "Choose a save file" as the main action on a device that rarely has one, a
    "Ctrl K" hint, and the Builder's form below two rows of tabs.

## Travel (the reference case)

**TRV-1 — Mages Guild membership is on by default. High.**
A new character is not a member, but the planner assumes one. From Ald-ruhn to Vivec the default
answer is "1 leg · 11 gold · no time" by Guild Guide, which that player cannot take; unticked,
the real answer is 2 legs, 36 gold, 8 hours. *Default effect; error prevention.*
Recommendation: default to what a level 1 character has (no guild, no spells, no items), and
say so in one line: "Planning for a new character: no guild, no spells. Change". (S)

**TRV-2 — Two lists answer one search. High.**
Typing in Origin filters a native list of stops *and* opens a separate "Places" list of every
matching cell. For "Pelagiad" the stop list is empty with its chevron still showing and "0 stops
found", while Places lists Pelagiad; for "Balmora" the town is in the stop list and a dozen
house interiors fill Places. Players do not think in stops and cells, they think in places.
*Match between system and the real world; recognition over recall.*
Recommendation: one combobox per end of the route, one ranked list: towns and stops first, then
named exteriors, then interiors grouped under their town ("Balmora › Council Club"), with a
small badge for how it is reached ("silt strider", "walk", "inside"). Drop the result counter,
or count what is shown. (M)

**TRV-3 — The Places buttons are browser-grey, and names repeat. Medium (and a bug).**
The Places buttons have no background class, so Chrome paints its default grey
(`rgb(107,107,107)`) with low-contrast grey region text on top; the same slip as the Manual Step
Override button fixed in `3557bb1`. "Pelagiad (Ascadian Isles)" appears twice. *Aesthetic and
minimalist design; consistency.* Recommendation: `bg-transparent` like the rest; merge or
disambiguate same-named exterior cells (by grid, or pick the town centre). (S)

**TRV-4 — The route comes last. High on phones, Medium on desktop.**
The first screen is options: nine checkboxes and inputs, then up to 39 item checkboxes behind a
disclosure, then the Fast Origin chips, then the pickers. On desktop the route summary peeks in
at the bottom of the first screen; on a phone it comes after a full screen of "Transit engine
rules". *Task first; progressive disclosure.*
Recommendation: From, To and Plan for at the top with the answer right under them; "Your
character" options folded into a one-line summary that opens on demand; the rules behind a
"How routes are worked out" disclosure at the bottom. (M)

**TRV-5 — Too many options at once. Medium.**
Mages Guild, Conjurer rank, Divine and Almsivi Intervention, quest teleports, walking, carried
weight, Levitate, Water Walking, followers, and 16 (Vanilla) to 39 (TR) Propylon indices and
teleport items. Each is right for someone; together they slow everyone (Hick's law).
Recommendation: group as "Your character" (guild, spells, items, carrying) and "Route style"
(walking, quest teleports); show only a summary until opened. (M, with TRV-4)

**TRV-6 — A loaded save overrides the player's choices on every visit. High for save loaders.**
With a save loaded, Travel ticks Intervention, carried items and Mages Guild from the save. The
player unticks Almsivi Intervention, reloads, and it is ticked again: the choice is not kept.
Nothing beside those boxes says "from your save" (the carried weight line does). One scroll of
Divine Intervention counts as permanent access, though a scroll is used once. A warrior with 40
Magicka may know the spell and rarely manage to cast it. *User control and freedom;
visibility of system status.*
Recommendation: mark save-set options ("from your save"); let a player's change stick for that
save; treat scrolls as "1 use" (or leave them unticked with a note); consider cast chance before
assuming a spell is usable. (M)

**TRV-7 — "Cheapest" is literal. Low.**
With Mages Guild off, Cheapest walks about ten cells through Ebonheart to save 5 gold over
Fewest legs, adding an hour. Correct, but rarely what a player means. Recommendation: show the
trade-off on the result ("saves 5 gold, 1 h 13 min slower than Fewest legs"). (S)

**TRV-8 — Status shown twice. Low.**
"Network: Vvardenfell (Vanilla) · Stops: 22" and a green "Live: 22 Stops (VANILLA)" pill sit in
the same bar. Recommendation: keep the plain one. (S)

**Works well:** the Fast Origin chips with their roles ("Arrival Port", "Central Hub"), the map
that highlights the route and takes clicks, turn-by-turn legs naming the silt strider driver,
the fares line explaining why ("Mercantile 15, Personality 55"), and shareable route links.

## Home

**HOME-1 — The main action suits desktop players with a save. Medium.**
"Drop your OpenMW save here" is the hero's primary button; "No save yet? Start a new build" is a
small link below the world switch. Most newcomers from Reddit, and nearly all on phones, have no
save to hand. *Serve the majority path first.* Recommendation: two equal first steps, "Load my
save" and "Start a character" (or "Browse 41 premade builds"); on phones lead with the second. (S)

**HOME-2 — "Current character: Dark Elf Custom" is nobody's character. Medium.**
A first visit shows a full character card, stats and a "Next level-up", for a character the
visitor never made, and its numbers drive every tool (Travel fares, Alchemy's 13%). *Mental
model; visibility of system status.* Recommendation: label it an example until the player
changes or loads one ("Example character — make it yours"); show the same label in the
"Active character" bars. (S)

**HOME-3 — Vanity numbers. Low.** "27 skills modeled", "103 challenge restrictions", "22 travel
stops in Vanilla" (it routes to any place, and TR has 91 stops) say little to a player.
Recommendation: replace with outcomes a player cares about ("Routes to any named place",
"×5 level-ups planned for you"), or drop. (S)

**Works well:** the headline, "Nine tools. One character.", and cards that show real answers for
the current character (next level-up, a travel example, a health curve) rather than marketing
copy: fast time to value.

## Character Builder

**BLD-1 — "Steal early gear" is on by default. High.**
The Gear Advisor recommends theft unless unticked. Many players role-play lawful characters,
and a default reads as the site's advice. Recommendation: off by default, or ask once ("Include
items you would have to steal?"). (S)

**BLD-2 — The Gear Advisor is at the bottom and empty until clicked. Medium.**
The Builder's most useful answer ("what should I wear and where do I get it?") needs a scroll
past the sheet and a click on "Optimize Gear". Recommendation: compute it automatically when
the build changes and link to it from the top ("Early gear for this build ↓"). (M)

**BLD-3 — Newcomers start at the hardest tab. Medium.** Custom Class Builder is first; the
Premade Builds Catalog (41 builds) is third, though choosing from examples is easier than
composing (recognition over recall). Recommendation: for a first visit, open on premades or
show three suggested builds above the custom form. (S)

**BLD-4 — "Saved characters" has no save button. Medium.** The section offers only "Copy Build
Link" and a "Cloud Vault" pill. Recommendation: a clear "Save this character" (local, no account
needed), with the cloud as an option. (S–M)

**BLD-5 — "Level Optimizer →" leads to the Level Simulator.** See SITE-1. (S)

## Level Simulator

**LVL-1 — The default warrior is read as a Diplomat. High.**
Dark Elf Custom (Long Blade, Heavy Armor, Block, Armorer, Athletics) is detected as "Diplomat /
Merchant", so the first suggestion is Endurance, *Personality* and Speed ×5, shown on the home
page too. To a veteran that is simply wrong, and it costs trust in everything else.
The cause is in `detectArchetype` (`lib/level-math.mjs`): Diplomat is scored first and returns
early, and Mercantile and Speechcraft as *minors* score 4 + 4 = 8, the threshold, before any
combat skill is counted. Recommendation: score minors lower than majors and compare Diplomat
with the other archetypes instead of returning early (the Gear Advisor already ranks majors
first); show why ("Detected: Warrior, from Long Blade, Heavy Armor, Block"); add a test for the
default build. (S–M)

**LVL-2 — "Drink Bitter Cup" is the first control on the page. Low.** A niche artifact trick
leads, above the simulator itself. Recommendation: move it into an "Advanced" group. (S)

**LVL-3 — Truncated priority labels. Low.** "Endur…", "Perso…", "Streng…", "Willpo…".
Recommendation: three-letter abbreviations, as the sheet uses (END, PER, STR). (S)

**Works well:** the health projection is the best-designed element on the site: a clear chart,
a concrete number ("+75 HP"), and loss framing ("Permanent HP lost if Endurance is delayed:
−75 HP") that motivates exactly the behaviour it recommends.

## Alchemy, Enchanting, Spellmaking

**CALC-1 — Results before input. Medium.** Spellmaking shows "Cast reliability 100%" and
"Governing school: Destruction" with no effect chosen; Alchemy shows "13%" and "0 g" with no
ingredients. Empty states that look like answers mislead. Recommendation: dashes and a prompt
("Add an effect to see its cost") until there is input. (S)

**CALC-2 — Your own skill cannot be typed in. Medium.** The calculators read the active
character; there is no field for "my Alchemy is 45". "Ingest Character Stats" suggests an import
but does not say what it does. Recommendation: show the skill, attributes and Luck used as
editable fields prefilled from the character ("Using Dark Elf Custom: Alchemy 5 — change"). (M)

**CALC-3 — Two controls per slot. Low.** Each of the four Alchemy slots has a dropdown and a
separate "Search…" box. Recommendation: one searchable combobox per slot. (M)

**CALC-4 — Alchemy answers the less common question. Medium.** It computes forward (pick
ingredients, see the potion); most players ask backward ("what makes Restore Health from what I
can buy?"). The "share effects with Slot 1" filter helps a little. Recommendation: an effect
search that lists ingredient pairs and where to buy them. (L; a feature, not a fix)

**ENC-1 — Enchanting starts at the end game. Low.** Exquisite Ring and Grand Soul Gem are the
defaults. Recommendation: a common first case (a Common Ring and a Petty or Lesser soul), or
remember the last choice. (S)

## Faction Journal

**FAC-1 — Internal names on screen. Medium.** "Eligible for Rank 0", "Primary (long_blade)",
"Landlord: 186 placements", "79 spots", "1 primary + 2 favoured required". Recommendation: rank
names ("Associate, the first rank"), skill labels ("Long Blade"), and plain descriptions of what
spots and placements mean, or hide them. (S)

**FAC-2 — The subtitle promises "inter-faction standing"**, a claim the launch copy dropped as
unverified. Recommendation: match the page to what it does. (S)

## Challenge Runs

**CHL-1 — Two identical preset rows. Medium.** "Preset: Standard · Hardcore · Cursed · Custom"
at the top and "Difficulty preset" with the same four below it. Players wonder which one counts.
Recommendation: one row. (S)

**CHL-2 — Locks everywhere. Low.** Race, Class and Sign locks in the sheet, three pinned-slot
rows, and Major and Restrictions locks: several ways to say "keep this". Recommendation: one
lock per rolled item, next to it. (M)

## Cloud Vault

**VLT-1 — Developer copy. Low.** "Save inspection & vault invariants: Zero-Server Binary
Parsing … ArrayBuffer … atomic SQLite triggers in Cloudflare D1". Recommendation: "Your save is
read in your browser and never uploaded unless you save it to your account. Free accounts keep
5 saves; supporters 25." (S)

## Site-wide

**SITE-1 — Names drift. Medium.** The same tools appear as: Build Optimizer / Character Builder &
Class Planner / Character Builder & Build Optimizer; Travel / Travel Optimizer / Travel &
Transport Route Planner; Level Simulator / Level Optimizer / Character Level Simulator &
Progression Optimizer; Cloud Vault / Cloud Character Vault / OpenMW Save File Inspector.
*Consistency; wayfinding.* Recommendation: one short name per tool, used in nav, headings,
buttons and cards; keep the long SEO names for titles only. (S)

**SITE-2 — Developer-facing text. Medium.** "Invariants" boxes (Builder, Level Simulator,
Challenge, Vault), "Transit engine rules", "Engine brewing formula", "Live:" pills, "Ingest".
They signal rigour to veterans and read as noise to everyone else. Recommendation: one "How
this is calculated" disclosure per tool, closed by default, in plain words with the formulas
inside. (S)

**SITE-3 — Navigation leads with the least central tool. Low.** The nav starts with Challenge
Runs; the home page and footer lead with Build and Level. Recommendation: Build, Level, Travel,
Alchemy, then the rest. (S)

**SITE-4 — The active character is global but managed in one place. Medium.** Every tool shows
"Active character: Dark Elf Custom" but only the Builder changes it. Recommendation: make the
bar a control: name, a "change" link to the Builder, and "example" until made (HOME-2). (S–M)

**SITE-5 — "TR + ARCE" is unexplained in the world switch. Low.** Recommendation: a tooltip or
subtitle: "Tamriel Rebuilt with All Races and Classes Enabled". (S)

## Phone

**MOB-1 — The header takes a third of the first screen:** logo, two taglines, menu button,
theme button, search and theme toggle (about 250 of 844 pixels). Recommendation: one tagline or
none, search behind an icon. (M)

**MOB-2 — "Choose a save file" leads on phones.** See HOME-1. (S)

**MOB-3 — "Search every item, spell and place · Ctrl K"** on a phone. Recommendation: hide the
shortcut on touch devices. (S)

**MOB-4 — The Builder's form starts below the fold,** under three stacked tab buttons and a
second Configurator / Character Sheet tab bar. Recommendation: one tab level, or a compact
segmented control. (M)

## What to keep

The health projection and its loss framing; home cards that show real answers; the Fast Origin
chips; the travel map and turn-by-turn legs; share links everywhere; the search palette (fast,
categorised, keyboard-first); the plain privacy line on save import ("read in your browser:
nothing is uploaded"); and the social card.

## Suggested order for the UX pass

**Before launch (small, high impact):** TRV-1, BLD-1, TRV-3, LVL-1, HOME-2, CHL-1, CALC-1,
FAC-1, FAC-2, SITE-1, SITE-2 (collapse, not rewrite), MOB-3, and TRV-6's "from your save" label.

**Soon after launch (medium work, best done with real feedback):** TRV-2 (one combobox),
TRV-4/TRV-5 (task first, options folded), TRV-6 (remember choices, scrolls), BLD-2, BLD-3,
BLD-4, CALC-2, CALC-3, HOME-1, SITE-4, MOB-1, MOB-4.

**Features, not fixes:** CALC-4 (reverse alchemy).

Carry the accessibility leftovers (contrast of `fg-13`–`fg-15`, the 20px buttons, heading
levels) into the same pass, and re-run the axe and keyboard audit as its acceptance test.

## A five-person usability test

Twenty minutes each, thinking aloud, screen recorded, on the live site with no help. Recruit
two players starting a new campaign, two veterans, and one who uses only a phone.

| # | Task (read aloud) | Success | Watch for |
| --- | --- | --- | --- |
| 1 | "You just clicked a Reddit link. What is this site, and would you use it?" (10 seconds, then answer) | Names two tools | Whether the save CTA or the character card confuses |
| 2 | "You're level 1 in Seyda Neen with 100 gold, no guild, no spells. Get to Ald'ruhn as cheaply as you can." | Unticks Mages Guild, reads a Silt Strider route | Whether they notice the guild default at all |
| 3 | "Find how to get to Pelagiad." | Picks Pelagiad, gets a walk | Which of the two lists they use |
| 4 | "Make a Breton battlemage and find armour you can get early without stealing." | Unticks theft, runs the advisor | How long to find the Gear Advisor |
| 5 | "Your Alchemy skill is 45. What's your chance to brew?" | Finds a way, or says it can't | Whether they look for a skill field |
| 6 | "Plan your next level-up for this character." | Reads a ×5 plan and trusts it | Reaction to the suggested attributes |
| 7 | (Phone) "Roll a challenge run and share it with a friend." | Copies a link | Which preset row they use |

Afterwards ask: what was confusing, what they would use again, and one word for the site.
Count failures and hesitations per finding ID above; three or more of five hitting the same
problem makes it a before-launch fix.
