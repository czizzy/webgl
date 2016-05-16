var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas, true);
console.log(gl);

var ANGLE_STEP = 45;

var VSHADER_SOURCE = getSource('4.vert');
var FSHADER_SOURCE = getSource('2.frag');
Promise.all([VSHADER_SOURCE, FSHADER_SOURCE]).then(function(sources) {
    if(!initShaders(gl, sources[0], sources[1])) {
        console.log('a');
    }

    var n = initVertexBuffers();

    gl.clearColor(1.0, 0.0, 0.0, 0.5);

    // var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    // gl.uniform4f(u_FragColor, 1.0, 0.0, 1.0, 1.0);

    var currentAngle = 0;
    var xformMatrix = new Matrix4();
    var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
    var tick = function() {
        currentAngle = animate(currentAngle);
        draw(gl, n, currentAngle, xformMatrix, u_xformMatrix);
        requestAnimationFrame(tick);
    };
    tick();
});

function draw(gl, n, currentAngle, xformMatrix, u_xformMatrix) {
    // xformMatrix.setRotate(currentAngle, 0, 0, 1);
    // xformMatrix.translate(0.3, 0, 0);
    xformMatrix.setTranslate(0.3, 0, 0);
    xformMatrix.rotate(currentAngle, 0, 0, 1);
    
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);

    // var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
    // gl.uniform4f(u_Translation, tx, ty, tz, 0.0);

    gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.drawArrays(gl.Points, 0, n);
    //    gl.drawArrays(gl.TRIANGLES, 0, n);
        gl.drawArrays(gl.LINE_LOOP, 0, n);

}

function initVertexBuffers(){
    var vertices = new Float32Array([
        0.0, 0.5, 5.0, 1.0, 0.0, 0.0,
            -0.5, -0.5, 10.0, 0.0, 1.0, 0.0,
        0.5, -0.5, 20.0, 0.0, 0.0, 1.0
    ]);

    var n = 3;

    var vertexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 0);

    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 2 * vertices.BYTES_PER_ELEMENT);

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);

    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_PointSize);
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
