// skippy object prototype
var ms_lib = require('jsupm_adafruitms1438');
/* Import header values */
var I2CBus = ms_lib.ADAFRUITMS1438_I2C_BUS;
var I2CAddr = ms_lib.ADAFRUITMS1438_DEFAULT_I2C_ADDR;
var MotorDirCW = ms_lib.AdafruitMS1438.DIR_CW;
var MotorDirCCW = ms_lib.AdafruitMS1438.DIR_CCW;
/* Encoders reader */
var mraa = require('mraa');
/* Distance sensors */
var IRProximity = require('jsupm_gp2y0a')


var Skippy = function (){
  // Wheel Encoders
  this.leftEnc = new mraa.Gpio(0);
  this.leftEnc.dir(mraa.DIR_IN);
  this.rightEnc = new mraa.Gpio(1);
  this.rightEnc.dir(mraa.DIR_IN);
  this.countLeft = 0; //
  this.countRight = 0;

  // IR Distance sensors
  this.d1 = new IRProximity.GP2Y0A(2);
  this.d2 = new IRProximity.GP2Y0A(3);
  this.d3 = new IRProximity.GP2Y0A(4);
  this.d4 = new IRProximity.GP2Y0A(5);
  var AREF = 5.0; // Analog reference voltage; depends on board aref jumper settings
  var SAMPLES_PER_QUERY = 20; // Sample per query for Analog read



  this.SPEED = 50; //default speed

  // Instantiate Motorsheild
  var ms = new ms_lib.AdafruitMS1438(I2CBus, I2CAddr);
  var motors = {
    "m1": ms_lib.AdafruitMS1438.MOTOR_M1,
    "m2": ms_lib.AdafruitMS1438.MOTOR_M2,
    "m3": ms_lib.AdafruitMS1438.MOTOR_M3,
    "m4": ms_lib.AdafruitMS1438.MOTOR_M4
  };



  /* Function to stop skippy */
  this.stop = function(){
    for (m in motors){
    	console.log("Disabling motors: " + motors[m])
      ms.disableMotor(motors[m]);
    }
  };
  /* Function to stop skippy */
  this.start = function(){
    console.log("Enaabling motors: " + motors[m])
    for (m in motors){
      ms.enableMotor(motors[m]);
    }
  };
  /* Function to go forward */
  this.setSpeed = function(speed){
    for (m in motors){
      ms.setMotorSpeed(motors[m], speed);
    }
  };
  /* Function to go backward */
  this.goBackward = function(speed){
    this.stop();
    this.setSpeed(speed);
    for (m in motors){
      ms.setMotorDirection(motors[m], MotorDirCCW);
    }
    this.start();
  };

  this.goForward = function(speed){
    this.stop();
    this.setSpeed(speed);
    for (m in motors){
      ms.setMotorDirection(motors[m], MotorDirCW);
    }
    this.start();
  };

  this.turnLeft = function(){
    stop();
    this.setSpeed(speed);
    ms.setMotorDirection(motors.m1, MotorDirCCW);
    ms.ms.setMotorDirection(motors.m2, MotorDirCCW);
    ms.setMotorDirection(motors.m3, MotorDirCW);
    ms.ms.setMotorDirection(motors.m4, MotorDirCW);
    this.start();
  };

  this.turnRight = function(){
    stop();
    this.setSpeed(speed);
    ms.setMotorDirection(motors.m1, MotorDirCW);
    ms.ms.setMotorDirection(motors.m2, MotorDirCW);
    ms.setMotorDirection(motors.m3, MotorDirCCW);
    ms.ms.setMotorDirection(motors.m4, MotorDirCCW);
    this.start();
  };

  /* ISR functions to increment count of voltage increse on wheen encoders */
  this.startRotationCount = function(){
    this.countLeft = 0;
    this.countRight = 0;
    this.leftEnc.isr(mraa.EDGE_RISING, function(){
      this.countLeft++;
    });

    this.rightEnc.isr(mraa.EDGE_RISING, function(){
      this.countRight++;
    });
  };
  // Stop wheel rotation count
  this.stopRotationCount = function(){
    this.leftEnc.isrExit();
    this.rightEnc.isrExit();
    this.countLeft = 0;
    this.countRight = 0
  };
};

console.log("Initilizing Skippy.");
var skippy = new Skippy();
console.log("Skippy: Going forward..");
skippy.goForward(50);

setTimeout(function()
{
	console.log("Skippy Stopping...");
	skippy.stop();
}, 3000);
