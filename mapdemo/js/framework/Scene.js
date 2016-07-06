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
        if(index === 0 || index === 2 || index === 4 || index == 6) {
            normal = [-vector[1], vector[0]];
        } else if(index === 3 || index === 1 || index === 5 || index == 7){
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

    // index: 0, 1, 2, 3 四边形四个点
    // index 4, 5 linecap 开始增加点
    // index 6, 7 linecap 结束增加点
    // index 8 linjoin round 增加点
    
    
    calcOffset: function(vector, index, otherVector, join, cap) {
        console.log('a');
        var normal = this.calcNormal(vector, index);
        var vector1, vector2;
        if (index === 0 || index === 1 || index == 4 || index == 5) {
            vector1 = otherVector;
            vector2 = vector;
        } else {
            vector1 = vector;
            vector2 = otherVector;
        }
        if (index % 2 === 0) {
            var direction = 1;
        } else {
            direction = -1;
        }
        if (!vector1 || !vector2) { // 第一个点或最后一个点
            if (cap === 'butt') {
                normal.push(0);
            } else {
                if (index === 4 || index === 5 || index === 6 || index == 7) {
                    if (!vector1) {
                        normal = [normal[0] - vector[0], normal[1] - vector[1]];
                    } else {
                        normal = [normal[0] + vector[0], normal[1] + vector[1]];
                    }
                    if (cap === 'round') {
                        normal.push(1);
                    } else {
                        normal.push(0);
                    }
                } else {
                    normal.push(0);
                }
            }
            normal.push(direction);
            return normal;
        }
        var tangent = [];
        vec2.normalize(tangent, [vector1[0] + vector2[0], vector1[1] + vector2[1]]);
        var useNormal = this.useNormal(join, tangent, normal, index);
        if(useNormal) {
            normal.push(0);
            normal.push(direction);
            return normal;
        }

        var miter = this.calcMiter(tangent, normal);

        if (index === 8) { // round plus dot
            var normalMiter = [];
            vec2.normalize(normalMiter, miter);
            var normalVector = [];
            vec2.normalize(normalVector, vector);
            var cos = vec2.dot(normalMiter, normalVector);
            if (cos < 0) {
                miter = vec2.negate(miter, miter);
                direction = -direction;
            }
            index = 1;
        } else {
            index = -1; // round special point
        }
        miter.push(index);
        miter.push(direction);
        return miter;
    },

    buildIndex: function (index) {
        if (index % 2 === 0) {
            return [index - 2, index - 1, index];
        } else {
            return [index - 1, index - 2, index];
        }
    },


    buildLineVertices: function(vertices, join, cap, count) {
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
                if (vector[0] === 0 && vector[1] === 0) {
                    normalVector = [0, 0];
                } else {
                    vec2.normalize(normalVector, vector);
                }
                vectors.push([normalVector[0], normalVector[1]]);
            }
        }
        return this.buildVertices(vectors, points, join, cap, count);
    },

    buildVertices: function (vectors, points, join, cap, count) {
        var vertices = [];
        var indices = [];
        
        vertices = vertices.concat(points[0]);
        vertices = vertices.concat(this.calcOffset(vectors[0], 4, undefined, join, cap)); // normal
        count++;

        vertices = vertices.concat(points[0]);
        vertices = vertices.concat(this.calcOffset(vectors[0], 5, undefined, join, cap)); // normal
        count++;

        for(var i = 0; i < vectors.length; i++) {
            if (join !== 'miter' || i === 0) {
                vertices = vertices.concat(points[i]);
                vertices = vertices.concat(this.calcOffset(vectors[i], 0, vectors[i - 1], join, cap)); // normal
                indices = indices.concat(this.buildIndex(++count));

                vertices = vertices.concat(points[i]);
                vertices = vertices.concat(this.calcOffset(vectors[i], 1, vectors[i - 1], join, cap)); // normal
                indices = indices.concat(this.buildIndex(++count));

            }

            vertices = vertices.concat(points[i + 1]);
            vertices = vertices.concat(this.calcOffset(vectors[i], 2, vectors[i + 1], join, cap)); // normal
            indices = indices.concat(this.buildIndex(++count));

            vertices = vertices.concat(points[i + 1]);
            vertices = vertices.concat(this.calcOffset(vectors[i], 3, vectors[i + 1], join, cap)); // normal
            indices = indices.concat(this.buildIndex(++count));

            if (join === 'round' && i !== vectors.length - 1) {
                vertices = vertices.concat(points[i + 1]);
                vertices = vertices.concat(this.calcOffset(vectors[i], 8, vectors[i + 1], join, cap)); // normal
                indices = indices.concat(this.buildIndex(++count));
            }
        }
        vertices = vertices.concat(points[points.length - 1]);
        vertices = vertices.concat(this.calcOffset(vectors[vectors.length - 1], 6, undefined, join, cap)); // normal
        indices = indices.concat(this.buildIndex(++count));

        vertices = vertices.concat(points[points.length - 1]);
        vertices = vertices.concat(this.calcOffset(vectors[vectors.length - 1], 7, undefined, join, cap)); // normal
        indices = indices.concat(this.buildIndex(++count));

        return {
            vertices: vertices,
            indices: indices,
            count: count
        };
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

        console.log(object);
        object.vbo = this.gl.createBuffer();
        object.ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.vbo);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.ibo);
        var vertices = [];
        var indices = [];
        var count = -1;
        for (var i = 0; i < object.originVertices.length; i++) {
            var data = this.buildLineVertices(object.originVertices[i], join, cap, count);
            count = data.count;
            vertices = vertices.concat(data.vertices);
            indices = indices.concat(data.indices);
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
