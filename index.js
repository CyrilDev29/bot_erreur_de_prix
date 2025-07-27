require('dotenv').config();
const puppeteer = require('puppeteer');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Constantes
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_MS) || 2700000;
const products = JSON.parse(fs.readFileSync('products.json', 'utf-8'));
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Dossier exports
const EXPORT_FOLDER = path.join(__dirname, 'exports');
if (!fs.existsSync(EXPORT_FOLDER)) fs.mkdirSync(EXPORT_FOLDER);

// Backup
const backupName = `products-backup-${new Date().toISOString().split('T')[0]}.json`;
fs.writeFileSync(path.join(EXPORT_FOLDER, backupName), JSON.stringify(products, null, 2));
console.log(`📝 Fichier exports/${backupName} sauvegardé.`);

// Fonction pause
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction principale
async function checkPrice(product) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser', // 🔧 ← forcer le chemin système de Chromium
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36'
    );

    try {
        await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const currentPrice = await page.evaluate(() => {
            const selectors = [
                '#priceblock_ourprice',
                '#priceblock_dealprice',
                '#priceblock_saleprice',
                '.a-price .a-offscreen'
            ];

            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el && el.textContent) {
                    const txt = el.textContent.replace(/[^\d,.-]/g, '').replace(',', '.');
                    const prix = parseFloat(txt);
                    if (!isNaN(prix)) return prix;
                }
            }

            return null;
        });

        const prixHabituel = product.prixHabituel || currentPrice;
        const seuil = product.seuil || prixHabituel * 0.5;

        const message = `🔍 ${product.nom}\n💰 Prix actuel : ${currentPrice.toFixed(2)}€\n💸 Prix habituel : ${prixHabituel.toFixed(2)}€\n📉 Seuil d'erreur : ${seuil.toFixed(2)}€`;

        if (currentPrice <= prixHabituel * 0.5) {
            const channel = client.channels.cache.get(DISCORD_CHANNEL_ID);
            if (channel) await channel.send(`🚨 Erreur de prix détectée !\n${message}\n🔗 ${product.url}`);
            console.log(`✅ Alerte envoyée pour ${product.nom}`);
        } else {
            console.log(`➖ ${product.nom} : pas d'erreur (${currentPrice}€ > ${prixHabituel * 0.5}€)`);
        }

    } catch (err) {
        console.error(`❌ Erreur pour ${product.nom} :`, err.message);
    } finally {
        await browser.close();
    }
}

// Lancer boucle de vérification
client.once('ready', async () => {
    console.log("✅ Bot prêt. Vérifications en cours...");
    for (let product of products) {
        await checkPrice(product);
        await delay(5000); // Pause 5s entre chaque produit
    }
});

// Connexion
client.login(DISCORD_TOKEN);