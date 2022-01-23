"use strict";

//get references to the renderer and gl context
var renderer = new Renderer(document.getElementById('webgl-canvas'));
renderer.setClearColor(0, 0, 0);
var gl = renderer.getContext();

//play sound in the background
var myAudio = new Audio('/assets/underwater.mp3');
myAudio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);
myAudio.play();

//saving the timestamp at start
var startTime = Date.now();

//canvas dimensions
var width;
var height;

//camera coordinates declaration: y (height) always 0
var x = 0;
var z = 1;
var cameraRotation = 0;

//object references declaration
var objects = [];
var medusas = [];
var randomPositions = [];
var terrain;
var flora;
var sub;
var propeller;
var shipwreckSmall;
var shipwreckBig;
var city;
var ray;
var manta;
var subwreckA;
var subwreckB;
var light_right;
var light_left;
var light_right_right;
var light_left_left;

var numberOfObjects = 40;

//helper animation variables declaration
var scale = 0.003;
var counter = 0;
var speedUp = 0;
var slowDown = 1.3;
var rayX = 1.5;
var rayY = 0;
var rayZ = -1.5;

//variables used by the framebuffer
var renderTargetFramebuffer;
var framebufferWidth = gl.canvas.clientWidth;
var framebufferHeight = gl.canvas.clientHeight;
var verticesBuffer = gl.createBuffer();
var uvBuffer = gl.createBuffer();

//textures that the canvas will be rendered to for the postprocessing
var renderTargetColorTexture;
var renderTargetDepthTexture;

//coordinates of the full screen quad displayed on canvas
var vertices = [
  -1.0,-1.0,
   1.0,-1.0,
  -1.0, 1.0,

  -1.0, 1.0,
   1.0,-1.0,
   1.0, 1.0
];
var textureCoords = [
  -1.0, -1.0,
  1.0, -1.0,
  -1.0, 1.0,

  -1.0, 1.0,
  1.0, -1.0,
  1.0, 1.0

];

//the submarine in the middle of the scene
Mesh.load(gl, '/assets/sub.obj', '/assets/sub.png')
.then(function (mesh) {
  mesh.position = mesh.position.translate(0,-0.1,0);
  mesh.position = mesh.position.scale(0.05,0.05,0.05);
  mesh.ambient = new Vector3(1, 1, 1);
  mesh.diffuse = new Vector3(0.05, 0.05, 0.05);
  mesh.specular = new Vector3(0, 0, 0);
  mesh.shininess = 4.0;
  mesh.group = 4.0;
  sub = mesh;
  objects.push(sub);
})

Mesh.load(gl, '/assets/sphere.obj', '/assets/light_color.png')
.then(function (mesh) {
  mesh.position = mesh.position.translate(0.035,-0.062,-0.065);
  mesh.position = mesh.position.scale(0.001,0.001,0.001);
  mesh.ambient = new Vector3(2.3, 2.0, 1.2);
  mesh.diffuse = new Vector3(2.3, 2.0, 1.2);
  mesh.specular = new Vector3(2.3, 2.0, 1.2);
  mesh.group = 0.0;
  light_right = mesh;
  objects.push(light_right);
})

Mesh.load(gl, '/assets/sphere.obj', '/assets/light_color.png')
.then(function (mesh) {
  mesh.position = mesh.position.translate(-0.035,-0.062,-0.065);
  mesh.position = mesh.position.scale(0.001,0.001,0.001);
  mesh.ambient = new Vector3(2.3, 2.0, 1.2);
  mesh.diffuse = new Vector3(2.3, 2.0, 1.2);
  mesh.specular = new Vector3(2.3, 2.0, 1.2);
  mesh.group = 0.0;
  light_left = mesh;
  objects.push(light_left);
})

