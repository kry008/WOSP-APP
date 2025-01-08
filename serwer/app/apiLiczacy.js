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
                next();
            }
        }
        else {
            res.send(403, {response: "Nie jesteś zalogowany"});
        }
    });
});


module.exports = apiLiczacy;