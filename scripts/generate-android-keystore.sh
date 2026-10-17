#!/usr/bin/env bash
# =============================================================================
# Script de génération du Keystore de signature de Release Android (Google Play)
# =============================================================================
set -e

KEYSTORE_FILE="${1:-android/app/release.keystore}"
KEY_ALIAS="${2:-backgammon-release-key}"
VALIDITY_DAYS="${3:-10000}"

echo "================================================================="
echo " Génération du Keystore de signature Android pour Google Play"
echo " Cible : $KEYSTORE_FILE (Alias: $KEY_ALIAS)"
echo "================================================================="

if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️ Le fichier $KEYSTORE_FILE existe déjà. Abandon pour éviter tout écrasement."
    exit 1
fi

keytool -genkeypair -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY_DAYS" \
  -storetype JKS

echo "✅ Keystore généré avec succès dans : $KEYSTORE_FILE"
echo ""
echo "Pour convertir ce keystore en base64 pour vos GitHub Secrets :"
echo "  base64 -w 0 $KEYSTORE_FILE > keystore_base64.txt"
echo "Puis enregistrez le contenu dans le secret GitHub : ANDROID_KEYSTORE_BASE64"
