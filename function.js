var canvas = null;
var context = null;
var marginTop = 70;
var marginLeft = 300;
var selectArea = false;
var mouseLeftClick = false;
var mouseRightClick = false;
var x = 0, y = 0;
var xDown = 0, yDown = 0;
var statusMouse = 0;
var url = '';
var urlSelect = '';
var currentAction = { undo: [], redo: [] };
var historyAction = { undo: [], redo: [] };
var timeoutRelaod = null;
var API_SERVER = 'http://203.162.10.118:9900';

function loadImage(src) {
    url = src;
    let base_image = new Image();
    base_image.src = src;
    base_image.onload = function () {
        context.canvas.width = this.width;
        context.canvas.height = this.height;
        console.log('width height canvas', context.canvas.width, context.canvas.height)
        context.drawImage(base_image, 0, 0);
        let scale = (screen.width - marginLeft) / context.canvas.width;
        $('#canvas').css('zoom', scale);
        window.scroll(0, 0);
    }
    currentAction.undo = [];
    currentAction.redo = [];
    historyAction.undo = [];
    historyAction.redo = [];
}

function reloadImage(callback = null) {
    let base_image = new Image();
    base_image.src = url;
    base_image.onload = function () {
        clearTimeout(timeoutRelaod);
        context.drawImage(base_image, 0, 0);
        for (let actions of historyAction.undo) {
            beginDraw();
            context.moveTo(actions.list[0].x, actions.list[0].y);
            for (let i = 1; i < actions.list.length; i++) {
                context.lineTo(actions.list[i].x, actions.list[i].y);
            }
            if (actions.type == 'remove') {
                fill();
            }
            else {
                clip(base_image);
            }
        }
        if (currentAction.undo.length > 0) {
            beginDraw();
            context.moveTo(currentAction.undo[0].x, currentAction.undo[0].y);
            for (let i = 1; i < currentAction.undo.length; i++) {
                context.lineTo(currentAction.undo[i].x, currentAction.undo[i].y);
            }
            if (callback && selectArea) callback();
            stroke();
        }
    }
}

function beginDraw() {
    context.beginPath();
    context.fillStyle = '#000000';
    // context.strokeStyle = '#CE2E2A';
    context.strokeStyle = '#CE2E2A';
    context.lineWidth = 8;
}

function stroke() {
    context.closePath();
    context.stroke();
}

function fill() {
    context.closePath();
    context.fill();
}

function clip(base_image) {
    context.closePath();
    context.fillStyle = '#000000';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.save();
    context.clip();
    context.drawImage(base_image, 0, 0);
    context.restore();
}

function zoom(zoomIn) {
    let scaleOld = $('#canvas').css('zoom') * 1 || 1;
    let scale = scaleOld * 100 || 1;

    if (zoomIn) {
        scale += 10;
    } else {
        scale -= 10;
    }
    scale /= 100;
    if (context.canvas.width * scale < screen.width - marginLeft) scale = (screen.width - marginLeft) / context.canvas.width;
    if (scale > 5) return;
    console.log('scale', scale)
    $('#canvas').css('zoom', scale);
    let left = $(document).scrollLeft();
    let top = $(document).scrollTop();
    let translateX = left + (left + (screen.width - marginLeft) / 2) / (context.canvas.width * scaleOld) * context.canvas.width * (scale - scaleOld);
    let translateY = top + (top + (screen.height - marginTop) / 2) / (context.canvas.height * scaleOld) * context.canvas.height * (scale - scaleOld);
    window.scroll(translateX, translateY);
}

function toRealCoordinate(x, y) {
    let scale = $('#canvas').css('zoom') * 1 || 1;
    return {
        x: x / scale,
        y: y / scale
    };
}

function selectDone() {
    mouseRightClick = false;
    selectArea = false;
    currentAction.undo.push({ x: currentAction.undo[0].x, y: currentAction.undo[0].y });
    reloadImage();
}

function equalCoordinate(a, b) {
    return a.x == b.x && a.y == b.y;
}

function processArea(type) {
    let len = currentAction.undo.length;
    if (len > 0 && equalCoordinate(currentAction.undo[0], currentAction.undo[len - 1])) {
        historyAction.undo.push({
            list: [...currentAction.undo],
            type: type
        });
        currentAction.undo = [];
        currentAction.redo = [];
        selectArea = false;
        reloadImage();
    }
}

function cancel() {
    selectArea = false;
    currentAction.undo = [];
    currentAction.redo = [];
    reloadImage();
}

async function postImage(url, body) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: url,
            contentType: 'application/json; charset=utf-8',
            headers: { 'Access-Control-Allow-Origin': '*' },
            data: JSON.stringify(body),
            dataType: "json",
            success: function (response) { resolve(response); },
            error: function (err) { reject(err); }
        });
    });

    // return fetch(url,
    //     {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         mode: 'no-cors',
    //         body: JSON.stringify(body)
    //     })
    //     .then(response => response.json())
    //     .catch(err => console.log(err));
}
