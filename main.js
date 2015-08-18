// Module
var express = require('express');
var app = express();
var http = require('http').Server(app)
var io = require('socket.io')(http);
var skippy_cls = require('./skippy2');
console.log("Initilizing Skippy.");
var skippy = new skippy_cls();
//var skippy = require('./skippy');
console.log("Skippy Object Type: " + typeof(skippy));

// Define port
var port = 3000;

// View engine
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// Set public folder
app.use(express.static(__dirname + '/public'));

// Serve interface
app.get('/', function(req, res){
  res.render('interface');
});

// Listen socket events
io.on('connection', function(socket){
    console.log("A user is connected");
    socket.on('forward', function(){
        console.log("CMD: Forward");
        skippy.goForward();
    });
    socket.on('left', function(){
        console.log("CMD: Left");
        skippy.turnLeft();
    });
    socket.on('right', function(){
        console.log("CMD: Right");
        skippy.turnRight();

    });
    socket.on('backward', function(){
        console.log("CMD: Backward");
        skippy.goBackward();
    });
    socket.on('stop', function(){
        console.log("CMD: Stop");
        skippy.stop();
    });

//    setInterval(function(){
//      var val = skippy.getCurrentSpeed();
//      console.log("Current speed returned to server: " + val);
//      io.emit("speed", val);
//    }, 250);
});

// Start server
http.listen(port, function(){
   console.log("Listening on port " + port);
});

//Function to run a list of skippy moves given as name:value
var runCmdList(args){
    if(args && args.length > 0){
      for(var i = 0; i < args.length; i++){
        cmdObj = args[i];
        for(cmd in cmdObj){
          skippy[cmd](cmdObj[cmd]); //Call Skippy command
        }
      }
    }
}
