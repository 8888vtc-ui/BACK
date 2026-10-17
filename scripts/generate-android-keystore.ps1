# =============================================================================
# Script PowerShell de génération du Keystore Android (Google Play Release)
# =============================================================================
param(
    [string]$KeystorePath = "android/app/release.keystore",
    [string]$KeyAlias = "backgammon-release-key",
    [int]$ValidityDays = 10000
)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Génération du Keystore de signature Android pour Google Play" -ForegroundColor Cyan
Write-Host " Cible : $KeystorePath (Alias: $KeyAlias)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

if (Test-Path $KeystorePath) {
    Write-Warning "Le fichier $KeystorePath existe déjà. Opération annulée pour préserver la clef."
    exit 1
}

keytool -genkeypair -v `
  -keystore $KeystorePath `
  -alias $KeyAlias `
  -keyalg RSA `
  -keysize 2048 `
  -validity $ValidityDays `
  -storetype JKS

Write-Host "✅ Keystore généré avec succès dans : $KeystorePath" -ForegroundColor Green
Write-Host ""
Write-Host "Pour encoder ce fichier en base64 pour GitHub Actions :" -ForegroundColor Yellow
Write-Host '  [Convert]::ToBase64String([IO.File]::ReadAllBytes("' + $KeystorePath + '")) | Out-File -Encoding utf8 keystore_base64.txt' -ForegroundColor Gray
Write-Host "Copiez ensuite cette valeur dans le secret GitHub : ANDROID_KEYSTORE_BASE64" -ForegroundColor Yellow
