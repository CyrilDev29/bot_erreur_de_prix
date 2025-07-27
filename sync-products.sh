#!/bin/bash

echo "[$(date)] Début de la synchronisation..." >> logs/sync.log

# (ta commande actuelle ici)
echo "Synchronisation de products.json depuis le serveur distant..."
curl -o products.json https://exemple.com/products.json

echo "[$(date)] Synchronisation terminée." >> logs/sync.log