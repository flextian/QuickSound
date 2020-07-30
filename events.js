var fileOrRecording;
var recordingFile;

var startRecordingButton = document.getElementById("record-start");
startRecordingButton.addEventListener("click", function (ev) {

    navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        })
        .then(function (mediaStreamObj) {
            var mediaRecorder = new MediaRecorder(mediaStreamObj);
            var chunks = [];
            mediaRecorder.start();
            startRecordingButton.textContent = "Stop Recording"

            startRecordingButton.addEventListener("click", function () {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                    startRecordingButton.textContent = "Start Recording"
                } else {
                    mediaRecorder.start();
                    startRecordingButton.textContent = "Stop Recording"
                }
            });

            mediaRecorder.ondataavailable = function (ev) {
                chunks.push(ev.data);
            }

            mediaRecorder.onstop = function (ev) {
                var div = document.getElementById("input-audio");
                div.innerHTML = "";
                recordingFile = new Blob(chunks, {
                    'type': 'audio/mp3'
                });
                var blobUrl = window.URL.createObjectURL(recordingFile);
                var recordAudioBar = document.createElement("audio");
                recordAudioBar.src = blobUrl;
                recordAudioBar.controls = true;
                div.appendChild(recordAudioBar);
                chunks = [];
                fileOrRecording = 1;
            }

        });

    ev.target.removeEventListener(ev.type, arguments.callee);

});

var fileInputButton = document.getElementById("audio-input-button");
fileInputButton.addEventListener("change", function (ev) {
    var div = document.getElementById("input-audio");
    div.innerHTML = "";

    var fileAudioBar = document.createElement("audio");
    fileAudioBar.controls = true;
    fileAudioBar.src = URL.createObjectURL(fileInputButton.files[0]);
    div.appendChild(fileAudioBar);
});

fileInputButton.addEventListener("click", function (ev) {
    fileOrRecording = 0;
});