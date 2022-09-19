let compileTimeVariables = {
    recentStroke: "not set",
    recentX: "not set",
    recentY: "not set",
    recentX2: "not set",
    recentX2: "not set"
}

class SizedCanvas {
    constructor(canvas, size) {
        this.canvas = canvas;
        this.size = size;
    }
}

class Interface {
    constructor(src, spriteWidth, spriteHeight, pixelSize, contents = []) {
        this.src = src;
        this.ctx = src.getContext("2d");
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.pixelSize = pixelSize;
        this.contents = contents;
        this.blank();
    }
    adjust(inserted) {
        try {
            inserted.spriteWidth *= 1;
            inserted.spriteHeight *= 1;
            inserted.pixelSize *= 1;
        } catch (e) {
            return;
        }
        if (inserted.spriteWidth >= 1) this.spriteWidth = inserted.spriteWidth;
        if (inserted.spriteHeight >= 1) this.spriteHeight = inserted.spriteHeight;
        if (inserted.pixelSize >= 1) this.pixelSize = inserted.pixelSize;
        this.src.width = this.spriteWidth * this.pixelSize;
        this.src.height = this.spriteHeight * this.pixelSize;
        this.blank();
        canvasDrawContent(this);
    }
    blank() {
        this.ctx.scale(this.pixelSize, this.pixelSize);
        this.ctx.fillStyle = "#222222"
        this.ctx.fillRect(0, 0, this.spriteWidth, this.spriteHeight);
        let pal = ["#555555", "#AAAAAA"];
        for (let i = 0; i < this.spriteHeight * 2; i++) {
            for (let j = 0; j < this.spriteWidth * 2; j++) {
                let col = pal[(i + j) % 2];
                this.ctx.fillStyle = col;
                this.ctx.fillRect(j / 2, i / 2, 1/2, 1/2);
            }
        }
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

function canvasDrawContent(itf) {
    itf.ctx.scale(itf.pixelSize, itf.pixelSize);
    let ch = itf.spriteHeight;
    for (let el of itf.contents) {
        let color = el.splitColor();
        color[3] /= 255;
        console.log(`rgb(${color[0]},${color[1]},${color[2]},${color[3]})`);
        itf.ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]},${color[3]})`;
        itf.ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]},${color[3]})`;
        itf.ctx.lineWidth = 0;
        for (let d of el.elements) {
            switch (d.mode) {
                case "line":
                    itf.ctx.beginPath(d.x1, ch - d.y1);
                    itf.ctx.closePath(d.x2, ch - d.y2);
                    break;
                case "rect":
                    itf.ctx.fillRect(d.x, ch - d.y - d.h, d.w, d.h);
                    break;
                case "lineRect":
                    itf.ctx.lineWidth = d.b;
                    itf.ctx.strokeRect(d.x, ch - d.y - d.h, d.w, d.h);
                    break;
                default:
                    break;
            }
        }
    }
    itf.ctx.strokeStyle = "#000000";
    itf.ctx.lineWidth = 1;
    for (let i = 0; i < this.spriteHeight; i++) {
        itf.ctx.beginPath(0, i);
        itf.ctx.lineTo(this.spriteWidth, i);
        itf.ctx.closePath();
        itf.ctx.stroke();
    }
    for (let i = 0; i < this.spriteWidth; i++) {
        itf.ctx.beginPath(i, 0);
        itf.ctx.lineTo(i, this.spriteHeight);
        itf.ctx.closePath();
        itf.ctx.stroke();
    }
    itf.ctx.setTransform(1, 0, 0, 1, 0, 0);
}

let interface = new Interface(document.getElementById("interface"), 8, 8, 32);

class ColorGroup {
    constructor(color = "#882266", alpha = 255, elements = []) {
        this.color = color;
        this.alpha = alpha;
        this.elements = elements;
        this.html = {};
    }
    sethtml(inObject) {
        this.html = inObject;
    }
    splitColor(hashColor = this.color) {
        let r = parseInt(hashColor.substring(1, 3), 16);
        let g = parseInt(hashColor.substring(3, 5), 16);
        let b = parseInt(hashColor.substring(5, 7), 16);
        let a = this.alpha;
        return [r, g, b, a];
    }
}