Mesh.load(gl, '/assets/sphere.obj', '/assets/white.png')
.then(function (mesh) {
  mesh.position = mesh.position.translate(0.092,-0.062,-0.02);
  mesh.position = mesh.position.scale(0.001,0.001,0.001);
  mesh.ambient = new Vector3(2.3, 2.0, 1.2);
  mesh.diffuse = new Vector3(2.3, 2.0, 1.2);
  mesh.specular = new Vector3(2.3, 2.0, 1.2);
  mesh.group = 0.0;
  light_right_right = mesh;
  objects.push(light_right_right);
})

Mesh.load(gl, '/assets/sphere.obj', '/assets/white.png')
.then(function (mesh) {
  mesh.position = mesh.position.translate(-0.092,-0.062,-0.02);
  mesh.position = mesh.position.scale(0.001,0.001,0.001);
  mesh.ambient = new Vector3(2.3, 2.0, 1.2);
  mesh.diffuse = new Vector3(2.3, 2.0, 1.2);
  mesh.specular = new Vector3(2.3, 2.0, 1.2);
  mesh.group = 0.0;
  light_left_left = mesh;
  objects.push(light_left_left);
})

//the rotating propeller at the end of the sub
Mesh.load(gl, '/assets/propeller.obj', '/assets/propeller.png')
.then(function (mesh) {
  mesh.position = mesh.position.translate(0,-0.102,0);
  mesh.position = mesh.position.scale(0.05,0.05,0.05);
  mesh.ambient = new Vector3(0, 0, 0);
  mesh.diffuse = new Vector3(0.01, 0.01, 0.01);
  mesh.specular = new Vector3(0, 0, 0);
  mesh.group = 4.0;
  propeller = mesh;
  objects.push(propeller);
})

//object loading: the sea bottom
Mesh.load(gl, '/assets/terrain_smooth.obj', '/assets/terrain2.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(0.1,-0.24,-34);
      mesh.position = mesh.position.scale(0.01,0.01,0.01);
      mesh.ambient = new Vector3(1, 1, 1);
      mesh.diffuse = new Vector3(0.02, 0.02, 0.02);
      mesh.specular = new Vector3(0.07, 0.07, 0.07);
      //mesh.position = mesh.position.rotateY(DegToRad(90));
      //mesh.position = mesh.position.rotateZ(270);
      mesh.shininess = 5.0;
      terrain = mesh;
      objects.push(terrain);
    })

//object loading: all the plants scattered over the sea bottom
Mesh.load(gl, '/assets/flora.obj', '/assets/flora3.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(0.1,-0.24,-34);
      mesh.position = mesh.position.scale(0.01,0.01,0.01);
      mesh.ambient = new Vector3(0.01, 0.03, 0.02);
      mesh.diffuse = new Vector3(0.01, 0.03, 0.02);
      mesh.specular = new Vector3(0.01, 0.03, 0.02);
      mesh.group = 0.0;
      flora = mesh;
      objects.push(flora);
    })

//object loading: the underwater city
Mesh.load(gl, '/assets/city.obj', '/assets/city.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(3,-2,0);
      mesh.position = mesh.position.scale(0.05,0.05,0.05);
      mesh.ambient = new Vector3(2.5, 2.5, 0.5);
      mesh.diffuse = new Vector3(2.5, 2.5, 0.5);
      mesh.specular = new Vector3(2.5, 2.5, 0.5);
      mesh.group = 3.0;
      city = mesh;
      objects.push(city);
    })

//object loading: the jellyfish cloud
for (var i=0; i<10; i++) {
  Mesh.load(gl, '/assets/medusa.obj', '/assets/medusa2.png')
      .then(function (mesh) {
        mesh.position = mesh.position.translate(randomInRange(-1,1),randomInRange(0.2,0.7),0);
        mesh.position = mesh.position.scale(0.00002,0.00002,0.00002);
        mesh.ambient = new Vector3(0,0,0);
        mesh.diffuse = new Vector3(0.01,0.01,0.01);
        mesh.specular = new Vector3(0.05,0.05,0.05);
        medusas.push(mesh);
        randomPositions.push(randomInRange(-5,5));
        objects.push(mesh);
      })
    }

