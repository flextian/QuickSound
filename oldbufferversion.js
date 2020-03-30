class Filter{

    static allFilters = [];

    constructor(name){
        Filter.allFilters.push(name);
        this.name = name;
        this.allParams = [];
        // This div will contain all the parameters
        // ID Example: Gain-param
        this.paramDiv = document.createElement("div");
        this.paramDiv.id = this.name + "-param";

        // This is the overall div that the filter is in
        var filterDiv = document.createElement("div");
        filterDiv.className = "item";

        // Checkbox and label for filter
        // ID Example: Gain-checkbox
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = this.name + "-checkbox";
        var label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = this.name;

        filterDiv.appendChild(checkbox);
        filterDiv.appendChild(label);
        filterDiv.appendChild(this.paramDiv);

        document.getElementsByClassName("wrapper")[0].appendChild(filterDiv);
    }
    createNumberParam(paramName, defaultNum) {
        var paramLabel = document.createElement("label");
        paramLabel.htmlFor = this.name + "-" + paramName;
        paramLabel.textContent = paramName;
        
        // ID Example: Gain-Value
        var inputBox = document.createElement("input");
        inputBox.type = "number";
        inputBox.value = defaultNum;
        inputBox.id = this.name + "-" + paramName;

        document.getElementById(this.name + "-param").appendChild(paramLabel);
        document.getElementById(this.name + "-param").appendChild(inputBox);

        this.allParams.push(paramName);
    }
    static run(EnabledFilters, context, audioSource){
        for (var filter in EnabledFilters){
            var gainNode = context.createGain();
            audioSource.connect(gainNode);
            gainNode.gain.value = 10;
            gainNode.connect(context.destination);
            
        }
    }
}

var gain = new Filter("Gain");
gain.createNumberParam("Value", 0);

function compile(){
    //creates the audio bar
    var fileInput = document.getElementById("audio-input-button");
    var file = fileInput.files[0];

    var audioBar = document.createElement("audio");

    audioBar.src = window.URL.createObjectURL(file);
    audioBar.controls = true;

    var allCheckedFilters = [];
    for (var filter in Filter.allFilters){
        if (document.getElementById(Filter.allFilters[filter] + "-checkbox").checked){
            allCheckedFilters.push(Filter.allFilters[filter]);
        }
    }

    var fileReader = new FileReader();
    var context = new AudioContext();

    fileReader.onloadend = function(){
        arrayBuffer = fileReader.result;    
        context.decodeAudioData(arrayBuffer, function(buffer){
            var offlineAudioCtx = new OfflineAudioContext({
                numberOfChannels: 2,
                length: 44100 * buffer.duration,
                sampleRate: 44100,
            });
            var sound = offlineAudioCtx.createBufferSource();
            sound.buffer = buffer;
            var gainNode = offlineAudioCtx.createGain();
            gainNode.gain.value = 10;
            sound.connect(gainNode);
            gainNode.connect(offlineAudioCtx.destination);
            offlineAudioCtx.startRendering().then(function(renderedbuffer){
                console.log(renderedbuffer);
                var wav = audioBufferToWav(renderedbuffer);
                console.log(wav);

                var blob = new Blob([wav], {type: 'audio/wav'});

                var e = URL.createObjectURL(blob);
                console.log(e);
                
                const outputArea = document.getElementById("output");
                outputArea.innerHTML = "";
                audioBar.src = e;
                outputArea.append(audioBar);

                //HERhEH HHE HHEH HHEH EHHE HHEH HE 
            })
        });  
    };

    fileReader.readAsArrayBuffer(file);

    function make_wav_file(abuffer, total_samples){

        // get duration and sample rate
        var duration = abuffer.duration,
            rate = abuffer.sampleRate,
            offset = 0;
    
        var new_file = URL.createObjectURL(bufferToWave(abuffer, offset, total_samples));
    
        console.log(new_file);
        audioBar.src = new_file;
    
        const outputArea = document.getElementById("output");
    
        outputArea.append(audioBar);

        var download_link = document.getElementById("link");
        download_link.href = new_file;
        var name ="asdf.compresswav";
        download_link.download = name;
        
    }
    
    function bufferToWave(abuffer, offset, len) {
        var numOfChan = abuffer.numberOfChannels,
            length = len * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [], i, sample,
            pos = 0;
      
        // write WAVE header - total offset will be 44 bytes - see chart at http://soundfile.sapp.org/doc/WaveFormat/
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
      
        // write interleaved data
        for(i = 0; i < abuffer.numberOfChannels; i++)
          channels.push(abuffer.getChannelData(i));
      
        while(pos < length) {
          for(i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true);          // update data chunk
            pos += 2;
          }
          offset++                                     // next source sample
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
/*
    if (allCheckedFilters.length === 0){
        audioSource.connect(context.destination);
    }
    else{
        Filter.run(allCheckedFilters, context, audioSource);
    }

    //appends audio bar to the div
    const outputArea = document.getElementById("output");
    outputArea.innerHTML = "";

    outputArea.append(audioBar);
}
*/

function audioBufferToWav (buffer, opt) {
    opt = opt || {}
  
    var numChannels = buffer.numberOfChannels
    var sampleRate = buffer.sampleRate
    var format = opt.float32 ? 3 : 1
    var bitDepth = format === 3 ? 32 : 16
  
    var result
    if (numChannels === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1))
    } else {
      result = buffer.getChannelData(0)
    }
  
    return encodeWAV(result, format, sampleRate, numChannels, bitDepth)
  }
  
  function encodeWAV (samples, format, sampleRate, numChannels, bitDepth) {
    var bytesPerSample = bitDepth / 8
    var blockAlign = numChannels * bytesPerSample
  
    var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
    var view = new DataView(buffer)
  
    /* RIFF identifier */
    writeString(view, 0, 'RIFF')
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true)
    /* RIFF type */
    writeString(view, 8, 'WAVE')
    /* format chunk identifier */
    writeString(view, 12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, format, true)
    /* channel count */
    view.setUint16(22, numChannels, true)
    /* sample rate */
    view.setUint32(24, sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true)
    /* bits per sample */
    view.setUint16(34, bitDepth, true)
    /* data chunk identifier */
    writeString(view, 36, 'data')
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true)
    if (format === 1) { // Raw PCM
      floatTo16BitPCM(view, 44, samples)
    } else {
      writeFloat32(view, 44, samples)
    }
  
    return buffer
  }
  
  function interleave (inputL, inputR) {
    var length = inputL.length + inputR.length
    var result = new Float32Array(length)
  
    var index = 0
    var inputIndex = 0
  
    while (index < length) {
      result[index++] = inputL[inputIndex]
      result[index++] = inputR[inputIndex]
      inputIndex++
    }
    return result
  }
  
  function writeFloat32 (output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 4) {
      output.setFloat32(offset, input[i], true)
    }
  }
  
  function floatTo16BitPCM (output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
      var s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
  }
  
  function writeString (view, offset, string) {
    for (var i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  