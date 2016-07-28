/**
 * A LineAtlas lets us reuse rendered dashed lines
 * by writing many of them to a texture and then fetching their positions
 * using .getDash.
 *
 * @param {number} width
 * @param {number} height
 * @private
 */
function LineAtlas(width, height) {
    this.width = width;
    this.height = height;
    this.nextRow = 0;

    this.bytes = 4;
    this.data = new Uint8Array(this.width * this.height * this.bytes);

    this.positions = {};
}

/**
 * Get or create a dash line pattern.
 *
 * @param {Array<number>} dasharray
 * @returns {Object} position of dash texture in { y, height, width }
 * @private
 */
LineAtlas.prototype.getDash = function(dasharray) {
    var key = dasharray.join(",");

    if (!this.positions[key]) {
        this.positions[key] = this.addDash(dasharray);
    }
    return this.positions[key];
};

LineAtlas.prototype.addDash = function(dasharray) {
    var height = 1;
    var offset = 128;

    if (this.nextRow + height > this.height) {
        console.warn('LineAtlas out of space');
        return null;
    }

    var length = 0;
    for (var i = 0; i < dasharray.length; i++) {
        length += dasharray[i];
    }

    var stretch = this.width / length;
    var halfWidth = stretch / 2;

    var row = this.nextRow;
    var index = this.width * row;

    var left = 0;
    var right = dasharray[0];
    var partIndex = 1;

    for (var x = 0; x < this.width; x++) {

        while (right < x / stretch) {
            left = right;
            right = right + dasharray[partIndex];

            partIndex++;
        }

        var distLeft = Math.abs(x - left * stretch);
        var distRight = Math.abs(x - right * stretch);
        var dist = Math.min(distLeft, distRight);
        var inside = (partIndex % 2) === 1;
        var signedDistance;

        signedDistance = (inside ? 1 : -1) * dist;
        this.data[(index + x) * 4] = 255;
        this.data[3 + (index + x) * 4] = Math.max(0, Math.min(255, signedDistance + offset));
    }
    // var canvas = document.getElementById('line');
    // var context = canvas.getContext('2d');
    // var imageData = context.getImageData(0, 0, 256, 512);
    // var data = imageData.data;
    // for (var j = 0; j < data.length; j++) {
    //     if (j % 4 === 0) {
    //         data[j] = 255;
    //     } else {
    //         data[j] = this.data[j];
    //     }
    // }
    // context.putImageData(imageData, 0, 0);
    var pos = {
        y: (this.nextRow + 0.5) / this.height,
        height: 0,
        width: length
    };
    this.nextRow += height;
    this.dirty = true;

    return pos;
};

LineAtlas.prototype.bind = function(gl) {
    if (!this.texture) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.data);

    } else {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        if (this.dirty) {
            this.dirty = false;
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.data);
        }
    }
};
