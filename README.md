# Stellaris Sandbox
OSU CS 340 Introduction to Databases Portfolio Project

## Description

In the videogame Stellaris, players control galactic empires competing for control of a galaxy and its resources. Stellaris Sandbox is a database-driven website that will allow users to design a galaxy so that a game of Stellaris can be played in it. This will provide users with the freedom to create new starting circumstances for players, lending itself especially to role-playing oriented players. Stellaris has an average of 14,000 concurrent players on PC alone and a number of active online communities, together making up a large audience with a potential interest in the tool. A custom mod would be needed in order to import the galaxies designed in Stellaris Sandbox into the game itself. 

Using Stellaris Sandbox, users can create between 200 and 1000 Systems within the galaxy as well as the hyperlanes that connect them. Users can also create between 0 and 10 Bodies, such as planets, within Systems that can each contain 0 to 3 exploitable Resource deposits. AI-controlled Empires can also be created that span Systems and start off with given quantities of each Resource.

In Stellaris, there is only one galaxy, so Stellaris Sandbox will only allow design of a single galaxy at a time. Since users will be expected to create galaxies with a large number of Systems, Stellaris Sandbox will provide templates and other tools to automatically generate features which can then be edited by the user.

[Read more...](./doc/DesignDocument.pdf "Design Document")

## Deployment

1. Set up the server by cloning this repositroy, running `npm install` within it, and running `npm build` to build the Express Handlebars templates. 
2. Get a MariaDB database up and running. Make a copy of `dbcon.js.template` called `dbcon.js` and populate it with your database credentials.
3. Set up the database backend of this website by running `node util/recreate_database.js`.
4. Launch the website by running `node server.js` or `./node_modules/forever/bin/forever start server.js`.
