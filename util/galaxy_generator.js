const { ArgumentParser } = require("argparse");
var toRoman = require("roman-numerals").toRoman;

const systemNames = require("./stellaris_data/system_names.json");
const asteroidPrefixes = require("./stellaris_data/asteroid_prefixes.json");
const asteroidPostfixes = require("./stellaris_data/asteroid_postfixes.json");

const systemTypes = ["unary", "binary", "trinary"];
const resourceData = [
	{ name: "Energy Credits", min: 1, max: 4 },
	{ name: "Minerals", min: 3, max: 20 },
	{ name: "Alloys", min: 1, max: 3 },
	{ name: "Physics Research", min: 1, max: 6},
	{ name: "Society Research", min: 1, max: 6},
	{ name: "Engineering Research", min: 1, max: 6}
]

const MAX_BODIES = 10;
const MAX_THETA = 360;

const HYPERLANE_PERCENT = 0.1;

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
		body.deposits.push(generateResourceDeposit());
	}

	return body;
}

function generateSystem() {
	var system = {
		name: takeFrom(systemNames), // To ensure no two systems have the same name
		type: randFrom(systemTypes),
		theta: randTheta(),
		orbitalRadius: randOrbitalRadius(),
		bodies: []
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
	} while (hyperlanes.find(e => (e.system1Name == hyperlane.system1Name) && (e.system2Name == hyperlane.system2Name)) != undefined);	
	return hyperlane;
}

function generateResourceDepositSQL(deposit, body_name, SQLCollection) {
	SQLCollection.resourceDepositSQL += `\t((SELECT bodyID FROM bodies WHERE bodies.name="${body_name}"), (SELECT resourceID FROM resources WHERE resources.name="${deposit.name}"), ${deposit.quantity}),\n`;
}

function generateBodySQL(body, system_name, SQLCollection) {
	SQLCollection.bodySQL += `\t("${body.name}", "${body.type}", ${body.theta}, ${body.orbitalRadius}, (SELECT systemID FROM systems WHERE systems.name="${system_name}")),\n`
	for (var i = 0; i < body.deposits.length; i++) {
		generateResourceDepositSQL(body.deposits[i], body.name, SQLCollection);
	}
}

function generateSystemSQL(system, SQLCollection) {
	SQLCollection.systemSQL += `\t("${system.name}", "${system.type}", ${system.theta}, ${system.orbitalRadius}),\n`;
	for (var i = 0; i < system.bodies.length; i++) {
		generateBodySQL(system.bodies[i], system.name, SQLCollection);
	}
}

function generateHyperlaneSQL(hyperlane, SQLCollection) {
	SQLCollection.hyperlaneSQL += `\t((SELECT systemID FROM systems WHERE systems.name="${hyperlane.system1Name}"), (SELECT systemID from SYSTEMS WHERE systems.name="${hyperlane.system2Name}")),\n`;
}

function startInserts(SQLCollection) {
	SQLCollection.systemSQL += "INSERT INTO systems (name, type, theta, orbitalRadius) VALUES (\n";
	SQLCollection.bodySQL += "INSERT INTO bodies (name, type, theta, orbitalRadius, systemID) VALUES (\n";
	SQLCollection.hyperlaneSQL += "INSERT INTO hyperlanes (system1ID, system2ID) VALUES (\n";
	SQLCollection.resourceDepositSQL += "INSERT INTO resource_deposits (bodyID, resourceID, quantity) VALUES (\n";
}

function endInserts(SQLCollection) {
	SQLCollection.systemSQL += ");";
	SQLCollection.bodySQL += ");";
	SQLCollection.hyperlaneSQL += ");";
	SQLCollection.resourceDepositSQL += ");";
}

// TODO: Also generate empires and resources (just from constant lists)
function generateSQL(nSystems) {
	var SQLCollection = {
		systemSQL: "",
		bodySQL: "",
		hyperlaneSQL: "",
		resourceDepositSQL: ""
	};

	startInserts(SQLCollection);

	var systems = [];
	for (var i = 0; i < nSystems; i++) {
		var system = generateSystem();
		generateSystemSQL(system, SQLCollection);
		systems.push(system);
	}

	var hyperlanes = [];
	var maxHyperlanes = (nSystems * (nSystems + 1)) / 2;
	var nHyperlanes = maxHyperlanes * HYPERLANE_PERCENT;
	for (var i = 0; i < nHyperlanes; i++) {
		var hyperlane = generateHyperlane(systems, hyperlanes);
		generateHyperlaneSQL(hyperlane, SQLCollection);
		hyperlanes.push(hyperlane);
	}
	
	endInserts(SQLCollection);
	
	var insertSQL = [SQLCollection.systemSQL, SQLCollection.bodySQL, SQLCollection.hyperlaneSQL, SQLCollection.resourceDepositSQL].join("\n\n");
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

