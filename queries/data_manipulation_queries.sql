-- Note: The colon (:) character is used to denote variables that will come from the backend.

-- Empires list
SELECT * FROM empires;
DELETE FROM empires WHERE empireID = ":empireID";

-- Individual empire view
SELECT * FROM empires WHERE empireID = ":empireID";
SELECT systemID, name FROM systems WHERE empireID = ":empireID";
SELECT resources.resourceID, resources.name, rd.quantity FROM (SELECT * FROM resource_stocks WHERE resource_stocks.empireID = ":empireID") AS rd INNER JOIN resources ON rd.resourceID = resources.resourceID;
INSERT INTO empires (name, aggressiveness, primaryColor, secondaryColor, isFallenEmpire) VALUES (":empireName", ":empireAggressiveness", ":empirePrimaryColor", ":empireSecondaryColor", ":empireIsFallenEmpire");
INSERT INTO resource_stocks (empireID, resourceID, quantity) VALUES (":empireID", ":resourceID", ":quantity");
UPDATE empires SET name=":empireName", aggressiveness=":empireAggressiveness", primaryColor=":empirePrimaryColor", secondaryColor=":empireSecondaryColor", isFallenEmpire=":empireIsFallenEmpire" WHERE empireID = ":empireID";
UPDATE resource_stocks SET quantity=":quantity" WHERE empireID = ":empireID" AND resourceID = ":resourceID";
UPDATE systems SET empireID=":empireID" WHERE systemID = ":systemID";
DELETE FROM resource_stocks WHERE resourceID = ":resourceID" AND empireID = ":empireID";

-- Empire search (other pages)
SELECT empireID, name FROM empires WHERE name LIKE "%:searchQuery%";

-- Systems list
SELECT * FROM systems;
DELETE FROM systems WHERE systemID = ":systemID";

-- Individual system view
SELECT * FROM systems WHERE systemID = ":systemID";
SELECT bodyID, name, type FROM bodies WHERE systemID = ":systemID";
INSERT INTO systems (name, type, theta, star1Type, star2Type, star3Type, orbitalRadius, empireID) VALUES (":systemName", ":systemType", ":systemStar1Type", ":systemStar2Type", ":systemStar3Type", ":systemTheta", ":systemOrbitalRadius", ":empireID");
UPDATE systems SET name=":systemName", type=":systemType", star1Type=":systemStar1Type", star2Type=":systemStar2Type", star3Type=":systemStar3Type", theta=":systemTheta", orbitalRadius=":systemOrbitalRadius" WHERE systemID = ":systemID";

-- System search (system page)
SELECT * FROM systems WHERE systems.name LIKE "%:searchQuery%";

-- System search (other pages)
SELECT systems.systemID, systems.name FROM systems WHERE systems.name LIKE "%:searchQuery%";

-- Bodies list
SELECT * FROM bodies;
DELETE FROM bodies WHERE bodyID = ":bodyID";

-- Individual body view
SELECT * FROM bodies WHERE bodyID = ":bodyID";
SELECT resources.resourceID, resources.name, rd.quantity FROM (SELECT * FROM resource_deposits WHERE resource_deposits.bodyID = ":bodyID") AS rd INNER JOIN resources ON rd.resourceID = resources.resourceID;
INSERT INTO bodies (name, type, planetType, theta, orbitalRadius, systemID) VALUES (":bodyName", ":bodyType", ":bodyPlanetType", ":bodyTheta", ":bodyOrbitalRadius", ":systemID");
INSERT INTO resource_deposits (bodyID, resourceID, quantity) VALUES (":bodyID", ":resourceID", ":quantity");
UPDATE bodies SET name=":bodyName", type=":bodyType", planetType=":bodyPlanetType", theta=":bodyTheta", orbitalRadius=":bodyOrbitalRadius" WHERE bodyID = ":bodyID";
UPDATE resource_deposits SET quantity=":quantity" WHERE bodyID = ":bodyID" AND resourceID = ":resourceID";
DELETE FROM resource_deposits WHERE resourceID = ":resourceID" AND bodyID = ":bodyID";

-- Resources list
SELECT * FROM resources;
DELETE FROM resources WHERE resourceID = ":resourceID";

-- Individual resource view
SELECT * FROM resources WHERE resourceID = ":resourceID";
INSERT INTO resources (name, baseMarketValue, color) VALUES (":resourceName", ":resourceBaseMarketValue", ":resourceColor");
UPDATE resources SET name=":resourceName", baseMarketValue=":resourceBaseMarketValue", color=":color" WHERE resourceID = ":resourceID";

-- Resource search (other pages)
SELECT resources.resourceID, resources.name FROM resources WHERE resources.name LIKE "%:searchQuery%";

-- Hyperlanes list
SELECT s1.system1ID, s1.system2ID, s1.name AS system1Name, s2.name AS system2Name, s1.orbitalRadius AS system1OrbitalRadius, s1.theta AS system1Theta, s2.orbitalRadius AS system2OrbitalRadius, s2.theta AS system2Theta FROM (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name, systems.orbitalRadius, systems.theta FROM hyperlanes INNER JOIN systems ON hyperlanes.system1ID = systems.systemID) AS s1 INNER JOIN (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name, systems.orbitalRadius, systems.theta FROM hyperlanes INNER JOIN systems ON hyperlanes.system2ID = systems.systemID) AS s2 ON s1.system1ID = s2.system1ID AND s1.system2ID = s2.system2ID;
INSERT INTO hyperlanes (system1ID, system2ID) VALUES (":system1ID", ":system2ID");
DELETE FROM hyperlanes WHERE system1ID = ":system1ID" AND system2ID = ":system2ID";

-- Individual hyperlane view
SELECT s1.name AS system1Name, s2.name AS system2Name FROM (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system1ID = systems.systemID) AS s1 INNER JOIN (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system2ID = systems.systemID) AS s2 ON s1.system1ID = s2.system1ID AND s1.system2ID = s2.system2ID WHERE s1.system1ID = ":system1ID" AND s2.system2ID = ":system2ID";

