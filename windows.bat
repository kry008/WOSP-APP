@echo off
cd serwer

REM Funkcja do sprawdzania dostępności polecenia
:command_exists
where %1 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Sprawdzenie systemu operacyjnego
if "%OS%"=="Windows_NT" (
    echo Wykryto system Windows.
    set WINDOWS=true
) else (
    echo Wykryto system Unix/MacOS.
    set WINDOWS=false
)

REM Sprawdź czy jest dostępne `docker compose`
call :command_exists docker
if %ERRORLEVEL% EQU 0 (
    docker compose version >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Docker Compose dostępny jako 'docker compose'.
        set COMPOSE_COMMAND=docker compose
    ) else (
        call :command_exists docker-compose
        if %ERRORLEVEL% EQU 0 (
            echo Docker Compose dostępny jako 'docker-compose'.
            set COMPOSE_COMMAND=docker-compose
        ) else (
            echo Docker Compose nie jest zainstalowany. Zainstaluj go przed uruchomieniem tego skryptu.
            exit /b 1
        )
    )
) else (
    echo Docker Compose nie jest zainstalowany. Zainstaluj go przed uruchomieniem tego skryptu.
    exit /b 1
)

REM Uruchomienie docker compose up
if "%WINDOWS%"=="true" (
    %COMPOSE_COMMAND% up --build -d
) else (
    %COMPOSE_COMMAND% up --build -d
)

if %ERRORLEVEL% EQU 0 (
    echo Docker Compose został uruchomiony pomyślnie.
) else (
    echo Wystąpił błąd podczas uruchamiania Docker Compose.
    exit /b 1
)