class Graphic {
    constructor(parent) {
        this.parent = parent;
        this.mode = ""
    }
}

class FilledRect extends Graphic {
    constructor(group, data = { x: 0, y: 0, w: 4, h: 4 }) {
        super(group, data);
        this.name = "FRect";
        this.mode = "rect";
        this.x = data.x;
        this.y = data.y;
        this.w = data.w;
        this.h = data.h;
    }
    fromString(string) {
        this.x = string.substring(string.indexOf("x:") + 2, string.indexOf("y:")) * 1
        this.y = string.substring(string.indexOf("y:") + 2, string.indexOf("w:")) * 1
        this.w = string.substring(string.indexOf("w:") + 2, string.indexOf("h:")) * 1
        this.h = string.substring(string.indexOf("h:") + 2, string.length) * 1
    }
    toString() {
        return (
            "x:" + this.x + "y:" + this.y + "w:" + this.w + "h:" + this.h
        );
    }
    toCode() {
        let out =
            (this.x != compileTimeVariables.recentX ? "op add elementX inputX " + this.x + "\n" : "") +
            (this.y != compileTimeVariables.recentY ? "op add elementY inputY " + this.y + "\n" : "") +
            "draw rect elementX elementY " + this.w + " " + this.h +
            "\n";
        compileTimeVariables.recentX = this.x;
        compileTimeVariables.recentY = this.y;
        return out;
    }
}

class LineRect extends FilledRect {
    constructor(group, data = { x: 0, y: 0, w: 4, h: 4, b: 1 }) {
        super(group, data);
        this.name = "LRect";
        this.mode = "lineRect";
        this.b = data.b;
    }
    fromString(string) {
        this.x = string.substring(string.indexOf("x:") + 2, string.indexOf("y:")) * 1
        this.y = string.substring(string.indexOf("y:") + 2, string.indexOf("w:")) * 1
        this.w = string.substring(string.indexOf("w:") + 2, string.indexOf("h:")) * 1
        this.h = string.substring(string.indexOf("h:") + 2, string.indexOf("b:")) * 1
        this.b = string.substring(string.indexOf("b:") + 2, string.length) * 1
    }
    toString() {
        return (
            "x:" + this.x + "y:" + this.y + "w:" + this.w + "h:" + this.h + "b:" + this.b
        );
    }
    toCode() {
        let out =
            (this.x != compileTimeVariables.recentX ? "op add elementX inputX " + this.x + "\n" : "") +
            (this.y != compileTimeVariables.recentY ? "op add elementY inputY " + this.y + "\n" : "") +
            (this.b != compileTimeVariables.recentStroke ? "\ndraw stroke " + this.b : "") +
            "draw lineRect elementX elementY " + this.w + " " + this.h +
            "\n";
        compileTimeVariables.recentX = this.x;
        compileTimeVariables.recentY = this.y;
        compileTimeVariables.recentStroke = this.b;
        return out;
    }
}

class Line extends Graphic {
    constructor(group, data = { x1: 0, y1: 0, x2: 4, y2: 4 }) {
        super(group);
        this.name = "Line";
        this.mode = "line"
        this.x1 = data.x1;
        this.y1 = data.y1;
        this.x2 = data.x2;
        this.y2 = data.y2;
    }
    fromString(string) {
        this.x1 = string.substring(string.indexOf("x1:") + 3, string.indexOf("y1:")) * 1
        this.y1 = string.substring(string.indexOf("y1:") + 3, string.indexOf("x2:")) * 1
        this.x2 = string.substring(string.indexOf("x2:") + 3, string.indexOf("y2:")) * 1
        this.y2 = string.substring(string.indexOf("y2:") + 2, string.length) * 1
    }
    toString() {
        return (
            "x1:" + this.x1 + "y1:" + this.y1 + "x1:" + this.x2 + "y2:" + this.y2
        );
    }
    toCode() {
        let out =
            (this.x1 != compileTimeVariables.recentX ? "op add elementX inputX " + this.x1 + "\n" : "") +
            (this.y1 != compileTimeVariables.recentY ? "op add elementY inputY " + this.y1 + "\n" : "") +
            (this.x2 != compileTimeVariables.recentX2 ? "op add elementX2 inputX " + this.x2 + "\n" : "") +
            (this.y2 != compileTimeVariables.recentY2 ? "op add elementY2 inputY " + this.y2 + "\n" : "") +
            "draw stroke 1" +
            "\ndraw line elementX elementY elementX2 elementY2" +
            "\n";
        compileTimeVariables.recentX = this.x1;
        compileTimeVariables.recentY = this.y1;
        compileTimeVariables.recentX2 = this.x2;
        compileTimeVariables.recentY2 = this.y2;
        compileTimeVariables.recentStroke = 1;
        return out;
    }
}

