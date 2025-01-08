CREATE TABLE IF NOT EXISTS `liczacy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `imie` varchar(255) NOT NULL,
  `nazwisko` varchar(255) NOT NULL,
  `aktywne` tinyint(1) NOT NULL DEFAULT 1,
  `qr` varchar(25) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` text NOT NULL,
  `haslo` text NOT NULL,
  `kto` text NOT NULL,
  `aktywne` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
INSERT INTO `login` (`id`, `login`, `haslo`, `kto`, `aktywne`) VALUES
(NULL, 'szef', '0c1aba4f114d80faa3b08016fe94443462adadd7', 'Szef Sztabu', 1);

CREATE TABLE IF NOT EXISTS `rozliczenie` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wolontariuszID` int(11) NOT NULL,
  `czasRozliczenia` timestamp NOT NULL DEFAULT current_timestamp(),
  `terminal` tinyint(1) NOT NULL DEFAULT 0,
  `sumaZTerminala` float DEFAULT NULL,
  `1gr` int(11) DEFAULT NULL,
  `2gr` int(11) DEFAULT NULL,
  `5gr` int(11) DEFAULT NULL,
  `10gr` int(11) DEFAULT NULL,
  `20gr` int(11) DEFAULT NULL,
  `50gr` int(11) DEFAULT NULL,
  `1zl` int(11) DEFAULT NULL,
  `2zl` int(11) DEFAULT NULL,
  `5zl` int(11) DEFAULT NULL,
  `10zl` int(11) DEFAULT NULL,
  `20zl` int(11) DEFAULT NULL,
  `50zl` int(11) DEFAULT NULL,
  `100zl` int(11) DEFAULT NULL,
  `200zl` int(11) DEFAULT NULL,
  `500zl` int(11) DEFAULT NULL,
  `walutaObca` text NOT NULL,
  `daryInne` text DEFAULT NULL,
  `uwagi` text DEFAULT NULL,
  `liczacy1` int(11) NOT NULL,
  `liczacy2` int(11) NOT NULL,
  `liczacy3` int(11) DEFAULT NULL,
  `sala` varchar(10) NOT NULL,
  `weryfikowal` int(11) NOT NULL,
  `wpisaneDoBSS` tinyint(1) NOT NULL DEFAULT 0,
  `ostatniaZmiana` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `aktywne` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `wolontariuszID` (`wolontariuszID`),
  KEY `liczacy1` (`liczacy1`),
  KEY `liczacy2` (`liczacy2`),
  KEY `liczacy3` (`liczacy3`),
  KEY `weryfikowal` (`weryfikowal`)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS `sumaPrzeliczona` (
`idLiczacego` int(11)
,`imie` varchar(255)
,`nazwisko` varchar(255)
,`sumaPrzeliczona` decimal(65,2)
);
CREATE TABLE IF NOT EXISTS `sumaPrzeliczona1` (
`idLiczacego` int(11)
,`imie` varchar(255)
,`nazwisko` varchar(255)
,`sumaPrzeliczona` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS `sumaPrzeliczona2` (
`idLiczacego` int(11)
,`imie` varchar(255)
,`nazwisko` varchar(255)
,`sumaPrzeliczona` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS `sumaPrzeliczona3` (
`idLiczacego` int(11)
,`imie` varchar(255)
,`nazwisko` varchar(255)
,`sumaPrzeliczona` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS `SumaZebranaPrzezWolontariuszy` (
`numerIdentyfikatora` varchar(8)
,`imie` varchar(255)
,`nazwisko` varchar(255)
,`suma` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS `suma_przeliczona2` (
`ID_Liczącego` int(11)
,`Imię` varchar(255)
,`Nazwisko` varchar(255)
,`Suma_Przeliczona` decimal(49,2)
);
CREATE TABLE IF NOT EXISTS `sumy` (
`wolontariuszID` int(11)
,`suma` decimal(49,2)
);

CREATE TABLE IF NOT EXISTS `tokeny` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` text NOT NULL,
  `czasAktywacji` timestamp NOT NULL DEFAULT current_timestamp(),
  `typ` int(11) NOT NULL DEFAULT 1,
  `userId` int(11) NOT NULL,
  `aktywny` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `tokenyLiczacy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `typ` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `czasAktywacji` timestamp NOT NULL DEFAULT current_timestamp(),
  `aktywny` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `wolontariusz` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numerIdentyfikatora` varchar(8) NOT NULL,
  `imie` varchar(255) NOT NULL,
  `nazwisko` varchar(255) NOT NULL,
  `discord` text NOT NULL,
  `email` text NOT NULL,
  `telefon` varchar(12) NOT NULL,
  `pesel` varchar(11) NOT NULL,
  `rodzic` varchar(255) NOT NULL DEFAULT 'BRAK',
  `terminal` tinyint(1) NOT NULL DEFAULT 0,
  `ostatniaZmiana` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `aktywny` tinyint(4) NOT NULL DEFAULT 1,
  `zaznacz` int(11) NOT NULL DEFAULT 0,
  `puszkaWydana` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
