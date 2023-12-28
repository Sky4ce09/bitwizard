// call this Bitwizard 2.0

let tooltipsEnabled = false;
let debugEnabled = false;

function lookupCondition(input) {
    switch (input) {
        case "==":
        case "equal":
            return "equal";
        case "===":
        case "strictEqual":
            return "strictEqual";
        case "!=":
        case "not":
        case "notEqual":
            return "notEqual";
        case ">":
        case "greaterThan":
            return "greaterThan";
        case "<":
        case "lessThan":
            return "lessThan";
        case ">=":
        case "greaterThanEq":
            return "greaterThanEq";
        case "<=":
        case "lessThanEq":
            return "lessThanEq";
        default:
            return "invalid";
    }
}

function invertCondition(input) {
    switch (input) {
        case "==":
        case "equal":
        case "===":
        case "strictEqual":
            return "notEqual";
        case "!=":
        case "not":
        case "notEqual":
            return "equal";
        case ">":
        case "greaterThan":
            return "lessThanEq";
        case "<":
        case "lessThan":
            return "greaterThanEq";
        case ">=":
        case "greaterThanEq":
            return "lessThan";
        case "<=":
        case "lessThanEq":
            return "greaterThan";
        default:
            return "invalid";
    }
}

function transpile(input) {
    reset();
    let lines = input.split("\n");

    // cut out anything unwanted
    for (let lineCount = 0; lineCount < lines.length; lineCount++) {
        let line = lines[lineCount];

        // cull tabs and spaces
        while (line[0] == " " || line[0] == "\t") { line = line.substring(1, line.length); }
        while (line[line.length - 1] == " " || line[line.length - 1] == "\t") { line = line.substring(0, line.length - 1); }

        // remove empty lines
        if (line === "") { lines.splice(lineCount, 1); }
    }

    // start processing the lines

    for (let lineCount = 0; lineCount < lines.length; lineCount++) {
        let line = lines[lineCount];

        // skip comment lines, but preserve them
        if (line[0] == "#") continue;

        // split line by spaces, taking quotes into account
        let segments = []; // this holds the keywords, parameters, etc.
        let stringIndex = [];
        for (let i = 0; i < line.length - 1; i++) {
            if (line.substring(i, i + 2) === ' "') {
                try {
                    if (line.substring(i, i + 3) === ' " ') continue;
                } catch (e) { }
                stringIndex.push({ start: i + 1 });
            }
        }
        let validEndCount = 0;
        for (let i = 0; i < line.length - 1; i++) {
            if (line.substring(i, i + 2) === '" ') {
                try {
                    if (line.substring(i - 1, i + 2) === ' " ') continue;
                } catch (e) { }
                if (stringIndex[validEndCount].start >= i) continue; // oops
                stringIndex[validEndCount].end = i;
                validEndCount++;
            }
        }

        // remove double spaces
        for (let i = 0; i < line.length - 1; i++) {
            if (line.substring(i, i + 2) === "  ") {
                for (let el of stringIndex) {
                    if (i > el.start && i < el.end) continue; // protected within strings, hopefully...
                }
                line = line.substring(0, i) + " " + line.substring(i + 2);
                for (let el of stringIndex) {
                    if (el.start < i) return;
                    el.start -= 1;
                    el.end -= 1;
                }
                i--;
            }
        }

        //one space to the side for detection
        line += " ";

        for (let i = 0; i < line.length; i++) {
            if (line[i] == ' ') {
                for (let el of stringIndex) {
                    if (i > el.start && i < el.end) continue; // do not count spaces within strings, hopefully...
                }
                // no index complaints? hooray!
                segments.push(line.substring(0, i));
                line = line.substring(i + 1);
                i = -1; // becomes 0 again after the iteration
            }
        }

        let tooltipOutput = (lineCount == lines.length - 1 && tooltipsEnabled) ? processSegmentsToTooltip(segments) : "";
        let codeOutput = processSegmentsToOutput(segments); // object with properties header, contents, footer and data

        liveTooltip = tooltipOutput;
        if (typeof codeOutput == "string") { if (codeOutput != "") contents.push(codeOutput); } else {
            if (codeOutput.header != "") header.push(codeOutput.header);
            if (codeOutput.contents != "") contents.push(codeOutput.contents);
            if (codeOutput.footer != "") footer.push(codeOutput.footer);
            if (codeOutput.data != "") data.push(codeOutput.data);
        }
    }
    let output = tooltipsEnabled == true ? liveTooltip + "\n\n" : "";
    if (compileTimeVariables.functionCount == 0 && JSON.stringify(footer) == JSON.stringify(["end"])) {
        footer = []; // no trailing "end" when there are no functions
    }
    for (let el of header) {
        output += el + "\n";
    }
    output += header.length > 0 ? "\n" : "";
    for (let el of contents) {
        output += el + "\n";
    }
    output += contents.length > 0 ? "\n" : "";
    for (let el of footer) {
        output += el + "\n";
    }
    output += data.length > 0 ? "\n" : "";
    for (let el of data) {
        output += el + "\n";
    }
    while (output.indexOf(" \n") != -1) {
        output = output.substring(0, output.indexOf(" \n")) + "\n" + output.substring(output.indexOf(" \n") + 2);
    }
    outputLines = output.split("\n");
    let lineCount = 0;
    for (let el of outputLines) {
        if (!(el[0] == "#" || el == "" || (el[el.length - 1] == ":" && el.split(" ").length == 1))) {
            lineCount++;
        }
    }
    return output + "\n# Line count: " + lineCount + (compileTimeVariables.recentPointerArrays.length == 0 ? "" : "\n# Unclosed pointer arrays: " + compileTimeVariables.recentPointerArrays.length);
}

