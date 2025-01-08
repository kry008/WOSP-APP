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

## Sprzęt na którym został program sprawdzony
| Model | System operacyjny | RAM | Procesor | Działa? |
| --- | --- | --- | --- | --- |
| Raspberry Pi 4B | Ubuntu 20.04 | 4 GB | 4x 1.5 GHz | Tak |
| Raspberry Pi 02w* | RaspberryPi OS Lite | 0.5 GB | 4x 1.2 GHz | Tak |
| MacBook M1 | MacOS | 16 GB | 8x 3.2 GHz | Tak |
| Laptop z 2015 DELL | Windows 10 | 8 GB | i7-7Uth 2x 2.0 GHz | Tak |
| Laptop z 2015 DELL | Ubuntu 24.04 | 8 GB | i7-7Uth 2x 2.0 GHz | Tak |

* najtańsza możliwa wersja dedykowana dla programu

## Instalacja
1. Zainstalować Docker desktop zgodnie z [Wymaganiami](#wymagania)
1. Pobrać kod z https://git.kry008.xyz/kry008/WOSP-APP/releases lub https://github.com/kry008/WOSP-APP/releases
1. Utworzyć folder i wypakować pliki do niego
1. Wejść w folder `serwer` (z rozpakowanej paczki)
1. Skopiować plik `example.env` i nazwać go `.env`
1. Uzupełnić pola `MYSQL_ROOT_PASSWORD` oraz `MYSQL_PASSWORD` w pliku `.env`
1. Skopiować plik `example.prod.env` i nazwać go `prod.env`
1. Zmienić oznaczone linie na własne dane
1. Uruchomić skrypt odpowiednio dla systemu operacyjnego:
    - Windows: `windows.cmd`
    - MacOS lub Linux: `macOs-i-Linux.sh`


## Jak znaleźć adres IP
- Linux i MacOS: skrypt na końcu pokaże adres IP wraz z adresem url aby dostać się do aplikacji z sieci lokalnej
- Windows:
    1. Wejść w ustawienia systemu
    2. Wejść w sieć i internet
    3. Na górze kliknąć właściwości
    4. Przewinąć w dół i znaleźć adres IPv4
    5. Adres do łącznia się z aplikacją to `http://ADRESIP:8880`

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

## Podoba się program?
Wesprzyj mnie na [Patronite](https://patronite.pl/kry008) lub [Ko-fi](https://ko-fi.com/kry008)

## Postanowienia licencyjne
[https://git.kry008.xyz/kry008/WOSP-APP/src/branch/main/Licence.md](https://git.kry008.xyz/kry008/WOSP-APP/src/branch/main/Licence.md)