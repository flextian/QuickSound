function compile() {
    console.log("compile called");
    //creates the audio bar
    var fileInput = document.getElementById("audio-input-button");

    var audioCtx = new AudioContext();
    var fileReader = new FileReader();
    var file = fileInput.files[0];
    fileReader.onload = function (ev) {
        audioCtx.decodeAudioData(ev.target.result).then(function (buffer) {
            var touch = new SoundTouch();
        });

    }

    fileReader.readAsArrayBuffer(file);
}