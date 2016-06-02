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
    calcOffset: function(vector, index, vectors, vIndex) {
        var normal;
        if(index === 0 || index === 1) {
            normal = [vector[1], -vector[0]];
        } else {
            normal = [-vector[1], vector[0]];
        }
        if(index === 0) {
            if(vIndex === 0) {
                return normal;
            } else {
                var tangent = [];
                vec2.normalize(tangent, [vectors[vIndex - 1][0] + vectors[vIndex][0], vectors[vIndex - 1][1] + vectors[vIndex][1]]);
                console.log(0, tangent);
                return this.calcMiter(tangent, normal, true);
            }
        } else if (index === 1) {
            if(vIndex === vectors.length - 1) {
                return normal;
            } else {
                var tangent = [];
                vec2.normalize(tangent, [vectors[vIndex][0] + vectors[vIndex + 1][0], vectors[vIndex][1] + vectors[vIndex + 1][1]]);
                return this.calcMiter(tangent, normal, true);
            }
        } else if (index === 2) {
            if(vIndex === 0) {
                return normal;
            } else {
                var tangent = [];
                vec2.normalize(tangent, [vectors[vIndex - 1][0] + vectors[vIndex][0], vectors[vIndex - 1][1] + vectors[vIndex][1]]);
                return this.calcMiter(tangent, normal);
            }
        } else {
            if(vIndex === vectors.length - 1) {
                return normal;
            } else {
                var tangent = [];
                vec2.normalize(tangent, [vectors[vIndex][0] + vectors[vIndex + 1][0], vectors[vIndex][1] + vectors[vIndex + 1][1]]);
                return this.calcMiter(tangent, normal);
            }
        }
    },

    calcMiter: function(tangent, normal, flag) {
        var cos = vec2.dot(normal, [-tangent[1], tangent[0]]);
        console.log(normal);
        console.log(cos);
        if((cos > 0 && !flag) || (cos < 0 && flag)) {
            var miter = 1 / cos;
            console.log(cos, miter);
            return [-tangent[1] * miter, tangent[0] * miter];
        } else {
            return normal;
        }
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
        console.log(points)
        var vectors = [];
        for(var i = 0; i < points.length; i++) {
            if(i !== points.length - 1) {
                var vector = [points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]];
                var normalVector = [];
                vec2.normalize(normalVector, vector);
                vectors.push([normalVector[0], normalVector[1]]);
            }
        }
        console.log('vectors', vectors);
        var newVertices = [];
        for(var i = 0; i < vectors.length; i++) {
            newVertices = newVertices.concat(points[i]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 0, vectors, i)); // normal
            newVertices.push(0);

            newVertices = newVertices.concat(points[i + 1]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 1, vectors, i)); // normal
            newVertices.push(1);

            newVertices = newVertices.concat(points[i]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 2, vectors, i)); // normal
            newVertices.push(2);

            newVertices = newVertices.concat(points[i + 1]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 3, vectors, i)); // normal
            newVertices.push(3);
        }
        console.log(newVertices);
        return newVertices;
    },

    addObject: function(object, attributes, callback) {
        var gl = this.gl;
        object.originvbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.originvbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Uint8Array(object.originVertices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);

        object.vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.vbo);
        object.vertices = this.buildLineVertices(object.originVertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.vertices), this.gl.STATIC_DRAW);

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
