#!/bin/bash
cd serwer
# Sprawdzanie lokalnego adresu IP (dla macOS i Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    local_ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    # Linux
    local_ip=$(hostname -I | awk '{print $1}')
fi

if [ -z "$local_ip" ]; then
    echo "Nie udało się znaleźć lokalnego adresu IP."
    exit 1
fi

# Sprawdzanie dostępności docker-compose lub docker compose
if command -v docker-compose &> /dev/null; then
    compose_command="docker-compose"
elif docker compose version &> /dev/null; then
    compose_command="docker compose"
else
    echo "Nie znaleziono 'docker-compose' ani 'docker compose'. Zainstaluj jedno z nich i spróbuj ponownie."
    exit 1
fi

echo "Znaleziono narzędzie: $compose_command"

# Sprawdzanie czy plik docker-compose.yml istnieje
if [ ! -f "docker-compose.yml" ]; then
    echo "Plik docker-compose.yml nie został znaleziony w bieżącym katalogu."
    exit 1
fi

# Uruchamianie kontenera
echo "Uruchamianie kontenera z pliku docker-compose.yml..."
$compose_command up --build -d

if [ $? -eq 0 ]; then
    echo "Kontener został uruchomiony pomyślnie."
else
    echo "Wystąpił błąd podczas uruchamiania kontenera."
    exit 1
fi


echo "#################################################"
echo "Lokalny adres aplikacji: http://$local_ip:8880"
echo "#################################################"