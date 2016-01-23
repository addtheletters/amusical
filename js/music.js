

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

(function(root){

    root.NUM_TONES = 12;
    root.DEFAULT_OCTAVE = 4;
    root.ZERO_OCTAVE = -1; // at what octave number is C = 0?

    root.note_order = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

    root.getNoteOrder = function(){
        return this.note_order;
    };

    root.letter_vals = {
        "C":0,
        "D":2,
        "E":4,
        "F":5,
        "G":7,
        "A":9,
        "B":11
    };

    root.accidental_vals = {
        "#":1, // easier to type
        "b":-1,
        "♯":1, // actual character
        "♭":-1,
        "♮":0 // for completeness
    };
    
    root.PlayNote = function( midi_controller, channel, note, velocity, duration, delay ){
        console.log(midi_controller);
        midi_controller.setVolume(0, velocity);
        midi_controller.noteOn(0, note, velocity, delay);
        midi_controller.noteOff(0, note, delay + duration);
    }

    root.ParseLetter = function( letr ){
        if(letr.length < 1){
            console.log("unable to parse letter notation");
            return;
        }
        var base = letr[0];
        var accd = letr.slice(1);
        // supports multiple stacking accidentals
        var modifier = accd.split("").sum(function( acc ){
            return root.accidental_vals[acc] || 0;
        });
        return root.letter_vals[base] + modifier;
    };

    root.Note = function( arg ){
        if( typeof arg === 'string' ){
            this.fromSPN(new root.SPN().fromString(arg));
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
        root.Note.prototype.toString = function(){
            return "[Note: num(" + this.num + "), SPN("+ this.toSPN() +")]";// dur(" + this.duration + ")]";
        };
        
        root.Note.prototype.play = function( controller, channel, volume, duration, delay ){
            root.PlayNote( controller, channel, this.num, volume, duration, delay );
        };
          
        /** scientific pitch notation: https://en.wikipedia.org/wiki/Scientific_pitch_notation */
        root.Note.prototype.toSPN = function(){
            return new root.SPN().fromNum(this.num);
        };
        
        root.Note.prototype.fromSPN = function( spn ){
            this.num = spn.toNum();
        };
    
    root.Chord = function( tones, name ){
        this.name = name || "unnamed chord";
        this.tones = root.NumberizeSequence(tones) || [];
    };
        root.Chord.prototype.toString = function(){
            return "[Chord: ("+name+")]";// dur(" + this.duration + ")]";
        };
        
        root.Chord.prototype.play = function( controller, channel, volume, duration, delay ){
            for(var i = 0; i < this.tones.length; i++){
               root.PlayNote( controller, channel, this.tones[i], volume, duration, delay );
            }
        };

    root.SPN = function( letr, octv ){
        /** includes accidental */
        this.letter = letr || "C";
        /* middle C is C4 */
        this.octave = octv || root.DEFAULT_OCTAVE;  
    };
        root.SPN.prototype.toNum = function(){
            return root.NUM_TONES * (this.octave - root.ZERO_OCTAVE) + root.ParseLetter(this.letter); // in compliance with MIDI, 0 is C-1
        };
        
        root.SPN.prototype.fromNum = function( num ){
            this.letter = music.getNoteOrder()[ mod(num, music.NUM_TONES) ];
            this.octave = Math.floor( num / music.NUM_TONES ) + root.ZERO_OCTAVE;
            return this;
        };
        
        root.SPN.prototype.toString = function(){
            return this.letter + this.octave;
        };
        
        root.SPN.prototype.fromString = function( stra ){
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
    
    root.Scale = function( sequence, name ){
        this.name = name || "unnamed scale";
        this.sequence = root.NumberizeSequence(sequence) || [];
    };
        root.Scale.prototype.toString = function(){
            return "[Scale: (" + this.name + ") {" + root.LetterizeSequence( this.sequence ) + "}]";
        }  

    root.NumberizeSequence = function(sequence){
        var cpy = sequence.slice();
        for( var i = 0; i < cpy.length; i++ ){
            if( typeof sequence[i] === 'string' ){
                cpy[i] = root.ParseLetter(sequence[i]);
            }
        }
        return cpy;
    }
    
    root.LetterizeSequence = function(sequence){
        var cpy = sequence.slice();
        for( var i = 0; i < cpy.length; i++ ){
            if( typeof sequence[i] === 'number' ){
                cpy[i] = root.getNoteOrder()[mod(sequence[i], root.NUM_TONES)];
            }
        }
        return cpy;
    }
    
    root.scales = [ // fun fact: diatonic can mean a lot of things in different contexts
        new root.Scale([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  "chromatic 12 tone"), // chromatic (all 12 tones)
        new root.Scale([0, 2, 4, 5, 7, 9, 11],                  "C major"), // diatonic C major
        new root.Scale([7, 9, 11, 0, 2, 4, 6],                  "G major"), // diatonic G major
        new root.Scale(["C","Eb","F","F#","G","Bb"],            "pentatonic minor blues C"), // they say pentatonic scales sound good even when mashing
        new root.Scale(["E","F#","G","G#","B","C#"],            "pentatonic major blues E"),
        new root.Scale([0, 2, 4, 7, 9],                         "pentatonic major from C"), 
        new root.Scale(["D","F","G","A","C"],                   "pentatonic minor from D"),
        new root.Scale(["C","C#","F","G","A#"],                 "pentatonic insen from C"), // "japanese" mode
        new root.Scale(["D","Eb","G","Ab","C"],                 "pentatonic hirajoshi from D")
    ];

    root.MusicNode = function( duration, value, parent ){
        this.duration = duration || null;
        this.parent = parent || null; // apprently naming things parent is a bad idea
        this.sequence = [];
        this.value = value || null; // wow this was confusing
        if( !value ){
            //console.log("MusicNode: value not given, initializing without value");
        }
        else{
            this.value = value;
            if(this.value instanceof root.Note){
                //console.log("MusicNode: value is a note");
                this.sequence.push(this);
            }
            else if( this.value instanceof Array ){
                //console.log("MusicNode: value is an array");
                this.reSequence();
            }
        }
    }
        
        root.MusicNode.prototype.play = function( controller, channel, volume ){
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
            else if(this.value instanceof music.Note){
                //console.log("sound", this.value);
                this.value.play( controller, channel, volume, this.getDuration(), 0);
            }
            
            if(this.domElement){
                var node = this;
                setTimeout( function(){ node.domElement.classList.remove("playing"); }, this.getDuration() * 1000 );
            }
            //console.log("completed play of ", this);
        }
        
        root.MusicNode.prototype.getDuration = function(){
            return this.duration;
        }
        
        /*
        *	useSequence argument is for when this.sequence has been filled in
        *	for faster execution of certain functions
        *   honestly though I've gotten this far without implementing it so I might as well just get rid of it
        */
        root.MusicNode.prototype.getInternalDuration = function(useSequence){
            if(!useSequence){
                console.log("unimplemented: why did you turn off useSequence");
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
            else if(this.value instanceof root.Note){
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
        root.MusicNode.prototype.addInnerNode = function( node, dNSeq ){
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
                    console.log("MusicNode (addInnerNode): skipped resequencing.");
                }
            }
            else{
                //console.log("MusicNode (addInnerNode): value is not array.");
            }
        }

        /*
        *	recursive helper, should never be called directly
        */
        root.MusicNode.prototype.reSequence = function(){
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

        root.MusicNode.prototype.getRemainingSpace = function( useSequence ){
            return this.duration - this.getInternalDuration( useSequence );
        }
        root.MusicNode.prototype.FillEvenly = function(numBeats, noReSeq){
            return root.FillEvenly(this, numBeats, noReSeq);
        }
        root.MusicNode.prototype.FillByPattern = function(pattern, noReSeq){
            return root.FillByPattern(this, pattern, noReSeq);
        }

        /*
        * 	SLList = Sequential Leaf List
        *	use to build this.sequence when it does not yet exist
        */
        root.MusicNode.prototype.getSLList = function(){
            //console.log("MusicNode (getSLList): running BFS for leaves");
            var leaves = [];
            var stack = [this];
            while(stack.length > 0){
                var node = stack.pop();
                if(!(node.value instanceof Array)){
                    if(!(node.value instanceof root.Note)){
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

    root.usableBeatVals = [ 1, 1/2, 1/4, 1/8, 1/16 ];
    root.usableBPM = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

    root.BuildBob = function( BPM, beatVal ){
        // for what this function does beatVal is probably irrelevant
        //it would have to be scaled based on what level it's on
        var rt = new root.MusicNode( BPM * beatVal );
        root.FillEvenly( rt, BPM);
        root.FillEvenly( rt.value[0], 1/beatVal);
        root.FillEvenly( rt.value[1], 3 );
        root.FillEvenly( rt.value[2], 1/beatVal);
        root.FillEvenly( rt.value[3], 8);
        return rt;
    }


    root.PATTERNS = [
        [1, 1, 1], // this one shouldn't even be necessary
        [1, 1],
        [2, 1],
        [1, 2],
        //[3, 1],
        //[1, 3], 
    ];

    root.BuildRhythm = function( BPM, patterns, minBeatDuration, complexity ){
        // need to implement minBeatDuration
        // and also just make this less dumb in several ways
        var rt = new root.MusicNode( BPM );
        for(var i = 0; i < complexity; i++){
            root.MutateRhythm(rt, patterns);
        }
        /*
        root.FillByPattern(patterns.randomChoice(), true);
        for(var i = 0; i < complexity; i++){
            var tempnode = root.value.randomChoice().FillByPattern(patterns.randomChoice(), true);
        }
        */
        rt.reSequence();
        return rt;
    }

    root.MutateRhythm = function( rhythm, patterns ){
        // make less regular!
        if( rhythm.value instanceof Array ){
            root.MutateRhythm( rhythm.value.randomChoice(), patterns );
        }
        else{
            root.ClearNode(rhythm);
            rhythm.FillByPattern( patterns.randomChoice(), false);
        }
    }

    root.ClearNode = function( node ){
        node.value = undefined;
        node.reSequence();
    }

    root.FillEvenly = function( node, numBeats, noReSeq ){
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
            node.addInnerNode( new root.MusicNode( beatlen ), noReSeq );
        }
        return node;
    }

    root.FillByPattern = function( node, pattern, noReSeq ){
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
            node.addInnerNode( new root.MusicNode( (pattern[i] / patternTotal) * space ), noReSeq );
        }
        return node;
    }

    root.Tonalize = function( node, tones ){
        var tmp_octave_range = 2;
        // fill with tones
        if(node.sequence.length > 0){
            //console.debug("node is tonalizable");
            for(var i = 0; i < node.sequence.length; i++){
                var ind = (Math.floor(Math.random() * tmp_octave_range * tones.length) - tmp_octave_range * tones.length * 1/2);
                node.sequence[i].value = new root.Note( (root.DEFAULT_OCTAVE - root.ZERO_OCTAVE) * root.NUM_TONES + tones[mod(ind, tones.length)] + root.NUM_TONES * Math.floor(ind / tones.length) ) ;
            }
        }
        else{
            console.debug("node is nontonalizable");
        }
    }
 
})(music);




//var bob = BuildBob( 4, 1/4 );

/*
breadth first? did not really work
function DispAllNodes(node, scalar, snd){
	var q = [node];
	var out = "";
	while(q.length > 0){
		node = q.shift();
		if(snd){
			out += snd(node, scalar);
		}
		if(q.length == 0){
			out += "\n";
		}
		if(node.value instanceof Array){
			for(var i = 0; i < node.value.length; i++){
				q.push(node.value[i]);
			}
			//q.push( {'NEWLINE':true} );
		}
	}
	console.log(out);
}
*/

/*
function SingleNodeDisp(node, scalar){
	if(node.NEWLINE){
		return "\n";
	}
	return "N" + "-".repeat(Math.floor(scalar*node.getDuration())-1);
}
*/





//node[ node[  node[], node[] ], node[], node[],  node=5  ]
// jajajajaja 
//while(true){
	//console.log("rohan is awesome!1")
//}
//shhhh
