var Scene = {
    objects: [],
    init: function(gl) {
        this.gl = gl;
    },
    loadObject: function(filename, alias, attributes, callback, type) {
        if(!type) {
            type = 'miter';
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
                    Scene.addObject(o,attributes,callback, type);
                }
            }
        };
        request.send();
        
    },
    calcNormal: function(vector, index) {
        var normal;
        if(index === 0 || index === 2) {
            normal = [-vector[1], vector[0]];
        } else {
            normal = [vector[1], -vector[0]];
        }
        return normal;
    },

    calcMiter: function(tangent, normal) {
        var cos = vec2.dot(normal, [-tangent[1], tangent[0]]);
        var miter = 1 / cos;
        return [-tangent[1] * miter, tangent[0] * miter];
    },

    useNormal: function(type, index, vectors, vIndex) {
        if(type === 'miter') {
            if(index === 0 || index === 1) {
                if(vIndex === 0) {
                    return true;
                }
            } else {
                if(vIndex === vectors.length - 1) {
                    return true;
                }
            }
        }
        if(type === 'bevel') {
            if(index === 0 || index === 1) {
                if(vIndex === 0) {
                    return true;
                }
            } else {
                if(vIndex === vectors.length - 1) {
                    return true;
                }
            }
        }
        return false;
    },

    calcOffset: function(vector, index, vectors, vIndex, type) {
        var normal = this.calcNormal(vector, index);
        var useNormal = this.useNormal(type, index, vectors, vIndex);
        if(useNormal) {
            return normal;
        }
        var vector1, vector2;
        if (index === 0 || index === 1) {
            vector1 = vectors[vIndex - 1];
            vector2 = vector;
        } else {
            vector1 = vector;
            vector2 = vectors[vIndex + 1];
        }
        var tangent = [];
        vec2.normalize(tangent, [vector1[0] + vector2[0], vector1[1] + vector2[1]]);
        var miter = this.calcMiter(tangent, normal);
        if(type === 'bevel') {
            var cos = vec2.dot(miter, vector);
            if((index === 0 || index === 1) && cos < 0) {
                return normal;
            } else if((index ===2 || index === 3) && cos > 0) {
                return normal;
            }
            console.log('cos', cos);
        }
        return miter;
    },

    buildLineVertices: function(vertices, type) {
        var points = [];
        for(var i = 0; i < vertices.length; i++) {
            if(i % 2 === 0) {
                points.push([vertices[i]]);
            } else {
                points[points.length - 1].push(vertices[i]);
            }
        }
        var vectors = [];
        for(var i = 0; i < points.length; i++) {
            if(i !== points.length - 1) {
                var vector = [points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]];
                var normalVector = [];
                vec2.normalize(normalVector, vector);
                vectors.push([normalVector[0], normalVector[1]]);
            }
        }
        var newVertices = [];
        console.log(type);
        if(type === 'miter') {
            newVertices = this.buildMiterVertices(newVertices, vectors, points);
        } else if(type === 'bevel') {
            newVertices = this.buildBevelVertices(newVertices, vectors, points);
        }
        return newVertices;
    },

    buildMiterVertices: function(newVertices, vectors, points) {
        for(var i = 0; i < vectors.length; i++) {
            if (i === 0) {
                newVertices = newVertices.concat(points[i]);
                newVertices = newVertices.concat(this.calcOffset(vectors[i], 0, vectors, i, 'miter')); // normal
                newVertices.push(0);

                newVertices = newVertices.concat(points[i]);
                newVertices = newVertices.concat(this.calcOffset(vectors[i], 1, vectors, i, 'miter')); // normal
                newVertices.push(1);
            }
            newVertices = newVertices.concat(points[i + 1]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 2, vectors, i, 'miter')); // normal
            newVertices.push(2);

            newVertices = newVertices.concat(points[i + 1]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 3, vectors, i, 'miter')); // normal
            newVertices.push(3);
        }
        return newVertices;
    },

    buildBevelVertices: function(newVertices, vectors, points) {
        for(var i = 0; i < vectors.length; i++) {
            newVertices = newVertices.concat(points[i]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 0, vectors, i, 'bevel')); // normal
            newVertices.push(0);

            newVertices = newVertices.concat(points[i]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 1, vectors, i, 'bevel')); // normal
            newVertices.push(1);

            newVertices = newVertices.concat(points[i + 1]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 2, vectors, i, 'bevel')); // normal
            newVertices.push(2);

            newVertices = newVertices.concat(points[i + 1]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 3, vectors, i, 'bevel')); // normal
            newVertices.push(3);
        }
        return newVertices;
    },

    addObject: function(object, attributes, callback, type) {
        var gl = this.gl;
        object.originvbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.originvbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.originVertices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);

        object.vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.vbo);
        object.vertices = this.buildLineVertices(object.originVertices, type);
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
