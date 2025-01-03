function headerHtml(tytul = 'WOŚP ELEKTRONIK') {
    return '<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + tytul +'</title><link rel="stylesheet" href="/style.css"></head><body><div id="container">';
}
function menuHtml($login = 0) {
    var toReturn = '<div class="menu">';
    toReturn += '<a href="#"><img src="'+ process.env.LOGO +'" height="50px"></a>';
    if ($login == 1) {
        toReturn += '<a href="/panel/home">Panel</a>';
        toReturn += '<a href="/panel/rozlicz">Rozlicz</a>';
        toReturn += '<a href="/panel/rozliczenia">Rozliczenia</a>';
        toReturn += '<a href="/panel/potwierdz">Potwierdź rozliczenie</a>';
        toReturn += '<a href="/panel/osobyLiczace">Osoby liczące</a>';
        toReturn += '<a href="/panel/listaWolontariuszy">Lista wolontariuszy</a>';
        toReturn += '<a href="/panel/druki">Druki</a>';
        toReturn += '<a href="/panel/statystyki">Statystyki</a>';
        toReturn += '<a href="/panel/logout">Wyloguj</a>';
    } else if ($login == 2) {
        //wróć js
        toReturn += '<a onclick="wroc()">Wróć</a>';
        toReturn += '<a href="/statystyki2">Statystyki</a>';
        toReturn += '<a href="/login">Zaloguj</a>';
    } 
    else if ($login == 3) {
        toReturn += '<a href="/panel">Rozlicz wolontariusza</a>';
        toReturn += '<a href="/statystyki2">Statystyki</a>';
        toReturn += '<a href="/loginliczacy">Zaloguj</a>';
    }
    else if ($login == 4) {
        toReturn += '<a href="/liczacy">Panel</a>';
        toReturn += '<a href="/liczacy/rozlicz">Rozlicz</a>';
        toReturn += '<a href="/liczacy/statystyki2">Statystyki</a>';
        toReturn += '<a href="/liczacy/wyloguj">Wyloguj</a>';
    } else {
        toReturn += '<a href="/statystyki2">Statystyki</a>';
        toReturn += '<a href="/login">Zaloguj do panelu</a>';
        toReturn += '<a href="/loginliczacy">Zaloguj osoba licząca</a>';
    }
    return toReturn + '</div>';
}

