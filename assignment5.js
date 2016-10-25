let vertexShader = `
attribute vec4 a_Position;
attribute vec4 a_Color;

uniform mat4 u_View;
uniform mat4 u_Projection;
uniform mat4 u_Transform;

varying vec4 v_Color;

void main(){
  v_Color = a_Color;
  gl_Position = u_Projection  * u_View * u_Transform * a_Position;
}`;

var fragmentShader = `
precision mediump float;
varying vec4 v_Color;
void main(){
  gl_FragColor = v_Color;
}`;

//camera object
let camera = {
  panAngle : 210,
  eyeX : 10,
  eyeZ : 10,
  atX : function(){return this.eyeX + Math.sin(this.panAngle*(Math.PI / 180));},
  atZ : function(){return this.eyeZ + Math.cos(this.panAngle*(Math.PI / 180));},
  apply: function(gl, program, ad, ws){
    //rotate
    this.panAngle += ad*2;

    //walk camera
    this.eyeZ +=(ws/10)* Math.cos(this.panAngle*(Math.PI / 180));
    this.eyeX +=(ws/10)* Math.sin(this.panAngle*(Math.PI / 180));

    //shift what you're looking at
    this.atZ=this.eyeZ + Math.cos(this.panAngle*(Math.PI / 180));
    this.atX=this.eyeX + Math.sin(this.panAngle*(Math.PI / 180));

    //create view matrix
    let view = mat4.create();
    let eye = vec3.fromValues(this.eyeX, 1, this.eyeZ);
    let up = vec3.fromValues(0,1,0);
    let at = vec3.fromValues(this.atX, 1, this.atZ);

    return mat4.lookAt(view, eye, at, up);
  },


};

var createGrid = function(gl, program){
  // vertices and their colors (arranged x1,y1,z1, r1,g1,b1, x2, y2, z2, r2,g2.b2, etc...)
  var vertices  = new Float32Array(42*12);

  //ugly, but i just wanted to crank it out as fast as possible. and this made sense
  var index = 0;
  //lines parallel to x axis
  for (var z =-10; z <=10; z+=1){
    //x1,y1,z1
    vertices[index] = -10;
    index ++;
    vertices[index] = 0;
    index ++;
    vertices[index] = z;
    index ++;
    //r1,g1,b1
    vertices[index] = 1;
    index ++;
    vertices[index] = 1;
    index ++;
    vertices[index] = 1;
    index ++;
    //x2,y2,z2
    vertices[index] = 10;
    index ++;
    vertices[index] = 0;
    index ++;
    vertices[index] = z;
    index ++;
    //r2,b2,g2
    vertices[index] = 1;
    index ++;
    vertices[index] = 1;
    index ++;
    vertices[index] = 1;
    index ++;
  }

  //lines parallel to z axis
  for (var x =-10; x <=10; x+=1){
    //x1,y1,z1
    vertices[index] = x;
    index ++;
    vertices[index] = 0;
    index ++;
    vertices[index] = -10;
    index ++;
    //r1,g1,b1
    vertices[index] = 1;
    index ++;
    vertices[index] = 1;
    index ++;
    vertices[index] = 1;
    index ++;
    //x2,y2,z2
    vertices[index] = x;
    index ++;
    vertices[index] = 0;
    index ++;
    vertices[index] = 10;
    index ++;
    //r2,g2,b2
    vertices[index] = 1;
    index ++;
    vertices[index] = 1;
    index ++;
    vertices[index] = 1;
    index ++;
  }

    // calculate the number of vertices
    var n = vertices.length/6;


    // add the vertex attributes down to the vertex buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var FSIZE = vertices.BYTES_PER_ELEMENT;


  return function(){
    gl.lineWidth(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, FSIZE*6,0);
    gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false,  FSIZE*6, FSIZE*3);
    gl.drawArrays(gl.LINES, 0, n);
  };

};

