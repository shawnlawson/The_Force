var midi = null; // global MIDIAccess object

function onMIDISuccess(midiAccess) {
    console.log("MIDI ready!");
    midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
    listInputsAndOutputs(midi);
}

function onMIDIFailure(msg) {
    console.log("Failed to get MIDI access - " + msg);
}

function listInputsAndOutputs(midiAccess) {
    for (var entry of midiAccess.inputs) {
        var input = entry[1];
        console.log("Input port [type:'" + input.type + "'] id:'" + input.id +
            "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
            "' version:'" + input.version + "'");
    }

    for (var entry of midiAccess.outputs) {
        var output = entry[1];
        console.log("Output port [type:'" + output.type + "'] id:'" + output.id +
            "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
            "' version:'" + output.version + "'");
    }
}

function onMIDIMessage(event) {
    var str = "MIDI message received at timestamp " + event.timestamp + "[" + event.data.length + " bytes]: ";
    for (var i = 0; i < event.data.length; i++) {
        str += "0x" + event.data[i].toString(16) + " ";
    }
    console.log(str);

    /*
     // Mask off the lower nibble (MIDI channel, which we don't care about)
     var channel = ev.data[0] & 0xf;
      switch (event.data[0] & 0xf0) {
        case 0x90:
          if (event.data[2]!=0) {  // if velocity != 0, this is a note-on message
            noteOn(event.data[1]);
            return;
          }
          // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, y'all.
        case 0x80:
          noteOff(event.data[1]);
          return;
      }
      */
}

 function noteOn(noteNumber) {
      activeNotes.push( noteNumber );
      oscillator.frequency.cancelScheduledValues(0);
      oscillator.frequency.setTargetAtTime( frequencyFromNoteNumber(noteNumber), 0, portamento );
      envelope.gain.cancelScheduledValues(0);
      envelope.gain.setTargetAtTime(1.0, 0, attack);
    }

    function noteOff(noteNumber) {
      var position = activeNotes.indexOf(noteNumber);
      if (position!=-1) {
        activeNotes.splice(position,1);
      }
      if (activeNotes.length == 0) {  // shut off the envelope
        envelope.gain.cancelScheduledValues(0);
        envelope.gain.setTargetAtTime(0.0, 0, release );
      } else {
        oscillator.frequency.cancelScheduledValues(0);
        oscillator.frequency.setTargetAtTime( frequencyFromNoteNumber(activeNotes[activeNotes.length-1]), 0, portamento );
      }
    }

function startLoggingMIDIInput(midiAccess, indexOfPort) {
    midiAccess.inputs.forEach(function(entry) { entry.onmidimessage = onMIDIMessage; });
}

function sendMiddleC(midiAccess, portID) {
    var noteOnMessage = [0x90, 60, 0x7f]; // note on, middle C, full velocity
    var output = midiAccess.outputs.get(portID);
    output.send(noteOnMessage); //omitting the timestamp means send immediately.
    output.send([0x80, 60, 0x40], window.performance.now() + 1000.0); // Inlined array creation- note off, middle C,  
    // release velocity = 64, timestamp = now + 1000ms.
}

window.addEventListener('load', function() {
    if (navigator.requestMIDIAccess)
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    // System Exclusive? 
    // navigator.requestMIDIAccess( { sysex: true } ).then( onMIDISuccess, onMIDIFailure );
});
