const express = require('express');
const api = express.Router();
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
const {makeid} = require('./func.js');

api.use(bodyParser.json());

api.post("/loginPanel", function(req, res) {
    var login = req.body.login;
    var password = req.body.password;
    console.log(req.body);
    
    con.query("SELECT * FROM login WHERE login = ? AND haslo = SHA1(?)", [login, password], function(err, result) {
        //jeżeli znajdziesz wygeneruj token i zapamiętaj go w bazie
        if (result.length > 0) {
            var token = makeid(64);
            con.query("INSERT INTO tokeny (token, userId) VALUES (?, ?)", [token, result[0].id], function(err, result) {
                res.send({response: "Zalogowano", token: token});
            });
        } else {
            res.send(403, {response: "Błędne dane logowania"});
        }
    });
});

api.post("/loginLiczacy", function(req, res) {
    var qr = req.body.qr;
    con.query("SELECT * FROM liczacy WHERE qr = ? AND aktywne = 1", [qr], function(err, result) {
        if(result.length > 0) {
            var token = makeid(64);
            con.query("INSERT INTO tokenyLiczacy (token, userId) VALUES (?, ?)", [token, result[0].id], function(err, result) {
                res.send({response: "Zalogowano", token: token});
            });
        } else {
            res.send(403, {response: "Błędny kod QR"});
        }
    });
});

const apiPanel = require('./apiPanel.js');
api.use('/panel', apiPanel);

const apiLiczacy = require('./apiLiczacy.js');
api.use('/liczacy', apiLiczacy);

api.all('*', function(req, res) {
    res.send(404, {response: "Nie znaleziono"});
});

module.exports = api;