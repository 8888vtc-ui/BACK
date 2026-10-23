# Build script for the WildBG backgammon engine (Rust -> WASM, MIT/Apache-2.0).
#
# Clones the wildbg repository, checks out the strong neural nets (branch `nets`),
# injects the local `wildbg-cabi` crate (C ABI, no wasm-bindgen), compiles it to
# WebAssembly, and copies the resulting binary to `public/engine/wildbg.wasm`.
#
# Usage (PowerShell):
#   powershell -ExecutionPolicy Bypass -File scripts/build-wildbg.ps1
#
# Prerequisites:
#   - Rust toolchain with target `wasm32-unknown-unknown` (rustup target add wasm32-unknown-unknown)
#   - git

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/carsten-wenderdel/wildbg.git"
$TmpDir = Join-Path $env:TEMP "wildbg-build"
$ProjectRoot = (Get-Location).Path
$CabiSrc = Join-Path $ProjectRoot "wildbg-cabi"
$OutWasm = Join-Path $ProjectRoot "public/engine/wildbg.wasm"

Write-Host "[1/5] Cloning wildbg..." -ForegroundColor Cyan
if (Test-Path $TmpDir) { Remove-Item -Recurse -Force $TmpDir }
git clone --depth 1 $RepoUrl $TmpDir | Out-Null

Write-Host "[2/5] Checking out strong neural nets (branch 'nets')..." -ForegroundColor Cyan
Push-Location $TmpDir
git fetch origin nets | Out-Null
# Checkout the full 'nets' branch: its `engine` crate uses the 202-input TD-Gammon
# encoding that matches the strong neural nets (contact.onnx + race.onnx).
git checkout -b nets FETCH_HEAD | Out-Null

Write-Host "[3/5] Injecting local wildbg-cabi crate..." -ForegroundColor Cyan
Copy-Item -Recurse -Force $CabiSrc "crates/wildbg-cabi"

Write-Host "[4/5] Compiling wildbg-cabi to WASM..." -ForegroundColor Cyan
cargo build --release --target wasm32-unknown-unknown -p wildbg-cabi

Write-Host "[5/5] Copying WASM to public/engine/wildbg.wasm..." -ForegroundColor Cyan
Copy-Item "target/wasm32-unknown-unknown/release/wildbg_cabi.wasm" $OutWasm -Force
Pop-Location

$size = [math]::Round((Get-Item $OutWasm).Length / 1MB, 2)
Write-Host "Done. wildbg.wasm = $size MB" -ForegroundColor Green
