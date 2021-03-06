// Xinmei Guo
//

// To play the game, click the screen when you see a blue or purple color
// Do not click if you see another color (you will lose a point!)

// Arduino - the blue light lights up when you get a HIT (catch a ghost), and turns off when you get a MISS
// Graphics - the ghost picture changes depending on if you have a positive score or not
// Graphics - the cursor is a net
// Positive score - the ghost has a blue ball in his bottle
// Zero score - the bottle is empty
// Ghost pictures and net made by me
// Audio - if you get a HIT, you will hear a high music note (ToneJS).
// If you MISS, you hear a lower note

let noiseSynth, noise
let colors = [
  'magenta',
  'aquamarine',
  'beige',
  'aqua',
  'coral',
  'blueviolet',
  'cornflowerblue',
  'brown',
  'blue',
  'burlywood',
  'darkgray',
  'darkgreen',
  'darkorchid',
  'dodgerblue',
  'deepskyblue',
  'lightskyblue',
  'lightpink',
  'lemonchiffon',
  'orange',
  'pink',
  'plum',
  'mediumpurple',
  'mediumvioletred',
  'rebeccapurple',
  'tan',
  'purple',
  'teal',
]
blues = [
  'aqua',
  'blueviolet',
  'cornflowerblue',
  'blue',
  'darkorchid',
  'dodgerblue',
  'deepskyblue',
  'lightskyblue',
  'mediumpurple',
  'rebeccapurple',
  'purple',
]
let currentColor
let numSeconds = 0,
  score = 0,
  timer = 60,
  attempts = 0,
  catches = 0,
  catchRate = 0
let isCorrect = false,
  isEnd = false,
  isStart = true,
  isWin = false,
  isCarryingGhost = false
const interval = 60 // interval for when color changes
let feedback // feedback if player got a HIT or MISS
let ghostHappy, ghostSad, ghostCursor, netCursor // different ghost pics depending on score

// Arduino
let x_position = 0,
  y_position = 0
let buttonCheck
let isArduino = false

// coordinates of jar
const jarX1 = 230,
  jarY1 = 230,
  jarX2 = 540,
  jarY2 = 495

// Declare a "SerialPort" object
var serial
var portName = 'COM3' // fill in your serial port name here
// this is the message that will be sent to the Arduino:
var outMessage = 'H'

function setup() {
  
  noise = new Tone.NoiseSynth().toDestination();
  
  currentColor = colors[2]
  createCanvas(windowWidth * 0.98, windowHeight * 0.98)
  background(currentColor)
  noiseSynth = new Tone.MembraneSynth().toDestination()

  // Arduino
  // make an instance of the SerialPort object
  serial = new p5.SerialPort()

  // Get a list the ports available
  // You should have a callback defined to see the results. See gotList, below:
  serial.list()

  // Assuming our Arduino is connected,  open the connection to it
  serial.open(portName)

  // When we connect to the underlying server
  serial.on('connected', serverConnected)

  // When you get a list of serial ports that are available
  serial.on('list', gotList)

  // When you some data from the serial port
  serial.on('data', gotData)

  // When or if we get an error
  serial.on('error', gotError)

  // When our serial port is opened and ready for read/write
  serial.on('open', gotOpen)
}

// We are connected and ready to go
function serverConnected() {
  print('Connected to Server')
}

// Got the list of ports
function gotList(thelist) {
  console.log('List of Serial Ports:')
  // theList is an array of their names
  for (var i = 0; i < thelist.length; i++) {
    // Display in the console
    console.log(i + ' ' + thelist[i])
  }
}

// Called when there is data available from the serial port
function gotData() {
  let currentString = serial.readLine() // read the incoming string
  trim(currentString) // remove any trailing whitespace
  if (!currentString) return // if the string is empty, do no more
  let arduino_input = currentString.split(',')

  x_position = parseInt(arduino_input[0])
  y_position = parseInt(arduino_input[1])
  let b = arduino_input[2]
  // convert raw data (-512 to 512) to our canvas resolution
  x_position = ((x_position + 512) / (512 + 512)) * width
  y_position = ((y_position + 512) / (512 + 512)) * height
  console.log(x_position)
  console.log(y_position)
  if (b == 1) {
    buttonCheck = false
  } else {
    buttonCheck = true
  }
  isArduino = true
}

// Connected to our serial device
function gotOpen() {
  print('Serial Port is Open')
}

// Ut oh, here is an error, let's log it
function gotError(theerror) {
  print(theerror)
}

function preload() {
  // preload multimedia
  ghostHappy = loadImage('ghost-happy.png')
  ghostSad = loadImage('ghost-sad.png')
  ghostCursor = loadImage('ghost-cursor.png')
  netCursor = loadImage('net.png')
}

function keyPressed() {
  console.log(keyCode)
  if (keyCode == 32) {
    startGame()
  }
}

