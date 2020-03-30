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
            gainNode.gain.value = 1000;
            gainNode.connect(context.destination);

        }
    }
}

var gain = new Filter("Gain");
gain.createNumberParam("Value", 0);

function compile(){
    //creates the audio bar
    var fileInput = document.getElementById("audio-input-button");
    var file = fileInput.files;

    var audioBar = document.createElement("audio");

    audioBar.src = window.URL.createObjectURL(file[0]);
    audioBar.type = "audio/mpeg";
    audioBar.controls = true;

    var allCheckedFilters = [];
    for (var filter in Filter.allFilters){
        if (document.getElementById(Filter.allFilters[filter] + "-checkbox").checked){
            allCheckedFilters.push(Filter.allFilters[filter]);
        }
    }

    var context = new OfflineAudioContext();
    var audioSource = context.createMediaElementSource(audioBar);
    if (allCheckedFilters.length === 0){
        audioSource.connect(context.destination);
    }
    else{
        Filter.run(allCheckedFilters, context, audioSource);
    }

    //appends audio bar to the div
    const outputArea = document.getElementById("output");
    outputArea.innerHTML = "";
    audioBar.src = dest.stream;
    console.log(dest.stream);

    outputArea.append(audioBar);
}