var createCube = function(gl, program){
  var cube = {
      vertices : new Float32Array([
            1.0,  1.0,  1.0,
           -1.0,  1.0,  1.0,
           -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,

            1.0,  1.0, -1.0,
           -1.0,  1.0, -1.0,
           -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0
      ]),
      colors: new Float32Array([
            1.0, 1.0, 1.0,
            1.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 1.0, 1.0,

            1.0, 1.0, 0.0,
            1.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 1.0, 0.0]),

      indices: new Uint8Array([
         0,1,2,  0,2,3, // front face
         0,7,4,  0,3,7,   // right face
         1,5,6,  1,6,2, // left face
         0,4,5,  0,5,1, // top face
         3,2,6,  3,6,7, // bottom face
         4,7,6,  4,6,5 // back face

      ]),
      dimensions: 3,
      numPoints: 8
    };

  cube.vertexBuffer = gl.createBuffer();
  cube.colorBuffer = gl.createBuffer();
  cube.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.colors, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);

  return function(){
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
    // associate it with our position attribute
    gl.vertexAttribPointer(program.a_Position, cube.dimensions, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorBuffer);
    // associate it with our color attribute
    gl.vertexAttribPointer(program.a_Color, cube.dimensions, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_BYTE, 0);
  };
};

var createRoof = function(gl, program){
  var cube = {
      vertices : new Float32Array([
          -1.0, -1.0, -1.0,
           0.0,  0.0, -1.0,
           1.0, -1.0, -1.0,

           -1.0, -1.0, 1.0,
            0.0,  0.0, 1.0,
            1.0, -1.0, 1.0
      ]),
      colors: new Float32Array([
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,

            1.0, 0.0, 1.0,
            1.0, 0.0, 1.0,
            1.0, 0.0, 1.0,

          ]),

      indices: new Uint8Array([
         0,1,2, // front face
         3,4,5, // back face
         3,4,2, 2,4,5, // right face
         3,4,1, 0,3,1, // left face
         2,0,4, 2,4,5  // bottom face

      ]),
      dimensions: 3,
      numPoints: 6
    };

  cube.vertexBuffer = gl.createBuffer();
  cube.colorBuffer = gl.createBuffer();
  cube.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.colors, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);

  return function(){
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
    // associate it with our position attribute
    gl.vertexAttribPointer(program.a_Position, cube.dimensions, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorBuffer);
    // associate it with our color attribute
    gl.vertexAttribPointer(program.a_Color, cube.dimensions, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_BYTE, 0);
  };
};

var createPyramid = function(gl, program){
  var cube = {
      vertices : new Float32Array([
           -1.0, -1.0, -1.0,
           -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,
            1.0, -1.0, -1.0,
            0.0,  0.0,  0.0

      ]),
      colors: new Float32Array([
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            0.0, 1.0, 1.0


            ]),

      indices: new Uint8Array([
        0,4,3,
        3,4,2,
        2,4,1,
        1,4,0,
        1,3,0,
        1,2,3

      ]),
      dimensions: 3,
      numPoints: 5
    };

  cube.vertexBuffer = gl.createBuffer();
  cube.colorBuffer = gl.createBuffer();
  cube.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.colors, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);

  return function(){
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
    // associate it with our position attribute
    gl.vertexAttribPointer(program.a_Position, cube.dimensions, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorBuffer);
    // associate it with our color attribute
    gl.vertexAttribPointer(program.a_Color, cube.dimensions, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_BYTE, 0);
  };
};

/*
  This creates the scenegraph. Calling this returns the root node.

  Note that the scenegraph has a stack and a current transformation.

  There are two kinds of nodes, shape and transformation.

  The transformation nodes take in a transformation matrix as data. They also have two functions:
    add(type, data) - creates a new node of type "type", adds it to its child list and returns it.
    apply() - applies its associated transformation by multiplying it with the current matrix. Calls apply on all children

  The shape node takes in a function to be called to draw the associated shape. It has one function:
    apply() - calls its associated drawing method to draw the shape with the current transformation.

*/
var createScenegraph = function(gl, program){
  let stack = [];
  let currentMatrix = mat4.create();
  let u_Transform = gl.getUniformLocation(program, 'u_Transform');

  let createTransformationNode = function(matrix){
    let children = [];
    return {
      add: function(type, data){
        let node;
        if (type === "transformation"){
          node = createTransformationNode(data);
        }else if (type === "shape"){
          node = createShapeNode(data);
        }
        children.push(node);
        node.parent = this;
        return node;
      },
      apply: () =>{
        /* YOUR CODE HERE */
        /* This needs to multiply in the node's matrix with the current transform and then iterate over all of the children, calling their apply() functions.

        Make use of the stack to preserve the state of the current matrix.
        */

      stack.push(currentMatrix);

      var temp =mat4.multiply(currentMatrix, currentMatrix, matrix);

        console.log("children", children);
        for(var i = 0; i < children.length; i++){
          children[i].apply();
          gl.uniformMatrix4fv(u_Transform, false, temp);

        };

        stack.pop();

      }

    };
  };

  let createShapeNode = function(shapeFunc){
    return {
      apply: () =>{
        shapeFunc();

      }

    };
  };


  let root = createTransformationNode(mat4.create());

  return root;
};


