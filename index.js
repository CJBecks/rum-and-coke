var express = require("express");
var app = express();
var http = require("http").Server(app);
var fs = require("fs");
var path = require("path");
var proc;
const https = require("https");


// const mcpadc = require('mcp-spi-adc');
//const Gpio = require('onoff').Gpio;

const options = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};

app.use("/", express.static(path.join(__dirname, "stream")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

var server = https.createServer(options, app).listen(6969, function () {
  console.log("listening on *:6969");
});

var io = require("socket.io")(server);
var sockets = {};

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
    console.log("Start pouring the drink", data);
  });

  socket.on("stop-pour-drink", function () {
    console.log("Stop pouring the drink");
  });
});
