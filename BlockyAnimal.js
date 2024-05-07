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
  g_globalRotateMatrix.setIdentity();
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
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_tail1Animation = false;
let g_tail2Animation = false;
let g_tail3Animation = false;
let g_tail4Animation = false;
let g_frontLeg1Animation = false;
let g_frontLeg2Animation = false;
let g_backLeg1Animation = false;
let g_backLeg12nimation = false;
let isDragging = false;
let lastMouseX = -1;
let lastMouseY = -1;
let g_tail1 = 0;
let g_tail2 = 0;
let g_tail3 = 0;
let g_tail4 = 0;
let g_frontLeg1 = 0;
let g_frontKnee1 = 0;
let g_frontLeg2 = 0;
let g_frontKnee2 = 0;
let g_backLeg1 = 0;
let g_backKnee1 = 0;
let g_backLeg2 = 0;
let g_backKnee2 = 0;
let pokeAnimationActive = false;
let pokeAnimationStartTime = 0;
let g_globalRotateMatrix = new Matrix4();
function startPokeAnimation() {
  if (!pokeAnimationActive) {
    pokeAnimationActive = true;
    pokeAnimationStartTime = g_seconds; // Capture the start time of the animation
    requestAnimationFrame(tick); // Ensure the animation loop is running
  }
}
function addActionsForHtmlUI() {
  // Button events (Shape type)
  document.getElementById('pointButton').onclick = function () { g_selectedType = POINT };
  document.getElementById('triButton').onclick = function () { g_selectedType = TRIANGLE };
  document.getElementById('circleButton').onclick = function () { g_selectedType = CIRCLE };
  document.getElementById('recreateButton').onclick = function () { recreateDrawing(); };
  // Slider events
  document.getElementById('animationYellowOffButton').onclick = function () {
    g_tail1Animation = false;
    g_tail2Animation = false;
    g_tail3Animation = false;
    g_tail4Animation = false;
    g_frontLeg1Animation = false;
    g_frontLeg2Animation = false;
    g_backLeg1Animation = false;
    g_backLeg12nimation = false;
  };
  document.getElementById('animationYellowOnButton').onclick = function () {
    g_tail1Animation = true;
    g_tail2Animation = true;
    g_tail3Animation = true;
    g_tail4Animation = true;
    g_frontLeg1Animation = true;
    g_frontLeg2Animation = true;
    g_backLeg1Animation = true;
    g_backLeg12nimation = true;
  };
  document.getElementById('tail1').addEventListener('mousemove', function () {
    g_tail1 = this.value;
    renderScene();
  });
  document.getElementById('tail2').addEventListener('mousemove', function () {
    g_tail2 = this.value;
    renderScene();
  });
  document.getElementById('tail3').addEventListener('mousemove', function () {
    g_tail3 = this.value;
    renderScene();
  });

  document.getElementById('tail4').addEventListener('mousemove', function () {
    g_tail4 = this.value;
    renderScene();
  });
  document.getElementById('frontLeg1').addEventListener('mousemove', function () {
    g_frontLeg1 = this.value;
    renderScene();
  });
  document.getElementById('frontKnee1').addEventListener('mousemove', function () {
    g_frontKnee1 = this.value;
    renderScene();
  });
  document.getElementById('frontLeg2').addEventListener('mousemove', function () {
    g_frontLeg2 = this.value;
    renderScene();
  });
  document.getElementById('frontKnee2').addEventListener('mousemove', function () {
    g_frontKnee2 = this.value;
    renderScene();
  });
  document.getElementById('backLeg1').addEventListener('mousemove', function () {
    g_backLeg1 = this.value;
    renderScene();
  });
  document.getElementById('backKnee1').addEventListener('mousemove', function () {
    g_backKnee1 = this.value;
    renderScene();
  });
  document.getElementById('backLeg2').addEventListener('mousemove', function () {
    g_backLeg2 = this.value;
    renderScene();
  });
  document.getElementById('backKnee2').addEventListener('mousemove', function () {
    g_backKnee2 = this.value;
    renderScene();
  });
  document.getElementById('angleSlideX').addEventListener('input', function () {
    g_globalAngleX = this.value;
    renderScene();
  });
  document.getElementById('angleSlideY').addEventListener('input', function () {
    g_globalAngleY = this.value;
    renderScene();
  });

}

