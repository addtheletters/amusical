

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

var NUM_TONES = 12;
var DEFAULT_OCTAVE = 4;

var note_order = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function getNoteOrder(){
    return note_order;
}

var letter_vals = {
    "C":0,
    "D":2,
    "E":4,
    "F":5,
    "G":7,
    "A":9,
    "B":11
};

var accidental_vals = {
    "#":1, // easier to type
    "b":-1,
    "♯":1, // actual character
    "♭":-1,
    "♮":0 // for completeness
};

function ParseLetter( letr ){
    if(letr.length < 1){
        console.log("unable to parse letter notation");
        return;
    }
    var base = letr[0];
    var accd = letr.slice(1);
    // supports multiple stacking accidentals
    var modifier = accd.split("").sum(function( acc ){
        return accidental_vals[acc] || 0;
    });
    return letter_vals[base] + modifier;
}

function mod(a, b){
    return ((a % b) + b) % b;
}

var Note = function( arg ){
    if( typeof arg === 'string' ){
        this.fromSPN(new SPN().fromString(arg));
    }
    else if( typeof arg === 'number'){
        this.num = arg;
    }
    else{
        console.debug("note initialized to default middle-C");
        //console.log("arg was")
        //console.log(arg)
        this.num = 0;
    }
};
	Note.prototype.toString = function(){
		return "[Note: num(" + this.num + "), SPN("+ this.toSPN() +")]";// dur(" + this.duration + ")]";
	};
    
    /** scientific pitch notation: https://en.wikipedia.org/wiki/Scientific_pitch_notation */
    Note.prototype.toSPN = function(){
        return new SPN().fromNum(this.num);
    };
    
    Note.prototype.fromSPN = function( spn ){
        this.num = spn.toNum();
    };
    

function SPN( letr, octv ){
    /** includes accidental */
    this.letter = letr || "C";
    /* middle C is C4 */
    this.octave = octv || 4;  
};
    SPN.prototype.toNum = function(){
        return NUM_TONES * (this.octave - DEFAULT_OCTAVE) + ParseLetter(this.letter); // assumes 0 is middle-C
    };
    
    SPN.prototype.fromNum = function( num ){
        this.letter = getNoteOrder()[ mod(num, NUM_TONES) ];
        this.octave = Math.floor( num / NUM_TONES ) + DEFAULT_OCTAVE;
        return this;
    };
    
    SPN.prototype.toString = function(){
        return this.letter + this.octave;
    };
    
    SPN.prototype.fromString = function( stra ){
        var pivot = stra.search(/\d+/g, "")
        this.letter = stra.slice(0, pivot);
        this.octave = parseInt( stra.slice(pivot) );
        return this;
    };
    
// time for scales and stuff
// 
var scales = [ // fun fact: diatonic can mean a lot of things in different contexts
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // chromatic (all 12 tones)
    [0, 2, 4, 5, 7, 9, 11], // diatonic C major
    [7, 9, 11, 0, 2, 4, 6], // diatonic G major
    [0, 2, 4, 7, 9] // pentatonic major from C 
];

function NumberizeScale(scale){
    var cpy = scale.slice();
    for( var i = 0; i < cpy.length; i++ ){
        if( typeof scale[i] === 'string' ){
            cpy[i] = ParseLetter(scale[i]);
        }
    }
    return cpy;
}

