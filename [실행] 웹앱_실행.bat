@echo off
chcp 65001 > nul
title [4단계] 둥글이 스튜디오 AI 방송국 실행기
cd /d "%~dp0"

set "PYTHON_EXE="
python --version > nul 2>&1
if not errorlevel 1 (
    set "PYTHON_EXE=python"
    goto :RUN
)
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
    goto :RUN
)

:RUN
if defined PYTHON_EXE (
    start /b "" "%PYTHON_EXE%" serve.py
    timeout /t 2 /nobreak > nul
    start "" "http://localhost:3000"
) else (
    start "" "index.html"
)
exit
