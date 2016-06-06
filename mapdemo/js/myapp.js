var join = 'round';
var withLines = true;
class App extends WebGLApp {
    constructor(canvas) {
        super(canvas);
    }

    configure() {
        this.gl.clearColor(0.2,0.2,0.2, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        Program.init(this.gl);

        var camera = new Camera();
        camera.goHome([0, 0, 5]);

        transform.init(this.gl, this.canvas, camera);

	    var attributeList = [
            "aVertexPosition",
		"aVertexNormal",
            "aVertexIndex"
        ];

	    var uniformList = [
                "uPMatrix", 
		"uMVMatrix",
                "uColor",
                "uLineWidth",
                "uResoluteion"
	    ];
        Program.load(1, attributeList, uniformList);


	    var attributeList = [
            "aVertexPosition"
        ];

	    var uniformList = [
            "uPMatrix", 
			"uMVMatrix" 
		];
        Program.load(2, attributeList, uniformList);
    }

    loadScene() {
        Scene.init(this.gl);
        Scene.loadObject('models/line.json', 'line', null, this.render.bind(this), join);
    }

    render() {
        //init Program
        var line = Scene.getObject('line');
        if(line) {
            mat4.fromTranslation(line.modelMatrix, [0, 0, -9]);
        }
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.renderLines();
        this.renderOrigin();
    }

    switch() {
        Scene.removeObject('line');
        Scene.loadObject('models/line.json', 'line', null, this.render.bind(this), join);
    }

    setDepth(layer) {
        var delta = 1 / Math.pow(2, 16);
        var total = 2;
        var range = 1 - ((total - 1) * delta);
        var near = layer * delta;
        this.gl.depthRange(near, near + range);
    }

    renderLines() {
        this.setDepth(1);
        var prg = Program.use(1);
        console.log(prg)
        var attrs = prg.attrs;
        var unis = prg.unis;
        Scene.objects.forEach(obj => {

            transform.push();
            transform.updateMvMatrix(obj.modelMatrix);
            transform.setMatrixUniforms(prg.unis);
            transform.pop();
            var size = 4;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vbo);
            this.gl.vertexAttribPointer(attrs.aVertexPosition, 2, this.gl.FLOAT, false, 5 * size, 0);
            this.gl.enableVertexAttribArray(attrs.aVertexPosition);

            this.gl.vertexAttribPointer(attrs.aVertexNormal, 2, this.gl.FLOAT, false, 5 * size, 2 * size);
            this.gl.enableVertexAttribArray(attrs.aVertexNormal);

            this.gl.vertexAttribPointer(attrs.aVertexIndex, 1, this.gl.FLOAT, false, 5 * size, 4 * size);
            this.gl.enableVertexAttribArray(attrs.aVertexIndex);
            this.gl.uniform3f(unis.uColor, 1, 0, 0);
            this.gl.uniform1f(unis.uLineWidth, obj.lineWidth);
            this.gl.uniform1f(unis.uResoluteion, this.canvas.width, this.canvas.height);

            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, obj.vertices.length / 5);

            if(withLines) {
                this.setDepth(0);
                this.gl.uniform3f(unis.uColor, 0, 0, 1);
                this.gl.lineWidth(1);
                this.gl.drawArrays(this.gl.LINE_STRIP, 0, obj.vertices.length / 5);
            }

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

        });
    }
    renderOrigin() {
        this.setDepth(0);
        var prg = Program.use(2);
        console.log(prg);
        var attrs = prg.attrs;
        Scene.objects.forEach(obj => {

            transform.push();
            transform.updateMvMatrix(obj.modelMatrix);
            transform.setMatrixUniforms(prg.unis);
            transform.pop();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.originvbo);
            this.gl.vertexAttribPointer(attrs.aVertexPosition, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(attrs.aVertexPosition);

            this.gl.lineWidth(10);

            this.gl.drawArrays(this.gl.LINE_STRIP, 0, obj.originVertices.length / 2);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

        });
    }
}

var app = new App(document.getElementById('the-canvas'));

document.getElementById('render').onclick = function() {
    withLines = false;
    app.render();
}
document.getElementById('render-with-lines').onclick = function() {
    withLines = true;
    app.render();
}
document.getElementById('miter').onclick = function() {
    join = 'miter';
    app.switch();
}
document.getElementById('bevel').onclick = function() {
    join = 'bevel';
    app.switch();
}
document.getElementById('round').onclick = function() {
    join = 'round';
    app.switch();
}