window.onload = function(){
  let canvas = document.getElementById('canvas');
  let gl;
  // catch the error from creating the context since this has nothing to do with the code
  try{
    gl = middUtils.initializeGL(canvas);
  } catch (e){
    alert('Could not create WebGL context');
    return;
  }

  // don't catch this error since any problem here is a programmer error
  let program = middUtils.initializeProgram(gl, vertexShader, fragmentShader);
  // load referneces to the vertex attributes as properties of the program
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  if (program.a_Position < 0) {
      console.log('Failed to get storage location');
      return -1;
  }
  gl.enableVertexAttribArray(program.a_Position);

  // specify the association between the VBO and the a_Color attribute
  program.a_Color = gl.getAttribLocation(program, 'a_Color');
  if (program.a_Color < 0) {
      console.log('Failed to get storage location');
      return -1;
  }
  gl.enableVertexAttribArray(program.a_Color);


  /*
  The conventional key handler detects when a key is held down for repeat actions, but it has a pause before it detects the repeat and it is flaky with two keys held down simultaneously. This avoids this by maintaining a mapping of the keys that are currently pressed.
  */
  var keyMap = {};

  window.onkeydown = function(e){
      keyMap[e.which] = true;
  }

  window.onkeyup = function(e){
       keyMap[e.which] = false;
  }

  // the render function
  let render = function(){


  //my variables to keep track of direction. Get sent to camera.
  var ws = 0;
  var ad = 0;

  // check which keys that we care about are down
  if  (keyMap['W'.charCodeAt(0)]){
      ws = 1;
  }else if (keyMap['S'.charCodeAt(0)]){
      ws = -1;
  }

  if  (keyMap['A'.charCodeAt(0)]){
      ad = 1;
  }else if (keyMap['D'.charCodeAt(0)]){
      ad = -1;
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let drawGrid = createGrid(gl, program);
  let drawCube = createCube(gl, program);
  let drawRoof = createRoof(gl, program);
  let drawPyramid = createPyramid(gl, program);

  //uses camera object to get view matrix, passes direction variables
  //ws - forward (1)/backward(-1)/none(0)
  //ad - right(1)/left(-1)/none(0)

  let view = camera.apply(gl, program,ad, ws);
  let transform = mat4.create();
  let identity = mat4.create();

  let u_Transform = gl.getUniformLocation(program, 'u_Transform');
  gl.uniformMatrix4fv(u_Transform, false, transform);

  let projection = mat4.create();
  mat4.perspective(projection, Math.PI/3,1, 0.1,21);

  let u_View= gl.getUniformLocation(program, 'u_View');
  gl.uniformMatrix4fv(u_View, false, view);

  let u_Projection = gl.getUniformLocation(program, 'u_Projection');
  gl.uniformMatrix4fv(u_Projection, false, projection);

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0,0,0,1);

  // DRAW STUFF HERE

  drawGrid();

  var root = createScenegraph(gl, program);
  mat4.translate(transform, identity, [0,4,0]);
  mat4.scale(transform, transform, [1, 2, 1]);

  var node = root.add("transformation", transform);

  node.add( "shape", drawCube);

  // mat4.translate(transform, identity, [0,2,0]);
  // var node2 = node.add("transformation", transform);
  node.add( "shape", drawRoof);


  root.apply();

  // gl.uniformMatrix4fv(u_Transform, false, transform);
  // drawPyramid();
  // drawCube();
  // mat4.translate(transform, transform, [0,2,0]);
  // mat4.scale(transform, transform, [1.4,1.2,1.2]);
  // gl.uniformMatrix4fv(u_Transform, false, transform);
  // drawRoof();

  requestAnimationFrame(render);
  };

  render();

};
