var plot = {};

plot.Rect = function(context, x, y, width, height, fillStyle, strokeStyle, lineWidth) {
        if (fillStyle) {
            context.fillStyle = fillStyle;
            context.fillRect(x, y, width, height);
        }
        if (strokeStyle) {
        	if(lineWidth){
        		context.lineWidth = lineWidth;
        	}
        	context.strokeStyle = strokeStyle;
            context.beginPath();
            context.rect(x, y, width, height);
            context.stroke();
        }
    }

plot.Text = function(text, context, x, y, maxWidth, font, fillStyle, strokeStyle){
    context.font = font;
    context.fillStyle = fillStyle;
    context.strokeStyle = strokeStyle;
    context.fillText(text, x, y, maxWidth);
    context.strokeText(text, x, y, maxWidth);
}

function getPlotLib(){
    return plot;
}