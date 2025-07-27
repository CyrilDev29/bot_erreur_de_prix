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

// Sauvegarde de sécurité
const backupName = `products-backup-${new Date().toISOString().split('T')[0]}.json`;
fs.writeFileSync(path.join(EXPORT_FOLDER, backupName), JSON.stringify(products, null, 2));
console.log(`📝 Fichier exports/${backupName} sauvegardé.`);

// Pause
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Vérification d’un produit
async function checkPrice(product) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'] // ✅ Ajouté pour éviter les erreurs sur serveur root
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

        if (currentPrice === null) {
            console.warn(`⚠️ Prix introuvable pour ${product.nom} (${product.url})`);
            await browser.close();
            return;
        }

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

// Lancement
client.once('ready', async () => {
    console.log("✅ Bot prêt. Vérifications en cours...");
    for (let product of products) {
        await checkPrice(product);
        await delay(5000);
    }
});

// Connexion
client.login(DISCORD_TOKEN);