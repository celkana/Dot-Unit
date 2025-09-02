@echo off
REM バッチファイルがある場所に移動
cd /d %~dp0..

REM サーバーを起動（8080ポート）
start cmd /k "npx http-server -p 8080"

REM 少し待ってからブラウザで自動オープン
timeout /t 2 >nul
start http://127.0.0.1:8080/
