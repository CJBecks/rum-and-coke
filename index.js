const port = 6969
const ip = require("ip").address();
const subdomain = 'test-coke';

const express = require('express')
const app = express()
const path = require("path");
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

// Create Tunnel
require('./tunnel')(port, ip, subdomain);

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
})
app.use("/", express.static(path.join(__dirname, "stream")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
// Initiate the Body Parser
app.use(bodyParser.json()); // to support JSON-encoded bodies

http.listen(port, function () {
    console.log(`listening on ${ip}:${port}`);
});


var cokePumpRelay = null;
var rumPumpRelay = null;

const Gpio = require('onoff').Gpio;
cokePumpRelay = new Gpio(17, 'high'); // IMPORTANT: Use 'high' if relay uses low level trigger
rumPumpRelay = new Gpio(18, 'high'); // IMPORTANT: Use 'high' if relay uses low level trigger

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
    });

    socket.on("start-pour-drink", function (data) {
        startPouringDrink(data.drinkStrength);
    });

    socket.on("stop-pour-drink", function () {
        stopPouringDrink();
    });

    socketFinishedEvent = function () {
        console.log('Call to socketFinishedEvent');
        io.sockets.emit("finished-drink", {});
    };
});

app.post('/pour', function (req, res) {
    console.log('Start Pour', req.body.drinkStrength);
    io.sockets.emit("start-drink", req.body.drinkStrength);
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

    if (!pumpRelay) {
        return;
    }

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

    if (!pumpRelay) {
        return;
    }

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

    return { cokeTime: cokeTime, rumTime: rumTime };
}