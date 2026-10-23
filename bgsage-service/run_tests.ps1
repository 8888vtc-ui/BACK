# Lance les tests pytest du microservice bgsage.
# Usage : .\run_tests.ps1
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

python -m pytest tests/ -v
