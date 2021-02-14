var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mysql = require('./dbcon.js');

var app = express();
var port = 3845;

app.engine("handlebars", exphbs({
	defaultLayout: "main",
	helpers: require("./handlebars-helpers")
}));
app.set("view engine", "handlebars");
app.use(bodyParser.json());
app.use(express.static("public"));

function createDefaultContext(name) {
	var active = {};
	active[name] = true;
	return {
		active: active
	};
}


app.get("/", (req, res, next) => {
	var pageName = "homePage";
	var context = createDefaultContext(pageName);
	res.status(200).render(pageName, context);
});

//
// EMPIRES =====================================================================
//

app.get("/empires", (req, res, next) => {
	var pageName = "empiresPage";
	var context = createDefaultContext(pageName);
	mysql.pool.query("SELECT * FROM empires", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.empires = rows;;
			res.status(200).render(pageName, context);
		}
	});
});

app.get("/empires/create", (req, res, next) => {
	var pageName = "individualEmpirePage";
	var context = createDefaultContext(pageName);
	context.type = "create";
	context.empire = {
		"name": "",
		"aggressiveness": "Moderate",
		"primaryColor": "#000000",
		"secondaryColor": "#FFFFFF",
		"isFallenEmpire": false
	};

	res.status(200).render(pageName, context);
});

app.get("/empires/view/:id", (req, res, next) => {
	var empireId = parseInt(req.params.id);
	var idIsInt = (empireId != NaN) && (String(empireId) == req.params.id);
	if (idIsInt && empireId >= 0) {
		var pageName = "individualEmpirePage";
		var context = createDefaultContext(pageName);
		context.type = "view";

		mysql.pool.query("SELECT * FROM empires WHERE empires.empireID = " + empireId, (err, rows, fields) => {
			if(err) {
				res.status(500).send(err);
			} else {
				if(rows != null && rows.length == 1) {
					context.empire = rows[0];
				} else {
					// TODO error
				}
				res.status(200).render(pageName, context);
			}
		});
	} else {
		next();
	}
});

app.get("/empires/edit/:id", (req, res, next) => {
	var empireId = parseInt(req.params.id);
	var idIsInt = (empireId != NaN) && (String(empireId) == req.params.id);
	if (idIsInt && empireId >= 0) {
		var pageName = "individualEmpirePage";
		var context = createDefaultContext(pageName);
		context.type = "edit";

		var empire = empires[empireId]; // TODO: Replace with call to database
		context.empire = empire;

		res.status(200).render(pageName, context);
	} else {
		next();
	}
});

app.post('/empires/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("aggressiveness") &&
		req.body.hasOwnProperty("primary_color") &&
		req.body.hasOwnProperty("secondary_color") &&
		req.body.hasOwnProperty("fallen_empire")
	) {
		req.body["id"] = empires.length;
		empires.push(req.body);
		saveJSON();
		res.status(200).send("Empire successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a name, aggresiveness, primary_color, secondary_color, and fallen_empire."
		});
	}
});

app.post("/empires/update/:id", (req, res, next) => {
	var empireId = parseInt(req.params.id);
	var idIsInt = (empireId != NaN) && (String(empireId) == req.params.id);
	if (idIsInt && empireId >= 0) {
		if (req.hasOwnProperty("body") &&
			req.body.hasOwnProperty("name") &&
			req.body.hasOwnProperty("aggressiveness") &&
			req.body.hasOwnProperty("primary_color") &&
			req.body.hasOwnProperty("secondary_color") &&
			req.body.hasOwnProperty("fallen_empire")
		) {
			empires[empireId] = req.body;
			saveJSON();
			res.status(200).send("Empire successfully updated");
		} else {
			res.status(400).send({
				error: "Request body needs a name, aggressiveness, primary color, secondary color, and whether it is a fallen empire.."
			});
		}
	} else {
		res.status(400).send({
			error: "Bad empire ID."
		});
	}
});

app.post("/empires/delete", (req, res, next) => {
	if (req.hasOwnProperty("body") && req.body.hasOwnProperty("id"))
	{
		var empireId = req.body.id;
		if (empireId >= 0) {
			// TODO: Replace with working with the DB
			empires.splice(empireId, 1);
			for (var i = empireId; i < empires.length; i++) {
				empires[i].id -= 1;
			}
			saveJSON();
			res.status(200).send("Empire successfully deleted");
		} else {
			res.status(400).send({
				error: "Empire body ID."
			});
		}
	} else {
		res.status(400).send({
			error: "Request body needs an id."
		});
	}
});

//
// SYSTEMS =====================================================================
//

