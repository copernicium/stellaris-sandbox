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
		active: active,
		page_title: name
	};
}

function convertNullableString(str) {
	return str == "null" ? null : str;
}


app.get("/", (req, res, next) => {
	var pageName = "homePage";
	var context = createDefaultContext(pageName);
	context.page_title = "Stellaris Sandbox";
	res.status(200).render(pageName, context);
});

app.get("/about", (req, res, next) => {
	var pageName = "aboutPage";
	var context = createDefaultContext(pageName);
	context.page_title = "About";
	res.status(200).render(pageName, context);
});

//
// QUERIES =====================================================================
//

const HYPERLANES_QUERY = "SELECT s1.system1ID, s1.system2ID, s1.name AS system1Name, s2.name AS system2Name, s1.orbitalRadius AS system1OrbitalRadius, s1.theta AS system1Theta, s2.orbitalRadius AS system2OrbitalRadius, s2.theta AS system2Theta FROM (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name, systems.orbitalRadius, systems.theta FROM hyperlanes INNER JOIN systems ON hyperlanes.system1ID = systems.systemID) AS s1 INNER JOIN (SELECT hyperlanes.system1ID, hyperlanes.system2ID, systems.name, systems.orbitalRadius, systems.theta FROM hyperlanes INNER JOIN systems ON hyperlanes.system2ID = systems.systemID) AS s2 ON s1.system1ID = s2.system1ID AND s1.system2ID = s2.system2ID;";


//
// EMPIRES =====================================================================
//

app.get("/empires", (req, res, next) => {
	var pageName = "empiresPage";
	var context = createDefaultContext(pageName);
	context.page_title = "Empires";
	mysql.pool.query("SELECT * FROM empires ORDER BY name", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.empires = rows;
			res.status(200).render(pageName, context);
		}
	});
});

app.get("/empires/create", (req, res, next) => {
	var pageName = "individualEmpirePage";
	var context = createDefaultContext(pageName);
	context.page_title = "Create Empire";
	context.type = "create";
	context.empire = {
		"name": "",
		"aggressiveness": "Moderate",
		"primaryColor": "#000000",
		"secondaryColor": "#FFFFFF",
		"isFallenEmpire": false
	};

	addResourceSearchList(context, res, (context, res) => {
		res.status(200).render(pageName, context);
	});
});

function viewEditEmpireData(type, req, res, next) {
	var empireId = parseInt(req.params.id);
	var idIsInt = (empireId != NaN) && (String(empireId) == req.params.id);
	if (idIsInt && empireId >= 0) {
		var pageName = "individualEmpirePage";
		var context = createDefaultContext(pageName);
		context.page_title = type.charAt(0).toUpperCase() + type.slice(1) + " Empire";
		context.type = type;

		mysql.pool.query("SELECT * FROM empires WHERE empireID = ?", empireId, (err, rows, fields) => {
			if(err) {
				res.status(500).send(err);
			} else if (rows == null) {
				res.status(500).send("No rows returned");
			} else if (rows.length > 1) {
				res.status(500).send("Too many rows returned");
			} else {
				context.empire = rows[0];

				mysql.pool.query("SELECT * FROM systems WHERE systems.empireID = ? ORDER BY name", empireId, (err, rows, fields) => {
					if(err) {
						res.status(500).send(err);
					} else {
						context.owned_systems = rows;
						context.encoded_systems = encodeURIComponent(JSON.stringify(context.owned_systems));

						mysql.pool.query("SELECT resources.resourceID, resources.name, resources.color, rd.quantity FROM (SELECT * FROM resource_stocks WHERE resource_stocks.empireID = ?) AS rd INNER JOIN resources ON rd.resourceID = resources.resourceID ORDER BY resources.name", [empireId], (error, rows, fields) => {
							if (error) {
								res.status(500).send(error);
							} else {
								context.empire_resource_stocks = rows;
								addResourceSearchList(context, res, (context, res) => {
									res.status(200).render(pageName, context);
								});
							}
						});
					}
				});
			}
		});
	} else {
		next();
	}
}

app.get("/empires/view/:id", (req, res, next) => {
	viewEditEmpireData("view", req, res, next);
});

app.get("/empires/edit/:id", (req, res, next) => {
	viewEditEmpireData("edit", req, res, next);
});

