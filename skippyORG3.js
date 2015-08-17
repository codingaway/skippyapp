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
Diameter: 78mm
radius : 39mm
circumference: 245.044 mm
Encoder : 10 counts p/turn
1 count = 24.5044 mm
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
  var AREF = 5.0; // Analog reference voltage; depends on boards aref jumper settings
  var SAMPLES_PER_QUERY = 20; // Sample per query for Analog read




  // Instantiate Motorsheild
  var ms = new ms_lib.AdafruitMS1438(I2CBus, I2CAddr);
  ms.setPWMPeriod(1000); // Set PWM period to 1KHz, Max 1.6KHz
  this.currentSpeed = 0;
  this.distance = 0;
  var MAX_SPEED = 30; // Speed range (0, 100)
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
    }
    this.currentSpeed = speed;
    console.log("Setting speed: " + this.currentSpeed);
  };
  /* Function to stop skippy */
  this.stop = function(){
      if (CURRENT_DIR == DIR.STP)
      {
          return;
      }
      setSpeed(0); // Ensure speed set to 0
      for (m in motors){
          console.log("Disabling motors: " + motors[m])
        ms.disableMotor(motors[m]);
      }
      CURRENT_DIR = DIR.STP;
      console.log("Skippy Stopped");
  };
  /* Function to enable motors */
  this.start = function(){
      for (m in motors){
        console.log("Enabling motors: " + motors[m]);
        ms.enableMotor(motors[m]);
      }
      //startRotationCount();
  };

  //this.stop(); // Disable motors when initialize MS to be safe

  /* Function to enable motors */
  this.start = function(){
      for (m in motors){
        console.log("Enabling motors: " + motors[m]);
        ms.enableMotor(motors[m]);
      }
      //startRotationCount();
  };

  /* Function to go backward */
  this.goBackward = function(){
      if(CURRENT_DIR == DIR.BKW) // If already moving backward; just return
        return;

      if (CURRENT_DIR != DIR.STP) //Stop first if it's moving
          this.stop();

      //Set wheel rotation direction
      setSpeed(B_SPEED);
      for (m in motors){
        ms.setMotorDirection(motors[m], MotorDirCCW);
      }
      CURRENT_DIR = DIR.BKW;
      this.start();
      console.log("Skippy moving backward");
  };

  this.goForward = function(){
      if(CURRENT_DIR == DIR.FWD)
        return;
      if (CURRENT_DIR != DIR.STP)
        this.stop();
        //Set wheel rotation direction
       setSpeed(B_SPEED);
       for (m in motors){
          ms.setMotorDirection(motors[m], MotorDirCCW);
        }
        CURRENT_DIR = DIR.FWD;
        this.start();

        console.log("Skippy moving forward");
  };

  this.turnLeft = function(){
      if(CURRENT_DIR == DIR.LFT)
          return;
      if (CURRENT_DIR != DIR.STP)
        this.stop();
      setSpeed(T_SPEED);
      ms.setMotorDirection(motors.m1, MotorDirCCW);
      ms.setMotorDirection(motors.m2, MotorDirCCW);
      ms.setMotorDirection(motors.m3, MotorDirCW);
      ms.setMotorDirection(motors.m4, MotorDirCW);
      CURRENT_DIR = DIR.LFT;
      this.start();
      console.log("Skippy turning Left");
  };

  this.turnRight = function(){
      if(CURRENT_DIR == DIR.RGT)
        return;
      if (CURRENT_DIR != DIR.STP)
      this.stop();
      setSpeed(T_SPEED);
      ms.setMotorDirection(motors.m1, MotorDirCW);
      ms.setMotorDirection(motors.m2, MotorDirCW);
      ms.setMotorDirection(motors.m3, MotorDirCCW);
      ms.setMotorDirection(motors.m4, MotorDirCCW);
      CURRENT_DIR = DIR.RGT
      this.start();
      console.log("Skippy turning Right");
  };

  /* ISR functions to start counting wheel rotation from encoders voltage changes */
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
