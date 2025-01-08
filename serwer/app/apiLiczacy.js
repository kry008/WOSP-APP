const express = require('express');
const apiLiczacy = express.Router();
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
apiLiczacy.use(bodyParser.json());
const {loger, sendToDiscord, sendEmail, makeid, checkSendEmail, baza} = require('./func.js');

apiLiczacy.use(function(req, res, next) {
    var token = req.headers.token || req.body.token;
    con.query("SELECT * FROM tokenyLiczacy WHERE token = ? AND aktywny = 1", [token], function(err, result) {
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
//SELECT id, numerIdentyfikatora, imie, nazwisko, terminal, rodzic FROM wolontariusz WHERE aktywny = 1 AND id NOT IN (SELECT wolontariuszID FROM rozliczenie WHERE aktywne = 1) ORDER BY numerIdentyfikatora ASC
apiLiczacy.get("/rozlicz", function(req, res) {
    con.query("SELECT id, numerIdentyfikatora, imie, nazwisko, terminal, rodzic FROM wolontariusz WHERE aktywny = 1 AND id NOT IN (SELECT wolontariuszID FROM rozliczenie WHERE aktywne = 1) ORDER BY numerIdentyfikatora ASC", function(err, result) {
        res.send(result);
    });
});

apiLiczacy.post("/rozlicz", function(req, res) {
    var idWolontariusza = req.body.idWolontariusza;
    var terminal = req.body.terminal;
    var sumaZTerminala = req.body.sumaZTerminala;
    var gr1 = req.body.gr1;
    var gr2 = req.body.gr2;
    var gr5 = req.body.gr5;
    var gr10 = req.body.gr10;
    var gr20 = req.body.gr20;
    var gr50 = req.body.gr50;
    var zl1 = req.body.zl1;
    var zl2 = req.body.zl2;
    var zl5 = req.body.zl5;
    var zl10 = req.body.zl10;
    var zl20 = req.body.zl20;
    var zl50 = req.body.zl50;
    var zl100 = req.body.zl100;
    var zl200 = req.body.zl200;
    var zl500 = req.body.zl500;
    var walutaObca = req.body.walutaObca;
    var daryInne = req.body.daryInne;
    var uwagi = req.body.uwagi;
    var idLiczacy1 = req.body.idLiczacy1;
    var idLiczacy2 = req.body.idLiczacy2;
    var idLiczacy3 = req.body.idLiczacy3;
    var sala = req.body.sala;
    var sql = "INSERT INTO `rozliczenie` (`id`, `wolontariuszID`, `czasRozliczenia`, `terminal`, `sumaZTerminala`, `1gr`, `2gr`, `5gr`, `10gr`, `20gr`, `50gr`, `1zl`, `2zl`, `5zl`, `10zl`, `20zl`, `50zl`, `100zl`, `200zl`, `500zl`, `walutaObca`, `daryInne`, `uwagi`, `liczacy1`, `liczacy2`, `liczacy3`, `sala`, `weryfikowal`, `wpisaneDoBSS`, `ostatniaZmiana`, `aktywne`) ";
    sql += 'VALUES (NULL, ?, CURRENT_TIME(), ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,CURRENT_TIME(),1)';
    con.query(sql, [idWolontariusza, terminal, sumaZTerminala, gr1, gr2, gr5, gr10, gr20, gr50, zl1, zl2, zl5, zl10, zl20, zl50, zl100, zl200, zl500, walutaObca, daryInne, uwagi, idLiczacy1, idLiczacy2, idLiczacy3, sala], function(err, result) {
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
        loger(fs, 'Rozliczono wolontariusza o id: ' + idWolontariusza, 'info');
        var res = `Rozliczono wolontariusza o id: ${idWolontariusza}`
        res.send(202, {response: res});
    });
});

apiLiczacy.get("/wyloguj", function(req, res) {
    con.query('UPDATE tokenyLiczacy SET aktywny = 0 WHERE userId = ?', [req.user.id], function(err, result) {
        if (err) throw err;
        res.send(202, {response: "Wylogowano"});
    });
});


module.exports = apiLiczacy;