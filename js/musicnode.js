var music = music || {};

(function(lib){
    
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
                    this.reSequence();
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
            // until all are fixed. Currently, it functions properly, but is
            // very far away in efficiency from the optimal method. 
            // If speed becomes a concern, implementing a faster resequence
            // could be useful. Probably will need to review some Algo coursework to achieve that, though.
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
        
        lib.MusicNode.prototype.Tune = function( tone ){
            if( !this.isLeaf() ){
                this.setStructuralKey(tone);
            }
            else{
                // this.value should be non-array. perhaps also empty array? though that implies intent to fill later
                //console.log("Tune: tuning to", tone);
                this.value = new lib.Note( tone );
            }
        }
        
        lib.MusicNode.prototype.ToneFill = function(filler, noRandomDuplicates){
            if( this.isLeaf() ){
                console.debug("MusicNode: ToneFill: node is a leaf, filling with filler key");
                this.Tune( lib.ShiftOctave(this.getKey()));
                return;
            }
            
            var tns;
            if( filler.ordered ){
                tns = filler.continueFrom( filler.findTone(this.getKey(), true), this.value.length, true );
                
                for( var i = 0; i < this.value.length; i++){
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
        
})(music);