
var Note = function( index ){
	this.num = index;
};
	//Note.prototype.toString = function(){
		//return "[Note: num(" + this.num + "), dur(" + this.duration + ")]";
	//}

function MusicNode( duration, value, parent ){
	this.duration = duration || null;
	this.parent = parent || null;
	this.sequence = [];
	if( !value ){
		console.log("MusicNode: value not given, initializing without value");
	}
	else{
		this.value = value;
		if(this.value instanceof Note){
			console.log("MusicNode: value is a note");
			this.sequence.push(this);
		}
		else if( this.value instanceof Array ){
			console.log("MusicNode: value is an array");
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
	MusicNode.prototype.setDuration = function(duration){
		this.duration = duration;
	}

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
			console.log("MusicNode (getInternalDuration) internal duration unavailable, returning 0.");
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
				console.log("MusicNode (addInnerNode): skipped resequencing.");
			}
		}
		else{
			console.log("MusicNode (addInnerNode): value is not array.");
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

		this.sequence = this.getSLList();
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
		var leaves = [];
		var stack = [this];
		while(stack.length > 0){
			var node = stack.pop();
			if(!(node.value instanceof Array)){
				if(!(node.value instanceof Note)){
					console.log("MusicNode (getSLList): Tried to get leaves / as leaf an unset node.");
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
	[1, 1, 1],
	[1, 1],
	//[2, 1],
	//[1, 2],
	//[3, 1],
	//[1, 3], 
];

function BuildRhythm( BPM, patterns, minBeatDuration, complexity ){
	// need to implement minBeatDuration
	// and also just make this less dumb in every way
	var root = new MusicNode( BPM );
	root.FillByPattern(patterns.randomChoice(), true);
	for(var i = 0; i < complexity; i++){
		var tempnode = root.value.randomChoice().FillByPattern(patterns.randomChoice(), true);
	}
	root.reSequence();
	return root;
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