DROP TABLE IF EXISTS `sumaPrzeliczona`;

CREATE OR REPLACE VIEW `sumaPrzeliczona`  AS SELECT `combinedData`.`idLiczacego` AS `idLiczacego`, `combinedData`.`imie` AS `imie`, `combinedData`.`nazwisko` AS `nazwisko`, sum(`combinedData`.`sumaPrzeliczona`) AS `sumaPrzeliczona` FROM (select `r`.`liczacy1` AS `idLiczacego`,`l`.`imie` AS `imie`,`l`.`nazwisko` AS `nazwisko`,sum(`r`.`1gr` * 0.01 + `r`.`2gr` * 0.02 + `r`.`5gr` * 0.05 + `r`.`10gr` * 0.1 + `r`.`20gr` * 0.2 + `r`.`50gr` * 0.5 + `r`.`1zl` * 1 + `r`.`2zl` * 2 + `r`.`5zl` * 5 + `r`.`10zl` * 10 + `r`.`20zl` * 20 + `r`.`50zl` * 50 + `r`.`100zl` * 100 + `r`.`200zl` * 200 + `r`.`500zl` * 500) AS `sumaPrzeliczona` from (`rozliczenie` `r` join `liczacy` `l` on(`r`.`liczacy1` = `l`.`id`)) group by `r`.`liczacy1` union all select `r`.`liczacy2` AS `idLiczacego`,`l`.`imie` AS `imie`,`l`.`nazwisko` AS `nazwisko`,sum(`r`.`1gr` * 0.01 + `r`.`2gr` * 0.02 + `r`.`5gr` * 0.05 + `r`.`10gr` * 0.1 + `r`.`20gr` * 0.2 + `r`.`50gr` * 0.5 + `r`.`1zl` * 1 + `r`.`2zl` * 2 + `r`.`5zl` * 5 + `r`.`10zl` * 10 + `r`.`20zl` * 20 + `r`.`50zl` * 50 + `r`.`100zl` * 100 + `r`.`200zl` * 200 + `r`.`500zl` * 500) AS `sumaPrzeliczona` from (`rozliczenie` `r` join `liczacy` `l` on(`r`.`liczacy2` = `l`.`id`)) group by `r`.`liczacy2` union all select `r`.`liczacy3` AS `idLiczacego`,`l`.`imie` AS `imie`,`l`.`nazwisko` AS `nazwisko`,sum(`r`.`1gr` * 0.01 + `r`.`2gr` * 0.02 + `r`.`5gr` * 0.05 + `r`.`10gr` * 0.1 + `r`.`20gr` * 0.2 + `r`.`50gr` * 0.5 + `r`.`1zl` * 1 + `r`.`2zl` * 2 + `r`.`5zl` * 5 + `r`.`10zl` * 10 + `r`.`20zl` * 20 + `r`.`50zl` * 50 + `r`.`100zl` * 100 + `r`.`200zl` * 200 + `r`.`500zl` * 500) AS `sumaPrzeliczona` from (`rozliczenie` `r` join `liczacy` `l` on(`r`.`liczacy3` = `l`.`id`)) group by `r`.`liczacy3`) AS `combinedData` GROUP BY `combinedData`.`idLiczacego`, `combinedData`.`imie`, `combinedData`.`nazwisko` ;
DROP TABLE IF EXISTS `sumaPrzeliczona1`;

CREATE OR REPLACE VIEW `sumaPrzeliczona1`  AS SELECT `r`.`liczacy1` AS `idLiczacego`, `l`.`imie` AS `imie`, `l`.`nazwisko` AS `nazwisko`, sum(`r`.`1gr` * 0.01 + `r`.`2gr` * 0.02 + `r`.`5gr` * 0.05 + `r`.`10gr` * 0.1 + `r`.`20gr` * 0.2 + `r`.`50gr` * 0.5 + `r`.`1zl` * 1 + `r`.`2zl` * 2 + `r`.`5zl` * 5 + `r`.`10zl` * 10 + `r`.`20zl` * 20 + `r`.`50zl` * 50 + `r`.`100zl` * 100 + `r`.`200zl` * 200 + `r`.`500zl` * 500) AS `sumaPrzeliczona` FROM (`rozliczenie` `r` join `liczacy` `l` on(`r`.`liczacy1` = `l`.`id`)) GROUP BY `r`.`liczacy1` ;
DROP TABLE IF EXISTS `sumaPrzeliczona2`;

