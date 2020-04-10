var gain = new Filter("Gain (Volume)");
gain.createNumberParam("Gain Increase", 0);
var speed = new Filter("Speed");
speed.createNumberParam("Multiplier", 1);
var reverb = new Filter("Reverb");
reverb.createDropdownParam("Location", ["Tunnel", "Tunnel2", "Stadium"]);
var eqFilter = new Filter("EQ Filter");
eqFilter.createDropdownParam("Type", ["Lowpass", "Highpass", "Bandpass", "Lowshelf", "Highshelf", "Peaking", "Notch", "Allpass"]);
eqFilter.createNumberParam("Frequency", 500);
eqFilter.createNumberParam("Q", 10);
eqFilter.createNumberParam("Gain", 0);
eqFilter.createCaption("<a target='_blank' href=https://webaudioapi.com/samples/frequency-response/>More Info</a>");
var bassBoost = new Filter("Bass Boost");
bassBoost.createNumberParam("Intensity", 0);
var allFilters = [gain, speed, reverb, eqFilter, bassBoost];

function compile() {
    console.log("compile called");
    //creates the audio bar
    var fileInput = document.getElementById("audio-input-button");
    switch (fileOrRecording) {
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
    fileReader.onload = function (ev) {
        audioCtx.decodeAudioData(ev.target.result).then(function (buffer) {
            var offlineAudioCtx = new OfflineAudioContext({
                numberOfChannels: 2,
                length: speed.getChecked() ? (44100 * buffer.duration) / speed.allParams["Multiplier"].getValue() : 44100 * buffer.duration,
                sampleRate: 44100,
            });
            var soundSource = offlineAudioCtx.createBufferSource();
            soundSource.buffer = buffer;

            var allCheckedFilters = [];
            for (var filter in allFilters) {
                if (allFilters[filter].getChecked()) {
                    allCheckedFilters.push(allFilters[filter]);
                }
            }
            
            var filterPromiseList = [];
            for (var filter in allCheckedFilters) {

                //Prints all the parameters
                console.log(allCheckedFilters[filter].allParams);
                for (var param in allCheckedFilters[filter].allParams){
                    console.log(param + ": " + allCheckedFilters[filter].allParams[param].getValue());
                }

                var promise = enable(allCheckedFilters[filter], soundSource, offlineAudioCtx);
                filterPromiseList.push(promise);
            }
            

            Promise.all(filterPromiseList).then(nodes => {
                console.log(nodes);
                var filteredNodes = nodes.filter(x => x != undefined);
                filteredNodes.push(offlineAudioCtx.destination);
                filteredNodes.unshift(soundSource);
                console.log(filteredNodes);

                for (var nodeIndex = 0; nodeIndex <= filteredNodes.length - 2; nodeIndex++){
                    filteredNodes[nodeIndex].connect(filteredNodes[nodeIndex + 1]);
                }

                console.log("onload called!");
                soundSource.start(0); // Added by Russell - Shoutout Russell 

                offlineAudioCtx.startRendering().then(function (renderedBuffer) {
                    make_download(renderedBuffer, offlineAudioCtx.length);
                });
            });
        });

    }

    fileReader.readAsArrayBuffer(file);

    function enable(filter, soundSource, offlineAudioCtx) {
        return new Promise((resolve, reject) => {
            switch (filter.filterDisplayName) {
                case "Gain (Volume)":
                    var gainNode = offlineAudioCtx.createGain();
                    gainNode.gain.value = filter.allParams["Gain Increase"].getValue();

                    resolve(gainNode);
                    break;
                case "Speed":
                    //Speed does not return a node
                    soundSource.playbackRate.value = filter.allParams["Multiplier"].getValue();
                    resolve();
                    break;
                case "Reverb":
                    var request = new XMLHttpRequest();
                    var url = filter.allParams["Location"].getValue() + ".wav";

                    request.open("GET", url, true);
                    request.responseType = 'arraybuffer'
                    request.onload = function (ev) {

                        offlineAudioCtx.decodeAudioData(request.response).then(function (buffer) {
                            var convolverNode = offlineAudioCtx.createConvolver();
                            convolverNode.buffer = buffer;

                            resolve(convolverNode);
                        });
                    }
                    request.send(null);
                    break;
                case "EQ Filter":
                    var biquadFilter = offlineAudioCtx.createBiquadFilter();
                    biquadFilter.frequency.value = filter.allParams["Frequency"].getValue();
                    biquadFilter.Q.value = filter.allParams["Q"].getValue();
                    biquadFilter.gain.value = filter.allParams["Gain"].getValue();
                    biquadFilter.type = filter.allParams["Type"].getValue().toLowerCase();

                    resolve(biquadFilter);
                    break;

                case "Bass Boost":
                    var BassBoostFilter = offlineAudioCtx.createBiquadFilter();
                    BassBoostFilter.frequency.value = 400;
                    BassBoostFilter.gain.value = filter.allParams["Intensity"].getValue();
                    BassBoostFilter.type = "lowshelf";

                    resolve(BassBoostFilter);
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
            channels = [],
            i, sample,
            offset = 0,
            pos = 0;

        // write WAVE header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this demo)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        //write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) { // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(pos, sample, true); // write 16-bit sample
                pos += 2;
            }
            offset++ // next source sample
        }

        // create Blob
        return new Blob([buffer], {
            type: "audio/wav"
        });

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