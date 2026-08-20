@echo off
title Servidor Dashboard Indicadores PNCM
echo ===================================================================
echo   INICIANDO DASHBOARD DE INDICADORES PNCM - SEGUIMIENTO NOMINAL
echo   Servidor HTTP y Base de Datos SQLite Activa
echo ===================================================================
echo.
echo Abriendo Dashboard en su navegador predeterminado...
timeout /t 1 /nobreak >nul
start http://localhost:8050
echo.
echo Presione Ctrl + C para detener el servidor cuando termine.
echo.
python server.py
pause
