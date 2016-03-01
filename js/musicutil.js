var music = music || {};

// utility stuff here. Good structuring would have these placed somewhere much better. Eh.
// TODO make these util just part of the library as lib.NAME functions?

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
    
})(music);