class Filter{

    constructor(name){
        this.name = name;
        this.allParams = {};

        // This is the overall div that the filter is in
        var filterDiv = document.createElement("div");
        filterDiv.className = "item";

        // This div will contain all the parameters
        // ID Example: Gain-param
        this.paramDiv = document.createElement("div");
        this.paramDiv.id = this.name + "-param";

        // Checkbox to enable the filter
        // ID Example: Gain-checkbox
        this.checkbox = document.createElement("input");
        this.checkbox.type = "checkbox";
        this.checkbox.id = this.name + "-checkbox";
        // Name of the filter
        var label = document.createElement("label");
        label.htmlFor = this.checkbox.id;
        label.textContent = this.name;

        filterDiv.appendChild(this.checkbox);
        filterDiv.appendChild(label);
        filterDiv.appendChild(this.paramDiv);

        document.getElementsByClassName("wrapper")[0].appendChild(filterDiv);
    }

    getChecked(){
        return this.checkbox.checked;
    }

    createNumberParam(paramName, defaultNum) {
        var param = new NumberParam(paramName, defaultNum, this.name);
        this.allParams[paramName] = param
        console.log(this.allParams);
    }
}

class NumberParam {
    constructor(paramName, defaultNum, filterName){
        var paramLabel = document.createElement("label");
        paramLabel.htmlFor = this.name + "-" + paramName;
        paramLabel.textContent = paramName;
        
        // ID Example: Gain-Value
        this.inputBox = document.createElement("input");
        this.inputBox.type = "number";
        this.inputBox.value = defaultNum;
        this.inputBox.id = this.name + "-" + paramName;

        document.getElementById(filterName + "-param").appendChild(paramLabel);
        document.getElementById(filterName + "-param").appendChild(this.inputBox);
    }

    getValue(){
        return this.inputBox.value;
    }
}

var gain = new Filter("Gain");
gain.createNumberParam("Gain Value", 1);
var allFilters = [gain]

function compile(){
    //creates the audio bar
    var fileInput = document.getElementById("audio-input-button");
    var file = fileInput.files[0];
    var audioCtx = new AudioContext();
    var fileReader = new FileReader();
    fileReader.onload = function(ev){
        audioCtx.decodeAudioData(ev.target.result).then(function(buffer){
            var offlineAudioCtx = new OfflineAudioContext({
                numberOfChannels: 2,
                length: 44100 * buffer.duration,
                sampleRate: 44100,
            });
            var soundSource = offlineAudioCtx.createBufferSource();
            soundSource.buffer = buffer;

            var allCheckedFilters = [];
            for (var filter in allFilters){
                if (allFilters[filter].getChecked()){
                    allCheckedFilters.push(allFilters[filter]);
                }
            }
            
            console.log(allCheckedFilters.length);

            if (allCheckedFilters.length === 0){
                soundSource.connect(offlineAudioCtx.destination);
            }
            else{
                for (var filter in allCheckedFilters){
                    enable(allCheckedFilters[filter], soundSource, offlineAudioCtx);
                }
            }

            soundSource.start(0);  // Added by Russell - Shoutout Russell 
            
            offlineAudioCtx.startRendering().then(function(renderedBuffer) {
                console.log("onload called");
                make_download(renderedBuffer, offlineAudioCtx.length);
            });
        });
    }

    fileReader.readAsArrayBuffer(file);

    function enable(filter, soundSource, offlineAudioCtx){
        switch(filter.name){
            case "Gain":
                var gainNode = offlineAudioCtx.createGain();
                gainNode.gain.value = filter.allParams["Gain Value"].getValue();
                soundSource.connect(gainNode);
                gainNode.connect(offlineAudioCtx.destination);
                break;
        }
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

