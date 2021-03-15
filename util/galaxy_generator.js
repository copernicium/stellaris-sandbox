const { ArgumentParser } = require("argparse");
var toRoman = require("roman-numerals").toRoman;

const rawSystemNames = require("./stellaris_data/system_names.json");

function generateUniqueSystemNames(){
    var list = [];
    for(var i = 0; i < rawSystemNames.length; i++) {
        var count = list.filter(e => e == rawSystemNames[i]).length;
        if(count == 0){
            list.push(rawSystemNames[i]);
        }
    }
    return list;
}
var systemNames = generateUniqueSystemNames();

const asteroidPrefixes = require("./stellaris_data/asteroid_prefixes.json");
const asteroidPostfixes = require("./stellaris_data/asteroid_postfixes.json");

const systemTypes = ["unary", "binary", "trinary"];
const STAR_TYPES = ["class b", "class a", "class f", "class g", "class k", "class m", "class m red giant", "class t brown dwarf"];

const resourceData = [
	{ name: "Energy Credits", baseMarketValue: 1, color: "#EDE021", min: 1, max: 4 },
	{ name: "Minerals", baseMarketValue: 0.5, color: "#BA1F07", min: 3, max: 20 },
	{ name: "Alloys", baseMarketValue: 2, color: "#6C07BA", min: 1, max: 3 },
	{ name: "Physics Research", baseMarketValue: null, color: "#223BE0", min: 1, max: 6},
	{ name: "Society Research", baseMarketValue: null, color: "#0A7A1E", min: 1, max: 6},
	{ name: "Engineering Research", baseMarketValue: null, color: "#D9990F", min: 1, max: 6}
]

function generateStocks(quantityList) {
	if (resourceData.length != quantityList.length)
		console.error("Not enough quantities for each research");

	var stocks = [];
	for (var i = 0; i < resourceData.length; i++) {
		stocks.push({
			name: resourceData[i].name,
			quantity: quantityList[i]
		});
	}

	return stocks;
}

const empireData = [
	{ name: "United Nations of Earth", aggressiveness: "moderate", primaryColor: "#3841A1", secondaryColor: "#000000", isFallenEmpire: false, stocks: generateStocks([4000, 6000, 4000, 4000, 3000, 5000]) },
	{ name: "Tzynn Empire", aggressiveness: "aggressive", primaryColor: "#000000", secondaryColor: "#7A1707", isFallenEmpire: false, stocks: generateStocks([3000, 4500, 4000, 2000, 1500, 2500]) },
	{ name: "Jehetma Dominion", aggressiveness: "passive", primaryColor: "#693504", secondaryColor: "#000000", isFallenEmpire: false, stocks: generateStocks([5000, 3000, 1500, 5500, 6500, 4000]) },
	{ name: "Blorg Commonality", aggressiveness: "moderate", primaryColor: "#20853C", secondaryColor: "#BD4B4B", isFallenEmpire: true, stocks: generateStocks([80000, 100000, 90000, 135000, 130000, 140000]) }
]

const MAX_BODIES = 10;
const MAX_THETA = 360;

const SYSTEM_OWNERSHIP_PERCENT = 0.05; // Percent of total systems an empire will own

const ASTEROID_PROBABILITY = 0.1;
const PLANET_TYPES = ["arid", "desert", "savannah", "alpine", "arctic", "tundra", "continental", "ocean", "tropical"];

function roundToTwoPlaces(n) {
	return Math.round(n * 100) / 100;
}

function randTheta() {
	return roundToTwoPlaces(Math.random() * MAX_THETA);
}

function randOrbitalRadius(minRadius) {
	return roundToTwoPlaces(minRadius + (1 - minRadius) * Math.random());
}

function randFrom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

function randomFromInterval(min, max) {
	return Math.random() * (max - min) + min;
}

function takeFrom(list) {
	var index = Math.floor(Math.random() * list.length);
	var item = list[index];
	list.splice(index, 1);
	return item;
}

function generateResourceDeposit() {
	var resourceDatum = resourceData[Math.floor(Math.random() * resourceData.length)]
	return {
		name: resourceDatum.name,
		quantity: Math.floor(Math.random() * (resourceDatum.max - resourceDatum.min)) + resourceDatum.min
	}
}

function generateBody(systemName, count) {
	var body = {
		theta: randTheta(),
		orbitalRadius: randOrbitalRadius(0.1),
		deposits: []
	}

	var rand = Math.random();
	if (rand < ASTEROID_PROBABILITY) {
		body.type = "asteroid";
		body.planetType = null;
// Assuming will never end up with two asteroids of the same name
		body.name = systemName + " " + randFrom(asteroidPrefixes) + randFrom(asteroidPostfixes);
	} else {
		body.type = "planet";
		body.planetType = randFrom(PLANET_TYPES);
		body.name = systemName + " " + toRoman(count + 1);
	}

	var nDeposits = Math.floor(Math.random() * 3);
	for (var i = 0; i < nDeposits; i++) {
		do {
			var deposit = generateResourceDeposit();
		} while (body.deposits.find(e => e.name == deposit.name) != undefined)
		body.deposits.push(deposit);
	}

	return body;
}

