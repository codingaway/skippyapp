var m = require('mraa'); //require mraa
var counter = 0;
console.log('MRAA Version: ' + m.getVersion()); //write the mraa version to the console

var myDigitalPin = new m.Gpio(1); //setup digital read on pin 6
myDigitalPin.dir(m.DIR_IN); //set the gpio direction to input

function countRotation() {
	counter++;
	console.log("Counter: " + counter);
}

myDigitalPin.isr(m.EDGE_RISING, countRotation);

setTimeout(function()
{
	console.log("Stopping ISR...");
	myDigitalPin.isrExit();
}, 10000);
console.log("End");