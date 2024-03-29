﻿let compileTimeVariables = {
    recentStroke: "not set",
    recentX: "not set",
    recentY: "not set",
    recentX2: "not set",
    recentY2: "not set"
}


// used for lines
let simulate = document.createElement("canvas");
simulate.setAttribute("width", 8);
simulate.setAttribute("height", 8);
let simcon = simulate.getContext("2d");

function resetCTV() {
    compileTimeVariables = {
        recentStroke: "not set",
        recentX: "not set",
        recentY: "not set",
        recentX2: "not set",
        recentY2: "not set"
    }
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
        if (inserted.spriteWidth >= 1) this.spriteWidth = inserted.spriteWidth; simulate.setAttribute("width", this.spriteWidth);
        if (inserted.spriteHeight >= 1) this.spriteHeight = inserted.spriteHeight; simulate.setAttribute("height", this.spriteHeight);
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
                this.ctx.fillRect(j / 2, i / 2, 1 / 2, 1 / 2);
            }
        }
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

function canvasDrawContent(itf) {
    itf.ctx.scale(itf.pixelSize, itf.pixelSize);
    itf.ctx.lineCap = "butt";
    let ch = itf.spriteHeight;
    for (let el of itf.contents) {
        let color = el.splitColor();
        color[3] /= 255;
        itf.ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]},${color[3]})`;
        itf.ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]},${color[3]})`;
        for (let d of el.elements) {
            itf.ctx.lineWidth = 0;
            switch (d.mode) {
                case "line": // yeah no, i'm fucked
                    itf.ctx.lineCap = "round";
                    simcon.lineWidth = d.b;

                    let line = new Path2D();
                    line.moveTo(d.x1 + 0.5, ch - d.y1 - 0.5);
                    line.lineTo(d.x2 + 0.5, ch - d.y2 - 0.5);

                    for (let y = 0.5; y < itf.spriteHeight; y++) {
                        for (let x = 0.5; x < itf.spriteWidth; x++) {
                            if (simcon.isPointInStroke(line, x, y)) {
                                itf.ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
                            }
                        }
                    }
                    itf.ctx.fillRect(d.x1, ch - d.y1 - 1, 1, 1);
                    itf.ctx.fillRect(d.x2, ch - d.y2 - 1, 1, 1);
                    break;
                case "rect":
                    itf.ctx.fillRect(d.x, ch - d.y - d.h, d.w, d.h);
                    break;
                case "lineRect":
                    itf.ctx.lineWidth = d.b;
                    itf.ctx.strokeRect(d.x + d.b / 2, ch - d.y + d.b / 2 - d.h, d.w - d.b, d.h - d.b);
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
            (this.x != compileTimeVariables.recentX ? "op add elementX inputX " + this.x * exportSize + "\n" : "") +
            (this.y != compileTimeVariables.recentY ? "op add elementY inputY " + this.y * exportSize + "\n" : "") +
            "draw rect elementX elementY " + this.w * exportSize + " " + this.h * exportSize +
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
            (this.x != compileTimeVariables.recentX ? "op add elementX inputX " + this.x * exportSize + "\n" : "") +
            (this.y != compileTimeVariables.recentY ? "op add elementY inputY " + this.y * exportSize + "\n" : "") +
            (this.b != compileTimeVariables.recentStroke ? "draw stroke " + this.b * exportSize + "\n" : "") +
            "draw lineRect elementX elementY " + this.w * exportSize + " " + this.h * exportSize +
            "\n";
        compileTimeVariables.recentX = this.x;
        compileTimeVariables.recentY = this.y;
        compileTimeVariables.recentStroke = this.b;
        return out;
    }
}

