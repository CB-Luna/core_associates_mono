#!/usr/bin/env pwsh
# build-apk-prod.ps1
# Genera el APK arm64-v8a (prod - release) para la app Core Associates.
# arm64-v8a cubre smartphones Android desde ~2016 en adelante.
# API_URL apunta al servidor de produccion via Nginx (puerto 8580).

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$APP_DIR   = Join-Path $PSScriptRoot "core_associates_app"
$APK_REL   = "build/app/outputs/flutter-apk/app-arm64-v8a-prod-release.apk"
$APK_PATH  = Join-Path $APP_DIR $APK_REL
$KEYSTORE  = Join-Path (Join-Path $APP_DIR "android") "keystore.properties"

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Error "Flutter no encontrado en PATH."
}

if (-not (Test-Path $APP_DIR)) {
    Write-Error "No se encontro la carpeta de la app: $APP_DIR"
}

if (-not (Test-Path $KEYSTORE)) {
    Write-Host ""
    Write-Host "AVISO: No existe android/keystore.properties." -ForegroundColor Yellow
    Write-Host "       El APK se firmara con la clave de DEBUG (no apto para Play Store)." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Core Associates - APK arm64 prod release" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Set-Location $APP_DIR

Write-Host "`n[1/2] Obteniendo dependencias..." -ForegroundColor DarkCyan
flutter pub get

Write-Host "`n[2/2] Compilando APK (arm64-v8a - prod - release)..." -ForegroundColor DarkCyan
Write-Host "      API URL: https://core-asoc.cbluna-dev.com" -ForegroundColor DarkCyan

flutter build apk `
    --flavor prod `
    --release `
    --target-platform android-arm64 `
    --split-per-abi `
    "--dart-define=API_URL=https://core-asoc.cbluna-dev.com" `
    "--dart-define=ENV=prod"

if (Test-Path $APK_PATH) {
    $size = [math]::Round((Get-Item $APK_PATH).Length / 1MB, 2)
    Write-Host ""
    Write-Host "OK - APK generado exitosamente ($size MB)" -ForegroundColor Green
    Write-Host "   $APK_PATH" -ForegroundColor White
    $outDir = Split-Path $APK_PATH
    Write-Host ""
    Write-Host "Abriendo carpeta de salida..." -ForegroundColor DarkCyan
    Start-Process explorer.exe $outDir
} else {
    Write-Error "El APK no se encontro en la ruta esperada: $APK_PATH"
}