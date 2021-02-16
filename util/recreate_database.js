const fs = require("fs");
var mysql = require("../dbcon.js");

var queryComplete = false;

async function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function execFile(fileName) {
	const fileLines = fs.readFileSync(fileName, "utf-8").split(/\r?\n/);

	builtLine = "";
	for (var i in fileLines) {
		var line = fileLines[i];
		line = line.trim();
		if (line.length > 0 && !line.startsWith("--")) {
			builtLine += line;
			if (line.endsWith(";")) {
				console.log(builtLine.substring(0, 80));
				queryComplete = false;
				mysql.pool.query(builtLine, (error, result, filter) => {
					if (error) {
						console.log(error);
						throw error;
					}
					queryComplete = true;
				});
				while (!queryComplete) {
					await sleep(10);
				}
				builtLine = "";
			}
		}
	}
}

async function main() {
	await execFile("queries/delete_all.sql");
	await execFile("queries/data_definition_queries.sql");
	process.exit(0);
}

main();

