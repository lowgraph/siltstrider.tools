# Launch post copy

Ready-to-post copy for the public launch, rewritten on 29 September 2026 from
Antigravity's release plan. Every claim below was checked against the live site, the
code or the game data that day; claims that failed are listed at the end so they are
not reintroduced. Update this file when a feature or a privacy fact changes.

## Before posting

1. **Licence: done.** The site is `AGPL-3.0-or-later` and the pipeline
   `GPL-3.0-or-later` (29 September), so "open source" is accurate for the code. It
   covers the code only: never imply the game or mod data, the Pelagiad font, or the
   Silt Strider name and logo are open source.
2. **Sign-in test on production.** Build a character, click Sign in in the Vault, sign
   in with Google or Discord, save, and reload: you should come back signed in with the
   same character.
3. **Each community's rules.** Three subreddits and four Discord servers were checked
   on 29 September (see [Community rules](#community-rules)). Three of the servers need
   a moderator's answer or a role before you post.
4. **Social card: redone** (29 September). `/og-image.png` (1200×630) is what Reddit
   and Discord show with every link. The old one said "Formulas verified against
   OpenMW 0.51 engine source code" and "Exact Alchemy" (claims removed below), and
   its sample Dark Elf Spellsword with The Lady showed 70 Magicka and 55 Health. The
   new one is rendered by `npm run social-card` from `scripts/social-card/card.html`,
   with the sample's numbers computed by the builder's and Level Simulator's own code
   from the staged bundle (45 Health, 40 Magicka, 195 Fatigue; level 2: Endurance,
   Strength and Intelligence ×5, Health 45 → 53). Rerun it after restaging new data.
   It goes live with the next deploy.
5. **Screenshots.** Builder with the Gear Advisor, the Travel map, the Level Simulator,
   a loaded save.
6. **Timing** (Antigravity's proposal, the owner's call): Reddit and Discord on
   Tuesday 6 October 2026 at 13:30 UTC; Show HN on Wednesday 7 October at 14:00 UTC;
   creator outreach from Thursday 8 October. Stagger posts rather than cross-posting
   the same text on one day.

## Messages to send

In order. The launch posts' exact text is in the sections below; each line links to
it. Answers change what you post: record them here.

- [x] **r/OpenMW moderators: Sent (29 September 2026).** Modmail sent asking about Rule 6 permission.
- [x] **OpenMW Discord: Sent (29 September 2026).** Direct message sent to PR coordinator (`testman`).
- [x] **Tamriel Rebuilt Discord: Skipped.** Dropped by owner to avoid server overlap and unwanted spam. TR players are reached directly via r/TamrielRebuilt.
- [x] **Morrowind Discord ("Morrowserver"): Sent (29 September 2026).** Posted in `#offtopic` (per Admin guidelines directing server questions there) asking whether tools belong in `#modding` or `#morrowind`. Pick a House Role in `#house-roles` for launch day permissions.
- [ ] Nothing to send beforehand for r/Morrowind, r/TamrielRebuilt or the Morrowind
      Modding Community.

**By Monday 5 October: decide from the answers**

- [ ] r/OpenMW: no answer means post anyway; a refusal or another place means follow
      it.
- [ ] Discord servers: post only where the answer was yes, in the channel they named.
      No answer means skip that server: the Tamriel Rebuilt server deletes
      unauthorised links with a timeout, and a wrong channel risks a warning.
- [ ] Morrowind Modding Community: find the channel for tools or projects.

**Launch day (Tuesday 6 October, 13:30 UTC, or your time)**

- [ ] r/Morrowind, flair **Showcase**: [r/Morrowind](#rmorrowind).
- [ ] r/OpenMW, unless refused: [r/OpenMW](#ropenmw).
- [ ] r/TamrielRebuilt: [r/TamrielRebuilt](#rtamrielrebuilt).
- [ ] Morrowind Modding Community, and each Discord server that said yes, once each:
      [Discord (short)](#discord-short).
- [ ] Stay a few hours to answer comments: [Replies](#replies-to-common-questions).

**Wednesday 7 October**

- [ ] Show HN: [Show HN](#show-hn).
- [ ] X: [X thread](#x-thread).

**From Thursday 8 October**

- [ ] Creators, one by one, through each one's business contact:
      [Creator outreach](#creator-outreach). Fill in the name and the video yourself.

## What you can say

| Claim | Status on 29 September |
| --- | --- |
| Free, no ads, no account needed for the tools | True. Accounts are only for Cloud Vault. |
| Open source: the site under AGPL-3.0, the data pipeline under GPL-3.0 | True since 29 September. The code only; game and mod data belong to their owners. |
| No cookies unless you sign in | True since `74a9c9f`: Clerk loads only for a signed-in browser or on Sign in. |
| Page visits counted by Cloudflare Web Analytics, without cookies | True; it is disclosed in the Privacy Policy. It **is** a script, so never say "zero tracking scripts". |
| An OpenMW save is read in your browser, not uploaded | True. Saving it to Cloud Vault is optional and sends the parsed character to the service. |
| Sign in with Google or Discord | True (owner-tested). |
| Cloud Vault: 5 slots free; a one-time Ko-fi tip (pay what you want, suggested US$3) gives 25 and a gold icon border | True (account page). |
| Data read from the game's own plugin files | True: vanilla Morrowind with Tribunal and Bloodmoon; Tamriel Rebuilt 26.08.23 with Project Tamriel's Skyrim and Cyrodiil; ARCE 4.1 ("All Races and Classes Enabled"). |
| Tamriel Rebuilt 26.08.23 is the "Poison Song" release | True (owner, 29 September). Use the name: it is what TR players know the release by. |
| Formulas follow OpenMW 0.51's source | Reasonable; don't claim "every formula verified" or "absolute parity". |
| Level Simulator plans ×5 multipliers, which miscellaneous skills to train, and the training cost | True (`optimizeLevelStep`). |
| Travel: fewest legs, cheapest fare or fastest trip, across striders, boats, river striders, pack guars, sky lamps, carriages, guild guides, Propylons and Intervention, with walking legs | True (changelog 27 September; vehicle types checked 28 September). |
| Gear Advisor: early gear a level 1 character can reach, where and from whom, with theft and locked doors flagged; rings and amulets ranked for the build; a late-game kit | True. |
| Challenge runs with seeds and share links | True. |

## Community rules

Checked against the rules and flairs the owner copied from each subreddit on 29
September 2026.

| Community | Rule that applies | What the copy does |
| --- | --- | --- |
| r/Morrowind | 4, use flairs | **Showcase**: it is for something you made. Not Mod Release (the site is not a mod) or openmw (too narrow for a post about every tool). The other flairs, for reference: Announcement, Discussion, New Player - Advice/Help, Build, Question, Screenshot, Video, Artwork, meme, literature, music, Technical - General, Technical - Mod, Other, Solved. |
| r/Morrowind | 2, no piracy, no large modpacks | Links only to siltstrider.tools and its GitHub repositories. Never link mod downloads other than the mods' official pages, and never describe TR + ARCE as a pack: the site ships no mod files. |
| r/Morrowind | 6, no merchandise | Ko-fi is a tip, not merchandise, but it stays out of the post; mention it only if someone asks. |
| r/OpenMW | 6, no blatant advertising of any kind | The main risk. Ask the moderators first (below; rule 9 says their decision stands). The post leads with what OpenMW players can check, says it is open source with links, and has no Ko-fi, no "please share", no call to upvote. Answer comments. |
| r/OpenMW | 4, do not impersonate anyone | Says it is a fan project, not by the OpenMW team: the pipeline repository is named `openmw-decompiler`, which could read as official. |
| r/OpenMW | 8, know the latest release | OpenMW 0.51.0 (19 June 2026) is the latest release, so "OpenMW 0.51" is current. If a newer version is out when you post, reword or check the formulas first. |
| r/OpenMW | 3, no NSFW, including your nick | Nothing to change. |
| r/TamrielRebuilt | none | Still credits the TR team and says the tool is unofficial. |
| OpenMW Discord | The same rules as r/OpenMW, including 6 (no blatant advertising) and 9 (staff decisions stand; raise concerns privately with that staff member) | Ask one staff member first, privately, with the r/OpenMW message; post only where they say. |
| Tamriel Rebuilt Discord | 2, no advertisements; a development-focused server; posts with unauthorised links are deleted with a short timeout, and mass DMs count as spam | Do not post the link unless a moderator authorises it. Ask one moderator first. r/TamrielRebuilt reaches TR players either way. |
| Morrowind Modding Community | No spam, stay on topic; moderators have wide discretion | The safest server: nothing bans sharing a tool. Post once, in the channel whose topic fits tools or projects. |
| Morrowind Discord ("Morrowserver") | Links and images need a House Role; self-made work is encouraged in #modding/#morrowind; media channels have strict AI rules | Get a House Role in #house-roles first. Asked in #offtopic (29 Sept) whether #modding or #morrowind is the best channel for tool releases. Never DM members about the site. |

The messages to the moderators, and when to send them, are under
[Messages to send](#messages-to-send).

## r/Morrowind

**Title:** I made Silt Strider, a free Morrowind build planner, level-up planner and travel router that reads the game's own data (Tamriel Rebuilt Poison Song too)

> Hi r/Morrowind,
>
> I've been building **[siltstrider.tools](https://siltstrider.tools)**, a set of companion tools for Morrowind on OpenMW. Everything is built from the game's own plugin files rather than typed-in wiki tables.
>
> - **Character Builder** with a Gear Advisor: early armour, weapons and jewelry a level 1 character can actually reach, where to get them and from whom, with theft and locked doors flagged. Rings and amulets are ranked for your build, so a mage is shown Mentor's Ring.
> - **Level Simulator**: plans each level for ×5 attribute multipliers, tells you which miscellaneous skills to train and roughly what the training costs, and tracks non-retroactive Health.
> - **Travel planner**: fewest legs, cheapest fare or fastest trip, using silt striders, boats, guild guides, Propylons, Intervention and walking, plus Tamriel Rebuilt's river striders, pack guars, sky lamps and carriages.
> - **Alchemy, Enchanting and Spellmaking** calculators, a **Faction Journal**, and a **Challenge Run** generator with shareable seeds.
> - **Drop in an OpenMW save** (`.omwsave`) and your character, gear, level and quests fill every tool. The file is read in your browser; nothing is uploaded unless you choose to save it to the optional Cloud Vault.
>
> It covers vanilla (with Tribunal and Bloodmoon), Tamriel Rebuilt's Poison Song release (26.08) with Project Tamriel's Skyrim and Cyrodiil, and ARCE. It's free and open source, with no ads, and sets no cookies unless you sign in.
>
> Feedback and bug reports are very welcome; there's a Report a bug link at the bottom of every page.

## r/OpenMW

**Title:** Silt Strider: companion tools that read OpenMW saves in the browser, with formulas taken from OpenMW 0.51's source

> Hi all,
>
> **[siltstrider.tools](https://siltstrider.tools)** is a set of Morrowind tools built around OpenMW:
>
> - **Save import**: drop an `.omwsave` and the Builder, Level Simulator, Equipped Loadouts and Journal pick up your character, gear, level and quests. The save is parsed in your browser and not uploaded.
> - **Engine rules**: level-ups, alchemy, spell cost and cast chance, and enchanting follow OpenMW 0.51's source. Merchant stock, for example, follows how OpenMW's trade window finds a merchant's containers.
> - **Tested with** vanilla, Tamriel Rebuilt Poison Song (26.08) and TR + ARCE. Other mods are untested, and Morrowind.exe `.ess` saves aren't supported.
>
> It's free and open source, with no ads: the site is AGPL-3.0 (https://github.com/lowgraph/siltstrider.tools) and the data pipeline GPL-3.0, like OpenMW (https://github.com/lowgraph/openmw-decompiler). It's a fan project, not affiliated with the OpenMW team. Engine edge cases and bug reports are very welcome.

## r/TamrielRebuilt

**Title:** Silt Strider supports Tamriel Rebuilt Poison Song: mainland travel router, character builder and faction journal

> Greetings, outlanders.
>
> **[siltstrider.tools](https://siltstrider.tools)** supports Tamriel Rebuilt's Poison Song release (26.08), read straight from TR's plugins:
>
> - **Travel**: routes between Vvardenfell and the mainland with silt striders, river striders, pack guars, sky lamps, carriages, boats and guild guides, including Project Tamriel's Skyrim and Cyrodiil stops.
> - **Character Builder** with TR's races and, with ARCE, all races and classes; early gear from TR's merchants and dungeons.
> - **Faction Journal** with rank requirements for TR's factions.
>
> Free, no ads, works on mobile. It's an unofficial fan tool: all the credit for the mainland goes to the Tamriel Rebuilt and Project Tamriel teams. May your journey across the mainland be swift!

## Discord (short)

Post only where the table under Community rules allows it, once per server.

> **Silt Strider**: free, open-source Morrowind tools for OpenMW, covering vanilla, Tamriel Rebuilt Poison Song and ARCE: https://siltstrider.tools
> • Character Builder and Gear Advisor • Level Simulator (×5 multipliers) • Travel planner (Vvardenfell and the mainland) • Alchemy, Enchanting, Spellmaking • Drop in an `.omwsave` and every tool uses your character; the save stays in your browser.
> No ads, no cookies unless you sign in. A fan project, not affiliated with OpenMW or Tamriel Rebuilt.

## Show HN

**Title:** Show HN: Silt Strider – Morrowind tools built from the game files, with in-browser save parsing

**URL:** https://siltstrider.tools

> I built a set of tools for The Elder Scrolls III: Morrowind, played on the open-source OpenMW engine, and for the Tamriel Rebuilt mod's Poison Song release.
>
> Some details that may interest HN:
>
> 1. **Data pipeline.** A Python pipeline reads the game's binary ESM/ESP plugins into SQLite, derives catalogues (items, merchants, travel networks, where each item can be obtained), and publishes content-addressed JSON bundles the site loads statically.
> 2. **Engine rules from source.** Where the game's behaviour matters, it follows OpenMW 0.51's C++: level-up multipliers, alchemy, spell cost and cast chance, and details such as which containers a merchant sells from.
> 3. **Save parsing in the browser.** OpenMW `.omwsave` files are decoded client-side; nothing is uploaded unless the user signs in and saves to the optional Cloud Vault (Cloudflare D1).
> 4. **Hosting.** A static Next.js export served from Cloudflare's asset store; a Worker handles only the API.
>
> It's free with no ads, and sets no cookies unless you sign in; page visits are counted with Cloudflare's cookie-free analytics. It's open source: the site is AGPL-3.0 (https://github.com/lowgraph/siltstrider.tools) and the data pipeline GPL-3.0 (https://github.com/lowgraph/openmw-decompiler).
>
> I'd love feedback on the tools, the data pipeline, and anything the save parser gets wrong.

## X thread

1. Introducing Silt Strider (https://siltstrider.tools): free tools for Morrowind, OpenMW and Tamriel Rebuilt, built from the game's own data. *(Attach the social card or four screenshots.)*
2. Character Builder with a Gear Advisor · Level Simulator for ×5 multipliers · Travel planner across Vvardenfell and the mainland · Alchemy, Enchanting and Spellmaking · Challenge runs with shareable seeds.
3. Drop in an OpenMW save and every tool uses your character. It's read in your browser, not uploaded.
4. Vanilla, Tamriel Rebuilt Poison Song (with Project Tamriel's Skyrim and Cyrodiil) and ARCE. Free and open source (AGPL-3.0), no ads, no cookies unless you sign in.

## Creator outreach

Choose creators whose recent videos are about Morrowind or OpenMW; check each channel before writing, and write only if the compliment in the first line is true. Use a creator's stated business contact, never a Discord DM: the Morrowind Discord bans unsolicited DMs, self-promotion included.

> Subject: A free tool for your next Morrowind run: siltstrider.tools
>
> Hi [name],
>
> I enjoyed [a specific video]. I built a free web tool, Silt Strider (https://siltstrider.tools), that might be handy for you or your viewers:
>
> 1. **Challenge Runs**: generates a run from a seed, with rules you can link in a video description so viewers play the same one.
> 2. **Level Simulator**: plans ×5 attribute multipliers and the miscellaneous skills to train.
> 3. **Save import**: drop in an OpenMW save to see the character, gear and quests; it stays in the browser.
>
> No sponsorship, just sharing something made for the community.

## Replies to common questions

- **Does it read original Morrowind (.ess) saves?** No, only OpenMW saves (`.omwsave`). You can still build a character by hand for the original game.
- **Are you uploading my save?** No. Opening a save reads it in your browser. It's only sent to our service if you sign in and choose to save it to the Cloud Vault.
- **Does it work with my mods?** It's tested with vanilla, Tamriel Rebuilt and TR + ARCE. Other mods may add things it doesn't know; the Builder lists anything from your save it couldn't match.
- **Is it free?** Yes. An optional one-time tip on Ko-fi raises your Cloud Vault from 5 to 25 slots.
- **Was it made with AI?** Expect this: the posts link the repositories, and `AGENTS.md` says AI agents work on the code. Answer plainly, in your own words; for example: "Yes, much of the code and the look were made with AI coding assistants. The game data isn't generated: a pipeline reads it from the plugin files, and the rules follow OpenMW's source."

## Claims removed from the original plan

Do not reintroduce these without re-checking:

- "Zero-tracking", "zero tracking scripts", "cookie-free", "no server logging": Clerk sets cookies once you sign in, Cloudflare Web Analytics runs a script, and the API keeps error logs.
- "Open source" for anything but the code: the game and mod data, the Pelagiad font, and the name and logo are not under the AGPL or GPL.
- "ARCE (Aran Rebuilt / Content Ecosystem)": ARCE is "All Races and Classes Enabled".
- ".ess support is on our roadmap": not decided.
- "Absolute engine parity", "every formula verified" or "formulas verified against OpenMW's source", "exact alchemy", "inter-faction standing", "100% client-side" for the whole site: unverified or broader than the truth. Say the rules *follow* OpenMW 0.51's source.
- The alchemy-and-fatigue FAQ answer: not checked against the source.
- Subreddit member counts, "10x more goodwill", "40% weekend drop", and a specific creator list: unsourced.
