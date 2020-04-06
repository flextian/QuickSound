var gain = new Filter("Gain (Volume)");
gain.createNumberParam("Gain Increase", 1);
var speed = new Filter("Speed");
speed.createNumberParam("Multiplier", 1);
var reverb = new Filter("Reverb");
var allFilters = [gain, speed, reverb]

function compile(){
    //creates the audio bar
    var fileInput = document.getElementById("audio-input-button");
    switch (fileOrRecording){
        // If using file from file input
        case 0:
            var file = fileInput.files[0];
            break;
        // If using file from recording
        case 1:
            var file = recordingFile;
            break;
    }
    var audioCtx = new AudioContext();
    var fileReader = new FileReader();
    fileReader.onload = function(ev){
        audioCtx.decodeAudioData(ev.target.result).then(function(buffer){
            var offlineAudioCtx = new OfflineAudioContext({
                numberOfChannels: 2,
                length: speed.getChecked() ? (48000 * buffer.duration) / speed.allParams["Multiplier"].getValue() : 48000 * buffer.duration,
                sampleRate: 48000,
            });
            var soundSource = offlineAudioCtx.createBufferSource();
            soundSource.buffer = buffer;

            var allCheckedFilters = [];
            for (var filter in allFilters){
                if (allFilters[filter].getChecked()){
                    allCheckedFilters.push(allFilters[filter]);
                }
            }
            
            var filterPromiseList = [];
            soundSource.connect(offlineAudioCtx.destination);
            for (var filter in allCheckedFilters){
                var promise = enable(allCheckedFilters[filter], soundSource, offlineAudioCtx);
                filterPromiseList.push(promise);
            }

            Promise.all(filterPromiseList).then(values => {
                console.log(values);
                console.log("onload called!");
                soundSource.start(0);  // Added by Russell - Shoutout Russell 
                
                offlineAudioCtx.startRendering().then(function(renderedBuffer) {
                    make_download(renderedBuffer, offlineAudioCtx.length);
                });
            });
        });

    }

    fileReader.readAsArrayBuffer(file);

    function enable(filter, soundSource, offlineAudioCtx){
        return new Promise((resolve, reject) => {
            switch(filter.name){
                case "Gain (Volume)":
                    var gainNode = offlineAudioCtx.createGain();
                    gainNode.gain.value = filter.allParams["Gain Increase"].getValue();
                    soundSource.connect(gainNode);
                    gainNode.connect(offlineAudioCtx.destination);
                    resolve("Gain Finished");
                    break;
                case "Speed":
                    soundSource.playbackRate.value = filter.allParams["Multiplier"].getValue();
                    resolve("Speed Finished");
                    break;
                case "Reverb":
                    var request = new XMLHttpRequest();
                    request.open("GET", "impulse2.wav", true);
                    request.responseType = 'arraybuffer'
                    request.onload = function (ev) {

                        offlineAudioCtx.decodeAudioData(request.response).then(function(buffer){
                            var convolver = offlineAudioCtx.createConvolver();
                            convolver.buffer = buffer;
        
                            soundSource.connect(convolver);
                            convolver.connect(offlineAudioCtx.destination);
                            resolve("Reverb Finished");
                        });
                    }
                    request.send(null);
                    break;
            }
        });
    }

    function make_download(abuffer, total_samples) {
        var newFile = URL.createObjectURL(bufferToWave(abuffer, total_samples));
    
        var audioBar = document.createElement("audio");
        audioBar.controls = true;
        audioBar.src = newFile;
    
        var outputArea = document.getElementById("output");
        outputArea.innerHTML = "";
        outputArea.append(audioBar);
    }
    
    function generateFileName() {
        var origin_name = file.name;
        var pos = origin_name.lastIndexOf('.');
        var no_ext = origin_name.slice(0, pos);
    
        return no_ext + ".compressed.wav";
    }
    
    function bufferToWave(abuffer, len) {
        var numOfChan = abuffer.numberOfChannels,
            length = len * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [], i, sample,
            offset = 0,
            pos = 0;
                
        // write WAVE header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"
    
        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit (hardcoded in this demo)
    
        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length
    
        //write interleaved data
        for(i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));
    
        while(pos < length) {
            for(i = 0; i < numOfChan; i++){                                        // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][offset]));            // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;    // scale to 16-bit signed int
                view.setInt16(pos, sample, true);                                   // write 16-bit sample
                pos += 2;
            }
            offset++                                                                // next source sample
        }
    
      // create Blob
        return new Blob([buffer], {type: "audio/wav"});
    
        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }
    
        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }
}