function generateSystem(orbitalRadius, theta) {
	var system = {
		name: takeFrom(systemNames), // To ensure no two systems have the same name
		type: randFrom(systemTypes),
		star1Type: null,
		star2Type: null,
		star3Type: null,
		theta: theta,
		orbitalRadius: orbitalRadius,
		bodies: [],
		empireName: null
	};

	switch (system.type){
		case "unary":
			system.star1Type = randFrom(STAR_TYPES);
			break;
		case "binary":
			system.star1Type = randFrom(STAR_TYPES);
			system.star2Type = randFrom(STAR_TYPES);
			break;
		case "trinary":
			system.star1Type = randFrom(STAR_TYPES);
			system.star2Type = randFrom(STAR_TYPES);
			system.star3Type = randFrom(STAR_TYPES);
			break;
		default:
			console.error("Unknown system type: " + system.type);
	}

	var nBodies = Math.floor(Math.random() * MAX_BODIES);
	for (var i = 0; i < nBodies; i++) {
        var body = null;
        do {
            body = generateBody(system.name, i);
        } while(system.bodies.find(e => e.name == body.name) != undefined);
        system.bodies.push(body);
	}

	return system;
}

function getSystemPosition(system){
	const MAX_RADIUS = 1.0;
	var radius = MAX_RADIUS * system.orbitalRadius;
	var theta = system.theta * 2 * Math.PI / 360;
	var x = radius * Math.cos(theta);
	var y = radius * Math.sin(theta);
	return {
		x: x,
		y: y
	};
}

function getSystemsWithinRadius(system, systems, radius){
	var center = getSystemPosition(system);
	var result = [];
	for(var i = 0; i < systems.length; i++){
		if(systems[i].name == system.name){
			continue;
		}
		var pos = getSystemPosition(systems[i]);
		var x_delta = pos.x - center.x;
		var y_delta = pos.y - center.y;
		var distance = Math.sqrt(x_delta * x_delta + y_delta * y_delta);
		if(distance <= radius){
			result.push(systems[i]);
		}
	}
	return result;
}

function growEmpire(empire_name, systems, empire_hyperlanes, edge_systems = null, owned_systems = null) {
	// Setup owned_systems if null
	owned_systems = (owned_systems == null) ? [] : owned_systems;

	// Setup edge_systems if null
	if (edge_systems == null) {
		var system = randFrom(systems);

		edge_systems = [system];

		owned_systems.push(system);
		system.empireName = empire_name;
	}

	var new_edge_systems = [];

	// For each edge system, add all its connections
	for (var i = 0; i < edge_systems.length; i++) {
		var starting_system = edge_systems[i];

		var connections = empire_hyperlanes.filter(e => (e.system1Name == starting_system.name && !owned_systems.includes(e.system2Name)));

		if (connections != null) {
			for (var j = 0; j < connections.length; j++) {
				// Stop growing empire when it owns enough systems
				if (owned_systems.length > (systems.length * SYSTEM_OWNERSHIP_PERCENT)) {
					return;
				}

				// This could end up reassigning a system, but this will just add a small amount of randomness to the number of systems each empire owns
				var system = systems.find(e => e.name == connections[j].system2Name);
				owned_systems.push(system);
				new_edge_systems.push(system);
				system.empireName = empire_name;
			}
		}
	}

	if (new_edge_systems.length > 0) {
		growEmpire(empire_name, systems, empire_hyperlanes, new_edge_systems, owned_systems);
	}
}

function generateResourceDepositSQL(deposit, bodyName, SQLCollection) {
	SQLCollection.resourceDepositSQL += `\t((SELECT bodyID FROM bodies WHERE bodies.name="${bodyName}"), (SELECT resourceID FROM resources WHERE resources.name="${deposit.name}"), ${deposit.quantity}),\n`;
}

function generateResourceStockSQL(resourceStock, empireName, SQLCollection) {
	SQLCollection.resourceStockSQL += `\t((SELECT empireID from empires WHERE empires.name="${empireName}"), (SELECT resourceID from resources WHERE resources.name="${resourceStock.name}"), ${resourceStock.quantity}),\n`;
}

function generateResourceSQL(resource, SQLCollection) {
	SQLCollection.resourceSQL += `\t("${resource.name}", ${resource.baseMarketValue}, "${resource.color}"),\n`;
}

