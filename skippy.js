/*
DFRobot 4WD Wheel radius -- Distance calcualtion
http://www.dfrobot.com/index.php?route=product/product&path=66_46_101&product_id=352#.Vcp8Tbe06Rs
Diameter: 78mm
radius : 39mm
circumference: 245.044 mm
Encoder : 10 counts p/turn
1 count = 24.5044 mm
*/

/* Motorsheild */
var ms_lib = require('jsupm_adafruitms1438');
/* Encoders reader */
var mraa = require('mraa');
// IR Distance sensors
var IRProximity = require('jsupm_gp2y0a');

/*============================================================================*/
var Module = (function(){
  var skippy = {};

  /* Import header values */
  var I2CBus = ms_lib.ADAFRUITMS1438_I2C_BUS;
  var I2CAddr = ms_lib.ADAFRUITMS1438_DEFAULT_I2C_ADDR;
  var MotorDirCW = ms_lib.AdafruitMS1438.DIR_CW;
  var MotorDirCCW = ms_lib.AdafruitMS1438.DIR_CCW;

  // Wheel Encoders
  var leftEnc = new mraa.Gpio(0);
  leftEnc.dir(mraa.DIR_IN); // Set PIN as input
  var rightEnc = new mraa.Gpio(1);
  rightEnc.dir(mraa.DIR_IN);
  var countLeft = 0; //
  var countRight = 0;

  // IR Distance sensors
  var d1 = new IRProximity.GP2Y0A(2);
  var d2 = new IRProximity.GP2Y0A(3);
  var d3 = new IRProximity.GP2Y0A(4);
  var d4 = new IRProximity.GP2Y0A(5);
  var AREF = 5.0; // Analog reference voltage; depends on boards aref jumper settings
  var SAMPLES_PER_QUERY = 20; // Sample per query for Analog read

  // Instantiate Motorsheild
  var ms = new ms_lib.AdafruitMS1438(I2CBus, I2CAddr);
  ms.setPWMPeriod(1000); // Set PWM period to 1KHz, Max 1.6KHz

  var MAX_SPEED = 30; // Speed range (0, 100)
  var motors = {
    "m1": ms_lib.AdafruitMS1438.MOTOR_M1,
    "m2": ms_lib.AdafruitMS1438.MOTOR_M2,
    "m3": ms_lib.AdafruitMS1438.MOTOR_M3,
    "m4": ms_lib.AdafruitMS1438.MOTOR_M4
  };

  /* Public properties */
  skippy.currentSpeed = 0;
  skippy.distance = 0;

  /* Private functions */
  var setSpeed = function(speed){
    for (m in motors){
      ms.setMotorSpeed(motors[m], speed);
    }
    skippy.currentSpeed = speed;
    console.log("Setting speed: " + skippy.currentSpeed);
  };

  /* ISR functions to start counting wheel rotation from encoders voltage changes */
  var startRotationCount = function(){
    countLeft = 0;
    countRight = 0;

    leftEnc.isr(mraa.EDGE_RISING, function(){
      countLeft++;
    });

    rightEnc.isr(mraa.EDGE_RISING, function(){
      countRight++;
    });
  };
  var stopRotationCount = function(){
    leftEnc.isrExit();
    rightEnc.isrExit();
    countLeft = 0;
    countRight = 0
  };

  /* Public methods */
 /* Function to stop skippy */
 skippy.stop = function(){
   console.log("Stopping: CurrentSpeed = ", skippy.currentSpeed);
   for(var i = skippy.currentSpeed; i > 0; i -= 2)
   {
     console.log("Stop: i = " + i);
     setTimeout(function(x)
     {
       setSpeed(x);
     }, 250, i);
   }

   if (skippy.currentSpeed > 0 || skippy.currentSpeed == undefined)
   {
     skippy.setSpeed(0); // Ensure speed set to 0
     skippy.currentSpeed = 0;
   }

   for (m in motors)
   {
     console.log("Disabling motors: " + motors[m])
     ms.disableMotor(motors[m]);
   }
 };
 skippy.stop(); // Disable motors when initialize MS to be safe
 skippy.start = function(){
   for (m in motors)
   {
      console.log("Enabling motors: " + motors[m]);
      ms.enableMotor(motors[m]);
    }
    startRotationCount();
 };
 skippy.goForward = function(){
    skippy.stop();
    for (m in motors){
      ms.setMotorDirection(motors[m], MotorDirCW);
    }

    skippy.start();
    console.log("Skippy going forward");
    // Increase speed incrementally
    console.log("Before incresing speed: " + skippy.currentSpeed);
    for(var i = skippy.currentSpeed; i < MAX_SPEED; i += 2)
    {
      console.log("Forward Currnet Speed: " + skippy.currentSpeed);
      setTimeout(function(x)
      {
        skippy.setSpeed(x);
      }, 1000, i);
    }
  };
  skippy.goBackward = function(){
    skippy.stop();
    for (m in motors){
      ms.setMotorDirection(motors[m], MotorDirCCW);
    }

    skippy.start();
    console.log("Skippy going back");
    for(var i = skippy.currentSpeed; i < MAX_SPEED; i += 1)
    {
      setTimeout(function(x)
      {
        setSpeed(x);
      }, 500, i);
    }
  };
  skippy.turnLeft = function(){
    skippy.stop();
    setSpeed(10);
    ms.setMotorDirection(motors.m1, MotorDirCCW);
    ms.setMotorDirection(motors.m2, MotorDirCCW);
    ms.setMotorDirection(motors.m3, MotorDirCW);
    ms.setMotorDirection(motors.m4, MotorDirCW);
    skippy.start();
    console.log("Skippy turning Left");
  };
  skippy.turnRight = function(){
    skippy.stop();
    setSpeed(10);
    ms.setMotorDirection(motors.m1, MotorDirCW);
    ms.setMotorDirection(motors.m2, MotorDirCW);
    ms.setMotorDirection(motors.m3, MotorDirCCW);
    ms.setMotorDirection(motors.m4, MotorDirCCW);
    skippy.start();
    console.log("Skippy turning Right");
  };

  return skippy; // Returns skippy with public properties
})();
module.exports = Module;
