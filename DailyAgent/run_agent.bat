@echo off
title Esecuzione DailyAgent
echo.
echo ===================================
echo   Avvio di DailyAgent in corso...
echo ===================================
echo.

REM Opzionale: Creazione e attivazione Virtual Environment
REM if not exist "venv" (
REM     echo Creazione ambiente virtuale...
REM     python -m venv venv
REM )
REM call venv\Scripts\activate
REM echo Installazione dipendenze...
REM pip install -r requirements.txt > nul

REM Esegue lo script Python
python daily_agent.py

echo.
echo ===================================
echo   Esecuzione completata.
echo ===================================
pause