function generateBodySQL(body, systemName, SQLCollection) {
	var planetType = body.planetType == null ? null : `"${body.planetType}"`;
	SQLCollection.bodySQL += `\t("${body.name}", "${body.type}", ${planetType}, ${body.theta}, ${body.orbitalRadius}, (SELECT systemID FROM systems WHERE systems.name="${systemName}")),\n`
	for (var i = 0; i < body.deposits.length; i++) {
		generateResourceDepositSQL(body.deposits[i], body.name, SQLCollection);
	}
}

function generateSystemSQL(system, SQLCollection) {
	var empireId = null;
	if (system.empireName != null) {
		empireId = `(SELECT empireID FROM empires WHERE empires.name="${system.empireName}")`;
	}
	var star1Type = (system.star1Type == null) ? null : `"${system.star1Type}"`;
	var star2Type = (system.star2Type == null) ? null : `"${system.star2Type}"`;
	var star3Type = (system.star3Type == null) ? null : `"${system.star3Type}"`;
	SQLCollection.systemSQL += `\t("${system.name}", "${system.type}", ${star1Type}, ${star2Type}, ${star3Type}, ${system.theta}, ${system.orbitalRadius}, ${empireId}),\n`;
	for (var i = 0; i < system.bodies.length; i++) {
		generateBodySQL(system.bodies[i], system.name, SQLCollection);
	}
}

function generateEmpireSQL(empire, SQLCollection) {
	SQLCollection.empireSQL += `\t("${empire.name}", "${empire.aggressiveness}", "${empire.primaryColor}", "${empire.secondaryColor}", ${empire.isFallenEmpire}),\n`;
	for (var i = 0; i < empire.stocks.length; i++) {
		generateResourceStockSQL(empire.stocks[i], empire.name, SQLCollection);
	}
}

function generateHyperlaneSQL(hyperlane, SQLCollection) {
	SQLCollection.hyperlaneSQL += `\t((SELECT systemID FROM systems WHERE systems.name="${hyperlane.system1Name}"), (SELECT systemID from systems WHERE systems.name="${hyperlane.system2Name}")),\n`;
}

function startInserts(SQLCollection) {
	SQLCollection.empireSQL += "INSERT INTO empires (name, aggressiveness, primaryColor, secondaryColor, isFallenEmpire) VALUES\n";
	SQLCollection.systemSQL += "INSERT INTO systems (name, type, star1Type, star2Type, star3Type, theta, orbitalRadius, empireID) VALUES\n";
	SQLCollection.bodySQL += "INSERT INTO bodies (name, type, planetType, theta, orbitalRadius, systemID) VALUES\n";
	SQLCollection.resourceSQL += "INSERT INTO resources (name, baseMarketValue, color) VALUES\n";
	SQLCollection.hyperlaneSQL += "INSERT INTO hyperlanes (system1ID, system2ID) VALUES\n";
	SQLCollection.resourceStockSQL += "INSERT INTO resource_stocks (empireID, resourceID, quantity) VALUES\n";
	SQLCollection.resourceDepositSQL += "INSERT INTO resource_deposits (bodyID, resourceID, quantity) VALUES\n";
}

function endInserts(SQLCollection) {
	var queries = ["empireSQL", "systemSQL", "bodySQL", "resourceSQL", "hyperlaneSQL", "resourceStockSQL", "resourceDepositSQL"];
	queries.map(x => {
		// Remove the last comma and add a semicolon
		var lastCommaIndex = SQLCollection[x].lastIndexOf(",");
		SQLCollection[x] = SQLCollection[x].substring(0, lastCommaIndex) + SQLCollection[x].substring(lastCommaIndex + 1) + ";";
	});
}