class Line extends Graphic {
    constructor(group, data = { x1: 0, y1: 0, x2: 3, y2: 3, b: 1 }) {
        super(group);
        this.name = "Line";
        this.mode = "line"
        this.x1 = data.x1;
        this.y1 = data.y1;
        this.x2 = data.x2;
        this.y2 = data.y2;
        this.b = data.b;
    }
    fromString(string) {
        this.x1 = string.substring(string.indexOf("x:") + 2, string.indexOf("y:")) * 1
        this.y1 = string.substring(string.indexOf("y:") + 2, string.indexOf("p:")) * 1
        this.x2 = string.substring(string.indexOf("p:") + 2, string.indexOf("q:")) * 1
        this.y2 = string.substring(string.indexOf("q:") + 2, string.indexOf("b:")) * 1
        this.b = string.substring(string.indexOf("b:") + 2, string.length) * 1
    }
    toString() {
        return (
            "x:" + this.x1 + "y:" + this.y1 + "p:" + this.x2 + "q:" + this.y2 + "b:" + this.b
        );
    }
    toCode() {
        let out =
            (this.x1 != compileTimeVariables.recentX ? "op add elementX inputX " + this.x1 * exportSize + "\n" : "") +
            (this.y1 != compileTimeVariables.recentY ? "op add elementY inputY " + this.y1 * exportSize + "\n" : "") +
            (this.x2 != compileTimeVariables.recentX2 ? "op add elementX2 inputX " + this.x2 * exportSize + "\n" : "") +
            (this.y2 != compileTimeVariables.recentY2 ? "op add elementY2 inputY " + this.y2 * exportSize + "\n" : "") +
            (this.b != compileTimeVariables.recentStroke ? "draw stroke " + this.b * exportSize + "\n" : "") +
            "draw line elementX elementY elementX2 elementY2" +
            "\n";
        compileTimeVariables.recentX = this.x1;
        compileTimeVariables.recentY = this.y1;
        compileTimeVariables.recentX2 = this.x2;
        compileTimeVariables.recentY2 = this.y2;
        compileTimeVariables.recentStroke = this.b;
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
                currentColorGroup.elements.push(new Line(currentColorGroup));
            },
            () => {
                currentColorGroup.elements.push(new FilledRect(currentColorGroup));
            },
            () => {
                currentColorGroup.elements.push(new LineRect(currentColorGroup));
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
        while (rowCount < el.elements.length + 1) {
            let newRow = document.createElement("tr");
            newRow.setAttribute("id", "row" + rowCount);
            newRow.setAttribute("class", "graphicsDataRow");
            for (let i = 0; i < interface.contents.length; i++) {
                let newData = document.createElement("td");
                newData.setAttribute("id", "data" + i + "-" + rowCount);
                newData.setAttribute("style", "width: 200px", "height: 15px");
                newData.addEventListener("dragover", (event) => { permitDropElement(event) });
                newData.addEventListener("drop", (event) => { dropElement(event) });
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
            td.removeEventListener("dragover", (event) => { permitDropElement(event) });
            td.removeEventListener("drop", (event) => { dropElement(event) });
            let domElement = document.createElement("span");
            domElement.setAttribute("data-index", i + "-" + j);
            domElement.setAttribute("style", "width: 200px");
            let input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("size", "13.5");
            input.setAttribute("data-index", i + "-" + j);
            input.value = gfx.toString();
            input.addEventListener("input", () => { gfx.fromString(input.value); updateCanvas(); });
            let label = document.createElement("span");
            label.setAttribute("style", "color: white; font-family: Arial; user-select: none;")
            label.setAttribute("draggable", true);
            label.addEventListener("dragstart", (event) => { dragElement(event) });
            label.addEventListener("dragover", (event) => { permitDropElement(event) });
            label.addEventListener("drop", (event) => { dropElement(event) });
            label.setAttribute("data-index", i + "-" + j);
            label.innerHTML = gfx.name + " ";
            domElement.append(label, input);
            td.append(domElement);
        }
        let colorListing = document.createElement("th");
        colorListing.setAttribute("class", "listings");
        colorListing.setAttribute("scope", "column");
        colorListing.setAttribute("style", "width: 200px");
        colorListing.setAttribute("data-index", i);
        colorListing.setAttribute("draggable", true);
        colorListing.addEventListener("dragstart", (event) => { dragColorGroup(event) });
        colorListing.addEventListener("dragover", (event) => { permitDropColorGroup(event); });
        colorListing.addEventListener("drop", (event) => { dropColorGroup(event) });
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
        colorAlpha.addEventListener("click", () => { colorAlpha.select(); });
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
            currentColorGroup = currentColorGroup == el ? false : el;
            updateCanvas();
            updateHTML(false);
        });
        colorListing.appendChild(colorPick);
        colorListing.appendChild(colorAlpha);
        colorListing.appendChild(colorSelect);
        colorListing.appendChild(colorDelete);
        el.sethtml({
            listing: colorListing,
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

    resetCTV();

    let out = "jump " + spriteName + "BRIDGE always\n" + spriteName + ":\n";
    for (let con of interface.contents) {
        out += "draw color 0x" + con.color.substring(1, 3) + " 0x" + con.color.substring(3, 5) + " 0x" + con.color.substring(5, 7) + " " + con.alpha + "\n";
        for (let el of con.elements) {
            out += el.toCode();
        }
    }
    out += "set @counter " + spriteName + "_CB\n" + spriteName + "BRIDGE:\n"
    outMlogData.innerHTML = out;

    resetCTV();

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

let exportSize = 1;
function setExportSize(size) {
    try {
        exportSize = size * 1;
        updateHTML();
    } catch (e) {
        exportSize = exportSize;
    }
}

// drag and drop stuff goes here

function dragColorGroup(dragEvent) {
    dragEvent.dataTransfer.setData("text", "color-" + dragEvent.target.getAttribute("data-index"));
}
function dragElement(dragEvent) {
    dragEvent.dataTransfer.setData("text", "element-" + dragEvent.target.getAttribute("data-index"));
}

// your standard drop permits
function permitDropColorGroup(dragEvent) {
    dragEvent.preventDefault();
}
function permitDropElement(dragEvent) {
    dragEvent.preventDefault();
}
function permitDropEmpty(dragEvent) {
    dragEvent.preventDefault();
}

// your drop triggers
function dropColorGroup(dropEvent) {
    let data = dropEvent.dataTransfer.getData("text");
    if (dropEvent.dataTransfer.getData("text").indexOf("color") == -1) return;
    dropEvent.preventDefault();
    let index1 = data.replace("color-", "") * 1;
    let index2 = dropEvent.target.getAttribute("data-index") * 1;
    let swap1 = interface.contents[index1];
    let swap2 = interface.contents[index2];
    interface.contents[index1] = swap2;
    interface.contents[index2] = swap1;
    updateHTML();
    updateCanvas();
}
function dropElement(dropEvent) {
    let data = dropEvent.dataTransfer.getData("text");
    if (dropEvent.dataTransfer.getData("text").indexOf("element") == -1) return;
    let index1 = data.replace("element-", "").split("-");
    let index2;
    if (dropEvent.target.id.indexOf("data") != -1) {
        index2 = dropEvent.target.id.replace("data", "").split("-")[0] * 1;
    } else {
        index2 = dropEvent.target.getAttribute("data-index").split("-")[0] * 1;
    }
    if (interface.contents[index1[0] * 1].elements[index1[1] * 1] === undefined) return; // why the fuck do you trigger twice sometimes????????
    interface.contents[index2 * 1].elements.push(interface.contents[index1[0] * 1].elements.splice(index1[1] * 1, 1)[0]);
    dropEvent.preventDefault();
    updateHTML();
    updateCanvas();
}