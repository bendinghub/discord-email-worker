# discord-email-worker

This worker forwards inbound email to Discord.

## Required configuration

Set your bot token as a Worker secret:

```bash
npx wrangler secret put DISCORD_BOT_TOKEN
```

Set routing IDs in `wrangler.toml` under `[vars]` (or in Cloudflare dashboard env vars):

- `DISCORD_GUILD_ID` to resolve recipient from mailbox local-part

This must be set, otherwise you will get:
`Missing Discord routing config: set DISCORD_GUILD_ID`

If you want the worker to resolve the recipient from the mailbox name, set `DISCORD_GUILD_ID` and make sure the mailbox local part matches the target member's Discord username or server nickname.

## Deploy

```bash
npx wrangler deploy
```