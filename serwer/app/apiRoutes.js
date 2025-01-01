const express = require('express');
const route = express.Router();
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
const {makeid, loger} = require('./func.js');

//login via api
route.post('/', function(req, res) {
    //in post there is login and password (already hashed)
    console.log(req.body);
    var login = req.body.login;
    var password = req.body.password;
    con.query('SELECT * FROM login WHERE login = ? AND haslo = ? AND aktywne = 1', [login, password], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            var token = makeid(32);
            con.query('INSERT INTO tokeny (token, typ, userId) VALUES (?, 1, ?)', [token, result[0].id], function(err, result) {
                if (err) throw err;
                res.cookie('token', token);
                res.json({status: 'ok', token: token});
                loger(fs, 'Użytkownik zalogował się do panelu, token: ' + token, 'info');
            });
        }
        else {
            //send code 401
            res.status(401).json({status: 'error'});
            loger(fs, 'Użytkownik nie zalogował się do panelu, login: ' + login, 'error');
        }
    });
});
route.use(function(req, res, next) {
    var cookies = cookie.parse(req.headers.cookie || '') ||  req.body.token || req.query.token || req.headers['x-access-token'];
    var token = cookies.token;
    con.query('SELECT * FROM tokeny, login WHERE token = ? AND tokeny.userId = login.id AND aktywny = 1', [token], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            req.user = result[0];
            next();
        } else {
            res.json({status: 'not logged', goTo: '/api'});
            loger(fs, 'Użytkownik nie zalogował się do panelu, token: ' + token, 'error');
        }
    });
});

route.all("/test", function(req, res) {
    res.json({status: 'ok'});
    loger(fs, 'Użytkownik wykonał test', 'info');
});

route.get("/osobyLiczace", function(req, res) {
    con.query('SELECT * FROM liczacy WHERE aktywne = 1', function(err, result) {
        if (err) throw err;
        res.json(result);
        loger(fs, 'Użytkownik wyświetlił listę osób liczących', 'info');
    });
});

route.post("/osobyLiczace", function(req, res) {
    //sprawdzenie czy nie ma już takiej osoby
    con.query('SELECT * FROM liczacy WHERE imie = ? AND nazwisko = ? AND aktywne = 1', [req.body.imie, req.body.nazwisko], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            res.json({status: 'error', message: 'Taka osoba już istnieje.'});
            loger(fs, 'Użytkownik próbował dodać osobę liczącą, która już istnieje', 'error');
        } else {
            con.query('INSERT INTO liczacy (imie, nazwisko) VALUES (?, ?)', [req.body.imie, req.body.nazwisko], function(err, result) {
                if (err) throw err;
                res.json({status: 'ok'});
                loger(fs, 'Użytkownik dodał osobę liczącą', 'info');
            });
        }
    });
});

