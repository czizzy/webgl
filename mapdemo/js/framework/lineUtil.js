/**
 * @file 构建线三角形
 */

// 从glmatrix.js中拷贝过来
var vec2Ext = {};
var lineVertexUtil = {};
vec2Ext.scaleAndAdd = function (out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};
vec2Ext.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

vec2Ext.length = function (a) {
    var x = a[0];
    var y = a[1];
    return Math.sqrt(x * x + y * y);
};

vec2Ext.normalize = function (out, a) {
    var x = a[0];
    var y = a[1];
    var len = x * x + y * y;
    if (len > 0) {
        // TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

vec2Ext.negate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

vec2Ext.cross = function (out, a, b) {
    var ax = a[0];
    var ay = a[1];
    var az = a[2];
    var bx = b[0];
    var by = b[1];
    var bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

var solidUtil = {

    solidLine: function (points, join, cap, count, outVertex, outIndices) {
        var vectors = [];
        for (var i = 0; i < points.length; i++) {
            if (i !== points.length - 1) {
                var vector = [points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]];
                var normalVector = [];
                if (vector[0] === 0 && vector[1] === 0) {
                    normalVector = [0, 0];
                } else {
                    vec2Ext.normalize(normalVector, vector);
                }
                vectors.push([normalVector[0], normalVector[1]]);
            }
        }
        return this.buildVertices(vectors, points, join, cap, count, outVertex, outIndices);
    },

    calcFlag: function (index, cap, join, useNormal) {
        if (cap === 'round' && (index === 4 || index === 5 || index === 6 || index === 7)) {
            return 1;
        }
        if (index === 8) {
            return 1;
        }
        if (join === 'round' && !useNormal) {
            return -1;
        }
        return 0;
    },

    useNormal: function (join, tangent, normal, index) {
        var cos = vec2Ext.dot(tangent, normal);
        if (join === 'bevel' || join === 'round') {
            if ((index === 0 || index === 1) && cos > 0) {
                return true;
            } else if ((index === 2 || index === 3) && cos < 0) {
                return true;
            }
        }
        if ((index === 0 || index === 1) && cos < 0) {
            return true;
        } else if ((index === 2 || index === 3) && cos > 0) {
            return true;
        }
        return false;
    },

    calcOffset: function (vector, index, otherVector, join, cap) {
        var normal = lineVertexUtil.calcNormal(vector, index);
        var offset;
        var vector1 = vector;
        var vector2 = otherVector;
        var direction = 1;
        var tangent = [];
        vec2Ext.normalize(tangent, [vector1[0] + vector2[0], vector1[1] + vector2[1]]);
        var cos = vec2Ext.dot(normal, [-tangent[1], tangent[0]]);
        if (cos === 0) {
            cos = 1;
        }
        var miter = 1 / cos;
        offset = [-tangent[1] * miter, tangent[0] * miter];
        var cos2 = vec2Ext.dot(vector, offset);
        if (cos2 < 0) {
            vec2Ext.negate(offset, offset);
        }
        return {cos2: cos2, offset: offset};
    },

    calcOffset2: function (vector, index, otherVector, join, cap) {
        var normal = lineVertexUtil.calcNormal(vector, index);
        var vector1;
        var vector2;
        var offset;
        if (index === 0 || index === 1) {
            vector1 = otherVector;
            vector2 = vector;
        } else {
            vector1 = vector;
            vector2 = otherVector;
        }
        if (!vector1 || !vector2) { // 第一个点或最后一个点
            return {useNormal: true, offset: normal};
        }
        var tangent = [];
        vec2Ext.normalize(tangent, [vector1[0] + vector2[0], vector1[1] + vector2[1]]);
        var useNormal = this.useNormal(join, tangent, normal, index);
        if (useNormal) {
            return {useNormal: true, offset: normal};
        }

        var cos = vec2Ext.dot(normal, [-tangent[1], tangent[0]]);
        if (cos === 0) {
            cos = 1;
        }
        var miter = 1 / cos;
        offset = [-tangent[1] * miter, tangent[0] * miter];
        return {useNormal: false, offset: offset};
    },

    // index: 0, 1, 2, 3 四边形四个点
    // index 4, 5 linecap 开始增加点
    // index 6, 7 linecap 结束增加点
    // index 8 linjoin round 增加点
    buildPoint: function (vertices, point, vector, cap, join, index, otherVector) {
        var direction = index % 2 === 0 ? 1 : -1;
        for (var i = 0; i < 2; i++) {
            vertices.push(point[i]);
        }
        var offset;
        var useNormal = true;
        if (index === 4 || index === 5 || index === 6 || index === 7) {
            offset = lineVertexUtil.calcCap(vector, index, cap);
        } else if (index === 0 || index === 1 || index === 2 || index === 3) {
            var offsetResult = this.calcOffset2(vector, index, otherVector, join, cap);
            offset = offsetResult.offset;
            useNormal = offsetResult.useNormal;
        } else if (index === 8) {
            var offsetResult = this.calcOffset(vector, index, otherVector, join, cap);
            offset = offsetResult.offset;
            var cos2 = offsetResult.cos2;
            if (cos2 < 0) {
                direction = -direction;
            }
            useNormal = offsetResult.useNormal;
        }
        for (var i = 0; i < 2; i++) {
            vertices.push(offset[i]);
        }
        vertices.push(this.calcFlag(index, cap, join, useNormal));
        vertices.push(direction);
    },

    buildVertices: function (vectors, points, join, cap, count, outVertex, outIndices) {
        var offset;
        // var vertices = [];
        // var indices = [];
        var direction;

        this.buildPoint(outVertex, points[0], vectors[0], cap, join, 4);
        count++;

        this.buildPoint(outVertex, points[0], vectors[0], cap, join, 5);
        count++;

        for (var i = 0; i < vectors.length; i++) {
            this.buildPoint(outVertex, points[i], vectors[i], cap, join, 0, vectors[i - 1]);
            lineVertexUtil.buildIndex(outIndices, ++count);

            this.buildPoint(outVertex, points[i], vectors[i], cap, join, 1, vectors[i - 1]);
            lineVertexUtil.buildIndex(outIndices, ++count);

            this.buildPoint(outVertex, points[i + 1], vectors[i], cap, join, 2, vectors[i + 1]);
            lineVertexUtil.buildIndex(outIndices, ++count);

            this.buildPoint(outVertex, points[i + 1], vectors[i], cap, join, 3, vectors[i + 1]);
            lineVertexUtil.buildIndex(outIndices, ++count);

            if (join === 'round' && i !== vectors.length - 1) {
                this.buildPoint(outVertex, points[i + 1], vectors[i], cap, join, 8, vectors[i + 1]);
                lineVertexUtil.buildIndex(outIndices, ++count);
            }
        }

        this.buildPoint(outVertex, points[points.length - 1], vectors[vectors.length - 1], cap, join, 6);
        lineVertexUtil.buildIndex(outIndices, ++count);

        this.buildPoint(outVertex, points[points.length - 1], vectors[vectors.length - 1], cap, join, 7);
        lineVertexUtil.buildIndex(outIndices, ++count);
        return {
            count: count
        };
    }
};


var dashUtil = {
    reflect: function (n, d) {
        var r = [0, 0];
        vec2Ext.scaleAndAdd(r, d, n, -2 * vec2Ext.dot(d, n));
        return r;
    },

    dashLine: function (points, join, cap, count, lengthsofar, outVertex, outIndices) {
        var vectors = [];
        var lengths = [];
        for (var i = 0; i < points.length; i++) {
            if (i !== points.length - 1) {
                var vector = [points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]];
                lengths.push(vec2Ext.length(vector));
                var normalVector = [];
                if (vector[0] === 0 && vector[1] === 0) {
                    normalVector = [0, 0];
                } else {
                    vec2Ext.normalize(normalVector, vector);
                }
                vectors.push([normalVector[0], normalVector[1]]);
            }
        }
        return this.buildVertices(vectors, points, join, cap, count, lengths, lengthsofar, outVertex, outIndices);
    },

    calcFlag: function (index, cap, join) {
        if (cap === 'round' && (index === 4 || index === 5 || index === 6 || index === 7)) {
            return 1;
        }
        if (index === 8 && join === 'round') {
            return 1;
        }
        if (join === 'round') {
            return -1;
        }

        return 0;
    },

    calcOffsetOther: function (vector, index, otherVector, join) {
        var normal = lineVertexUtil.calcNormal(vector, index);
        var offset;
        var vector1 = vector;
        var vector2 = otherVector;
        var tangent = [vector1[0] + vector2[0], vector1[1] + vector2[1]];
        offset = [-tangent[1], tangent[0]];
        var cos2 = vec2Ext.dot(vector, offset);
        if (cos2 > 0) {
            vec2Ext.negate(normal, normal);
        }
        return {cos2: cos2, offset: normal};
    },

    calcOffset8: function (vector, index, otherVector, join) {
        var normal = lineVertexUtil.calcNormal(vector, index);
        var offset;
        var vector1 = vector;
        var vector2 = otherVector;
        var tangent = [];
        vec2Ext.normalize(tangent, [vector1[0] + vector2[0], vector1[1] + vector2[1]]);
        var cos = vec2Ext.dot(normal, [-tangent[1], tangent[0]]);
        if (cos === 0) {
            cos = 1;
        }
        var miter = 1 / cos;
        offset = [-tangent[1] * miter, tangent[0] * miter];
        var cos2 = vec2Ext.dot(vector, offset);
        if (cos2 < 0) {
            vec2Ext.negate(offset, offset);
        }
        if (join === 'bevel') {
            vec2Ext.negate(offset, offset);
        }
        return {cos2: cos2, offset: offset};
    },

    calcOffset: function (vector, index, otherVector, join) {
        var normal = lineVertexUtil.calcNormal(vector, index);
        var vector1;
        var vector2;
        var offset;
        if (index === 0 || index === 1) {
            vector1 = otherVector;
            vector2 = vector;
        } else {
            vector1 = vector;
            vector2 = otherVector;
        }
        if (!vector1 || !vector2) { // 第一个点或最后一个点
            return normal;
        }
        var tangent = [];
        vec2Ext.normalize(tangent, [vector1[0] + vector2[0], vector1[1] + vector2[1]]);
        var cos = vec2Ext.dot(normal, [-tangent[1], tangent[0]]);
        if (cos === 0) {
            cos = 1;
        }
        var miter = 1 / cos;
        offset = [-tangent[1] * miter, tangent[0] * miter];
        var cos2 = vec2Ext.dot(vector, offset);
        if (index === 2 || index === 3) {
            if (cos2 > 0) {
                offset = this.reflect(normal, [-offset[0], -offset[1]]);
            }
        } else if (index === 0 || index === 1) {
            if (cos2 < 0) {
                offset = this.reflect(normal, [-offset[0], -offset[1]]);
            }
        }
        return offset;
    },

    // index: 0, 1, 2, 3 四边形四个点
    // index 4, 5 linecap 开始增加点
    // index 6, 7 linecap 结束增加点
    // index 8 linjoin round 增加点
    buildPoint: function (vertices, point, vector, cap, join, index, lengthsofar, otherVector) {
        var direction = index % 2 === 0 ? 1 : -1;
        for (var i = 0; i < 2; i++) {
            vertices.push(point[i]);
        }
        var offset;
        if (index === 4 || index === 5 || index === 6 || index === 7) {
            offset = lineVertexUtil.calcCap(vector, index, cap);
        } else if (index === 0 || index === 1 || index === 2 || index === 3) {
            offset = this.calcOffset(vector, index, otherVector, join);
        } else if (index === 8) {
            var offsetResult = this.calcOffset8(vector, index, otherVector, join);
            offset = offsetResult.offset;
            if (join === 'bevel') {
                if (offsetResult.cos2 > 0) {
                    direction = -direction;
                }
            } else {
                if (offsetResult.cos2 < 0) {
                    direction = -direction;
                }
            }
        } else {
            offsetResult = this.calcOffsetOther(vector, index, otherVector, join);
            offset = offsetResult.offset;
            if (offsetResult.cos2 > 0) {
                direction = -direction;
            }
        }
        for (var i = 0; i < 2; i++) {
            vertices.push(offset[i]);
        }
        vertices.push(this.calcFlag(index, cap, join));
        vertices.push(direction);
        vertices.push(lengthsofar);
    },

    buildVertices: function (vectors, points, join, cap, count, lengths, lengthsofar, outVertex, outIndices) {
        var offset;

        this.buildPoint(outVertex, points[0], vectors[0], cap, join, 4, lengthsofar);
        count++;

        this.buildPoint(outVertex, points[0], vectors[0], cap, join, 5, lengthsofar);
        count++;

        for (var i = 0; i < vectors.length; i++) {
            if (i !== 0) {
                if (join === 'bevel') {
                    this.buildPoint(outVertex, points[i], vectors[i], cap, join, 10, lengthsofar, vectors[i - 1]);
                    lineVertexUtil.buildIndex(outIndices, ++count);
                }
            }

            this.buildPoint(outVertex, points[i], vectors[i], cap, join, 0, lengthsofar, vectors[i - 1]);
            lineVertexUtil.buildIndex(outIndices, ++count);

            this.buildPoint(outVertex, points[i], vectors[i], cap, join, 1, lengthsofar, vectors[i - 1]);
            lineVertexUtil.buildIndex(outIndices, ++count);

            lengthsofar += lengths[i];

            this.buildPoint(outVertex, points[i + 1], vectors[i], cap, join, 2, lengthsofar, vectors[i + 1]);
            lineVertexUtil.buildIndex(outIndices, ++count);

            this.buildPoint(outVertex, points[i + 1], vectors[i], cap, join, 3, lengthsofar, vectors[i + 1]);
            lineVertexUtil.buildIndex(outIndices, ++count);

            if (i !== vectors.length - 1) {
                if (join === 'bevel') {
                    this.buildPoint(outVertex, points[i + 1], vectors[i], cap, join, 9, lengthsofar, vectors[i + 1]);
                    lineVertexUtil.buildIndex(outIndices, ++count);
                }
                this.buildPoint(outVertex, points[i + 1], vectors[i], cap, join, 8, lengthsofar, vectors[i + 1]);
                lineVertexUtil.buildIndex(outIndices, ++count);
            }
        }

        this.buildPoint(outVertex, points[points.length - 1], vectors[vectors.length - 1], cap, join, 6, lengthsofar);
        lineVertexUtil.buildIndex(outIndices, ++count);

        this.buildPoint(outVertex, points[points.length - 1], vectors[vectors.length - 1], cap, join, 7, lengthsofar);
        lineVertexUtil.buildIndex(outIndices, ++count);

        return {
            count: count
        };
    }
};
var lineVertexUtil = {
    join: ['miter', 'round', 'bevel'],
    cap: ['round', 'butt', 'square'],
    calcCap: function (vector, index, cap) {
        var normal = lineVertexUtil.calcNormal(vector, index);
        var offset;
        if (cap === 'butt') {
            return normal;
        } else {
            if (index === 4 || index === 5) {
                offset = [normal[0] - vector[0], normal[1] - vector[1]];
            } else {
                offset = [normal[0] + vector[0], normal[1] + vector[1]];
            }
            return offset;
        }
    },
    calcNormal: function (vector, index) {
        var normal;
        if (index % 2 === 0) {
            normal = [-vector[1], vector[0]];
        } else {
            normal = [vector[1], -vector[0]];
        }
        return normal;
    },
    buildIndex: function (indices, index) {
        var indexArray;
        if (index % 2 === 0) {
            indexArray = [index - 2, index - 1, index];
        } else {
            indexArray = [index - 1, index - 2, index];
        }
        for (var i = 0; i < 3; i++) {
            indices.push(indexArray[i]);
        }
    },
    solidLine: function (vertices, join, cap, count, outVertex, outIndices) {
        var points = [];
        for(var i = 0; i < vertices.length; i++) {
            if(i % 2 === 0) {
                points.push([vertices[i]]);
            } else {
                points[points.length - 1].push(vertices[i]);
            }
        }
        return solidUtil.solidLine(points, join, cap, count, outVertex, outIndices);
    },
    dashLine: function (vertices, join, cap, count, lengthsofar, outVertex, outIndices) {
        var points = [];
        for(var i = 0; i < vertices.length; i++) {
            if(i % 2 === 0) {
                points.push([vertices[i]]);
            } else {
                points[points.length - 1].push(vertices[i]);
            }
        }
        return dashUtil.dashLine(points, join, cap, count, lengthsofar, outVertex, outIndices);
    }
};
