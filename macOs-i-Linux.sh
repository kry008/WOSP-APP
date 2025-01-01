#!/bin/bash
cd serwer
# Funkcja do sprawdzania dostępności polecenia
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Funkcja do uruchamiania polecenia na różnych systemach
run_command() {
    if [ "$OS" = "Windows_NT" ]; then
        cmd.exe /C "$1"
    else
        eval "$1"
    fi
}

# Sprawdzenie systemu operacyjnego
if [ "$OS" = "Windows_NT" ]; then
    echo "Wykryto system Windows."
    WINDOWS=true
else
    echo "Wykryto system Unix/MacOS."
    WINDOWS=false
fi

# Sprawdź czy jest dostępne `docker compose`
if command_exists "docker" && docker compose version >/dev/null 2>&1; then
    echo "Docker Compose dostępny jako 'docker compose'."
    COMPOSE_COMMAND="docker compose"

# Sprawdź czy jest dostępne `docker-compose`
elif command_exists "docker-compose"; then
    echo "Docker Compose dostępny jako 'docker-compose'."
    COMPOSE_COMMAND="docker-compose"

# Jeśli brak obu, wyświetl komunikat i zakończ
else
    echo "Docker Compose nie jest zainstalowany. Zainstaluj go przed uruchomieniem tego skryptu."
    exit 1
fi

# Uruchomienie docker compose up
if [ "$WINDOWS" = true ]; then
    run_command "$COMPOSE_COMMAND up --build -d"
else
    $COMPOSE_COMMAND up --build -d
fi

if [ $? -eq 0 ]; then
    echo "Docker Compose został uruchomiony pomyślnie."
else
    echo "Wystąpił błąd podczas uruchamiania Docker Compose."
    exit 1
fi
