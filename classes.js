class Filter {

    constructor(name) {
        this.filterDisplayName = name;
        this.filterIdName = name.replace(" ", "-");
        this.allParams = {};

        // This is the overall div that the filter is in
        var filterDiv = document.createElement("div");
        filterDiv.className = "item";

        // This div will contain all the parameters
        // ID Example: Gain-(Volume)-param
        this.paramDiv = document.createElement("div");
        this.paramDiv.id = this.filterIdName + "-param";

        // Checkbox to enable the filter
        // ID Example: Gain-(Volume)-checkbox
        this.checkbox = document.createElement("input");
        this.checkbox.type = "checkbox";
        this.checkbox.id = this.filterIdName + "-checkbox";
        // Name of the filter
        var label = document.createElement("label");
        label.htmlFor = this.checkbox.id;
        label.textContent = this.filterDisplayName;

        filterDiv.appendChild(this.checkbox);
        filterDiv.appendChild(label);
        filterDiv.appendChild(this.paramDiv);

        document.getElementsByClassName("wrapper")[0].appendChild(filterDiv);
    }

    getChecked() {
        return this.checkbox.checked;
    }

    createNumberParam(paramName, defaultNum) {
        var param = new NumberParam(paramName, defaultNum, this.filterIdName);
        this.allParams[paramName] = param;
    }

    createDropdownParam(paramName, choices) {
        var param = new DropdownParam(paramName, choices, this.filterIdName);
        this.allParams[paramName] = param;
    }
}

class NumberParam {
    constructor(paramName, defaultNum, filterName) {
        this.paramIdName = paramName.replace(" ", "-");
        this.paramDisplayName = paramName;

        var paramLabel = document.createElement("label");
        paramLabel.htmlFor = filterName + "-" + this.paramIdName;
        paramLabel.textContent = this.paramDisplayName;

        // ID Example: Gain-(Volume)-Gain-Increase
        this.inputBox = document.createElement("input");
        this.inputBox.type = "number";
        this.inputBox.value = defaultNum;
        this.inputBox.id = filterName + "-" + this.paramIdName;

        var lineBreak = document.createElement('br');

        document.getElementById(filterName + "-param").appendChild(paramLabel);
        document.getElementById(filterName + "-param").appendChild(this.inputBox);
        document.getElementById(filterName + "-param").appendChild(lineBreak);
    }

    getValue() {
        return this.inputBox.value;
    }
}

class DropdownParam {
    constructor(paramName, choices, filterName) {
        this.paramIdName = paramName.replace(" ", "-");
        this.paramDisplayName = paramName;

        var paramLabel = document.createElement("label");
        paramLabel.htmlFor = filterName + "-" + this.paramIdName;
        paramLabel.textContent = this.paramDisplayName;

        this.DropdownBar = document.createElement("select");
        this.DropdownBar.id = filterName + "-" + this.paramIdName;

        for (var choiceText in choices) {
            var choice = document.createElement("option");
            choice.textContent = choices[choiceText];
            this.DropdownBar.appendChild(choice);
        }

        var lineBreak = document.createElement('br');

        document.getElementById(filterName + "-param").appendChild(paramLabel);
        document.getElementById(filterName + "-param").appendChild(this.DropdownBar);
        document.getElementById(filterName + "-param").appendChild(lineBreak);
    }

    getValue() {
        return this.DropdownBar.value;
    }
}