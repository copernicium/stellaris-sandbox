CREATE TABLE empires (
	empireID int NOT NULL auto_increment,
	name varchar(255) NOT NULL,
	aggressiveness varchar(16) NOT NULL,
	primaryColor varchar(6) NOT NULL,
	secondaryColor varchar(6) NOT NULL,
	isFallenEmpire boolean NOT NULL,
	CONSTRAINT PRIMARY KEY (empireID),
	CONSTRAINT CHECK (primaryColor LIKE "[^0-9A-F]%"),
	CONSTRAINT CHECK (secondaryColor LIKE "[^0-9A-F]%"),
	CONSTRAINT CHECK (aggressiveness IN ("passive", "moderate", "aggressive"))
);

CREATE TABLE systems (
	systemID int NOT NULL auto_increment,
	name varchar(255) NOT NULL,
	type varchar(16) NOT NULL,
	orbitalRadius float NOT NULL,
	theta float NOT NULL,
	empireID int DEFAULT NULL,
	CONSTRAINT PRIMARY KEY (systemID),
	CONSTRAINT FOREIGN KEY (empireID) REFERENCES empires(empireID),
	CONSTRAINT CHECK (type IN ("unary", "binary", "trinary"))
);

CREATE TABLE bodies (
	bodyID int NOT NULL auto_increment,
	name varchar(255) NOT NULL,
	type varchar(16) NOT NULL,
	orbitalRadius float NOT NULL,
	theta float NOT NULL,
	systemID int NOT NULL,
	CONSTRAINT PRIMARY KEY (bodyID),
	CONSTRAINT FOREIGN KEY (systemID) REFERENCES systems(systemID),
	CONSTRAINT CHECK (type IN ("planet", "asteroid"))
);

CREATE TABLE resources (
	resourceID int NOT NULL auto_increment,
	name varchar(255) NOT NULL,
	baseMarketValue float,
	color varchar(6) NOT NULL,
	CONSTRAINT PRIMARY KEY (resourceID),
	CONSTRAINT CHECK (color LIKE "[^0-9A-F]%")
);

CREATE TABLE hyperlanes (
	system1ID int NOT NULL,
	system2ID int NOT NULL,
	CONSTRAINT PRIMARY KEY (system1ID, system2ID),
	CONSTRAINT FOREIGN KEY (system1ID) REFERENCES systems(systemID),
	CONSTRAINT FOREIGN KEY (system2ID) REFERENCES systems(systemID)
);

CREATE TABLE resource_stocks (
	empireID int NOT NULL,
	resourceID int NOT NULL,
	quantity int NOT NULL,
	CONSTRAINT PRIMARY KEY (empireID, resourceID),
	CONSTRAINT FOREIGN KEY (empireID) REFERENCES empires(empireID),
	CONSTRAINT FOREIGN KEY (resourceID) REFERENCES resources(resourceID)
);

CREATE TABLE resource_deposits (
	bodyID int NOT NULL,
	resourceID int NOT NULL,
	quantity int NOT NULL,
	CONSTRAINT PRIMARY KEY (bodyID, resourceID),
	CONSTRAINT FOREIGN KEY (bodyID) REFERENCES bodies(bodyID),
	CONSTRAINT FOREIGN KEY (resourceID) REFERENCES resources(resourceID)
);

