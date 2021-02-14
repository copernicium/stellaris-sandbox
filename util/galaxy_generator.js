const { ArgumentParser } = require("argparse");
var toRoman = require("roman-numerals").toRoman;

const systemNames = require("./stellaris_data/system_names.json");
const asteroidPrefixes = require("./stellaris_data/asteroid_prefixes.json");
const asteroidPostfixes = require("./stellaris_data/asteroid_postfixes.json");

const systemTypes = ["unary", "binary", "trinary"];

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

const HYPERLANE_PERCENT = 0.1;
const SYSTEM_OWNERSHIP_PERCENT = 0.05; // Percent of total systems an empire will own

const ASTEROID_PROBABILITY = 0.1;

function roundToTwoPlaces(n) {
	return Math.round(n * 100) / 100;
}

function randTheta() {
	return roundToTwoPlaces(Math.random() * MAX_THETA);
}

function randOrbitalRadius() {
	return roundToTwoPlaces(Math.random());
}

function randFrom(list) {
	return list[Math.floor(Math.random() * list.length)];
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
		orbitalRadius: randOrbitalRadius(),
		deposits: []
	}

	var rand = Math.random();
	if (rand < ASTEROID_PROBABILITY) {
		body.type = "asteroid";
// Assuming will never end up with two asteroids of the same name
		body.name = randFrom(asteroidPrefixes) + randFrom(asteroidPostfixes);
	} else {
		body.type = "planet";
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

function generateSystem() {
	var system = {
		name: takeFrom(systemNames), // To ensure no two systems have the same name
		type: randFrom(systemTypes),
		theta: randTheta(),
		orbitalRadius: randOrbitalRadius(),
		bodies: [],
		empireName: null
	};

	var nBodies = Math.floor(Math.random() * MAX_BODIES);
	for (var i = 0; i < nBodies; i++) {
		system.bodies.push(generateBody(system.name, i));
	}

	return system;
}

function generateHyperlane(systems, hyperlanes) {
	do {
		var hyperlane = {
			system1Name: randFrom(systems).name,
			system2Name: randFrom(systems).name
		}
	} while ((hyperlane.system1Name == hyperlane.system2Name) || (hyperlanes.find(e => (e.system1Name == hyperlane.system1Name) && (e.system2Name == hyperlane.system2Name)) != undefined));
	return hyperlane;
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
	SQLCollection.bodySQL += `\t("${body.name}", "${body.type}", ${body.theta}, ${body.orbitalRadius}, (SELECT systemID FROM systems WHERE systems.name="${systemName}")),\n`
	for (var i = 0; i < body.deposits.length; i++) {
		generateResourceDepositSQL(body.deposits[i], body.name, SQLCollection);
	}
}

function generateSystemSQL(system, SQLCollection) {
	var empireId = null;
	if (system.empireName != null) {
		empireId = `(SELECT empireID FROM empires WHERE empires.name="${system.empireName}")`;
	}
	SQLCollection.systemSQL += `\t("${system.name}", "${system.type}", ${system.theta}, ${system.orbitalRadius}, ${empireId}),\n`;
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
	SQLCollection.systemSQL += "INSERT INTO systems (name, type, theta, orbitalRadius, empireID) VALUES\n";
	SQLCollection.bodySQL += "INSERT INTO bodies (name, type, theta, orbitalRadius, systemID) VALUES\n";
	SQLCollection.resourceSQL += "INSERT INTO resources (name, baseMarketValue, color) VALUES\n";
	SQLCollection.hyperlaneSQL += "INSERT INTO hyperlanes (system1ID, system2ID) VALUES\n";
	SQLCollection.resourceStockSQL += "INSERT INTO resource_stocks (empireID, resourceID, quantity) VALUES\n";
	SQLCollection.resourceDepositSQL += "INSERT INTO resource_deposits (bodyID, resourceID, quantity) VALUES\n";
}

function endInserts(SQLCollection) {
	SQLCollection.empireSQL += ";"
	SQLCollection.systemSQL += ";";
	SQLCollection.bodySQL += ";";
	SQLCollection.resourceSQL += ";";
	SQLCollection.hyperlaneSQL += ";";
	SQLCollection.resourceStockSQL += ";";
	SQLCollection.resourceDepositSQL += ";";
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
	for (var i = 0; i < nSystems; i++) {
		systems.push(generateSystem());
	}

	// Assign systems to empires
	for (var i = 0; i < empireData.length; i++) {
		for (var j = 0; j < (nSystems * SYSTEM_OWNERSHIP_PERCENT); j++) {
			// This could end up reassigning a system, but this will just add a small amount of randomness to the number of systems each empire owns
			randFrom(systems).empireName = empireData[i].name;
		}
	}

	// Generate system SQL
	for (var i = 0; i < nSystems; i++) {
		generateSystemSQL(systems[i], SQLCollection);
	}

	// Generate resource SQL
	for (var i = 0; i < resourceData.length; i++) {
		generateResourceSQL(resourceData[i], SQLCollection);
	}

	// Generate hyperlanes & their SQL
	if (nSystems > 1) {
		var hyperlanes = [];
		var maxHyperlanes = (nSystems * (nSystems + 1)) / 2;
		var nHyperlanes = maxHyperlanes * HYPERLANE_PERCENT;
		for (var i = 0; i < nHyperlanes; i++) {
			var hyperlane = generateHyperlane(systems, hyperlanes);
			generateHyperlaneSQL(hyperlane, SQLCollection);
			hyperlanes.push(hyperlane);
		}
	}

	// End the INSERT queries
	endInserts(SQLCollection);

	// Join together the queries and print
	var insertSQL = [SQLCollection.empireSQL, SQLCollection.systemSQL, SQLCollection.bodySQL, SQLCollection.resourceSQL, SQLCollection.hyperlaneSQL, SQLCollection.resourceStockSQL, SQLCollection.resourceDepositSQL].join("\n\n");
	console.log(insertSQL);
}

function main() {
	const parser = new ArgumentParser({
		description: "Generate the SQL for a random galaxy for Stellaris Sandbox"
	})
	parser.add_argument("nSystems", { type: "int", help: "Number of systems to generate in the galaxy" });
	args = parser.parse_args();

	generateSQL(args.nSystems);
}

main();

