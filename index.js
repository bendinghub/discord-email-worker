export default {
  async email(message, env, ctx) {
    try {
      // 1. Access the secret from the 'env' object
      // Make sure the name 'DISCORD_BOT_TOKEN' matches exactly what you 
      // set in the Cloudflare Dashboard or via Wrangler.
      const botToken = env.DISCORD_BOT_TOKEN;

      // Extract email data
      const headers = {};
      message.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
      
      const from = message.from?.address || "unknown";
      const subject = headers.subject || "(no subject)";
      const to = message.to?.[0]?.address || "unknown";
      
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
      
      const discordUsername = from.split('@')[0];
      
      const discordMessage = `📧 New Email Received\n\n**From:** ${from}\n**To:** ${to}\n**Subject:** ${subject}\n\n${body}`;
      
      // 2. Use the token in the search request
      const searchResponse = await fetch("https://discord.com/api/v10/users/@me/search?q=" + encodeURIComponent(discordUsername), {
        method: "GET",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!searchResponse.ok) {
        const error = await searchResponse.text();
        console.error("Discord search error:", error);
        return; // Emails don't have "success" returns, they just finish or throw
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.members || searchData.members.length === 0) {
        console.error(`Discord user '${discordUsername}' not found`);
        return;
      }
      
      const userId = searchData.members[0].user.id;
      
      // 3. Use the token in the message request
      const response = await fetch("https://discord.com/api/v10/users/@me/messages", {
        method: "POST",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient_id: userId,
          content: discordMessage
        })
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
