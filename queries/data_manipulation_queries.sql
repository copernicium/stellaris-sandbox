-- Note: The colon (:) character is used to denote variables that will come from the backend.

-- Empires list
SELECT * FROM empires;

-- Individual empire view
SELECT * FROM empires WHERE empireID = ":empireID";
SELECT resources.resourceID, resources.name, rd.quantity FROM (SELECT * FROM resource_stocks WHERE resource_stocks.empireID = ":empireID") AS rd INNER JOIN resources ON rd.resourceID = resources.resourceID;

-- Systems list
SELECT * FROM systems;

-- Individual system view
SELECT * FROM systems WHERE systemID = ":systemID";

-- System search (system page)
SELECT * FROM systems WHERE systems.name LIKE "%:searchQuery";

-- System search (other pages)
SELECT systems.systemID, systems.name FROM systems WHERE systems.name LIKE "%:searchQuery%";

-- Bodies list
SELECT * FROM bodies;

-- Individual body view
SELECT * FROM bodies WHERE bodyID = ":bodyID";
SELECT resources.resourceID, resources.name, rd.quantity FROM (SELECT * FROM resource_deposits WHERE resource_deposits.bodyID = ":bodyID") AS rd INNER JOIN resources ON rd.resourceID = resources.resourceID;

-- Resources list
SELECT * FROM resources;

-- Individual resource view
SELECT * FROM resources WHERE resourceID = ":resourceID";

-- Resource search (other pages)
SELECT resources.resourceID, resources.name FROM resources WHERE resources.name LIKE "%:searchQuery%";

-- Hyperlanes list
SELECT s1.system1ID, s1.system2ID, s1.name AS system1Name, s2.name AS system2Name FROM (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system1ID = systems.systemID) AS s1 INNER JOIN (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system2ID = systems.systemID) AS s2 ON s1.system1ID = s2.system1ID AND s1.system2ID = s2.system2ID;

-- Individual hyperlane view
SELECT s1.name AS system1Name, s2.name AS system2Name FROM (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system1ID = systems.systemID) AS s1 INNER JOIN (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name FROM hyperlanes INNER JOIN systems ON hyperlanes.system2ID = systems.systemID) AS s2 ON s1.system1ID = s2.system1ID AND s1.system2ID = s2.system2ID WHERE s1.system1ID = ":system1ID" AND s2.system2ID = ":system2ID";

