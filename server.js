const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const filePath = path.join(__dirname, 'products.json');

app.use(express.static(__dirname));
app.use(express.json());

app.post('/ajouter', (req, res) => {
    const { nom, url, seuil } = req.body;

    if (!nom || !url || !seuil) {
        return res.status(400).send('❌ Champs manquants');
    }

    let products = [];

    if (fs.existsSync(filePath)) {
        products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    products.push({
        nom,
        url,
        seuil: parseFloat(seuil)
    });

    fs.writeFileSync(filePath, JSON.stringify(products, null, 4), 'utf8');
    res.send('✅ Produit ajouté avec succès !');
});

app.listen(PORT, () => {
    console.log(`🚀 Interface accessible ici : http://localhost:${PORT}`);
});