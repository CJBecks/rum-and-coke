var express = require("express");
var app = express();
const bodyParser = require('body-parser');
var http = require("http").Server(app);
var fs = require("fs");
var path = require("path");
var proc;
const https = require("https");


const cokePumpRelay = null;
const rumPumpRelay = null ;

const mcpadc = require('mcp-spi-adc');
const Gpio = require('onoff').Gpio;
const cokePumpRelay = new Gpio(17, 'high'); // IMPORTANT: Use 'high' if relay uses low level trigger
const rumPumpRelay = new Gpio(18, 'high'); // IMPORTANT: Use 'high' if relay uses low level trigger

const options = {
    key: fs.readFileSync("./https/key.pem"),
    cert: fs.readFileSync("./https/cert.pem"),
};

app.use("/", express.static(path.join(__dirname, "stream")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Initiate the Body Parser
app.use(bodyParser.json()); // to support JSON-encoded bodies

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

var server = https.createServer(options, app).listen(6969, function () {
    console.log("listening on *:6969");
});

var io = require("socket.io")(server);
var sockets = {};
var socketFinishedEvent;

io.on("connection", function (socket) {
    sockets[socket.id] = socket;
    console.log("Client Connected");
    console.log("Total clients connected : ", Object.keys(sockets).length);

    socket.on("disconnect", function () {
        delete sockets[socket.id];
        console.log("Client Disconnected");
        console.log("Total clients connected : ", Object.keys(sockets).length);

        // no more sockets, kill the stream
        if (Object.keys(sockets).length == 0) {
            if (proc) proc.kill();
        }
    });

    socket.on("start-pour-drink", function (data) {
        startPouringDrink(data.drinkStrength);
    });

    socket.on("stop-pour-drink", function () {
        stopPouringDrink();
    });

    socketFinishedEvent = function () {
        console.log('Call to socketFinishedEvent');
        socket.emit("finished-drink", {});
    };
});

app.post('/pour', function (req, res) {
    console.log('Start Pour', req.body.drinkStrength);
    startPouringDrink(req.body.drinkStrength);
    res.json(req.body);
});


function startPouringDrink(drinkStrength) {
    console.log('Call to startPouringDrink', drinkStrength);

    const pourTime = 6000; // 6 seconds  = 175ml
    const pumpTimings = determineTimeForEachPump(drinkStrength, pourTime);

    if (pumpTimings.cokeTime > 0) {
        console.log('Starting Coke Pump');
        startPump(cokePumpRelay);
        setTimeout(() => {
            console.log('Stopping Coke Pump');
            stopPump(cokePumpRelay);
        }, pumpTimings.cokeTime);
    }

    if (pumpTimings.rumTime > 0) {
        console.log('Starting Rum Pump');
        startPump(rumPumpRelay);
        setTimeout(() => {
            console.log('Stopping Coke Pump');
            stopPump(rumPumpRelay);
        }, pumpTimings.rumTime);
    }

    setTimeout(() => {
        socketFinishedEvent();
    }, Math.max(pumpTimings.cokeTime, pumpTimings.rumTime));
};

function stopPouringDrink() {
    console.log('Call to stopPouringDrink');
    stopPump(cokePumpRelay);
};


// Pump Controls
function startPump(pumpRelay) {
    return new Promise((resolve, reject) => {
        pumpRelay.read(async (error, status) => {
            if (error) {
                return reject(new Error(`There was an error getting the pump relay status: ${error}`));
            }

            if (status !== 0) {
                console.log('Pump is on');
                pumpRelay.writeSync(0); // closes the circuit and starts the pump
            }

            return resolve({
                status: `Pump On`,
            });
        });
    });
}

function stopPump(pumpRelay) {
    return new Promise((resolve, reject) => {
        pumpRelay.read(async (error, status) => {
            if (error) {
                return reject(new Error(`There was an error getting the pump relay status: ${error}`));
            }

            if (status !== 1) {
                console.log('Pump is off');
                pumpRelay.writeSync(1); // closes the circuit and starts the pump
            }

            return resolve({
                status: `Pump Off`,
            });
        });
    });
}

// Strength Level
function determineTimeForEachPump(drinkStrength, timeLength) {
    var cokeTime = 0;
    var rumTime = 0;

    switch (drinkStrength) {
        case 1:
            // Only Coke
            cokeTime = (100 / 100) * timeLength;
            rumTime = (0 / 100) * timeLength;
            break;
        case 2:
            cokeTime = (90 / 100) * timeLength;
            rumTime = (10 / 100) * timeLength;
            break;
        case 3:
            cokeTime = (80 / 100) * timeLength;
            rumTime = (20 / 100) * timeLength;
            break;
        case 4:
            cokeTime = (75 / 100) * timeLength;
            rumTime = (25 / 100) * timeLength;
            break;
        case 5:
            cokeTime = (70 / 100) * timeLength;
            rumTime = (30 / 100) * timeLength;
            break;
        case 6:
            cokeTime = (66 / 100) * timeLength;
            rumTime = (35 / 100) * timeLength;
            break;
        case 7:
            // One shot of rum
            cokeTime = (0 / 100) * timeLength;
            rumTime = (25 / 100) * timeLength;
            break;
        default:
            // Case 4
            cokeTime = (75 / 100) * timeLength;
            rumTime = (25 / 100) * timeLength;
            break;
    }

    return { cokeTime: cokeTime, rumTime: rumTime};
}