app.post('/empires/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("aggressiveness") &&
		req.body.hasOwnProperty("primaryColor") &&
		req.body.hasOwnProperty("secondaryColor") &&
		req.body.hasOwnProperty("isFallenEmpire") &&
		req.body.hasOwnProperty("resourceStocks")
	) {
		mysql.pool.query("INSERT INTO empires(name, aggressiveness, primaryColor, secondaryColor, isFallenEmpire) VALUES (?,?,?,?,?)", [req.body.name, req.body.aggressiveness, req.body.primaryColor, req.body.secondaryColor, req.body.isFallenEmpire], (error, result, fields) => {
			if (error) {
				res.status(500).send(error);
			} else {
				var resourceStocks = req.body.resourceStocks;
				var stockCallback = (stockIndex) => {
					if (stockIndex == resourceStocks.length) {
						res.status(200).send("Empire successfully added");
					} else {
						var resourceStock = resourceStocks[stockIndex];
						mysql.pool.query("INSERT INTO resource_stocks(resourceID, empireID, quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=?", [resourceStock.resourceID, result.insertId, resourceStock.quantity, resourceStock.quantity], (error, result, fields) => {
							if (error) {
								res.status(500).send(error);
							} else {
								stockCallback(stockIndex + 1);
							}
						});
					}
				}
				stockCallback(0);
			}
		});
	} else {
		res.status(400).send({
			error: "Request body needs a name, aggressiveness, primaryColor, secondaryColor, isFallenEmpire, and resourceStocks."
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
			req.body.hasOwnProperty("primaryColor") &&
			req.body.hasOwnProperty("secondaryColor") &&
			req.body.hasOwnProperty("isFallenEmpire") &&
			req.body.hasOwnProperty("resourceStocks")
		) {
			mysql.pool.query("UPDATE empires SET name=?, aggressiveness=?, primaryColor=?, secondaryColor=?, isFallenEmpire=? WHERE empireID=?", [req.body.name, req.body.aggressiveness, req.body.primaryColor, req.body.secondaryColor, req.body.isFallenEmpire, empireId], (error, result, fields) => {
				if (error) {
					res.status(500).send(error);
				} else {
					var resourceStocks = req.body.resourceStocks;
					var stockCallback = (stockIndex) => {
						if (stockIndex == resourceStocks.length) {
							res.status(200).send("Empire successfully updated");
						} else {
							var resourceStock = resourceStocks[stockIndex];
							mysql.pool.query("INSERT INTO resource_stocks(resourceID, empireID, quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=?", [resourceStock.resourceID, empireId, resourceStock.quantity, resourceStock.quantity], (error, result, fields) => {
								if (error) {
									res.status(500).send(error);
								} else {
									stockCallback(stockIndex + 1);
								}
							});
						}
					}
					stockCallback(0);
				}
			});
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
			mysql.pool.query("DELETE FROM empires WHERE empireID=?", [empireId], (error, results, fields) => {
				if (error) {
					switch(error.code) {
						case "ER_ROW_IS_REFERENCED_2":
							if (error.sqlMessage.includes("systems"))
								res.status(500).send("You cannot delete an empire that owns systems. Delete the owned systems or change their ownership and try again.");
							else
								res.status(500).send("You cannot delete an empire that has resource stocks. Delete its resource stocks and try again.");
							break;
						default:
							res.status(500).send(error);
							break;
					}
				} else {
					res.status(200).send("Empire successfully deleted");
				}
			});
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

function addEmpireSearchList(context, res, contFunc) {
	mysql.pool.query("SELECT empireID, name FROM empires ORDER BY name", (err, rows, fields) => {
		if (err) {
			res.status(500).send(err);
		} else if (rows == null) {
			res.status(500).send("No rows returned");
		} else {
			context.encoded_empire_search_list = encodeURIComponent(JSON.stringify(rows));
			contFunc(context, res);
		}
	});
}

//
// SYSTEMS =====================================================================
//

app.get("/systems", (req, res, next) => {
	var pageName = "systemsPage";
	var context = createDefaultContext(pageName);
	context.page_title = "Systems";
	mysql.pool.query("SELECT * FROM systems ORDER BY name", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			context.systems = rows;
			mysql.pool.query(HYPERLANES_QUERY, (err, rows, fields) => {
				if(err) {
					res.status(500).send(err);
				} else {
					if(rows != null) {
						context.encoded_hyperlane_details = encodeURIComponent(JSON.stringify(rows));
						context.encoded_systems = encodeURIComponent(JSON.stringify(context.systems));
						res.status(200).render(pageName, context);

					} else {
						// TODO error
					}
				}
			});
		}
	});
});

app.get("/systems/create", (req, res, next) => {
	var pageName = "individualSystemPage";
	var context = createDefaultContext(pageName);
	context.page_title = "Create System";
	context.type = "create";
	context.system = {
		"name": "",
		"type": "unary",
		"orbitalRadius": 0.5,
		"theta": 0
	};
	context.system_bodies = [];
	addEmpireSearchList(context, res, (context, res) => {
		res.status(200).render(pageName, context);
	});
});

function viewEditSystemData(type, req, res, next) {
	var systemId = parseInt(req.params.id);
	var idIsInt = (systemId != NaN) && (String(systemId) == req.params.id);
	if (idIsInt && systemId >= 0) {
		var pageName = "individualSystemPage";
		var context = createDefaultContext(pageName);
		context.page_title = type.charAt(0).toUpperCase() + type.slice(1) + " System";
		context.type = type;

		mysql.pool.query("SELECT * FROM systems WHERE systems.systemID = ?", systemId, (err, rows, fields) => {
			if(err) {
				res.status(500).send(err);
			} else if (rows == null) {
				res.status(500).send("No rows returned");
			} else if (rows.length > 1) {
				res.status(500).send("Too many rows returned");
			} else {
				context.system = rows[0];

				var bodiesCallback = (context) => {
					mysql.pool.query("SELECT * FROM bodies WHERE bodies.systemID = ? ORDER BY name", systemId, (err, rows, fields) => {
						if(err) {
							res.status(500).send(err);
						} else if (rows == null) {
							res.status(500).send("No rows returned");
						} else {
							context.system_bodies = rows;
							context.encoded_system = encodeURIComponent(JSON.stringify(context.system));
							context.encoded_system_bodies = encodeURIComponent(JSON.stringify(context.system_bodies));
							addEmpireSearchList(context, res, (context, res) => {
								res.status(200).render(pageName, context);
							});
						}
					});
				}

				if (context.system.empireID != null) {
					mysql.pool.query("SELECT name FROM empires WHERE empireID = ?", context.system.empireID, (err, rows, fields) => {
						if (err) {
							res.status(500).send(err);
						} else if (rows == null) {
							res.status(500).send("No rows returned");
						} else if (rows > 1) {
							res.status(500).send("Too many rows returned");
						} else {
							context.owning_empire_name = rows[0].name;
							bodiesCallback(context);
						}
					});
				} else {
					context.owning_empire_name = "None"
					bodiesCallback(context);
				}
			}
		});
	} else {
		next();
	}
}

app.get("/systems/view/:id", (req, res, next) => {
	viewEditSystemData("view", req, res, next);
});

app.get("/systems/edit/:id", (req, res, next) => {
	viewEditSystemData("edit", req, res, next);
});

app.post('/systems/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("type") &&
		req.body.hasOwnProperty("orbitalRadius") &&
		req.body.hasOwnProperty("theta") &&
		req.body.hasOwnProperty("owningEmpireID")
	) {
		mysql.pool.query("INSERT INTO systems(name, type, orbitalRadius, theta, empireID) VALUES (?,?,?,?,?)", [req.body.name, req.body.type, req.body.orbitalRadius, req.body.theta, convertNullableString(req.body.owningEmpireID)], (error, result, fields) => {
			if (error) {
				res.status(500).send(error);
			} else {
				res.status(200).send("System successfully added");
			}
		});
	} else {
		res.status(400).send({
			error: "Request body needs a name, type, orbitalRadius, theta, and owningEmpireID."
		});
	}
});

