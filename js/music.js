
var music = music || {};

(function(lib){
    
    lib.scales = [ // fun fact: diatonic can mean a lot of things in different contexts
        new lib.Scale([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  "chromatic 12 tone"), // chromatic (all 12 tones)
        new lib.Scale([0, 2, 4, 5, 7, 9, 11],                  "C major"), // diatonic C major
        new lib.Scale([7, 9, 11, 0, 2, 4, 6],                  "G major"), // diatonic G major
        new lib.Scale(["C","Eb","F","F#","G","Bb"],            "minor blues C"), // they say pentatonic scales sound good even when mashing
        new lib.Scale(["E","F#","G","G#","B","C#"],            "major blues E"),
        new lib.Scale([0, 2, 4, 7, 9],                         "pentatonic major from C"), 
        new lib.Scale(["D","F","G","A","C"],                   "pentatonic minor from D"),
        new lib.Scale(["C","C#","F","G","A#"],                 "pentatonic insen from C"), // "japanese" mode
        new lib.Scale(["D","Eb","G","Ab","C"],                 "pentatonic hirajoshi from D")
    ];
    
    lib.scaleClasses = [
        //new lib.ScaleClass([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "chromatic", function(sc, k){return sc.name;}),
        new lib.ScaleClass([2, 2, 1, 2, 2, 2], "major"), // the final step is implied to be the return to the root / key of the scale
        new lib.ScaleClass([2, 1, 2, 2, 1, 2], "natural minor"),
        new lib.ScaleClass([2, 1, 2, 2, 1, 3], "harmonic minor"),
        new lib.ScaleClass([2, 1, 2, 2, 2, 2], "melodic minor", null, [0, 0, 0, 0, 0, -1, -1]),
        new lib.ScaleClass([2, 2, 3, 2], "pentatonic major"),
        new lib.ScaleClass([3, 2, 2, 3], "pentatonic minor")
    ];
    
    lib.CreateFillers = function(sc, key){
        var ret = [];
        var base_scale = sc.build(key);
       
        ret.push(base_scale);
        ret.push(base_scale.getReverse());
        
        if( lib.IsXTonic(7, base_scale) ){
            console.debug("Base scale for fillers is diatonic.");
            var cc_major = sc.extractChordClass([1, 3, 5], "triad");
            ret.push(cc_major.build(key));
        }
        
        if( lib.IsXTonic(5, base_scale) ){
            console.debug("Base scale for fillers is pentatonic.");
            // pentatonics can sound good jumping from a note to any other
            ret.push( new lib.ToneGroup(base_scale.pickTones(), base_scale.name + " deordered") );
        }
        
        return ret;
    };
    
    lib.BuildRhythm = function( duration, patterns, complexity ){
        // need to implement minBeatDuration
        // and also just make this less dumb in several ways
        var rt = new lib.MusicNode( duration );
        for(var i = 0; i < complexity; i++){
            lib.MutateRhythm(rt, patterns);
        }
        
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
            console.log("fill: pattern is invalid", pattern);
        }
        var patternTotal = pattern.sum();
        for(var i = 0; i < pattern.length; i++){
            node.addInnerNode( new lib.MusicNode( (pattern[i] / patternTotal) * space ), noReSeq );
        }
        return node;
    };

    lib.RandomTonalize = function( node, tones ){
        var tmp_octave_range = 2;
        for(var i = 0; i < node.sequence.length; i++){
            var ind = (Math.floor(Math.random() * tmp_octave_range * tones.length) - tmp_octave_range * tones.length * 1/2);
            node.sequence[i].value = new lib.Note( lib.ShiftOctave( tones[mod(ind, tones.length)], lib.DEFAULT_OCTAVE + Math.floor(ind / tones.length) ) ) ;
        }
    };
    
    // algo goes top to bottom choosing a 'root' tone for node in *value* order
    // these root tones are assigned according to scales / chord sequences, chords can jump randomly but scales must be ordered?
    // then each child is gone into, and a similar process can occur using the assigned 'root' as the base for scale or chord choice
    lib.ScaleTonalize = function( node, fillers ){
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
