# Exécute les tests d'intégration backend contre le vrai binaire gnubg dans Docker (PowerShell)
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Vérification présence Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker n'a pas été trouvé dans le PATH. Veuillez installer ou démarrer Docker Desktop."
    exit 1
}

Write-Host "=== [1/2] Construction de l'image Docker de test avec gnubg ===" -ForegroundColor Cyan
docker build -t backgammon-engine:test .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec du build Docker."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== [2/2] Exécution des tests d'intégration avec le vrai binaire gnubg ===" -ForegroundColor Cyan
docker run --rm backgammon-engine:test pytest -v tests/test_integration_gnubg.py $args
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Tous les tests d'intégration contre gnubg ont réussi dans le conteneur Docker !" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Les tests d'intégration ont échoué (code sortie: $exitCode)." -ForegroundColor Red
}

exit $exitCode
