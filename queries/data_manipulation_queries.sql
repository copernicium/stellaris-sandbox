-- Note: The colon (:) character is used to denote variables that will come from the backend.

-- Empires list
SELECT * FROM empires;

-- Individual empire view
SELECT * FROM empires WHERE empireID = ":empireID";
SELECT systemID, name FROM systems WHERE empireID = ":empireID";
SELECT resources.resourceID, resources.name, rd.quantity FROM (SELECT * FROM resource_stocks WHERE resource_stocks.empireID = ":empireID") AS rd INNER JOIN resources ON rd.resourceID = resources.resourceID;
INSERT INTO empires (name, aggressiveness, primaryColor, secondaryColor, isFallenEmpire) VALUES (":empireName", ":empireAggressiveness", ":empirePrimaryColor", ":empireSecondaryColor", ":empireIsFallenEmpire");
INSERT INTO resource_stocks (empireID, resourceID, quantity) VALUES (":empireID", ":resourceID", ":quantity");
UPDATE empires SET name=":empireName", aggressiveness=":empireAggressiveness", primaryColor=":empirePrimaryColor", secondaryColor=":empireSecondaryColor", isFallenEmpire=":empireIsFallenEmpire" WHERE empireID = ":empireID";
UPDATE resource_stocks SET quantity=":quantity" WHERE empireID = ":empireID" AND resourceID = ":resourceID";
UPDATE systems SET empireID=":empireID" WHERE systemID = ":systemID";

-- Systems list
SELECT * FROM systems;

-- Individual system view
SELECT * FROM systems WHERE systemID = ":systemID";
SELECT bodyID, name, type FROM bodies WHERE systemID = ":systemID";
INSERT INTO systems (name, type, theta, orbitalRadius) VALUES (":systemName", ":systemType", ":systemTheta", ":systemOrbitalRadius");
UPDATE systems SET name=":systemName", type=":systemType", theta=":systemTheta", orbitalRadius=":systemOrbitalRadius" WHERE systemID = ":systemID";

-- System search (system page)
SELECT * FROM systems WHERE systems.name LIKE "%:searchQuery";

-- System search (other pages)
SELECT systems.systemID, systems.name FROM systems WHERE systems.name LIKE "%:searchQuery%";

-- Bodies list
SELECT * FROM bodies;

-- Individual body view
SELECT * FROM bodies WHERE bodyID = ":bodyID";
SELECT resources.resourceID, resources.name, rd.quantity FROM (SELECT * FROM resource_deposits WHERE resource_deposits.bodyID = ":bodyID") AS rd INNER JOIN resources ON rd.resourceID = resources.resourceID;
INSERT INTO bodies (name, type, theta, orbitalRadius) VALUES (":bodyName", ":bodyType", ":bodyTheta", ":bodyOrbitalRadius");
INSERT INTO resource_deposits (bodyID, resourceID, quantity) VALUES (":bodyID", ":resourceID", ":quantity");
UPDATE bodies SET name=":bodyName", type=":bodyType", theta=":bodyTheta", orbitalRadius=":bodyOrbitalRadius" WHERE bodyID = ":bodyID";
UPDATE resource_deposits SET quantity=":quantity" WHERE bodyID = ":bodyID" AND resourceID = ":resourceID";

-- Resources list
SELECT * FROM resources;

-- Individual resource view
SELECT * FROM resources WHERE resourceID = ":resourceID";
INSERT INTO resources (name, baseMarketValue, color) VALUES (":resourceName", ":resourceBaseMarketValue", ":resourceColor");
UPDATE resources SET name=":resourceName", baseMarketValue=":resourceBaseMarketValue", color=":color" WHERE resourceID = ":resourceID";

-- Resource search (other pages)
SELECT resources.resourceID, resources.name FROM resources WHERE resources.name LIKE "%:searchQuery%";

-- Hyperlanes list
SELECT s1.system1ID, s1.system2ID, s1.name AS system1Name, s2.name AS system2Name FROM (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system1ID = systems.systemID) AS s1 INNER JOIN (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system2ID = systems.systemID) AS s2 ON s1.system1ID = s2.system1ID AND s1.system2ID = s2.system2ID;
INSERT INTO hyperlanes (system1ID, system2ID) VALUES (":system1ID", ":system2ID");

-- Individual hyperlane view
SELECT s1.name AS system1Name, s2.name AS system2Name FROM (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system1ID = systems.systemID) AS s1 INNER JOIN (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system2ID = systems.systemID) AS s2 ON s1.system1ID = s2.system1ID AND s1.system2ID = s2.system2ID WHERE s1.system1ID = ":system1ID" AND s2.system2ID = ":system2ID";

