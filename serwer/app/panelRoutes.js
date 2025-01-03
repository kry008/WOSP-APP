const express = require('express');
const panelRouter = express.Router();
const fs = require('fs');

require('dotenv').config();
//mysql
var mysql = require('mysql2');
var con = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASS,
    port : process.env.MYSQLPORT,
    database: process.env.MYSQLDB,
    insecureAuth : true
});
con.connect(function(err) {
    if (err) throw err;
    console.log('Connected!');
});
var cookie = require('cookie');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
const fileUpload = require('express-fileupload');

app.use(fileUpload({
    useTempFiles: true, // Użycie tymczasowych plików
    tempFileDir: '/tmp/', // Ścieżka do katalogu tymczasowego
    limits: { fileSize: 10 * 1024 * 1024 } // Maksymalny rozmiar pliku: 10 MB
}));

//import functions from func.js
const {headerHtml, menuHtml, footerHtml, checkPesel, loger, telefon, sendToDiscord, sendEmail, makeid, checkSendEmail, baza, massEmail} = require('./func.js');
//function loger(fs, text, type = 'info')
panelRouter.use(function(req, res, next) {
    var cookies = cookie.parse(req.headers.cookie || '');
    var token = cookies.token;
    con.query('SELECT * FROM tokeny, login WHERE token = ? AND tokeny.userId = login.id AND aktywny = 1', [token], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            req.user = result[0];
            next();
        } else {
            res.redirect('/login');
            loger(fs, 'Nieudana próba dostępu do panelu administracyjnego przy użyciu tokenu: ' + token, 'warning');
        }
    });
});
panelRouter.get('/home', function(req, res) {
    var toReturn = headerHtml();
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Panel</h1>';
    toReturn += '<h2>Witaj ' + req.user.kto + '</h2>';
    toReturn += '<div class="kafelki3">';
    toReturn += '<a class="borderColorBlue" href="/panel/rozlicz">Rozlicz wolontariusza</a>';
    toReturn += '<a class="borderColorBlue" href="/panel/dodajWolontariusza">Dodaj wolontariusza</a>';
    toReturn += '<a class="borderColorBlue" href="/panel/listaWolontariuszy">Lista wolontariuszy</a>';
    toReturn += '<a class="borderColorBlue" href="/panel/rozliczenia">Lista rozliczonych wolontariuszy</a>';
    toReturn += '<a class="borderColorYellow" href="/panel/dodajOsobeLiczaca">Dodaj osobę liczącą</a>';
    toReturn += '<a class="borderColorYellow" href="/panel/osobyLiczace">Lista osób liczących</a>';
    toReturn += '<a class="borderColorOrange" href="/panel/druki">Drukuj listy</a>';
    toReturn += '<a class="borderColorGreen" href="/panel/statystyki">Statystyki</a>';
    toReturn += '<a class="borderColorRed" href="/panel/nowyAdmin">Dodaj dostęp do panelu</a>';
    toReturn += '<a class="borderColorRed" href="/panel/usunAdmin">Usuń dostęp do panelu</a>';
    toReturn += '<a class="borderColorRed" href="/panel/listaAdminow">Pokaż osoby z dostępem do panelu</a>';
    toReturn += '<a class="borderColorRed" href="/panel/uniewaznijTokeny">Unieważnij wszystkie tokeny</a>';
    toReturn += '<a class="borderColorBlack" href="/panel/import">Importuj z BSS Wolontariuszy</a>';
    toReturn += '<a class="borderColorBlack" href="/panel/sprawdzenieWysylki">Sprawdzenie wysyłki powiadomień</a>';
    //toReturn += '<a class="borderColorBlack" href="/panel/eksport">Wykonaj kopię zapasową</a>';
    toReturn += '<a class="borderColorPurple" href="/panel/haslo">Zmień hasło</a>';
    toReturn += '<a class="borderColorPurple" href="/logout">Wyloguj się</a>';
    toReturn += '</div>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);

});
panelRouter.get('/osobyLiczace', function(req, res) {
//pokaż w ładnej tabeli wszystkie osoby liczące, posortuj według nazwiska, na górze strony dodaj przycisk dodaj osobę liczącą
    var toReturn = headerHtml();
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Osoby liczące</h1>';
    toReturn += '<a href="/panel/dodajOsobeLiczaca">Dodaj osobę liczącą</a>';
    if (req.query.error == 1) {
        toReturn += '<p style="color: red;">Osoba o takich danych już istnieje</p>';
    }
    toReturn += '<table class="dane">';
    toReturn += '<tr>';
    toReturn += '<th>ID</th>';
    toReturn += '<th>Imię</th>';
    toReturn += '<th>Nazwisko</th>';
    toReturn += '<th>Pokaż kod</th>';
    toReturn += '</tr>';
    //pobierz osoby liczące
    con.query('SELECT * FROM liczacy WHERE aktywne = 1 ORDER BY nazwisko ASC', function(err, result) {
        if (err) throw err;
        result.forEach(function(row) {
            toReturn += '<tr>';
            toReturn += '<td>' + row.id + '</td>';
            toReturn += '<td>' + row.imie + '</td>';
            toReturn += '<td>' + row.nazwisko + '</td>';
            toReturn += '<td><a href="/panel/kod?id=' + row.id + '">Pokaż</a></td>';
            toReturn += '</tr>';
        });
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += footerHtml(1);
        res.send(toReturn);
        loger(fs, 'Wyświetlono listę osób liczących', 'info');
    });
});
panelRouter.get('/kod', function(req, res) {
    var id = req.query.id;
    //SELECT qr FROM liczacy WHERE id = ?
    con.query('SELECT qr FROM liczacy WHERE id = ?', [id], function(err, result) {
        if (err) throw err;
        if (result.length == 1) {
            var toReturn = headerHtml();
            toReturn += menuHtml(1);
            toReturn += '  <script src="https://cdn.jsdelivr.net/npm/qr-creator/dist/qr-creator.min.js"></script>';
            toReturn += '<div class="content">';
            toReturn += '<h1>Kod osoby liczącej</h1>';
            toReturn += '<div id="qr"></div>';
            toReturn += '<br>';
            toReturn += 'Kod: ' + result[0].qr;
            toReturn += '<script>';
            toReturn += 'var qr = new QrCreator.render({';
            toReturn += 'text: "' + result[0].qr + '",';
            toReturn += 'radius: 0.2,';
            toReturn += '}, document.getElementById("qr"));';
            toReturn += '</script>';
            toReturn += '</div>';
            toReturn += footerHtml(1);
            res.send(toReturn);
            loger(fs, 'Wyświetlono kod osoby liczącej o id: ' + id, 'info');
        }
    });
});
panelRouter.get('/dodajOsobeLiczaca', function(req, res) {
    var toReturn = headerHtml();
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Dodaj osobę liczącą</h1>';
    toReturn += '<form action="/panel/dodajOsobeLiczaca" method="POST">';
    toReturn += '<input type="text" name="imie" placeholder="Imię">';
    toReturn += '<input type="text" name="nazwisko" placeholder="Nazwisko">';
    toReturn += '<input type="submit" value="Dodaj">';
    toReturn += '</form>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});
panelRouter.post('/dodajOsobeLiczaca', function(req, res) {
    //sprawdź czy istnieje taka osoba
    var imie = req.body.imie;
    var nazwisko = req.body.nazwisko;
    con.query('SELECT * FROM liczacy WHERE imie = ? AND nazwisko = ?', [imie, nazwisko], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            //istnieje
            res.redirect('/panel/osobyLiczace?error=1');
            loger(fs, 'Nieudana próba dodania osoby liczącej o imieniu: ' + imie + ' i nazwisku: ' + nazwisko, 'warning');
        } else {
            //nie istnieje
            var qr = makeid(24)
            con.query('INSERT INTO liczacy (imie, nazwisko, qr) VALUES (?, ?, ?)', [imie, nazwisko, qr], function(err, result) {
                if (err) throw err;
                res.redirect('/panel/osobyLiczace');
                loger(fs, 'Dodano osobę liczącą o imieniu: ' + imie + ' i nazwisku: ' + nazwisko + ' z kodem: ' + qr, 'info');
            });
        }
    });
});
panelRouter.get('/listaWolontariuszy', function(req, res) {
    //pokaż w ładnej tabeli wszystkich wolontariuszy, posortuj według nazwiska, na górze strony dodaj przycisk dodaj wolontariusza
    var toReturn = headerHtml();
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Lista wolontariuszy</h1>';
    toReturn += '<table class="dane szerokie">';
    toReturn += '<tr>';
    toReturn += '<th>Numer</th>';
    toReturn += '<th>Imię</th>';
    toReturn += '<th>Nazwisko</th>';
    toReturn += '<th>Discord</th>';
    toReturn += '<th>Email</th>';
    toReturn += '<th>Telefon</th>';
    if(req.user.id == 1)
        toReturn += '<th>PESEL</th>';
    toReturn += '<th>Terminal</th>';
    toReturn += '<th>Rodzic</th>';
    toReturn += '<th>Opcje</th>';
    toReturn += '</tr>';
    //pobierz osoby liczące
    con.query('SELECT * FROM wolontariusz WHERE aktywny = 1 ORDER BY numerIdentyfikatora ASC', function(err, result) {
        if (err) throw err;
        result.forEach(function(row) {
            //jeżeli zaznacz, to kolor wiersza na rgba(0, 255, 0, 0.5)
            toReturn += '<tr style="' + (row.zaznacz == 1 ? 'background-color: rgba(0, 255, 0, 0.5);' : '') + '">';
            toReturn += '<td>';
            if(row.puszkaWydana == 1)
                toReturn += '<span style="text-decoration: underline;">' + row.numerIdentyfikatora + '</span>';
            else
                toReturn += row.numerIdentyfikatora;
            toReturn += '</td>';
            toReturn += '<td>' + row.imie + '</td>';
            toReturn += '<td>' + row.nazwisko + '</td>';
            toReturn += '<td>' + row.discord + '</td>';
            toReturn += '<td>' + row.email + '</td>';
            toReturn += '<td>' + telefon(row.telefon, 1) + '</td>';
            if(req.user.id == 1)
                toReturn += '<td><span onclick="document.getElementById(\'pesel' + row.id + '\').style.display = \'block\'; this.style.display = \'none\';">' + '###########' + '</span><span id="pesel' + row.id + '" style="display: none;">' + row.pesel + '</span></td>';
            toReturn += '<td>' + (row.terminal == 1 ? 'Tak' : 'Nie') + '</td>';
            if(row.rodzic == "BRAK")
                toReturn += '<td> </td>';
            else
                toReturn += '<td style="color: red; font-weight: bold;">' + row.rodzic + '</td>';
            toReturn += '<td><a href="/panel/edytujWolontariusza?id=' + row.id + '">Edytuj</a></td>';
            toReturn += '</tr>';
        });
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += footerHtml(1);
        res.send(toReturn);
        loger(fs, 'Wyświetlono listę wolontariuszy ' + req.user.id, 'info');
    });
});
panelRouter.get('/edytujWolontariusza', function(req, res) {
    var toReturn = headerHtml();
    toReturn += menuHtml(1);
    //pobierz dane wolontariusza
    con.query('SELECT * FROM wolontariusz WHERE id = ?', [req.query.id], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            //istnieje
            toReturn += '<div class="content">';
            toReturn += '<h1>Edytuj wolontariusza</h1>';
            toReturn += '<form action="/panel/edytujWolontariusza" method="POST">';
            toReturn += '<input type="hidden" name="id" value="' + result[0].id + '">';
            toReturn += '<table>';
            toReturn += '<tr>';
            toReturn += '<td>Numer identyfikatora</td>';
            toReturn += '<td><input type="text" name="numerIdentyfikatora" value="' + result[0].numerIdentyfikatora + '" readonly></td>';
            toReturn += '</tr>';
            toReturn += '<tr><td>Imię</td><td><input type="text" name="imie" value="' + result[0].imie + '"></td></tr>';
            toReturn += '<tr><td>Nazwisko</td><td><input type="text" name="nazwisko" value="' + result[0].nazwisko + '"></td></tr>';
            toReturn += '<tr><td>Discord</td><td><input type="text" name="discord" value="' + result[0].discord + '"></td></tr>';
            toReturn += '<tr><td>Email</td><td><input type="text" name="email" value="' + result[0].email + '"></td></tr>';
            toReturn += '<tr><td>Telefon</td><td><input type="text" name="telefon" value="' + result[0].telefon + '"></td></tr>';
            toReturn += '<tr><td>PESEL</td><td><details><summary>PESEL</summary><input type="text" name="pesel" value="' + result[0].pesel + '"></details></td></tr>';
            toReturn += '<tr><td>Terminal</td><td><input type="checkbox" name="terminal" value="1"' + (result[0].terminal == 1 ? ' checked' : '') + '></td></tr>';
            toReturn += '<tr><td>Rodzic</td><td><input type="text" name="rodzic" value="' + result[0].rodzic + '"></td></tr>';
            toReturn += '<tr><td>Puszka wydana</td><td><input type="checkbox" name="puszka" value="1"' + (result[0].puszkaWydana == 1 ? ' checked' : '') + '></td></tr>';
            toReturn += '</table>';
            toReturn += '<input type="submit" value="Zapisz">';
            toReturn += '</form>';
            toReturn += '</div>';
            toReturn += footerHtml(1);
            res.send(toReturn);
        }
    });
});
panelRouter.post('/edytujWolontariusza', function(req, res) {
    var id = req.body.id;
    var imie = req.body.imie;
    var nazwisko = req.body.nazwisko;
    var discord = req.body.discord;
    var email = req.body.email;
    var telefon = req.body.telefon;
    var pesel = req.body.pesel;
    var terminal = req.body.terminal == 1 ? 1 : 0;
    var puszka = req.body.puszka == 1 ? 1 : 0;
    var rodzic = req.body.rodzic;
    //zapisz dane
    con.query('UPDATE wolontariusz SET imie = ?, nazwisko = ?, discord = ?, email = ?, telefon = ?, pesel = ?, terminal = ?, rodzic = ?, puszkaWydana = ? WHERE id = ?', [imie, nazwisko, discord, email, telefon, pesel, terminal, rodzic, puszka, id], function(err, result) {
        if (err) throw err;
        res.redirect('/panel/listaWolontariuszy');
        loger(fs, 'Edytowano wolontariusza o id: ' + id, 'info');
    });
});
panelRouter.get('/dodajWolontariusza', function(req, res) {
    var toReturn = headerHtml();
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Dodaj wolontariusza</h1>';
    toReturn += '<form action="/panel/dodajWolontariusza" method="POST">';
    toReturn += '<table>';
    toReturn += '<tr><td>Numer identyfikatora</td><td><input type="text" name="numerIdentyfikatora"></td></tr>';    
    toReturn += '<tr><td>Imię</td><td><input type="text" name="imie"></td></tr>';
    toReturn += '<tr><td>Nazwisko</td><td><input type="text" name="nazwisko"></td></tr>';
    toReturn += '<tr><td>Discord</td><td><input type="text" name="discord" value="BRAK"></td></tr>';
    toReturn += '<tr><td>Email</td><td><input type="text" name="email"></td></tr>';
    toReturn += '<tr><td>Telefon</td><td><input type="text" name="telefon" pattern="^(\+48)?[0-9]{9}$"></td></tr>';
    toReturn += '<tr><td>PESEL</td><td><input type="text" name="pesel" pattern="[0-9]{11}"></td></tr>';
    toReturn += '<tr><td>Terminal</td><td><input type="checkbox" name="terminal" value="0"></td></tr>';
    toReturn += '<tr><td>Rodzic</td><td><input type="text" name="rodzic"></td></tr>';
    toReturn += '<tr><td>Zaznacz na liście</td><td><input type="checkbox" name="zaznacz" value="0"></td></tr>';
    toReturn += '<tr><td>Puszka wydana</td><td><input type="checkbox" name="puszka" value="0"></td></tr>';
    toReturn += '</table>';
    toReturn += '<input type="submit" value="Dodaj">';
    toReturn += '</form>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});
panelRouter.post('/dodajWolontariusza', function(req, res) {
    //sprawdź czy istnieje taki wolontariusz
    var numerIdentyfikatora = req.body.numerIdentyfikatora;
    var imie = req.body.imie;
    var nazwisko = req.body.nazwisko;
    var discord = req.body.discord;
    var email = req.body.email;
    var telefon = req.body.telefon;
    var pesel = req.body.pesel;
    var terminal = req.body.terminal == 1 ? 1 : 0;
    var rodzic = req.body.rodzic;
    var zaznacz = req.body.zaznacz == 1 ? 1 : 0;
    var puszka = req.body.puszka == 1 ? 1 : 0;
    con.query('SELECT * FROM wolontariusz WHERE numerIdentyfikatora = ? OR pesel = ?', [numerIdentyfikatora, pesel], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            //istnieje
            res.redirect('/panel/listaWolontariuszy?error=1');
            loger(fs, 'Nieudana próba dodania wolontariusza o numerze identyfikatora: ' + numerIdentyfikatora + ' lub peselu: ' + pesel.substring(0, 3) + '########', 'warning');
        } else {
            //nie istnieje
            con.query('INSERT INTO wolontariusz (numerIdentyfikatora, imie, nazwisko, discord, email, telefon, pesel, terminal, rodzic, zaznacz, puszkaWydana) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [numerIdentyfikatora, imie, nazwisko, discord, email, telefon, pesel, terminal, rodzic, zaznacz, puszka], function(err, result) {
                if (err) throw err;
                res.redirect('/panel/listaWolontariuszy');
                loger(fs, 'Dodano wolontariusza o numerze identyfikatora: ' + numerIdentyfikatora + ' i peselu: ' + pesel.substring(0, 3) + '########', 'info');
            });
        }
    });
});
panelRouter.all('/druki', function(req, res) {
    var toReturn = headerHtml();
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<div class="kafelki">';
    toReturn += '<a href="/panel/listyObecnosci">Listy obecności wolontariuszy</a>';
    toReturn += '<a href="/panel/listyRzeczy">Odbiór puszek i&nbsp;innych rzeczy</a>';
    toReturn += '<a href="/panel/listyPrzyjsc">Lista przyjść</a>';
    toReturn += '</div>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});
panelRouter.all('/listyObecnosci', function(req, res) {
    //pobierz wszystkich wolontariuszy, w tabelce wypisz numer identyfikatora, imię, nazwisko, telefon, rodzic, pole do wpisania daty (puste), pole do wpisania podpisu (puste)
    var toReturn = headerHtml("Lista obecności na spotkaniu organizacyjnym");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<table class="dane szerokie">';
    toReturn += '<thead style="display: table-header-group;">';
    toReturn += '<tr>';
    toReturn += '<th>Numer</th>';
    toReturn += '<th>Imię</th>';
    toReturn += '<th>Nazwisko</th>';
    toReturn += '<th>Telefon</th>';
    toReturn += '<th>Rodzic</th>';
    toReturn += '<th>Data</th>';
    toReturn += '<th>Podpis</th>';
    toReturn += '</tr>';
    toReturn += '</thead>';
    //pobierz osoby liczące
    con.query('SELECT * FROM wolontariusz WHERE aktywny = 1 ORDER BY numerIdentyfikatora ASC', function(err, result) {
        if (err) throw err;
        result.forEach(function(row) {
            toReturn += '<tr>';
            toReturn += '<td>' + row.numerIdentyfikatora + '</td>';
            toReturn += '<td>' + row.imie + '</td>';
            toReturn += '<td>' + row.nazwisko + '</td>';
            toReturn += '<td>' + telefon(row.telefon, 0) + '</td>';
            if(row.rodzic == "BRAK")
                toReturn += '<td> </td>';
            else
                toReturn += '<td style="color: red; font-weight: bold;">' + row.rodzic + '</td>';
            toReturn += '<td style="width: 12%;"></td>';
            toReturn += '<td style="width: 25%;"></td>';
            toReturn += '</tr>';
        });
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += footerHtml(1);
        res.send(toReturn);
    });
});
panelRouter.all('/listyRzeczy', function(req, res) {
    //pobierz wszystkich wolontariuszy, w tabelce wypisz numer identyfikatora, imię, nazwisko, telefon, rodzic, pole do wpisania daty (puste), pole do wpisania podpisu (puste)
    var toReturn = headerHtml("Odbiór puszek i innych rzeczy");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<table class="dane szerokie">';
    toReturn += '<thead style="display: table-header-group;">';
    toReturn += '<tr>';
    toReturn += '<th>Numer</th>';
    toReturn += '<th>Imię</th>';
    toReturn += '<th>Nazwisko</th>';
    toReturn += '<th>Data</th>';
    toReturn += '<th>Odbieram nienaruszoną puszkę</th>';
    toReturn += '<th>Odbieram zestaw wolontariusza<br/>(w&nbsp;tym&nbsp;identyfikator)</th>';
    toReturn += '</tr>';
    toReturn += '</thead>';
    //pobierz osoby liczące
    con.query('SELECT * FROM wolontariusz WHERE aktywny = 1 ORDER BY numerIdentyfikatora ASC', function(err, result) {
        if (err) throw err;
        result.forEach(function(row) {
            toReturn += '<tr>';
            toReturn += '<td>' + row.numerIdentyfikatora + '</td>';
            toReturn += '<td>' + row.imie + '</td>';
            toReturn += '<td>' + row.nazwisko + '</td>';
            toReturn += '<td style="width: 12%;"></td>';
            toReturn += '<td style="width: 25%;"></td>';
            toReturn += '<td style="width: 25%;"></td>';
            toReturn += '</tr>';
        });
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += footerHtml(1);
        res.send(toReturn);
    });
});
panelRouter.all('/listyPrzyjsc', function(req, res) {
    var toReturn = headerHtml("Lista przed rozliczeniem");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<table class="dane szerokie">';
    toReturn += '<thead style="display: table-header-group;">';
    toReturn += '<tr>';
    toReturn += '<th>Numer</th>';
    toReturn += '<th>Imię</th>';
    toReturn += '<th>Nazwisko</th>';
    toReturn += '<th>PESEL</th>';
    toReturn += '<th>Godz</th>';
    toReturn += '<th>Sala</th>';
    toReturn += '<th>Zdaję nienaruszoną puszkę do rozliczenia</th>';
    toReturn += '<th>Weryfikacja</th>';
    toReturn += '</tr>';
    toReturn += '</thead>';
    //pobierz osoby liczące
    con.query('SELECT * FROM wolontariusz WHERE aktywny = 1 ORDER BY numerIdentyfikatora ASC', function(err, result) {
        if (err) throw err;
        result.forEach(function(row) {
            toReturn += '<tr>';
            toReturn += '<td>' + row.numerIdentyfikatora + '</td>';
            toReturn += '<td>' + row.imie + '</td>';
            toReturn += '<td>' + row.nazwisko + '</td>';
            //wyświetl tylko 3 lub 4 losowe pozycje cyfry PESEL, resztę zastąp #, 11 cyfr jest w PESELu
            var tab = [1,1,1,1,1,1,1,1,1,1,1];
            //wylosuj pozycję i zamień na 0
            var counter = 0;
            while (counter < 7) {
                var random = Math.floor(Math.random() * 11);
                if (tab[random] == 1) {
                    tab[random] = 0;
                    counter += 1;
                }
            }
            var peselToShow = '';
            for (var i = 0; i < 11; i++) {
                if (tab[i] == 1) {
                    if(i == 10)
                        peselToShow += row.pesel[i];
                    else
                        peselToShow += row.pesel[i] + '&nbsp;';
                } else {
                    if(i == 10)
                        peselToShow += '█';
                    else
                        peselToShow += '█&nbsp;';
                }
            }
            if(!checkPesel(row.pesel))
                toReturn += '<td class="stala" style="text-decoration: underline";>' + peselToShow + '</td>';
            else
                toReturn += '<td class="stala">' + peselToShow + '</td>';
            toReturn += '<td style="width: 6%;"></td>';
            toReturn += '<td style="width: 5%;"></td>';
            toReturn += '<td style="width: 27%;"><br/><br/></td>';
            toReturn += '<td style="width: 15%;"><br/><br/></td>';
            toReturn += '</tr>';
        });
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += footerHtml(1);
        res.send(toReturn);
        loger(fs, 'Wyświetlono listę przyjść z nemerami pesel', 'warning');
    });
});
panelRouter.all('/logout', function(req, res) {
    //sprawdź czy token istnieje i jest aktywny
    var cookies = cookie.parse(req.headers.cookie || '');
    var token = cookies.token;
    con.query('UPDATE tokeny SET aktywny = 0 WHERE token = ?', [token], function(err, result) {
        if (err) throw err;
        res.redirect('/login');
        loger(fs, 'Wylogowano użytkownika ' + req.user.kto, 'info');
    });
});
//rozlicz, pokaż w tabelce wszystkich wolontariuszy, którzy jeszcze są nie rozliczeni, posortuj według numeru identyfikatora, ostatnie pole dodaj rozliczenie
panelRouter.get('/rozlicz', function(req, res) {
    var toReturn = headerHtml("Lista wolontariuszy do rozliczenia");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Rozlicz</h1>';
    toReturn += '<table class="dane">';
    toReturn += '<tr>';
    toReturn += '<th>Numer</th>';
    toReturn += '<th>Imię</th>';
    toReturn += '<th>Nazwisko</th>';
    toReturn += '<th>Telefon</th>';
    toReturn += '<th>Terminal</th>';
    toReturn += '<th>Rodzic</th>';
    toReturn += '<th>Opcje</th>';
    toReturn += '</tr>';
    //pobierz osoby liczące
    con.query('SELECT * FROM wolontariusz WHERE aktywny = 1 AND id NOT IN (SELECT wolontariuszID FROM rozliczenie WHERE aktywne = 1) ORDER BY numerIdentyfikatora ASC', function(err, result) {
        if (err) throw err;
        result.forEach(function(row) {
            toReturn += '<tr>';
            toReturn += '<td>' + row.numerIdentyfikatora + '</td>';
            toReturn += '<td>' + row.imie + '</td>';
            toReturn += '<td>' + row.nazwisko + '</td>';
            toReturn += '<td>' + telefon(row.telefon, 1) + '</td>';
            toReturn += '<td>' + (row.terminal == 1 ? '<b>Tak</b>' : 'Nie') + '</td>';
            if(row.rodzic == "BRAK")
                toReturn += '<td> </td>';
            else
                toReturn += '<td style="color: red; font-weight: bold;">' + row.rodzic + '</td>';
            toReturn += '<td><a href="/panel/rozliczWolontariusza?id=' + row.id + '">Rozlicz</a></td>';
            toReturn += '</tr>';
        });
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += footerHtml(1);
        res.send(toReturn);
    });
});
panelRouter.get('/rozliczWolontariusza', function(req, res) {
    var idWolontariusza = req.query.id;
    //pobierz dane wolontariusza, wyświetl formularz rozliczenia
    var toReturn = headerHtml("Rozlicz wolontariusza");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Rozlicz wolontariusza</h1>';
    toReturn += '<form action="/panel/rozliczWolontariusza?id=' + idWolontariusza + '" method="POST">';
    con.query('SELECT * FROM wolontariusz WHERE id = ?', [idWolontariusza], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            toReturn += "<h2>" + result[0].imie + " " + result[0].nazwisko + "</h2>";
            toReturn += "<h3>ID: " + result[0].numerIdentyfikatora + "</h3>";
            toReturn += '<h2>Suma: <span id="suma2">0</span> zł</h2>';
            //pokaż formularz do wpisywania zebranej kwoaty i monet (sumę liczy program, użytkownik podaje ilość monet)
            toReturn += '<table class="dane">';
            toReturn += '<tr><td>Suma</td><td><input type="number" name="weryfikacjaSuma" step="0.01"></td></tr>';
            toReturn += '<tr>';
            toReturn += '<th>Waluta</th>';
            toReturn += '<th>Ilość</th>';
            toReturn += '</tr>';
            toReturn += '<tr><td>1 gr</td><td><input type="number" name="1gr" value="0"></td></tr>';
            toReturn += '<tr><td>2 gr</td><td><input type="number" name="2gr" value="0"></td></tr>';
            toReturn += '<tr><td>5 gr</td><td><input type="number" name="5gr" value="0"></td></tr>';
            toReturn += '<tr><td>10 gr</td><td><input type="number" name="10gr" value="0"></td></tr>';
            toReturn += '<tr><td>20 gr</td><td><input type="number" name="20gr" value="0"></td></tr>';
            toReturn += '<tr><td>50 gr</td><td><input type="number" name="50gr" value="0"></td></tr>';
            toReturn += '<tr><td>1 zł</td><td><input type="number" name="1zl" value="0"></td></tr>';
            toReturn += '<tr><td>2 zł</td><td><input type="number" name="2zl" value="0"></td></tr>';
            toReturn += '<tr><td>5 zł</td><td><input type="number" name="5zl" value="0"></td></tr>';
            toReturn += '<tr><td>10 zł</td><td><input type="number" name="10zl" value="0"></td></tr>';
            toReturn += '<tr><td>20 zł</td><td><input type="number" name="20zl" value="0"></td></tr>';
            toReturn += '<tr><td>50 zł</td><td><input type="number" name="50zl" value="0"></td></tr>';
            toReturn += '<tr><td>100 zł</td><td><input type="number" name="100zl" value="0"></td></tr>';
            toReturn += '<tr><td>200 zł</td><td><input type="number" name="200zl" value="0"></td></tr>';
            toReturn += '<tr><td>500 zł</td><td><input type="number" name="500zl" value="0"></td></tr>';
            //kwota z terminala
            toReturn += '<tr><td>Kwota z terminala</td><td><input type="number" name="terminal" step="0.01" value="0"></td></tr>';
            //waluta obca, tekstarea
            toReturn += '<tr><td>Waluta obca</td><td><textarea name="walutaObca"></textarea></td></tr>';
            //dary inne, tekstarea
            toReturn += '<tr><td>Dary inne</td><td><textarea name="daryInne"></textarea></td></tr>';
            //uwagi, tekstarea
            toReturn += '<tr><td>Uwagi</td><td><textarea name="uwagi"></textarea></td></tr>';
            //sala
            toReturn += '<tr><td>Sala</td><td><input type="text" name="sala" value="główna"></td></tr>';
            //liczący 1
            toReturn += '<tr><td>Liczący 1</td><td><select name="liczacy1">';
            //pobierz wszystkich liczących
            con.query('SELECT * FROM liczacy WHERE aktywne = 1 ORDER BY nazwisko ASC', function(err, result) {
                if (err) throw err;
                result.forEach(function(row) {
                    toReturn += '<option value="' + row.id + '">' + row.imie + ' ' + row.nazwisko + '</option>';
                });
                toReturn += '</select></td></tr>';
                //liczący 2
                toReturn += '<tr><td>Liczący 2</td><td><select name="liczacy2">';
                //pobierz wszystkich liczących
                con.query('SELECT * FROM liczacy WHERE aktywne = 1 ORDER BY nazwisko ASC', function(err, result) {
                    if (err) throw err;
                    result.forEach(function(row) {
                        toReturn += '<option value="' + row.id + '">' + row.imie + ' ' + row.nazwisko + '</option>';
                    });
                    toReturn += '</select></td></tr>';
                    //liczący 3
                    toReturn += '<tr><td>Liczący 3</td><td><select name="liczacy3">';
                    toReturn += '<option value="0">BRAK</option>';
                    //pobierz wszystkich liczących
                    con.query('SELECT * FROM liczacy WHERE aktywne = 1 ORDER BY nazwisko ASC', function(err, result) {
                        if (err) throw err;
                        result.forEach(function(row) {
                            toReturn += '<option value="' + row.id + '">' + row.imie + ' ' + row.nazwisko + '</option>';
                        });
                        toReturn += '</select></td></tr>';
                        toReturn += '</table>';
                        toReturn += '<input type="submit" id="zapisz" value="Zapisz" disabled>';
                        toReturn += '<h2>Suma: <span id="suma">0</span> zł</h2>';
                        toReturn += '<script>';
                        toReturn += 'var suma = 0;';
                        toReturn += 'function updateSum() {';
                        toReturn += 'suma = 0;';
                        toReturn += 'suma += parseInt(document.getElementsByName("1gr")[0].value);';
                        toReturn += 'suma += parseInt(document.getElementsByName("2gr")[0].value) * 2;';
                        toReturn += 'suma += parseInt(document.getElementsByName("5gr")[0].value) * 5;';
                        toReturn += 'suma += parseInt(document.getElementsByName("10gr")[0].value) * 10;';
                        toReturn += 'suma += parseInt(document.getElementsByName("20gr")[0].value) * 20;';
                        toReturn += 'suma += parseInt(document.getElementsByName("50gr")[0].value) * 50;';
                        toReturn += 'suma += parseInt(document.getElementsByName("1zl")[0].value) * 100;';
                        toReturn += 'suma += parseInt(document.getElementsByName("2zl")[0].value) * 200;';
                        toReturn += 'suma += parseInt(document.getElementsByName("5zl")[0].value) * 500;';
                        toReturn += 'suma += parseInt(document.getElementsByName("10zl")[0].value) * 1000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("20zl")[0].value) * 2000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("50zl")[0].value) * 5000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("100zl")[0].value) * 10000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("200zl")[0].value) * 20000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("500zl")[0].value) * 50000;';
                        toReturn += 'suma += parseFloat(document.getElementsByName("terminal")[0].value) * 100;';
                        toReturn += 'document.getElementById("suma").innerHTML = suma/100.0;';
                        toReturn += 'document.getElementById("suma2").innerHTML = suma/100.0;';
                        toReturn += 'if (suma == Math.floor(Number(document.getElementsByName("weryfikacjaSuma")[0].value)*100)) {';
                        toReturn += 'document.getElementsByName("weryfikacjaSuma")[0].style.backgroundColor = "#00ff44";';
                        toReturn += 'document.getElementById("zapisz").disabled = false;';
                        toReturn += '} else {';
                        toReturn += 'document.getElementsByName("weryfikacjaSuma")[0].style.backgroundColor = "#ff0000";';
                        toReturn += 'document.getElementById("zapisz").disabled = true;';
                        toReturn += '}';
                        toReturn += '}';
                        toReturn += 'updateSum();';
                        toReturn += 'document.getElementsByName("1gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("2gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("5gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("10gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("20gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("50gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("1zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("2zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("5zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("10zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("20zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("50zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("100zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("200zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("500zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("terminal")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("weryfikacjaSuma")[0].addEventListener("input", updateSum);';
                        toReturn += '</script>';

                        toReturn += '</form>';
                        toReturn += '</div>';
                        toReturn += footerHtml(1);
                        res.send(toReturn);
                    });
                });
            });
        }
    });
}); 
panelRouter.post('/rozliczWolontariusza', function(req, res) {
    //weryfikowal to numer id z tokenu
    var idWolontariusza = req.query.id;
    var idLiczacy1 = req.body.liczacy1;
    var idLiczacy2 = req.body.liczacy2;
    var idLiczacy3 = req.body.liczacy3 == 0 ? null : req.body.liczacy3;
    var sala = req.body.sala;
    var uwagi = req.body.uwagi;
    var daryInne = req.body.daryInne;
    var walutaObca = req.body.walutaObca;
    var terminal = req.body.terminal > 0 ? 1 : 0;
    var gr1 = req.body['1gr'];
    var gr2 = req.body['2gr'];
    var gr5 = req.body['5gr'];
    var gr10 = req.body['10gr'];
    var gr20 = req.body['20gr'];
    var gr50 = req.body['50gr'];
    var zl1 = req.body['1zl'];
    var zl2 = req.body['2zl'];
    var zl5 = req.body['5zl'];
    var zl10 = req.body['10zl'];
    var zl20 = req.body['20zl'];
    var zl50 = req.body['50zl'];
    var zl100 = req.body['100zl'];
    var zl200 = req.body['200zl'];
    var zl500 = req.body['500zl'];
    var sumaZTerminala = req.body.terminal;
    //zapisz dane do bazy
    $sql = "INSERT INTO `rozliczenie` (`id`, `wolontariuszID`, `czasRozliczenia`, `terminal`, `sumaZTerminala`, `1gr`, `2gr`, `5gr`, `10gr`, `20gr`, `50gr`, `1zl`, `2zl`, `5zl`, `10zl`, `20zl`, `50zl`, `100zl`, `200zl`, `500zl`, `walutaObca`, `daryInne`, `uwagi`, `liczacy1`, `liczacy2`, `liczacy3`, `sala`, `weryfikowal`, `wpisaneDoBSS`, `ostatniaZmiana`, `aktywne`) ";
    $sql += 'VALUES (NULL, ?, CURRENT_TIME(), ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,CURRENT_TIME(),1)';
    con.query($sql, [idWolontariusza, terminal, sumaZTerminala, gr1, gr2, gr5, gr10, gr20, gr50, zl1, zl2, zl5, zl10, zl20, zl50, zl100, zl200, zl500, walutaObca, daryInne, uwagi, idLiczacy1, idLiczacy2, idLiczacy3, sala, req.user.id], function(err, result) {
        if (err) throw err;
        if(process.env.DISCORD == "TAK")
        {
            con.query('SELECT * FROM wolontariusz WHERE id = ?', [idWolontariusza], function(err, result) {
                if (err) throw err;
                var suma = Number(gr1) +Number(gr2)*2 + Number(gr5)*5 + Number(gr10)*10 + Number(gr20)*20 + Number(gr50)*50 + Number(zl1)*100 + Number(zl2)*200 + Number(zl5)*500 + Number(zl10)*1000 + Number(zl20)*2000 + Number(zl50)*5000 + Number(zl100)*10000 + Number(zl200)*20000 + Number(zl500)*50000 + Number(sumaZTerminala)*100;
                sendToDiscord(result[0].imie, result[0].nazwisko, suma/100, result[0].discord);
            });
        }
        if(process.env.SENDEMAILS == "TAK")
        {
            con.query('SELECT * FROM wolontariusz WHERE id = ?', [idWolontariusza], function(err, result) {
                if (err) throw err;
                var suma = Number(gr1) +Number(gr2)*2 + Number(gr5)*5 + Number(gr10)*10 + Number(gr20)*20 + Number(gr50)*50 + Number(zl1)*100 + Number(zl2)*200 + Number(zl5)*500 + Number(zl10)*1000 + Number(zl20)*2000 + Number(zl50)*5000 + Number(zl100)*10000 + Number(zl200)*20000 + Number(zl500)*50000 + Number(sumaZTerminala)*100;
                sendEmail(result[0].imie, result[0].nazwisko, suma/100, result[0].email);
            });
        }
        res.redirect('/panel/rozliczenia#'+idWolontariusza);
        loger(fs, 'Rozliczono wolontariusza o id: ' + idWolontariusza, 'info');
    });
});
panelRouter.all('/rozliczenia', function(req, res) {
    var toReturn = headerHtml("Rozliczenia");
    toReturn += menuHtml(1);
    toReturn += '<div>';
    toReturn += '<style>#container{display: inline;}</style>';
    toReturn += '<div class="przewijanie">';
    toReturn += '<table class="dane szerokie">';
    toReturn += '<tr>';
    toReturn += '<th>Numer</th>';
    toReturn += '<th>Imię</th>';
    toReturn += '<th>Nazwisko</th>';
    toReturn += '<th>Suma</th>';
    toReturn += '<th>Kwota z terminala</th>';
    toReturn += '<th>500zł</th>';
    toReturn += '<th>200zł</th>';
    toReturn += '<th>100zł</th>';
    toReturn += '<th>50zł</th>';
    toReturn += '<th>20zł</th>';
    toReturn += '<th>10zł</th>';
    toReturn += '<th>5zł</th>';
    toReturn += '<th>2zł</th>';
    toReturn += '<th>1zł</th>';
    toReturn += '<th>50gr</th>';
    toReturn += '<th>20gr</th>';
    toReturn += '<th>10gr</th>';
    toReturn += '<th>5gr</th>';
    toReturn += '<th>2gr</th>';
    toReturn += '<th>1gr</th>';
    toReturn += '<th>Waluta obca</th>';
    toReturn += '<th>Dary inne</th>';
    toReturn += '<th>Uwagi</th>';
    toReturn += '<th>Sala</th>';
    toReturn += '<th>Edytuj</th>';
    toReturn += '</tr>';
    //pobierz osoby liczące
    con.query('SELECT * FROM wolontariusz WHERE aktywny = 1 ORDER BY numerIdentyfikatora ASC', function(err, result) {
        if (err) throw err;

        const promises = [];

        result.forEach(function(row) {
            const promise = new Promise((resolve, reject) => {
                con.query('SELECT * FROM rozliczenie WHERE wolontariuszID = ? AND aktywne = 1 ORDER BY czasRozliczenia DESC', [row.id], function(err, result2) {
                    if (err) reject(err);
                    if (result2.length === 1) {
                        //istnieje
                    toReturn += '<tr id="' + row.id + '">';
                    toReturn += '<td>' + row.numerIdentyfikatora + '</td>';
                    toReturn += '<td>' + row.imie + '</td>';
                    toReturn += '<td>' + row.nazwisko + '</td>';
                    toReturn += '<td>';
                    //policz sumę
                    var suma = 0;
                    suma += result2[0]['1gr'];
                    suma += result2[0]['2gr'] * 2;
                    suma += result2[0]['5gr'] * 5;
                    suma += result2[0]['10gr'] * 10;
                    suma += result2[0]['20gr'] * 20;
                    suma += result2[0]['50gr'] * 50;
                    suma += result2[0]['1zl'] * 100;
                    suma += result2[0]['2zl'] * 200;
                    suma += result2[0]['5zl'] * 500;
                    suma += result2[0]['10zl'] * 1000;
                    suma += result2[0]['20zl'] * 2000;
                    suma += result2[0]['50zl'] * 5000;
                    suma += result2[0]['100zl'] * 10000;
                    suma += result2[0]['200zl'] * 20000;
                    suma += result2[0]['500zl'] * 50000;
                    suma += result2[0].sumaZTerminala * 100;
                    toReturn += suma/100.0;
                    toReturn += '</td>';
                    toReturn += '<td>' + result2[0].sumaZTerminala + '</td>';
                    toReturn += '<td>' + result2[0]['500zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['200zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['100zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['50zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['20zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['10zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['5zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['2zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['1zl'] + '</td>';
                    toReturn += '<td>' + result2[0]['50gr'] + '</td>';
                    toReturn += '<td>' + result2[0]['20gr'] + '</td>';
                    toReturn += '<td>' + result2[0]['10gr'] + '</td>';
                    toReturn += '<td>' + result2[0]['5gr'] + '</td>';
                    toReturn += '<td>' + result2[0]['2gr'] + '</td>';
                    toReturn += '<td>' + result2[0]['1gr'] + '</td>';
                    toReturn += '<td>' + result2[0].walutaObca + '</td>';
                    toReturn += '<td>' + result2[0].daryInne + '</td>';
                    toReturn += '<td>' + result2[0].uwagi + '</td>';
                    toReturn += '<td>' + result2[0].sala + '</td>';
                    toReturn += '<td><a href="/panel/edytujRozliczenie?id=' + result2[0].id + '">Edytuj</a>';
                    if(result2[0].weryfikowal == 0)
                    {
                        toReturn += ' | <a href="/panel/potwierdz?id=' + result2[0].id + '">Weryfikuj</a>';
                    }
                    toReturn += '</td>';
                    toReturn += '</tr>';
                    resolve();

                } else if (result2.length === 0) {
                    resolve();
                }
            });
        });

        promises.push(promise);
    });

    Promise.all(promises)
        .then(() => {
            toReturn += '</table>';
            toReturn += '</div>';
            toReturn += '</div>';
            toReturn += footerHtml(1);
            res.send(toReturn);
        })
        .catch((error) => {
            // Obsługa błędów zapytań
            res.status(500).send('Wystąpił błąd podczas pobierania danych.');
            console.error(error);
        });
    });

});


panelRouter.get('/potwierdz', function(req, res) {
    var idRozliczenia = req.query.id;
    if(idRozliczenia != undefined || idRozliczenia != null)
    {
        //sprawdź czy istnieje rozliczenie
        con.query('SELECT * FROM rozliczenie WHERE id = ?', [idRozliczenia], function(err, result) {
            if (err) throw err;
            if (result.length == 1) {
                //istnieje
                var toReturn = headerHtml("Potwierdź rozliczenie");
                toReturn += menuHtml(1);
                toReturn += '<div class="content">';
                toReturn += '<h1>Potwierdź rozliczenie</h1>';
                toReturn += '<form action="/panel/potwierdz?id=' + idRozliczenia + '" method="POST">';
                toReturn += '<h2>' + result[0].wolontariuszID + '</h2>';
                toReturn += '<h3>' + result[0].czasRozliczenia + '</h3>';
                toReturn += '<h2>Suma: <span id="suma2">' + (result[0]['1gr'] + result[0]['2gr'] * 2 + result[0]['5gr'] * 5 + result[0]['10gr'] * 10 + result[0]['20gr'] * 20 + result[0]['50gr'] * 50 + result[0]['1zl'] * 100 + result[0]['2zl'] * 200 + result[0]['5zl'] * 500 + result[0]['10zl'] * 1000 + result[0]['20zl'] * 2000 + result[0]['50zl'] * 5000 + result[0]['100zl'] * 10000 + result[0]['200zl'] * 20000 + result[0]['500zl'] * 50000 + result[0].sumaZTerminala)/100.0 + '</span> zł</h2>';
                toReturn += '<table class="dane">';
                toReturn += '<tr><th>Nominał</th><th>Ilość</th></tr>';
                toReturn += '<tr><td>1 gr</td><td>' + result[0]['1gr'] + '</td></tr>';
                toReturn += '<tr><td>2 gr</td><td>' + result[0]['2gr'] + '</td></tr>';
                toReturn += '<tr><td>5 gr</td><td>' + result[0]['5gr'] + '</td></tr>';
                toReturn += '<tr><td>10 gr</td><td>' + result[0]['10gr'] + '</td></tr>';
                toReturn += '<tr><td>20 gr</td><td>' + result[0]['20gr'] + '</td></tr>';
                toReturn += '<tr><td>50 gr</td><td>' + result[0]['50gr'] + '</td></tr>';
                toReturn += '<tr><td>1 zł</td><td>' + result[0]['1zl'] + '</td></tr>';
                toReturn += '<tr><td>2 zł</td><td>' + result[0]['2zl'] + '</td></tr>';
                toReturn += '<tr><td>5 zł</td><td>' + result[0]['5zl'] + '</td></tr>';
                toReturn += '<tr><td>10 zł</td><td>' + result[0]['10zl'] + '</td></tr>';
                toReturn += '<tr><td>20 zł</td><td>' + result[0]['20zl'] + '</td></tr>';
                toReturn += '<tr><td>50 zł</td><td>' + result[0]['50zl'] + '</td></tr>';
                toReturn += '<tr><td>100 zł</td><td>' + result[0]['100zl'] + '</td></tr>';
                toReturn += '<tr><td>200 zł</td><td>' + result[0]['200zl'] + '</td></tr>';
                toReturn += '<tr><td>500 zł</td><td>' + result[0]['500zl'] + '</td></tr>';
                toReturn += '<tr><td>Kwota z terminala</td><td>' + result[0].sumaZTerminala + '</td></tr>';
                toReturn += '<tr><td>Waluta obca</td><td>' + result[0].walutaObca + '</td></tr>';
                toReturn += '<tr><td>Dary inne</td><td>' + result[0].daryInne + '</td></tr>';
                toReturn += '<tr><td>Uwagi</td><td>' + result[0].uwagi + '</td></tr>';
                toReturn += '<tr><td>Sala</td><td>' + result[0].sala + '</td></tr>';
                toReturn += '<tr><td>Liczący 1</td><td>' + result[0].liczacy1 + '</td></tr>';
                toReturn += '<tr><td>Liczący 2</td><td>' + result[0].liczacy2 + '</td></tr>';
                toReturn += '<tr><td>Liczący 3</td><td>' + result[0].liczacy3 + '</td></tr>';
                toReturn += '</table>';
                toReturn += '<input type="submit" value="Potwierdź">';
                toReturn += '</form>';
                toReturn += '</div>';
                toReturn += footerHtml(1);
                res.send(toReturn);
            }
        });
    }
    else
    {
        var toReturn = headerHtml("Rozliczenia");
        toReturn += menuHtml(1);
        toReturn += '<div>';
        toReturn += '<style>#container{display: inline;}</style>';
        toReturn += '<div class="przewijanie">';
        toReturn += '<table class="dane szerokie">';
        toReturn += '<tr>';
        toReturn += '<th>Numer</th>';
        toReturn += '<th>Imię</th>';
        toReturn += '<th>Nazwisko</th>';
        toReturn += '<th>Suma</th>';
        toReturn += '<th>Kwota z terminala</th>';
        toReturn += '<th>Waluta obca</th>';
        toReturn += '<th>Dary inne</th>';
        toReturn += '<th>Uwagi</th>';
        toReturn += '<th>Sala</th>';
        toReturn += '<th>Edytuj</th>';
        toReturn += '</tr>';
        //pobierz osoby liczące
        con.query('SELECT * FROM wolontariusz WHERE aktywny = 1 ORDER BY numerIdentyfikatora ASC', function(err, result) {
            if (err) throw err;
    
            const promises = [];
    
            result.forEach(function(row) {
                const promise = new Promise((resolve, reject) => {
                    con.query('SELECT * FROM rozliczenie WHERE wolontariuszID = ? AND aktywne = 1 AND weryfikowal = 0 ORDER BY czasRozliczenia DESC', [row.id], function(err, result2) {
                        if (err) reject(err);
                        if (result2.length === 1) {
                            //istnieje
                        toReturn += '<tr id="' + row.id + '">';
                        toReturn += '<td>' + row.numerIdentyfikatora + '</td>';
                        toReturn += '<td>' + row.imie + '</td>';
                        toReturn += '<td>' + row.nazwisko + '</td>';
                        toReturn += '<td>';
                        //policz sumę
                        var suma = 0;
                        suma += result2[0]['1gr'];
                        suma += result2[0]['2gr'] * 2;
                        suma += result2[0]['5gr'] * 5;
                        suma += result2[0]['10gr'] * 10;
                        suma += result2[0]['20gr'] * 20;
                        suma += result2[0]['50gr'] * 50;
                        suma += result2[0]['1zl'] * 100;
                        suma += result2[0]['2zl'] * 200;
                        suma += result2[0]['5zl'] * 500;
                        suma += result2[0]['10zl'] * 1000;
                        suma += result2[0]['20zl'] * 2000;
                        suma += result2[0]['50zl'] * 5000;
                        suma += result2[0]['100zl'] * 10000;
                        suma += result2[0]['200zl'] * 20000;
                        suma += result2[0]['500zl'] * 50000;
                        suma += result2[0].sumaZTerminala * 100;
                        toReturn += suma/100.0;
                        toReturn += '</td>';
                        toReturn += '<td>' + result2[0].sumaZTerminala + '</td>';
                        toReturn += '<td>' + result2[0].walutaObca + '</td>';
                        toReturn += '<td>' + result2[0].daryInne + '</td>';
                        toReturn += '<td>' + result2[0].uwagi + '</td>';
                        toReturn += '<td>' + result2[0].sala + '</td>';
                        toReturn += '<td><a href="/panel/edytujRozliczenie?id=' + result2[0].id + '">Edytuj</a>';
                        if(result2[0].weryfikowal == 0)
                        {
                            toReturn += ' | <a href="/panel/potwierdz?id=' + result2[0].id + '">Weryfikuj</a>';
                        }
                        toReturn += '</td>';
                        toReturn += '</tr>';
                        resolve();
    
                    } else if (result2.length === 0) {
                        resolve();
                    }
                });
            });
    
            promises.push(promise);
        });
    
        Promise.all(promises)
            .then(() => {
                toReturn += '</table>';
                toReturn += '</div>';
                toReturn += '</div>';
                toReturn += footerHtml(1);
                res.send(toReturn);
            })
            .catch((error) => {
                // Obsługa błędów zapytań
                res.status(500).send('Wystąpił błąd podczas pobierania danych.');
                console.error(error);
            });
        });
    }
});

panelRouter.post('/potwierdz', function(req, res) {
    //weryfikowal to numer id z tokenu
    var idRozliczenia = req.query.id;
    //zapisz dane do bazy
    $sql = "UPDATE `rozliczenie` SET `weryfikowal` = ? WHERE `rozliczenie`.`id` = ?";
    con.query($sql, [req.user.id, idRozliczenia], function(err, result) {
        if (err) throw err;
        res.redirect('/panel/rozliczenia');
        loger(fs, 'Potwierdzono rozliczenie o id: ' + idRozliczenia, 'info');
    });
});


panelRouter.get('/edytujRozliczenie', function(req, res) {
    var idRozliczenia = req.query.id;
    //sprawdź czy istnieje rozliczenie
    con.query('SELECT * FROM rozliczenie WHERE id = ?', [idRozliczenia], function(err, result) {
        if (err) throw err;
        if (result.length == 1) {
            //istnieje
            var toReturn = headerHtml("Edytuj rozliczenie");
            toReturn += menuHtml(1);
            toReturn += '<div class="content">';
            toReturn += '<h1>Edytuj rozliczenie</h1>';
            toReturn += '<form action="/panel/edytujRozliczenie?id=' + idRozliczenia + '" method="POST">';
            toReturn += '<h2>' + result[0].wolontariuszID + '</h2>';
            toReturn += '<h3>' + result[0].czasRozliczenia + '</h3>';
            toReturn += '<h2>Suma: <span id="suma2">0</span> zł</h2>';
            //pokaż formularz do wpisywania zebranej kwoaty i monet (sumę liczy program, użytkownik podaje ilość monet)
            toReturn += '<table class="dane">';
            toReturn += '<tr><td>Suma</td><td><input type="number" name="weryfikacjaSuma" step="0.01" value="' + (result[0]['1gr'] + result[0]['2gr'] * 2 + result[0]['5gr'] * 5 + result[0]['10gr'] * 10 + result[0]['20gr'] * 20 + result[0]['50gr'] * 50 + result[0]['1zl'] * 100 + result[0]['2zl'] * 200 + result[0]['5zl'] * 500 + result[0]['10zl'] * 1000 + result[0]['20zl'] * 2000 + result[0]['50zl'] * 5000 + result[0]['100zl'] * 10000 + result[0]['200zl'] * 20000 + result[0]['500zl'] * 50000 + result[0].sumaZTerminala)/100.0 + '"></td></tr>';
            toReturn += '<tr>';
            toReturn += '<th>Waluta</th>';
            toReturn += '<th>Ilość</th>';
            toReturn += '</tr>';
            toReturn += '<tr><td>1 gr</td><td><input type="number" name="1gr" value="' + result[0]['1gr'] + '"></td></tr>';
            toReturn += '<tr><td>2 gr</td><td><input type="number" name="2gr" value="' + result[0]['2gr'] + '"></td></tr>';
            toReturn += '<tr><td>5 gr</td><td><input type="number" name="5gr" value="' + result[0]['5gr'] + '"></td></tr>';
            toReturn += '<tr><td>10 gr</td><td><input type="number" name="10gr" value="' + result[0]['10gr'] + '"></td></tr>';
            toReturn += '<tr><td>20 gr</td><td><input type="number" name="20gr" value="' + result[0]['20gr'] + '"></td></tr>';
            toReturn += '<tr><td>50 gr</td><td><input type="number" name="50gr" value="' + result[0]['50gr'] + '"></td></tr>';
            toReturn += '<tr><td>1 zł</td><td><input type="number" name="1zl" value="' + result[0]['1zl'] + '"></td></tr>';
            toReturn += '<tr><td>2 zł</td><td><input type="number" name="2zl" value="' + result[0]['2zl'] + '"></td></tr>';
            toReturn += '<tr><td>5 zł</td><td><input type="number" name="5zl" value="' + result[0]['5zl'] + '"></td></tr>';
            toReturn += '<tr><td>10 zł</td><td><input type="number" name="10zl" value="' + result[0]['10zl'] + '"></td></tr>';
            toReturn += '<tr><td>20 zł</td><td><input type="number" name="20zl" value="' + result[0]['20zl'] + '"></td></tr>';
            toReturn += '<tr><td>50 zł</td><td><input type="number" name="50zl" value="' + result[0]['50zl'] + '"></td></tr>';
            toReturn += '<tr><td>100 zł</td><td><input type="number" name="100zl" value="' + result[0]['100zl'] + '"></td></tr>';
            toReturn += '<tr><td>200 zł</td><td><input type="number" name="200zl" value="' + result[0]['200zl'] + '"></td></tr>';
            toReturn += '<tr><td>500 zł</td><td><input type="number" name="500zl" value="' + result[0]['500zl'] + '"></td></tr>';
            //kwota z terminala
            toReturn += '<tr><td>Kwota z terminala</td><td><input type="number" name="terminal" value="' + result[0].sumaZTerminala + '"></td></tr>';
            //waluta obca, tekstarea
            toReturn += '<tr><td>Waluta obca</td><td><textarea name="walutaObca">' + result[0].walutaObca + '</textarea></td></tr>';
            //dary inne, tekstarea
            toReturn += '<tr><td>Dary inne</td><td><textarea name="daryInne">' + result[0].daryInne + '</textarea></td></tr>';
            //uwagi, tekstarea
            toReturn += '<tr><td>Uwagi</td><td><textarea name="uwagi">' + result[0].uwagi + '</textarea></td></tr>';
            //sala
            toReturn += '<tr><td>Sala</td><td><input type="text" name="sala" value="' + result[0].sala + '"></td></tr>';
            //liczący 1
            toReturn += '<tr><td>Liczący 1</td><td><select name="liczacy1">';
            //pobierz wszystkich liczących
            con.query('SELECT * FROM liczacy WHERE aktywne = 1 ORDER BY nazwisko ASC', function(err, result) {
                if (err) throw err;
                result.forEach(function(row) {
                    if (row.id == result[0].liczacy1)
                        toReturn += '<option value="' + row.id + '" selected>' + row.imie + ' ' + row.nazwisko + '</option>';
                    else
                        toReturn += '<option value="' + row.id + '">' + row.imie + ' ' + row.nazwisko + '</option>';
                });
                toReturn += '</select></td></tr>';
                //liczący 2
                toReturn += '<tr><td>Liczący 2</td><td><select name="liczacy2">';
                //pobierz wszystkich liczących
                con.query('SELECT * FROM liczacy WHERE aktywne = 1 ORDER BY nazwisko ASC', function(err, result) {
                    if (err) throw err;
                    result.forEach(function(row) {
                        if (row.id == result[0].liczacy2)
                            toReturn += '<option value="' + row.id + '" selected>' + row.imie + ' ' + row.nazwisko + '</option>';
                        else
                            toReturn += '<option value="' + row.id + '">' + row.imie + ' ' + row.nazwisko + '</option>';
                    });
                    toReturn += '</select></td></tr>';
                    //liczący 3
                    toReturn += '<tr><td>Liczący 3</td><td><select name="liczacy3">';
                    toReturn += '<option value="0">BRAK</option>';
                    //pobierz wszystkich liczących
                    con.query('SELECT * FROM liczacy WHERE aktywne = 1 ORDER BY nazwisko ASC', function(err, result) {
                        if (err) throw err;
                        result.forEach(function(row) {
                            if (row.id == result[0].liczacy3)
                                toReturn += '<option value="' + row.id + '" selected>' + row.imie + ' ' + row.nazwisko + '</option>';
                            else
                                toReturn += '<option value="' + row.id + '">' + row.imie + ' ' + row.nazwisko + '</option>';
                        });
                        toReturn += '</select></td></tr>';
                        toReturn += '</table>';
                        toReturn += '<input type="submit" id="zapisz" value="Zapisz" disabled>';
                        toReturn += '<h2>Suma: <span id="suma">0</span> zł</h2>';
                        toReturn += '<script>';
                        toReturn += 'var suma = 0;';
                        toReturn += 'function updateSum() {';
                        toReturn += 'suma = 0;';
                        toReturn += 'suma += parseInt(document.getElementsByName("1gr")[0].value);';
                        toReturn += 'suma += parseInt(document.getElementsByName("2gr")[0].value) * 2;';
                        toReturn += 'suma += parseInt(document.getElementsByName("5gr")[0].value) * 5;';
                        toReturn += 'suma += parseInt(document.getElementsByName("10gr")[0].value) * 10;';
                        toReturn += 'suma += parseInt(document.getElementsByName("20gr")[0].value) * 20;';
                        toReturn += 'suma += parseInt(document.getElementsByName("50gr")[0].value) * 50;';
                        toReturn += 'suma += parseInt(document.getElementsByName("1zl")[0].value) * 100;';
                        toReturn += 'suma += parseInt(document.getElementsByName("2zl")[0].value) * 200;';
                        toReturn += 'suma += parseInt(document.getElementsByName("5zl")[0].value) * 500;';
                        toReturn += 'suma += parseInt(document.getElementsByName("10zl")[0].value) * 1000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("20zl")[0].value) * 2000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("50zl")[0].value) * 5000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("100zl")[0].value) * 10000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("200zl")[0].value) * 20000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("500zl")[0].value) * 50000;';
                        toReturn += 'suma += parseInt(document.getElementsByName("terminal")[0].value);';
                        toReturn += 'document.getElementById("suma").innerHTML = suma/100.0;';
                        toReturn += 'document.getElementById("suma2").innerHTML = suma/100.0;';
                        toReturn += 'if (suma == Math.floor(Number(document.getElementsByName("weryfikacjaSuma")[0].value)*100)) {';
                        toReturn += 'document.getElementsByName("weryfikacjaSuma")[0].style.backgroundColor = "#00ff44";';
                        toReturn += 'document.getElementById("zapisz").disabled = false;';
                        toReturn += '} else {';
                        toReturn += 'document.getElementsByName("weryfikacjaSuma")[0].style.backgroundColor = "#ff0000";';
                        toReturn += 'document.getElementById("zapisz").disabled = true;';
                        toReturn += '}';
                        toReturn += '}';
                        toReturn += 'updateSum();';
                        toReturn += 'document.getElementsByName("1gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("2gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("5gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("10gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("20gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("50gr")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("1zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("2zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("5zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("10zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("20zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("50zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("100zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("200zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("500zl")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("terminal")[0].addEventListener("input", updateSum);';
                        toReturn += 'document.getElementsByName("weryfikacjaSuma")[0].addEventListener("input", updateSum);';
                        toReturn += '</script>';

                        toReturn += '</form>';
                        toReturn += '</div>';
                        toReturn += footerHtml(1);
                        res.send(toReturn);
                    });
                });
            });
            }
        else
        {
            //nie istnieje
            res.redirect('/rozliczenia');
        }
    });
});
panelRouter.post('/edytujRozliczenie', function(req, res) {
    var idRozliczenia = req.query.id;
    var idLiczacy1 = req.body.liczacy1;
    var idLiczacy2 = req.body.liczacy2;
    var idLiczacy3 = req.body.liczacy3 == 0 ? null : req.body.liczacy3;
    var sala = req.body.sala;
    var uwagi = req.body.uwagi;
    var daryInne = req.body.daryInne;
    var walutaObca = req.body.walutaObca;
    var terminal = req.body.terminal > 0 ? 1 : 0;
    var gr1 = req.body['1gr'];
    var gr2 = req.body['2gr'];
    var gr5 = req.body['5gr'];
    var gr10 = req.body['10gr'];
    var gr20 = req.body['20gr'];
    var gr50 = req.body['50gr'];
    var zl1 = req.body['1zl'];
    var zl2 = req.body['2zl'];
    var zl5 = req.body['5zl'];
    var zl10 = req.body['10zl'];
    var zl20 = req.body['20zl'];
    var zl50 = req.body['50zl'];
    var zl100 = req.body['100zl'];
    var zl200 = req.body['200zl'];
    var zl500 = req.body['500zl'];
    var sumaZTerminala = req.body.terminal;
    //zapisz dane do bazy
    $sql = "UPDATE `rozliczenie` SET `terminal` = ?, `sumaZTerminala` = ?, `1gr` = ?, `2gr` = ?, `5gr` = ?, `10gr` = ?, `20gr` = ?, `50gr` = ?, `1zl` = ?, `2zl` = ?, `5zl` = ?, `10zl` = ?, `20zl` = ?, `50zl` = ?, `100zl` = ?, `200zl` = ?, `500zl` = ?, `walutaObca` = ?, `daryInne` = ?, `uwagi` = ?, `liczacy1` = ?, `liczacy2` = ?, `liczacy3` = ?, `sala` = ?, `weryfikowal` = ?, `ostatniaZmiana` = CURRENT_TIME() WHERE `rozliczenie`.`id` = ?";
    con.query($sql, [terminal, sumaZTerminala, gr1, gr2, gr5, gr10, gr20, gr50, zl1, zl2, zl5, zl10, zl20, zl50, zl100, zl200, zl500, walutaObca, daryInne, uwagi, idLiczacy1, idLiczacy2, idLiczacy3, sala, req.user.id, idRozliczenia], function(err, result) {
        if (err) throw err;
        res.redirect('/panel/rozliczenia#'+idRozliczenia);
        loger(fs, 'Edytowano rozliczenie o id: ' + idRozliczenia, 'info');
    });
});
panelRouter.all('/statystyki', function(req, res) {
    var toReturn = headerHtml("Statystyki");
    toReturn += menuHtml(1);
    toReturn += '<div class="kafelki2">';
    toReturn += '<div class="kafelek2">';
    toReturn += '<h2>Całkowita suma</h2>';
    toReturn += '<table class="dane">';
    //wypisz sumę zebranych pieniędzy, sumę poszczególnych nominałów
    //pobierz wszystkie rozliczenia
    con.query('SELECT * FROM rozliczenie WHERE aktywne = 1', function(err, result) {
        if (err) throw err;
        var suma = 0;
        var sumaTerminal = 0;
        var suma1gr = 0;
        var suma2gr = 0;
        var suma5gr = 0;
        var suma10gr = 0;
        var suma20gr = 0;
        var suma50gr = 0;
        var suma1zl = 0;
        var suma2zl = 0;
        var suma5zl = 0;
        var suma10zl = 0;
        var suma20zl = 0;
        var suma50zl = 0;
        var suma100zl = 0;
        var suma200zl = 0;
        var suma500zl = 0;
        result.forEach(function(row) {
            suma += row['1gr'] + row['2gr'] * 2 + row['5gr'] * 5 + row['10gr'] * 10 + row['20gr'] * 20 + row['50gr'] * 50 + row['1zl'] * 100 + row['2zl'] * 200 + row['5zl'] * 500 + row['10zl'] * 1000 + row['20zl'] * 2000 + row['50zl'] * 5000 + row['100zl'] * 10000 + row['200zl'] * 20000 + row['500zl'] * 50000;
            sumaTerminal += row.sumaZTerminala;
            suma1gr += row['1gr'];
            suma2gr += row['2gr'];
            suma5gr += row['5gr'];
            suma10gr += row['10gr'];
            suma20gr += row['20gr'];
            suma50gr += row['50gr'];
            suma1zl += row['1zl'];
            suma2zl += row['2zl'];
            suma5zl += row['5zl'];
            suma10zl += row['10zl'];
            suma20zl += row['20zl'];
            suma50zl += row['50zl'];
            suma100zl += row['100zl'];
            suma200zl += row['200zl'];
            suma500zl += row['500zl'];
        });
        toReturn += '<tr><td>Suma</td><td>' + suma/100.0 + ' zł</td></tr>';
        toReturn += '<tr><td>Suma z terminali</td><td>' + sumaTerminal + ' zł</td></tr>';
        toReturn += '<tr><td>1 gr</td><td>' + suma1gr + '</td></tr>';
        toReturn += '<tr><td>2 gr</td><td>' + suma2gr + '</td></tr>';
        toReturn += '<tr><td>5 gr</td><td>' + suma5gr + '</td></tr>';
        toReturn += '<tr><td>10 gr</td><td>' + suma10gr + '</td></tr>';
        toReturn += '<tr><td>20 gr</td><td>' + suma20gr + '</td></tr>';
        toReturn += '<tr><td>50 gr</td><td>' + suma50gr + '</td></tr>';
        toReturn += '<tr><td>1 zł</td><td>' + suma1zl + '</td></tr>';
        toReturn += '<tr><td>2 zł</td><td>' + suma2zl + '</td></tr>';
        toReturn += '<tr><td>5 zł</td><td>' + suma5zl + '</td></tr>';
        toReturn += '<tr><td>10 zł</td><td>' + suma10zl + '</td></tr>';
        toReturn += '<tr><td>20 zł</td><td>' + suma20zl + '</td></tr>';
        toReturn += '<tr><td>50 zł</td><td>' + suma50zl + '</td></tr>';
        toReturn += '<tr><td>100 zł</td><td>' + suma100zl + '</td></tr>';
        toReturn += '<tr><td>200 zł</td><td>' + suma200zl + '</td></tr>';
        toReturn += '<tr><td>500 zł</td><td>' + suma500zl + '</td></tr>';
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += '<div class="kafelek2">';
        toReturn += '<h2>Top 10 wolontariuszy</h2>';
        //SELECT * FROM `SumaZebranaPrzezWolontariuszy` ORDER BY `SumaZebranaPrzezWolontariuszy`.`suma` ASC LIMIT 10;
        toReturn += '<table class="dane">';
        toReturn += '<tr><th>Wolontariusz</th><th>Imię i nazwisko</th><th>Suma</th></tr>';
        con.query('SELECT numerIdentyfikatora, imie, nazwisko, suma FROM `SumaZebranaPrzezWolontariuszy` ORDER BY `SumaZebranaPrzezWolontariuszy`.`suma` DESC LIMIT 10;', function(err, result) {
            if (err) throw err;
            result.forEach(function(row) {
                toReturn += '<tr><td>' + row.numerIdentyfikatora + '</td><td>' + row.imie + ' ' + row.nazwisko + '</td><td>' + row.suma + '</td></tr>';
            });
            toReturn += '</table>';
            toReturn += '</div>';
            toReturn += '<div class="kafelek2">';
            //który liczący najwięcej liczył
            toReturn += '<h2>Najwięcej puszek przeliczonych</h2>';
            toReturn += '<table class="dane">';
            toReturn += '<tr><th>Liczący</th><th>Imię i nazwisko</th><th>Suma</th></tr>';
            con.query("SELECT idLiczacego, imie, nazwisko, sumaPrzeliczona FROM `sumaPrzeliczona` ORDER BY `sumaPrzeliczona`.`sumaPrzeliczona` DESC LIMIT 10;", function(err, result) {
                if (err) throw err;
                result.forEach(function(row) {
                    toReturn += '<tr><td>' + row.idLiczacego + '</td><td>' + row.imie + ' ' + row.nazwisko + '</td><td>' + row.sumaPrzeliczona + '</td></tr>';
                });
                toReturn += '</table>';
                toReturn += '</div>';
                toReturn += '</div>';
                toReturn += footerHtml(1);
                res.send(toReturn);
            })
            
        });
    });
});
panelRouter.get("/haslo", function(req, res) {
    var toReturn = headerHtml("Zmiana hasła");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Zmiana hasła</h1>';
    if (req.query.success) {
        toReturn += '<h2 style="color: green;">Hasło zostało zmienione</h2>';
    } else if (req.query.error) {
        toReturn += '<h2 style="color: red;">Stare hasło jest niepoprawne</h2>';
    }
    toReturn += '<form action="/panel/haslo" method="POST">';
    toReturn += '<table class="dane">';
    toReturn += '<tr><td>Stare hasło</td><td><input type="password" name="stareHaslo"></td></tr>';
    toReturn += '<tr><td>Nowe hasło</td><td><input type="password" name="noweHaslo"></td></tr>';
    toReturn += '<tr><td>Powtórz nowe hasło</td><td><input type="password" name="powtorzHaslo"></td></tr>';
    toReturn += '</table>';
    toReturn += '<input type="submit" value="Zapisz">';
    toReturn += '</form>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});
panelRouter.post("/haslo", function(req, res) {
    //console.log(req.body);
    var stareHaslo = req.body.stareHaslo;
    var noweHaslo = req.body.noweHaslo;
    var powtorzHaslo = req.body.powtorzHaslo;
    //sprawdź czy stare hasło jest poprawne, tabelka loginy, kolumna haslo
    con.query("SELECT * FROM `login` WHERE `id` = ? AND `haslo` = SHA1(?)", [req.user.id, stareHaslo], function(err, result) {
        if (err) throw err;
        if (result.length == 1) {
            //stare hasło jest poprawne
            if (noweHaslo == powtorzHaslo) {
                //hasła są takie same
                //zmień hasło
                con.query("UPDATE `login` SET `haslo` = SHA1(?) WHERE `login`.`id` = ?", [noweHaslo, req.user.id], function(err, result) {
                    if (err) throw err;
                    res.redirect("/panel/haslo?success");
                });
            } else {
                //hasła nie są takie same
                res.redirect("/panel/haslo?error");
            }
        } else {
            //stare hasło jest niepoprawne
            res.redirect("/panel/haslo?error");
        }

    });
});
///nowyAdmin
panelRouter.get("/nowyAdmin", function(req, res) {
    var toReturn = headerHtml("Dodaj administratora");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Dodaj administratora</h1>';
    toReturn += '<form action="/panel/nowyAdmin" method="POST">';
    toReturn += '<table class="dane">';
    toReturn += '<tr><td>Imię</td><td><input type="text" name="imie"></td></tr>';
    toReturn += '<tr><td>Nazwisko</td><td><input type="text" name="nazwisko"></td></tr>';
    toReturn += '<tr><td>Login</td><td><input type="text" name="login"></td></tr>';
    toReturn += '<tr><td>Hasło</td><td><input type="password" name="haslo"></td></tr>';
    toReturn += '</table>';
    toReturn += '<input type="submit" value="Dodaj">';
    toReturn += '</form>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});
panelRouter.post("/nowyAdmin", function(req, res) {
    //sprawdź czy login jest wolny
    var imie = req.body.imie;
    var nazwisko = req.body.nazwisko;
    var login = req.body.login;
    var haslo = req.body.haslo;
    con.query("SELECT * FROM `login` WHERE `login` = ?", [login], function(err, result) {
        if (err) throw err;
        if (result.length == 0) {
            //login jest wolny
            //dodaj admina
            con.query("INSERT INTO `login` (`id`, `login`, `haslo`, `kto`, `aktywne`) VALUES (NULL, ?, SHA1(?), ?, 1)", [login, haslo, imie + " " + nazwisko], function(err, result) {
                if (err) throw err;
                res.redirect("/panel/nowyAdmin?success");
            });
        } else {
            //login jest zajęty
            res.redirect("/panel/nowyAdmin?error");
        }
    });
});
//usunAdmin
panelRouter.get("/usunAdmin", function(req, res) {
    var toReturn = headerHtml("Usuń administratora");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Usuń administratora</h1>';
    toReturn += '<form action="/panel/usunAdmin" method="POST">';
    toReturn += '<table class="dane">';
    toReturn += '<tr><td>Login</td><td><input type="text" name="login"></td></tr>';
    toReturn += '</table>';
    toReturn += '<input type="submit" value="Usuń">';
    toReturn += '</form>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});
panelRouter.post("/usunAdmin", function(req, res) {
    //sprawdź czy login jest wolny
    var login = req.body.login;
    con.query("SELECT * FROM `login` WHERE `login` = ?", [login], function(err, result) {
        if (err) throw err;
        if (result.length == 1) {
            //login jest zajęty
            //usuń admina
            con.query("UPDATE `login` SET `aktywne` = 0 WHERE `login`.`login` = ?", [login], function(err, result) {
                if (err) throw err;
                res.redirect("/panel/usunAdmin?success");
            });
        } else {
            //login jest wolny
            res.redirect("/panel/usunAdmin?error");
        }
    });
});
//listaAdminow
panelRouter.get("/listaAdminow", function(req, res) {
    var toReturn = headerHtml("Lista administratorów");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Lista administratorów</h1>';
    toReturn += '<table class="dane">';
    toReturn += '<tr><th>Imię i nazwisko</th><th>Login</th></tr>';
    con.query("SELECT * FROM `login` WHERE `aktywne` = 1", function(err, result) {
        if (err) throw err;
        result.forEach(function(row) {
            toReturn += '<tr><td>' + row.kto + '</td><td>' + row.login + '</td></tr>';
        });
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += footerHtml(1);
        res.send(toReturn);
    });
});
//uniewaznijTokeny
panelRouter.all("/uniewaznijTokeny", function(req, res) {
    //ustaw wszystkie tokeny na aktywne = 0 i przejdź do /panel/logout
    con.query("UPDATE `tokeny` SET `aktywny` = 0 WHERE `tokeny`.`aktywny` = 1", function(err, result) {
        if (err) throw err;
        res.redirect("/panel/logout");
    });
});
//to będzie na szybkie informacje jako iframe
panelRouter.get("/szybkieInfo", function(req, res) {
    var toReturn = '<link rel="stylesheet" href="/style.css">';
    toReturn += '<div class="side">';
    toReturn += '<h1>Szybkie informacje</h1>';
    //sprawdź ile jest wolontariuszy oraz ilu jest rozliczonych
    var iloscWolontariuszy = 0;
    var iloscRozliczonych = 0;
    var iloscLiczących = 0;
    con.query("SELECT * FROM `wolontariusz` WHERE `aktywny` = 1", function(err, result) {
        if (err) throw err;
        iloscWolontariuszy = result.length;
        con.query("SELECT * FROM `rozliczenie` WHERE `aktywne` = 1", function(err, result) {
            if (err) throw err;
            iloscRozliczonych = result.length;
            con.query("SELECT * FROM `liczacy` WHERE `aktywne` = 1", function(err, result) {
                if (err) throw err;
                iloscLiczących = result.length;
                toReturn += '<table class="dane">';
                toReturn += '<tr><td>Ilość wolontariuszy</td><td>' + iloscWolontariuszy + '</td></tr>';
                toReturn += '<tr><td>Ilość rozliczonych</td><td>' + iloscRozliczonych + '</td></tr>';
                toReturn += '<tr><td>Ilość liczących</td><td>' + iloscLiczących + '</td></tr>';
                toReturn += '</table>';
                //ostatni rozliczony
                toReturn += '<h2>Ostatnio rozliczeni</h2>';
                toReturn += '<table class="dane">';
                toReturn += '<tr><th>Wolontariusz</th><th>Suma</th></tr>';
                con.query("SELECT * FROM `rozliczenie`, `wolontariusz` WHERE `rozliczenie`.`wolontariuszID` = `wolontariusz`.`id` AND `rozliczenie`.`aktywne` = 1 ORDER BY `rozliczenie`.`czasRozliczenia` DESC LIMIT 5", function(err, result) {
                    if (err) throw err;
                    result.forEach(function(row) {
                        toReturn += '<tr><td>' + row.numerIdentyfikatora + '</td><td>' + (row['1gr'] + row['2gr'] * 2 + row['5gr'] * 5 + row['10gr'] * 10 + row['20gr'] * 20 + row['50gr'] * 50 + row['1zl'] * 100 + row['2zl'] * 200 + row['5zl'] * 500 + row['10zl'] * 1000 + row['20zl'] * 2000 + row['50zl'] * 5000 + row['100zl'] * 10000 + row['200zl'] * 20000 + row['500zl'] * 50000 + row.sumaZTerminala * 100)/100.0 + ' zł</td></tr>';
                    });
                    toReturn += '</table>';
                    toReturn += '</div>';
                    res.send(toReturn);
                });
            });
        });
    });
});

panelRouter.get('/sprawdzenieWysylki', function(req, res) {
    var toReturn = headerHtml("Sprawdzenie wysyłki");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Sprawdzenie wysyłki powiadomien</h1>';

    if(process.env.SENDEMAILS == 'TAK' || process.env.DISCORD == 'TAK')
    {
        toReturn += '<form action="/panel/sprawdzenieWysylki" method="POST">';
        toReturn += '<table class="dane">';
        if(process.env.SENDEMAILS == 'TAK')
            toReturn += '<tr><td>Email</td><td><input type="text" name="email"></td></tr>';
        toReturn += '</table>';
        toReturn += '<input type="submit" value="Wyślij">';
        toReturn += '</form>';
    }
    else
    {
        toReturn += 'Funkcja wyłączona';
    }
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});

panelRouter.post('/sprawdzenieWysylki', function(req, res) {
    if(process.env.SENDEMAILS == 'TAK')
        checkSendEmail(req.body.email)
    if(process.env.DISCORD == 'TAK')
        sendToDiscord("Test", "Test", 500, "BRAK")
    var toReturn = headerHtml("Sprawdzenie wysyłki");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Sprawdzenie wysyłki email</h1>';
    toReturn += 'Powiadomienia wysłane';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});

//przyjmij plik csv lub sql
panelRouter.get('/import', function(req, res) {
    var toReturn = headerHtml("Import danych");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Import danych</h1>';
    toReturn += '<p><a href="/panel/eksport">Aby zrobić kopię zapasową, kliknij tutaj</a></p>';
    toReturn += '<form action="/panel/import" method="POST" enctype="multipart/form-data">';
    toReturn += '<table class="dane">';
    toReturn += '<tr><td>Plik</td><td><input type="file" name="plik"></td></tr>';
    //toReturn += '<tr><td>Typ</td><td><select name="typ"><option value="csv">CSV</option><option value="sql">SQL</option></select></td></tr>';
    toReturn += '</table>';
    toReturn += '<input type="submit" value="Importuj">';
    toReturn += '</form>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});



panelRouter.post('/import', function(req, res) {
    if (!req.files || !req.files.plik) {
        return res.status(400).send("Nie przesłano pliku!");
    }

    const file = req.files.plik;

    // Jeżeli plik CSV, czy .csv
    if (file.name.endsWith('.csv'))
    {
        const csv = require('csv-parser');
        const fs = require('fs');
        const stripBom = require('strip-bom-stream');
        const results = [];
        
        fs.createReadStream(file.tempFilePath)
            .pipe(stripBom())
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => {
                console.log(Object.keys(data)); // Debugowanie kluczy z CSV
                
                console.log("Surowe dane:", data); // Debugowanie surowych danych z CSV
                const pesel = data.pesel ? data.pesel.trim() : "BRAK"; // Usuwanie spacji i walidacja
                console.log("PESEL po walidacji:", pesel); // Debugowanie PESEL
            
                if (data.id_number && data.full_name && data.email && data.phone) {
                    results.push({
                        id_number: data.id_number,
                        firstName: data.full_name.split(" ")[0] || "BRAK",
                        lastName: data.full_name.split(" ")[1] || "BRAK",
                        email: data.email,
                        phone: data.phone.replace(/\s|-/g, ""), 
                        pesel: pesel,
                        guardian: data.guardian || "BRAK",
                    });
                }
            })
            
            .on('end', () => {
                results.forEach(row => {
                    const query = "INSERT INTO `wolontariusz` (`id`, `numerIdentyfikatora`, `imie`, `nazwisko`, `discord`, `email`, `telefon`, `pesel`, `rodzic`, `terminal`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, 0)";
                    con.query(query, [
                        row.id_number,
                        row.firstName,
                        row.lastName,
                        "BRAK",
                        row.email,
                        row.phone,
                        row.pesel,
                        row.guardian
                    ], (err) => {
                        if (err) console.error("Błąd przy dodawaniu danych: ", err);
                    });
                });
                console.log(results);
                
                res.redirect('/panel/listaWolontariuszy');
            })
            .on('error', (err) => {
                console.error("Błąd odczytu pliku CSV: ", err);
                res.status(500).send("Wystąpił błąd podczas importu CSV.");
            });
    }
    // Jeżeli plik SQL
    /*else if (file.name.endsWith('.sql')) {
        const fs = require('fs');
        fs.readFile(file.tempFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error("Błąd odczytu pliku SQL: ", err);
                return res.status(500).send("Wystąpił błąd podczas odczytu pliku SQL.");
            }
            

            con.query(data, (err) => {
                if (err) {
                    console.error("Błąd wykonania pliku SQL: ", err);
                    return res.status(500).send("Wystąpił błąd podczas wykonywania pliku SQL.");
                }
                res.redirect('/panel/listaWolontariuszy');
            });
            
        });
    } */
    else {
        res.status(400).send("Nieobsługiwany typ pliku. Wybierz plik CSV lub SQL.");
    }
});

//eksport, wybierz całą bazę (strukturę i dane) do pliku sql
panelRouter.get('/eksport', function(req, res) {
    var toReturn = headerHtml("Eksport danych");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Eksport danych</h1>';
    toReturn += '<p>Służy tylko do kopii zapasowej, aby przywrócić wymaga oprogramowania do zarządzania bazą danych</p>';
    toReturn += '<form action="/panel/eksport" method="POST">';
    toReturn += '<input type="submit" value="Eksportuj">';
    toReturn += '</form>';
    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});

panelRouter.post('/eksport', async function(req, res) {


    var mysql2 = require('mysql2/promise');
    var con2 = await mysql2.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASS,
        port : process.env.MYSQLPORT,
        database: process.env.MYSQLDB,
        insecureAuth : true
    });

    var plikSQL = baza();

    /*const tables = [
        'liczacy',
        'login',
        'rozliczenie',
        'tokeny',
        'tokenyLiczacy',
        'wolontariusz'
    ]*/try {
        const tables = ['liczacy', 'login', 'rozliczenie', 'tokeny', 'tokenyLiczacy', 'wolontariusz'];
        let dane = [];

        for (const table of tables) {
            const [rows] = await con2.query(`SELECT * FROM ${table}`);
            rows.forEach(row => {
                const values = Object.values(row).map(value => {
                    if (value instanceof Date) {
                        // Konwersja daty na format SQL
                        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                    } else if (typeof value === 'string') {
                        // Escapowanie apostrofów w stringach
                        return `'${value.replace(/'/g, "''")}'`;
                    }
                    return value;
                });
                const columns = Object.keys(row).join(', ');
                dane.push(`INSERT INTO ${table} (${columns}) VALUES (${values.join(', ')});`);
            });
        }
        

        console.log(dane);
        plikSQL += dane.join('\n');
        //make for download
        fs.writeFileSync('eksport/export.sql', plikSQL);
        res.download('eksport/export.sql');
    } catch (err) {
        console.error('Błąd podczas eksportowania danych:', err);
        res.status(500).send('Wystąpił błąd podczas eksportowania danych.');
    } finally {
        await con2.end();
    }
});
    
panelRouter.all('/usunWolontariuszy', function(req, res) {
    //turncate wolontariusz
    con.query("TRUNCATE TABLE `wolontariusz`", function(err, result) {
        if (err) throw err;
        res.redirect('/panel/listaWolontariuszy');
    });
})

panelRouter.get('/wyslijEmaile', function(req, res) {
    //pobierz tytul i treść emaila, a potem bobierz wszystkie emaile (unikalne) i wyslij
    //treść uzupełnij za pomocą quill
    var toReturn = headerHtml("Wysyłanie emaili");
    toReturn += menuHtml(1);
    toReturn += '<div class="content">';
    toReturn += '<h1>Wysyłanie emaili</h1>';
    toReturn += '<form action="/panel/wyslijEmaile" method="POST">';
    toReturn += '<table class="dane" style="width: 100%;">';
    toReturn += '<tr><td>Temat</td><td><input type="text" name="temat"></td></tr>';
    toReturn += '<tr><td>Treść</td><td><div id="editor" style="min-height: 500px"></div><textarea name="tresc" style="display:none;"></textarea></td></tr>';
    toReturn += '</table>';
    toReturn += '<input type="submit" value="Wyślij">';
    toReturn += '</form>';
    toReturn += '<link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />';
    toReturn += '<script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>';
    toReturn += '<script>';
    toReturn += 'var quill = new Quill("#editor", {';
    toReturn += 'theme: "snow",';
    toReturn += '});';
    toReturn += 'quill.on("text-change", function() {';
    toReturn += 'document.getElementsByName("tresc")[0].value = quill.root.innerHTML;';
    toReturn += '});';
    toReturn += '</script>';

    toReturn += '</div>';
    toReturn += footerHtml(1);
    res.send(toReturn);
});
//wyświetl post
panelRouter.post('/wyslijEmaile', function(req, res) {
    //pobierz temat i treść emaila, a potem bobierz wszystkie emaile (unikalne) i wyslij
    var temat = req.body.temat;
    var tresc = req.body.tresc;
    res.send({temat: temat, tresc: tresc});
});

module.exports = panelRouter;