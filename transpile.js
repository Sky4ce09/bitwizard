//no template strings because
let l;
let spaces;
let newstrarr;
let map1;
let dividercount;
let hasImported;
let wf = (n) => {
  let p1 = spaces[n] + 1;
  let p2 = spaces[n + 1];
  return l.substring(p1, p2);
};
function tp(inp) {
  dividercount = 0;
  map1 = new Map();
  map1.set("recentFun", []);
  map1.set("recentTimer", []);
  map1.set("recentCS", []);
  map1.set("allocations", []);
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
    l = newstrarr[j];
    //index spaces of current line, then proceed
    spaces = [];
    for (let k = 0; k < l.length; k++) {
      if (l[k] == " " && l[k - 1] != " ") {
        spaces.push(k);
      }
    }
    //'VALUE' also works with variables

    //'terminate' makes the processor stuck until disabled (i think?)
    if (l.indexOf("terminate") == 0) {
      l = "op add @counter @counter -1";
    } else if (l.indexOf("timer") == 0) {
      //unlike with the wait instruction, this will let you run code while the timer is going
      switch (wf(0)) {
        //'timer new' expects parameters NAME and DURATION
        //use in conjunction with 'timer loop' and 'timer close'
        //starts a timer
        case "new":
          map1.get("recentTimer").push(wf(1));
          map1.set(wf(1), wf(2));
          l = "op add " + wf(1) + " @time " + wf(2);
          break;
        //'timer loop' expects parameter NAME
        //determines where the timer loop starts (creates a new label 'NAME'_TIMER)
        case "loop":
          l = wf(1) + "_TIMER:";
          break;
        //'timer extend' expects parameters NAME and DURATION
        //sorta redundant since there is absolutely no transformation here
        case "extend":
          l = "op add " + wf(1) + " " + wf(1) + " " + wf(2);
          break;
        //'timer close' expects no parameters
        //makes a timer actually come into effect
        case "close":
          l =
            "jump " +
            map1.get("recentTimer")[map1.get("recentTimer").length - 1] +
            "_TIMER lessThan @time " +
            map1.get("recentTimer")[map1.get("recentTimer").length - 1];
          map1.get("recentTimer").pop();
      }
    } else if (l.indexOf("spl") == 0) {
      let v;
      let spl;
      let slot;
      let skip = 0;
      let final;
      let des;
      let add;
      switch (wf(0)) {
        //'spl new' expects parameters VARNAME, NEW SPLIT NAME and ADDITIONAL PARAMETERS listed here
        //bitcount of natural number 1, bitcount 2, bitcount 3...
        //if you're out of ideas for the split name, try PascalCase on the varname and just use that
        //splits need names, that way you can assign multiple splits to one variable
        case "new":
          v = wf(1);
          map1.set(v, []);
          map1.set(wf(2), v);
          for (let i = 3; i < spaces.length + 1; i++) {
            map1.get(v).push(wf(i));
          }
          l = "";
          break;
        //'spl obtainf' expects parameters VARNAME, SPLIT NAME and (CONSTANT) INDEX
        //"split obtain fast"
        case "obtainf":
          v = wf(1);
          spl = map1.get(wf(2));
          slot = wf(3);

          for (let i = 0; i < slot * 1; i++) {
            skip = skip * 1 + map1.get(spl)[i] * 1;
          }

          //bitwise and setup

          final = (Math.pow(2, map1.get(spl)[slot * 1]) - 1) << skip;

          l = "op and " + v + " " + spl + " " + final;
          if (skip != 0) {
            l += "\nop shr " + v + " " + v + " " + skip;
          }
          break;
        //'spl obtainv' expects parameters VARNAME, SPLIT NAME and (VARIABLE) INDEX
        //"split obtain variable"
        case "obtainv":
          v = wf(1);
          spl = map1.get(wf(2));
          slot = wf(3);
          des = dividercount;

          l = "op mul _Internal_ " + slot + " 3\nop add @counter @counter _Internal_\n";
          for (let y = 0; y < map1.get(spl).length - 1; y++) {
            l +=
              "op and " +
              v +
              " " +
              spl +
              " " +
              ((Math.pow(2, map1.get(spl)[y]) - 1) << skip) +
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
          spl = map1.get(wf(1));
          slot = wf(2);

          for (let i = 0; i < slot * 1; i++) {
            skip = skip + map1.get(spl)[i] * 1;
          }

          //bitwise and setup

          final = ~((Math.pow(2, map1.get(spl)[slot * 1]) - 1) << skip);

          l = "op and " + spl + " " + spl + " " + final;
          break;
        //'spl clearv' expects parameters SPLIT NAME and (VARIABLE) INDEX
        //"split write variable"
        case "clearv":
          spl = map1.get(wf(1));
          slot = wf(2);
          des = dividercount;

          l = "op mul _Internal_ " + slot + " 2\nop add @counter @counter _Internal_\n";

          for (let y = 0; y < map1.get(spl).length - 1; y++) {
            l +=
              "op and " +
              spl +
              " " +
              spl +
              " " +
              ~((Math.pow(2, map1.get(spl)[y]) - 1) << skip);
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
          v = wf(1);
          spl = map1.get(wf(2));
          slot = wf(3);

          for (let i = 0; i < slot * 1; i++) {
            skip = skip + map1.get(spl)[i] * 1;
          }

          final = ~((Math.pow(2, map1.get(spl)[slot * 1]) - 1) << skip);
          add = v << skip;

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
            add;
          break;
        //'spl writev' expects parameters VALUE, SPLIT NAME and (VARIABLE) INDEX
        //"split write variable"
        case "writev":
          v = wf(1);
          spl = map1.get(wf(2));
          slot = wf(3);
          des = dividercount;

          l = "op mul _Internal_ " + slot + " 4\nop add @counter @counter _Internal_\n";

          for (let y = 0; y < map1.get(spl).length - 1; y++) {
            l +=
              "op and " +
              spl +
              " " +
              spl +
              " " +
              ~((Math.pow(2, map1.get(spl)[y]) - 1) << skip) +
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
    } else if (l.indexOf("fun") == 0) {
      //'fun new' expects parameter NAME
      //use in conjunction with 'fun close'
      if (l.indexOf("new") == 4) {
        if (wf(1) == "") {
          //function without a name
          throw "Can't have unannounced fun. Invite me to the party already!!";
        }
        map1.get("recentFun").push(wf(1));
        map1.set(wf(1), dividercount - 1);
        l = "jump " + wf(1) + "BRIDGE always\n" + wf(1) + ":";
        //'fun close' expects no parameters
      } else if (l.indexOf("close") == 4) {
        let p = map1.get("recentFun");
        l =
          "set @counter " +
          p[p.length - 1] +
          "_CALLBACK\n" +
          p[p.length - 1] +
          "BRIDGE:";
        map1.get("recentFun").pop();
        //Have fun!
        //'fun have' expects parameter FUNCTION NAME
      } else if (l.indexOf("have") == 4) {
        l =
          "op add " + wf(1) + "_CALLBACK @counter 1\njump " + wf(1) + " always";
      } else {
        throw "Invalid fun instruction!";
      }
      //log2 expects parameters VARNAME (output) and VALUE
      //VARNAME may be the same as VALUE
      //automatically imports LN2 if necessary
    } else if (l.indexOf("log2") == 0) {
      l =
        "op log " +
        wf(0) +
        " " +
        wf(1) +
        "\nop div " +
        wf(0) +
        " " +
        wf(0) +
        " LN2";
      if (
        newstrarr.indexOf("import LN2") == -1 &&
        outstr.indexOf("op log LN2 2\n") == -1
      ) {
        hasImported = 1;
        outstr += "op log LN2 2\n";
      }
      //'import' expects any of the below cases as parameter
    } else if (l.indexOf("import") == 0) {
      hasImported = 1;
      switch (wf(0)) {
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
      //'countswitch' expects parameters (CONSTANT) CASECOUNT and VALUE
      //never forget to close your cases
    } else if (l.indexOf("countswitch") == 0) {
      let cases = wf(0) * 1;
      let des = dividercount;
      l = "op add @counter @counter " + wf(1) + "\n";
      for (let i = 0; i < cases; i++) {
        l += "jump " + des + "_d" + i + " always\n";
      }
      map1.get("recentCS").push([cases, 1, des]);
      l += des + "_d0:";
      dividercount++;
      //'/' expects no parameters
      //closes a case
    } else if (l.indexOf("/") == 0) {
      let h = map1.get("recentCS")[map1.get("recentCS").length - 1];
      if (h[0] > h[1]) {
        l =
          "jump _DESTINATION" + h[2] + "_ always\n" + h[2] + "_d" + h[1] + ":";
        h[1] = h[1] + 1;
      } else {
        l = "_DESTINATION" + h[2] + "_:\n";
        map1.delete(h);
      }
    }
    newstrarr[j] = l;
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