app.get("/systems", (req, res, next) => {
	var pageName = "systemsPage";
	var context = createDefaultContext(pageName);
	mysql.pool.query("SELECT * FROM systems", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.systems = rows;;
			res.status(200).render(pageName, context);
		}
	});
});

app.get("/systems/create", (req, res, next) => {
	var pageName = "individualSystemPage";
	var context = createDefaultContext(pageName);
	context.type = "create";
	context.system = {
		"name": "",
		"star_count": 1,
		"orbital_radius": 0.5,
		"theta": 0
	};

	res.status(200).render(pageName, context);
});

app.get("/systems/view/:id", (req, res, next) => {
	var systemId = parseInt(req.params.id);
	var idIsInt = (systemId != NaN) && (String(systemId) == req.params.id);
	if (idIsInt && systemId >= 0) {
		var pageName = "individualSystemPage";
		var context = createDefaultContext(pageName);
		context.type = "view";

		mysql.pool.query("SELECT * FROM systems WHERE systems.systemID = " + systemId, (err, rows, fields) => {
			if(err) {
				res.status(500).send(err);
			} else {
				if(rows != null && rows.length == 1) {
					context.system = rows[0];

					mysql.pool.query("SELECT * FROM bodies WHERE bodies.systemID = " + systemId, (err, rows, fields) => {
						if(err) {
							res.status(500).send(err);
						} else {
							if(rows != null) {
								context.encoded_system = encodeURIComponent(JSON.stringify(context.system));
								context.encoded_system_bodies = encodeURIComponent(JSON.stringify(rows));
							} else {
								// TODO error
							}

							res.status(200).render(pageName, context);
						}
					});
				} else {
					// TODO error
				}
			}
		});
	} else {
		next();
	}
});

app.get("/systems/edit/:id", (req, res, next) => {
	var systemId = parseInt(req.params.id);
	var idIsInt = (systemId != NaN) && (String(systemId) == req.params.id);
	if (idIsInt && systemId >= 0) {
		var pageName = "individualSystemPage";
		var context = createDefaultContext(pageName);
		context.type = "edit";

		var system = systems[systemId]; // TODO: Replace with call to database
		context.system = system;

		res.status(200).render(pageName, context);
	} else {
		next();
	}
});

app.post('/systems/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("star_count") &&
		req.body.hasOwnProperty("orbital_radius") &&
		req.body.hasOwnProperty("theta")
	) {
		req.body["id"] = systems.length;
		systems.push(req.body);
		saveJSON();
		res.status(200).send("System successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a name, star_count, orbital_radius, and theta."
		});
	}
});

app.post("/systems/update/:id", (req, res, next) => {
	var systemId = parseInt(req.params.id);
	var idIsInt = (systemId != NaN) && (String(systemId) == req.params.id);
	if (idIsInt && systemId >= 0) {
		if (req.hasOwnProperty("body") &&
			req.body.hasOwnProperty("name") &&
			req.body.hasOwnProperty("star_count") &&
			req.body.hasOwnProperty("orbital_radius") &&
			req.body.hasOwnProperty("theta")
		) {
			systems[systemId] = req.body;
			saveJSON();
			res.status(200).send("System successfully updated");
		} else {
			res.status(400).send({
				error: "Request body needs a name, star_count, orbital_radius, and theta."
			});
		}
	} else {
		res.status(400).send({
			error: "Bad system ID."
		});
	}
});

app.post('/systems/search', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("search_query")
	) {
		console.log("Searched " + req.body.search_query); // TODO
		res.status(200).send("Searched query");
	} else {
		res.status(400).send({
			error: "Request body needs a search_query."
		});
	}
});

app.post("/systems/delete", (req, res, next) => {
	if (req.hasOwnProperty("body") && req.body.hasOwnProperty("id"))
	{
		var systemId = req.body.id;
		if (systemId >= 0) {
			// TODO: Replace with working with the DB
			systems.splice(systemId, 1);
			for (var i = systemId; i < systems.length; i++) {
				systems[i].id -= 1;
			}
			saveJSON();
			res.status(200).send("System successfully deleted");
		} else {
			res.status(400).send({
				error: "Bad system ID."
			});
		}
	} else {
		res.status(400).send({
			error: "Request body needs an id."
		});
	}
});

//
// HYPERLANES ==================================================================
//

app.get("/hyperlanes", (req, res, next) => {
	var pageName = "hyperlanesPage";
	var context = createDefaultContext(pageName);
	mysql.pool.query("SELECT * FROM hyperlanes", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.hyperlanes = rows;;
			res.status(200).render(pageName, context);
		}
	});
});

