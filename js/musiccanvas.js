var music = music || {};
var plot = plot || {};

(function(lib){
    
    lib.CNVS = {};
    
    lib.CNVS._cvs;
    lib.CNVS._ctx;
    
    /* must be used */
    lib.CNVS.setCanvas = function( canvasElement ){
        lib.CNVS._cvs = canvasElement;
        lib.CNVS._ctx = canvasElement.getContext("2d");
    }
    
    lib.CNVS.BASEPLATE_STYLE = "gray";
    lib.CNVS.DEFAULT_STYLE = "white";
    lib.CNVS.DEFAULT_TEXT_WIDTH = 50;
    lib.CNVS.FONT_SIZE = 15;
    lib.CNVS.DEFAULT_FONT = lib.CNVS.FONT_SIZE + "px Monospace";
    lib.CNVS.DEFAULT_TEXT_FILL = "white";
    lib.CNVS.DEFAULT_TEXT_STROKE = "rgba(0, 0, 0, 0)";

    lib.CNVS.showNode = function(node, x, y, width, height, yshrink, childfunction) {
        yshrink = yshrink || 10;
        //console.log("showNode: plotting node (recursive)");
        plot.Rect(lib.CNVS._ctx, x, y, width, height, lib.CNVS.getStyle(node), "black", 1); // baseplate
        if( node.value instanceof Array ){
            //console.log("showNode: node value is an array");
            var lastStartPos = 0;
            for(var i = 0; i < node.value.length; i++){
                var subdur = node.value[i].getDuration();
                var subwidth = width * subdur / node.getDuration();
                lib.CNVS.showNode(node.value[i], x + lastStartPos, y+yshrink, subwidth, height-1*yshrink, yshrink, childfunction);
                lastStartPos += subwidth;
            }
        }
        else if(node.value instanceof music.Note){
            plot.Text(node.value.getNum(), lib.CNVS._ctx, x + 3, y + yshrink, lib.CNVS.DEFAULT_TEXT_WIDTH, lib.CNVS.DEFAULT_FONT, lib.CNVS.DEFAULT_TEXT_FILL, lib.CNVS.DEFAULT_TEXT_STROKE);
            plot.Text(node.value.toSPN(), lib.CNVS._ctx, x + 3, y + yshrink + lib.CNVS.FONT_SIZE, lib.CNVS.DEFAULT_TEXT_WIDTH, lib.CNVS.DEFAULT_FONT, lib.CNVS.DEFAULT_TEXT_FILL, lib.CNVS.DEFAULT_TEXT_STROKE);
        }
        return true;
    }

    lib.CNVS.getStyle = function(node, level) {
        //level = level || 0;
        if (node.value instanceof music.Note) {
            return colors.getStyleFromRGB(colors.HSVtoRGB(getIndicHSV(node.value)));
        }
        else if (node.value instanceof Array) {
            if(!level){
                return lib.CNVS.BASEPLATE_STYLE;
            }
        }
        return lib.CNVS.DEFAULT_STYLE;
    }

})(music);
