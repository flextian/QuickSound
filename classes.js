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
    }
}

class NumberParam {
    constructor(paramName, defaultNum, filterName){
        var paramLabel = document.createElement("label");
        paramLabel.htmlFor = filterName + "-" + paramName;
        paramLabel.textContent = paramName;
        
        // ID Example: Gain-Value
        this.inputBox = document.createElement("input");
        this.inputBox.type = "number";
        this.inputBox.value = defaultNum;
        this.inputBox.id = filterName + "-" + paramName;

        document.getElementById(filterName + "-param").appendChild(paramLabel);
        document.getElementById(filterName + "-param").appendChild(this.inputBox);
    }

    getValue(){
        return this.inputBox.value;
    }
}