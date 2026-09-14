const express = require("express");
const server = require("http").createServer();
const app = express();

// define route for express
app.get('/', function(req, res) {
	res.sendFile('index.html', {root: __dirname});
});


// connect express with the server
server.on("request", app);

// start the server on port 3001
server.listen(3001, function() {
	console.log("server started on port 3001");
})



/** Begin  websocket*/

// get a server which is type of websocket
const WebSocketServer = require('ws').Server;

// attach the web socketserver to the existing
const wss = new WebSocketServer({server: server});

// use a process listener, whenever a server closes then shutdown the db along with gracefully closing server
process.on('SIGINT', () => {

	// close the websocket also connection for each client
	wss.clients.forEach(function each(client) {
		client.close();
	});
	server.close(() => {
		// close the database connection
		shutdownDB();
	})
});

// The function is passed the connected web socket connection, not the whole library
wss.on('connection', function connection(ws) {
	// wss has a property clients
	const numClient = wss.clients.size;
	console.log('Clients connected ', numClient);

	// sends a message to every client connected
	wss.broadcast(`Current visitors : ${numClient}`);

	// verify if the web socket is actually open or not
	if (ws.readyState === ws.OPEN) {
		ws.send('Welcome to my server');
	}
	
	db.run(`INSERT INTO visitors (count, time)	
		VALUES (${numClient}, datetime('now'))
	`);

	ws.on('close', function close() {
		wss.broadcast(`Current visitors : ${wss.clients.size}`);
		console.log('A client has disconnected');
	});

});

// define the broadcast function since it does not exists on itself
wss.broadcast = function broadcast(data) {

	// for each client connected to the websocket server send the data
	wss.clients.forEach(function each(client) {
		// send data to each client
		client.send(data);
	});
}


/** end websockets */

/** begin database */
const sqlite = require('sqlite3');

// store the db in memory
const db = new sqlite.Database(':memory:');

// ensure the database is created before any command is setup
db.serialize(() => {
	db.run(`
		CREATE TABLE visitors (
			count INTEGER,
			time TEXT
		)
	`)
});

function getCounts() {
	db.each("SELECT * FROM visitors", (err, row) => {
		console.log(row);
	});
}

function shutdownDB() {
	getCounts();
	console.log('Shutting down db');
	db.close();
}