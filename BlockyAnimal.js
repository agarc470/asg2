// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    void main() { 
      gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`
// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}
function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const rainbowColors = [
  [1.0, 0.0, 0.0, 1.0], // red
  [1.0, 0.5, 0.0, 1.0], // orange
  [1.0, 1.0, 0.0, 1.0], // yellow
  [0.0, 1.0, 0.0, 1.0], // green
  [0.0, 0.0, 1.0, 1.0], // blue
  [0.29, 0.0, 0.51, 1.0], // indigo
  [0.58, 0.0, 0.83, 1.0]  // violet
];
// globals related UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_rainbowMode = false;
let rainbowIndex = 0;
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false; 
function addActionsForHtmlUI() {
  // Button events (Shape type)
  document.getElementById('green').onclick = function () { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; g_rainbowMode = false; };
  document.getElementById('red').onclick = function () { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; g_rainbowMode = false; };
  document.getElementById('rainbow').onclick = function () {
    g_rainbowMode = !g_rainbowMode
    if (!g_rainbowMode) g_selectedColor = [1.0, 1.0, 1.0, 1.0]
  };
  document.getElementById('clearButton').onclick = function () { g_shapesList = []; renderAllShapes(); };

  document.getElementById('pointButton').onclick = function () { g_selectedType = POINT };
  document.getElementById('triButton').onclick = function () { g_selectedType = TRIANGLE };
  document.getElementById('circleButton').onclick = function () { g_selectedType = CIRCLE };
  document.getElementById('recreateButton').onclick = function () { recreateDrawing(); };
  // Slider events
  document.getElementById('redSlide').addEventListener('mouseup', function () {
    g_selectedColor[0] = this.value / 100;
    g_rainbowMode = false;
  });
  document.getElementById('greenSlide').addEventListener('mouseup', function () {
    g_selectedColor[1] = this.value / 100;
    g_rainbowMode = false;
  });
  document.getElementById('blueSlide').addEventListener('mouseup', function () {
    g_selectedColor[2] = this.value / 100;
    g_rainbowMode = false;
  });
  document.getElementById('animationYellowOffButton').onclick = function () {
    g_yellowAnimation = false;
  };
  document.getElementById('animationYellowOnButton').onclick = function () {
    g_yellowAnimation = true;
  };
  document.getElementById('yellowSlide').addEventListener('mousemove', function () {
    g_yellowAngle = this.value; 
    renderAllShapes();
  });
  document.getElementById('magentaSlide').addEventListener('mousemove', function () {
    g_magentaAngle = this.value; 
    renderAllShapes();
  });
  document.getElementById('angleSlide').addEventListener('input', function () {
    g_globalAngle = this.value;
    renderAllShapes();
  });
  
}

function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) { if (ev.buttons == 1) { click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  requestAnimationFrame(tick);
}
var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds=performance.now()/1000.0-g_startTime;
  console.log(g_seconds);

  renderAllShapes();

  requestAnimationFrame(tick);

}
var g_shapesList = [];

function click(ev) {

  if (g_rainbowMode) {
    updateRainbowColor();
  }
  let [x, y] = convertCoordinatesEventToGL(ev);

  // create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // Draw every shape that is supposed to be on canvas
  renderAllShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return ([x, y]);
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();

  // pass matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //draw body cube
  var body = new Cube();
  body.color = [1.0,0.0,0.0,1.0];
  body.matrix.translate(-.25, -.75, 0.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(0.5, .3, .5);
  body.render();
  
  //draw a left arm
  var yellow = new Cube();
  yellow.color = [1,1,0,1];
  yellow.matrix.setTranslate(0, -.5, 0.0);
  yellow.matrix.rotate(-5, 1, 0, 0);

  if (g_yellowAnimation) {
    yellow.matrix.rotate(45*Math.sin(g_seconds), 0, 0, 1);
  } else {
    yellow.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  }

  var yellowCoordinatesMat = new Matrix4(yellow.matrix);
  yellow.matrix.scale(0.25, .7, .5);
  yellow.matrix.translate(-.5,0,0);
  yellow.render();

  //test box
  var box = new Cube();
  box.color = [1,0,1,1];
  box.matrix = yellowCoordinatesMat;
  box.matrix.translate(0,.65,0);
  box.matrix.rotate(g_magentaAngle,0,0,1);
  box.matrix.scale(.3,.3,.3);
  box.matrix.translate(-.5,0,-0.001);
/*
  box.matrix.translate(-.1, .1, 0, 0);
  box.matrix.rotate(-30, 1, 0, 0);
  box.matrix.scale(.2, .4, .2);
  
*/
  box.render();
  // Check the time at the end of the function and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}
// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlE1m = document.getElementById(htmlID);
  if (!htmlE1m) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlE1m.innerHTML = text;
}
function updateRainbowColor() {
  g_selectedColor = rainbowColors[rainbowIndex];
  rainbowIndex = (rainbowIndex + 1) % rainbowColors.length;
}