function footerHtml(login = 0, email = 0) {
    var toReturn = '';
    if(login == 1)
    {
        toReturn = '<div id="mySidenav" class="sidenav">';
        toReturn += '<a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>';
        toReturn += '<iframe src="/panel/szybkieInfo"></iframe>';
        toReturn += '</div>';
        toReturn += '<a><span onclick="openNav()" class="menuOpen">|||</span></a>';
        toReturn += '<script>function openNav() {document.getElementById("mySidenav").style.width = "300px";}</script>';
        toReturn += '<script>function closeNav() {document.getElementById("mySidenav").style.width = "0";}</script>';
    }
    if(login == 2)
    {
        toReturn = '<div id="mySidenav" class="sidenav">';
        toReturn += '<a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>';
        toReturn += '<iframe src="/liczacy/szybkieInfo"></iframe>';
        toReturn += '</div>';
        toReturn += '<a><span onclick="openNav()" class="menuOpen">|||</span></a>';
        toReturn += '<script>function openNav() {document.getElementById("mySidenav").style.width = "300px";}</script>';
        toReturn += '<script>function closeNav() {document.getElementById("mySidenav").style.width = "0";}</script>';
    }
    if(login != 0)
        toReturn += '<script>function wroc() {history.back();}</script>';
    toReturn += '<footer style="text-align: center">';
    info = email != 1 ? "Jeżeli chcesz wesprzeć autora, możesz to wykonać na <a href='https://patronite.pl/kry008' target='_blank'>Patronite</a>" : '';
    if (new Date().getFullYear() > 2023)
        toReturn += '<span>Stworzone przez <a href="https://kry008.xyz">KRY008</a> dla sztabu '+ process.env.SZTAB + ' &copy; 2023-' + new Date().getFullYear() + '';
    else
        toReturn += '<span>Stworzone przez <a href="https://kry008.xyz">KRY008</a> dla sztabu '+ process.env.SZTAB + ' &copy; 2023';
    return toReturn + "<br>Wersja programu: " + process.env.VERSION + '<br>'+ info +'</span></footer></div></body></html>';

    
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

//sprawdzanie kiedy PESEL ma 18 lat, czy minęło 16 lat od daty urodzenia, data sprawdzenia to 28 stycznia 2024
function checkPesel(pesel) {
    //pobierz datę urodzenia
    // Wycinamy daty z numeru
    var rok = parseInt(pesel.substring(0, 2), 10);
    var miesiac = parseInt(pesel.substring(2, 4), 10) - 1;
    var dzien = parseInt(pesel.substring(4, 6), 10);
    // Pesel został wprowadzony w 20 wieku, ale zawiera modyfikatory na przysłość
    // Miesiąc zawiera dodatkowe liczby dla dat z przyszłości.
    if (miesiac > 80) {
        rok = rok + 1800;
        miesiac = miesiac - 80;
    } else if (miesiac >= 60) {
        rok = rok + 2200;
        miesiac = miesiac - 60;
    } else if (miesiac >= 40) {
        rok = rok + 2100;
        miesiac = miesiac - 40;
    } else if (miesiac >= 20) {
        rok = rok + 2000;
        miesiac = miesiac - 20;
    } else {
        rok += 1900;
    }
    if( miesiac >=0 && miesiac < 12 && dzien > 0 && dzien < 32 ) {
    // Daty sa ok. Teraz ustawiamy.
        var urodzony = new Date();
        urodzony.setFullYear(rok, miesiac, dzien);
    } else {
        var urodzony = false;
    }
    //sprawdź czy minęło 18 lat
    var today = new Date(process.env.DATAFINALU);
    var diff = today - urodzony;
    var age = Math.floor(diff/31557600000);
    if(age >= 16)
        return true;
    else
        return false;
}

function loger(fs, text, type = 'info') {
    if(process.env.LOGS == '1')
    {
        var date = new Date();
        var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        console.log('[' + time + ']\t' + type + ': ' + text);
        if(process.platform == 'win32')
            fs.appendFileSync('logs\\' + date.getDate() + '-' + (date.getMonth() + 1) +'log.txt', '[' + time + ']\t' + type + ': ' + text + '\r\n');
        else
            fs.appendFileSync('logs/' + date.getDate() + '-' + (date.getMonth() + 1) +'log.txt', '[' + time + ']\t' + type + ': ' + text + '\n');
    }
        
}

function peselToShow(pesel, nrId) {
    //weź pierwsze 3 znaki nrId
    nrId = nrId.substring(0, 3);
    nrId = parseInt(nrId) % 9;
    if (nrId == 0)
        nrId = 4;
    //pokaż co nrId znak, resztę zastąp x
    var result = '';
    var counter = 0;
    while (counter < pesel.length) {
        if (counter % nrId == 0)
            result += pesel[counter] + '&nbsp;';
        else
            result += '█&nbsp;';
        counter += 1;
    }
    return result;
}

//telefon, zwraca telefon w formacje +48XXXXXXXXX, możliwe podanie +48XXXXXXXXX/XXXXXXXXX/48XXXXXXXXX/XXX-XXX-XXX/XXX XXX XXX
function telefon(telefon, withLink = 0) {
    telefon = telefon.replace(/\s/g, '');
    telefon = telefon.replace(/-/g, '');
    telefon = telefon.replace(/\//g, '');
    if (telefon.substring(0, 1) == '+')
        telefon = telefon.substring(1, telefon.length);
    if (telefon.substring(0, 2) == '48')
        telefon = telefon.substring(2, telefon.length);
    if (telefon.substring(0, 3) == '0048')
        telefon = telefon.substring(3, telefon.length);
    if (telefon.length == 9)
        telefon = '48' + telefon;
    if (telefon.length == 11)
        telefon = telefon.substring(2, telefon.length);
    if (telefon.length == 12)
        telefon = telefon.substring(3, telefon.length);
    if (telefon.length == 0)
        telefon = '000000000';
    if(withLink == 1)
        return '<a href="tel:' + telefon + '">' + telefon + '</a>';
    else
        return telefon;
}

//random color
function randomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    var counter = 0;
    while (counter < 6) {
      color += letters[Math.floor(Math.random() * 16)];
      counter += 1;
    }
    return color;
}

function sendToDiscord(imie, nazwisko, suma, nickDC)
{
    const { Webhook, MessageBuilder } = require('discord-webhook-node');
    const hook = new Webhook(process.env.DISCORDWEBHOOK);
    if(nickDC == 'BRAK')
    {
        const embed = new MessageBuilder()
        .setTitle(imie + ' ' + nazwisko)
        .setColor(randomColor())
        .setAuthor("Bot by KRY008", "https://raw.githubusercontent.com/kry008/kry008.xyz/main/images/logo.webp", "https://kry008.xyz")
        .setDescription('Dorzuca się kwotą: ' + suma + ' zł')
        .setFooter('Rozliczenie', process.env.LOGO)
        .setTimestamp();
        //console.log(embed);
        hook.send(embed);
    }
    else
    {
        //mention user nickDC
        const embed = new MessageBuilder()
        .setTitle(imie + ' ' + nazwisko)
        .setColor(randomColor())
        .setAuthor("Bot by KRY008", "https://raw.githubusercontent.com/kry008/kry008.xyz/main/images/logo.webp", "https://kry008.xyz")
        .setDescription('Dorzuca się kwotą: ' + suma + ' zł')
        .setFooter('Rozliczenie' + nickDC, process.env.LOGO)
        .setTimestamp();
        //console.log(embed);
        hook.send(embed);
    }
}

function sendEmail(imie, nazwisko, suma, email)
{
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTPHOST,
        port: process.env.SMTPPORT,
        secure: true,
        auth: {
            user: process.env.SMTPLOGIN,
            pass: process.env.SMTPPASS
        }
    });
    const mailOptions = {
        from: process.env.SMTPLOGIN,
        to: email,
        subject: 'Twoje rozliczenie w ' + process.env.NRFINALU + '. Finale WOŚP',
        html: '<img src="' + process.env.LOGO + '" height="150px" style="display: block; margin-left: auto; margin-right: auto;"><h1 style="text-align: center;">Rozliczenie</h1><h2 style="text-align: center;">Witaj ' + imie + ' ' + nazwisko + ',<br>Twoja suma z rozliczenia to: ' + suma + ' zł.</h2><p style="text-align: center;">Dziękujemy za udział w WOŚP!</p><p style="text-align: center;">Pozdrawiamy,<br>' + process.env.SZTAB + '</p>' + footerHtml(0,1)
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            loger(fs, 'Błąd wysyłania maila do ' + imie + ' ' + nazwisko + ' (' + email + ')', 'error');
        } else {
            console.log('Email został wysłany: ' + info.response);
            loger(fs, 'Email został wysłany do ' + imie + ' ' + nazwisko + ' (' + email + ') ' + info.response, 'info');
        }
    });
}


