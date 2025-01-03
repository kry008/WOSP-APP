cd serwer
# Sprawdzenie lokalnego adresu IP
$LocalIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*").IPAddress
if (-not $LocalIP) {
    Write-Host "Nie znaleziono adresu IP dla domyślnego interfejsu sieciowego. Sprawdzanie zakończone niepowodzeniem." -ForegroundColor Red
    exit 1
}

# Sprawdzenie dostępności Docker Compose
$DockerComposeCommand = if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    "docker-compose"
} elseif (Get-Command "docker" -ErrorAction SilentlyContinue) {
    "docker compose"
} else {
    Write-Host "Nie znaleziono narzędzia Docker Compose ani 'docker compose'." -ForegroundColor Red
    exit 1
}

Write-Host "Znaleziono narzędzie Docker Compose: $DockerComposeCommand" -ForegroundColor Green

# Sprawdzenie istnienia pliku docker-compose.yml
$ComposeFile = "docker-compose.yml"
if (-not (Test-Path $ComposeFile)) {
    Write-Host "Nie znaleziono pliku $ComposeFile w bieżącym katalogu." -ForegroundColor Red
    exit 1
}

# Uruchamianie kontenera z docker-compose.yml
try {
    & $DockerComposeCommand up -d
    Write-Host "Kontenery zostały uruchomione pomyślnie." -ForegroundColor Green
} catch {
    Write-Host "Wystąpił błąd podczas uruchamiania kontenerów: $_" -ForegroundColor Red
    exit 1
}

Write-Host "#####################################################" -ForegroundColor Green
Write-Host "Lokalny adres aplikacji: http://$LocalIP:8880" -ForegroundColor Green
Write-Host "#####################################################" -ForegroundColor Green

Read-Host -Prompt "Naciśnij Enter, aby zakończyć..."