var Program = {
    cache: {},
    init: function(gl) {
        this.gl = gl;
    },

    load: function(id, attributeList, uniformList) {
        var fragmentShader = this.getShader('shader-fs-' + id);
        var vertexShader = this.getShader('shader-vs-' + id);
        var prg = this.gl.createProgram();
        this.gl.attachShader(prg, vertexShader);
        this.gl.attachShader(prg, fragmentShader);
        this.gl.bindAttribLocation(prg, 0 , "aVertexPosition");
        this.gl.linkProgram(prg);
        if (!this.gl.getProgramParameter(prg, this.gl.LINK_STATUS)) {
            console.log("Could not initialise shaders");
        }
        this.gl.useProgram(prg);
	    var attrs = this.setAttributeLocations(attributeList, prg);
	    var unis = this.setUniformLocations(uniformList, prg);
        this.cache[id] = {
            program: prg,
            unis: unis,
            attrs: attrs
        };
        return this.cache[id];
    },

    use: function(id) {
        this.gl.useProgram(this.cache[id].program);
        return this.cache[id];
    },

    getShader: function(id) {
        var script = document.getElementById(id);
        if (!script) {
            return null;
        }
        var str = "";
        var k = script.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }
        var shader, message;
        if (script.type == "x-shader/x-fragment") {
            shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            message = 'Fragment Shader';
        } else if (script.type == "x-shader/x-vertex") {
            shader = this.gl.createShader(this.gl.VERTEX_SHADER);
            message = 'Vertex Shader';
        } else {
            return null;
        }
        this.gl.shaderSource(shader, str);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.log('There was a problem with the ' + message +':\n\n'+ this.gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    },

    setAttributeLocations: function(attrList, prg) {
        var me = this;
        var attrs = {};
        attrList.forEach(function(attr) {
            attrs[attr] = me.gl.getAttribLocation(prg, attr);
        });
        return attrs;
    },

    setUniformLocations: function(uniList, prg) {
        var me = this;
        var unis = {};
        uniList.forEach(function(uni) {
            unis[uni] = me.gl.getUniformLocation(prg, uni);
        });
        return unis;
    }

};
