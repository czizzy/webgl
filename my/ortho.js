var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas, true);
console.log(gl);

var ANGLE_STEP = 45;

var VSHADER_SOURCE = getSource('ortho.vert');
var FSHADER_SOURCE = getSource('2.frag');
Promise.all([VSHADER_SOURCE, FSHADER_SOURCE]).then(function(sources) {
    if(!initShaders(gl, sources[0], sources[1])) {
        console.log('a');
    }

    var n = initVertexBuffers();

    gl.clearColor(1.0, 0.0, 0.0, 0.5);

    var currentAngle = 0;
    var xformMatrix = new Matrix4();
    var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');


    var tick = function() {
        currentAngle = animate(currentAngle);
        draw(gl, n, currentAngle, xformMatrix, u_xformMatrix, u_ProjMatrix);
        requestAnimationFrame(tick);
    };
    tick();

    document.onkeydown = function(ev) {
        keydown(ev);
    };
});


var projMatrix = new Matrix4();
var near = 0.0, far = 0.5;
projMatrix.setOrtho(-0.5, 0.5, -1, 1, near, far);

function keydown(ev) {
    if(ev.keyCode == 39) {
        near += 0.01;
    } else if(ev.keyCode == 37) {
        near -= 0.01;
    } else if(ev.keyCode == 38) {
        far += 0.01;
    } else if(ev.keyCode == 40) {
        far -= 0.01;
    }
    document.getElementById('nearfar').innerHTML = near + ' ' + far;
    projMatrix.setOrtho(-1, 1, -1, 1, near, far);
}

function draw(gl, n, currentAngle, xformMatrix, u_xformMatrix, u_ProjMatrix) {
    // xformMatrix.setTranslate(0, 0, 0);
    xformMatrix.setRotate(currentAngle, 0, 0, 1);
    xformMatrix.setRotate(0, 0, 0, 1);
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);

 //   viewMatrix.setLookAt(0.2, 0.25, 0.25, 0, 0, 0, 0, 1, 0);
//    viewMatrix.setLookAt(0, 0.8, 0.5, 0, 0, 0, 0, 0, -1);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(){
    var vertices = new Float32Array([
        0.0, 0.5, -0.4, 0.0, 0.0, 1.0,
       -0.5, -0.5, -0.4, 0.0, 0.0, 1.0,
        0.5, -0.5, -0.4, 0.0, 0.0, 1.0,


        -0.5, 0.5, -0.2, 0.0, 1.0, 0.0,
        0, -0.5, -0.2, 0.0, 1.0, 0.0,
        0.5, 0.5, -0.2, 0.0, 1.0, 0.0,

        0.0, 0.5, 0.0, 1.0, 0.0, 0.0,
       -0.5, -0.5, 0.0, 0.0, 1.0, 0.0,
        0.5, -0.5, 0.0, 0.0, 0.0, 1.0,


    ]);

    var n = vertices.length / 6;

    var vertexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 0);

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    console.log(a_Position);
    console.log(a_Color);

    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_Color);

    return n;
}
var g_last = Date.now();
function animate(angle) {
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;
    return (angle + (ANGLE_STEP * elapsed / 1000)) % 360;
}
