@echo off
setlocal

cd serwer

:: Sprawdzenie dostępności docker-compose lub docker compose
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Znaleziono docker-compose.
    set DOCKER_CMD=docker-compose
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Znaleziono docker compose.
        set DOCKER_CMD=docker compose
    ) else (
        echo Nie znaleziono docker-compose ani docker compose.
        exit /b 1
        pause
    )
)

:: Uruchomienie kontenera
%DOCKER_CMD% up -d
if %errorlevel% equ 0 (
    echo Kontener zostal pomyslnie uruchomiony.
) else (
    echo Wystapil blad podczas uruchamiania kontenera.
    pause
    exit /b 1
)

pause