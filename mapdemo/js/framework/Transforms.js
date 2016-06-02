var transform = {
    stack: [],
    mvMatrix: mat4.create(),
    nMatrix: mat4.create(),
    pMatrix: mat4.create(),
    init: function(gl, canvas, camera) {
        this.gl = gl;
        this.canvas = canvas;
        this.camera = camera;
        mat4.identity(this.mvMatrix);
        mat4.identity(this.pMatrix);
        // this.calculateModelView();
        // this.calculatePerspective();
        this.mvMatrix = camera.getViewTransform();
        this.calculateNormal();
        this.calculatePerspective();

    },
    updateMvMatrix: function(matrix) {
        mat4.multiply(this.mvMatrix, matrix, this.mvMatrix);
        
    },

    setMatrixUniforms: function(unis) {
        this.calculateNormal();

        this.gl.uniformMatrix4fv(unis.uMVMatrix, false, this.mvMatrix);
        this.gl.uniformMatrix4fv(unis.uNMatrix, false, this.nMatrix);
        this.gl.uniformMatrix4fv(unis.uPMatrix, false, this.pMatrix);
    },

    calculatePerspective: function() {
        mat4.perspective(this.pMatrix, 30 / 180 * Math.PI, this.canvas.width / this.canvas.height, 0.1, 10000);
    },

    calculateNormal: function(){
        mat4.identity(this.nMatrix);
        mat4.copy(this.nMatrix, this.mvMatrix);
        mat4.invert(this.nMatrix, this.nMatrix);
        mat4.transpose(this.nMatrix, this.nMatrix);
    },

    push: function() {
        this.mvMatrix = this.camera.getViewTransform();

        var temp = mat4.create();
        mat4.copy(temp, this.mvMatrix);
        this.stack.push(temp);
    },
    pop: function() {
        this.mvMatrix = this.stack.pop();
    }
};
