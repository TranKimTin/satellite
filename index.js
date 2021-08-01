$(document).ready(function () {
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    let marginTop = $("#top-bar").css('height') ? $("#top-bar").css('height').replace('px', '') * 1 : 70;
    let marginLeft = $("#lef-bar").css('width') ? $("#lef-bar").css('width').replace('px', '') * 1 : 300;
    let selectArea = false;
    let listPoint = [];
    let statusMouse;
    let url;

    context.canvas.width = screen.width - marginLeft;
    context.canvas.height = screen.height;

    function loadImage(src) {
        url = src;
        let base_image = new Image();
        base_image.src = src;
        base_image.onload = function () {
            context.canvas.width = this.width;
            context.canvas.height = this.height;
            console.log(context.canvas.width, context.canvas.height)
            context.drawImage(base_image, 0, 0);
            let scale = (screen.width - marginLeft) / context.canvas.width;
            $('#canvas').css('zoom', scale);
            window.scroll(0, 0);
        }
    }
    loadImage('./test.jpg');

    let mouseLeftClick = false;
    let mouseRightClick = false;
    let x = 0, y = 0;
    let xDown = 0, yDown = 0;

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
        console.log('x', x);
        console.log('scale', scale);
        console.log('x/scale', x / scale)
        return {
            x: x / scale,
            y: y / scale
        };
    }
    function beginDraw() {
        context.beginPath();
        context.fillStyle = '#CE2E2A';
        context.strokeStyle = '#CE2E2A';
        context.lineWidth = 8;
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
            console.log(coodiname)
            if (selectArea && mouseLeftClick && statusMouse == 1) {
                if (listPoint.length > 0) {
                    beginDraw();
                    let index = listPoint.length - 1;
                    let lastX = listPoint[index].x;
                    let lastY = listPoint[index].y;
                    context.moveTo(lastX, lastY);
                    context.lineTo(coodiname.x, coodiname.y);
                    context.stroke();
                }
                listPoint.push(coodiname);
            }
            else if (selectArea && mouseRightClick) {
                mouseRightClick = false;
                selectArea = false;
                if (listPoint.length > 1) {
                    beginDraw();
                    let index = listPoint.length - 1;
                    let lastX = listPoint[index].x;
                    let lastY = listPoint[index].y;
                    context.moveTo(lastX, lastY);
                    context.lineTo(listPoint[0].x, listPoint[0].y);
                    context.stroke();
                }
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
        });
    $('#btnSelectArea').click(function () {
        console.log('selected area', selectArea)
        if (selectArea) return;
        selectArea = true;
        listPoint = [];
    });

    $(document).keydown(function (e) {
        if (e.ctrlKey && (e.key == 'z' || e.key == 'Z')) {
            loadImage(url);
        }
        else if (e.ctrlKey && (e.key == 'y' || e.key == 'Y')) {
            console.log('redo');
            let data = context.canvas.toDataURL();
            console.log(data)
        }
    });
});