class Description {
    constructor(names, parameters, description, branches = [], optionalBranch = false) {
        this.names = names;
        this.parameters = parameters; // a string
        this.description = description;
        this.branches = branches;
        this.optionalBranch = optionalBranch;
    }
    getNames() {
        let out = "";
        for (let el of this.names) {
            out += el + " / ";
        }
        out = out.length != 0 ? out.substring(0, out.length - 3) : out;
        return out;
    }
    getFullData() {
        let out = "#" + this.getNames() + "\n" +
            "#Parameters: " + this.parameters + "\n" +
            "#" + this.description;
        return out;
    }
    addBranch(desc) {
        this.branches.push(desc);
    }
    browseBranches(branchString) {
        let branch = this.branches.find(el => el.names.indexOf(branchString != -1));
        if (branch == undefined) {
            if (this.optionalBranch || this.branches.length == 0) { return "Bitwizard thinks you're on the right track." }
            return "#Bitwizard does not (yet) recognize this."
        } else {
            return branch;
        }
    }
}

let standardValues = {
    variable: new Description(["variable"], "", "Commonly used for instruction output."),
    number: new Description(["number"], "", "Also known as a double."),
    boolean: new Description(["boolean"], "", "True or false."),
    block: new Description(["block"], "", "A block in the game."),
    unit: new Description(["boolean"], "", "A unit in the game."),
    source: new Description(["sourcevalue"], "", "A value that is not computed during runtime."),
}

let descriptions = [
    new Description(["read"], "variable, value:block, value:double", "Reads the data of a memory block at an index and stores it in a variable."),
    new Description(["write"], "value:double, value:block, value:double", "Writes a value a memory block at an index."),
    new Description(["draw"], "graphictype", "Draws a graphic to its own draw buffer."),
    new Description(["print"], "value:string", "Prints a string to its own print buffer."),
    new Description(["drawflush", "drawf", "df"], "value:block", "Puts the draw buffer out to a display block."),
    new Description(["printflush", "printf", "pf"], "value:block", "Puts the print buffer out to a message block."),
    new Description(["getlink"], "variable, value:double", "Sets a variable as its n-th link."),
    new Description(["control"], "property", "Modifies a block's property."),
    new Description(["radar"], "value:block, targeting, targeting, targeting, order:boolean, sorting, variable", "Returns the sorted 1st unit (or lack thereof) that is within a building's targeting radius and meets the targeting requirements."),
    new Description(["sensor"], "variable, value:block, contents/property", "Yields one of a block's properties."),
    new Description(["set"], "variable, value", "You don't need this explained."),
    new Description(["op"], "computation", "Performs a mathematical or a logical operation on one or more numbers. Input values are added at the end of this instruction."),
    new Description(["wait"], "value:double", "Halts execution of further operations for a set amount of seconds."),
    new Description(["lookup"], "datatype, variable, value:double", "Gets the n-th core database entry of a type."),
    new Description(["end"], "", "Sets @counter to -1, which means it continues executing code from the first line."),
    new Description(["jump", "jmp"], "index, condition, value, value", "Jump to a certain line of code if the condition is met."),
    new Description(["ubind"], "unittype", "Binds the next unit of a type."),
    new Description(["ucontrol"], "controlmode", "Controls the currently bound unit."),
    new Description(["uradar"], "targeting, targeting, targeting, order:boolean, sorting, variable", "Returns the sorted 1st unit (or lack thereof) that is within the currently bound unit's targeting radius and meets the targeting requirements."),
    new Description(["ulocate"], "locatabletype", "Orders the currently bound unit to locate something."),
    new Description(["terminate"], "", "Stucks the processor."),
    new Description(["spl"], "splitteroperation", "Perform an operation that deals with splitters."),
    new Description(["timer"], "timeroperation", "Works with timers."),
    new Description(["fun"], "functionoperation", "Deals with function creation or calling."),
    new Description(["for"], "variable (, initialization), condition, value:double, increment", "Initializes a loop."),
    new Description(["next"], "", "Closes the most recently initialized loop."),
    new Description(["parray", "parr"], "sourcevalue, value:double", "Creates a pointer array with the ."),
    new Description(["/"], "", "Closes a case of a pointer array."),
    new Description(["//"], "", "Closes the last case of a pointer array, defining its size."),
    new Description(["log2"], "variable, value:double", "Calculates the base 2 logarithm of a number."),
    new Description(["define", "def"], "number", "Implements various number definitions."),
    new Description(["uflag"], "unittype/uflagoperation", "Flag the currently bound unit with shorter syntax or perform checks and actions on it."),
];

for (let el of descriptions) {
    if (el.branches.length == 0) {
        let params = el.parameters.split(", ");
        for (let parameter of params) {
            let keys = Object.keys(standardValues);
            for (let key of keys) {
                if (parameter.indexOf(key) != -1) {
                    el.addBranch(standardValues[key]);
                    break;
                }
            }
        }
    }
}


let compileTimeVariables;

let liveTooltip; // stuff that doesn't belong in the final result, not utilized by the main output generator
let header; // stuff that goes to the top, like special variable definitions
let contents; // the most important stuff
let footer; // "end"'s residence
let data; // stuff that is never accessed by @counter going down naturally, like functions

function reset() {
    compileTimeVariables = {
        linesWithinFunction: false,
        toggleConsistentLineCounts: false,
        homogenousJumps: 0,
        recentTimers: [],
        recentLoops: [],
        recentPointerArrays: [],
        recentFunctions:[],
        functions: new Map(),
        splitters: new Map(),
        memoryLabelMaps: new Map(),
        functionCount: 0
    };
    liveTooltip = "";
    header = [];
    contents = [];
    footer = ["end"];
    data = [];
}

function processSegmentsToTooltip(segments) {
    // live tooltips and errors, i guess?

    let currentDocs = false;
    if (segments.length <= 1) {
        let tooltip = "# Available instructions:\n#";
        for (let el of descriptions) {
            tooltip += el.getNames() + ", "
        }
        tooltip = tooltip.substring(0, tooltip.length - 2);
        return tooltip;
    }
    for (let i = 0; i < segments.length - 1; i++) {
        if (typeof currentDocs == "object") {
            if (currentDocs.branches.length > 0) {
                currentDocs = currentDocs.browseBranches(segments[i]);
            } else {
                return "# Bitwizard does not (yet) recognize this."
            }
        } else {
            currentDocs = descriptions.find(el => el.names.indexOf(segments[i]) != -1);
            if (currentDocs == undefined) {
                return "# Bitwizard does not (yet) recognize this."
            }
        }
    }

    return typeof currentDocs === "string" ? currentDocs : currentDocs.getFullData();
}