function draw() {
  changeBackgroundColor()
  background(currentColor)

  textSize(25)
  textFont('Helvetica')
  fill('black')
  if (isCorrect && isCarryingGhost) {
    feedback = 'GOOD! Move it into the jar!'
  } else if (isCorrect) {
    feedback = 'GOOD!'
  } else if (!isCorrect & (attempts > 0)) {
    feedback = 'MISS!'
  } else {
    feedback = 'Try to catch a ghost!'
  }

  if (!isStart && !isEnd) {
    textSize(35)
    text('How to catch a ghost:', width / 3, 50)

    textSize(20)
    text('Help Mr. Ghost catch his friends!', width / 3, 90)

    textSize(25)
    text(
      'Click the screen when you see a blue or purple color (ghost)',
      width / 3,
      150,
    )
    text('Then drag the ghost into the jar', width / 3, 200)
    text('You lose 1 point if you click the wrong color', width / 3, 250)

    textSize(35)
    text(`SCORE: ${score}`, 30, 50)
    text(`COUNTDOWN: ${timer}`, 30, 90)

    if (isCorrect) fill('green')
    else if (!isCorrect && attempts > 0) fill('red')
    text(feedback, width / 3, 350)

    countdown()
    if (score > 0) {
      image(ghostHappy, 200, 100)
    } else {
      image(ghostSad, 200, 100)
    }

    changeCursor()
  } else if (isStart && !isEnd) {
    textSize(35)
    text(
      `Press Spacebar or Arduino button to start Ghost Catcher Game`,
      width / 4,
      100,
    )
    text(
      `You must use Arduino button and controller if your Arduino is connected!`,
      width / 4,
      200,
    )
  } else if (isEnd && !isWin) {
    textSize(40)
    text(`You lose! You didn't catch any ghosts!`, width / 3, 100)
    text(`Catch Rate:  ${catchRate}%`, width / 3, 200)

    image(ghostSad, 200, 100)
    textSize(45)
    text(`:(`, width / 2, 300)
  } else if (isEnd && isWin) {
    textSize(40)
    text(`You win! You caught some ghosts!`, width / 3, 100)

    text(`Your Score:  ${score}`, width / 3, 200)
    text(`Catch Rate:  ${catchRate}%`, width / 3, 300)
    textSize(45)
    text(`:)`, width / 2, 400)
    image(ghostHappy, 200, 100)
  }
  if (isArduino && buttonCheck) {
    mousePressed()
  }
}

// check what was pressed
function mousePressed() {
  if (isStart && !isEnd) {
    startGame()
  } else if (!isStart && !isEnd && !isCarryingGhost && !isOverJar()) {
    checkIfBlue()
  } else if (isCarryingGhost && isOverJar()) {
    score++
    catches++
    winSound()
    isCarryingGhost = false
  }
}

function changeBackgroundColor() {
  if (frameCount % 60) {
    numSeconds++
    if (numSeconds % interval == 0) {
      let n = Math.floor(Math.random() * colors.length)
      currentColor = colors[n]
    }
  }
}

function checkIfBlue() {
  // does not count if currently carrying ghost
  if (isCarryingGhost || isStart) return

  attempts++
  if (blues.includes(currentColor)) {
    // WIN
    isCorrect = true
    isCarryingGhost = true
    winSound()
    outMessage = 'W'
    serial.write(outMessage) // turn the light on UNO board
  } else {
    // MISS
    isCarryingGhost = false
    score += score > 0 ? -1 : 0 // Decrease score
    isCorrect = false
    missSound()
    outMessage = 'L'
    serial.write(outMessage) // turn the light off UNO board
  }
}

function countdown() {
  if (frameCount % 60 == 0 && timer > 0 && !isWin) {
    // if the frameCount is divisible by 60, then a second has passed. it will stop at 0
    timer--
  }

  if (timer == 0) endGame()
}

function changeCursor() {
  if (isCarryingGhost && !isArduino) {
    cursor('ghost-cursor.png')
  } else if (!isArduino) {
    cursor('net.png')
  } else if (isCarryingGhost && isArduino) {
    image(ghostCursor, x_position, y_position)
  } else if (isArduino) {
    image(netCursor, x_position, y_position)
  }
}

function endGame() {
  isEnd = true
  isWin = score > 0 ? true : false
  catchRate = Math.round((catches / attempts) * 100)
}

function startGame() {
  isStart = false
}

function winSound() {
  noiseSynth.triggerAttackRelease('A4', '16n')
}

function missSound() {
  noiseSynth.triggerAttackRelease('G1', '16n')
}

// Checks if cursor is over the jar
function isOverJar() {
  if (
    mouseX >= jarX1 &&
    mouseX <= jarX2 &&
    mouseY >= jarY1 &&
    mouseY <= jarY2
  ) {
    return true
  } else if (
    isArduino &&
    x_position >= jarX1 &&
    x_position <= jarX2 &&
    y_position >= jarY1 &&
    y_position <= jarY2
  ) {
    return true
  }
  return false
}
