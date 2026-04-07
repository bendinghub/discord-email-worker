# discord-email-worker

This worker forwards inbound email to Discord.

## Required configuration

Set `DISCORD_BOT_TOKEN` in Wrangler or Cloudflare secrets.

To route mail to a single Discord account, set `DISCORD_RECIPIENT_ID`.

If you want the worker to resolve the recipient from the mailbox name, set `DISCORD_GUILD_ID` and make sure the mailbox local part matches the target member's Discord username or server nickname.