app.post("/systems/update/:id", (req, res, next) => {
	var systemId = parseInt(req.params.id);
	var idIsInt = (systemId != NaN) && (String(systemId) == req.params.id);
	if (idIsInt && systemId >= 0) {
		if (req.hasOwnProperty("body") &&
			req.body.hasOwnProperty("name") &&
			req.body.hasOwnProperty("type") &&
			req.body.hasOwnProperty("orbitalRadius") &&
			req.body.hasOwnProperty("theta") &&
			req.body.hasOwnProperty("owningEmpireID")
		) {
			mysql.pool.query("UPDATE systems SET name=?, type=?, orbitalRadius=?, theta=?, empireID=? WHERE systemID=?", [req.body.name, req.body.type, req.body.orbitalRadius, req.body.theta, convertNullableString(req.body.owningEmpireID), systemId], (error, result, fields) => {
				if (error) {
					res.status(500).send(error);
				} else {
					res.status(200).send("System successfully updated");
				}
			});
		} else {
			res.status(400).send({
				error: "Request body needs a name, type, orbitalRadius, theta, and owningEmpireID."
			});
		}
	} else {
		res.status(400).send({
			error: "Bad system ID."
		});
	}
});

app.get("/systems/search/:search_query?", (req, res, next) => {
	var search_query = (req.params == null || req.params.search_query == null) ? "" : decodeURIComponent(req.params.search_query);
	mysql.pool.query("SELECT * FROM systems WHERE systems.name LIKE ? ORDER BY name;", "%" + search_query + "%", (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else {
			res.status(200).send(rows);
		}
	});
});

