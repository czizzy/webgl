function getSource(file) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4) {
                resolve(xhr.responseText);
            }
        };
        xhr.open('GET', file, true);
        xhr.send();
        
    });
}

function getImage(src) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            resolve(img);
        };
        img.src = src;
        if(img.complete) {
            resolve(img);
        }
    });
}
