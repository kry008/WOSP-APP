const express = require('express');
const liczacy = express.Router();
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
//import functions from func.js
const {headerHtml, menuHtml, footerHtml, checkPesel, loger, telefon, sendToDiscord, sendEmail} = require('./func.js');
liczacy.use(function(req, res, next) {
    var cookies = cookie.parse(req.headers.cookie || '');
    var liczacy = cookies.liczacy;
    con.query('SELECT * FROM tokenyLiczacy, liczacy WHERE token = ? AND aktywny = 1 AND tokenyLiczacy.userId = liczacy.id', [liczacy], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            req.user = result[0];
            next();
        } else {
            res.redirect('/loginliczacy');
            loger(fs, 'Nieudana próba dostępu do panelu liczącego przy użyciu tokenu: ' + liczacy, 'warning');
        }
    });
});

liczacy.get('/', function(req, res) {
    var toReturn = headerHtml();
    toReturn += menuHtml(4);
    toReturn += '<div class="content">';
    toReturn += '<h1>Panel</h1>';
    toReturn += '<h2>Witaj ' + req.user.imie + '</h2>';
    toReturn += '<div class="kafelki3">';
    toReturn += '<a class="borderColorBlue" href="/liczacy/rozlicz">Rozlicz wolontariusza</a>';
    toReturn += '<a class="borderColorPurple" href="/liczacy/wyloguj">Wyloguj się</a>';
    toReturn += '</div>';
    toReturn += '</div>';
    toReturn += footerHtml(2);
    res.send(toReturn);
})

liczacy.all('/statystyki2', function(req, res) {
    var toReturn = headerHtml("Statystyki");
    toReturn += menuHtml(4);
    //make script to refresh every 5 seconds, and full screen this page
    toReturn += '<script>';
    toReturn += "var elem = document.documentElement;"
    toReturn += "if (elem.requestFullscreen) {";
    toReturn += "elem.requestFullscreen();";
    toReturn += "} else if (elem.mozRequestFullScreen) {";
    toReturn += "elem.mozRequestFullScreen();";
    toReturn += "} else if (elem.webkitRequestFullscreen) {";
    toReturn += "elem.webkitRequestFullscreen();";
    toReturn += "} else if (elem.msRequestFullscreen) {";
    toReturn += "elem.msRequestFullscreen();";
    toReturn += "}";
    toReturn += 'setTimeout(function() {';
    toReturn += 'window.location.reload(1);';
    toReturn += '}, 5000);';
    toReturn += '</script>';

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
        toReturn += '<tr><th>Wolontariusz</th><th>Suma</th></tr>';
        con.query('SELECT numerIdentyfikatora, imie, nazwisko, suma FROM `SumaZebranaPrzezWolontariuszy` ORDER BY `SumaZebranaPrzezWolontariuszy`.`suma` ASC LIMIT 10;', function(err, result) {
            if (err) throw err;
            result.forEach(function(row) {
                toReturn += '<tr><td>' + row.numerIdentyfikatora + '</td><td>' + row.suma + '</td></tr>';
            });
            toReturn += '</table>';
            toReturn += '</div>';
            toReturn += '<div class="kafelek2">';
            //który liczący najwięcej liczył
            toReturn += '<h2>Najwięcej puszek przeliczonych</h2>';
            toReturn += '<table class="dane">';
            toReturn += '<tr><th>Liczący</th><th>Suma</th></tr>';
            con.query("SELECT idLiczacego, imie, nazwisko, sumaPrzeliczona FROM `sumaPrzeliczona` ORDER BY `sumaPrzeliczona`.`sumaPrzeliczona` DESC LIMIT 10;", function(err, result) {
                if (err) throw err;
                result.forEach(function(row) {
                    toReturn += '<tr><td>' + row.idLiczacego + '</td><td>' + row.sumaPrzeliczona + '</td></tr>';
                });
                toReturn += '</table>';
                toReturn += '</div>';
                toReturn += '</div>';
                toReturn += footerHtml();
                res.send(toReturn);
            })
            
        });
    });
});


