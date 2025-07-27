# 🤖 Bot Erreur de Prix Amazon

Ce projet est un **bot personnel** développé pour détecter automatiquement les **baisses de prix importantes** (50 % ou plus) sur des produits Amazon.  
Lorsqu'une baisse significative est détectée, une **alerte est envoyée sur un salon Discord** via un webhook.

---

## ⚙️ Fonctionnalités

- 📉 Détection automatique des erreurs de prix (–50 % ou plus)
- 💬 Notification directe sur Discord avec image + lien + résumé
- 📁 Fichiers `products.json`, `products-valid.json`, `products-verifies.json`
- 🔄 Scraping automatique des produits best-sellers d’Amazon
- 🔒 Sécurité : le fichier `.env` protège les tokens Discord

---

## 🧪 Technologies utilisées

- Node.js + Puppeteer
- Discord.js
- dotenv
- JSON local pour le suivi

---

## 🔧 Lancer le bot

### 1. Cloner le dépôt

git clone https://github.com/ton-pseudo/bot_erreur_de_prix.git
cd bot_erreur_de_prix

### 2. Installer les dépendances
npm install

### 3. Créer un fichier .env
DISCORD_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_CHANNEL_ID=xxxxxxxxxxxx
CHECK_INTERVAL_MS=1800000

### 4. Lancer le bot
node index.js

🚧 Statut du projet
✅ Projet en cours de test – fonctionne localement avec succès
📦 Poussé sur GitHub pour apprentissage Git + pratique Node.js

🙋‍♂️ Auteur
Projet perso de CyrilDev29
En formation développeur Web chez ENI École Informatique