for (var i=0; i<15; i++) {
  Mesh.load(gl, '/assets/medusa.obj', '/assets/medusa.png')
      .then(function (mesh) {
        mesh.position = mesh.position.translate(randomInRange(-1,1),randomInRange(0.2,0.7),0);
        mesh.position = mesh.position.scale(0.00002,0.00002,0.00002);
        mesh.ambient = new Vector3(0,0,0);
        mesh.diffuse = new Vector3(0.01,0.01,0.01);
        mesh.specular = new Vector3(0.05,0.05,0.05);
        medusas.push(mesh);
        randomPositions.push(randomInRange(-5,5));
        objects.push(mesh);
      })
    }

    //object loading: the big shipwreck positioned on the right side
Mesh.load(gl, '/assets/shipwreck.obj', '/assets/shipwreck.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(0.5,0,10);
      mesh.position = mesh.position.scale(0.05,0.05,0.05);
      mesh.position = mesh.position.rotateY(DegToRad(150));
      mesh.ambient = new Vector3(0,0,0);
      mesh.diffuse = new Vector3(0.05,0.05,0.05);
      mesh.specular = new Vector3(0.05,0.05,0.05);

      /*
      mesh.ambient = new Vector3(0.24725/6, 0.1995/6, 0.0745/6);
      mesh.diffuse = new Vector3(0.75164/6, 0.60648/6, 0.22648/6);
      mesh.specular = new Vector3(0.628281/6, 0.555802/6, 0.366065/6);
      */
      //mesh.group = 0.0;
      //mesh.shininess = 10.0;
      shipwreckSmall = mesh;
      objects.push(shipwreckSmall);
    })

//object loading: the small shipwreck positioned on the left side
Mesh.load(gl, '/assets/shipwreck.obj', '/assets/shipwreck.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(-4.8,0.2,0);
      mesh.position = mesh.position.scale(0.16,0.16,0.16);
      mesh.position = mesh.position.rotateY(DegToRad(150));
      mesh.ambient = new Vector3(0,0,0);
      mesh.diffuse = new Vector3(0.05,0.05,0.05);
      mesh.specular = new Vector3(0,0,0);
      //mesh.group = 0.0;
      shipwreckBig = mesh;
      objects.push(shipwreckBig);
    })

//object loading: first of the rays passing by the sub
Mesh.load(gl, '/assets/ray.obj', '/assets/ray.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(rayX,-0.2,0);
      mesh.position = mesh.position.rotateY(DegToRad(-50));
      mesh.position = mesh.position.scale(0.5,0.5,0.5);
      mesh.ambient = new Vector3(0,0,0);
      mesh.diffuse = new Vector3(0.05,0.05,0.05);
      mesh.specular = new Vector3(0,0,0);
      mesh.group = 0.0;
      ray = mesh;
      objects.push(ray);
    })

//object loading: second of the manta rays passing by the sub
Mesh.load(gl, '/assets/ray.obj', '/assets/ray.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(rayX,-0.2,0);
      mesh.position = mesh.position.rotateY(DegToRad(-50));
      mesh.position = mesh.position.scale(0.5,0.5,0.5);
      mesh.ambient = new Vector3(0,0,0);
      mesh.diffuse = new Vector3(0.05,0.05,0.05);
      mesh.specular = new Vector3(0,0,0);
      mesh.group = 0.0;
      manta = mesh;
      objects.push(manta);
    })

//object loading: the big part of the submarine wreck
Mesh.load(gl, '/assets/subwreckA.obj', '/assets/subwreck.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(-1.8,-0.3,0);
      mesh.position = mesh.position.rotateY(DegToRad(-110));
      mesh.position = mesh.position.scale(0.03,0.03,0.03);
      mesh.ambient = new Vector3(0,0,0);
      mesh.diffuse = new Vector3(0.05,0.05,0.05);
      mesh.specular = new Vector3(0.05,0.05,0.05);
      mesh.group = 0.0;
      subwreckA = mesh;
      objects.push(subwreckA);
    })

