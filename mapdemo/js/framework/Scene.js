var Scene = {
    objects: [],
    init: function(gl) {
        this.gl = gl;
    },
    loadObject: function(filename, alias, attributes, callback, join, cap) {
        if(!join) {
            join = 'miter';
        }
        if(!cap) {
             cap = 'butt';
        }
        var request = new XMLHttpRequest();
        console.info('Requesting ' + filename);
        request.open("GET",filename);
    
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if(request.status == 404) {
                    console.info(filename + ' does not exist');
                }
                else {
                    var o = JSON.parse(request.responseText);
                    if (alias != null){
                        o.alias = alias;
                    }
                    o.remote = true;
                    Scene.addObject(o,attributes,callback, join, cap);
                }
            }
        };
        request.send();
        
    },

    addObject: function(object, attributes, callback, join, cap) {
        var gl = this.gl;
        object.originvbos = [];
        for (var i = 0; i < object.originVertices.length; i++) {
            object.originvbos.push(this.gl.createBuffer());
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.originvbos[i]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.originVertices[i]), this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);
        }

        object.vbo = this.gl.createBuffer();
        object.ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.vbo);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.ibo);
        var vertices = [];
        var indices = [];
        var count = -1;
        for (var i = 0; i < object.originVertices.length; i++) {
            // var data = lineVertexUtil.dashLine(object.originVertices[i], join, cap, count, 0, vertices, indices);
            var data = lineVertexUtil.solidLine(object.originVertices[i], join, cap, count, vertices, indices);

            count = data.count;
        }
        object.vertices = vertices;
        object.indices = indices;
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.vertices), this.gl.STATIC_DRAW);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);


        object.modelMatrix = mat4.create();

        this.objects.push(object);

        if (callback != undefined){
	    callback(object);
	}
    },

    getObject : function(alias){
        for(var i=0, max = this.objects.length; i < max; i++){
            if (alias == this.objects[i].alias) return this.objects[i];
        }
        return null;
    },

	removeObject: function(objectName){
		var o = this.getObject(objectName);
		var idx = this.objects.indexOf(o);
		this.objects.splice(idx,1);
	}
};
