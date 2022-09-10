//no template strings because
let l;
let newstrarr;
let map1;
let dividercount;
let hasImported;
let loopcount;
let maxLine;

function condLookup(inCond) {
    switch (inCond) {
        case "==":
        case "equal":
            return ["equal", "notEqual"];
        case "===":
            return ["strictEqual", "notEqual"];
        case "!=":
        case "not":
        case "notEqual":
            return ["notEqual", "equal"];
        case ">":
        case "greaterThan":
            return ["greaterThan", "lessThanEq"];
        case "<":
        case "lessThan":
            return ["lessThan", "greaterThanEq"];
        case ">=":
        case "greaterThanEq":
            return ["greaterThanEq", "lessThan"];
        case "<":
        case "lessThanEq":
            return ["lessThanEq", "greaterThan"];
        default:
            return ["equal", "notEqual"];
    }
}

function tp(inp) {
    maxLine = 0;
    try {
        return f(inp);
    } catch (e) {
        return (
            "Transpilation error at line " + maxLine + " (JavaScript: " + e + ")"
        );
    }
}
function prepareLine(input) {
    while (input[0] == " " || input[0] == "\t") {
        input = input.substring(1, input.length);
    }
    let bf = input.split(" "); //buffered segments
    let out = [];
    let pair = "";
    for (let i = 0; i < bf.length; i++) {
        if (
            bf[i].indexOf('"') != -1 &&
            bf[i].substring(bf[i].indexOf('"'), bf[i].length).indexOf('"') == -1
        ) {
            if (pair == "") {
                pair = bf[i];
            } else {
                pair += bf[i];
                out.push(pair);
                pair = "";
            }
        } else if (pair == "") {
            out.push(bf[i]);
        } else {
            pair += bf[i];
        }
    }
    return out;
}
function parseRest(input, startIndex) {
    let out = "";
    for (let i = 0; i < input.length - 1; i++) {
        input[i] += " ";
    }
    for (let i = startIndex; i < input.length; i++) {
        out += input[i];
    }
    return out;
}
function testNumber(string) {
    try {
        let number = string * 1;
        if (isNaN(number)) return false;
        return true;
    } catch (e) {
        return false;
    }
}
function f(inp) {
    dividercount = 0;
    loopcount = 0;
    map1 = new Map();
    map1.set("recentFunInternal", []);
    map1.set("recentTimerInternal", []);
    map1.set("recentPAInternal", []);
    map1.set("recentForInternal", []);
    newstrarr = [];
    hasImported = 0;
    let i = 0;
    let outstr = "";
    //puts lines into array items
    let j = 0;
    while (j < inp.length) {
        if (inp[j] == "\n") {
            newstrarr.push(inp.substring(i, j));
            i = j + 1;
        }
        j += 1;
    }
    newstrarr.push(inp.substring(i, j));

    let funs = [];
    let lineConsistency = false;
    for (let j = 0; j < newstrarr.length; j++) {
        l = prepareLine(newstrarr[j]);
        //'VALUE' also works with variables !!UNLESS SPECIFIED OTHERWISE!!

        let v;
        let spl;
        let slot;
        let skip = 0;
        let final;
        let des = 0;
        let add;
        let bits = [];

        switch (l[0]) {
            //makes code segments read down the line consistent in terms of line count whereever applicable, but less optimized as a result
            case "consistent":
            case "con":
                lineConsistency = true;
                l = "#consistent line counts vvv";
                break;

            //makes code segments read down the line more optimized, but inconsistent in terms of line count (default)
            case "inconsistent":
            case "incon":
                lineConsistency = false;
                l = "#inconsistent line counts vvv";
                break;

            //'terminate' makes the processor stuck until disabled (i think?)
            case "terminate":
                l = "op add @counter @counter -1";
                break;

            //unlike with the wait instruction, this will let you run code while the timer is going
            case "timer":
                switch (l[1]) {
                    //'timer new' expects parameters NAME and DURATION
                    //use in conjunction with 'timer loop' and 'timer close'
                    //starts a timer
                    case "new":
                        map1.get("recentTimerInternal").push(l[2]);
                        map1.set(l[2], l[3]);
                        l = "op add " + l[2] + " @time " + l[3];
                        break;
                    //'timer loop' expects parameter NAME
                    //determines where the timer loop starts (creates a new label 'NAME'_TIMER)
                    case "loop":
                        l = l[2] + "_TIMER:";
                        break;
                    //'timer extend' expects parameters NAME and DURATION
                    //sorta redundant since there is absolutely no transformation here
                    case "extend":
                        l = "op add " + l[2] + " " + l[2] + " " + l[3];
                        break;
                    //'timer close' expects no parameters
                    //makes a timer actually come into effect
                    case "close":
                        l =
                            "jump " +
                            map1.get("recentTimerInternal")[
                            map1.get("recentTimerInternal").length - 1
                            ] +
                            "_TIMER lessThan @time " +
                            map1.get("recentTimerInternal")[
                            map1.get("recentTimerInternal").length - 1
                            ];
                        map1.get("recentTimerInternal").pop();
                }
                break;

            //flag utils
            case "uflag":
                if (true) {
                    let condition;
                    let oppositeCondition;
                    let utype;
                    let flag;
                    let output;
                    let add;
                    switch (l[1]) {
                        //'uflag get' may expect a parameter SAFETY and expects parameters UNIT TYPE and FLAG
                        //also has optional tail parameter pairs ESCAPE CONDITION

                        //ik this is confusing

                        //binds a unit of a given type that has a specific flag
                        case "get":
                            if (l[2] == "any") {
                                utype = l[3];
                                flag = l[4];
                                let escapeConditions = "\n";
                                if (l.length > 6) {
                                    let condCount = 1;
                                    for (let i = 8; i < l.length; i += 2) {
                                        condCount++;
                                    }
                                    let p = 5;
                                    for (let i = 0; i < condCount; i++) {
                                        let innerCondition = condLookup(l[p])[0];
                                        let rightSide = l[p + 1];
                                        escapeConditions += "jump UFLAGGET" + j + "B " + innerCondition + " @unit " + rightSide + "\n";
                                        p += 2;
                                    }
                                    escapeConditions = escapeConditions.substring(0, escapeConditions.length - 1) //cut off the last newline
                                }
                                l = `UFLAGGET${j}A:
ubind ${utype}
sensor _Internal_ @unit @flag
jump UFLAGGET${j}B strictEqual _Internal_ ${flag}${escapeConditions}
jump UFLAGGET${j}A always
UFLAGGET${j}B:`;
                            } else {
                                utype = l[2];
                                flag = l[3];
                                let escapeConditions = "\n";
                                if (l.length > 5) {
                                    let condCount = 1;
                                    for (let i = 7; i < l.length; i += 2) {
                                        condCount++;
                                    }
                                    let p = 4;
                                    for (let i = 0; i < condCount; i++) {
                                        let innerCondition = condLookup(l[p])[0];
                                        let rightSide = l[p + 1];
                                        escapeConditions += "jump UFLAGGET" + j + "B " + innerCondition + " @unit " + rightSide + "\n";
                                        p += 2;
                                    }
                                    escapeConditions = escapeConditions.substring(0, escapeConditions.length - 1) //cut off the last newline
                                }
                                l = `UFLAGGET${j}A:
ubind ${utype}
sensor _Internal_ @unit @flag${escapeConditions}
jump UFLAGGET${j}A notEqual _Internal_ ${flag}
sensor _Internal_ @unit @controlled
jump UFLAGGET${j}A notEqual _Internal_ 0
UFLAGGET${j}B:`;
                            }
                            break;

                        //'uflag await' may expect a parameter CONDITION FLIP and expects a parameter FLAG
                        //waits for the bound unit to receive a flag
                        case "await":
                            condition = condLookup(l[2])[0];
                            oppositeCondition = condLookup(l[2])[1];
                            if (l.length > 3) {
                                flag = l[3];
                                l = `UFLAGAWAIT${j}:
sensor _Internal_ @unit @flag
jump UFLAGAWAIT${j} ${oppositeCondition} _Internal_ ${flag}`;
                            } else {
                                flag = l[2];
                                l = `UFLAGAWAIT${j}:
sensor _Internal_ @unit @flag
jump UFLAGAWAIT${j} notEqual _Internal_ ${flag}`;
                            }
                            break;

                        //'uflag test' may expect a parameter CONDITION and expects parameters FLAG and OUTPUT
                        //tests @unit's flag
                        case "test":
                            condition = condLookup(l[2])[0];
                            oppositeCondition = condLookup(l[2])[1];
                            if (l.length > 4) {
                                flag = l[3];
                                output = l[4];
                                l = `sensor _Internal_ @unit @flag
op ${condition} ${output} _Internal_ ${flag}`;
                            } else {
                                flag = l[2];
                                output = l[3];
                                l = `sensor _Internal_ @unit @flag
op equal ${output} _Internal_ ${flag}`;
                            }
                            break;

                        //'uflag verify' expects a parameter FUNCTION or GOTO
                        //jumps / calls a function if @unit is either being controlled by another processor or dead
                        case "verify":
                            for (let fun of funs) {
                                if (fun === l[2]) {
                                    l = "sensor _Internal1_ @unit @controlled\n" + //i just cant be consistent with code formatting for strings
                                        "sensor _Internal2_ @unit @dead\n" +
                                        "op sub _Internal2_ 1 _Internal2_\n" +
                                        "op strictEqual _Internal3_ _Internal1_ @this\n" +
                                        "op strictEqual _Internal4_ _Internal1_ null\n" +
                                        "op add _Internal1_ _Internal3_ _Internal4_\n" +
                                        "op land _Internal_ _Internal1_ _Internal2_\n" +
                                        "op add " + fun + "_CB @counter 1\n" +
                                        "jump " + fun + " equal _Internal_ 0";
                                    break;
                                }
                            }
                            if (typeof l == 'string') { break; } else {
                                l = "sensor _Internal1_ @unit @controlled\n" +
                                    "sensor _Internal2_ @unit @dead\n" +
                                    "op sub _Internal2_ 1 _Internal2_\n" +
                                    "op strictEqual _Internal3_ _Internal1_ @this\n" +
                                    "op strictEqual _Internal4_ _Internal1_ null\n" +
                                    "op add _Internal1_ _Internal3_ _Internal4_\n" +
                                    "op land _Internal_ _Internal1_ _Internal2_\n" +
                                    "jump " + l[2] + " equal _Internal_ 0";
                                break;
                            }

                        //'uflag' expects a parameter FLAG
                        //flags bound @unit
                        default:
                            add = l[1];
                            l = "ucontrol flag " + add;
                            break;
                    }
                    break;
                }

            case "spl":
                switch (l[1]) {
                    //'spl new' expects parameters VARNAME, NEW SPLIT NAME and ADDITIONAL PARAMETERS listed here
                    //bitcount of natural number 1, bitcount 2, bitcount 3...
                    //if you're out of ideas for the splitter name, try PascalCase on the varname and just use that
                    //splitters need names because you can assign multiple splitters to one variable
                    case "new":
                        v = l[2];
                        map1.set(l[3], [v, []]);
                        for (let i = 4; i < l.length; i++) {
                            map1.get(l[3])[1].push(l[i]);
                        }
                        l = "";
                        break;
                    //'spl obtainf' expects parameters VARNAME, SPLIT NAME and (CONSTANT) INDEX
                    //"split obtain fast"
                    case "obtainf":
                    case "of":
                        v = l[2];
                        spl = map1.get(l[3])[0];
                        bits = map1.get(l[3])[1];
                        slot = l[4];

                        for (let i = 0; i < slot * 1; i++) {
                            skip = skip * 1 + bits[i] * 1;
                        }

                        //bitwise and setup

                        final = BigInt(2 ** bits[slot * 1] - 1);

                        l = "";
                        if (skip != 0 || lineConsistency) {
                            console.warn(lineConsistency);
                            l += "op shr " + v + " " + spl + " " + skip + "\n";
                            l += "op and " + v + " " + v + " " + final + "\n";
                        } else {
                            l += "op and " + v + " " + spl + " " + final + "\n";
                        }
                        break;
                    //'spl obtaind' expects parameters VARNAME, SPLIT NAME and (VARIABLE) INDEX
                    //"split obtain dynamic"
                    case "obtaind":
                    case "od":
                        v = l[2];
                        spl = map1.get(l[3])[0];
                        bits = map1.get(l[3])[1];
                        slot = l[4];
                        des = dividercount;

                        l =
                            "op mul _Internal_ " +
                            slot +
                            " 3\nop add @counter @counter _Internal_\n";
                        for (let y = 0; y < bits.length; y++) {
                            l +=
                                "op shr " +
                                v +
                                " " +
                                spl +
                                " " +
                                skip +
                                "\nop and " +
                                v +
                                " " +
                                v +
                                " " +
                                BigInt(Math.pow(2, bits[y]) - 1);
                            if (y != bits.length - 1) {
                                l += "\njump _DESTINATION" + des + "_ always\n";
                            }
                            skip += bits[y] * 1;
                        }
                        l += "\n_DESTINATION" + des + "_:";
                        dividercount++;
                        break;
                    //'spl clearf' expects parameters SPLIT NAME and (CONSTANT) INDEX
                    //"split clear fast"
                    case "clearf":
                    case "cf":
                        spl = map1.get(l[2])[0];
                        bits = map1.get(l[2])[1];
                        slot = l[3];

                        for (let i = 0; i < slot * 1; i++) {
                            skip = skip + bits[i] * 1;
                        }

                        //bitwise and setup

                        final = ~(BigInt(Math.pow(2, bits[slot * 1]) - 1) << BigInt(skip));

                        l = "op and " + spl + " " + spl + " " + final;
                        break;
                    //'spl cleard' expects parameters SPLIT NAME and (VARIABLE) INDEX
                    //"split write dynamic"
                    case "cleard":
                    case "cd":
                        spl = map1.get(l[2])[0];
                        bits = map1.get(l[2])[1];
                        slot = l[3];
                        des = dividercount;

                        l =
                            "op mul _Internal_ " +
                            slot +
                            " 2\nop add @counter @counter _Internal_\n";

                        for (let y = 0; y < bits.length; y++) {
                            l +=
                                "op and " +
                                spl +
                                " " +
                                spl +
                                " " +
                                ~(BigInt(Math.pow(2, bits[y]) - 1) << BigInt(skip));
                            if (y != bits.length - 1) {
                                l += "\njump _DESTINATION" + des + "_ always\n";
                            }
                            skip += bits[y] * 1;
                        }
                        l += "\n_DESTINATION" + des + "_:";
                        dividercount++;
                        break;
                    //'spl writecf' expects parameters VALUE, SPLIT NAME and (CONSTANT) INDEX
                    //"split write fast"
                    case "writef":
                    case "wf":
                        v = l[2];
                        spl = map1.get(l[3])[0];
                        bits = map1.get(l[3])[1];
                        slot = l[4];

                        for (let i = 0; i < slot * 1; i++) {
                            skip = skip + bits[i] * 1;
                        }

                        final = ~(BigInt(Math.pow(2, bits[slot * 1]) - 1) << BigInt(skip));
                        if (testNumber(v) && lineConsistency == false) {
                            v = BigInt(v) << BigInt(skip)

                            l =
                                "op and " +
                                spl +
                                " " +
                                spl +
                                " " +
                                final +
                                "\nop add " +
                                spl +
                                " " +
                                spl +
                                " " +
                                v;
                        } else {
                            l =
                                "op and " +
                                spl +
                                " " +
                                spl +
                                " " +
                                final +
                                "\nop shl _Internal_ " +
                                v +
                                " " +
                                skip +
                                "\nop add " +
                                spl +
                                " " +
                                spl +
                                " _Internal_";
                        }
                        break;
                    //'spl writed' expects parameters VALUE, SPLIT NAME and (VARIABLE) INDEX
                    //"split write dynamic"
                    case "writed":
                    case "wd":
                        v = l[2];
                        spl = map1.get(l[3])[0];
                        bits = map1.get(l[3])[1];
                        slot = l[4];
                        des = dividercount;

                        if (testNumber(v) && lineConsistency == false) {
                            l =
                                "op mul _Internal_ " +
                                slot +
                                " 3\nop add @counter @counter _Internal_\n";
                            for (let y = 0; y < bits.length; y++) {
                                let precalcValue = BigInt(v) << BigInt(skip);
                                l +=
                                    "op and " +
                                    spl +
                                    " " +
                                    spl +
                                    " " +
                                    ~(BigInt(Math.pow(2, bits[y]) - 1) << BigInt(skip)) +
                                    "\nop add " +
                                    spl +
                                    " " +
                                    spl +
                                    " " +
                                    precalcValue +
                                    "\n";
                                if (y != bits.length - 1) {
                                    l += "jump _DESTINATION" + des + "_ always\n";
                                }
                                skip += bits[y] * 1;
                            }
                        } else {
                            l =
                                "op mul _Internal_ " +
                                slot +
                                " 4\nop add @counter @counter _Internal_\n";
                            for (let y = 0; y < bits.length; y++) {
                                l +=
                                    "op and " +
                                    spl +
                                    " " +
                                    spl +
                                    " " +
                                    ~(BigInt(Math.pow(2, bits[y]) - 1) << BigInt(skip)) +
                                    "\nop shl _Internal_ " +
                                    v +
                                    " " +
                                    skip +
                                    "\nop add " +
                                    spl +
                                    " " +
                                    spl +
                                    " _Internal_\n";
                                if (y != bits.length - 1) {
                                    l += "jump _DESTINATION" + des + "_ always\n";
                                }
                                skip += bits[y] * 1;
                            }
                        }
                        l += "_DESTINATION" + des + "_:";
                        dividercount++;
                        break;
                }
                break;

            case "fun":
                switch (l[1]) {
                    //'fun new' expects parameter NAME
                    //use in conjunction with 'fun close'
                    case "new":
                        if (l.length == 2) {
                            //function without a name
                            l = "#Give your function a good name...";
                            break;
                        }
                        map1.get("recentFunInternal").push(l[2]);
                        map1.set(l[2], dividercount - 1);
                        funs.push(l[2]);
                        l = "jump " + l[2] + "BRIDGE always\n" + l[2] + ":";
                        break;
                    //'fun close' expects no parameters
                    case "close":
                        let p = map1.get("recentFunInternal");
                        l =
                            "set @counter " +
                            p[p.length - 1] +
                            "_CB\n" +
                            p[p.length - 1] +
                            "BRIDGE:";
                        map1.get("recentFunInternal").pop();
                        break;
                    //Have fun!
                    //'fun have' expects parameter FUNCTION NAME
                    case "have":
                    case "call":
                        if (l.length == 2) {
                            //function without a name
                            l =
                                "#Can't have unannounced fun. Invite me to the party already!\n#(no function name provided)";
                            break;
                        }
                        l =
                            "op add " +
                            l[2] +
                            "_CB @counter 1\njump " +
                            l[2] +
                            " always";
                        break;
                }
                break;

            //log2 expects parameters VARNAME (output) and VALUE
            //VARNAME may be the same as VALUE
            //automatically imports LN2 if necessary
            case "log2":
                l =
                    "op log " +
                    l[1] +
                    " " +
                    l[2] +
                    "\nop div " +
                    l[1] +
                    " " +
                    l[1] +
                    " LN2";
                if (
                    newstrarr.indexOf("import LN2") == -1 &&
                    outstr.indexOf("op log LN2 2\n") == -1
                ) {
                    hasImported = 1;
                    outstr += "op log LN2 2\n";
                }
                break;

            //'define' expects any of the below cases as parameter
            case "define":
            case "def":
                hasImported = 1;
                switch (l[1]) {
                    case "LN2":
                        if (outstr.indexOf("op log LN2 2") == -1) {
                            outstr += "op log LN2 2\n";
                        }
                        break;
                    case "LN16":
                        if (outstr.indexOf("op log LN16 16\n") == -1) {
                            outstr += "op log LN16 16\n";
                        }
                        break;
                    case "PI":
                        if (outstr.indexOf("set PI 3.1415926535897932\n") == -1) {
                            outstr += "set PI 3.1415926535897932\n";
                        }
                        break;
                }
                l = "";
                break;

            //'parray' expects parameters (CONSTANT) POINTERCOUNT and VALUE
            //never forget to close your cases
            case "pointarray":
            case "parray":
            case "parr":
                let cases = l[1] * 1;
                des = dividercount;
                l = "op add @counter @counter " + l[2] + "\n";
                for (let i = 0; i < cases; i++) {
                    l += "jump " + des + "_d" + i + " always\n";
                }
                map1.get("recentPAInternal").push([cases, 1, des]);
                l += des + "_d0:\n";
                dividercount++;
                break;

            //'/' expects no parameters
            //closes a case
            case "/":
                let h = map1.get("recentPAInternal")[
                    map1.get("recentPAInternal").length - 1
                ];
                if (h[0] > h[1]) {
                    l =
                        "jump _DESTINATION" +
                        h[2] +
                        "_ always\n" +
                        h[2] +
                        "_d" +
                        h[1] +
                        ":";
                    h[1] = h[1] + 1;
                } else {
                    l = "_DESTINATION" + h[2] + "_:\n";
                    map1.get("recentPAInternal").pop();
                }
                break;

            case "printf":
            case "pf":
                l = "printflush " + l[1];
                break;

            case "drawf":
            case "df":
                l = "drawflush " + l[1];
                break;

            case "jmp":
            case "j":
                l = "jump " + parseRest(l, 1);
                break;
            case "for":
                if (true) {
                    let summand;
                    let condition;
                    let oppositeCondition;
                    let warn = 0;
                    let variable;
                    let setTo;
                    let rightside;
                    let m;
                    let id;
                    let l2;
                    let l3;
                    variable = l[1];
                    if (l[2] == "=") {
                        setTo = l[3];
                        condition = l[4];
                        rightside = l[5];
                        summand = l[6];
                    } else {
                        condition = l[2];
                        rightside = l[3];
                        summand = l[4];
                    }
                    //condition dictionary
                    switch (condition) {
                        case "==":
                            condition = "equal";
                            oppositeCondition = "notEqual";
                            break;
                        case "!=":
                        case "not":
                            condition = "notEqual";
                            oppositeCondition = "equal";
                            break;
                        case ">=":
                            condition = "greaterThanEq";
                            oppositeCondition = "lessThan";
                            break;
                        case "<=":
                            condition = "lessThanEq";
                            oppositeCondition = "greaterThan";
                            break;
                        case ">":
                            condition = "greaterThan";
                            oppositeCondition = "lessThanEq";
                            break;
                        case "<":
                            condition = "lessThan";
                            oppositeCondition = "greaterThanEq";
                            break;
                        case "===":
                            condition = "strictEqual";
                            warn = 1;
                            break;
                    }
                    map1
                        .get("recentForInternal")
                        .push([
                            loopcount,
                            variable,
                            summand,
                            condition,
                            rightside,
                            l.length - 2 * (l[2] == "="),
                        ]);
                    l2 = "_FORLOOP" + loopcount + "_:\n";
                    l3 = "set " + variable + " " + setTo + "\n";
                    if (warn) {
                        if (variable != setTo && l.length >= 6) {
                            l =
                                l3 +
                                `op strictEqual _Internal_ ${variable} ${rightside}\n` +
                                "jump _ENDLOOP" +
                                loopcount +
                                "_ notEqual _Internal_ 1\n" +
                                l2;
                        } else {
                            l =
                                `op strictEqual _Internal_ ${variable} ${rightside}\n` +
                                "jump _ENDLOOP" +
                                loopcount +
                                "_ notEqual _Internal_ 1\n" +
                                l2;
                        }
                    } else {
                        if (variable != setTo && l.length >= 6) {
                            l =
                                l3 +
                                "jump _ENDLOOP" +
                                loopcount +
                                "_ " +
                                oppositeCondition +
                                " " +
                                variable +
                                " " +
                                rightside +
                                "\n" +
                                l2;
                        } else {
                            l =
                                "jump _ENDLOOP" +
                                loopcount +
                                "_ " +
                                oppositeCondition +
                                " " +
                                variable +
                                " " +
                                rightside +
                                "\n" +
                                l2;
                        }
                        loopcount++;
                    }
                }
                break;
            case "next":
                if (true) {
                    let variable;
                    let condition;
                    let rightside;
                    let m;
                    let id;
                    let l2;
                    let summand;
                    m = map1.get("recentForInternal").pop();
                    id = m[0];
                    variable = m[1];
                    summand = m[2];
                    condition = m[3];
                    rightside = m[4];
                    let lineLen = m[5];
                    if (lineLen >= 5) {
                        l =
                            `op add ${variable} ${variable} ${summand}` +
                            "\n" +
                            `jump _FORLOOP${id}_ ${condition} ${variable} ${rightside}` +
                            "\n" +
                            `_ENDLOOP${id}_:` +
                            "\n";
                    } else {
                        l =
                            `jump _FORLOOP${id}_ ${condition} ${variable} ${rightside}` +
                            "\n" +
                            `_ENDLOOP${id}_:` +
                            "\n";
                    }
                }
                break;
        }
        if (typeof l == "object") {
            let outl = l[0];
            for (let it = 1; it < l.length; it++) {
                outl = outl + " " + l[it];
            }
            newstrarr[j] = outl;
        } else {
            newstrarr[j] = l;
        }
        maxLine++;
    }
    if (hasImported == 1) {
        outstr += "_PSTART_:\n";
    }
    for (let line of newstrarr) {
        if (line[0] != "\n" && line[0] != undefined) {
            outstr += line;
            if (line[line.length - 1] != "\n") {
                outstr += "\n";
            }
        }
    }
    if (hasImported == 1) {
        outstr += "jump _PSTART_ always\n";
    } else {
        outstr += "end";
    }
    return outstr;
}