//object loading: the small part of the submarine wreck
Mesh.load(gl, '/assets/subwreckB.obj', '/assets/subwreck.png')
    .then(function (mesh) {
      mesh.position = mesh.position.translate(-1.6,-0.3,0);
      mesh.position = mesh.position.rotateY(DegToRad(-70));
      mesh.position = mesh.position.scale(0.03,0.03,0.03);
      mesh.ambient = new Vector3(0,0,0);
      mesh.diffuse = new Vector3(0.05,0.05,0.05);
      mesh.specular = new Vector3(0.05,0.05,0.05);
      subwreckB = mesh;
      objects.push(subwreckB);
    })

//shader loading
ShaderProgram.load(gl, '/shaders/basic.vert', '/shaders/basic.frag')
             .then(function (shader) {
               renderer.setShader(shader)
             })

//adding the perspective camera to the scene
var camera = new Camera()
camera.setPerspective(150,gl.canvas.clientHeight/gl.canvas.clientWidth,0.1,300);
camera.position = camera.position.translate(0,0,z);

//adding the ambient light to the scene
var light = new Light();

//camera control by mouse
initInteraction(gl.canvas);

//generate a program out of the compiled vertex and fragment shaders
var program = createProgram(gl, compileShader(gl, loadFile("vs"), gl.VERTEX_SHADER), compileShader(gl, loadFile("fs"), gl.FRAGMENT_SHADER));

initRenderToTexture();

loop();
//fields array content, this might be helpful to understand the following lines
//0 4 8  12<- x position coordinate (left/right)
//1 5 9  13<- y position coordinate (up/down)
//2 6 10 14<- z position coordinate (forwards/backwards)
//3 7 11 15

