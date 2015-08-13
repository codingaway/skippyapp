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




  // Instantiate Motorsheild
  var ms = new ms_lib.AdafruitMS1438(I2CBus, I2CAddr);
  ms.setPWMPeriod(1000); // Set PWM period to 1KHz, Max 1.6KHz
  this.currentSpeed = 0;
  var MAX_SPEED = 70; // Speed range (0, 100)
  var motors = {
    "m1": ms_lib.AdafruitMS1438.MOTOR_M1,
    "m2": ms_lib.AdafruitMS1438.MOTOR_M2,
    "m3": ms_lib.AdafruitMS1438.MOTOR_M3,
    "m4": ms_lib.AdafruitMS1438.MOTOR_M4
  };

  /* Function to set motor speed */
  var setSpeed = function(speed){
    for (m in motors){
      ms.setMotorSpeed(motors[m], speed);
    }
    this.currentSpeed = speed;
  };    
  /* Function to stop skippy */
  this.stop = function(){
    for(var i = this.currentSpeed; i > 0; i -= 10)
    {
      setTimeout(function()
      {
        setSpeed(i);
      }, 250);
    }


    if (this.currentSpeed > 0)
    {
      setSpeed(0); // Ensure speed set to 0
    }

    for (m in motors){
    	console.log("Disabling motors: " + motors[m])
      ms.disableMotor(motors[m]);
    }
  };
  
  this.stop();

  /* Function to enable motors */
  this.start = function(){
    for (m in motors){
      console.log("Enabling motors: " + motors[m]);
      ms.enableMotor(motors[m]);
    }
  };

  /* Function to go backward */
  this.goBackward = function(){
    this.stop();
    for (m in motors){
      ms.setMotorDirection(motors[m], MotorDirCCW);
    }

    this.start();
    console.log("Skippy going back");
    for(var i = this.currentSpeed; i < MAX_SPEED; i += 2)
    {
      setTimeout(function()
      {
        setSpeed(i);
      }, 500);
    }
  };

  this.goForward = function(){
    this.stop();
    for (m in motors){
      ms.setMotorDirection(motors[m], MotorDirCW);
    }

    this.start();
    console.log("Skippy going forward");
    // Increase speed incrementally
  	for(var i = this.currentSpeed; i < MAX_SPEED; i += 2)
    {
      setTimeout(function()
      {
        setSpeed(i);
      }, 500);
    }
  };

  this.turnLeft = function(){
    this.stop();
    setSpeed(20);
    this.start();
    ms.setMotorDirection(motors.m1, MotorDirCCW);
    ms.setMotorDirection(motors.m2, MotorDirCCW);
    ms.setMotorDirection(motors.m3, MotorDirCW);
    ms.setMotorDirection(motors.m4, MotorDirCW);
    console.log("Skippy turning Left");
  };

  this.turnRight = function(){
    this.stop();
    setSpeed(20);
    this.start();
    ms.setMotorDirection(motors.m1, MotorDirCW);
    ms.setMotorDirection(motors.m2, MotorDirCW);
    ms.setMotorDirection(motors.m3, MotorDirCCW);
    ms.setMotorDirection(motors.m4, MotorDirCCW);
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
