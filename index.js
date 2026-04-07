export default {
  async email(message, env, ctx) {
    try {
      // 1. Access the secret from the 'env' object.
      const botToken = env.DISCORD_BOT_TOKEN;
      const guildId = env.DISCORD_GUILD_ID;
      const recipientId = env.DISCORD_RECIPIENT_ID;

      // Extract email data
      const headers = {};
      message.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
      
      const from = message.from?.address || "unknown";
      const subject = headers.subject || "(no subject)";
      const to = message.to?.[0]?.address || "unknown";
      const lookupName = to.split("@")[0];
      
      let body = "";
      try {
        body = await message.text();
      } catch (e) {
        try {
          const html = await message.html();
          body = html;
        } catch (e2) {
          body = "[Unable to extract email body]";
        }
      }
      
      const discordMessage = `📧 New Email Received\n\n**From:** ${from}\n**To:** ${to}\n**Subject:** ${subject}\n\n${body}`;
      
      let userId = recipientId;

      if (!userId) {
        if (!guildId) {
          console.error("Missing Discord routing config: set DISCORD_RECIPIENT_ID or DISCORD_GUILD_ID");
          return;
        }

        const searchResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(lookupName)}`, {
          method: "GET",
          headers: {
            "Authorization": `Bot ${botToken}`,
            "Content-Type": "application/json"
          }
        });

        if (!searchResponse.ok) {
          const error = await searchResponse.text();
          console.error("Discord search error:", error);
          return;
        }

        const searchData = await searchResponse.json();

        if (!Array.isArray(searchData) || searchData.length === 0) {
          console.error(`Discord member '${lookupName}' not found in guild ${guildId}`);
          return;
        }

        const exactMatch = searchData.find((member) => {
          const username = member.user?.username?.toLowerCase();
          const nick = member.nick?.toLowerCase();
          return username === lookupName.toLowerCase() || nick === lookupName.toLowerCase();
        });

        userId = exactMatch?.user?.id || searchData[0]?.user?.id;
      }

      if (!userId) {
        console.error(`Discord recipient '${lookupName}' could not be resolved`);
        return; // Emails don't have "success" returns, they just finish or throw
      }

      // 2. Create a DM channel and send the message.
      const channelResponse = await fetch("https://discord.com/api/v10/users/@me/channels", {
        method: "POST",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recipient_id: userId })
      });

      if (!channelResponse.ok) {
        const error = await channelResponse.text();
        console.error("Discord DM channel error:", error);
        return;
      }

      const channelData = await channelResponse.json();

      const response = await fetch(`https://discord.com/api/v10/channels/${channelData.id}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: discordMessage })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Discord API error:", error);
      }
      
    } catch (error) {
      console.error("Error processing email:", error);
    }
  }
};
