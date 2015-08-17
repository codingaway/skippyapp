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
//var events = require('events');

/*
DFRobot 4WD Wheel radius -- Distance calcualtion
http://www.dfrobot.com/index.php?route=product/product&path=66_46_101&product_id=352#.Vcp8Tbe06Rs
Diameter: 78mm
radius : 39mm
circumference: 245.044 mm
Encoder : 10 counts p/turn
1 count = 24.5044 mm
*/


module.exports = function (){
  // Wheel Encoders
  //var eventEmitter = new events.EventEmitter();
  var leftEnc = new mraa.Gpio(0);
  leftEnc.dir(mraa.DIR_IN);
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
  var currentSpeed = 0;
  var distance = 0;
  var F_SPEED = 15; // Speed range (0, 100) Forward Speed
  var B_SPEED = 10; // Speed range (0, 100) Backward Speed
  var T_SPEED = 5; // Speed range (0, 100) Turning Speed
  var motors = {
    "m1": ms_lib.AdafruitMS1438.MOTOR_M1,
    "m2": ms_lib.AdafruitMS1438.MOTOR_M2,
    "m3": ms_lib.AdafruitMS1438.MOTOR_M3,
    "m4": ms_lib.AdafruitMS1438.MOTOR_M4
  };
  var DIR = {"STP": 0, "FWD": 1, "BKW": 2, "LFT": 3, "RGT": 4 };
  var CURRENT_DIR = DIR.STP;

  console.log("Initializing Skippy: Disabling motors");
  //disable motors
  ms.disableMotor(motors.m1);
  ms.disableMotor(motors.m2);
  ms.disableMotor(motors.m3);
  ms.disableMotor(motors.m4);
  console.log("Initializing Skippy: Motors Diabled.");
  /* Function to set motor speed */

  function setSpeed(speed){
    for (m in motors){
      ms.setMotorSpeed(motors[m], speed);
    }
    //currentSpeed = speed;
    console.log("Speed set to" + speed);
  };

  /* Function to stop skippy */
  function stopSkippy(callback){
    if (CURRENT_DIR == DIR.STP)
    {
        return;
    }
    setSpeed(0); // Ensure speed set to 0
    for (m in motors){
        console.log("Disabling motors: " + motors[m])
      ms.disableMotor(motors[m]);
    }
    CURRENT_DIR == DIR.STP;
    console.log("Skippy Stopped");
  }

  /* Function to enable motors */
  function startSkippy(){
    for (m in motors){
      console.log("Enabling motors: " + motors[m]);
      ms.enableMotor(motors[m]);
    }
    startRotationCount();
  }

  /* Function to go backward */
  this.goBackward = function(){
    if(CURRENT_DIR == DIR.BKW) // If already moving backward; just return
      return;

    if (CURRENT_DIR != DIR.STP) //Stop first if it's moving
        stopSkippy();

    //Set wheel rotation direction
    skippyStart();
    for (m in motors){
      ms.setMotorDirection(motors[m], MotorDirCCW);
    }
    CURRENT_DIR = DIR.BKW;
    setSpeed(B_SPEED);
    console.log("Skippy moving backward");
  };

  this.goForward = function(){
    if(CURRENT_DIR == DIR.FWD)
      return;
    if (CURRENT_DIR != DIR.STP)
      stopSkippy();
      //Set wheel rotation direction
     skippyStart();
     for (m in motors){
        ms.setMotorDirection(motors[m], MotorDirCCW);
      }
      CURRENT_DIR = DIR.FWD;
      setSpeed(B_SPEED);

      console.log("Skippy moving forward");
  };


  this.turnLeft = function(){
    if(CURRENT_DIR == DIR.LFT)
        return;
    if (CURRENT_DIR != DIR.STP)
      stopSkippy();
    skippyStart();
    ms.setMotorDirection(motors.m1, MotorDirCCW);
    ms.setMotorDirection(motors.m2, MotorDirCCW);
    ms.setMotorDirection(motors.m3, MotorDirCW);
    ms.setMotorDirection(motors.m4, MotorDirCW);
    CURRENT_DIR = DIR.LFT;
    setSpeed(T_SPEED);
    console.log("Skippy turning Left");
  };

  this.turnRight = function(){
    if(CURRENT_DIR == DIR.RGT)
      return;
    if (CURRENT_DIR != DIR.STP)
    stopSkippy();
    ms.setMotorDirection(motors.m1, MotorDirCW);
    ms.setMotorDirection(motors.m2, MotorDirCW);
    ms.setMotorDirection(motors.m3, MotorDirCCW);
    ms.setMotorDirection(motors.m4, MotorDirCCW);
    CURRENT_DIR = DIR.RGT
    skippyStart();
    setSpeed(T_SPEED);
    console.log("Skippy turning Right");
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

  // Stop wheel rotation count
  var stopRotationCount = function(){
    leftEnc.isrExit();
    rightEnc.isrExit();
    countLeft = 0;
    countRight = 0
  };
  this.getCurrentSpeed = function(){
    return currentSpeed;
  };
  this.stop = stopSkippy;
  this.start = startSkippy;
};