function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  canvas.onmousedown = function (ev) {
    const [x, y] = convertCoordinatesEventToGL(ev);
    if (ev.shiftKey) {
      startPokeAnimation();
    } else {
      isDragging = true;
      lastMouseX = x;
      lastMouseY = y;
    }
  };

  canvas.onmouseup = function (ev) {
    if (isDragging) {
      isDragging = false;
    }
  };

  canvas.onmousemove = function (ev) {
    if (isDragging) {
      const [newX, newY] = convertCoordinatesEventToGL(ev);
      let deltaX = newX - lastMouseX;
      let deltaY = newY - lastMouseY;
      g_globalAngleX -= deltaX * 100; // Scaling factor for rotation
      g_globalAngleY += deltaY * 100;
      lastMouseX = newX;
      lastMouseY = newY;
    }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  requestAnimationFrame(tick);
}
var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  //console.log(g_seconds);
  if (pokeAnimationActive) {
    updatePokeAnimation();
  }
  renderScene();

  requestAnimationFrame(tick);

}

function updatePokeAnimation() {
  const duration = 1.0; // Length of the animation in seconds
  let timeElapsed = g_seconds - pokeAnimationStartTime;

  if (timeElapsed < duration) {
    let angle = 360 * (1 - Math.cos(Math.PI * timeElapsed / duration)); // Oscillating startle effect
    g_globalRotateMatrix.setRotate(angle, 1, 0, 1);  // Update the rotation matrix
  } else {
    pokeAnimationActive = false;
    g_globalRotateMatrix.setIdentity(); // Reset rotation back to identity
  }
}


