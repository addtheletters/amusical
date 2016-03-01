var music = music || {};

(function(lib){
        
    lib.ToneGroup = function( tones, name, tid ){
        this.name   = name || "unnamed tone group";
        this.tones  = lib.NumberizeSequence(tones) || [];
        this.type_id  = tid || "ToneGroup";
    };
        lib.ToneGroup.prototype.toString = function(){
            return "["+this.type_id+": ("+this.name+") {" + lib.LetterizeSequence( this.tones ) + "}]";// dur(" + this.duration + ")]";
        };
        
        lib.ToneGroup.prototype.getKey = function(){
            return this.tones[0];
        };
        
        //multioctave: bool: get the degree, unmodded. If outside the specified base octave, get an accurate measure of how far out
        lib.ToneGroup.prototype.findTone = function( tone, multioctave ){
            var ind = this.tones.indexOf( mod(tone, lib.NUM_TONES) ) ;
            if( ind < 0 ) return null;
            else if( multioctave ){ // frankly this technique is super useful, needs to be reversedish in pickDegree and then 
            // transplanted into pickTones, if I decide ToneGroup should have that funct    ionality and not just Scale. Hm, maybe?
                var octs = Math.floor(tone / lib.NUM_TONES); // how many octaves away?
                ind = ind + octs * this.tones.length;
            }
            return ind;
        };
        
        // notice that the root, normally notated degree 1, corresponds to
        // an argument given of zero
        // a perfect fifth corresponds to a degree given of 4
        lib.ToneGroup.prototype.pickTones = function( degrees, wrap ){
            return lib.PickSequence(this.tones, degrees, wrap);
        };
        
        // start: index of start, not starting val
        // change octave up/down if exceeding / going under bounds of tone group
        // depending on whether scale is ascending or descending
        // scale should have a property that says ascending/descending 
        lib.ToneGroup.prototype.continueFrom = function( start, amount, wrap ){
            //console.log("ToneGroup.continueFrom called");
            //console.log("continuing from", start);
            //console.log("by", amount);
            var tns = [];
            for( var i = 0; i < amount; i++){
                tns.push( lib.PickOne(this.tones, start+i, wrap) );
            }
            //console.log("returned is", tns);
            return tns;
        };
        
        lib.ToneGroup.DIRECTION = Object.freeze({
            STRICT_ASCEND   : {value:3, name:"Ascending",   strictness:"Strict"}, // every note increases in pitch
            STRICT_DESCEND  : {value:-3, name:"Descending", strictness:"Strict"}, // every note decreases in pitch
            END_HIGHEST     : {value:2, name:"End is Highest", strictness:"None"},
            END_LOWEST      : {value:-2, name:"End is Lowest", strictness:"None"},
            END_HIGHER      : {value:1, name:"End is Higher than Start", strictness:"None"},  
            END_LOWER       : {value:-1, name:"End is Lower than Start", strictness:"None"},
            INDETERMINATE   : {value:0, name:"Indeterminate", strictness:"None"} // no strict or general pattern to tone changes
        });
        
        // do something useful
        lib.ToneGroup.prototype.verifyDir = function(){
            var bds = this.bounds();
            var uptune  = 0;
            var downtune = 0;
            var neutral = 0;
            for( var i = 1; i < this.tones.length; i++ ){
                var tone_delta = this.tones[i] - this.tones[i-1];
                if( tone_delta > 0) uptune ++;
                if( tone_delta < 0) downtune ++;
                if( tone_delta == 0) neutral ++;
            }
            if(neutral > 0){
                console.debug("ToneGroup.verifyDir: sequence contains elements of no variation from the previous, count:", neutral);
                console.debug("Scales should not have repeated tones!");
            }
            if( uptune == 0 && downtune == 0 ){
                //console.log("Indet with no up or down...");
                return lib.ToneGroup.DIRECTION.INDETERMINATE;
            }
            if( uptune > 0 ){
                //console.log("Uptunes exist.");
                if(downtune == 0){
                    return lib.ToneGroup.DIRECTION.STRICT_ASCEND;
                }
                else if(bds.end == bds.max){
                    return lib.ToneGroup.DIRECTION.END_HIGHEST;
                }
                else if(bds.end > bds.begin){
                    return lib.ToneGroup.DIRECTION.END_HIGHER;
                }
            }
            if( downtune > 0 ){
                //console.log("Downtunes exist.");
                if(uptune == 0){
                    return lib.ToneGroup.DIRECTION.STRICT_DESCEND;
                }
                else if(bds.end == bds.min){
                    return lib.ToneGroup.DIRECTION.END_LOWEST;
                }
                else if(bds.end < bds.begin){
                    return lib.ToneGroup.DIRECTION.END_LOWER;
                }
            }
            //console.log("Indet with no other traits");
            return lib.ToneGroup.DIRECTION.INDETERMINATE;        
        };
        
        // check if ends on same octave as start, reports how many octaves are spanned and in what direction
        lib.ToneGroup.prototype.bounds = function(){
            return {
                begin:  this.tones[0],
                end:    this.tones[this.tones.length - 1],
                min:    Math.min.apply(null,this.tones),
                max:    Math.max.apply(null,this.tones)
            };
        };
        
        lib.ToneGroup.prototype.checkBounds = function( root ){
            var bds = this.bounds();
            if( root != bds.begin ){
                console.debug("ToneGroup.checkBounds: sequence does not begin on root tone");
            }
            console.debug( "ToneGroup.checkBounds: sequence begins with " + lib.LetterizeNumber(bds.begin) + ",", lib.ToneGroup.verifyOctave(bds.begin, root), "octaves from the root octave" );
            console.debug( "ToneGroup.checkBounds: sequence ends with " + lib.LetterizeNumber(bds.end) + ",", lib.ToneGroup.verifyOctave(bds.end, root), "octaves from the root octave" );
            console.debug( "ToneGroup.checkBounds: sequence max is " + lib.LetterizeNumber(bds.max) + ",", lib.ToneGroup.verifyOctave(bds.max, root), "octaves from the root octave" );
            console.debug( "ToneGroup.checkBounds: sequence min is " + lib.LetterizeNumber(bds.min) + ",", lib.ToneGroup.verifyOctave(bds.min, root), "octaves from the root octave" );
        };
    
    // how many octaves is note away from the octave defined from root to 12 tones higher?
    lib.ToneGroup.verifyOctave = function( note, root ){
        return Math.floor( (note - root) / lib.NUM_TONES );
    };
    
    lib.Chord = function( tones, name ){
        lib.ToneGroup.call(this, tones, name || "unnamed chord", "Chord");
    };
        lib.Chord.prototype = Object.create(lib.ToneGroup.prototype);
        lib.Chord.prototype.constructor = lib.Chord;
        
        lib.Chord.prototype.ordered = false;
        
        lib.Chord.prototype.play = function( controller, channel, volume, duration, delay ){
            for(var i = 0; i < this.tones.length; i++){
                //console.log("Chord.play: playing tone", this.tones[i]);
                lib.PlayNote( controller, channel, this.tones[i], volume, duration, delay );
            }
        };
        
    lib.Scale = function( sequence, name, reversal_adjustment ){
        lib.ToneGroup.call(this, sequence, name || "unnamed scale", "Scale");
        this.r_adj = reversal_adjustment; // stores how to adjust each tone when doing a reverse
        // if the incoming tone sequence ends with a repeat of the first tone, remove the repeat
        if( lib.TonesEquivalent( this.tones[0], this.tones[this.tones.length-1]) ){
            console.debug("Scale: constructor found equivalent first and final tones; truncating for consistency");
            this.tones.splice(this.tones.length-1, 1);
        }
    };
        lib.Scale.prototype = Object.create(lib.ToneGroup.prototype);
        lib.Scale.prototype.constructor = lib.Scale;
        
        lib.Scale.prototype.ordered = true;
        
        lib.Scale.prototype._getTonesRAdjusted = function(){
            return this.r_adj ? lib.VecSum(this.tones, this.r_adj) : this.tones;
        }
        
        // TODO allow for reversing to have special name (ex. melodic descending)
        // the namifier functions are getting a bit out of hand though
        lib.Scale.prototype.getReverse = function( rename ){
            var reseq = this._getTonesRAdjusted();
            console.log("applying reverser to scale, new tones are", reseq);
            var flip = [reseq[0]];
            for(var i = reseq.length-1; i > 0; i--){
                flip.push( mod(reseq[i], lib.NUM_TONES) - lib.NUM_TONES );
            }
            console.log("flipped tones are", flip);
            return new lib.Scale( flip, rename || this.name + " reversed", (this.r_adj ? lib.InvertAll( this.r_adj ) : null) );
        };
        
        lib.Scale.prototype.findDegree = lib.ToneGroup.prototype.findTone;
        
        //multioctave: bool: do you want to mod and give out base octave like pickTones currently does, or be unmodded and mesh well with findTone?
        lib.Scale.prototype.pickDegree = function( degree, multioctave ){
            return lib.PickOne(this.tones, degree, multioctave);
        };
        
        lib.Scale.prototype.extractChord = function( degrees, name ){
            return new lib.Chord( this.pickTones( lib.Shift(degrees, -1), true), name);
        };
        
        lib.Scale.prototype.nextTone = function( tone, multioctave ){
            //multioctave: bool: if so, can go beyond specified base octave. If not, modded / loops around to start
            var found = this.findDegree(tone, multioctave);
            if(found !== null){
                return this.pickDegree( found + 1, multioctave );
            }
            return found;
        };
        
        lib.Scale.prototype.prevTone = function( tone, multioctave ){
            var found = this.findDegree(tone, multioctave);
            if(found !== null){
                return this.pickDegree( found - 1, multioctave );
            }
            return found;
        };
        
})(music);