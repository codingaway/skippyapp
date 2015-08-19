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
var IRProximity = require('jsupm_gp2y0a');

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
  var IRProximity = require('jsupm_gp2y0a');

  var leftEnc = new mraa.Gpio(2);
  leftEnc.dir(mraa.DIR_IN);
  var rightEnc = new mraa.Gpio(3);
  rightEnc.dir(mraa.DIR_IN);
  var Vcc = new mraa.Gpio(7);
  Vcc.dir(mraa.DIR_OUT_HIGH);
  var Gnd = new mraa.Gpio(6);
  Gnd.dir(mraa.DIR_OUT_LOW);
  var countLeft = 0; //
  var countRight = 0;

  // IR Distance sensors
  this.d1 = new IRProximity.GP2Y0A(2);
  this.d2 = new IRProximity.GP2Y0A(3);
  this.d3 = new IRProximity.GP2Y0A(4);
  this.d4 = new IRProximity.GP2Y0A(5);
  var AREF = 5.0; // Analog reference voltage; depends on boards aref jumper settings
  var SAMPLES_PER_QUERY = 20; // Sample per query for Analog read




  // Instantiate Motorsheild
  var ms = new ms_lib.AdafruitMS1438(I2CBus, I2CAddr);
  ms.setPWMPeriod(50); // Set PWM period to 1KHz, Max 1.6KHz
  var currentSpeed = 0;
  this.distance = 0;
  var FW_SPEED = 1; // Speed range (0, 100)
  var BK_SPEED = 1;
  var T_SPEED = 1;
  var motors = {
    "m1": ms_lib.AdafruitMS1438.MOTOR_M1,
    "m2": ms_lib.AdafruitMS1438.MOTOR_M2,
    "m3": ms_lib.AdafruitMS1438.MOTOR_M3,
    "m4": ms_lib.AdafruitMS1438.MOTOR_M4
  };

  var DIR = {"STP": 0, "FWD": 1, "BKW": 2, "LFT": 3, "RGT": 4 };
  var CURRENT_DIR = DIR.STP;
  /* Function to set motor speed */
  var setSpeed = function(speed){
    for (m in motors){
      ms.setMotorSpeed(motors[m], speed);
      //console.log("Setting speed motor: " + motors[m]);
    }
    currentSpeed = speed;
    console.log("Setting speed: " + currentSpeed);
  };
  /* Function to stop skippy */
  var stop = function(callback){
      console.log("Stopping...");
      var countEnds = 0;
      var countStarts = countRight; // need to find stopping distance; save encoder currnet count
      if (CURRENT_DIR == DIR.STP){
        if (callback) {
          return callback();
        }
        else {
          return;
        }
      }
      //Self calling recursive function to kick off timers to reduce speed
      (function setZeroSpeed(){
        setTimeout(function(){
          if(currentSpeed > 0)
          {
            setSpeed(--currentSpeed);
            setZeroSpeed();
          }
          else if(callback)
          {
            countEnds = countRight; // save encoder count before stopping them
            stopRotationCount(); //S top encoder counter
            console.log("Stopping distance: " + (countEnds - countStarts));

            CURRENT_DIR = DIR.STP; //Set stop flag
            for (m in motors){
              console.log("Disabling motors: " + motors[m])
              ms.disableMotor(motors[m]);
            }
            return callback();
          }
          else
          {
            countEnds = countRight; // save encoder count before stopping them
            stopRotationCount(); //S top encoder counter
            console.log("Stopping distance ELSE: " + (countEnds - countStarts));

            CURRENT_DIR = DIR.STP; //Set stop flag
            for (m in motors){
              console.log("Disabling motors: " + motors[m])
              ms.disableMotor(motors[m]);
            }
            return;
          }
        }, 200); //200 ms delay
      })();
  };

  //this.stop(); // Disable motors when initialize MS to be safe

  /* Function to enable motors */
  var start = function(){
    for (m in motors){
      console.log("Enabling motors: " + motors[m]);
      ms.enableMotor(motors[m]);
    }
    //Start encoder counters
    startRotationCount();
  };

  /* Function to go backward */
  this.goBackward = function(){
      if(CURRENT_DIR == DIR.BKW)
        return;

      stop(function(){
        console.log("Entering Backward callback");
        for (m in motors){
          ms.setMotorDirection(motors[m], MotorDirCCW);
        }
        setSpeed(1);
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
       })(BK_SPEED); //Back Speed set to 20(max);
      });
  };

  this.goForward = function(){
      if(CURRENT_DIR == DIR.FWD)
        return;

      stop(function(){
        console.log("Entering Forward callback");
        for (m in motors){
          ms.setMotorDirection(motors[m], MotorDirCW);
        }
        setSpeed(1);
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
       })(FW_SPEED);
      });
  };

  this.turnLeft = function(){
      if(CURRENT_DIR == DIR.LFT){
        return;
      }

        stop(function(){
        setSpeed(T_SPEED);
        ms.setMotorDirection(motors.m1, MotorDirCCW);
        ms.setMotorDirection(motors.m2, MotorDirCCW);
        ms.setMotorDirection(motors.m3, MotorDirCW);
        ms.setMotorDirection(motors.m4, MotorDirCW);
        CURRENT_DIR = DIR.LFT;
        start();
        console.log("Skippy turning Left");
      });
  };

  this.turnRight = function(){
      if(CURRENT_DIR == DIR.RGT){
          return;
      }

      stop(function(){
        setSpeed(T_SPEED);
        ms.setMotorDirection(motors.m1, MotorDirCW);
        ms.setMotorDirection(motors.m2, MotorDirCW);
        ms.setMotorDirection(motors.m3, MotorDirCCW);
        ms.setMotorDirection(motors.m4, MotorDirCCW);
        CURRENT_DIR = DIR.RGT
        start();
        console.log("Skippy turning Right");
      });
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
        console.log("Right Enc" + countRight);
    });
  };

  // Stop wheel rotation count
  var stopRotationCount = function(){
    leftEnc.isrExit();
    rightEnc.isrExit();
    countLeft = 0;
    countRight = 0
  };
  this.getCurrentSpeed = function() {
    return currentSpeed;
  };

  this.getDistance = function(){
    return max(countRight, countLeft);
  };
  this.stop = stop;
  this.start = start;
};
