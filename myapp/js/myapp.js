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
        //init Program
	    var attributeList = [
            "aVertexPosition",
			"aVertexNormal",
			"aVertexColor"
        ];

	    var uniformList = [
            "uPMatrix", 
			"uMVMatrix", 
			"uNMatrix",
            // "uLightPosition",
            // "uWireframe",
            // "uLa",
            // "uLd",
            // "uLs",
            "uKa",
            "uKd",
            "uKs",
            "uNs",
            // "d",
            // "illum",
            // "uTranslateLights"
		];
        Program.load(attributeList, uniformList);
    }

    loadScene() {
        Scene.init(this.gl);
        Scene.loadObject('models/sphere.json', 'sphere');
        Scene.loadObject('models/wall.json', 'wall');
    }

    render() {
        var sphere = Scene.getObject('sphere');
        if(sphere) {
            mat4.fromTranslation(sphere.modelMatrix, [0, 0, -5]);
        }
        var wall = Scene.getObject('wall');
        if(wall) {
            mat4.fromTranslation(wall.modelMatrix, [0, 0, -9]);
        }
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        Scene.objects.forEach(obj => {

            transform.push();
            transform.updateMvMatrix(obj.modelMatrix);
            transform.setMatrixUniforms();
            transform.pop();

            this.gl.uniform3fv(Program.uKa, obj.Ka);
            this.gl.uniform3fv(Program.uKd, obj.Kd);
            this.gl.uniform3fv(Program.uKs, obj.Ks);
            this.gl.uniform1f(Program.uNs, obj.Ns);


            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vbo);
            this.gl.vertexAttribPointer(Program.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(Program.aVertexPosition);

			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.nbo);
			this.gl.vertexAttribPointer(Program.aVertexNormal, 3, this.gl.FLOAT, false, 0, 0);
			this.gl.enableVertexAttribArray(Program.aVertexNormal);

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.ibo);
            this.gl.drawElements(this.gl.TRIANGLES, obj.indices.length, this.gl.UNSIGNED_SHORT, 0);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

        });

    }
}

var app = new App(document.getElementById('the-canvas'));

