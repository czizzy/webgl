class WebGLApp {

    constructor(canvas) {
        if (!canvas) {
            throw new Exception('canvas');
        }
        this.canvas = canvas;

        this.gl = canvas.getContext('webgl');

        this.configure();

        this.loadScene();

        this.renderLoop();
    }

    renderLoop() {
        this.render();
        // requestAnimationFrame(this.renderLoop.bind(this));
    }

}
