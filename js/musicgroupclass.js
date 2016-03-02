var music = music || {};

(function(lib){
    
    // time for scales and stuff
    // Scales are supposed to be ordered sequences
    // Chords are supposed to be played all at once
    // Maybe it makes sense to store scales not as #s of the notes
    // but rather as the size of the steps between notes
    // this would allow easy key-switching in many cases
    
    lib.TGClass = function( intervals, name, namifier ){
        this.intervals = intervals;
        this.name = name || "unnamed tone group class";
        this.nameFunc = namifier || function( tgc, k ){ return lib.LetterizeNumber(k) + " " + tgc.name; };
    };
        lib.TGClass.prototype.getIntervals = function( rootKey ){
            var ivs = [];
            var shift = rootKey || 0;
            for(var i = 0; i < this.intervals.length; i++){
                ivs.push( this.intervals[i] + shift );
            }
            return ivs;
        };
        
        lib.TGClass.prototype.build = function( rootKey, namifier ){
            var root = rootKey || 0;
            var useNameFunc = namifier || this.nameFunc;
            var ret = this._builder( this.getIntervals(root), useNameFunc(this, root) );
            ret.builder = this; 
            return ret;
        };
        
        lib.TGClass.prototype._builder = function( tones, name ){
            return new lib.ToneGroup( tones, name );
        };
        
    lib.ScaleClass = function( steps, name, namifier, reverser ){
        this.steps  = steps;
        this.reverser = reverser;
        lib.TGClass.call(this, this.getTones(), name || "unnamed scale class", namifier, lib.Scale);
    };
        lib.ScaleClass.prototype = Object.create(lib.TGClass.prototype);
        lib.ScaleClass.prototype.constructor = lib.ScaleClass;
        
        lib.ScaleClass.prototype._builder = function( tones, name ){
            return new lib.Scale(tones, name, this.reverser);
        };
        
        lib.ScaleClass.prototype.getTones = function( rootKey ){
            var relative_tones = [];
            var curr_tone = rootKey || 0;
            for( var i = 0; i < this.steps.length+1; i++ ){
                relative_tones.push( curr_tone );
                if( i < this.steps.length ){
                    curr_tone += this.steps[i];
                }
            }
            return relative_tones;
        };
        
        lib.ScaleClass.prototype.extractChordClass = function( degrees, name, namifier ){
            return new lib.ChordClass( lib.PickSequence( this.intervals, lib.Shift(degrees, -1), true ), name, namifier || (function(sc){
                return function(tgc, k){
                    return lib.LetterizeNumber(k) + " " + sc.name + " " + tgc.name;
                };
            })(this));
        };
        
    // When defining a Chord Class using extractChordClass,
    // degrees are specified as normally read rather than
    // how ToneGroup.prototype.pickTones wants them.
    // (1 represents the root, 3 represents 2 above the root.)
    lib.ChordClass = function( semitones, name, namifier ){
        lib.TGClass.call(this, semitones, name || "unnamed chord class", namifier, lib.Chord);
    };
        lib.ChordClass.prototype = Object.create(lib.TGClass.prototype);
        lib.ChordClass.prototype.constructor = lib.ChordClass;
        
        lib.ChordClass.prototype._builder = function(tones, name){
            return new lib.Chord(tones, name);
        };
        
})(music);