// intended to render sequences into interactive html
var music = music || {};

(function(lib){
    
    lib.RENDER = lib.RENDER || {};    
    
    /** returns DOM object */
    lib.RENDER.renderNode = function( node, width, zI ){
        var ret = document.createElement("div");
        ret.classList.add("musicnode");
        
        ret.style.width = width + "px";
        ret.style.zIndex = zI;
        
        if( node.value instanceof Array ){
            var lastStartPos = 0;
            for(var i = 0; i < node.value.length; i++){
                var subdur = node.value[i].getDuration();
                var pcnt = subdur / node.getDuration();
                var subwidth = width * pcnt;
                var chld = lib.RENDER.renderNode(node.value[i], subwidth, parseInt(ret.style.zIndex) + 1); // recur
                
                chld.style.width = (pcnt * 100) + "%"; // this styling should probably instead be incorporated into CSS
                lastStartPos += subwidth;
                ret.appendChild(chld);
            }
        }
        else if(node.value instanceof lib.Note){
            ret.classList.add("musicnote");
            ret.onclick = function(){
                //console.debug("Clicked a node. Wow. What a terrible person.");
                //console.debug(node.value);
                document.getElementById("infobox1").innerText = node.value;
                node.play(MIDI, 0, 127);
            }
            ret.onmouseover = function(){
                ret.oldZI = ret.style.zIndex;
                ret.style.zIndex = (parseInt(ret.oldZI) + 10) + "";
            }
            ret.onmouseout = function(){
                ret.style.zIndex = ret.oldZI;
            }
            
            lib.RENDER._addTextLabel(ret, node.value.getNum());
            ret.appendChild(document.createElement("br"));
            lib.RENDER._addTextLabel(ret, node.value.toSPN());
            ret.style.backgroundColor = colors.getStyleFromRGB(colors.HSVtoRGB(lib.getIndicHSV(node.value)));
        }
        
        node.domElement = ret;
        return ret;
    }
    
    lib.RENDER._addTextLabel = function( node, content ){
        var lbl = document.createElement("span");
        lbl.classList.add("musiclabel");
        lbl.appendChild(document.createTextNode(content));
        node.appendChild(lbl);
    }

})(music);
