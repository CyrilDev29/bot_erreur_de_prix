require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);

    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
    if (channel) {
        await channel.send("👋 Hello depuis le script de test !");
        console.log("✅ Message envoyé dans le channel !");
    } else {
        console.error("❌ Channel Discord introuvable.");
    }

    client.destroy(); // Ferme le bot proprement
});

client.login(process.env.DISCORD_BOT_TOKEN);