function generateSQL(nSystems) {
	var SQLCollection = {
		empireSQL: "",
		systemSQL: "",
		bodySQL: "",
		resourceSQL: "",
		hyperlaneSQL: "",
		resourceStockSQL: "",
		resourceDepositSQL: ""
	};

	// Start the INSERT queries
	startInserts(SQLCollection);

	// Generate empire SQL
	for (var i = 0; i < empireData.length; i++) {
		generateEmpireSQL(empireData[i], SQLCollection);
	}

	// Generate systems
	var systems = [];
	const RING_DISTANCE = 0.05;
	const SYSTEM_DISTANCE = 0.1;

	const MIN_THETA = 0;
	const MAX_THETA = 360;

	const MIN_ORBITAL_RADIUS = 0.25;
	const MAX_ORBITAL_RADIUS = 1.0;

	const MAX_RADIUS_VARIANCE_PERCENT = 0.05;
	const MAX_THETA_VARIANCE_PERCENT = 0.35;

	var ring_count = (MAX_ORBITAL_RADIUS - MIN_ORBITAL_RADIUS) / RING_DISTANCE;

	for(var i = 0; i < ring_count; i++) {
		var radius = MIN_ORBITAL_RADIUS + (i / ring_count) * (MAX_ORBITAL_RADIUS - MIN_ORBITAL_RADIUS);
		var circumference = 2 * Math.PI * radius;
		var step_count = Math.floor(circumference / SYSTEM_DISTANCE);
		var theta_step = 360 / step_count;
		for(var j = 0; j < step_count; j++) {
			var theta = j * theta_step;

			radius = radius + (randomFromInterval(-1, 1) * RING_DISTANCE * MAX_RADIUS_VARIANCE_PERCENT);
			theta = theta + (randomFromInterval(-1, 1) * theta_step * MAX_THETA_VARIANCE_PERCENT);

			radius = Math.max(Math.min(radius, MAX_ORBITAL_RADIUS), MIN_ORBITAL_RADIUS)
			theta = Math.max(Math.min(theta, MAX_THETA), MIN_THETA);

			if(radius >= MIN_ORBITAL_RADIUS && radius <= MAX_ORBITAL_RADIUS) {
				systems.push(generateSystem(radius, theta));
			}
		}
	}
	// console.log("Generated " + systems.length + " systems");
	nSystems = systems.length; // TODO

    var bodies = [];
    // Check for duplicate system names
    for(var i = 0; i < systems.length; i++) {
        bodies = bodies.concat(systems[i].bodies);
        var count = systems.filter(e => e.name == systems[i].name).length;
        if(count != 1){
            console.error("Error: " + count + " systems with name \"" + systems[i].name + "\"");
        }
    }

    // Check for duplicate body names
    for(var i = 0; i < bodies.length; i++) {
        var count = bodies.filter(e => e.name == bodies[i].name).length;
        if(count != 1){
            console.error("Error: " + count + " bodies with name \"" + bodies[i].name + "\"");
        }
    }

	// Generate resource SQL
	for (var i = 0; i < resourceData.length; i++) {
		generateResourceSQL(resourceData[i], SQLCollection);
	}

	// Generate hyperlanes & their SQL

	if(nSystems > 1) {
		const HYPERLANE_DIST_STEP = 0.02;
		var hyperlanes = [];
		for(var i = 0; i < systems.length; i++) {
			var connection_candidates = [];
			var dist = HYPERLANE_DIST_STEP;
			while(connection_candidates.length < 2) {
				connection_candidates = getSystemsWithinRadius(systems[i], systems, dist);
				dist += HYPERLANE_DIST_STEP;
			}

			var connection_count = 0;

			for(var j = 0; j < connection_candidates.length; j++) {
				if(Math.random() < 0.9) {
					var hyperlane = {
						system1Name: systems[i].name,
						system2Name: connection_candidates[j].name
					};
					if(hyperlanes.find(e => ((e.system1Name == hyperlane.system1Name) && (e.system2Name == hyperlane.system2Name)) ||
						((e.system1Name == hyperlane.system2Name) && (e.system2Name == hyperlane.system1Name))) == undefined) {

						generateHyperlaneSQL(hyperlane, SQLCollection);
						connection_count++;
						hyperlanes.push(hyperlane);
					}
				}
			}
		}
	}

	// Assign systems to empires

	// Create an array of hyperlanes that contain both forward and backward hyperlanes
	// This will make it easier to grow empires' owned systems
	var empire_hyperlanes = [];
	for (var i = 0; i < hyperlanes.length; i++) {
		empire_hyperlanes.push(hyperlanes[i]);
		empire_hyperlanes.push({
			system1Name: hyperlanes[i].system2Name,
			system2Name: hyperlanes[i].system1Name
		});
	}

	for (var i = 0; i < empireData.length; i++) {
		growEmpire(empireData[i].name, systems, empire_hyperlanes);
	}

	// Generate system SQL
	for (var i = 0; i < nSystems; i++) {
		generateSystemSQL(systems[i], SQLCollection);
	}

	// End the INSERT queries
	endInserts(SQLCollection);

	// Join together the queries and print
	var insertSQL = [SQLCollection.empireSQL, SQLCollection.systemSQL, SQLCollection.bodySQL, SQLCollection.resourceSQL, SQLCollection.hyperlaneSQL, SQLCollection.resourceStockSQL, SQLCollection.resourceDepositSQL].join("\n\n");
	console.log(insertSQL);
}

function main() {
	/*
	const parser = new ArgumentParser({
		description: "Generate the SQL for a random galaxy for Stellaris Sandbox"
	})
	parser.add_argument("nSystems", { type: "int", help: "Number of systems to generate in the galaxy" });
	args = parser.parse_args();
	generateSQL(args.nSystems);
	*/
	generateSQL(0);
}

main();