app.post("/systems/delete", (req, res, next) => {
	if (req.hasOwnProperty("body") && req.body.hasOwnProperty("id"))
	{
		var systemId = req.body.id;
		if (systemId >= 0) {
			mysql.pool.query("DELETE FROM systems WHERE systemID=?", [systemId], (error, results, fields) => {
				if (error) {
					switch(error.code) {
						case "ER_ROW_IS_REFERENCED_2":
							res.status(500).send("You cannot delete a system that contains bodies. Delete the contained bodies or change their parent system and try again.");
							break;
						default:
							res.status(500).send(error);
							break;
					}
				} else {
					res.status(200).send("System successfully deleted");
				}
			});
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

function addSystemSearchList(context, res, contFunc) {
	mysql.pool.query("SELECT systemID, name FROM systems ORDER BY name", (err, rows, fields) => {
		if (err) {
			res.status(500).send(err);
		} else if (rows == null) {
			res.status(500).send("No rows returned");
		} else {
			context.encoded_system_search_list = encodeURIComponent(JSON.stringify(rows));
			contFunc(context, res);
		}
	});
}

//
// HYPERLANES ==================================================================
//

app.get("/hyperlanes", (req, res, next) => {
	var pageName = "hyperlanesPage";
	var context = createDefaultContext(pageName);
	context.page_title = "Hyperlanes";
	mysql.pool.query(HYPERLANES_QUERY, (err, rows, fields) => {
		if(err) {
			res.status(500).send(err);
		} else if (rows == null) {
			res.status(500).send("No rows returned");
		} else {
			context.hyperlanes = rows;
			context.encoded_hyperlane_details = encodeURIComponent(JSON.stringify(rows));
			mysql.pool.query("SELECT * FROM systems;", (err, rows, fields) => {
				if(err) {
					res.status(500).send(err);
				} else {
					context.encoded_systems = encodeURIComponent(JSON.stringify(rows));

					addSystemSearchList(context, res, (context, res) => {
						res.status(200).render(pageName, context);
					});
				}
			});
		}
	});
});

app.post('/hyperlanes/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("system1ID") &&
		req.body.hasOwnProperty("system2ID")
	) {
		mysql.pool.query("INSERT INTO hyperlanes(system1ID, system2ID) VALUES (?,?)", [req.body.system1ID, req.body.system2ID], (error, results, fields) => {
			if (error) {
				res.status(500).send(error);
			} else {
				res.status(200).send("Hyperlane successfully added");
			}
		});
	} else {
		res.status(400).send({
			error: "Request body needs a system1ID and system2ID."
		});
	}
});

app.post("/hyperlanes/delete", (req, res, next) => {
	if (req.hasOwnProperty("body") && req.body.hasOwnProperty("system1ID") && req.body.hasOwnProperty("system2ID"))
	{
		var system1Id = req.body.system1ID;
		var system2Id = req.body.system2ID;
		mysql.pool.query("DELETE FROM hyperlanes WHERE system1ID=" + system1Id + " AND system2ID=" + system2Id, (error, results, fields) => {
			if (error) {
				res.status(500).send(error);
			} else {
				res.status(200).send("Hyperlane successfully deleted");
			}
		});
	} else {
		res.status(400).send({
			error: "Request body needs a system1ID and a system2ID."
		});
	}
});

//
// RESOURCES ===================================================================
// 

app.get("/resources", (req, res, next) => {
	var pageName = "resourcesPage";
	var context = createDefaultContext(pageName);
	context.page_title = "Resources";
	mysql.pool.query("SELECT * FROM resources ORDER BY name", (err, rows, fields) => {
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
	context.page_title = "Create Resource";
	context.type = "create";
	context.resource = {
		"name": "",
		"base_market_value": 1,
		"color": "#000000"
	};

	res.status(200).render(pageName, context);
});

function viewEditResourceData(type, req, res, next) {
	var resourceId = parseInt(req.params.id);
	var idIsInt = (resourceId != NaN) && (String(resourceId) == req.params.id);
	if (idIsInt && resourceId >= 0) {
		var pageName = "individualResourcePage";
		var context = createDefaultContext(pageName);
		context.page_title = type.charAt(0).toUpperCase() + type.slice(1) + " Resource";
		context.type = type;

		mysql.pool.query("SELECT * FROM resources WHERE resourceID = ?", resourceId, (err, rows, fields) => {
			if(err) {
				res.status(500).send(err);
			} else if (rows == null) {
				res.status(500).send("No rows returned");
			} else if (rows.length > 1) {
				res.status(500).send("Too many rows returned");
			} else {
				context.resource = rows[0];
				res.status(200).render(pageName, context);
			}
		});
	} else {
		next();
	}
}

app.get("/resources/view/:id", (req, res, next) => {
	viewEditResourceData("view", req, res, next);
});

app.get("/resources/edit/:id", (req, res, next) => {
	viewEditResourceData("edit", req, res, next);
});

app.post('/resources/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("baseMarketValue") &&
		req.body.hasOwnProperty("color")
	) {
		mysql.pool.query("INSERT INTO resources(name, baseMarketValue, color) VALUES (?,?,?)", [req.body.name, req.body.baseMarketValue, req.body.color], (error, result, fields) => {
			if (error) {
				res.status(500).send(error);
			} else {
				res.status(200).send("Resource successfully added");
			}
		});
	} else {
		res.status(400).send({
			error: "Request body needs a name, baseMarketValue, and color."
		});
	}
});

app.post("/resources/update/:id", (req, res, next) => {
	var resourceId = parseInt(req.params.id);
	var idIsInt = (resourceId != NaN) && (String(resourceId) == req.params.id);
	if (idIsInt && resourceId >= 0) {
		if (req.hasOwnProperty("body") &&
			req.body.hasOwnProperty("name") &&
			req.body.hasOwnProperty("baseMarketValue") &&
			req.body.hasOwnProperty("color")
		) {
			mysql.pool.query("UPDATE resources SET name=?, baseMarketValue=?, color=? WHERE resourceID=?", [req.body.name, req.body.baseMarketValue, req.body.color, resourceId], (error, result, fields) => {
				if (error) {
					res.status(500).send(error);
				} else {
					res.status(200).send("Resource successfully updated");
				}
			});
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
			mysql.pool.query("DELETE FROM resources WHERE resourceID=?", [resourceId], (error, result, fields) => {
				if (error) {
					res.status(500).send(error);
				} else {
					res.status(200).send("Resource successfully deleted");
				}
			});
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

function addResourceSearchList(context, res, contFunc) {
	mysql.pool.query("SELECT resourceID, name, color FROM resources ORDER BY name", (err, rows, fields) => {
		if (err) {
			res.status(500).send(err);
		} else if (rows == null) {
			res.status(500).send("No rows returned");
		} else {
			context.encoded_resource_search_list = encodeURIComponent(JSON.stringify(rows));
			contFunc(context, res);
		}
	});
}

//
// BODIES ======================================================================
// 

app.get("/bodies", (req, res, next) => {
	var pageName = "bodiesPage";
	var context = createDefaultContext(pageName);
	context.page_title = "Bodies";
	mysql.pool.query("SELECT * FROM bodies ORDER BY name", (err, rows, fields) => {
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
	context.page_title = "Create Body";
	context.type = "create";
	context.body = {
		"name": "",
		"type": "Planet",
		"orbital_radius": 0.5,
		"theta": 0
	};

	var addSearchListsCallback = (context, res) => {
		addSystemSearchList(context, res, (context, res) => {
			addResourceSearchList(context, res, (context, res) => {
				res.status(200).render(pageName, context);
			});
		});
	};

	if (req.query.systemID) {
		context.body.systemID = req.query.systemID;
		mysql.pool.query("SELECT name FROM systems WHERE systemID=?", context.body.systemID, (error, rows, fields) => {
			if (error) {
				res.status(500).send(error);
			} else if (rows == null) {
				res.status(500).send("No rows returned");
			} else if (rows.length > 1) {
				res.status(500).send("Too many rows returned");
			} else {
				context.parent_system_name = rows[0].name;

				addSearchListsCallback(context, res);
			}
		});
	} else {
		addSearchListsCallback(context, res);
	}
});

function viewEditBodyData(type, req, res, next) {
	var bodyId = parseInt(req.params.id);
	var idIsInt = (bodyId != NaN) && (String(bodyId) == req.params.id);
	if (idIsInt && bodyId >= 0) {
		var pageName = "individualBodyPage";
		var context = createDefaultContext(pageName);
		context.page_title = type.charAt(0).toUpperCase() + type.slice(1) + " Body";
		context.type = type;

		mysql.pool.query("SELECT * FROM bodies WHERE bodies.bodyID = ?", bodyId, (err, rows, fields) => {
			if(err) {
				res.status(500).send(err);
			} else if (rows == null) {
				res.status(500).send("No rows returned");
			} else if (rows.length > 1) {
				res.status(500).send("Too many rows returned");
			} else {
				context.body = rows[0];

				mysql.pool.query("SELECT name FROM systems WHERE systemID = ?", context.body.systemID, (err, rows, fields) => {
					if (err) {
						res.status(500).send(err);
					} else if (rows == null) {
						res.status(500).send("No rows returned");
					} else if (rows > 1) {
						res.status(500).send("Too many rows returned");
					} else {
						context.parent_system_name = rows[0].name;
						mysql.pool.query("SELECT resources.resourceID, resources.name, resources.color, rd.quantity FROM (SELECT * FROM resource_deposits WHERE resource_deposits.bodyID = ?) AS rd INNER JOIN resources ON rd.resourceID = resources.resourceID ORDER BY resources.name", [bodyId], (error, rows, fields) => {
							if (error) {
								res.status(500).send(error);
							} else {
								context.body_resource_deposits = rows;
								addSystemSearchList(context, res, (context, res) => {
									addResourceSearchList(context, res, (context, res) => {
										res.status(200).render(pageName, context);
									});
								});
							}
						});
					}
				});
			}
		});
	} else {
		next();
	}
}

app.get("/bodies/view/:id", (req, res, next) => {
	viewEditBodyData("view", req, res, next);
});

app.get("/bodies/edit/:id", (req, res, next) => {
	viewEditBodyData("edit", req, res, next);
});

app.post('/bodies/add', (req, res, next) => {
	if (req.hasOwnProperty("body") &&
		req.body.hasOwnProperty("name") &&
		req.body.hasOwnProperty("type") &&
		req.body.hasOwnProperty("orbitalRadius") &&
		req.body.hasOwnProperty("theta") &&
		req.body.hasOwnProperty("parentSystemID") &&
		req.body.hasOwnProperty("resourceDeposits")
	) {
		mysql.pool.query("INSERT INTO bodies(name, type, orbitalRadius, theta, systemID) VALUES (?,?,?,?,?)", [req.body.name, req.body.type, req.body.orbitalRadius, req.body.theta, req.body.parentSystemID], (error, result, fields) => {
			if (error) {
				res.status(500).send(error);
			} else {
				var resourceDeposits = req.body.resourceDeposits;
				var depositCallback = (depositIndex) => {
					if (depositIndex == resourceDeposits.length) {
						res.status(200).send("Body successfully added");
					} else {
						var resourceDeposit = resourceDeposits[depositIndex];
						mysql.pool.query("INSERT INTO resource_deposits(resourceID, bodyID, quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=?", [resourceDeposit.resourceID, result.insertId, resourceDeposit.quantity, resourceDeposit.quantity], (error, result, fields) => {
							if (error) {
								res.status(500).send(error);
							} else {
								depositCallback(depositIndex + 1);
							}
						});
					}
				};
				depositCallback(0);
			}
		});
	} else {
		res.status(400).send({
			error: "Request body needs a name, type, orbitalRadius, theta, parentSystemID, and resourceDeposits."
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
			req.body.hasOwnProperty("orbitalRadius") &&
			req.body.hasOwnProperty("theta") &&
			req.body.hasOwnProperty("parentSystemID") &&
			req.body.hasOwnProperty("resourceDeposits")
		) {
			mysql.pool.query("UPDATE bodies SET name=?, type=?, orbitalRadius=?, theta=?, systemID=? WHERE bodyID=?", [req.body.name, req.body.type, req.body.orbitalRadius, req.body.theta, req.body.parentSystemID, bodyId], (error, result, fields) => {
				if (error) {
					res.status(500).send(error);
				} else {
					var resourceDeposits = req.body.resourceDeposits;
					var depositCallback = (depositIndex) => {
						if (depositIndex == resourceDeposits.length) {
							res.status(200).send("Body successfully added");
						} else {
							var resourceDeposit = resourceDeposits[depositIndex];
							mysql.pool.query("INSERT INTO resource_deposits(resourceID, bodyID, quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=?", [resourceDeposit.resourceID, bodyId, resourceDeposit.quantity, resourceDeposit.quantity], (error, result, fields) => {
								if (error) {
									res.status(500).send(error);
								} else {
									depositCallback(depositIndex + 1);
								}
							});
						}
					};
					depositCallback(0);
				}
			});
		} else {
			res.status(400).send({
				error: "Request body needs a name, type, orbitalRadius, theta, and parentSystemID."
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
			mysql.pool.query("DELETE FROM bodies WHERE bodyID=?", [bodyId], (error, results, fields) => {
				if (error) {
					switch(error.code) {
						case "ER_ROW_IS_REFERENCED_2":
							res.status(500).send("You cannot delete a body that has resource deposits. Delete its resource deposits and try again.");
							break;
						default:
							res.status(500).send(error);
							break;
					}
				} else {
					res.status(200).send("Body successfully deleted");
				}
			});
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

app.post("/resource-stocks/delete", (req, res, next) => {
	if (req.hasOwnProperty("body") && req.body.hasOwnProperty("resourceID") && req.body.hasOwnProperty("empireID"))
	{
		var resourceId = req.body.resourceID;
		var empireId = req.body.empireID;
		if (resourceId >= 0 && empireId >= 0) {
			mysql.pool.query("DELETE FROM resource_stocks WHERE resourceID=? AND empireID=?", [resourceId, empireId], (error, results, fields) => {
				if (error) {
					res.status(500).send(error);
				} else {
					res.status(200).send("Resource stock successfully deleted");
				}
			});
		} else {
			res.status(400).send({
				error: "Bad resource or empire id."
			});
		}
	} else {
		res.status(400).send({
			error: "Request body needs a resource id and an empire id."
		});
	}
});

//
// RESOURCE DEPOSITS ===========================================================
//

app.post("/resource-deposits/delete", (req, res, next) => {
	if (req.hasOwnProperty("body") && req.body.hasOwnProperty("resourceID") && req.body.hasOwnProperty("bodyID"))
	{
		var resourceId = req.body.resourceID;
		var bodyId = req.body.bodyID;
		if (resourceId >= 0 && bodyId >= 0) {
			mysql.pool.query("DELETE FROM resource_deposits WHERE resourceID=? AND bodyID=?", [resourceId, bodyId], (error, results, fields) => {
				if (error) {
					res.status(500).send(error);
				} else {
					res.status(200).send("Resource deposit successfully deleted");
				}
			});
		} else {
			res.status(400).send({
				error: "Bad resource or body id."
			});
		}
	} else {
		res.status(400).send({
			error: "Request body needs a resource id and a body id."
		});
	}
});

//
// OTHER =======================================================================
//

app.get('*', (req, res) => {
	res.status(404).render("404");
});

app.listen(port, () => {
	console.log("Server listening on port " + port);
});