route.get("/listaWolontariuszy", function(req, res) {
    con.query('SELECT * FROM wolontariusz WHERE aktywny = 1', function(err, result) {
        if (err) throw err;
        res.json(result);
        loger(fs, 'Użytkownik wyświetlił listę wolontariuszy', 'info');
    });
});
//edycja wolontariusza
route.put("/listaWolontariuszy", function(req, res) {
    con.query('UPDATE wolontariusz SET imie = ?, nazwisko = ?, discord = ?, email = ?, telefon = ?, pesel = ?, terminal = ?, aktywny = ? WHERE id = ?', [req.body.imie, req.body.nazwisko, req.body.discord, req.body.email, req.body.telefon, req.body.pesel, req.body.terminal, req.body.aktywny, req.body.id], function(err, result) {
        if (err) throw err;
        res.json({status: 'ok'});
        loger(fs, 'Użytkownik edytował wolontariusza', 'info');
    });
});
//dodanie rozliczenia
route.post("/rozlicz", function(req, res) {
    //sprawdzenie czy nie ma już takiego wolontariusza
    con.query('SELECT * FROM rozliczenie WHERE wolontariuszID = ? AND aktywne = 1', [req.body.wolontariuszID], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            res.json({status: 'error', message: 'Taki wolontariusz już rozliczony.'});
            loger(fs, 'Użytkownik próbował dodać rozliczenie, które już istnieje ID: ' + req.body.wolontariuszID, 'error');
        } else {
            $sql = "INSERT INTO `rozliczenie` (`id`, `wolontariuszID`, `czasRozliczenia`, `terminal`, `sumaZTerminala`, `1gr`, `2gr`, `5gr`, `10gr`, `20gr`, `50gr`, `1zl`, `2zl`, `5zl`, `10zl`, `20zl`, `50zl`, `100zl`, `200zl`, `500zl`, `walutaObca`, `daryInne`, `uwagi`, `liczacy1`, `liczacy2`, `liczacy3`, `sala`, `weryfikowal`, `wpisaneDoBSS`, `ostatniaZmiana`, `aktywne`) ";
            $sql += 'VALUES (NULL, ?, CURRENT_TIME(), ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,CURRENT_TIME(),1)';
            con.query($sql, [req.body.wolontariuszID, req.body.terminal, req.body.sumaZTerminala, req.body['1gr'], req.body['2gr'], req.body['5gr'], req.body['10gr'], req.body['20gr'], req.body['50gr'], req.body['1zl'], req.body['2zl'], req.body['5zl'], req.body['10zl'], req.body['20zl'], req.body['50zl'], req.body['100zl'], req.body['200zl'], req.body['500zl'], req.body.walutaObca, req.body.daryInne, req.body.uwagi, req.body.liczacy1, req.body.liczacy2, req.body.liczacy3, req.body.sala, req.body.weryfikowal], function(err, result) {
                if (err) throw err;
                res.json({status: 'ok'});
                loger(fs, 'Użytkownik dodał rozliczenie dla wolontariusza ID: ' + req.body.wolontariuszID, 'info');
            });
        }
    });
});
//lista rozliczeń
route.get("/rozliczenia", function(req, res) {
    con.query('SELECT * FROM rozliczenie WHERE aktywne = 1', function(err, result) {
        if (err) throw err;
        res.json(result);
        loger(fs, 'Użytkownik wyświetlił listę rozliczeń', 'info');
    });
});
//edycja rozliczenia
route.put("/rozliczenia", function(req, res) {
    con.query('UPDATE rozliczenie SET wolontariuszID = ?, czasRozliczenia = ?, terminal = ?, sumaZTerminala = ?, `1gr` = ?, `2gr` = ?, `5gr` = ?, `10gr` = ?, `20gr` = ?, `50gr` = ?, `1zl` = ?, `2zl` = ?, `5zl` = ?, `10zl` = ?, `20zl` = ?, `50zl` = ?, `100zl` = ?, `200zl` = ?, `500zl` = ?, walutaObca = ?, daryInne = ?, uwagi = ?, liczacy1 = ?, liczacy2 = ?, liczacy3 = ?, sala = ?, weryfikowal = ?, wpisaneDoBSS = ?, ostatniaZmiana = ? WHERE id = ?', [req.body.wolontariuszID, req.body.czasRozliczenia, req.body.terminal, req.body.sumaZTerminala, req.body['1gr'], req.body['2gr'], req.body['5gr'], req.body['10gr'], req.body['20gr'], req.body['50gr'], req.body['1zl'], req.body['2zl'], req.body['5zl'], req.body['10zl'], req.body['20zl'], req.body['50zl'], req.body['100zl'], req.body['200zl'], req.body['500zl'], req.body.walutaObca, req.body.daryInne, req.body.uwagi, req.body.liczacy1, req.body.liczacy2, req.body.liczacy3, req.body.sala, req.body.weryfikowal, req.body.wpisaneDoBSS, req.body.ostatniaZmiana, req.body.id], function(err, result) {
        if (err) throw err;
        res.json({status: 'ok'});
        loger(fs, 'Użytkownik edytował rozliczenie ID: ' + req.body.id, 'info');
    });
});

//statystyki
route.get("/statystyki/zebranePrzezWolontariuszy", function(req, res) {
    con.query('SELECT * FROM SumaZebranaPrzezWolontariuszy ORDER BY suma ASC', function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});

route.get("/statystyki/liczacy", function(req, res) {
    con.query('SELECT * FROM sumaPrzeliczona ORDER BY sumaPrzeliczona DESC', function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});

route.get("/statystyki/rozliczenia", function(req, res) {
    con.query('SELECT COUNT(*) AS liczba FROM rozliczenie WHERE aktywne = 1', function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});

route.get("/statystyki/rozliczenia/ostatnie", function(req, res) {
    con.query('SELECT * FROM rozliczenie WHERE aktywne = 1 ORDER BY czasRozliczenia DESC LIMIT 10', function(err, result) {
        if (err) throw err;
        res.json(result);
    });
});



module.exports = route;