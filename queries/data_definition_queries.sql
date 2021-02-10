CREATE TABLE empires (
	empireID int primary key auto_increment,
	name varchar(255) NOT NULL,
	aggressiveness varchar(16) NOT NULL,
	primaryColor varchar(6) NOT NULL,
	secondaryColor varchar(6) NOT NULL,
	isFallenEmpire boolean NOT NULL,
	CHECK (primaryColor LIKE "[^0-9A-F]%"),
	CHECK (secondaryColor LIKE "[^0-9A-F]%"),
	CHECK (aggressiveness IN ("passive", "moderate", "aggressive")));

CREATE TABLE systems (
	systemID int primary key auto_increment,
	name varchar(255) NOT NULL,
	starCount int NOT NULL,
	type varchar(16) NOT NULL,
	orbitalRadius float NOT NULL,
	theta float NOT NULL,
	empireID int DEFAULT NULL,
	foreign key (empireID) references empires(empireID),
	CHECK (type IN ("unary", "binary", "trinary")));

CREATE TABLE bodies (
	bodyID int primary key auto_increment,
	name varchar(255) NOT NULL,
	type varchar(16) NOT NULL,
	orbitalRadius float NOT NULL,
	theta float NOT NULL,
	systemID int DEFAULT NULL,
	foreign key (systemID) references systems(systemID),
	CHECK (type IN ("planet", "asteroid")));

CREATE TABLE resources (
	resourceID int primary key auto_increment,
	name varchar(255) NOT NULL,
	baseMarketValue float NOT NULL,
	color varchar(6) NOT NULL,
	CHECK (color LIKE "[^0-9A-F]%"));

CREATE TABLE hyperlanes (
	system1 int DEFAULT NULL,
	system2 int DEFAULT NULL,
	foreign key (system1) references systems(systemID),
	foreign key (system2) references systems(systemID));

CREATE TABLE resource_stock (
	empireID int DEFAULT NULL,
	resourceID int DEFAULT NULL,
	quantity int NOT NULL,
	foreign key (empireID) references empires(empireID),
	foreign key (resourceID) references resources(resourceID));

CREATE TABLE resource_deposits (
	bodyID int DEFAULT NULL,
	resourceID int DEFAULT NULL,
	quantity int NOT NULL,
	foreign key (bodyID) references bodies(bodyID),
	foreign key (resourceID) references resources(resourceID));