//main action rendering loop
function loop () {
  //check if all objects loaded and render, otherwise show the loading screen
  if (objects.length < numberOfObjects) {
    document.getElementById('text').innerHTML = "Loading the scene (object " + (objects.length+1) + "/" + numberOfObjects + ") <br><br> please wait and make sure your speakers are turned on";
  }
  else {
    //adjusting the camera ratio in case of a window resize event
    resizeCanvas();

    //set up a viewport and clear the buffers
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //if it is not the scene ending, move landscape around the sub
    if (terrain.position.fields[14] < 20) {
      terrain.position = terrain.position.translate(0,0,1.3); //-----------------------------------------------------------------scene speed
      flora.position.fields[14] = terrain.position.fields[14];
      shipwreckSmall.position.fields[14] = terrain.position.fields[14] + 29.5;
      shipwreckBig.position.fields[14] = terrain.position.fields[14] + 15;
      subwreckA.position.fields[14] = terrain.position.fields[14] -18;
      subwreckB.position.fields[14] = terrain.position.fields[14] -20;
      city.position.fields[14] = terrain.position.fields[14] -40;
      ray.position.fields[14] = terrain.position.fields[14] -9.5;
      manta.position.fields[14] = terrain.position.fields[14] -9.3;
      for (i=0; i<medusas.length; i++) {
        medusas[i].position.fields[14] = terrain.position.fields[14] + randomPositions[i];;
      }
    }

    //animate the manta rays movement as the sub is passing by
    if (terrain.position.fields[14] > 5) {
      rayX -= 0.005;
      rayY += 0.005;
      rayZ += 0.002;
      ray.position.fields[12] = rayX;
      ray.position.fields[13] = -Math.sin(rayY)/3.5+0.07;
      ray.position.fields[14] = terrain.position.fields[14] -9.7 + rayZ;
      manta.position.fields[12] = rayX;
      manta.position.fields[13] = -Math.sin(rayY)/3.5+0.09;
      manta.position.fields[14] = terrain.position.fields[14] -9.5 + rayZ;
    }

    //medusa animation
    counter++;
    if (counter % 100 == 0) { scale = -scale; counter = 0; }
    for (i=0; i<medusas.length; i++) {
      medusas[i].position = medusas[i].position.scale(1+scale,1-scale,1+scale);
    }

    //propeller spin
    propeller.position = propeller.position.rotateZ(DegToRad(50));

    //chaging camera rotation around Y axis
    camera.position = camera.position.rotateY(DegToRad(-cameraRotation))

    //changing camera position around the scene center
    var xnew = x*Math.cos(DegToRad(cameraRotation))-z*Math.sin(DegToRad(cameraRotation));
    var znew = z*Math.cos(DegToRad(cameraRotation))+x*Math.sin(DegToRad(cameraRotation));
    camera.position.fields[12] = xnew;
    camera.position.fields[14] = znew;
    x = xnew;
    z = znew;

    //smooth out the ending of the camera rotation effect initiated by mouse drag
    if (cameraRotation > -0.001 && cameraRotation < 0.001) {cameraRotation = 0} else {cameraRotation = (cameraRotation / 1.2).toPrecision(5)}

    //stop the camera movement at the end of the scene and let the sub continue forwards
    if (terrain.position.fields[14] > 20) {
      speedUp -= 0.001;
      if (slowDown > 0) {
      slowDown -= 0.01
      sub.position = sub.position.translate(0,0,speedUp);
      propeller.position = propeller.position.translate(0,0,speedUp)
      light_right.position.fields[14] = sub.position.fields[14] -0.065;
      light_right_right.position.fields[14] = sub.position.fields[14] -0.02;
      light_left.position.fields[14] = sub.position.fields[14] -0.065;
      light_left_left.position.fields[14] = sub.position.fields[14] -0.02;
      terrain.position = terrain.position.translate(0,0,slowDown);
      city.position.fields[14] = terrain.position.fields[14] -40;
      subwreckA.position.fields[14] = terrain.position.fields[14] -18;
      subwreckB.position.fields[14] = terrain.position.fields[14] -20;
      flora.position.fields[14] = terrain.position.fields[14];
    } else {
      light.lightsOn = 0.0;
      light_right.position.fields[14] = sub.position.fields[14] -0.065;
      light_right_right.position.fields[14] = sub.position.fields[14] -0.02;
      light_left.position.fields[14] = sub.position.fields[14] -0.065;
      light_left_left.position.fields[14] = sub.position.fields[14] -0.02;
      sub.position = sub.position.translate(0,0,speedUp);
      propeller.position = propeller.position.translate(0,0,speedUp);
    }
    }

    //restart the scene after the sub floats away
    if (sub.position.fields[14] < -5) {
      light.lightsOn = 1.0;
      sub.position.fields[14] = 0;
      light_right.position.fields[14] = -0.065;
      light_right_right.position.fields[14] = -0.02;
      light_left.position.fields[14] = -0.065;
      light_left_left.position.fields[14] = -0.02;
      propeller.position.fields[14] = 0;
      terrain.position.fields[14] = -34;
      speedUp = 0;
      slowDown = 1.35;
      rayX = 1.5;
      rayY = 0;
      rayZ = -1.5;
      ray.position = ray.position.translate(rayX,-0.2,0);
      //generate new positions for jellyfish cloud
      randomPositions = [];
      for (var i=0; i<25; i++) {
          randomPositions.push(randomInRange(-5,5));
      }
      //restart the audiofile
      if (myAudio.paused) {
        myAudio.play();
      }else{
        myAudio.currentTime = 0
      }
    }

    renderToTexture();

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "aVertexPosition"));
    gl.vertexAttribPointer(gl.getAttribLocation(program, "aVertexPosition"), 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "aVertexTextureCoords"));
    gl.vertexAttribPointer(gl.getAttribLocation(program, "aVertexTextureCoords"), 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderTargetColorTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uSamplerColor"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, renderTargetDepthTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uSamplerDepth"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "uTime"), Date.now() - startTime);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  requestAnimationFrame(loop)
}