function checkSendEmail(email)
{
    const nodemailer = require('nodemailer');
    const fs = require('fs');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTPHOST,
        port: process.env.SMTPPORT,
        secure: true,
        auth: {
            user: process.env.SMTPLOGIN,
            pass: process.env.SMTPPASS
        }
    });
    const mailOptions = {
        from: process.env.SMTPLOGIN,
        to: email,
        subject: 'Twoje rozliczenie w ' + process.env.NRFINALU + '. Finale WOŚP',
        html: '<img src="' + process.env.LOGO + '" height="150px" style="display: block; margin-left: auto; margin-right: auto;"><h1 style="text-align: center;">Rozliczenie</h1><h2 style="text-align: center;">Witaj Test,<br>Twoja suma z rozliczenia to: 0 zł.</h2><p style="text-align: center;">Dziękujemy za udział w WOŚP!</p><p style="text-align: center;">Pozdrawiamy,<br>' + process.env.SZTAB + '</p>' + footerHtml(0,1)
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            loger(fs, 'Błąd wysyłania maila', 'error');
            return 1;
        } else {
            console.log('Email został wysłany: ' + info.response);
            loger(fs, 'Email został wysłany do', 'info');
            return 0;
        }
    });
}


function baza()
{
    var toSend = `CREATE TABLE IF NOT EXISTS \`liczacy\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`imie\` varchar(255) NOT NULL,
  \`nazwisko\` varchar(255) NOT NULL,
  \`aktywne\` tinyint(1) NOT NULL DEFAULT 1,
  \`qr\` varchar(25) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`login\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`login\` text NOT NULL,
  \`haslo\` text NOT NULL,
  \`kto\` text NOT NULL,
  \`aktywne\` int(11) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`rozliczenie\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`wolontariuszID\` int(11) NOT NULL,
  \`czasRozliczenia\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`terminal\` tinyint(1) NOT NULL DEFAULT 0,
  \`sumaZTerminala\` float DEFAULT NULL,
  \`1gr\` int(11) DEFAULT NULL,
  \`2gr\` int(11) DEFAULT NULL,
  \`5gr\` int(11) DEFAULT NULL,
  \`10gr\` int(11) DEFAULT NULL,
  \`20gr\` int(11) DEFAULT NULL,
  \`50gr\` int(11) DEFAULT NULL,
  \`1zl\` int(11) DEFAULT NULL,
  \`2zl\` int(11) DEFAULT NULL,
  \`5zl\` int(11) DEFAULT NULL,
  \`10zl\` int(11) DEFAULT NULL,
  \`20zl\` int(11) DEFAULT NULL,
  \`50zl\` int(11) DEFAULT NULL,
  \`100zl\` int(11) DEFAULT NULL,
  \`200zl\` int(11) DEFAULT NULL,
  \`500zl\` int(11) DEFAULT NULL,
  \`walutaObca\` text NOT NULL,
  \`daryInne\` text DEFAULT NULL,
  \`uwagi\` text DEFAULT NULL,
  \`liczacy1\` int(11) NOT NULL,
  \`liczacy2\` int(11) NOT NULL,
  \`liczacy3\` int(11) DEFAULT NULL,
  \`sala\` varchar(10) NOT NULL,
  \`weryfikowal\` int(11) NOT NULL,
  \`wpisaneDoBSS\` tinyint(1) NOT NULL DEFAULT 0,
  \`ostatniaZmiana\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  \`aktywne\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  KEY \`wolontariuszID\` (\`wolontariuszID\`),
  KEY \`liczacy1\` (\`liczacy1\`),
  KEY \`liczacy2\` (\`liczacy2\`),
  KEY \`liczacy3\` (\`liczacy3\`),
  KEY \`weryfikowal\` (\`weryfikowal\`)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS \`sumaPrzeliczona\` (
\`idLiczacego\` int(11)
,\`imie\` varchar(255)
,\`nazwisko\` varchar(255)
,\`sumaPrzeliczona\` decimal(65,2)
);
CREATE TABLE IF NOT EXISTS \`sumaPrzeliczona1\` (
\`idLiczacego\` int(11)
,\`imie\` varchar(255)
,\`nazwisko\` varchar(255)
,\`sumaPrzeliczona\` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS \`sumaPrzeliczona2\` (
\`idLiczacego\` int(11)
,\`imie\` varchar(255)
,\`nazwisko\` varchar(255)
,\`sumaPrzeliczona\` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS \`sumaPrzeliczona3\` (
\`idLiczacego\` int(11)
,\`imie\` varchar(255)
,\`nazwisko\` varchar(255)
,\`sumaPrzeliczona\` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS \`SumaZebranaPrzezWolontariuszy\` (
\`numerIdentyfikatora\` varchar(8)
,\`imie\` varchar(255)
,\`nazwisko\` varchar(255)
,\`suma\` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS \`suma_przeliczona2\` (
\`ID_Liczącego\` int(11)
,\`Imię\` varchar(255)
,\`Nazwisko\` varchar(255)
,\`Suma_Przeliczona\` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS \`sumy\` (
\`wolontariuszID\` int(11)
,\`suma\` decimal(49,2)
);

CREATE TABLE IF NOT EXISTS \`tokeny\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`token\` text NOT NULL,
  \`czasAktywacji\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`typ\` int(11) NOT NULL DEFAULT 1,
  \`userId\` int(11) NOT NULL,
  \`aktywny\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  KEY \`userId\` (\`userId\`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`tokenyLiczacy\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`token\` varchar(255) NOT NULL,
  \`typ\` int(11) NOT NULL,
  \`userId\` int(11) NOT NULL,
  \`czasAktywacji\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`aktywny\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`wolontariusz\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`numerIdentyfikatora\` varchar(8) NOT NULL,
  \`imie\` varchar(255) NOT NULL,
  \`nazwisko\` varchar(255) NOT NULL,
  \`discord\` text NOT NULL,
  \`email\` text NOT NULL,
  \`telefon\` varchar(12) NOT NULL,
  \`pesel\` varchar(11) NOT NULL,
  \`rodzic\` varchar(255) NOT NULL DEFAULT 'BRAK',
  \`terminal\` tinyint(1) NOT NULL DEFAULT 0,
  \`ostatniaZmiana\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  \`aktywny\` tinyint(4) NOT NULL DEFAULT 1,
  \`zaznacz\` int(11) NOT NULL DEFAULT 0,
  \`puszkaWydana\` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
DROP TABLE IF EXISTS \`sumaPrzeliczona\`;

CREATE OR REPLACE VIEW \`sumaPrzeliczona\`  AS SELECT \`combinedData\`.\`idLiczacego\` AS \`idLiczacego\`, \`combinedData\`.\`imie\` AS \`imie\`, \`combinedData\`.\`nazwisko\` AS \`nazwisko\`, sum(\`combinedData\`.\`sumaPrzeliczona\`) AS \`sumaPrzeliczona\` FROM (select \`r\`.\`liczacy1\` AS \`idLiczacego\`,\`l\`.\`imie\` AS \`imie\`,\`l\`.\`nazwisko\` AS \`nazwisko\`,sum(\`r\`.\`1gr\` * 0.01 + \`r\`.\`2gr\` * 0.02 + \`r\`.\`5gr\` * 0.05 + \`r\`.\`10gr\` * 0.1 + \`r\`.\`20gr\` * 0.2 + \`r\`.\`50gr\` * 0.5 + \`r\`.\`1zl\` * 1 + \`r\`.\`2zl\` * 2 + \`r\`.\`5zl\` * 5 + \`r\`.\`10zl\` * 10 + \`r\`.\`20zl\` * 20 + \`r\`.\`50zl\` * 50 + \`r\`.\`100zl\` * 100 + \`r\`.\`200zl\` * 200 + \`r\`.\`500zl\` * 500) AS \`sumaPrzeliczona\` from (\`rozliczenie\` \`r\` join \`liczacy\` \`l\` on(\`r\`.\`liczacy1\` = \`l\`.\`id\`)) group by \`r\`.\`liczacy1\` union all select \`r\`.\`liczacy2\` AS \`idLiczacego\`,\`l\`.\`imie\` AS \`imie\`,\`l\`.\`nazwisko\` AS \`nazwisko\`,sum(\`r\`.\`1gr\` * 0.01 + \`r\`.\`2gr\` * 0.02 + \`r\`.\`5gr\` * 0.05 + \`r\`.\`10gr\` * 0.1 + \`r\`.\`20gr\` * 0.2 + \`r\`.\`50gr\` * 0.5 + \`r\`.\`1zl\` * 1 + \`r\`.\`2zl\` * 2 + \`r\`.\`5zl\` * 5 + \`r\`.\`10zl\` * 10 + \`r\`.\`20zl\` * 20 + \`r\`.\`50zl\` * 50 + \`r\`.\`100zl\` * 100 + \`r\`.\`200zl\` * 200 + \`r\`.\`500zl\` * 500) AS \`sumaPrzeliczona\` from (\`rozliczenie\` \`r\` join \`liczacy\` \`l\` on(\`r\`.\`liczacy2\` = \`l\`.\`id\`)) group by \`r\`.\`liczacy2\` union all select \`r\`.\`liczacy3\` AS \`idLiczacego\`,\`l\`.\`imie\` AS \`imie\`,\`l\`.\`nazwisko\` AS \`nazwisko\`,sum(\`r\`.\`1gr\` * 0.01 + \`r\`.\`2gr\` * 0.02 + \`r\`.\`5gr\` * 0.05 + \`r\`.\`10gr\` * 0.1 + \`r\`.\`20gr\` * 0.2 + \`r\`.\`50gr\` * 0.5 + \`r\`.\`1zl\` * 1 + \`r\`.\`2zl\` * 2 + \`r\`.\`5zl\` * 5 + \`r\`.\`10zl\` * 10 + \`r\`.\`20zl\` * 20 + \`r\`.\`50zl\` * 50 + \`r\`.\`100zl\` * 100 + \`r\`.\`200zl\` * 200 + \`r\`.\`500zl\` * 500) AS \`sumaPrzeliczona\` from (\`rozliczenie\` \`r\` join \`liczacy\` \`l\` on(\`r\`.\`liczacy3\` = \`l\`.\`id\`)) group by \`r\`.\`liczacy3\`) AS \`combinedData\` GROUP BY \`combinedData\`.\`idLiczacego\`, \`combinedData\`.\`imie\`, \`combinedData\`.\`nazwisko\` ;
DROP TABLE IF EXISTS \`sumaPrzeliczona1\`;

CREATE OR REPLACE VIEW \`sumaPrzeliczona1\`  AS SELECT \`r\`.\`liczacy1\` AS \`idLiczacego\`, \`l\`.\`imie\` AS \`imie\`, \`l\`.\`nazwisko\` AS \`nazwisko\`, sum(\`r\`.\`1gr\` * 0.01 + \`r\`.\`2gr\` * 0.02 + \`r\`.\`5gr\` * 0.05 + \`r\`.\`10gr\` * 0.1 + \`r\`.\`20gr\` * 0.2 + \`r\`.\`50gr\` * 0.5 + \`r\`.\`1zl\` * 1 + \`r\`.\`2zl\` * 2 + \`r\`.\`5zl\` * 5 + \`r\`.\`10zl\` * 10 + \`r\`.\`20zl\` * 20 + \`r\`.\`50zl\` * 50 + \`r\`.\`100zl\` * 100 + \`r\`.\`200zl\` * 200 + \`r\`.\`500zl\` * 500) AS \`sumaPrzeliczona\` FROM (\`rozliczenie\` \`r\` join \`liczacy\` \`l\` on(\`r\`.\`liczacy1\` = \`l\`.\`id\`)) GROUP BY \`r\`.\`liczacy1\` ;
DROP TABLE IF EXISTS \`sumaPrzeliczona2\`;

CREATE OR REPLACE VIEW \`sumaPrzeliczona2\`  AS SELECT \`r\`.\`liczacy2\` AS \`idLiczacego\`, \`l\`.\`imie\` AS \`imie\`, \`l\`.\`nazwisko\` AS \`nazwisko\`, sum(\`r\`.\`1gr\` * 0.01 + \`r\`.\`2gr\` * 0.02 + \`r\`.\`5gr\` * 0.05 + \`r\`.\`10gr\` * 0.1 + \`r\`.\`20gr\` * 0.2 + \`r\`.\`50gr\` * 0.5 + \`r\`.\`1zl\` * 1 + \`r\`.\`2zl\` * 2 + \`r\`.\`5zl\` * 5 + \`r\`.\`10zl\` * 10 + \`r\`.\`20zl\` * 20 + \`r\`.\`50zl\` * 50 + \`r\`.\`100zl\` * 100 + \`r\`.\`200zl\` * 200 + \`r\`.\`500zl\` * 500) AS \`sumaPrzeliczona\` FROM (\`rozliczenie\` \`r\` join \`liczacy\` \`l\` on(\`r\`.\`liczacy2\` = \`l\`.\`id\`)) GROUP BY \`r\`.\`liczacy2\` ;
DROP TABLE IF EXISTS \`sumaPrzeliczona3\`;

CREATE OR REPLACE VIEW \`sumaPrzeliczona3\`  AS SELECT \`r\`.\`liczacy3\` AS \`idLiczacego\`, \`l\`.\`imie\` AS \`imie\`, \`l\`.\`nazwisko\` AS \`nazwisko\`, sum(\`r\`.\`1gr\` * 0.01 + \`r\`.\`2gr\` * 0.02 + \`r\`.\`5gr\` * 0.05 + \`r\`.\`10gr\` * 0.1 + \`r\`.\`20gr\` * 0.2 + \`r\`.\`50gr\` * 0.5 + \`r\`.\`1zl\` * 1 + \`r\`.\`2zl\` * 2 + \`r\`.\`5zl\` * 5 + \`r\`.\`10zl\` * 10 + \`r\`.\`20zl\` * 20 + \`r\`.\`50zl\` * 50 + \`r\`.\`100zl\` * 100 + \`r\`.\`200zl\` * 200 + \`r\`.\`500zl\` * 500) AS \`sumaPrzeliczona\` FROM (\`rozliczenie\` \`r\` join \`liczacy\` \`l\` on(\`r\`.\`liczacy3\` = \`l\`.\`id\`)) GROUP BY \`r\`.\`liczacy3\` ;
DROP TABLE IF EXISTS \`SumaZebranaPrzezWolontariuszy\`;

CREATE OR REPLACE VIEW \`SumaZebranaPrzezWolontariuszy\`  AS SELECT \`wolontariusz\`.\`numerIdentyfikatora\` AS \`numerIdentyfikatora\`, \`wolontariusz\`.\`imie\` AS \`imie\`, \`wolontariusz\`.\`nazwisko\` AS \`nazwisko\`, \`sumy\`.\`suma\` AS \`suma\` FROM (\`wolontariusz\` join \`sumy\`) WHERE \`wolontariusz\`.\`id\` = \`sumy\`.\`wolontariuszID\` ORDER BY \`wolontariusz\`.\`numerIdentyfikatora\` ASC ;
DROP TABLE IF EXISTS \`suma_przeliczona2\`;

CREATE OR REPLACE VIEW \`suma_przeliczona2\`  AS SELECT coalesce(\`r\`.\`liczacy1\`,\`r\`.\`liczacy2\`,\`r\`.\`liczacy3\`) AS \`ID_Liczącego\`, \`l\`.\`imie\` AS \`Imię\`, \`l\`.\`nazwisko\` AS \`Nazwisko\`, sum(\`r\`.\`1gr\` * 0.01 + \`r\`.\`2gr\` * 0.02 + \`r\`.\`5gr\` * 0.05 + \`r\`.\`10gr\` * 0.1 + \`r\`.\`20gr\` * 0.2 + \`r\`.\`50gr\` * 0.5 + \`r\`.\`1zl\` * 1 + \`r\`.\`2zl\` * 2 + \`r\`.\`5zl\` * 5 + \`r\`.\`10zl\` * 10 + \`r\`.\`20zl\` * 20 + \`r\`.\`50zl\` * 50 + \`r\`.\`100zl\` * 100 + \`r\`.\`200zl\` * 200 + \`r\`.\`500zl\` * 500) AS \`Suma_Przeliczona\` FROM (\`rozliczenie\` \`r\` join \`liczacy\` \`l\` on(coalesce(\`r\`.\`liczacy1\`,\`r\`.\`liczacy2\`,\`r\`.\`liczacy3\`) = \`l\`.\`id\`)) GROUP BY coalesce(\`r\`.\`liczacy1\`,\`r\`.\`liczacy2\`,\`r\`.\`liczacy3\`), \`l\`.\`imie\`, \`l\`.\`nazwisko\` ;
DROP TABLE IF EXISTS \`sumy\`;

CREATE OR REPLACE VIEW \`sumy\`  AS SELECT \`rozliczenie\`.\`wolontariuszID\` AS \`wolontariuszID\`, sum(\`rozliczenie\`.\`1gr\` * 0.01 + \`rozliczenie\`.\`2gr\` * 0.02 + \`rozliczenie\`.\`5gr\` * 0.05 + \`rozliczenie\`.\`10gr\` * 0.1 + \`rozliczenie\`.\`20gr\` * 0.2 + \`rozliczenie\`.\`50gr\` * 0.5 + \`rozliczenie\`.\`1zl\` + \`rozliczenie\`.\`2zl\` * 2 + \`rozliczenie\`.\`5zl\` * 5 + \`rozliczenie\`.\`10zl\` * 10 + \`rozliczenie\`.\`20zl\` * 20 + \`rozliczenie\`.\`50zl\` * 50 + \`rozliczenie\`.\`100zl\` * 100 + \`rozliczenie\`.\`200zl\` * 200 + \`rozliczenie\`.\`500zl\` * 500) AS \`suma\` FROM \`rozliczenie\` GROUP BY \`rozliczenie\`.\`wolontariuszID\` ;

    `;
    return toSend;
}

