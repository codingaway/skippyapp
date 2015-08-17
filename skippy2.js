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
  var MAX_SPEED = 30; // Speed range (0, 100)
  var motors = {
    "m1": ms_lib.AdafruitMS1438.MOTOR_M1,
    "m2": ms_lib.AdafruitMS1438.MOTOR_M2,
    "m3": ms_lib.AdafruitMS1438.MOTOR_M3,
    "m4": ms_lib.AdafruitMS1438.MOTOR_M4
  };
  var DIR = {"STP": 0, "FWD": 1, "BKW": 2, "LFT": 3, "RGT": 4 };
  var CURRENT_DIR = DIR.STP;
  //disable motors
  ms.disableMotor(motors.m1);
  ms.disableMotor(motors.m2);
  ms.disableMotor(motors.m3);
  ms.disableMotor(motors.m4);

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
    console.log("Invoking stop..");
    console.log("Current DIR at stop: " + CURRENT_DIR);
    if (CURRENT_DIR == DIR.STP)
    {
      console.log("Calling callback outside timer");
      if (callback) {
        console.log("Callback True");
        callback();
        return;
      }
      else {
        return;
      }
    }

     setTimeout(function () {    //  call a 3s setTimeout when the loop is called
        console.log("Timer setting speed:" + currentSpeed);
        currentSpeed--;
        if (currentSpeed > 0) {            //  if the counter < 10, call the loop function
           setSpeed(currentSpeed);
           stopSkippy();             // Recursive call to start another timer
        }
        else {
          CURRENT_DIR = DIR.STP
          for (m in motors){
          	console.log("Disabling motors: " + motors[m])
            ms.disableMotor(motors[m]);
          }
          console.log("Calling callback function");
          if (callback){
            console.log("Callback True");
            callback();
            return;
          }
          else {
            return;
          }
        }
     }, 200)
  }

  /* Function to enable motors */
  function start(){
    for (m in motors){
      console.log("Enabling motors: " + motors[m]);
      ms.enableMotor(motors[m]);
    }
    //startRotationCount();
  }

  /* Function to go backward */
  this.goBackward = function(){
    if(CURRENT_DIR == DIR.BKW)
      return;

    stopSkippy(function(){
      console.log("Entering Backward callback");
      for (m in motors){
        ms.setMotorDirection(motors[m], MotorDirCCW);
      }
      start();
      console.log("Skippy going back");
      CURRENT_DIR = DIR.BKW;
      //Self-invoking function to increment speed
      (function speedUp (i) {
         setTimeout(function () {
            setSpeed(++currentSpeed);
            if (currentSpeed < i)
              speedUp(i);      // Recursive call to the Self-invoking function speedUp
         }, 250)
      })(20); //Back Speed set to 20(max);
    });
  };

  this.goForward = function(){
    if(CURRENT_DIR == DIR.FWD)
      return;

    stopSkippy(function(){
      console.log("Entering Forward callback");
      for (m in motors){
        ms.setMotorDirection(motors[m], MotorDirCW);
      }
      start();
      console.log("Skippy going forward");
      CURRENT_DIR = DIR.FWD;

        //Self-invoking function to increment speed
      (function speedUp (i) {
         setTimeout(function () {
            setSpeed(++currentSpeed);
            if (currentSpeed < i)
              speedUp(i);      // Recursive call to the Self-invoking function speedUp
         }, 250)
      })(MAX_SPEED);
    });
  };


  this.turnLeft = function(){
    if(CURRENT_DIR == DIR.LFT)
        return;
    stopSkippy();
    setSpeed(5);
    ms.setMotorDirection(motors.m1, MotorDirCCW);
    ms.setMotorDirection(motors.m2, MotorDirCCW);
    ms.setMotorDirection(motors.m3, MotorDirCW);
    ms.setMotorDirection(motors.m4, MotorDirCW);
    CURRENT_DIR = DIR.LFT;
    start();
    console.log("Skippy turning Left");
  };

  this.turnRight = function(){
    if(CURRENT_DIR == DIR.RGT)
      return;
    stopSkippy();
    //Wait for fully stopped
    while(CURRENT_DIR != DIR.STP)
    {}
    setSpeed(5);
    ms.setMotorDirection(motors.m1, MotorDirCW);
    ms.setMotorDirection(motors.m2, MotorDirCW);
    ms.setMotorDirection(motors.m3, MotorDirCCW);
    ms.setMotorDirection(motors.m4, MotorDirCCW);
    CURRENT_DIR = DIR.RGT
    start();
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
    console.log("Current speed at Class" + currentSpeed);
    return currentSpeed;
  };
  this.stop = stopSkippy;
  this.start = start;
};
