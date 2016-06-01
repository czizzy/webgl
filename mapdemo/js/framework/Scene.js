var Scene = {
    objects: [],
    init: function(gl) {
        this.gl = gl;
    },
    loadObject: function(filename, alias, attributes, callback) {
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
                    Scene.addObject(o,attributes,callback);
                }
            }
        };
        request.send();
        
    },
    buildLineVertices: function(vertices) {
        var points = [];
        for(var i = 0; i < vertices.length; i++) {
            if(i % 2 === 0) {
                points.push([vertices[i]]);
            } else {
                points[points.length - 1].push(vertices[i]);
            }
        }
        var newVertices = [];
        for(var i = 0; i < points.length; i++) {
            if(i === 0) {
                newVertices = newVertices.concat(points[i]);
                var dx = points[i + 1][0] - points[i][0];
                var dy = points[i + 1][1] - points[i][1];
                newVertices = newVertices.concat([dy, -dx]);
                newVertices.push(0);
                newVertices = newVertices.concat(points[i + 1]);
                // var dx = points[i + 1][0] - points[i][0];
                // var dy = points[i + 1][1] - points[i][1];
                newVertices = newVertices.concat([dy, -dx]);
                newVertices.push(1);
            } else if(i === points.length - 1) {
                var dx = points[i - 1][0] - points[i][0];
                var dy = points[i - 1][1] - points[i][1];
                newVertices = newVertices.concat(points[i - 1]);
                newVertices = newVertices.concat([dy, -dx]);
                newVertices.push(2);


                newVertices = newVertices.concat(points[i]);
                newVertices = newVertices.concat([dy, -dx]);
                newVertices.push(3);
            } else {
                var dx = points[i - 1][0] - points[i][0];
                var dy = points[i - 1][1] - points[i][1];
                newVertices = newVertices.concat(points[i - 1]);
                newVertices = newVertices.concat([dy, -dx]);
                newVertices.push(2);
                newVertices = newVertices.concat(points[i]);
                newVertices = newVertices.concat([dy, -dx]);
                newVertices.push(3);

                var dx = points[i + 1][0] - points[i][0];
                var dy = points[i + 1][1] - points[i][1];
                newVertices = newVertices.concat(points[i]);
                newVertices = newVertices.concat([dy, -dx]);
                newVertices.push(0);
                newVertices = newVertices.concat(points[i + 1]);
                newVertices = newVertices.concat([dy, -dx]);
                newVertices.push(1);
                
            }
        }
        console.log(newVertices)
        return newVertices;
    },

    addObject: function(object, attributes, callback) {
        var gl = this.gl;
        var vertexBufferObject = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBufferObject);
        object.vertices = this.buildLineVertices(object.vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Uint8Array(object.vertices), this.gl.STATIC_DRAW);

        object.vbo = vertexBufferObject;

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