CREATE OR REPLACE VIEW `sumaPrzeliczona2`  AS SELECT `r`.`liczacy2` AS `idLiczacego`, `l`.`imie` AS `imie`, `l`.`nazwisko` AS `nazwisko`, sum(`r`.`1gr` * 0.01 + `r`.`2gr` * 0.02 + `r`.`5gr` * 0.05 + `r`.`10gr` * 0.1 + `r`.`20gr` * 0.2 + `r`.`50gr` * 0.5 + `r`.`1zl` * 1 + `r`.`2zl` * 2 + `r`.`5zl` * 5 + `r`.`10zl` * 10 + `r`.`20zl` * 20 + `r`.`50zl` * 50 + `r`.`100zl` * 100 + `r`.`200zl` * 200 + `r`.`500zl` * 500) AS `sumaPrzeliczona` FROM (`rozliczenie` `r` join `liczacy` `l` on(`r`.`liczacy2` = `l`.`id`)) GROUP BY `r`.`liczacy2` ;
DROP TABLE IF EXISTS `sumaPrzeliczona3`;

CREATE OR REPLACE VIEW `sumaPrzeliczona3`  AS SELECT `r`.`liczacy3` AS `idLiczacego`, `l`.`imie` AS `imie`, `l`.`nazwisko` AS `nazwisko`, sum(`r`.`1gr` * 0.01 + `r`.`2gr` * 0.02 + `r`.`5gr` * 0.05 + `r`.`10gr` * 0.1 + `r`.`20gr` * 0.2 + `r`.`50gr` * 0.5 + `r`.`1zl` * 1 + `r`.`2zl` * 2 + `r`.`5zl` * 5 + `r`.`10zl` * 10 + `r`.`20zl` * 20 + `r`.`50zl` * 50 + `r`.`100zl` * 100 + `r`.`200zl` * 200 + `r`.`500zl` * 500) AS `sumaPrzeliczona` FROM (`rozliczenie` `r` join `liczacy` `l` on(`r`.`liczacy3` = `l`.`id`)) GROUP BY `r`.`liczacy3` ;
DROP TABLE IF EXISTS `SumaZebranaPrzezWolontariuszy`;

CREATE OR REPLACE VIEW `SumaZebranaPrzezWolontariuszy`  AS SELECT `wolontariusz`.`numerIdentyfikatora` AS `numerIdentyfikatora`, `wolontariusz`.`imie` AS `imie`, `wolontariusz`.`nazwisko` AS `nazwisko`, `sumy`.`suma` AS `suma` FROM (`wolontariusz` join `sumy`) WHERE `wolontariusz`.`id` = `sumy`.`wolontariuszID` ORDER BY `wolontariusz`.`numerIdentyfikatora` ASC ;
DROP TABLE IF EXISTS `suma_przeliczona2`;

CREATE OR REPLACE VIEW `suma_przeliczona2`  AS SELECT coalesce(`r`.`liczacy1`,`r`.`liczacy2`,`r`.`liczacy3`) AS `ID_Liczącego`, `l`.`imie` AS `Imię`, `l`.`nazwisko` AS `Nazwisko`, sum(`r`.`1gr` * 0.01 + `r`.`2gr` * 0.02 + `r`.`5gr` * 0.05 + `r`.`10gr` * 0.1 + `r`.`20gr` * 0.2 + `r`.`50gr` * 0.5 + `r`.`1zl` * 1 + `r`.`2zl` * 2 + `r`.`5zl` * 5 + `r`.`10zl` * 10 + `r`.`20zl` * 20 + `r`.`50zl` * 50 + `r`.`100zl` * 100 + `r`.`200zl` * 200 + `r`.`500zl` * 500) AS `Suma_Przeliczona` FROM (`rozliczenie` `r` join `liczacy` `l` on(coalesce(`r`.`liczacy1`,`r`.`liczacy2`,`r`.`liczacy3`) = `l`.`id`)) GROUP BY coalesce(`r`.`liczacy1`,`r`.`liczacy2`,`r`.`liczacy3`), `l`.`imie`, `l`.`nazwisko` ;
DROP TABLE IF EXISTS `sumy`;

CREATE OR REPLACE VIEW `sumy`  AS SELECT `rozliczenie`.`wolontariuszID` AS `wolontariuszID`, sum(`rozliczenie`.`1gr` * 0.01 + `rozliczenie`.`2gr` * 0.02 + `rozliczenie`.`5gr` * 0.05 + `rozliczenie`.`10gr` * 0.1 + `rozliczenie`.`20gr` * 0.2 + `rozliczenie`.`50gr` * 0.5 + `rozliczenie`.`1zl` + `rozliczenie`.`2zl` * 2 + `rozliczenie`.`5zl` * 5 + `rozliczenie`.`10zl` * 10 + `rozliczenie`.`20zl` * 20 + `rozliczenie`.`50zl` * 50 + `rozliczenie`.`100zl` * 100 + `rozliczenie`.`200zl` * 200 + `rozliczenie`.`500zl` * 500 + `rozliczenie`.`sumaZTerminala`) AS `suma` FROM `rozliczenie` GROUP BY `rozliczenie`.`wolontariuszID` ;
