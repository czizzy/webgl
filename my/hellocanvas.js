var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas, true);
console.log(gl);

var VSHADER_SOURCE = getSource('1.vert');
var FSHADER_SOURCE = getSource('1.frag');

Promise.all([VSHADER_SOURCE, FSHADER_SOURCE]).then(function(sources) {
    console.log(sources);
    if(!initShaders(gl, sources[0], sources[1])) {
        console.log('a');
    }
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if(a_Position < 0) {
        console.log('faile');
    }
    console.log(a_Position);
    gl.clearColor(1.0, 0.0, 0.0, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);
    canvas.onclick = function(ev) {
        click(ev);
    };
gl.vertexAttrib1f(a_PointSize, 10.0);
    var g_points = [];
    function click(ev) {
        var x = ev.clientX;
        var y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();
        x = ((x - rect.left) - canvas.width / 2)/(canvas.width/2);
        y = (canvas.height / 2 - (y - rect.top))/(canvas.height/2);
        g_points.push([x, y]);
        gl.clear(gl.COLOR_BUFFER_BIT);

        for(var i = 0; i < g_points.length; i++) {
            gl.vertexAttrib3f(a_Position, g_points[i][0], g_points[i][1], 0.0);
            gl.uniform4f(u_FragColor, 1.0, 0.0, 1.0, 1.0);
            

            gl.drawArrays(gl.POINTS, 0, 1);
        }
    }
});

