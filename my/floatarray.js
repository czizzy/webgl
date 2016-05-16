var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas, true);
console.log(gl);

var tx = 0.5;
var ty = 0.5;
var tz = 0.0;

var VSHADER_SOURCE = getSource('3.vert');
var FSHADER_SOURCE = getSource('1.frag');
Promise.all([VSHADER_SOURCE, FSHADER_SOURCE]).then(function(sources) {
    if(!initShaders(gl, sources[0], sources[1])) {
        console.log('a');
    }

    var n = initVertexBuffers();

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    gl.uniform4f(u_FragColor, 1.0, 0.0, 1.0, 1.0);

    var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
    gl.uniform4f(u_Translation, tx, ty, tz, 0.0);

    gl.clearColor(1.0, 0.0, 0.0, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);
    console.log(n);
    // gl.drawArrays(gl.Points, 0, n);
    gl.drawArrays(gl.TRIANGLES, 0, n);
});

function initVertexBuffers(){
    var vertices = new Float32Array([
        0.0, 0.5, 5.0,
        -0.5, -0.5, 10.0,
        0.5, -0.5, 20.0
    ]);

    var n = 3;

    var vertexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 3 * vertices.BYTES_PER_ELEMENT, 0);

    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 3 * vertices.BYTES_PER_ELEMENT, 2 * vertices.BYTES_PER_ELEMENT);

    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_PointSize);

    return n;
}

