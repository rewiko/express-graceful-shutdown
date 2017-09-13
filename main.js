'use strict';

var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)

const promBundle = require("express-prom-bundle");
const GracefulShutdownManager = require('@moebius/http-graceful-shutdown').GracefulShutdownManager;
const shutdownManager = new GracefulShutdownManager(server);
const PORT = 1337;
const HOST = '0.0.0.0';
const metricsMiddleware = promBundle({includeMethod: true, includePath: true});

var state = { healthy: true };
var morgan = require('morgan')

app.use(metricsMiddleware);
app.use(morgan('combined', {
    skip: function (req, res) { return res.statusCode < 400 }
}))

var randomIntFromInterval = function(min,max){
    min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

app.get('/metrics', (req, res) => {
    res.end(Prometheus.register.metrics())
})

app.get('/private/ready', (req, res) => {

  if (!state.healthy) {
	res.writeHead(500);
	return res.end('unready');
  }
  return res.send('ready\n');
});

app.get('/private/echo', (req, res) => {
  setTimeout(function(){
	res.send('Ok\n');
  }, randomIntFromInterval(req.query.minDelay, req.query.maxDelay));
});

server.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

process.on('SIGTERM', () => {
  state.healthy = false;
  var readinessProbeTime = 10000; //(failureThreshold: 2 * periodSeconds: 2 = 4s)
  setTimeout(function(){
	shutdownManager.terminate(() => {
	  console.log('Server is gracefully terminated');
	});
  }, readinessProbeTime);
});

