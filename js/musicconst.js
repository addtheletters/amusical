var music = music || {};

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
})(music);