liczacy.get('/rozlicz', function(req, res) {
    var toReturn = headerHtml("Lista wolontariuszy do rozliczenia");
    toReturn += menuHtml(4);
    toReturn += '<div class="content">';
    toReturn += '<h1>Rozlicz</h1>';
    toReturn += '<table class="dane">';
    toReturn += '<tr>';
    toReturn += '<th>Numer</th>';
    toReturn += '<th>Imię</th>';
    toReturn += '<th>Nazwisko</th>';
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
            toReturn += '<td>' + (row.terminal == 1 ? '<b>Tak</b>' : 'Nie') + '</td>';
            if(row.rodzic == "BRAK")
                toReturn += '<td> </td>';
            else
                toReturn += '<td style="color: red; font-weight: bold;">' + row.rodzic + '</td>';
            toReturn += '<td><a href="/liczacy/rozliczWolontariusza?id=' + row.id + '">Rozlicz</a></td>';
            toReturn += '</tr>';
        });
        toReturn += '</table>';
        toReturn += '</div>';
        toReturn += footerHtml(2);
        res.send(toReturn);
    });
});


liczacy.get('/rozliczWolontariusza', function(req, res) {
    var idWolontariusza = req.query.id;
    //pobierz dane wolontariusza, wyświetl formularz rozliczenia
    var toReturn = headerHtml("Rozlicz wolontariusza");
    toReturn += menuHtml(4);
    toReturn += '<div class="content">';
    toReturn += '<h1>Rozlicz wolontariusza</h1>';
    toReturn += '<form action="/liczacy/rozliczWolontariusza?id=' + idWolontariusza + '" method="POST">';
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
            toReturn += '<tr><td>Liczący 1</td><td>' + req.user.imie + ' ' + req.user.nazwisko + '</td></tr>';
            console.log(req.user);
            
            toReturn += '<input type="hidden" name="liczacy1" value="' + req.user.id + '">';

            //liczący 2
            toReturn += '<tr><td>Liczący 2</td><td><select name="liczacy2">';
            //pobierz wszystkich liczących
            con.query('SELECT * FROM liczacy WHERE aktywne = 1 ORDER BY nazwisko ASC', function(err, result) {
                if (err) throw err;
                result.forEach(function(row) {
                    //jeżeli id liczącego == req.user.id, pomiń
                    if(row.id == req.user.id) return;
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
                        if(row.id == req.user.id) return;
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
                    toReturn += footerHtml(2);
                    res.send(toReturn);
                });
            });
            
        }
    });
}); 
liczacy.post('/rozliczWolontariusza', function(req, res) {
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
    $sql += 'VALUES (NULL, ?, CURRENT_TIME(), ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,CURRENT_TIME(),1)';
    con.query($sql, [idWolontariusza, terminal, sumaZTerminala, gr1, gr2, gr5, gr10, gr20, gr50, zl1, zl2, zl5, zl10, zl20, zl50, zl100, zl200, zl500, walutaObca, daryInne, uwagi, idLiczacy1, idLiczacy2, idLiczacy3, sala], function(err, result) {
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
        res.redirect('/liczacy/rozliczenia#'+idWolontariusza);
        loger(fs, 'Rozliczono wolontariusza o id: ' + idWolontariusza, 'info');
    });
});


liczacy.get("/szybkieInfo", function(req, res) {
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
liczacy.all('/wyloguj', function(req, res) {
    //tokenyLiczacy ustaw aktywny na 0
    con.query('UPDATE tokenyLiczacy SET aktywny = 0 WHERE userId = ?', [req.user.id], function(err, result) {
        if (err) throw err;
        res.clearCookie('liczacy');
        res.redirect('/loginliczacy');
    });
});

module.exports = liczacy;