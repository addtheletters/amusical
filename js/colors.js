// color manipulation

var colors = {};

// range of h, s, and v is [0,1]
colors.HSVtoRGB = function ( h, s, v ) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}

colors.getAverageColor = function( rgbcolors ){
    var sum = {r:0, g:0, b:0};
    for(var i = 0; i < rgbcolors.length; i++){
        sum.r += rgbcolors[i].r;
        sum.g += rgbcolors[i].g;
        sum.b += rgbcolors[i].b;
    }
    sum.r = sum.r / rgbcolors.length;
    sum.g = sum.g / rgbcolors.length;
    sum.b = sum.b / rgbcolors.length;
    return sum;
}

colors.getStyleFromRGB = function( rgbcolor ){
    return "rgb("+rgbcolor.r+","+rgbcolor.g+","+rgbcolor.b+")";
}

colors.randomRGBColor = function(){
    return this.HSVtoRGB(Math.random(), 1, 1);
}

colors.randomColorStyle = function () {
	return this.getStyleFromRGB(this.randomRGBColor());
}

colors.componentToHex = function ( c ) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

colors.rgbToHex = function( r, g, b ) {
    return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
}

colors.rgbToHex_fast = function( r, g, b ){
	return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).substr(1);
}

colors.hexToRgb = function ( hex ) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

colors.hexToRgb_fast = function(hex) {
    var allint = parseInt(hex, 16);
    return [(allint = parseInt(hex, 16)) >> 16 & 255, allint >> 8 & 255, allint & 255].join();
}

function getColorsLib(){
	return colors;
}


