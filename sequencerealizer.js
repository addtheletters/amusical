// intended to render sequences into interactive html

/** returns DOM object? */
function renderNode( node, width, zI ){
    var ret = document.createElement("div");
    ret.classList.add("musicnode");
    
    ret.style.width = width + "px";
    ret.style.zIndex = zI;
    
    if( node.value instanceof Array ){
        var lastStartPos = 0;
        for(var i = 0; i < node.value.length; i++){
            var subdur = node.value[i].getDuration();
            var pcnt = subdur / node.getDuration();
            var subwidth = width * subdur / node.getDuration();
            var chld = renderNode(node.value[i], subwidth, parseInt(ret.style.zIndex) + 1);
            
            chld.style.paddingTop = "20px";
            chld.style.width = (pcnt * 100) + "%";
            lastStartPos += subwidth;
            //console.log("lastStartPos was " + lastStartPos + " at node");
            //console.log(node);
            ret.appendChild(chld);
        }
    }
    else if(node.value instanceof music.Note){
        var lbl1 = document.createElement("span");
        var lbl2 = document.createElement("span");
        lbl1.classList.add("musiclabel");
        lbl2.classList.add("musiclabel");
        lbl1.appendChild(document.createTextNode(node.value.num));
        lbl2.appendChild(document.createTextNode(node.value.toSPN()));
        ret.appendChild(lbl1);
        ret.appendChild(document.createElement("br"));
        ret.appendChild(lbl2);
        ret.style.backgroundColor = colors.getStyleFromRGB(colors.HSVtoRGB(getIndicHSV(node.value)));
    }
    return ret;
}
