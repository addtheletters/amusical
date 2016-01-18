# amusical
An artificial, tempermental, often terrible muse. 

This project is in its infancy; ultimately, the goal is to have a program capable of pleasant musical composition. As time is found for more research and thinking, more will be added.

tech progress: http://addtheletters.github.io/amusical/

on deck:
- ~~MIDI.js for making it actually play the tunes~~ ~~integrated! now just need to implement auto-play~~
- ~~replacing canvas display with an interactive HTML output~~ ~~works, though not exactly as originally intended~~
- actual fake composition based on combinations of shorter segments
    - make use of scales founded on actual sequence (up and down jumps by certain distances rather than set tones)
    - shift note-playing to 'effect' methods of notes
    - add chords (extension of 'note' so polymorphism can help?)

now with the aid of
- [MIDI.js](https://github.com/mudcube/MIDI.js)
- various associated libraries, see MIDI.js repo