function algoSplitterAccessCheck(splitter, index) {
    if (splitter.type == "custom") { console.error(splitter); return false; }
    return (splitter.restrictor <= index ? false : true);
}

function processSegmentsToOutput(segments) {
    // remove all segments within a comment
    let removeSegments = false;
    for (let i = 0; i < segments.length; i++) {
        if (removeSegments) {
            segments.pop();
            i--;
        }
        let potentialCommentIndices = [];
        for (let j = 0; j < segments[i].length; j++) {
            if (segments[i][j] == "#") {
                potentialCommentIndices.push(j);
            }
        }
        for (let el of potentialCommentIndices) {
            if (el == 0) {
                removeSegments = true;
                segments.splice(i, 1);
                i--;
                break;
            } else if (segments[i][el - 1] != "\\") {
                segments[i] = segments[i].substring(0, el);
                removeSegments = true;
            } else {
                segments[i] = segments[i].substring(0, el - 1) + segments[i].substring(el);
            }
        }
    }

    let output;
    try {
        switch (segments[0]) {
            case "debug":
                console.log(compileTimeVariables);
                output = {
                    header: "",
                    contents: "\# DEBUG MARK",
                    footer: "",
                    data: ""
                };
                break;
            case "jump": {
                if (segments.length == 2) {
                    output = segments[0] + " " + segments[1] + " always"
                }
                break;
            }
            case "drawf":
            case "df": {
                output = "drawflush " + segments[1];
                break;
            }
            case "printf":
            case "pf": {
                output = "printflush " + segments[1];
                break;
            }
            case "consistent":
            case "con": {
                compileTimeVariables.toggleConsistentLineCounts = true;
                output = {
                    header: "",
                    contents: "",
                    footer: "",
                    data: ""
                };
                break;
            }
            case "inconsistent":
            case "incon": {
                compileTimeVariables.toggleConsistentLineCounts = false;
                output = {
                    header: "",
                    contents: "",
                    footer: "",
                    data: ""
                };
                break;
            }
            case "expectlink":
            case "expect": {
                output = {
                    header: "",
                    contents: "",
                    footer: "",
                    data: ""
                };
                for (let i = 1; i < segments.length; i++) {
                    let building = segments[i];
                    output.header += "jump 0 strictEqual " + building + " null\n";
                }
                break;
            }
            case "ucontrol": {
                if (segments[1] == "getblock") {
                    output = "ucontrol getBlock";
                    for (let i = 2; i < segments.length; i++) {
                        output += " " + segments[i];
                    }
                }
                break;
            }
            case "print": {
                if ((segments[1][0] == "'" || segments[1][0] == '"') && segments[1][segments[1].length - 1] == segments[1][0] && segments[1].length > 1) {
                    output = "print " + segments[1] + " # Length: " + (segments[1].length - 2);
                }
                break;
            }
            case "memorylabel":
            case "memlabel": {
                let memoryBlockReference = segments[1];
                let labels = new Map();
                for (let i = 2; i < segments.length; i++) {
                    if (segments[i].indexOf(":") != -1) {
                        let subsegments = segments[i].split(":");
                        let key = null;
                        let value = null;
                        if (Number.isNaN(Number(subsegments[0]))) {
                            key = 0; value = 1;
                        } else if (Number.isNaN(Number(subsegments[1]))) {
                            key = 1; value = 0;
                        }
                        if (key != null) {
                            labels.set(subsegments[key], subsegments[value] * 1);
                        }
                    }
                }
                output = {
                    header: "",
                    contents: "",
                    footer: "",
                    data: ""
                };
                compileTimeVariables.memoryLabelMaps.set(memoryBlockReference, labels);
                break;
            }
            case "read":
            case "write": {
                let index = compileTimeVariables.memoryLabelMaps.get(segments[2]).get(segments[3]);
                if (typeof index == "number") {
                    output = segments[0] + " " + segments[1] + " " + segments[2] + " " + index;
                }
                break;
            }
            case "spl": {
                switch (segments[1]) {
                    case "new": {
                        let mlogName = segments[2];
                        let bitwName = segments[3];
                        let bitranges = [];
                        if (segments[5] == "*") {
                            let labels = new Map();
                            for (let i = 6; i < segments.length; i++) {
                                if (segments[i].indexOf(":") != -1) {
                                    let subsegments = segments[i].split(":");
                                    let key = null;
                                    let value = null;
                                    if (Number.isNaN(Number(subsegments[0]))) {
                                        key = 0; value = 1;
                                    } else if (Number.isNaN(Number(subsegments[1]))) {
                                        key = 1; value = 0;
                                    }
                                    if (key != null) {
                                        labels.set(subsegments[key], subsegments[value] * 1);
                                    }
                                }
                            }
                            compileTimeVariables.splitters.set(bitwName, {
                                ref: mlogName,
                                type: "algorithmic",
                                step: segments[4],
                                bitranges: null,
                                restrictor: (segments[5] == "*" ? segments[6] : Math.floor(63 / segments[4])),
                                labels: labels
                            });
                        } else {
                            let labels = new Map();
                            for (let i = 4; i < segments.length; i++) {
                                if (segments[i].indexOf(":") != -1) {
                                    let subsegments = segments[i].split(":");
                                    let key = null;
                                    let value = null;
                                    if (Number.isNaN(Number(subsegments[0]))) {
                                        key = 0; value = 1;
                                    } else if (Number.isNaN(Number(subsegments[1]))) {
                                        key = 1; value = 0;
                                    }
                                    if (key != null && value != null) {
                                        labels.set(subsegments[key], i - 4);
                                        bitranges.push(subsegments[value] * 1)
                                    }
                                } else {
                                    bitranges.push(segments[i] * 1);
                                }
                            }
                            compileTimeVariables.splitters.set(bitwName, {
                                ref: mlogName,
                                type: "custom",
                                step: null,
                                bitranges: bitranges,
                                obtainFunctionCreated: false,
                                clearFunctionCreated: false,
                                writeFunctionCreated: false,
                                labels: labels
                            });
                        }
                        output = {
                            header: "",
                            contents: "",
                            footer: "",
                            data: ""
                        };
                        break;
                    }
                    case "label": {
                        let splitterEntry = compileTimeVariables.splitters.get(segments[2]);
                        let labels = splitterEntry.labels;
                        for (let i = 3; i < segments.length; i++) {
                            if (segments[i].indexOf(":") != -1) {
                                let subsegments = segments[i].split(":");
                                let key = null;
                                let value = null;
                                if (Number.isNaN(Number(subsegments[0]))) {
                                    key = 0; value = 1;
                                } else if (Number.isNaN(Number(subsegments[1]))) {
                                    key = 1; value = 0;
                                }
                                if (key != null && value != null) {
                                    labels.set(subsegments[key], subsegments[value]);
                                }
                            }
                        }
                        output = {
                            header: "",
                            contents: "",
                            footer: "",
                            data: ""
                        };
                        break;
                    }
                    case "obtainf":
                    case "of": {
                        let outputVariable = segments[2];
                        let splitterEntry = compileTimeVariables.splitters.get(segments[3]);
                        let bitrangeIndex = Number.isNaN(Number(segments[4])) ? splitterEntry.labels.get(segments[4]) * 1 : segments[4] * 1;
                        let skippedBits = 0;
                        let mask;
                        if (splitterEntry.type == "custom") {
                            for (let i = 0; i < bitrangeIndex; i++) {
                                skippedBits += splitterEntry.bitranges[i];
                            }
                            mask = "0x" + ((BigInt(1) << BigInt(splitterEntry.bitranges[bitrangeIndex])) - BigInt(1)).toString(16).toUpperCase();
                        } else {
                            if (!algoSplitterAccessCheck(splitterEntry, bitrangeIndex)) {
                                output = "# You shall only access " + splitterEntry.restrictor * splitterEntry.step + " bits from this splitter.";
                                break;
                            }
                            skippedBits = splitterEntry.step * bitrangeIndex;
                            mask = "0x" + ((BigInt(1) << BigInt(splitterEntry.step)) - BigInt(1)).toString(16).toUpperCase();
                        }

                        if (skippedBits != 0 || compileTimeVariables.toggleConsistentLineCounts) {
                            output =
                                "op shr " + outputVariable + " " + splitterEntry.ref + " " + skippedBits + "\n" +
                                "op and " + outputVariable + " " + outputVariable + " " + mask;
                        } else {
                            output = "op and " + outputVariable + " " + splitterEntry.ref + " " + mask;
                        }
                        break;
                    }
                    case "obtaind":
                    case "od": {
                        let outputVariable = segments[2];
                        let splitterEntry = compileTimeVariables.splitters.get(segments[3]);
                        if (splitterEntry.type == "custom") {
                            let bitrangeIndex = segments[4];
                            let skippedBits = 0;

                            output = {
                                header: "",
                                contents:
                                    "op add _SPL" + segments[3] + "CB_ @counter 1\n" +
                                    "jump _SPL" + segments[3] + "O_ always",
                                footer: "",
                                data: ""
                            };

                            if (splitterEntry.obtainFunctionCreated) break;

                            splitterEntry.obtainFunctionCreated = true;
                            compileTimeVariables.functionCount++;

                            output.data +=
                                "_SPL" + segments[3] + "O_:\n" +
                                "op mul _Internal_ " + bitrangeIndex + " 3\n" +
                                "op add @counter @counter _Internal_\n";

                            for (let i = 0; i < splitterEntry.bitranges.length; i++) {
                                let bitrange = splitterEntry.bitranges[i];
                                let mask = "0x" + ((BigInt(1) << BigInt(bitrange)) - BigInt(1)).toString(16).toUpperCase();
                                output.data +=
                                    "op shr " + outputVariable + " " + splitterEntry.ref + " " + skippedBits + "\n" +
                                    "op and " + outputVariable + " " + outputVariable + " " + mask + "\n" +
                                    "set @counter _SPL" + segments[3] + "CB_\n";
                                skippedBits += bitrange;
                            }

                            output.data = output.data.substring(0, output.data.length - 1);
                        } else { // algorithmic shift for homogenous bitranges
                            let step = splitterEntry.step;
                            let shift = segments[4];
                            let mask = "0x" + ((BigInt(1) << BigInt(step)) - BigInt(1)).toString(16).toUpperCase();
                            output =
                                "op mul _Internal_ " + step + " " + shift + "\n" +
                                "op shr " + outputVariable + " " + splitterEntry.ref + " _Internal_\n" +
                                "op and " + outputVariable + " " + outputVariable + " " + mask;
                        }
                        break;
                    }
                    case "clearf":
                    case "cf": {
                        let splitterEntry = compileTimeVariables.splitters.get(segments[2]);
                        let bitrangeIndex = Number.isNaN(Number(segments[3])) ? splitterEntry.labels.get(segments[3]) * 1 : segments[4] * 1;
                        let skippedBits = 0;
                        let mask;

                        if (splitterEntry.type = "custom") {
                            for (let i = 0; i < bitrangeIndex; i++) {
                                skippedBits += splitterEntry.bitranges[i];
                            }
                            mask = "0x" + bnot(((BigInt(1) << BigInt(splitterEntry.bitranges[bitrangeIndex])) - BigInt(1)) << BigInt(skippedBits)).toString(16).toUpperCase();
                        } else {
                            if (!algoSplitterAccessCheck(splitterEntry, bitrangeIndex)) {
                                output = "# You shall only access " + splitterEntry.restrictor * splitterEntry.step + " bits from this splitter.";
                                break;
                            }
                            skippedBits = splitterEntry.step * bitrangeIndex;
                            mask = "0x" + bnot(((BigInt(1) << BigInt(splitterEntry.step)) - BigInt(1)) << BigInt(skippedBits)).toString(16).toUpperCase();
                        }

                        output = "op and " + splitterEntry.ref + " " + splitterEntry.ref + " " + mask;
                        break;
                    }
                    case "cleard":
                    case "cd": {
                        let splitterEntry = compileTimeVariables.splitters.get(segments[2]);
                        if (splitterEntry.type == "custom") {
                            let bitrangeIndex = segments[3];
                            let skippedBits = 0;

                            output = {
                                header: "",
                                contents:
                                    "op add _SPL" + segments[2] + "CB_ @counter 1\n" +
                                    "jump _SPL" + segments[2] + "C_ always",
                                footer: "",
                                data: ""
                            }

                            if (splitterEntry.clearFunctionCreated) break;

                            splitterEntry.clearFunctionCreated = true;
                            compileTimeVariables.functionCount++;

                            output.data +=
                                "_SPL" + segments[2] + "C_:\n" +
                                "op mul _Internal_ " + bitrangeIndex + " 2\n" +
                                "op add @counter @counter _Internal_\n";

                            for (let i = 0; i < splitterEntry.bitranges.length; i++) {
                                let bitrange = splitterEntry.bitranges[i];
                                let mask = "0x" + bnot(((BigInt(1) << BigInt(bitrange)) - BigInt(1)) << BigInt(skippedBits)).toString(16).toUpperCase();
                                output.data +=
                                    "op and " + splitterEntry.ref + " " + splitterEntry.ref + " " + mask + "\n" +
                                    "set @counter _SPL" + segments[2] + "CB_\n";
                                skippedBits += bitrange;
                            }

                            output.data = output.data.substring(0, output.data.length - 1);
                        } else { // algorithmic shift for homogenous bitranges
                            let step = splitterEntry.step;
                            let shift = segments[3];
                            let mask = "0b" + ((BigInt(1) << BigInt(step)) - BigInt(1)).toString(2); // this gets shifted during runtime
                            output =
                                "op mul _Internal_ " + step + " " + shift + "\n" +
                                "op shl _Internal_ " + mask + " _Internal_\n" +
                                "op not _Internal_ _Internal_\n" +
                                "op and " + splitterEntry.ref + " " + splitterEntry.ref + " _Internal_";
                        }
                        break;
                    }
                    case "writef":
                    case "wf": {
                        let inputValue = segments[2];
                        let splitterEntry = compileTimeVariables.splitters.get(segments[3]);
                        let bitrangeIndex = Number.isNaN(Number(segments[4])) ? splitterEntry.labels.get(segments[4]) * 1 : segments[4] * 1;
                        let skippedBits = 0;
                        let mask;
                        if (splitterEntry.type == "custom") {
                            for (let i = 0; i < bitrangeIndex; i++) {
                                skippedBits += splitterEntry.bitranges[i];
                            }
                            mask = "0x" + bnot(((BigInt(1) << BigInt(splitterEntry.bitranges[bitrangeIndex])) - BigInt(1)) << BigInt(skippedBits)).toString(16).toUpperCase();
                        } else {
                            if (!algoSplitterAccessCheck(splitterEntry, bitrangeIndex)) {
                                output = "# You shall only access " + splitterEntry.restrictor * splitterEntry.step + " bits from this splitter.";
                                break;
                            }
                            skippedBits = splitterEntry.step * bitrangeIndex;
                            mask = "0x" + bnot(((BigInt(1) << BigInt(splitterEntry.step)) - BigInt(1)) << BigInt(skippedBits)).toString(16).toUpperCase();
                        }
                        if (Number.isNaN(Number(inputValue)) || compileTimeVariables.toggleConsistentLineCounts) {
                            output =
                                "op and " + splitterEntry.ref + " " + splitterEntry.ref + " " + mask + "\n" +
                                "op shl _Internal_ " + inputValue + " " + skippedBits + "\n" +
                                "op or " + splitterEntry.ref + " " + splitterEntry.ref + " _Internal_";
                        } else {
                            inputValue = "0x" + (BigInt(inputValue) << BigInt(skippedBits)).toString(16).toUpperCase();
                            output =
                                "op and " + splitterEntry.ref + " " + splitterEntry.ref + " " + mask + "\n" +
                                "op or " + splitterEntry.ref + " " + splitterEntry.ref + " " + inputValue;
                        }
                        break;
                    }
                    case "writed":
                    case "wd": {
                        let inputValue = segments[2];
                        let splitterEntry = compileTimeVariables.splitters.get(segments[3]);
                        if (splitterEntry.type == "custom") {
                            let bitrangeIndex = segments[4];
                            let skippedBits = 0;

                            output = {
                                header: "",
                                contents:
                                    "op add _SPL" + segments[3] + "CB_ @counter 1\n" +
                                    "jump _SPL" + segments[3] + "W_ always",
                                footer: "",
                                data: ""
                            }

                            if (splitterEntry.writeFunctionCreated) break;

                            splitterEntry.writeFunctionCreated = true;
                            compileTimeVariables.functionCount++;

                            output.data +=
                                "_SPL" + segments[3] + "W_:\n" +
                                "op mul _Internal_ " + bitrangeIndex + " 4\n" +
                                "op or @counter @counter _Internal_\n";

                            for (let i = 0; i < splitterEntry.bitranges.length; i++) {
                                let bitrange = splitterEntry.bitranges[i];
                                let mask = "0x" + bnot(((BigInt(1) << BigInt(bitrange)) - BigInt(1)) << BigInt(skippedBits)).toString(16).toUpperCase();
                                output.data +=
                                    "op and " + splitterEntry.ref + " " + splitterEntry.ref + " " + mask + "\n" +
                                    "op shl _Internal_ " + inputValue + " " + skippedBits + "\n" +
                                    "op or " + splitterEntry.ref + " " + splitterEntry.ref + " _Internal_\n" +
                                    "set @counter _SPL" + segments[3] + "CB_\n";
                                skippedBits += bitrange;
                            }

                            output.data = output.data.substring(0, output.data.length - 1);
                        } else { // algorithmic shift for homogenous bitranges
                            let step = splitterEntry.step;
                            let shift = segments[4];
                            let mask = "0x" + ((BigInt(1) << BigInt(step)) - BigInt(1)).toString(16).toUpperCase(); // this gets shifted during runtime
                            output =
                                ((step != 1 || compileTimeVariables.toggleConsistentLineCounts) ? "op mul _Internal1_ " + step + " " + shift + "\n" : "") +
                                ((step != 1 || compileTimeVariables.toggleConsistentLineCounts) ? "op shl _Internal2_ " + mask + " _Internal1_\n" : "op shl _Internal2_ " + mask + " " + shift + "\n") +
                                "op not _Internal2_ _Internal2_\n" +
                                "op and " + splitterEntry.ref + " " + splitterEntry.ref + " _Internal2_\n";
                            if (compileTimeVariables.toggleConsistentLineCounts || shift != 0) {
                                output +=
                                    ((step != 1 || compileTimeVariables.toggleConsistentLineCounts) ? "op shl _Internal2_ " + inputValue + " _Internal1_\n" : "op shl _Internal2_ " + inputValue + " " + shift + "\n") +
                                    "op or " + splitterEntry.ref + " " + splitterEntry.ref + " _Internal2_";
                            } else {
                                output +=
                                    "op or " + splitterEntry.ref + " " + splitterEntry.ref + " " + inputValue;
                            }
                        }
                        break;
                    }
                }
                break;
            }
            case "define":
            case "def": {
                switch (segments[1]) {
                    case "LN2":
                        output = {
                            header: header.find(el => el.indexOf("op log LN2 2") != -1) == undefined ? "op log LN2 2" : "",
                            contents: "",
                            footer: "",
                            data: "",
                            unchangeable: false
                        };
                        break;
                    case "LN16":
                        output = {
                            header: header.find(el => el.indexOf("op log LN16 16") != -1) == undefined ? "op log LN16 16" : "",
                            contents: "",
                            footer: "",
                            data: "",
                            unchangeable: false
                        };
                        break;
                    case "PI": {
                        output = {
                            header: header.find(el => el.indexOf("set PI 3.1415926535897932") != -1) == undefined ? "set PI 3.1415926535897932" : "",
                            contents: "",
                            footer: "",
                            data: "",
                            unchangeable: false
                        };
                        break;
                    }
                }
                break;
            }
            case "log2": {
                let outputVariable = segments[1];
                let inputValue = segments[2];

                output = {
                    header: header.find(el => el.indexOf("op log LN2 2") != -1) == undefined ? "op log LN2 2" : "",
                    contents: "op log _Internal_ " + inputValue + "\nop div " + outputVariable + " _Internal_ LN2",
                    footer: "",
                    data: "",
                    unchangeable: false
                };
                break;
            }
            case "log16": {
                let outputVariable = segments[1];
                let inputValue = segments[2];

                output = {
                    header: header.find(el => el.indexOf("op log LN16 16") != -1) == undefined ? "op log LN16 16" : "",
                    contents: "op log _Internal_ " + inputValue + "\nop div " + outputVariable + " _Internal_ LN16",
                    footer: "",
                    data: "",
                    unchangeable: false
                };
                break;
            }

            case "for": {
                let condition;
                let rightSide;
                let increment;
                if (segments[2] == "=") {
                    output = "set " + segments[1] + " " + segments[3] + "\n"
                    condition = lookupCondition(segments[4]);
                    rightSide = segments[5];
                    increment = segments[6];
                } else {
                    output = "";
                    condition = lookupCondition(segments[2]);
                    rightSide = segments[3];
                    increment = segments[4];
                }
                compileTimeVariables.recentLoops.push({
                    identification: compileTimeVariables.homogenousJumps,
                    leftSide: segments[1],
                    condition: condition,
                    rightSide: rightSide,
                    increment: increment
                });
                if (condition == "strictEqual" || compileTimeVariables.toggleConsistentLineCounts) {
                    output +=
                        "op " + condition + " _Internal_ " + segments[1] + " " + rightSide + "\n" +
                        "jump _ENDLOOP" + compileTimeVariables.homogenousJumps + "_ " + invertCondition(condition) + " _Internal_ 1\n" +
                        "_LOOP" + compileTimeVariables.homogenousJumps + "_:";
                } else {
                    output +=
                        "jump _ENDLOOP" + compileTimeVariables.homogenousJumps + "_ " + invertCondition(condition) + " " + segments[1] + " " + rightSide + "\n" +
                        "_LOOP" + compileTimeVariables.homogenousJumps + "_:";
                }
                compileTimeVariables.homogenousJumps++;
                break;
            }
            case "next": {
                let loopData = compileTimeVariables.recentLoops.pop();
                let leftSide = loopData.leftSide;
                let condition = loopData.condition;
                let rightSide = loopData.rightSide;
                let increment = loopData.increment;

                output =
                    "op add " + leftSide + " " + leftSide + " " + increment + "\n" +
                    "jump _LOOP" + loopData.identification + "_ " + condition + " " + leftSide + " " + rightSide + "\n" +
                    "_ENDLOOP" + loopData.identification + "_:";
                break;
            }

            case "fun": {
                switch (segments[1]) {
                    case "new": {
                        compileTimeVariables.recentFunctions.push(segments[2]);
                        compileTimeVariables.functions.set(segments[2], "exists");
                        compileTimeVariables.functionCount++;
                        output = {
                            header: "",
                            contents: "",
                            footer: "",
                            data: segments[2] + ":" + (debugEnabled ? '\nset _DEBUG-FUN_ "' + segments[2] + '"' : ""),
                            unchangeable: true
                        };
                        compileTimeVariables.linesWithinFunction = true;
                        break;
                    }
                    case "close": {
                        let functionName = compileTimeVariables.recentFunctions.pop();
                        output = {
                            header: "",
                            contents: "",
                            footer: "",
                            data: "set @counter _" + functionName + "CB_",
                            unchangeable: true
                        };
                        compileTimeVariables.linesWithinFunction = false;
                        break;
                    }
                    case "have":
                    case "call": {
                        output = {
                            header: "",
                            contents: "op add _" + segments[2] + "CB_ @counter 1\njump " + segments[2] + " always",
                            footer: "",
                            data: "",
                            unchangeable: false
                        };
                        break;
                    }
                }
                break;
            }

            case "timer": {
                switch (segments[1]) {
                    case "start":
                    case "new": {
                        compileTimeVariables.recentTimers.push(segments[2]);
                        output =
                            "set " + segments[2] + " " + segments[3] + "\n" +
                            "op add _" + segments[2] + "STAMP_ @time " + segments[3];
                        break;
                    }
                    case "loop": {
                        output = "_" + segments[2] + "TIMER_:";
                        break;
                    }
                    case "extend": {
                        output = "op add _" + segments[2] + "STAMP_ _" + segments[2] + "STAMP_ " + segments[3];
                        break;
                    }
                    case "close": {
                        let timerName = compileTimeVariables.recentTimers.pop();
                        output =
                            "op sub " + timerName + " _" + timerName + "STAMP_ @time\n" +
                            "jump _" + timerName + "TIMER_ greaterThan " + timerName + " 0"
                        break;
                    }
                }
                break;
            }

            case "uflag": {
                switch (segments[1]) {
                    case "get": {
                        output = "";
                        if (segments[2] == "any") {
                            let unitType = segments[3];
                            let flag = segments[4];
                            let escapeConditions = "";
                            let tail = "";
                            for (let i = 5; i + 1 < segments.length; i += 2) {
                                let condition = segments[i];
                                let rightSide = segments[i + 1];
                                escapeConditions += "jump _UFLAGGET" + compileTimeVariables.homogenousJumps + "ESCAPE_ " + condition + " @unit " + rightSide + "\n";
                            }
                            if (segments.length > 5) {
                                tail = "_UFLAGGET" + compileTimeVariables.homogenousJumps + "ESCAPE_:\n";
                            }
                            escapeConditions = escapeConditions.substring(0, escapeConditions.length - 1);
                            output =
                                "_UFLAGGET" + compileTimeVariables.homogenousJumps + "_:\n" +
                                "ubind " + unitType + "\n" +
                                escapeConditions + // comes with a new line
                                "sensor _Internal_ @unit @flag\n" +
                                "jump _UFLAGGET" + compileTimeVariables.homogenousJumps + "_ notEqual _Internal_ " + flag + "\n" +
                                tail;
                            compileTimeVariables.homogenousJumps++;
                        } else {
                            let unitType = segments[2];
                            let flag = segments[3];
                            let escapeConditions = "";
                            let tail = "";
                            for (let i = 4; i + 1 < segments.length; i += 2) {
                                let condition = segments[i];
                                let rightSide = segments[i + 1];
                                escapeConditions += "jump _UFLAGGET" + compileTimeVariables.homogenousJumps + "ESCAPE_ " + condition + " @unit " + rightSide + "\n";
                            }
                            if (segments.length > 4) {
                                tail = "_UFLAGGET" + compileTimeVariables.homogenousJumps + "ESCAPE_:\n";
                            }
                            escapeConditions = escapeConditions.substring(0, escapeConditions.length - 1);
                            output =
                                "_UFLAGGET" + compileTimeVariables.homogenousJumps + "_:\n" +
                                "ubind " + unitType + "\n" +
                                escapeConditions + // comes with a new line
                                "sensor _Internal_ @unit @controlled\n" +
                                "jump _UFLAGGET" + compileTimeVariables.homogenousJumps + "_ equal _Internal_ 1\n" +
                                "sensor _Internal_ @unit @flag\n" +
                                "jump _UFLAGGET" + compileTimeVariables.homogenousJumps + "_ notEqual _Internal_ " + flag + "\n" +
                                tail;
                            compileTimeVariables.homogenousJumps++;
                        }
                        break;
                    }
                    case "await": {
                        if (lookupCondition(segments[2]) != "invalid") {
                            let oppositeCondition = invertCondition(lookupCondition(segments[2]));
                            let flag = segments[3];
                            output =
                                "_UFLAGAWAIT" + compileTimeVariables.homogenousJumps + "_:\n";
                            for (let i = 4; i < segments.length; i++) {
                                output +=
                                    "op add _" + segments[i] + "CB_ @counter 1\njump " + segments[i] + " always\n";
                            }
                            output +=
                                "sensor _Internal_ @unit @flag\n" +
                                "jump _UFLAGAWAIT" + compileTimeVariables.homogenousJumps + "_ " + oppositeCondition + " " + "_Internal_ " + flag;
                        } else {
                            let flag = segments[2];
                            output =
                                "_UFLAGAWAIT" + compileTimeVariables.homogenousJumps + "_:\n";
                            for (let i = 3; i < segments.length; i++) {
                                output +=
                                    "op add _" + segments[i] + "CB_ @counter 1\njump " + segments[i] + " always\n";
                            }
                            output +=
                                "sensor _Internal_ @unit @flag\n" +
                                "jump _UFLAGAWAIT" + compileTimeVariables.homogenousJumps + "_ notEqual " + "_Internal_ " + flag;
                        }
                        compileTimeVariables.homogenousJumps++;
                        break;
                    }
                    case "test": {
                        if (segments.length > 4) { // uses a default condition if the condition parameter hasn't been added yet
                            let condition = lookupCondition(segments[2]);
                            let flag = segments[3];
                            let output = segments[4];
                            output =
                                "sensor _Internal_ @unit @flag\n" +
                                "op " + condition + " " + output + " " + flag + " _Internal_";
                        } else {
                            let flag = segments[2];
                            let output = segments[3];
                            output =
                                "sensor _Internal_ @unit @flag\n" +
                                "op equal " + output + " " + flag + " _Internal_";
                        }
                        break;
                    }
                    case "verify": {
                        if (compileTimeVariables.recentFunctions.get(segments[2]) == "exists") {
                            output =
                                "sensor _Internal1_ @unit @controlled\n" +
                                "sensor _Internal2_ @unit @dead\n" +
                                "op sub _Internal2_ 1 _Internal2_\n" +
                                "op strictEqual _Internal3_ _Internal1_ @this\n" +
                                "op strictEqual _Internal4_ _Internal1_ null\n" +
                                "op add _Internal1_ _Internal3_ _Internal4_\n" +
                                "op land _Internal_ _Internal1_ _Internal2_\n" +
                                "op add " + segments[2] + "_CB @counter 1\n" +
                                "jump " + segments[2] + " equal _Internal_ 0";
                        } else {
                            output =
                                "sensor _Internal1_ @unit @controlled\n" +
                                "sensor _Internal2_ @unit @dead\n" +
                                "op sub _Internal2_ 1 _Internal2_\n" +
                                "op strictEqual _Internal3_ _Internal1_ @this\n" +
                                "op strictEqual _Internal4_ _Internal1_ null\n" +
                                "op add _Internal1_ _Internal3_ _Internal4_\n" +
                                "op land _Internal_ _Internal1_ _Internal2_\n" +
                                "jump " + segments[2] + " equal _Internal_ 0";
                        }
                        break;
                    }
                    default:
                        output = "ucontrol flag " + segments[1];
                        break;
                }
                break;
            }
            case "parray":
            case "parr": {
                output = "op add @counter @counter " + segments[1] + " # P" + compileTimeVariables.homogenousJumps; // comment for identification
                compileTimeVariables.recentPointerArrays.push({
                    identification: compileTimeVariables.homogenousJumps,
                    variable: segments[1],
                    caseCount: 0
                });
                compileTimeVariables.homogenousJumps++;
                break;
            }
            case "/": {
                let search = compileTimeVariables.linesWithinFunction ? data : contents;
                let parrayData = compileTimeVariables.recentPointerArrays[compileTimeVariables.recentPointerArrays.length - 1];
                let insertIndex;
                for (let ln = 0; ln < search.length; ln++) {
                    if (search[ln].indexOf("op add @counter @counter " + parrayData.variable + " # P" + parrayData.identification) == 0) {
                        insertIndex = ln + parrayData.caseCount + 1;
                        search.splice(insertIndex, 0, "jump _BRANCHPARRAY" + parrayData.identification + "-" + parrayData.caseCount + "_ always");
                        parrayData.caseCount++;
                    }
                }
                output = "jump _MERGEPARRAY" + parrayData.identification + "_ always\n_BRANCHPARRAY"  + parrayData.identification + "-" + parrayData.caseCount + "_:"
                break;
            }
            case "//": {
                let search = compileTimeVariables.linesWithinFunction ? data : contents;
                let parrayData = compileTimeVariables.recentPointerArrays[compileTimeVariables.recentPointerArrays.length - 1];
                let insertIndex;
                for (let ln = 0; ln < search.length; ln++) {
                    if (search[ln].indexOf("op add @counter @counter " + parrayData.variable + " # P" + parrayData.identification) == 0) {
                        insertIndex = ln + parrayData.caseCount + 1;
                        search.splice(insertIndex, 0, "jump _BRANCHPARRAY" + parrayData.identification + "-" + parrayData.caseCount + "_ always\n_BRANCHPARRAY" + parrayData.identification + "-0_:");
                        parrayData.caseCount++;
                    }
                }
                output = "_MERGEPARRAY" + parrayData.identification + "_:";
                compileTimeVariables.recentPointerArrays.pop();
                break;
            }
        }
    } catch (e) {
        output = "";
        for (let el of segments) {
            output += el + " ";
        }
    }
    switch (typeof output) {
        case "undefined": {
            let insert = "";
            for (let el of segments) {
                insert += el + " ";
            };
            output = {
                header: "",
                contents: insert,
                footer: "",
                data: ""
            }
            break;
        }
        case "string": {
            output = {
                header: "",
                contents: output,
                footer: "",
                data: ""
            }
            break;
        }
    }
    if (output.unchangeable != true && compileTimeVariables.linesWithinFunction) {
        if (debugEnabled) {
            let recentFunction = compileTimeVariables.recentFunctions[0];
            let lines = output.contents.split("\n");
            for (let l = 0; l < lines.length; l++) {
                el = lines[l];
                el = el + " \# Function " + recentFunction
                lines[l] = el;
            }
            console.log(lines)
            let newContents = "";
            for (let el of lines) {
                newContents += el + "\n";
            }
            newContents = newContents.substring(0, newContents.length - 1);
            output.contents = newContents;
        }
        output = {
            header: output.header,
            contents: output.data,
            footer: output.footer,
            data: output.contents
        }
    }
    return output
}

// I WILL NOT FAIL TO HAVE GOOD BITWISE NOT
function bnot(number) { // please pass a bigint
    let out = BigInt(0);
    let inputString = number.toString(2);
    let negative = false;
    if (inputString[0] == "-") {
        inputString = inputString.substring(1);
        negative = true;
    }
    while (inputString.length < 64) {
        inputString = (negative ? "1" : "0") + inputString;
    }
    for (let i = 0n; i < 64n; i++) {
        out += inputString[BigInt(inputString.length) - i - BigInt(1)] == "0" ? BigInt(1) << i : BigInt(0);
    }
    return out;
}
