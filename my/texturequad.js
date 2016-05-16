var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas, true);
console.log(gl);

var ANGLE_STEP = 45;

var VSHADER_SOURCE = getSource('texturequad.vert');
var FSHADER_SOURCE = getSource('texturequad.frag');
var texture = getImage('../resources/sky.jpg');
Promise.all([VSHADER_SOURCE, FSHADER_SOURCE, texture]).then(function(sources) {
    if(!initShaders(gl, sources[0], sources[1])) {
        console.log('a');
    }

    var n = initVertexBuffers();

    gl.clearColor(1.0, 0.0, 0.0, 0.5);

    console.log(sources);

    var texture = gl.createTexture();   // Create a texture object
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, sources[2]);
    gl.uniform1i(u_Sampler, 0);

    var currentAngle = 0;
    var xformMatrix = new Matrix4();
    var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
    var tick = function() {
        currentAngle = animate(currentAngle);
        draw(gl, n, currentAngle, xformMatrix, u_xformMatrix);
        // requestAnimationFrame(tick);
    };
    tick();
});

function draw(gl, n, currentAngle, xformMatrix, u_xformMatrix) {
    xformMatrix.setRotate(currentAngle, 0, 0, 1);
    
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.drawArrays(gl.Points, 0, n);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}

function initVertexBuffers(){
    var vertices = new Float32Array([
        -0.5, 0.5, 0.0, 2.0,
            -0.5, -0.5, 0.0, 0.0,
        0.5, 0.5, 2.0, 2.0,
        0.5, -0.5, 2.0, 0.0
    ]);

    var n = 4;

    var vertexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    console.log(a_Position);
    console.log(a_TexCoord);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 4 * vertices.BYTES_PER_ELEMENT, 0);

    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 4 * vertices.BYTES_PER_ELEMENT, 2 * vertices.BYTES_PER_ELEMENT);

    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_TexCoord);

    return n;
}
var g_last = Date.now();
function animate(angle) {
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;
    return (angle + (ANGLE_STEP * elapsed / 1000)) % 360;
}
