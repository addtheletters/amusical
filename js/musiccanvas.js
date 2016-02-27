var BASEPLATE_STYLE = "gray";
var DEFAULT_STYLE = "white";
var DEFAULT_TEXT_WIDTH = 50;
var FONT_SIZE = 15;
var DEFAULT_FONT = FONT_SIZE + "px Monospace";
var DEFAULT_TEXT_FILL = "white";
var DEFAULT_TEXT_STROKE = "rgba(0, 0, 0, 0)";

var leCanvas;
var leContext;

var colors = colors || getColorsLib();

function showNode(node, x, y, width, height, yshrink, childfunction) {
    yshrink = yshrink || 10;
    //console.log("showNode: plotting node (recursive)");
    plot.Rect(leContext, x, y, width, height, getStyle(node), "black", 1); // baseplate
    if( node.value instanceof Array ){
        //console.log("showNode: node value is an array");
        var lastStartPos = 0;
        for(var i = 0; i < node.value.length; i++){
            var subdur = node.value[i].getDuration();
            var subwidth = width * subdur / node.getDuration();
            showNode(node.value[i], x + lastStartPos, y+yshrink, subwidth, height-1*yshrink, yshrink, childfunction);
            lastStartPos += subwidth;
        }
    }
    else if(node.value instanceof music.Note){
        plot.Text(node.value.getNum(), leContext, x + 3, y + yshrink, DEFAULT_TEXT_WIDTH, DEFAULT_FONT, DEFAULT_TEXT_FILL, DEFAULT_TEXT_STROKE);
        plot.Text(node.value.toSPN(), leContext, x + 3, y + yshrink + FONT_SIZE, DEFAULT_TEXT_WIDTH, DEFAULT_FONT, DEFAULT_TEXT_FILL, DEFAULT_TEXT_STROKE);
    }
    return true;
}

function getStyle(node, level) {
    //level = level || 0;
    if (node.value instanceof music.Note) {
        return colors.getStyleFromRGB(colors.HSVtoRGB(getIndicHSV(node.value)));
    }
    else if (node.value instanceof Array) {
        if(!level){
            return BASEPLATE_STYLE;
        }
    }
    return DEFAULT_STYLE;
}