function addNewColor() {
    interface.contents.push(new ColorGroup());
    updateHTML();
}

let output = [
    new SizedCanvas(interface.src, 4),
    new SizedCanvas(document.getElementById("smallOutput"), 32)
];

let checkboxesType = document.getElementsByClassName("select");
for (let el of checkboxesType) {
    el.addEventListener("input", () => {
        updateHTML(el);
    })
}

let defaultBorder = 1;

let updateCanvas = () => {
    let inputWidth = document.getElementById("canvasWidth").value;
    let inputHeight = document.getElementById("canvasHeight").value;
    let inputSizeScale = document.getElementById("canvasSizeScale").value;
    interface.adjust({
        spriteWidth: inputWidth,
        spriteHeight: inputHeight,
        pixelSize: inputSizeScale,
    });
    generateOutput();
}

let borderInputExists = false;

let currentColorGroup = false;

let rowCount = 0;

function addGraphicsElement(elementIndex) {
    if (typeof currentColorGroup == 'object') {
        [
            () => {
                currentColorGroup.elements.push(new Line(currentColorGroup, {
                    x1: 0,
                    x2: 0,
                    y1: 0,
                    y2: 2
                }));
            },
            () => {
                currentColorGroup.elements.push(new FilledRect(currentColorGroup, {
                    x: 0,
                    y: 0,
                    w: 3,
                    h: 2
                }));
            },
            () => {
                currentColorGroup.elements.push(new LineRect(currentColorGroup, {
                    x: 0,
                    y: 0,
                    w: 3,
                    h: 2,
                    b: 1
                }));
            },
        ][elementIndex]();
        updateHTML();
        updateCanvas();
    }
}

