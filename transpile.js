//no template strings because
let l;
let newstrarr;
let map1;
let dividercount;
let hasImported;
function tp(inp) {
  try {
    return f(inp);
  } catch (e) {}
}
function prepareLine(input) {
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
function f(inp) {
  dividercount = 0;
  map1 = new Map();
  map1.set("recentFunInternal", []);
  map1.set("recentTimerInternal", []);
  map1.set("recentCSInternal", []);
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
  for (let j = 0; j < newstrarr.length; j++) {
    l = prepareLine(newstrarr[j]);
    //'VALUE' also works with variables

    switch (l[0]) {
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

      case "spl":
        let v;
        let spl;
        let slot;
        let skip = 0;
        let final;
        let des;
        let add;
        switch (l[1]) {
          //'spl new' expects parameters VARNAME, NEW SPLIT NAME and ADDITIONAL PARAMETERS listed here
          //bitcount of natural number 1, bitcount 2, bitcount 3...
          //if you're out of ideas for the split name, try PascalCase on the varname and just use that
          //splits need names, that way you can assign multiple splits to one variable
          case "new":
            v = l[2];
            map1.set(v, []);
            map1.set(l[3], v);
            for (let i = 4; i < l.length; i++) {
              map1.get(v).push(l[i]);
            }
            l = "";
            break;
          //'spl obtainf' expects parameters VARNAME, SPLIT NAME and (CONSTANT) INDEX
          //"split obtain fast"
          case "obtainf":
          case "of":
            v = l[2];
            spl = map1.get(l[3]);
            slot = l[4];

            for (let i = 0; i < slot * 1; i++) {
              skip = skip * 1 + map1.get(spl)[i] * 1;
            }

            //bitwise and setup

            final = BigInt(2 ** map1.get(spl)[slot * 1] - 1) << BigInt(skip);

            l = "op and " + v + " " + spl + " " + final;
            if (skip != 0) {
              l += "\nop shr " + v + " " + v + " " + skip;
            }
            break;
          //'spl obtainv' expects parameters VARNAME, SPLIT NAME and (VARIABLE) INDEX
          //"split obtain variable"
          case "obtainv":
          case "ov":
            v = l[2];
            spl = map1.get(l[3]);
            slot = l[4];
            des = dividercount;

            l =
              "op mul _Internal_ " +
              slot +
              " 3\nop add @counter @counter _Internal_\n";
            for (let y = 0; y < map1.get(spl).length - 1; y++) {
              l +=
                "op and " +
                v +
                " " +
                spl +
                " " +
                (BigInt(Math.pow(2, map1.get(spl)[y]) - 1) << BigInt(skip)) +
                "\nop shr " +
                v +
                " " +
                v +
                " " +
                skip;
              if (y != map1.get(spl).length - 2) {
                l += "\njump _DESTINATION" + des + "_ always\n";
              }
              skip += map1.get(spl)[y] * 1;
            }
            l += "\n_DESTINATION" + des + "_:";
            dividercount++;
            break;
          //'spl clearf' expects parameters SPLIT NAME and (CONSTANT) INDEX
          //"split clear fast"
          case "clearf":
          case "cf":
            spl = map1.get(l[2]);
            slot = l[3];

            for (let i = 0; i < slot * 1; i++) {
              skip = skip + map1.get(spl)[i] * 1;
            }

            //bitwise and setup

            final = ~(
              BigInt(Math.pow(2, map1.get(spl)[slot * 1]) - 1) << BigInt(skip)
            );

            l = "op and " + spl + " " + spl + " " + final;
            break;
          //'spl clearv' expects parameters SPLIT NAME and (VARIABLE) INDEX
          //"split write variable"
          case "clearv":
          case "cv":
            spl = map1.get(l[2]);
            slot = l[3];
            des = dividercount;

            l =
              "op mul _Internal_ " +
              slot +
              " 2\nop add @counter @counter _Internal_\n";

            for (let y = 0; y < map1.get(spl).length - 1; y++) {
              l +=
                "op and " +
                spl +
                " " +
                spl +
                " " +
                ~(BigInt(Math.pow(2, map1.get(spl)[y]) - 1) << BigInt(skip));
              if (y != map1.get(spl).length - 2) {
                l += "\njump _DESTINATION" + des + "_ always\n";
              }
              skip += map1.get(spl)[y] * 1;
            }
            l += "\n_DESTINATION" + des + "_:";
            dividercount++;
            break;
          //'spl writef' expects parameters VALUE, SPLIT NAME and (CONSTANT) INDEX
          //"split write fast"
          case "writef":
          case "wf":
            v = l[2];
            spl = map1.get(l[3]);
            slot = l[4];

            for (let i = 0; i < slot * 1; i++) {
              skip = skip + map1.get(spl)[i] * 1;
            }

            final = ~(
              BigInt(Math.pow(2, map1.get(spl)[slot * 1]) - 1) << BigInt(skip)
            );

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
            break;
          //'spl writev' expects parameters VALUE, SPLIT NAME and (VARIABLE) INDEX
          //"split write variable"
          case "writev":
          case "wv":
            v = l[2];
            spl = map1.get(l[3]);
            slot = l[4];
            des = dividercount;

            l =
              "op mul _Internal_ " +
              slot +
              " 4\nop add @counter @counter _Internal_\n";

            for (let y = 0; y < map1.get(spl).length - 1; y++) {
              l +=
                "op and " +
                spl +
                " " +
                spl +
                " " +
                ~(BigInt(Math.pow(2, map1.get(spl)[y]) - 1) << BigInt(skip)) +
                "\nop shl _Internal_ " +
                v +
                " " +
                skip +
                "\nop add " +
                spl +
                " " +
                spl +
                " _Internal_\n";
              if (y != map1.get(spl).length - 2) {
                l += "jump _DESTINATION" + des + "_ always\n";
              }
              skip += map1.get(spl)[y] * 1;
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
            l = "jump " + l[2] + "BRIDGE always\n" + l[2] + ":";
            break;
          //'fun close' expects no parameters
          case "close":
            let p = map1.get("recentFunInternal");
            l =
              "set @counter " +
              p[p.length - 1] +
              "_CALLBACK\n" +
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
              l = "#Can't have unannounced fun. Invite me to the party already!\n#(no function name provided)";
              break;
            }
            l =
              "op add " +
              l[2] +
              "_CALLBACK @counter 1\njump " +
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

      //'import' expects any of the below cases as parameter
      case "import":
      case "imp":
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

      //'countsw' expects parameters (CONSTANT) CASECOUNT and VALUE
      //never forget to close your cases
      case "countswitch":
      case "countsw":
      case "csw":
        let cases = l[1] * 1;
        des = dividercount;
        l = "op add @counter @counter " + l[2] + "\n";
        for (let i = 0; i < cases; i++) {
          l += "jump " + des + "_d" + i + " always\n";
        }
        map1.get("recentCSInternal").push([cases, 1, des]);
        l += des + "_d0:";
        dividercount++;
        break;

      //'/' expects no parameters
      //closes a case
      case "/":
        let h = map1.get("recentCSInternal")[
          map1.get("recentCSInternal").length - 1
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
          map1.delete(h);
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
