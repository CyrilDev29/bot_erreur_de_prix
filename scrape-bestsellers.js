const puppeteer = require('puppeteer');
const fs = require('fs');

const PRODUCT_FILE = './products.json';
const BASE_URL = 'https://www.amazon.fr';

const categories = [
    'https://www.amazon.fr/gp/bestsellers/automotive',
    'https://www.amazon.fr/gp/bestsellers/electronics',
    'https://www.amazon.fr/gp/bestsellers/toys',
    'https://www.amazon.fr/gp/bestsellers/kitchen',
    'https://www.amazon.fr/gp/bestsellers/office-product',
    'https://www.amazon.fr/gp/bestsellers/diy',
    'https://www.amazon.fr/gp/bestsellers/tools',
    'https://www.amazon.fr/gp/bestsellers/videogames'
];

async function extractPrice(page) {
    try {
        const priceText = await page.$eval('.a-price .a-offscreen', el => el.innerText);
        return parseFloat(priceText.replace(',', '.').replace('€', '').trim());
    } catch {
        return null;
    }
}

async function scrapeBestsellers() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const newProducts = [];

    let existing = [];
    if (fs.existsSync(PRODUCT_FILE)) {
        existing = JSON.parse(fs.readFileSync(PRODUCT_FILE));
    }

    for (const categoryUrl of categories) {
        try {
            await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const productUrls = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a[href*="/dp/"]'));
                const urls = anchors.map(a => a.href.split('?')[0]);
                return [...new Set(urls)].filter(url => url.includes('/dp/'));
            });

            for (const url of productUrls.slice(0, 5)) {
                if (!existing.find(p => p.url === url) && !newProducts.find(p => p.url === url)) {
                    const productPage = await browser.newPage();
                    try {
                        await productPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        const prixHabituel = await extractPrice(productPage);

                        if (prixHabituel && prixHabituel > 0) {
                            newProducts.push({
                                nom: url.split('/dp/')[0].split('/').pop() || 'Produit Amazon',
                                url: url,
                                prixHabituel: prixHabituel,
                                seuil: parseFloat((prixHabituel * 0.5).toFixed(2))
                            });
                            console.log(`🆕 Produit ajouté : ${url}`);
                        } else {
                            console.warn(`❌ Prix non trouvé pour ${url}`);
                        }
                    } catch (err) {
                        console.error(`Erreur lors de l'extraction de ${url} :`, err.message);
                    } finally {
                        await productPage.close();
                    }
                }
            }
        } catch (err) {
            console.error(`Erreur sur ${categoryUrl} :`, err.message);
        }
    }

    if (newProducts.length > 0) {
        const updated = [...existing, ...newProducts];
        fs.writeFileSync(PRODUCT_FILE, JSON.stringify(updated, null, 2));
        console.log(`✅ ${newProducts.length} nouveaux produits ajoutés !`);
    } else {
        console.log('✅ 0 nouveaux produits ajoutés !');
    }

    await browser.close();
}

scrapeBestsellers();
setInterval(scrapeBestsellers, 10800000);