app.post('/hyperlanes/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("system1") &&
		req.body.hasOwnProperty("system2")
	) {
		hyperlanes.push(req.body);
		saveJSON();
		res.status(200).send("Hyperlane successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a system1 and system2."
		});
	}
});

//
// RESOURCES ===================================================================
// 

app.get("/resources", (req, res, next) => {
	var pageName = "resourcesPage";
	var context = createDefaultContext(pageName);
	mysql.pool.query("SELECT * FROM resources", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.resources = rows;;
			res.status(200).render(pageName, context);
		}
	});
});

app.get("/resources/create", (req, res, next) => {
	var pageName = "individualResourcePage";
	var context = createDefaultContext(pageName);
	context.type = "create";
	context.resource = {
		"name": "",
		"base_market_value": 1,
		"color": "#000000"
	};

	res.status(200).render(pageName, context);
});

app.get("/resources/view/:id", (req, res, next) => {
	var resourceId = parseInt(req.params.id);
	var idIsInt = (resourceId != NaN) && (String(resourceId) == req.params.id);
	if (idIsInt && resourceId >= 0) {
		var pageName = "individualResourcePage";
		var context = createDefaultContext(pageName);
		context.type = "view";

		mysql.pool.query("SELECT * FROM resources WHERE resources.resourceID = " + resourceId, (err, rows, fields) => {
			if(err) {
				res.status(500).send(err);
			} else {
				if(rows != null && rows.length == 1) {
					context.resource = rows[0];
				} else {
					// TODO error
				}

				res.status(200).render(pageName, context);
			}
		});
	} else {
		next();
	}
});

app.get("/resources/edit/:id", (req, res, next) => {
	var resourceId = parseInt(req.params.id);
	var idIsInt = (resourceId != NaN) && (String(resourceId) == req.params.id);
	if (idIsInt && resourceId >= 0) {
		var pageName = "individualResourcePage";
		var context = createDefaultContext(pageName);
		context.type = "edit";

		var resource = resources[resourceId]; // TODO: Replace with call to database
		context.resource = resource;

		res.status(200).render(pageName, context);
	} else {
		next();
	}
});

app.post('/resources/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("base_market_value") &&
		req.body.hasOwnProperty("color")
	) {
		req.body["id"] = resources.length;
		resources.push(req.body);
		saveJSON();
		res.status(200).send("Resource successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a name, base_market_value, and color."
		});
	}
});

app.post("/resources/update/:id", (req, res, next) => {
	var resourceId = parseInt(req.params.id);
	var idIsInt = (resourceId != NaN) && (String(resourceId) == req.params.id);
	if (idIsInt && resourceId >= 0) {
		if (req.hasOwnProperty("body") &&
			req.body.hasOwnProperty("name") &&
			req.body.hasOwnProperty("base_market_value") &&
			req.body.hasOwnProperty("color")
		) {
			resources[resourceId] = req.body;
			saveJSON();
			res.status(200).send("Resource successfully updated");
		} else {
			res.status(400).send({
				error: "Request body needs a name, base market value, and color."
			});
		}
	} else {
		res.status(400).send({
			error: "Bad resource ID."
		});
	}
});

app.post("/resources/delete", (req, res, next) => {
	if (req.hasOwnProperty("body") && req.body.hasOwnProperty("id"))
	{
		var resourceId = req.body.id;
		if (resourceId >= 0) {
			// TODO: Replace with working with the DB
			resources.splice(resourceId, 1);
			for (var i = resourceId; i < resources.length; i++) {
				resources[i].id -= 1;
			}
			saveJSON();
			res.status(200).send("Resource successfully deleted");
		} else {
			res.status(400).send({
				error: "Bad resource ID."
			});
		}
	} else {
		res.status(400).send({
			error: "Request body needs an id."
		});
	}
});

//
// BODIES ======================================================================
// 

app.get("/bodies", (req, res, next) => {
	var pageName = "bodiesPage";
	var context = createDefaultContext(pageName);
	mysql.pool.query("SELECT * FROM bodies", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.bodies = rows;;
			res.status(200).render(pageName, context);
		}
	});
});

app.get("/bodies/create", (req, res, next) => {
	var pageName = "individualBodyPage";
	var context = createDefaultContext(pageName);
	context.type = "create";
	context.body = {
		"name": "",
		"type": "Planet",
		"orbital_radius": 0.5,
		"theta": 0
	};

	res.status(200).render(pageName, context);
});

