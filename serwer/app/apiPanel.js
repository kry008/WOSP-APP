const express = require('express');
const apiPanel = express.Router();
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
var bodyParser = require('body-parser');
apiPanel.use(bodyParser.json());
const {checkPesel, loger, sendToDiscord, sendEmail, makeid, checkSendEmail, baza, massEmail} = require('./func.js');


//sprawdź czy token jest w bazie i jest 24h od generacji, jeżeli starszy zwróć że trzeba się zalogować ponownie
apiPanel.use(function(req, res, next) {
    var token = req.headers.token || req.body.token;
    con.query('SELECT * FROM tokeny, login WHERE token = ? AND tokeny.userId = login.id AND aktywny = 1', [token], function(err, result) {
        if(result.length > 0) {
            var czas = new Date(result[0].czasAktywacji);
            var now = new Date();
            if(now.getTime() - czas.getTime() > 86400000) {
                res.send(403, {response: "Zaloguj się ponownie"});
            } else {
                req.user = result[0];
                next();
            }
        }
        else {
            res.send(403, {response: "Nie jesteś zalogowany"});
        }
    });
});



apiPanel.post("/liczacy", function(req, res) {
    var imie = req.body.imie;
    var nazwisko = req.body.nazwisko;
    var qr = makeid(24);
    con.query("SELECT * FROM liczacy WHERE qr = ?", [qr], function(err, result) {
        if(result.length > 0) {
            res.send(400, {response: "Błąd, spróbuj ponownie"});
        } else {
            con.query("SELECT * FROM liczacy WHERE imie = ? AND nazwisko = ? AND aktywne = 1", [imie, nazwisko], function(err, result) {
                if(result.length > 0) {
                    res.send(403, {response: "Błąd, spróbuj ponownie, taka osoba istnieje"});
                } else {
                    con.query('INSERT INTO liczacy (imie, nazwisko, qr) VALUES (?, ?, ?)', [imie, nazwisko, qr], function(err, result) {
                        res.send({response: "Dodano", qr: qr});
                    });
                }
            });
        }
    });
});

apiPanel.get("/potwierdzRozliczenie", function(req, res) {
    con.query('SELECT * FROM rozliczenie WHERE aktywne = 1 AND weryfikowal = 0 ORDER BY czasRozliczenia DESC', function(err, result) {
        res.send(result);
    });
});

apiPanel.get("/potwierdzRozliczenie/:id", function(req, res) {
    var id = req.params.id;
    con.query('SELECT * FROM rozliczenie WHERE id = ? AND aktywne = 1 AND weryfikowal = 0', [id], function(err, result) {
        if(result.length > 0) {
            res.send(result[0]);
        } else {
            res.send(403, {response: "Błąd, spróbuj ponownie"});
        }
    });
});

apiPanel.post("/potwierdzRozliczenie/:id", function(req, res) {
    var id = req.params.id;
    var idLiczacy = req.body.idLiczacy;
    con.query('UPDATE rozliczenie SET weryfikowal = 1, idLiczacy = ? WHERE id = ? AND aktywne = 1 AND weryfikowal = 0', [idLiczacy, id], function(err, result) {
        if(result.affectedRows > 0) {
            res.send({response: "Potwierdzono"});
        } else {
            res.send(403, {response: "Błąd, spróbuj ponownie"});
        }
    });
});

module.exports = apiPanel;