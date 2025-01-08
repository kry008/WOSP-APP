
//dot.env
require('dotenv').config();
var mysql = require('mysql2');

var con = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASS,
    port: process.env.MYSQLPORT,
    database: process.env.MYSQLDB,
    insecureAuth: true
});

var pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASS,
    port: process.env.MYSQLPORT,
    database: process.env.MYSQLDB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

let attempts = 0;
const maxAttempts = 5;

function tryConnect() {
    con.connect(function (err) {
        if (err) {
            attempts++;
            console.log(`Attempt ${attempts} failed: ${err.message}`);
            if (attempts < maxAttempts) {
                console.log('Retrying...');
                setTimeout(tryConnect, 2500); // Odczekaj 2.5 sekundy przed kolejną próbą
            } else {
                console.error('Failed to connect after 10 attempts.');
                process.exit(1); // Zakończ aplikację
            }
        } else {
            console.log('Connected!');
            

            var fs = require('fs');
            var express = require('express');
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
            const {headerHtml, menuHtml, footerHtml, makeid, loger} = require('./func.js');

            const panelRoutes = require('./panelRoutes.js');
            const liczacy = require('./liczacy.js');
            const apiRoutes = require('./apiRoutes.js');

            app.use('/panel', panelRoutes);
            app.use('/liczacy', liczacy);
            app.use('/api', apiRoutes);

            app.get('/', function(req, res) {
                res.redirect('/panel');
            });
            app.all('/*', function(req, res, next) {
                //save to file, route, coockies, date, time
                var date = new Date();
                var day = date.getDate();
                var month = date.getMonth() + 1;
                var year = date.getFullYear();
                var hour = date.toLocaleTimeString();
                var minute = date.toLocaleTimeString();
                var second = date.toLocaleTimeString();
                var time = hour + ':' + minute + ':' + second;
                var fullDate = year + '-' + month + '-' + day;
                var route = req.originalUrl;
                var cookies = req.headers.cookie;
                var userAgent = req.headers['user-agent'];
                var toSave = fullDate + '\t' + time + '\t' + route + '\t' + cookies || req.body.token || req.query.token || req.headers['x-access-token'] + '\t' + userAgent + '\n';
                loger(fs, toSave, 'info');
                next();
            });

            //send style.css from html folder
            app.get('/style.css', function(req, res) {
                res.sendFile(__dirname + '/css/style.css');
            });

            //static files
            app.use(express.static('static'));

            app.get('/login', function(req, res) {
                var toReturn = headerHtml();
                toReturn += menuHtml();
                toReturn += '<div class="content">';
                toReturn += '<h1>Logowanie</h1>';
                toReturn += '<form action="/login" method="POST">';
                toReturn += '<input type="text" name="login" placeholder="Login">';
                toReturn += '<input type="password" name="password" placeholder="Hasło">';
                toReturn += '<input type="submit" value="Zaloguj">';
                toReturn += '</form>';
                toReturn += '</div>';
                toReturn += footerHtml();
                res.send(toReturn);
                
            });

            app.post('/login', function(req, res) {
                var login = req.body.login;
                var password = req.body.password;
                //sprawdź czy istnieje taki login i hasło
                pool.query('SELECT * FROM login WHERE login = ? AND haslo = SHA1(?) AND aktywne = 1', [login, password], function(err, result) {
                    if (err) throw err;
                    if (result.length > 0) {
                        //utwórz token
                        var token = makeid(32);
                        //zapisz token do bazy
                        pool.query('INSERT INTO tokeny (token, typ, userId) VALUES (?, 1, ?)', [token, result[0].id], function(err, result) {
                            if (err) throw err;
                            //ustaw ciasteczko
                            res.setHeader('Set-Cookie', cookie.serialize('token', token, {
                                httpOnly: true,
                                maxAge: 60 * 60 * 24 * 7 // 1 week
                            }));
                            res.redirect('/panel')
                        });
                    } else {
                        //niepoprawne dane
                        res.redirect('/login');
                    }
                });
            });

            app.get('/loginliczacy', function(req, res) {
                //pobierz kod, 10 znaków i sprawdź czy istnieje w liczacy w polu qr
                var toReturn = headerHtml();
                toReturn += menuHtml();
                toReturn += '<div class="content">';
                toReturn += '<h1>Logowanie osoby liczącej</h1>';
                toReturn += '<form action="/loginliczacy" method="POST">';
                toReturn += '<input type="password" name="password" placeholder="Hasło">';
                toReturn += '<input type="submit" value="Zaloguj">';
                toReturn += '</form>';
                toReturn += '</div>';
                toReturn += footerHtml();
                res.send(toReturn);
            })

            app.post('/loginliczacy', function(req, res) {
                var password = req.body.password;
                //sprawdź czy istnieje taki login i hasło
                pool.query('SELECT * FROM liczacy WHERE qr = ? AND aktywne = 1', [password], function(err, result) {
                    if (err) throw err;
                    if (result.length > 0) {
                        //utwórz token
                        var token = makeid(32);
                        //zapisz token do bazy
                        pool.query('INSERT INTO tokenyLiczacy (token, typ, userId) VALUES (?, 1, ?)', [token, result[0].id], function(err, result) {
                            if (err) throw err;
                            //ustaw ciasteczko
                            res.setHeader('Set-Cookie', cookie.serialize('liczacy', token, {
                                httpOnly: true,
                                maxAge: 60 * 60 * 24 * 7 // 1 week
                            }));
                            res.redirect('/liczacy')
                        });
                    } else {
                        //niepoprawne dane
                        res.redirect('/loginliczacy');
                    }
                });
            })


            app.all("/panel", function(req, res) {
                //redirect to /panel/home
                res.redirect('/panel/home');
            });

            app.all('/statystyki2', function(req, res) {
                var toReturn = headerHtml("Statystyki");
                toReturn += menuHtml(0);
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
                pool.query('SELECT * FROM rozliczenie WHERE aktywne = 1', function(err, result) {
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
                    pool.query('SELECT numerIdentyfikatora, imie, nazwisko, suma FROM `SumaZebranaPrzezWolontariuszy` ORDER BY `SumaZebranaPrzezWolontariuszy`.`suma` ASC LIMIT 10;', function(err, result) {
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
                        pool.query("SELECT idLiczacego, imie, nazwisko, sumaPrzeliczona FROM `sumaPrzeliczona` ORDER BY `sumaPrzeliczona`.`sumaPrzeliczona` DESC LIMIT 10;", function(err, result) {
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

            app.all('/logout', function(req, res) {
                //sprawdź czy token istnieje i jest aktywny
                var cookies = cookie.parse(req.headers.cookie || '');
                var token = cookies.token;
                pool.query('UPDATE tokeny SET aktywny = 0 WHERE token = ?', [token], function(err, result) {
                    if (err) throw err;
                    res.redirect('/panel/login');
                    loger(fs, 'Wylogowano użytkownika ' + req.user.kto, 'info');
                });
            });

            //404
            app.all('/*', function(req, res, next) {
                var toReturn = headerHtml();
                toReturn += menuHtml(2);
                toReturn += '<div class="content">';
                toReturn += '<h1>404</h1>';
                toReturn += '</div>';
                toReturn += footerHtml();
                res.status(404).send(toReturn);

                
            });
            app.listen(process.env.PORT || 8880, function() {
                console.log('Example app listening on port http://localhost:' + process.env.PORT || 8880 + '!');
            });

        }
    });
}

tryConnect();
