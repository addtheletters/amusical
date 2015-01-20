
var Note = function( index ){
	this.num = index;
};
	//Note.prototype.toString = function(){
		//return "[Note: num(" + this.num + "), dur(" + this.duration + ")]";
	//}


function MusicNode( duration, value ){
	this.duration = duration;
	if( !value ){
		console.log("MusicNode: value not given, initializing without value");
	}
	else{
		this.value = value;
		if(this.value instanceof Note){
			console.log("MusicNode: value is a note");
		}
		else if( this.value instanceof Array ){
			console.log("MusicNode: value is an array");
		}
	}
}
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
	MusicNode.prototype.getDuration = function(){
		return this.duration;
	}
	MusicNode.prototype.setDuration = function(duration){
		this.duration = duration;
	}
	MusicNode.prototype.getInternalDuration = function(){
		if(this.value instanceof Array){
			var temp = 0;
			for(var i = 0; i < this.value.length; i++){
				temp += this.value[i].getDuration();
			}
			return temp;
		}
		else if(this.value instanceof Note){
			return this.getDuration();
		}
		else{
			console.log("MusicNode internal duration unavailable, returning 0.");
			return 0;//this.getDuration();
		}
	}
	MusicNode.prototype.addInnerNode = function( node ){
		if(!this.value){
			this.value = [];
		}
		if(this.value instanceof Array){
			this.value.push(node);
		}
		else{
			console.log("MusicNode value is not array.");
		}
	}
	MusicNode.prototype.getRemainingSpace = function(){
		return this.duration - this.getInternalDuration();
	}
	MusicNode.prototype.FillEvenly = function(numBeats){
		return FillEvenly(this, numBeats);
	}
	MusicNode.prototype.FillByPattern = function(pattern){
		return FillByPattern(this, pattern);
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
	[2, 1],
	[1, 2],
	[3, 1],
	[1, 3], 
];

function BuildRhythm( BPM, patterns, minBeatDuration, complexity ){
	var root = new MusicNode( BPM );
	root.FillByPattern(patterns.randomChoice());
	for(var i = 0; i < complexity; i++){
		var tempnode = root.value.randomChoice().FillByPattern(patterns.randomChoice());
	}
	return root;
}

function FillEvenly( node, numBeats ){
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
		node.addInnerNode( new MusicNode( beatlen ) );
	}
	return node;
}

function FillByPattern(node, pattern){
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
		node.addInnerNode( new MusicNode( (pattern[i] / patternTotal) * space ) );
	}
	return node;
}

String.prototype.repeat = function( num )
{
	if(num <= 0){
		return "";
	}
    return new Array( num + 1 ).join( this );
}


Array.prototype.sum = function(){
	var total = 0;
	for(var i=0,n=this.length; i<n; ++i)
	{
	    total += this[i];
	}
	return total;
}

Array.prototype.randomChoice = function(){
	return this[Math.floor( Math.random() * this.length )];
}


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