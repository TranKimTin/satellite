$(document).ready(function () {
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    let marginTop = $("#top-bar").css('height') ? $("#top-bar").css('height').replace('px', '') * 1 : 70;
    let marginLeft = $("#lef-bar").css('width') ? $("#lef-bar").css('width').replace('px', '') * 1 : 300;
    let selectArea = false;
    let mouseLeftClick = false;
    let mouseRightClick = false;
    let x = 0, y = 0;
    let xDown = 0, yDown = 0;
    let statusMouse = 0;
    let url = '';
    let currentAction = { undo: [], redo: [] };
    let history = { undo: [], redo: [] };
    let timeoutRelaod = null;
    // current{
    //     undo: [{x,y}],
    //     redo: [{x,y}]
    // }
    // history {
    //     undo: [{list[{x,y}], type='reomve'}],
    //     redo: [{list[{x,y}], type='get'}]
    // }
    context.canvas.width = screen.width - marginLeft;
    context.canvas.height = screen.height;
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
    }
    loadImage('./test.jpg');

    function beginDraw() {
        context.beginPath();
        context.fillStyle = '#000000';
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
        context.save ();
        context.clip ();
        context.drawImage (base_image, 0, 0);
        context.restore ();
    }

    function reloadImage(callback = null) {
        let base_image = new Image();
        base_image.src = url;
        base_image.onload = function () {
            clearTimeout(timeoutRelaod);
            context.drawImage(base_image, 0, 0);
            for (let actions of history.undo) {
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
            if (currentAction.undo.length > 1) {
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

    $('#btnOpenFile').click(function () {
        $('#openFile').trigger('click');
    });
    $('#openFile').change(function (e) {
        e.preventDefault();
        let input = e.target;
        let url = input.value;
        let ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        if (input.files && input.files[0] && (ext == "png" || ext == "jpeg" || ext == "jpg")) {
            let reader = new FileReader();
            reader.onload = function (e) {
                let src = e.target.result;
                loadImage(src);
            }
            reader.readAsDataURL(input.files[0]);
        } else {
            loadImage('./assets/no-image.jpg');
        }
    });

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
    $('#btnZoomIn').click(function () {
        zoom(true);
    });
    $('#btnZoomOut').click(function () {
        zoom(false);
    });
    $(window).bind('mousewheel DOMMouseScroll', function (e) {
        if (e.ctrlKey == true) {
            if (e.originalEvent.wheelDelta / 120 > 0) {
                zoom(true);
            } else {
                zoom(false);
            }

        }
    });
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
    $('#canvas')
        .mousedown((e) => {
            if (e.which == 1) {
                mouseLeftClick = true;
            }
            else if (e.which == 3) {
                mouseRightClick = true;
            }
            statusMouse = 1;
            x = e.pageX - marginLeft;
            y = e.pageY - marginTop;
            xDown = x;
            yDown = y;
            return false;
        })
        .mouseup((e) => {
            x = e.pageX - marginLeft;
            y = e.pageY - marginTop;
            let coodiname = toRealCoordinate(x, y);
            if (selectArea && mouseLeftClick && statusMouse == 1) {
                currentAction.undo.push(coodiname);
                reloadImage();
            }
            else if (selectArea && mouseRightClick && currentAction.undo.length >= 2) {
                history.redo = [];
                currentAction.redo = [];
                clearTimeout(timeoutRelaod);
                currentAction.undo.push(coodiname);
                selectDone();
            }
            statusMouse = 2;
            if (e.which == 1) {
                mouseLeftClick = false;
            }
            else if (e.which == 3) {
                mouseRightClick = false;
            }
        })
        .mouseout(() => {
            mouseLeftClick = false;
            mouseRightClick = false;
        })
        .mousemove((e) => {
            // values: e.clientX, e.clientY, e.pageX, e.pageY
            statusMouse = 3;
            if (mouseLeftClick && mouseLeftClick) {
                let translateX = xDown + marginLeft - e.clientX;
                let translateY = yDown + marginTop - e.clientY;
                if (!this.timeout) {
                    this.timeout = true;
                    window.scroll(translateX, translateY);
                    setTimeout(() => {
                        this.timeout = false;
                    }, 10);
                }
            }
            x = e.pageX - marginLeft;
            y = e.pageY - marginTop;
            if (selectArea && currentAction.undo.length > 0) {
                clearTimeout(timeoutRelaod);
                timeoutRelaod = setTimeout(() => {
                    reloadImage(() => {
                        let currentCoordinate = toRealCoordinate(x, y);
                        context.lineTo(currentCoordinate.x, currentCoordinate.y);
                    });
                }, 5);

            }
        });
    $('#btnSelectArea').click(function () {
        if (selectArea) return;
        if (currentAction.undo.length > 0) return;
        selectArea = true;
        currentAction.undo = [];
    });

    function equalCoordinate(a, b) {
        return a.x == b.x && a.y == b.y;
    }
    function processArea(type) {
        let len = currentAction.undo.length;
        if (len > 0 && equalCoordinate(currentAction.undo[0], currentAction.undo[len - 1])) {
            history.undo.push({
                list: [...currentAction.undo],
                type: type
            });
            currentAction.undo = [];
            currentAction.redo = [];
            selectArea = false;
            reloadImage();
        }
    }
    $('#btnRemoveSelection').click(function () {
        processArea('remove');
    });

    $('#btnTakeSelection').click(function () {
        processArea('take');
    });

    function cancel() {
        selectArea = false;
        currentAction.undo = [];
        currentAction.redo = [];
        reloadImage();
    }
    $('#btnCancel').click(cancel);

    $(document).keydown(function (e) {
        if (e.ctrlKey && (e.key == 'z' || e.key == 'Z')) {
            selectArea = false;
            if (currentAction.undo.length > 0) {
                selectArea = true;
                currentAction.redo.push(currentAction.undo.pop());
                reloadImage();
            } else if (history.undo.length > 0) {
                history.redo.push(history.undo.pop());
                reloadImage();
            }
        }
        else if (e.ctrlKey && (e.key == 'y' || e.key == 'Y')) {
            selectArea = false;
            if (currentAction.redo.length > 0) {
                selectArea = true;
                currentAction.undo.push(currentAction.redo.pop());
                reloadImage();
            } else if (history.redo.length > 0) {
                history.undo.push(history.redo.pop());
                reloadImage();
            }
        }
        else if (e.key == 'Escape') {
            cancel();
        }
        else if (e.key == 'Enter' && selectArea && currentAction.undo.length > 2) {
            selectDone();
        }
    });
});