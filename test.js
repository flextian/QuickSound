var fileInput = document.getElementById("audio_file");

function compile(){
  console.log("asfd");
  var file = fileInput.files[0];

  var audioCtx = new AudioContext();
  var fileReader1 = new FileReader();

  fileReader1.onload = function(ev) {
    // Decode audio
    audioCtx.decodeAudioData(ev.target.result).then(function(buffer) {
      var offlineAudioCtx = new OfflineAudioContext({
        numberOfChannels: 2,
        length: 44100 * buffer.duration,
        sampleRate: 44100,
      });

      soundSource = offlineAudioCtx.createBufferSource();
      soundSource.buffer = buffer;
      var gain = offlineAudioCtx.createGain();
      gain.gain.value = 1000;

      soundSource.connect(gain);
      gain.connect(offlineAudioCtx.destination);

// Added by Russell  
      soundSource.start(0);  // Added by Russell HOLY SHIT DUDE, THIS ONE FUCKING LINE TOOK ME 6 + HOURS TO FIND OUTO IUWHH THIS FYCING PROGRAMW AWASING WORKING BITCHSOE IJOFAJWIEJOI JAWEOIFJAPOWEJFOAWIEJ OAWIJEFOAEWJFI
      offlineAudioCtx.startRendering().then(function(renderedBuffer) {
        console.log("onload called");
        make_download(renderedBuffer, offlineAudioCtx.length);
      });
    });
  };

  fileReader1.readAsArrayBuffer(file);
}

function make_download(abuffer, total_samples) {

	// get duration and sample rate
	var duration = abuffer.duration,
		rate = abuffer.sampleRate,
		offset = 0;

  var new_file = URL.createObjectURL(bufferToWave(abuffer, total_samples));
  console.log(new_file);

	var download_link = document.getElementById("download_link");
	download_link.href = new_file;
	var name = generateFileName();
	download_link.download = name;

}

function generateFileName() {
  var origin_name = fileInput.files[0].name;
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

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
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