class App extends WebGLApp {
    constructor(canvas) {
        super(canvas);
    }

    configure() {
        this.gl.clearColor(0.2,0.2,0.2, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);

        Program.init(this.gl);

        var camera = new Camera();
        camera.goHome([0, 0, 5]);

        transform.init(this.gl, this.canvas, camera);
    }

    loadScene() {
        Scene.init(this.gl);
        Scene.loadObject('models/line.json', 'line', null);
    }

    render() {
        //init Program
        var line = Scene.getObject('line');
        if(line) {
            mat4.fromTranslation(line.modelMatrix, [0, 0, -9]);
        }
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.renderOrigin();
        this.renderLines();
    }

    renderLines() {
	    var attributeList = [
            "aVertexPosition",
			"aVertexNormal",
			"aVertexColor",
            "aVertexIndex"
        ];

	    var uniformList = [
            "uPMatrix", 
			"uMVMatrix", 
			"uNMatrix",
            "aLineWidth"
		];
        Program.load(1, attributeList, uniformList);
        Scene.objects.forEach(obj => {

            transform.push();
            transform.updateMvMatrix(obj.modelMatrix);
            transform.setMatrixUniforms();
            transform.pop();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vbo);
            this.gl.vertexAttribPointer(Program.aVertexPosition, 2, this.gl.BYTE, false, 5 * 1, 0);
            this.gl.enableVertexAttribArray(Program.aVertexPosition);

            this.gl.vertexAttribPointer(Program.aVertexNormal, 2, this.gl.BYTE, false, 5 * 1, 2);
            this.gl.enableVertexAttribArray(Program.aVertexNormal);

            this.gl.vertexAttribPointer(Program.aVertexIndex, 1, this.gl.BYTE, false, 5 * 1, 4);
            this.gl.enableVertexAttribArray(Program.aVertexIndex);

			// this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.nbo);
            // this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.ibo);
            // this.gl.drawElements(this.gl.TRIANGLES, obj.indices.length, this.gl.UNSIGNED_SHORT, 0);
            // this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, obj.vertices.length / 5);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, obj.vertices.length / 5);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

        });
    }
    renderOrigin() {
	    var attributeList = [
            "aVertexPosition"
        ];

	    var uniformList = [
            "uPMatrix", 
			"uMVMatrix", 
			"uNMatrix"
		];
        Program.load(2, attributeList, uniformList);
        Scene.objects.forEach(obj => {

            transform.push();
            transform.updateMvMatrix(obj.modelMatrix);
            transform.setMatrixUniforms();
            transform.pop();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vbo);
            this.gl.vertexAttribPointer(Program.aVertexPosition, 2, this.gl.BYTE, false, 5 * 1, 0);
            this.gl.enableVertexAttribArray(Program.aVertexPosition);

            this.gl.drawArrays(this.gl.LINE_STRIP, 0, obj.vertices.length / 5);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

        });
    }
}

var app = new App(document.getElementById('the-canvas'));