function massEmail($emaile = [], $tytul = "Powiadomienie od sztabu", $tresc = "Brak treści wiadomości")
{
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTPHOST,
        port: process.env.SMTPPORT,
        secure: true,
        auth: {
            user: process.env.SMTPLOGIN,
            pass: process.env.SMTPPASS
        }
    });
    $emaile.forEach(element => {
        const mailOptions = {
            from: process.env.SMTPLOGIN,
            bcc: element,
            subject: $tytul,
            html: '<img src="' + process.env.LOGO + '" height="150px" style="display: block; margin-left: auto; margin-right: auto;"><h1 style="text-align: center;">' + $tytul + '</h1><br><div id="main">' + $tresc + '</div><p style="text-align: center;">Pozdrawiamy,<br>' + process.env.SZTAB + '</p>' + footerHtml(0,1)
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
                loger(fs, 'Błąd wysyłania maila do ' + element, 'error');
            } else {
                console.log('Email został wysłany: ' + info.response);
                loger(fs, 'Email został wysłany do ' + element + ' ' + info.response, 'info');
            }
        });
    });
}


exports.headerHtml = headerHtml;
exports.menuHtml = menuHtml;
exports.footerHtml = footerHtml;
exports.makeid = makeid;
exports.checkPesel = checkPesel;
exports.loger = loger;
exports.peselToShow = peselToShow;
exports.telefon = telefon;
exports.sendToDiscord = sendToDiscord;
exports.sendEmail = sendEmail;
exports.checkSendEmail = checkSendEmail;
exports.baza = baza;
exports.massEmail = massEmail;