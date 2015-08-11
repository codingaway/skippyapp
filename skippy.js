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

/*
DFRobot 4WD Wheel radius -- Distance calcualtion
http://www.dfrobot.com/index.php?route=product/product&path=66_46_101&product_id=352#.Vcp8Tbe06Rs
Diameter: 65mm
radius : 32.5mm
circumference: 204.203522 mm
Encoder : 10 counts p/turn
1 count = 20.42mm
*/


module.exports = function (){
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
    for (m in motors){
      console.log("Enabling motors: " + motors[m]);
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
    console.log("Skippy going back");
  };

  this.goForward = function(speed){
    this.stop();
    this.setSpeed(speed);
    for (m in motors){
      ms.setMotorDirection(motors[m], MotorDirCW);
    }
    this.start();
    console.log("Skippy going forward");
  };

  this.turnLeft = function(){
    this.stop();
    this.setSpeed(20);
    ms.setMotorDirection(motors.m1, MotorDirCCW);
    ms.setMotorDirection(motors.m2, MotorDirCCW);
    ms.setMotorDirection(motors.m3, MotorDirCW);
    ms.setMotorDirection(motors.m4, MotorDirCW);
    this.start();
    console.log("Skippy turning Left");
  };

  this.turnRight = function(){
    this.stop();
    this.setSpeed(20);
    ms.setMotorDirection(motors.m1, MotorDirCW);
    ms.setMotorDirection(motors.m2, MotorDirCW);
    ms.setMotorDirection(motors.m3, MotorDirCCW);
    ms.setMotorDirection(motors.m4, MotorDirCCW);
    this.start();
    console.log("Skippy turning Right");
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
