var music = music || {};

(function(lib){
    
    lib.Note = function( arg ){
        if( typeof arg === 'string' ){
            this.fromSPN(arg);
        }
        else if( typeof arg === 'number'){
            this.num = arg;
        }
        else{
            console.debug("note initialized to default middle-C");
            this.num = 60;
        }
    };
        lib.Note.prototype.getNum = function(){
            return this.num;
        };
        
        lib.Note.prototype.setNum = function( n ){
            this.num = n;
        };
    
        lib.Note.prototype.toString = function(){
            return "[Note: num(" + this.num + "), SPN("+ this.toSPN() +")]";// dur(" + this.duration + ")]";
        };
        
        lib.Note.prototype.letter = function(){
            return lib.getNoteOrder()[ mod(this.num, lib.NUM_TONES) ];
        }
        
        lib.Note.prototype.octave = function(){
            return Math.floor( this.num / lib.NUM_TONES ) + lib.ZERO_OCTAVE;
        };
        
        lib.Note.prototype.play = function( controller, channel, volume, duration, delay ){
            lib.PlayNote( controller, channel, this.num, volume, duration, delay );
        };
          
        /** scientific pitch notation: https://en.wikipedia.org/wiki/Scientific_pitch_notation */
        lib.Note.prototype.toSPN = function(){
            return this.letter() + this.octave();// new lib.SPN().fromNum(this.num);
        };
        
        lib.Note.prototype.fromSPN = function( spn ){
            var pivot = spn.search(/-?\d+/g, "");
            if(pivot < 0){
                pivot = spn.length;
            }
            var spnobj = {};
            spnobj.letter = spn.slice(0, pivot);
            spnobj.octave = parseInt(spn.slice(pivot));
            this.num = lib.ShiftOctave( lib.ParseLetter(spnobj.letter), spnobj.octave );
            return this;
        };
        
})(music);
