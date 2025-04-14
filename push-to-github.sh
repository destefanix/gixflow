#!/bin/bash

echo "📦 Controllo lo stato di Git..."

git status

echo ""
echo "➕ Aggiungo tutti i file modificati..."
git add .

echo ""
echo "📝 Committando con messaggio automatico..."
git commit -m "💾 Aggiornamento automatico dal server $(date '+%Y-%m-%d %H:%M:%S')" || echo "⚠️ Nessuna modifica da committare"

echo ""
echo "🚀 Push in corso verso GitHub..."
git push origin main || git push origin master

echo ""
echo "✅ Push completato!"
