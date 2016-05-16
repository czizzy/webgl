var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas, true);
console.log(gl);

var ANGLE_STEP = 45;

var VSHADER_SOURCE = getSource('pers.vert');
var FSHADER_SOURCE = getSource('2.frag');
Promise.all([VSHADER_SOURCE, FSHADER_SOURCE]).then(function(sources) {
    if(!initShaders(gl, sources[0], sources[1])) {
        console.log('a');
    }

    var n = initVertexBuffers();

    gl.enable(gl.DEPTH_TEST);
    
    gl.clearColor(1.0, 0.0, 0.0, 0.5);

    var currentAngle = 0;
    var xformMatrix = new Matrix4();
    var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');

    var projMatrix = new Matrix4();
    projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
    console.log(projMatrix);
    console.log(u_ViewMatrix);
    console.log(u_ProjMatrix);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    var tick = function() {
        currentAngle = animate(currentAngle);
        draw(gl, n, currentAngle, xformMatrix, u_xformMatrix, u_ViewMatrix);
        requestAnimationFrame(tick);
    };
    tick();

    document.onkeydown = function(ev) {
        keydown(ev);
    };
});


var viewMatrix = new Matrix4();
var eyeX = 0.0, eyeY = 0.0, eyeZ = 7;
viewMatrix.setLookAt(eyeX, eyeY, eyeZ, 0, 0, 0, 0, 1, 0);

function keydown(ev) {
    if(ev.keyCode == 39) {
        eyeX += 0.1;
    } else if(ev.keyCode == 37) {
        eyeX -= 0.1;
    } else if(ev.keyCode == 38) {
        eyeY += 0.1;
    } else if(ev.keyCode == 40) {
        eyeY -= 0.1;
    }
    viewMatrix.setLookAt(eyeX, eyeY, eyeZ, 0, 0, 0, 0, 1, 0);
}

function draw(gl, n, currentAngle, xformMatrix, u_xformMatrix, u_ViewMatrix) {
    // xformMatrix.setTranslate(0, 0, 0);
    xformMatrix.setRotate(currentAngle, 0, 0, 1);
//    xformMatrix.setRotate(0, 0, 0, 1);
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);

 //   viewMatrix.setLookAt(0.2, 0.25, 0.25, 0, 0, 0, 0, 1, 0);
//    viewMatrix.setLookAt(0, 0.8, 0.5, 0, 0, 0, 0, 0, -1);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(){
    var vertices = new Float32Array([
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0,         // v0
            -1.0, 1.0, 1.0, 1.0, 0.0, 1.0,    // v1
            -1.0, -1.0, 1.0, 1.0, 0.0, 0.0,   // v2
        1.0, -1.0, 1.0, 0.0, 1.0, 0.0,        // v3
        1.0, -1.0, -1.0, 0.0, 0.0, 1.0,       // v4
        1.0, 1.0, -1.0, 1.0, 1.0, 0.0,        // v5
            -1.0, 1.0, -1.0, 0.0, 1.0, 1.0,   // v6
            -1.0, -1.0, -1.0, 0.0, 0.0, 0.0,  // v7
    ]);

    var indices = new Uint8Array([
        0,1,2,0,2,3,
        0,3,4,0,4,5,
        0,5,6,0,6,1,
        1,6,7,1,7,2,
        7,4,3,7,3,2,
        4,7,6,4,6,5
    ]);

    var n = vertices.length / 6;

    var vertexBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 0);

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_Color);

    return indices.length;
}
var g_last = Date.now();
function animate(angle) {
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;
    return (angle + (ANGLE_STEP * elapsed / 1000)) % 360;
}