app.get("/bodies/view/:id", (req, res, next) => {
	var bodyId = parseInt(req.params.id);
	var idIsInt = (bodyId != NaN) && (String(bodyId) == req.params.id);
	if (idIsInt && bodyId >= 0) {
		var pageName = "individualBodyPage";
		var context = createDefaultContext(pageName);
		context.type = "view";

		mysql.pool.query("SELECT * FROM bodies WHERE bodies.bodyID = " + bodyId, (err, rows, fields) => {
			if(err) {
				res.status(500).send(err);
			} else {
				if(rows != null && rows.length == 1) {
					context.body = rows[0];
				} else {
					// TODO error
				}

				res.status(200).render(pageName, context);
			}
		});
	} else {
		next();
	}
});

app.get("/bodies/edit/:id", (req, res, next) => {
	var bodyId = parseInt(req.params.id);
	var idIsInt = (bodyId != NaN) && (String(bodyId) == req.params.id);
	if (idIsInt && bodyId >= 0) {
		var pageName = "individualBodyPage";
		var context = createDefaultContext(pageName);
		context.type = "edit";

		var body = bodies[bodyId]; // TODO: Replace with call to database
		context.body = body;

		res.status(200).render(pageName, context);
	} else {
		next();
	}
});

app.post('/bodies/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("type") &&
		req.body.hasOwnProperty("orbital_radius") &&
		req.body.hasOwnProperty("theta")
	) {
		req.body["id"] = bodies.length;
		bodies.push(req.body);
		saveJSON();
		res.status(200).send("Body successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a name, type, orbital_radius, and theta."
		});
	}
});

app.post("/bodies/update/:id", (req, res, next) => {
	var bodyId = parseInt(req.params.id);
	var idIsInt = (bodyId != NaN) && (String(bodyId) == req.params.id);
	if (idIsInt && bodyId >= 0) {
		if (req.hasOwnProperty("body") &&
			req.body.hasOwnProperty("name") &&
			req.body.hasOwnProperty("type") &&
			req.body.hasOwnProperty("orbital_radius") &&
			req.body.hasOwnProperty("theta")
		) {
			bodies[bodyId] = req.body;
			saveJSON();
			res.status(200).send("Body successfully updated");
		} else {
			res.status(400).send({
				error: "Request body needs a name, type, orbital_radius, and theta."
			});
		}
	} else {
		res.status(400).send({
			error: "Bad body ID."
		});
	}
});

app.post("/bodies/delete", (req, res, next) => {
	if (req.hasOwnProperty("body") && req.body.hasOwnProperty("id"))
	{
		var bodyId = req.body.id;
		if (bodyId >= 0) {
			// TODO: Replace with working with the DB
			bodies.splice(bodyId, 1);
			for (var i = bodyId; i < bodies.length; i++) {
				bodies[i].id -= 1;
			}
			saveJSON();
			res.status(200).send("Body successfully deleted");
		} else {
			res.status(400).send({
				error: "Bad body ID."
			});
		}
	} else {
		res.status(400).send({
			error: "Request body needs an id."
		});
	}
});

//
// RESOURCE STOCKS =============================================================
//

app.get("/resource-stocks", (req, res, next) => {
	var pageName = "resourceStockPage";
	var context = createDefaultContext(pageName);
	mysql.pool.query("SELECT * FROM resource_stocks", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.resourceStocks = rows;;
			res.status(200).render(pageName, context);
		}
	});
});

app.post('/resource-stocks/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("empire") &&
		req.body.hasOwnProperty("resource") &&
		req.body.hasOwnProperty("quantity")
	) {
		resourceStocks.push(req.body);
		saveJSON();
		res.status(200).send("Resource stock successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs an empire, resource, and quanitity."
		});
	}
});

//
// RESOURCE DEPOSITS ===========================================================
//

app.get("/resource-deposits", (req, res, next) => {
	var pageName = "resourceDepositPage";
	var context = createDefaultContext(pageName);
	mysql.pool.query("SELECT * FROM resource_deposits", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.resourceDeposits = rows;;
			res.status(200).render(pageName, context);
		}
	});
});

app.post("/resource-deposits/add", (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("body") &&
		req.body.hasOwnProperty("resource") &&
		req.body.hasOwnProperty("quantity")
	) {
		resourceDeposits.push(req.body);
		saveJSON();
		res.status(200).send("Resource deposit successfully added");
	} else {
		res.status(400).send({
			error: "Request body needs a body, resource, and quantity."
		});
	}
});

//
// OTHER =======================================================================
//

app.get('*', (req, res) => {
	res.status(404).send("The page you requested doesn't exist");
});

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