function updateHTML(hasTriggerColor = false) {
    if (currentColorGroup != false && hasTriggerColor == false) hasTriggerColor = currentColorGroup;
    rowCount = 0;
    let elTable = document.getElementById("elements").parentNode;
    elTable.removeChild(document.getElementById("elements"));
    let newBody = document.createElement("tbody");
    newBody.setAttribute("id", "elements");
    elTable.append(newBody);
    let htmlColors = document.getElementById("colors-wrap");
    htmlColors.removeChild(document.getElementById("colors"));
    let newInnerColors = document.createElement("tr");
    newInnerColors.setAttribute("id", "colors");
    htmlColors.appendChild(newInnerColors);
    for (let el of interface.contents) {
        while (rowCount < el.elements.length) {
            let newRow = document.createElement("tr");
            newRow.setAttribute("id", "row" + rowCount);
            newRow.setAttribute("class", "graphicsDataRow");
            for (let i = 0; i < interface.contents.length; i++) {
                let newData = document.createElement("td");
                newData.setAttribute("id", "data" + i + "-" + rowCount);
                newData.setAttribute("style", "width: 180px");
                newRow.append(newData);
            }
            document.getElementById("elements").append(newRow);
            rowCount++
        }
    }
    for (let i = 0; i < interface.contents.length; i++) {
        let el = interface.contents[i];
        for (let j = 0; j < el.elements.length; j++) {
            let gfx = el.elements[j];
            let td = document.getElementById("data" + i + "-" + j);
            let domElement = document.createElement("span");
            let input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("size", "13.5");
            input.value = gfx.toString();
            input.addEventListener("input", () => { gfx.fromString(input.value); updateCanvas(); console.log(gfx, input.value); });
            let label = document.createElement("span");
            label.setAttribute("style", "color: white; font-family: Arial;")
            label.innerHTML = gfx.name + " ";
            domElement.append(label, input);
            td.append(domElement);
        }
        console.log(el);
        let colorListing = document.createElement("th");
        colorListing.setAttribute("class", "listings");
        colorListing.setAttribute("scope", "column");
        colorListing.setAttribute("style", "width: 180px");
        let colorPick = document.createElement("input");
        let colorAlpha = document.createElement("input");
        colorPick.setAttribute("type", "color");
        colorPick.value = el.color;
        colorPick.addEventListener("input", () => {
            el.color = colorPick.value;
            updateCanvas();
        });
        colorAlpha.setAttribute("type", "text");
        colorAlpha.setAttribute("placeholder", "Alpha");
        colorAlpha.setAttribute("size", 2);
        colorAlpha.value = el.alpha;
        colorAlpha.addEventListener("input", () => {
            el.alpha = colorAlpha.value;
            updateCanvas();
        });
        let colorSelect = document.createElement("input");
        colorSelect.setAttribute("type", "checkbox");
        if (el == hasTriggerColor) {
            colorSelect.checked = true;
        }
        colorSelect.addEventListener("input", () => {
            currentColorGroup = el;
            for (let h of interface.contents) {
                h.html.select.checked = h != currentColorGroup ? false : true;
            }
        });
        let colorDelete = document.createElement("input");
        colorDelete.setAttribute("type", "button");
        colorDelete.setAttribute("value", "🗑️");
        colorDelete.setAttribute("style", "background-color: black;");
        colorDelete.setAttribute("data-index", i);
        colorDelete.addEventListener("click", () => {
            interface.contents.splice(colorDelete.getAttribute("data-index"), 1);
            currentColorGroup = false;
            updateCanvas();
            updateHTML(false);
        });
        colorListing.appendChild(colorPick);
        colorListing.appendChild(colorAlpha);
        colorListing.appendChild(colorSelect);
        colorListing.appendChild(colorDelete);
        el.sethtml({
            pick: colorPick,
            alpha: colorAlpha,
            select: colorSelect,
            delete: colorDelete
        });
        document.getElementById("colors").appendChild(colorListing);
    }
    generateOutput();
}

let spriteName = "MySprite";

function setName() {
    spriteName = document.getElementById("spriteNameInput").value;
    generateOutput();
}

function generateOutput() {
    let outMlogData = document.getElementById("mlogData");
    let outMlogDraw = document.getElementById("mlogDraw");
    let outBitwData = document.getElementById("bitwData");
    let outBitwDraw = document.getElementById("bitwDraw");

    let out = "jump " + spriteName + "BRIDGE always\n" + spriteName + ":\n";
    for (let con of interface.contents) {
        out += "draw color 0x" + con.color.substring(1, 3) + " 0x" + con.color.substring(3, 5) + " 0x" + con.color.substring(5, 7) + " " + con.alpha + "\n";
        for (let el of con.elements) {
            out += el.toCode();
        }
    }
    out += "set @counter " + spriteName + "_CB\n" + spriteName + "BRIDGE:\nnoop\n"
    outMlogData.innerHTML = out;

    out = "fun new " + spriteName + "\n";
    for (let con of interface.contents) {
        out += "draw color 0x" + con.color.substring(1, 3) + " 0x" + con.color.substring(3, 5) + " 0x" + con.color.substring(5, 7) + " " + con.alpha + "\n";
        for (let el of con.elements) {
            out += el.toCode();
        }
    }
    out += "fun close\n"
    outBitwData.innerHTML = out;

    out = "set inputX \nset inputY \nop add " + spriteName + "_CB @counter 1\njump " + spriteName + " always\n";
    outMlogDraw.innerHTML = out;

    out = "set inputX \nset inputY \nfun have " + spriteName + "\n";
    outBitwDraw.innerHTML = out;
}