function MusicNode( duration, value, parent ){
	this.duration = duration || null;
	this.parent = parent || null;
	this.sequence = [];
	if( !value ){
		//console.log("MusicNode: value not given, initializing without value");
	}
	else{
		this.value = value;
		if(this.value instanceof Note){
			//console.log("MusicNode: value is a note");
			this.sequence.push(this);
		}
		else if( this.value instanceof Array ){
			//console.log("MusicNode: value is an array");
			this.reSequence();
		}
	}
}

	// effect functions won't work like this
	// are placeholder
	MusicNode.prototype.effect = function(){
		// play sound
		if(this.value instanceof Note){
			console.log(this.value);
		}
		else if( this.value instanceof Array ){
			for(var i = 0; i < this.value.length; i++){
				this.value[i].effect();
			}
		}
	}

	MusicNode.prototype.sequentialEffect = function(){
		for(var i = 0; i < this.sequence.length; i++){
			this.sequence[i].effect();
		}
	}


	MusicNode.prototype.getDuration = function(){
		return this.duration;
	}
	
	// why did I have this function? it seems like it would be a terrible idea.
	/*
	MusicNode.prototype.setDuration = function(duration){
		this.duration = duration;
	}
	*/
	/*
	*	useSequence argument is for when this.sequence has been filled in
	*	for faster execution of certain functions
	*/
	MusicNode.prototype.getInternalDuration = function(useSequence){
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
		else if(this.value instanceof Note){
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
	MusicNode.prototype.addInnerNode = function( node, dNSeq ){
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
				//console.log("MusicNode (addInnerNode): skipped resequencing.");
			}
		}
		else{
			//console.log("MusicNode (addInnerNode): value is not array.");
		}
	}

	/*
	*	recursive helper, should never be called directly
	*/
	MusicNode.prototype.reSequence = function(){
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

	MusicNode.prototype.getRemainingSpace = function( useSequence ){
		return this.duration - this.getInternalDuration( useSequence );
	}
	MusicNode.prototype.FillEvenly = function(numBeats, noReSeq){
		return FillEvenly(this, numBeats, noReSeq);
	}
	MusicNode.prototype.FillByPattern = function(pattern, noReSeq){
		return FillByPattern(this, pattern, noReSeq);
	}

	/*
	* 	SLList = Sequential Leaf List
	*	use to build this.sequence when it does not yet exist
	*/
	MusicNode.prototype.getSLList = function(){
		//console.log("MusicNode (getSLList): running BFS for leaves");
		var leaves = [];
		var stack = [this];
		while(stack.length > 0){
			var node = stack.pop();
			if(!(node.value instanceof Array)){
				if(!(node.value instanceof Note)){
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

var usableBeatVals = [ 1, 1/2, 1/4, 1/8, 1/16 ];
var usableBPM = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

function BuildBob( BPM, beatVal ){
	// for what this function does beatVal is probably irrelevant
	//it would have to be scaled based on what level it's on
	var root = new MusicNode( BPM * beatVal );
	FillEvenly(root, BPM);
	FillEvenly( root.value[0], 1/beatVal);
	FillEvenly( root.value[1], 3 );
	FillEvenly( root.value[2], 1/beatVal);
	FillEvenly( root.value[3], 8);
	return root;
}


var PATTERNS = [
	[1, 1, 1], // this one shouldn't even be necessary
	[1, 1],
	[2, 1],
	[1, 2],
	//[3, 1],
	//[1, 3], 
];

function BuildRhythm( BPM, patterns, minBeatDuration, complexity ){
	// need to implement minBeatDuration
	// and also just make this less dumb in several ways
	var root = new MusicNode( BPM );
	for(var i = 0; i < complexity; i++){
		MutateRhythm(root, patterns);
	}
	/*
	root.FillByPattern(patterns.randomChoice(), true);
	for(var i = 0; i < complexity; i++){
		var tempnode = root.value.randomChoice().FillByPattern(patterns.randomChoice(), true);
	}
	*/
	root.reSequence();
	return root;
}

function MutateRhythm( rhythm, patterns ){
	// make less regular!
	if( rhythm.value instanceof Array ){
		MutateRhythm( rhythm.value.randomChoice(), patterns );
	}
	else{
		ClearNode(rhythm);
		rhythm.FillByPattern( patterns.randomChoice(), true);
	}
}

function ClearNode( node ){
	node.value = undefined;
	node.reSequence();
}

function FillEvenly( node, numBeats, noReSeq ){
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
		node.addInnerNode( new MusicNode( beatlen ), noReSeq );
	}
	return node;
}

function FillByPattern( node, pattern, noReSeq ){
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
		node.addInnerNode( new MusicNode( (pattern[i] / patternTotal) * space ), noReSeq );
	}
	return node;
}

function Tonalize( node, scale ){
    var tmp_octave_range = 4;
	// fill with tones
	if(node.sequence.length > 0){
		//console.debug("node is tonalizable");
		for(var i = 0; i < node.sequence.length; i++){
            // TODO: this doesn't do multioctaves anymore with the scales (because of the moduluo)
            var ind = mod( (Math.floor(Math.random() * tmp_octave_range * scale.length) - tmp_octave_range * scale.length * 1/2), scale.length);
			node.sequence[i].value = new Note( scale[ind] ) ;
		}
	}
	else{
		console.debug("node is nontonalizable");
	}
}

String.prototype.repeat = function( num ){
	if(num <= 0){
		return "";
	}
    return new Array( num + 1 ).join( this );
}


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
}

Array.prototype.randomChoice = function(){
	return this[Math.floor( Math.random() * this.length )];
}

Array.prototype.injectArray = function( index, arr ) {
    return this.slice( 0, index ).concat( arr ).concat( this.slice( index ) );
};


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