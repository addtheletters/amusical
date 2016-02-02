

/*
var note_association = {
	0:"C", // middle C. SPN is C4
	1:"C#",
	2:"D",
	3:"D#",
	4:"E",
	5:"F",
	6:"F#",
	7:"G",
	8:"G#",
	9:"A",
	10:"A#",
	11:"B"
};
*/

var music = {};

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
    
    lib.PlayNote = function( midi_controller, channel, note, velocity, duration, delay ){
        //console.log(midi_controller);
        midi_controller.setVolume(0, velocity);
        midi_controller.noteOn(0, note, velocity, delay);
        midi_controller.noteOff(0, note, delay + duration);
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

    lib.Note = function( arg ){
        if( typeof arg === 'string' ){
            this.fromSPN(new lib.SPN().fromString(arg));
        }
        else if( typeof arg === 'number'){
            this.num = arg;
        }
        else{
            console.debug("note initialized to default middle-C");
            //console.log("arg was")
            //console.log(arg)
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
        
        lib.Note.prototype.play = function( controller, channel, volume, duration, delay ){
            lib.PlayNote( controller, channel, this.num, volume, duration, delay );
        };
          
        /** scientific pitch notation: https://en.wikipedia.org/wiki/Scientific_pitch_notation */
        lib.Note.prototype.toSPN = function(){
            return new lib.SPN().fromNum(this.num);
        };
        
        lib.Note.prototype.fromSPN = function( spn ){
            this.num = spn.toNum();
        };
    
    lib.Chord = function( tones, name ){
        this.name = name || "unnamed chord";
        this.tones = lib.NumberizeSequence(tones) || [];
    };
        lib.Chord.prototype.canFill = true;
        lib.Chord.prototype.ordered = false;
        
        lib.Chord.prototype.toString = function(){
            return "[Chord: ("+name+")]";// dur(" + this.duration + ")]";
        };
        
        lib.Chord.prototype.play = function( controller, channel, volume, duration, delay ){
            for(var i = 0; i < this.tones.length; i++){
               lib.PlayNote( controller, channel, this.tones[i], volume, duration, delay );
            }
        };
        
        lib.Chord.prototype.getKey = function(){
            return this.tones[0];
        };

    lib.SPN = function( letr, octv ){
        /** includes accidental */
        this.letter = letr || "C";
        /* middle C is C4 */
        this.octave = octv || lib.DEFAULT_OCTAVE;  
    };
        lib.SPN.prototype.toNum = function(){
            return lib.NUM_TONES * (this.octave - lib.ZERO_OCTAVE) + lib.ParseLetter(this.letter); // in compliance with MIDI, 0 is C-1
        };
        
        lib.SPN.prototype.fromNum = function( num ){
            this.letter = lib.getNoteOrder()[ mod(num, lib.NUM_TONES) ];
            this.octave = Math.floor( num / lib.NUM_TONES ) + lib.ZERO_OCTAVE;
            return this;
        };
        
        lib.SPN.prototype.toString = function(){
            return this.letter + this.octave;
        };
        
        lib.SPN.prototype.fromString = function( stra ){
            var pivot = stra.search(/-?\d+/g, "")
            this.letter = stra.slice(0, pivot);
            this.octave = parseInt( stra.slice(pivot) );
            return this;
        };
        
        
    // time for scales and stuff
    // Scales are supposed to be ordered sequences
    // Chords are supposed to be played all at once
    // Maybe it makes sense to store scales not as #s of the notes
    // but rather as the size of the steps between notes
    // this would allow easy key-switching in many cases
    
    lib.Scale = function( sequence, name ){
        this.name = name || "unnamed scale";
        this.sequence = lib.NumberizeSequence(sequence) || [];
    };
        lib.Scale.prototype.canFill = true;
        lib.Scale.prototype.ordered = true;
        
        lib.Scale.prototype.toString = function(){
            return "[Scale: (" + this.name + ") {" + lib.LetterizeSequence( this.sequence ) + "}]";
        };
        
        lib.Scale.prototype.getKey = function(){
            return this.sequence[0];
        };
        
        lib.Scale.prototype.pickTones = function( degrees ){
            var tones = [];
            for( var i = 0; i < degrees.length; i++ ){
                tones.push( this.sequence[ mod( degrees[i], this.sequence.length ) ] );
            }
            return tones;
        }
    // TODO: figure out how to account for ascending vs descending scales; melodic minor scales?
    
    lib.ScaleClass = function( steps, name, namifier ){
        this.name = name || "unnamed scale class";
        this.nameFunc = namifier || function( sc, k ){ return lib.LetterizeNumber(k) + " " + sc.name; };
        this.steps = steps;
    };
        lib.ScaleClass.prototype.getTones = function( baseKey ){
            var relative_tones = [];
            var curr_tone = baseKey || 0;
            for( var i = 0; i < this.steps.length+1; i++ ){
                relative_tones.push( curr_tone );
                if( i < this.steps.length ){
                    curr_tone += this.steps[i];
                }
            }
            return relative_tones;
        };
        
        lib.ScaleClass.prototype.buildScale = function( key, namifier ){
            var useNameFunc = namifier || this.nameFunc;
            return new lib.Scale( this.getTones(key), useNameFunc(this, key) );
        };
    
    
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
            else if( this.value instanceof Array ){
                //console.log("MusicNode: value is an array");
                this.reSequence();
            }
        }
    }
        lib.MusicNode.prototype.isSingular = function(){
            return (this.value instanceof lib.Note) || (this.value instanceof lib.Chord);
        }
        
        lib.MusicNode.prototype.play = function( controller, channel, volume ){
            //console.log("beginning play of ", this);
            if(this.domElement){
                //console.log("lighten!");
                //console.log(this.domElement);
                this.domElement.classList.add("playing");
            }
            
            if( this.value instanceof Array ){
                (function playSequential( nde, index){
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
                console.debug("MusicNode: getKey: retreived placeholder key");
                return this.skey;
            }
            console.debug("MusicNode: getKey: no known key");
            return;
        }
        
        lib.MusicNode.prototype.setStructuralKey = function(k){
            if( this.value ){
                console.debug("MusicNode: setting placeholder key for already-valued node has no effect");
                return;
            }
            if( this.skey ){
                console.debug("MusicNode: placeholder key already posessed a value, overwriting", this.skey);
                this.skey = k;
            }
            this.skey = k;
        }
        
        lib.MusicNode.prototype.getFinalTone = function(){
            if(this.isSingular()){
                return this.getKey();
            }
            return this.sequence[this.sequence.length - 1].getKey();
        }
        
        lib.MusicNode.prototype.getFirstTone = function(){
            if(this.isSingular()){
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
            
            if(this.value instanceof Array){
                /*var temp = 0;
                for(var i = 0; i < this.value.length; i++){
                    temp += this.value[i].getDuration();
                }
                return temp;*/
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
            if(this.value instanceof Array){
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

        lib.MusicNode.prototype.getRemainingSpace = function( useSequence ){
            return this.duration - this.getInternalDuration( useSequence );
        }
        lib.MusicNode.prototype.FillEvenly = function(numBeats, noReSeq){
            return lib.FillEvenly(this, numBeats, noReSeq);
        }
        lib.MusicNode.prototype.FillByPattern = function(pattern, noReSeq){
            return lib.FillByPattern(this, pattern, noReSeq);
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
                if(!(node.value instanceof Array)){
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

    // BPM = beats per measure
    // beatVal = 1/note val, (quarter, eighth)

    lib.usableBeatVals = [ 1, 1/2, 1/4, 1/8, 1/16 ];
    lib.usableBPM = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

    lib.PATTERNS = [
        [1, 1, 1, 1],   // this one shouldn't even be necessary
        [1, 1, 1],      // but these probaby help the melodies be more sane until
        [1, 1],         // the generation method is overhauled
        [2, 1],
        [1, 2],
        //[3, 1],
        //[1, 3], 
    ];

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

    lib.Tonalize = function( node, tones ){
        var tmp_octave_range = 2;
        if(node.sequence.length <= 0){
            console.debug("node is nontonalizable");
        }
        for(var i = 0; i < node.sequence.length; i++){
            var ind = (Math.floor(Math.random() * tmp_octave_range * tones.length) - tmp_octave_range * tones.length * 1/2);
            node.sequence[i].value = new lib.Note( (lib.DEFAULT_OCTAVE - lib.ZERO_OCTAVE) * lib.NUM_TONES + tones[mod(ind, tones.length)] + lib.NUM_TONES * Math.floor(ind / tones.length) ) ;
        }
    };
    
    // TODO finish this
    // algo goes top to bottom choosing a 'root' tone for node in *value* order
    // these root tones are assigned according to scales / chord sequences, chords can jump randomly but scales must be ordered?
    // then each child is gone into, and a similar process can occur using the assigned 'root' as the base for scale or chord choice
    lib.ScaleTonalize = function( node, fillers ){
        if(node.sequence.length <= 0){
            console.debug("node is nontonalizable");
        }
        for(var i = 0; i < node.value.length; i++){
            // fill node
        }
        for(var i = 0; i < node.value.length; i++){
            // recur on children
        }
    };
 
})(music);

// sorry rohan
