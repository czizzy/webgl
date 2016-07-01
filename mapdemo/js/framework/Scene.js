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
    calcNormal: function(vector, index) {
        var normal;
        if(index === 0 || index === 2) {
            normal = [-vector[1], vector[0]];
        } else if(index === 3 || index === 1){
            normal = [vector[1], -vector[0]];
        } else {
            normal = [-vector[1], vector[0]];
        }
        return normal;
    },

    calcMiter: function(tangent, normal) {
        var cos = vec2.dot(normal, [-tangent[1], tangent[0]]);
        var miter = 1 / cos;
        return [-tangent[1] * miter, tangent[0] * miter];
    },

    useNormal: function(type, tangent, normal, index) {
        if(type === 'bevel') {
            var cos = vec2.dot(tangent, normal);
            if((index === 0 || index === 1) && cos > 0) {
                return true;
            } else if((index ===2 || index === 3) && cos < 0) {
                return true;
            }
        }
        if(type === 'round') {
            var cos = vec2.dot(tangent, normal);
            if((index === 0 || index === 1) && cos > 0) {
                return true;
            } else if((index ===2 || index === 3) && cos < 0) {
                return true;
            }
        }
        return false;
    },

    calcOffset: function(vector, index, vectors, vIndex, join, cap, isPlus) {
        var normal = this.calcNormal(vector, index);
        var vector1, vector2;
        if (index === 0 || index === 1) {
            vector1 = vectors[vIndex - 1];
            vector2 = vector;
        } else {
            vector1 = vector;
            vector2 = vectors[vIndex + 1];
        }
        if (!vector1 || !vector2) { // 第一个点或最后一个点
            if (cap === 'butt') {
                normal.push(index);
                return normal;
            } else {
                if (isPlus) {
                    if (!vector1) {
                        normal = [normal[0] - vector[0], normal[1] - vector[1]];
                    } else {
                        normal = [normal[0] + vector[0], normal[1] + vector[1]];
                    }
                    console.log(normal);
                    if (cap === 'round') {
                        normal.push(4);
                    } else {
                        console.log(index);
                        normal.push(index);
                    }
                } else {
                    normal.push(index);
                    return normal;
                }
                return normal;
            }
        }
        var tangent = [];
        vec2.normalize(tangent, [vector1[0] + vector2[0], vector1[1] + vector2[1]]);
        var useNormal = this.useNormal(join, tangent, normal, index);
        if(useNormal) {
            normal.push(index);
            return normal;
        }

        var miter = this.calcMiter(tangent, normal);

        if (index === 4) { // round plus dot
            var normalMiter = [];
            vec2.normalize(normalMiter, miter);
            var normalVector = [];
            vec2.normalize(normalVector, vector);
            var cos = vec2.dot(normalMiter, normalVector);
            if (cos < 0) {
                miter = vec2.negate(miter, miter);
            }
        } else {
            index = 5; // round special point
        }
        miter.push(index);
        return miter;
    },

    buildLineVertices: function(vertices, join, cap) {
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
        newVertices = this.buildVertices(newVertices, vectors, points, join, cap);
        return newVertices;
    },

    buildVertices: function (newVertices, vectors, points, join, cap) {
        newVertices = newVertices.concat(points[0]);
        newVertices = newVertices.concat(this.calcOffset(vectors[0], 0, vectors, -1, join, cap, true)); // normal
        newVertices = newVertices.concat(points[0]);
        newVertices = newVertices.concat(this.calcOffset(vectors[0], 1, vectors, -1, join, cap, true)); // normal


        for(var i = 0; i < vectors.length; i++) {
            if (join !== 'miter' || i === 0) {
                newVertices = newVertices.concat(points[i]);
                newVertices = newVertices.concat(this.calcOffset(vectors[i], 0, vectors, i, join, cap)); // normal

                newVertices = newVertices.concat(points[i]);
                newVertices = newVertices.concat(this.calcOffset(vectors[i], 1, vectors, i, join, cap)); // normal
            }

            newVertices = newVertices.concat(points[i + 1]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 2, vectors, i, join, cap)); // normal

            newVertices = newVertices.concat(points[i + 1]);
            newVertices = newVertices.concat(this.calcOffset(vectors[i], 3, vectors, i, join, cap)); // normal

            if (join === 'round' && i !== vectors.length - 1) {
                newVertices = newVertices.concat(points[i + 1]);
                newVertices = newVertices.concat(this.calcOffset(vectors[i], 4, vectors, i, join, cap)); // normal
            }
        }
        newVertices = newVertices.concat(points[points.length - 1]);
        newVertices = newVertices.concat(this.calcOffset(vectors[vectors.length - 1], 2, vectors, vectors.length, join, cap, true)); // normal
        newVertices = newVertices.concat(points[points.length - 1]);
        newVertices = newVertices.concat(this.calcOffset(vectors[vectors.length - 1], 3, vectors, vectors.length, join, cap, true)); // normal
        return newVertices;

    },

    addObject: function(object, attributes, callback, join, cap) {
        var gl = this.gl;
        object.originvbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.originvbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.originVertices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);

        object.vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.vbo);
        object.vertices = this.buildLineVertices(object.originVertices, join, cap);
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
