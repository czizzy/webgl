class Camera {
    constructor() {
        this.type = 'orbit';
        this.position = vec3.create();
        this.matrix = mat4.create();
        this.azimuth = 0;
        this.elevation = 0;
        this.bindEvents();
    }

    goHome(home) {
        if(home) {
            this.home = home;
        }
        this.azimuth = 0;
        this.elevation = 0;
        this.setPosition(this.home);
    }

    setType(type) {
        this.type = type;
        this.goHome();
    }

    setPosition(p) {
        vec3.copy(this.position, p);
        this.update();
    }

    update() {
        mat4.identity(this.matrix);
        if (this.type === 'orbit') {
            mat4.translate(this.matrix, this.matrix, this.position);
            mat4.rotateY(this.matrix, this.matrix, this.azimuth / 180 * Math.PI);
            mat4.rotateX(this.matrix, this.matrix, this.elevation / 180 * Math.PI);
        } else {
            // mat4.rotateX(this.matrix, this.matrix, this.elevation / 180 * Math.PI);
            mat4.rotateY(this.matrix, this.matrix, this.azimuth / 180 * Math.PI);
            mat4.translate(this.matrix, this.matrix, this.position);
            
        }
    }

    getViewTransform() {
        var m = mat4.create();
        mat4.invert(m, this.matrix);
        return m;
    }

    bindEvents() {
        window.addEventListener('keydown', e => {
            if(this.type === 'orbit') {
                if(e.keyCode === 37) { // left
                    this.azimuth++;
                } else if(e.keyCode === 39) { // right
                    this.azimuth--;
                } else if(e.keyCode === 38) { // up
                    this.elevation++;
                } else if(e.keyCode === 40) { // down
                    this.elevation--;
                }
            } else {
                if(e.keyCode === 37) { // left
                    this.azimuth--;
                } else if(e.keyCode === 39) { // right
                    this.azimuth++;
                }
                
            }
            this.update();
        });
        var me = this;
        // document.getElementById('track').addEventListener('change', function() {
        //     if(this.checked) {
        //         me.setType('track');
        //     }
        // });
        // document.getElementById('orbit').addEventListener('change', function() {
        //     if(this.checked) {
        //         me.setType('orbit');
        //     }
        // });

    }

}
