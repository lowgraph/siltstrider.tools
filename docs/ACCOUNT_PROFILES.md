# Account profiles

Open `#account` or select the icon at the top right. Profiles are site display
identities; Clerk continues to manage sign-in. No Clerk profile photos are used.

`GET /api/account` and `PUT /api/account` require a Clerk bearer session. The
server derives the owner from that session. PUT accepts `username` (3–24 ASCII
letters, digits or underscores) and `iconId` (integer 0–5). Usernames are unique
without regard to case. A conflict returns 409. Bodies are capped at 1 KB.

Stable icon IDs: 0 Moon and Star, 1 Silt Strider (the existing site mark),
2 Red Mountain, 3 Mushroom Tower, 4 Dwemer Cog, 5 Netch. Append future IDs;
never reorder them. Extend the SQL constraint when adding choices.

One D1 row per Clerk account; no image storage. The browser fetches the profile
once per account session and shares it with the header. Account changes clear
cached state and discard stale responses.

Before deploying this feature, apply the additive migration:

```powershell
npx wrangler d1 migrations apply siltstrider-db --remote
npm run build:cloudflare
npx wrangler deploy --keep-vars
```

Migration 0003 creates `account_profiles`; it does not modify cloud saves.

Migration `0007_account_settings.sql` (ACC-1) creates a separate settings table
without requiring a chosen username or changing profiles/saves. See
[account settings](ACCOUNT_SETTINGS.md) for the contract and local verification.
The settings API and page are ACC-2 and are not built.
