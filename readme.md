Domyślne dane dostępowe:

```
Login: szef 
Hasło: szef 
```

Domyślnie działa na ADRESIP:8880

## Jeżeli chcesz korzystać za darmo, w stopka musi pozostać niezmieniona, a także widoczna na każdej stronie z wyjątkiem stron druku list

# WOŚP APP by KRY008
Pomocnik dla sztabu przy rozliczeniach wolontariuszy

## Wymagania
- Minimum 8 GB RAM (aplikacja zużywa sama w sobie mało, ale ze względu na obecne systemy i dockera, aby chodziło wszystko płynnie)
- Docker desktop (wybrać Docker Personal na stronie https://www.docker.com/products/docker-desktop i założyć darmowe konto)
- Instalując na **Windows** zaznaczyć opcję "Use the WSL 2 instead of Hyper-V" w oknie instalatora.

## Instalacja
Uruchomić skrypt odpowiednio dla systemu operacyjnego:
- Windows: `windows.cmd`
- MacOS lub Linux: `macOs-i-Linux.sh`

## Znane problemy Windows
1. Zamykająca się od razu konsola
Jeżeli skryp od razu zamyka się, trzeba uruchomić powershell (menu start i zacząć wpisywać powershell) jako administrator i wpisać komendę:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
2. Inne urządzenia w sieci lokalnej nie mogą się połączyć
W takim przypadku trzeba wyłączyć lub zezwolić innym urządzeniom na łączenie się przez zaporę systemową na Windowsie lub w systemia antywirusowym.
Przykładowo Eset: 
- Otwórz program ESET Security
- Kliknij na Narzędzia
- Inspekcja sieci
- Jeżeli wyjdzie niezaufana sieć zmienić na "Zmień na typ sieci zaufaną"
- Kliknąć na urządzenie, które ma być zaufane
- W regułach kliknąć "Zezwól/Odblokuj" przy "Docker for Windows" lub "WSL"