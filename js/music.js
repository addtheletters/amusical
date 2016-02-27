
var music = music || {};

// TODO split into more manageable modules

// utility stuff here. Good structuring would have these placed somewhere much better. Eh.

function mod(a, b){
    return ((a % b) + b) % b;
}

String.prototype.repeat = function( num ){
	if(num <= 0){
		return "";
	}
    return new Array( num + 1 ).join( this );
};

Array.prototype.sum = function( valueFunc ){
	valueFunc = valueFunc || function( item ){
		return item;
	};
	var total = 0;
	for(var i=0,n=this.length; i<n; ++i)
	{
	    total += valueFunc(this[i]);
	}
	return total;
};

Array.prototype.randomChoice = function(){
	return this[Math.floor( Math.random() * this.length )];
};

Array.prototype.injectArray = function( index, arr ) {
    return this.slice( 0, index ).concat( arr ).concat( this.slice( index ) );
};

(function(lib){

    lib.NUM_TONES = 12;
    lib.DEFAULT_OCTAVE = 4;
    lib.ZERO_OCTAVE = -1; // at what octave number is C = 0?

    lib.note_order = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

    lib.getNoteOrder = function(){
        return this.note_order;
    };

    lib.letter_vals = {
        "C":0,
        "D":2,
        "E":4,
        "F":5,
        "G":7,
        "A":9,
        "B":11
    };

    lib.accidental_vals = {
        "#":1, // easier to type
        "b":-1,
        "♯":1, // actual character
        "♭":-1,
        "♮":0 // for completeness
    };
    
    
    // BPM = beats per measure
    // beatVal = 1/note val, (quarter, eighth)

    // lib.usableBeatVals = [ 1, 1/2, 1/4, 1/8, 1/16 ];
    // lib.usableBPM = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

    lib.PATTERNS = [
        [1, 1, 1, 1],   // this one shouldn't even be necessary
        [1, 1, 1],      // but these probaby help the melodies be more sane until
        [1, 1],         // the generation method is overhauled
        [2, 1],
        [1, 2],
        //[3, 1],
        //[1, 3], 
    ];
    
    lib.PlayNote = function( midi_controller, channel, note, velocity, duration, delay ){
        //console.log(midi_controller);
        var realdelay = delay || 0;
        midi_controller.setVolume(channel, velocity);
        midi_controller.noteOn(channel, note, velocity, realdelay);
        midi_controller.noteOff(channel, note, realdelay + duration);
    };

    lib.ParseLetter = function( letr ){
        if( typeof letr !== 'string' ){
            console.debug("ParseLetter: non-string letter designation, returning original");
            return letr;
        }
        if(letr.length < 1){
            console.debug("ParseLetter: unable to parse letter notation (too short)");
            return;
        }
        var base = letr[0];
        var accd = letr.slice(1);
        // supports multiple stacking accidentals
        var modifier = accd.split("").sum(function( acc ){
            return lib.accidental_vals[acc] || 0;
        });
        return lib.letter_vals[base] + modifier;
    };
    
    lib.ParseStringSPN = function( spn_str ){
        return (new lib.Note(spn_str)).getNum();//(new lib.SPN()).fromString(spn_str).toNum();
    };
    
    // shifts a tone (assuming it placed relative to a middle-C of 0)
    // according to the set default / given and zero octaves
    // with no octave argument, shifts to the default octave
    lib.ShiftOctave = function( tone, octave ){
        var oct = octave || lib.DEFAULT_OCTAVE;
        return lib.NUM_TONES * (oct - lib.ZERO_OCTAVE) + mod(tone, lib.NUM_TONES);
    };
    
    lib.Shift = function( originals, amount ){
        var shifted = [];
        originals.forEach(function(ele){
            this.push(ele + amount); 
        }, shifted);
        return shifted;
    };
    
    lib.PickOne = function( sequence, index, nowrap ){
        var ret = sequence[mod(index, sequence.length)];
        if( nowrap ){
            var octs = Math.floor(index / sequence.length);
            ret = ret + octs * lib.NUM_TONES;
        }
        return ret;
    };
    
    lib.PickSequence = function( sequence, indices, nowrap ){
        if(!indices)  return sequence;
        var ret = [];
        for( var i = 0; i < indices.length; i++ ){
            ret.push(lib.PickOne(sequence, indices[i], nowrap));
        }
        return ret;
    }
    
    lib.LetterizeNumber = function( num ){
        if( typeof num !== 'number' ){
            console.debug("unable to letterize non-number");
            return num;
        }
        return lib.getNoteOrder()[mod(num, lib.NUM_TONES)];
    };
    
    lib.NumberizeSequence = function(sequence){
        var cpy = sequence.slice();
        for( var i = 0; i < cpy.length; i++ ){
            cpy[i] = lib.ParseLetter(sequence[i]);
        }
        return cpy;
    };
    
    lib.LetterizeSequence = function(sequence){
        var cpy = sequence.slice();
        for( var i = 0; i < cpy.length; i++ ){
            cpy[i] = lib.LetterizeNumber(sequence[i]);
        }
        return cpy;
    };
    
    lib.TonesEquivalent = function( t1, t2 ){
        return mod(t1, lib.getNoteOrder().length) === mod(t2, lib.getNoteOrder().length);
    };

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
            // transplanted into pickTones, if I decide ToneGroup should have that functionality and not just Scale. Hm, maybe?
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
        // todo: polymorphism in scale to make the 'looping' with mod
        // change octave up/down if exceeding / going under bounds of tone group
        // depending on whether scale is ascending or descending
        // scale should have a property that says ascending/descending 
        lib.ToneGroup.prototype.continueFrom = function( start, amount ){
            var tns = [];
            for( var i = 0; i < amount; i++){
                tns.push( this.tones[ mod(start + i, this.tones.length) ] );
            }
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
        }
        
        // check if ends on same octave as start, reports how many octaves are spanned and in what direction
        lib.ToneGroup.prototype.bounds = function(){
            return {
                begin:  this.tones[0],
                end:    this.tones[this.tones.length - 1],
                min:    Math.min.apply(null,this.tones),
                max:    Math.max.apply(null,this.tones)
            };
        }
        
        lib.ToneGroup.prototype.checkBounds = function( root ){
            var bds = this.bounds();
            if( root != bds.begin ){
                console.debug("ToneGroup.checkBounds: sequence does not begin on root tone");
            }
            console.debug( "ToneGroup.checkBounds: sequence begins with " + lib.LetterizeNumber(bds.begin) + ",", lib.ToneGroup.verifyOctave(bds.begin, root), "octaves from the root octave" );
            console.debug( "ToneGroup.checkBounds: sequence ends with " + lib.LetterizeNumber(bds.end) + ",", lib.ToneGroup.verifyOctave(bds.end, root), "octaves from the root octave" );
            console.debug( "ToneGroup.checkBounds: sequence max is " + lib.LetterizeNumber(bds.max) + ",", lib.ToneGroup.verifyOctave(bds.max, root), "octaves from the root octave" );
            console.debug( "ToneGroup.checkBounds: sequence min is " + lib.LetterizeNumber(bds.min) + ",", lib.ToneGroup.verifyOctave(bds.min, root), "octaves from the root octave" );
        }
    
    // how many octaves is note away from the octave defined from root to 12 tones higher?
    lib.ToneGroup.verifyOctave = function( note, root ){
        return Math.floor( (note - root) / lib.NUM_TONES );
    }
    
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
        
    lib.Scale = function( sequence, name ){
        lib.ToneGroup.call(this, sequence, name || "unnamed scale", "Scale");
        // if the incoming tone sequence ends with a repeat of the first tone, remove the repeat
        if( lib.TonesEquivalent( this.tones[0], this.tones[this.tones.length-1]) ){
            console.debug("Scale: constructor found equivalent first and final tones; truncating for consistency");
            this.tones.splice(this.tones.length-1, 1);
        }
    };
        lib.Scale.prototype = Object.create(lib.ToneGroup.prototype);
        lib.Scale.prototype.constructor = lib.Scale;
        
        lib.Scale.prototype.ordered = true;
        
        lib.Scale.prototype.findDegree = this.findTone;
        
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
        
    
    // time for scales and stuff
    // Scales are supposed to be ordered sequences
    // Chords are supposed to be played all at once
    // Maybe it makes sense to store scales not as #s of the notes
    // but rather as the size of the steps between notes
    // this would allow easy key-switching in many cases
    
    // TODO: figure out how to account for ascending vs descending scales; melodic minor scales?
    
    lib.TGClass = function( intervals, name, namifier ){
        this.intervals = intervals;
        this.name = name || "unnamed tone group class";
        this.nameFunc = namifier || function( tgc, k ){ return lib.LetterizeNumber(k) + " " + tgc.name; };
        this.BuildType = null;
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
            var ret = new this.BuildType( this.getIntervals(root), useNameFunc(this, root) );
            ret.builder = this; 
            return ret;
        };
        
    lib.ScaleClass = function( steps, name, namifier ){
        this.steps  = steps;
        lib.TGClass.call(this, this.getTones(), name || "unnamed scale class", namifier);
        this.BuildType = lib.Scale;
    };
        lib.ScaleClass.prototype = Object.create(lib.TGClass.prototype);
        lib.ScaleClass.prototype.constructor = lib.ScaleClass;
        
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
        
    // When defining a Chord Class, degrees are specified as normally read rather than
    // how ToneGroup.prototype.pickTones wants them.
    // (1 represents the root, 3 represents 2 above the root.)
    lib.ChordClass = function( semitones, name, namifier ){
        lib.TGClass.call(this, semitones, name || "unnamed chord class", namifier);
        this.BuildType = lib.Chord;
    };
        lib.ChordClass.prototype = Object.create(lib.TGClass.prototype);
        lib.ChordClass.prototype.constructor = lib.ChordClass;
    
    lib.scales = [ // fun fact: diatonic can mean a lot of things in different contexts
        new lib.Scale([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  "chromatic 12 tone"), // chromatic (all 12 tones)
        new lib.Scale([0, 2, 4, 5, 7, 9, 11],                  "C major"), // diatonic C major
        new lib.Scale([7, 9, 11, 0, 2, 4, 6],                  "G major"), // diatonic G major
        new lib.Scale(["C","Eb","F","F#","G","Bb"],            "pentatonic minor blues C"), // they say pentatonic scales sound good even when mashing
        new lib.Scale(["E","F#","G","G#","B","C#"],            "pentatonic major blues E"),
        new lib.Scale([0, 2, 4, 7, 9],                         "pentatonic major from C"), 
        new lib.Scale(["D","F","G","A","C"],                   "pentatonic minor from D"),
        new lib.Scale(["C","C#","F","G","A#"],                 "pentatonic insen from C"), // "japanese" mode
        new lib.Scale(["D","Eb","G","Ab","C"],                 "pentatonic hirajoshi from D")
    ];
    
    lib.scaleClasses = [
        new lib.ScaleClass([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "chromatic", function(sc, k){return sc.name;}),
        new lib.ScaleClass([2, 2, 1, 2, 2, 2], "major"), // the final step is implied to be the return to the root / key of the scale
        new lib.ScaleClass([2, 1, 2, 2, 1, 2], "natural minor"),
        new lib.ScaleClass([2, 1, 2, 2, 1, 3], "harmonic minor")
    ];
    
    lib.CreateFillers = function(sc, key){
        var ret = [];
        var base_scale = sc.build(key);
        var cc_major = sc.extractChordClass([1, 3, 5], "triad");
        ret.push(base_scale);
        ret.push(cc_major.build(key));
        return ret;
    };
    
    lib.MusicNode = function( duration, value, parent ){
        this.duration = duration || null;
        this.parent = parent || null; // apprently naming things parent is a bad idea
        this.sequence = [];
        this.value = value || null; // wow this was confusing
        if( !value ){
            //console.log("MusicNode: value not given, initializing without value");
        }
        else{
            this.value = value;
            if(this.value instanceof lib.Note){
                //console.log("MusicNode: value is a note");
                this.sequence.push(this);
            }
            else if( !(this.isLeaf()) ){
                //console.log("MusicNode: value is an array");
                this.reSequence();
            }
        }
    }
        lib.MusicNode.prototype.isSingular = function(){
            return !((this.value instanceof lib.Note) || (this.value instanceof lib.Chord));
        }
        
        lib.MusicNode.prototype.isLeaf = function(){
            return !(this.value instanceof Array);
        }
        
        lib.MusicNode.prototype.play = function( controller, channel, volume ){
            if(this.domElement){
                this.domElement.classList.add("playing");
            }
            
            if( !(this.isLeaf()) ){
                (function playSequential( nde, index ){
                    //console.log("playing ", nde, " index ", index);
                    nde.value[index].play( controller, channel, volume );
                    if( index < nde.value.length - 1 ){
                        //console.log("set timeout for", nde, nde.value[index].getDuration() * 1000);
                        setTimeout( function(){ playSequential(nde, index+1) }, nde.value[index].getDuration() * 1000 );
                    }
                })( this, 0 );
            }
            else if(this.value instanceof lib.Note){
                //console.log("sound", this.value);
                this.value.play( controller, channel, volume, this.getDuration(), 0);
            }
            
            if(this.domElement){
                var node = this;
                setTimeout( function(){ node.domElement.classList.remove("playing"); }, this.getDuration() * 1000 );
            }
            //console.log("completed play of ", this);
        }
        
        lib.MusicNode.prototype.getKey = function(){
            if( this.value instanceof lib.Note ){
                return this.value.getNum();
            }
            else if(this.value instanceof lib.Chord){
                return this.value.getKey();
            }
            else if(this.skey){
                console.debug("MusicNode: getKey: retreived structural key");
                return this.skey;
            }
            console.debug("MusicNode: getKey: no known key");
            return;
        }
        
        /**
         * "Structural Key" refers to a tone that is assigned to a structural node 
         * (one in the tree without an assigned sound effect but which has children/parents)
         * to allow melody generation to have references on all the necessary levels of recursion.
         */
        lib.MusicNode.prototype.setStructuralKey = function(k){
            if( !this.isSingular() ){
                console.debug("MusicNode: setting structural key for singular node has no effect (node is already tonal)");
                return;
            }
            if( this.skey ){
                console.debug("MusicNode: structural key already posessed a value, overwriting", this.skey);
            }
            this.skey = k;
        }
        
        lib.MusicNode.prototype.getFinalTone = function(){
            if(!this.isSingular()){
                return this.getKey();
            }
            return this.sequence[this.sequence.length - 1].getKey();
        }
        
        lib.MusicNode.prototype.getFirstTone = function(){
            if(!this.isSingular()){
                return this.getKey();
            }
            return this.sequence[0].getKey();
        }
        
        lib.MusicNode.prototype.getDuration = function(){
            return this.duration;
        }
        
        /*
        *	useSequence argument is for when this.sequence has been filled in
        *	for faster execution of certain functions
        *   honestly though I've gotten this far without implementing it so I might as well just get rid of it
        */
        lib.MusicNode.prototype.getInternalDuration = function(useSequence){
            if(!useSequence){
                console.debug("MusicNode: getInternalDuration: useSequence should normally be turned on.");
            }
            
            if(!(this.isLeaf())){
                var useArray;
                if(useSequence){
                    useArray = this.sequence;
                }
                else{
                    useArray = this.value;
                }
                return useArray.sum(function(node){
                    return node.getDuration();
                });
            }
            else if(this.value instanceof lib.Note){
                return this.getDuration();
            }
            else{
                //console.log("MusicNode (getInternalDuration) internal duration unavailable, returning 0.");
                return 0;//this.getDuration();
            }
        }

        /*
        *	dNSeq = do not sequence, stopping the node push from updating sequences of
        *	all parents up the tree
        */
        lib.MusicNode.prototype.addInnerNode = function( node, dNSeq ){
            if(!this.value){
                this.value = [];
            }
            if(!(this.isLeaf())){
                node.parent = this;
                this.value.push(node);
                if(!dNSeq){
                    this.reSequence(); //node);
                }
                else{
                    console.debug("MusicNode (addInnerNode): skipped resequencing.");
                }
            }
            else{
                console.debug("MusicNode (addInnerNode): value is not array; could not add child.");
            }
        }

        /*
        *	recursive helper, should never be called directly
        */
        lib.MusicNode.prototype.reSequence = function(){
            // this function is supposed to receive the node that was changed 
            // as an argument and then surgically alter the sequences of parents
            // until all are fixed.

            //this.sequence = this.sequence.concat(node.getSLList());

            // haha lol kludge fix. very slow and inefficient, will fix later
            // if it becomes an issue

            this.sequence	= this.getSLList();
            if(this.parent){
                this.parent.reSequence(this);
            }
        }
        
        lib.MusicNode.prototype.extractTones = function(){
            var tones = [];
            this.sequence.forEach( function( sqNode, index ){
                tones[index] = sqNode.getKey();
            }, tones );
            return tones;
        }

        lib.MusicNode.prototype.getRemainingSpace = function( useSequence ){
            return this.duration - this.getInternalDuration( useSequence );
        }
        lib.MusicNode.prototype.FillEvenly = function(numBeats, noReSeq){
            return lib.FillEvenly(this, numBeats, noReSeq);
        }
        lib.MusicNode.prototype.FillByPattern = function(pattern, noReSeq){
            return lib.FillByPattern(this, pattern, noReSeq);
        }
        
        // TODO test
        lib.MusicNode.prototype.Tune = function( tone ){
            if( !this.isLeaf() ){
                this.setStructuralKey(tone);
            }
            else{
                // this.value should be non-array. perhaps also empty array? though that implies intent to fill later
                console.log("Tune: tuning to", tone);
                this.value = new lib.Note( tone );
            }
        }
        
        // TODO test
        lib.MusicNode.prototype.ToneFill = function(filler, noRandomDuplicates){
            if( this.isLeaf() ){
                console.debug("MusicNode: ToneFill: node is a leaf, filling with filler key");
                this.Tune( lib.ShiftOctave(this.getKey()));
                return;
            }
            
            var tns;
            if( filler.ordered ){
                console.log("ToneFill: this value is", this.value);
                
                tns = filler.continueFrom( filler.findTone(this.getKey()), this.value.length  ); // TODO this
                
                console.log("ToneFill: tns is", tns);
                for( var i = 0; i < this.value.length; i++){
                    console.log("ToneFill: tuning note index", i, "to", tns[mod(i, tns.length)]);
                    this.value[i].Tune( lib.ShiftOctave(tns[ mod(i, tns.length) ]) ); // mod here should not be necessary
                }
            }
            else{
                tns = filler.pickTones();
                for( var i = 0; i < this.value.length; i++){
                    var choice = tns.randomChoice();
                    if( noRandomDuplicates && tns.length > 1 ){
                        tns.splice( tns.indexOf(choice), 1); // option to disallow duplicate choices
                    }
                    console.log("ToneFill: tuning note index", i, "to", choice);
                    this.value[i].Tune( lib.ShiftOctave(choice) );
                }
            }
        }

        /*
        * 	SLList = Sequential Leaf List
        *	use to build this.sequence when it does not yet exist
        */
        lib.MusicNode.prototype.getSLList = function(){
            //console.log("MusicNode (getSLList): running BFS for leaves");
            var leaves = [];
            var stack = [this];
            while(stack.length > 0){
                var node = stack.pop();
                if(node.isLeaf()){
                    if(!(node.value instanceof lib.Note)){
                        //console.log("MusicNode (getSLList): Tried to get leaves / as leaf an unset node.");
                    }
                    leaves.push(node);
                    continue;
                }
                for(var i = node.value.length-1; i >= 0; i--){
                    stack.push(node.value[i]);
                }
            }
            return leaves;
        }

    lib.BuildRhythm = function( BPM, patterns, minBeatDuration, complexity ){
        // need to implement minBeatDuration
        // and also just make this less dumb in several ways
        var rt = new lib.MusicNode( BPM );
        for(var i = 0; i < complexity; i++){
            lib.MutateRhythm(rt, patterns);
        }
        /*
        lib.FillByPattern(patterns.randomChoice(), true);
        for(var i = 0; i < complexity; i++){
            var tempnode = lib.value.randomChoice().FillByPattern(patterns.randomChoice(), true);
        }
        */
        rt.reSequence();
        return rt;
    };

    lib.MutateRhythm = function( rhythm, patterns ){
        // make less regular!
        if( rhythm.value instanceof Array ){
            lib.MutateRhythm( rhythm.value.randomChoice(), patterns );
        }
        else{
            lib.ClearNode(rhythm);
            rhythm.FillByPattern( patterns.randomChoice(), false);
        }
    };

    lib.ClearNode = function( node ){
        node.value = undefined;
        node.reSequence();
    };

    lib.FillEvenly = function( node, numBeats, noReSeq ){
        var space = node.getRemainingSpace();
        if(space <= 0){
            console.log("fill: no space in node, no action taken");
            return node;
        }
        if(numBeats <= 0){
            console.log("fill: asked for stupid number of beats");
        }
        var beatlen = space / numBeats;
        for(var i = 0; i < numBeats; i++){
            node.addInnerNode( new lib.MusicNode( beatlen ), noReSeq );
        }
        return node;
    };

    lib.FillByPattern = function( node, pattern, noReSeq ){
        var space = node.getRemainingSpace();
        if(space <= 0){
            console.log("fill: no space in node, no action taken");
            return node;
        }
        if(pattern.length <= 0){
            console.log("fill: pattern is invalid");
        }
        var patternTotal = pattern.sum();
        for(var i = 0; i < pattern.length; i++){
            node.addInnerNode( new lib.MusicNode( (pattern[i] / patternTotal) * space ), noReSeq );
        }
        return node;
    };

    lib.RandomTonalize = function( node, tones ){
        var tmp_octave_range = 2;
        if(node.sequence.length <= 0){
            console.debug("node is nontonalizable");
        }
        for(var i = 0; i < node.sequence.length; i++){
            var ind = (Math.floor(Math.random() * tmp_octave_range * tones.length) - tmp_octave_range * tones.length * 1/2);
            node.sequence[i].value = new lib.Note( lib.ShiftOctave( tones[mod(ind, tones.length)], lib.DEFAULT_OCTAVE + Math.floor(ind / tones.length) ) ) ;
        }
    };
    
    // TODO finish / test this
    // algo goes top to bottom choosing a 'root' tone for node in *value* order
    // these root tones are assigned according to scales / chord sequences, chords can jump randomly but scales must be ordered?
    // then each child is gone into, and a similar process can occur using the assigned 'root' as the base for scale or chord choice
    lib.ScaleTonalize = function( node, fillers ){
        if(node.sequence.length <= 0){
            console.debug("node is nontonalizable");
        }
        var filler = fillers.randomChoice();
        node.ToneFill(filler);
        for(var i = 0; i < node.value.length; i++){
            // recur on children
            lib.ScaleTonalize( node.value[i], fillers );//fillers.splice( fillers.indexOf(filler), 1 ) );
        }
    };
    
    // TODO have this be sensible. This should progress note by note in the sequence and
    // tonalize based off the previous note values in the sequence.
    lib.SequentialTonalize = function(node, fillers){
        console.debug("SEQUENTIAL TONALIZE UNIMPLEMENTED");
        return "UNIMPLEMENTED";
    }
 
})(music);

// sorry rohan
