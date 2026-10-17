#!/usr/bin/env bash
# Exécute les tests d'intégration backend contre le vrai binaire gnubg dans Docker
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=== [1/2] Construction de l'image Docker de test avec gnubg ==="
docker build -t backgammon-engine:test .

echo ""
echo "=== [2/2] Exécution des tests d'intégration avec le vrai binaire gnubg ==="
docker run --rm backgammon-engine:test pytest -v tests/test_integration_gnubg.py "$@"

echo ""
echo "✅ Tous les tests d'intégration contre gnubg ont réussi dans le conteneur Docker !"