function click(ev) {

  let [x, y] = convertCoordinatesEventToGL(ev);

  let newAngleX = (x + 1) / 2 * 360;
  g_globalAngleX = newAngleX;
  document.getElementById('angleSlideX').value = newAngleX;

  let newAngleY = (y + 1) / 2 * 360;
  g_globalAngleY = newAngleY;
  document.getElementById('angleSlideY').value = newAngleY;

  renderScene();
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
function renderScene() {
  // Check the time at the start of this function
  var startTime = performance.now();

  // pass matrix to u_ModelMatrix attribute
  var globalRotMatX = new Matrix4().rotate(g_globalAngleX, 0, 1, 0); // Rotating around y-axis
  var globalRotMatY = new Matrix4().rotate(g_globalAngleY, 1, 0, 0); // Rotating around x-axis
  var combinedRotationMatrix = globalRotMatX.multiply(globalRotMatY); // You can reverse the order depending on desired effect

  if (pokeAnimationActive) {
    // During poke animation, use the animation matrix
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_globalRotateMatrix.elements);
  } else {
    // When not animating, use the matrix from sliders
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, combinedRotationMatrix.elements);
  }

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //draw body cube
  var body = new Cube();
  body.color = [.4, .4, .4, 1.0];
  body.matrix.translate(-.2, 0, -.1);
  //body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(.4, .4, .75);
  body.render();

  //draw additional body cube
  var mane = new Cube();
  mane.color = [.3, .3, .3, 1.0];
  mane.matrix.translate(-.25, -.02, -.45);
  //body.matrix.rotate(-5, 1, 0, 0);
  mane.matrix.scale(0.5, .5, .35);
  mane.render();

  var face = new Cube();
  face.color = [.4, .4, .4, 1.0];
  face.matrix.translate(-.2, 0, -.6);
  //body.matrix.rotate(-5, 1, 0, 0);
  face.matrix.scale(.4, .4, .15);
  face.render();

  var tail1 = new Cylinder();
  tail1.color = [.3, .3, .3, 1.0];
  tail1.matrix.translate(0, .23, .6);
  if (g_tail1Animation) {
    tail1.matrix.rotate(25 * Math.sin(g_seconds), 0, 1, 0);
  } else {
    tail1.matrix.rotate(g_tail1, 0, 1, 0);
  }
  tail1.matrix.rotate(45, 1, 0, 0);
  var tail1Coordinates = new Matrix4(tail1.matrix);
  tail1.matrix.scale(2.5, 2.5, .15);
  tail1.render();

  var tail2 = new Cylinder();
  tail2.color = [.4, .4, .4, 1.0];
  tail2.matrix = tail1Coordinates;
  tail2.matrix.translate(0, 0, .15);
  if (g_tail2Animation) {
    tail2.matrix.rotate(25 * Math.sin(g_seconds), 0, 1, 0);
  } else {
    tail2.matrix.rotate(g_tail2, 0, 1, 0);
  }
  var tail2Coordinates = new Matrix4(tail2.matrix);
  tail2.matrix.scale(2.4, 2.4, .15);
  tail2.render();

  var tail3 = new Cylinder();
  tail3.color = [.3, .3, .3, 1.0];
  tail3.matrix = tail2Coordinates;
  tail3.matrix.translate(0, 0, .15);
  if (g_tail3Animation) {
    tail3.matrix.rotate(25 * Math.sin(g_seconds), 0, 1, 0);
  } else {
    tail3.matrix.rotate(g_tail3, 0, 1, 0);
  }
  var tail3Coordinates = new Matrix4(tail3.matrix);
  tail3.matrix.scale(2.4, 2.4, .15);
  tail3.render();

  var tail4 = new Cylinder();
  tail4.color = [.4, .4, .4, 1.0];
  tail4.matrix = tail3Coordinates;
  tail4.matrix.translate(0, 0, .15);
  if (g_tail4Animation) {
    tail4.matrix.rotate(25 * Math.sin(g_seconds), 0, 1, 0);
  } else {
    tail4.matrix.rotate(g_tail4, 0, 1, 0);
  }
  tail4.matrix.scale(2.4, 2.4, .15);
  tail4.render();

  var nose = new Cube();
  nose.color = [.3, .3, .3, 1.0];
  nose.matrix.translate(-.1, 0, -.75);
  //body.matrix.rotate(-5, 1, 0, 0);
  nose.matrix.scale(.2, .2, .15);
  nose.render();

  var ear1 = new Cube();
  ear1.color = [.2, .2, .2, 1.0];
  ear1.matrix.translate(-.2, .4, -.5);
  //body.matrix.rotate(-5, 1, 0, 0);
  ear1.matrix.scale(.125, .125, .05);
  ear1.render();

  var ear2 = new Cube();
  ear2.color = [.2, .2, .2, 1.0];
  ear2.matrix.translate(.075, .4, -.5);
  //body.matrix.rotate(-5, 1, 0, 0);
  ear2.matrix.scale(.125, .125, .05);
  ear2.render();

  //draw legs
  var frontLeg1 = new Cylinder();
  frontLeg1.color = [.4, .4, .4, 1.0];
  frontLeg1.matrix.translate(-.14, -.02, -.35);
  frontLeg1.matrix.rotate(90, 1, 0, 0);
  if (g_frontLeg1Animation) {
    frontLeg1.matrix.rotate(25 * Math.sin(g_seconds), 1, 0, 0);
  } else {
    frontLeg1.matrix.rotate(g_frontLeg1, 0, 1, 0);
  }
  var frontLeg1Coordinates = new Matrix4(frontLeg1.matrix);
  frontLeg1.matrix.scale(2.5, 2.5, .25);
  frontLeg1.render();

  var frontKnee1 = new Cylinder();
  frontKnee1.color = [.3, .3, .3, 1.0];
  frontKnee1.matrix = frontLeg1Coordinates;
  frontKnee1.matrix.translate(0, 0, .25);
  //frontKnee1.matrix.rotate(g_frontKnee1, 1, 0, 0);
  var frontKnee1Coordinates = new Matrix4(frontKnee1.matrix);
  frontKnee1.matrix.scale(2.4, 2.4, .25);
  frontKnee1.render();

  var backLeg1 = new Cylinder();
  backLeg1.color = [.4, .4, .4, 1.0];
  backLeg1.matrix.translate(-.14, 0, .59);
  backLeg1.matrix.rotate(90, 1, 0, 0);
  if (g_backLeg1Animation) {
    backLeg1.matrix.rotate(-25 * Math.sin(g_seconds), 1, 0, 0);
  } else {
    backLeg1.matrix.rotate(g_backLeg1, 0, 1, 0);
  }
  var backLeg1Coordinates = new Matrix4(backLeg1.matrix);
  backLeg1.matrix.scale(2.5, 2.5, .27);
  backLeg1.render();

  var backKnee1 = new Cylinder();
  backKnee1.color = [.3, .3, .3, 1.0];
  backKnee1.matrix = backLeg1Coordinates;
  backKnee1.matrix.translate(0, 0, .27);
  backKnee1.matrix.rotate(g_backKnee1, 1, 0, 0);
  var backKnee1Coordinates = new Matrix4(backKnee1.matrix);
  backKnee1.matrix.scale(2.4, 2.4, .25);
  backKnee1.render();

  var frontLeg2 = new Cylinder();
  frontLeg2.color = [.4, .4, .4, 1.0];
  frontLeg2.matrix.translate(.14, -.02, -.35);
  frontLeg2.matrix.rotate(90, 1, 0, 0);
  if (g_frontLeg2Animation) {
    frontLeg2.matrix.rotate(-25 * Math.sin(g_seconds), 1, 0, 0);
  } else {
    frontLeg2.matrix.rotate(g_frontLeg2, 0, 1, 0);
  }
  var frontLeg2Coordinates = new Matrix4(frontLeg2.matrix);
  frontLeg2.matrix.scale(2.5, 2.5, .25);
  frontLeg2.render();

  var frontKnee2 = new Cylinder();
  frontKnee2.color = [.3, .3, .3, 1.0];
  frontKnee2.matrix = frontLeg2Coordinates;
  frontKnee2.matrix.translate(0, 0, .25);
  frontKnee2.matrix.rotate(g_frontKnee2, 1, 0, 0);
  var frontKnee2Coordinates = new Matrix4(frontKnee2.matrix);
  frontKnee2.matrix.scale(2.4, 2.4, .25);
  frontKnee2.render();

  var backLeg2 = new Cylinder();
  backLeg2.color = [.4, .4, .4, 1.0];
  backLeg2.matrix.translate(.14, 0, .59);
  backLeg2.matrix.rotate(90, 1, 0, 0);
  if (g_backLeg1Animation) {
    backLeg2.matrix.rotate(25 * Math.sin(g_seconds), 1, 0, 0);
  } else {
    backLeg2.matrix.rotate(g_backLeg2, 0, 1, 0);
  }
  var backLeg2Coordinates = new Matrix4(backLeg2.matrix);
  backLeg2.matrix.scale(2.5, 2.5, .27);
  backLeg2.render();

  var backKnee2 = new Cylinder();
  backKnee2.color = [.3, .3, .3, 1.0];
  backKnee2.matrix = backLeg2Coordinates;
  backKnee2.matrix.translate(0, 0, .27);
  backKnee2.matrix.rotate(g_backKnee2, 1, 0, 0);
  var backKnee2Coordinates = new Matrix4(backKnee2.matrix);
  backKnee2.matrix.scale(2.4, 2.4, .25);
  //var backLeg1Coordinates = new Matrix4(backLeg1.matrix);
  backKnee2.render();

  var paw1 = new Cube();
  paw1.color = [.2, .2, .2, 1.0];
  paw1.matrix = frontKnee1Coordinates;
  paw1.matrix.translate(-.075, .07, .35);
  paw1.matrix.rotate(180, 1, 0, 0);
  paw1.matrix.scale(.15, .16, .1);
  paw1.render();

  var paw2 = new Cube();
  paw2.color = [.2, .2, .2, 1.0];
  paw2.matrix = backKnee1Coordinates;
  paw2.matrix.translate(-.075, .07, .35);
  paw2.matrix.rotate(180, 1, 0, 0);
  paw2.matrix.scale(.15, .16, .1);
  paw2.render();

  var paw3 = new Cube();
  paw3.color = [.2, .2, .2, 1.0];
  paw3.matrix = frontKnee2Coordinates;
  paw3.matrix.translate(-.075, .07, .35);
  paw3.matrix.rotate(180, 1, 0, 0);
  paw3.matrix.scale(.15, .16, .1);
  paw3.render();

  var paw4 = new Cube();
  paw4.color = [.2, .2, .2, 1.0];
  paw4.matrix = backKnee2Coordinates;
  paw4.matrix.translate(-.075, .07, .35);
  paw4.matrix.rotate(180, 1, 0, 0);
  paw4.matrix.scale(.15, .16, .1);
  paw4.render();
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