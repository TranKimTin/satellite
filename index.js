$(document).ready(function () {
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    let marginTop = $("#top-bar").css('height') ? $("#top-bar").css('height').replace('px', '') * 1 : 70;
    let marginLeft = $("#lef-bar").css('width') ? $("#lef-bar").css('width').replace('px', '') * 1 : 300;

    context.canvas.width = screen.width - marginLeft;
    context.canvas.height = screen.height;

    function loadImage(src) {
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

    let mouseClick = false;
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

    $('#canvas').
        mouseup((e) => {
            mouseClick = false;
            x = e.pageX - marginLeft;
            y = e.pageY;
        })
        .mouseout(() => mouseClick = false)
        .mousedown((e) => {
            mouseClick = true;
            x = e.pageX - marginLeft;
            y = e.pageY;
            xDown = x;
            yDown = y;
            return false;
        })
        .mousemove((e) => {
            // values: e.clientX, e.clientY, e.pageX, e.pageY
            if (mouseClick) {
                let translateX = xDown + marginLeft - e.clientX;
                let translateY = yDown - e.clientY;
                if (!this.timeout) {
                    this.timeout = true;
                    window.scroll(translateX, translateY);
                    setTimeout(() => {
                        this.timeout = false;
                    }, 10);
                }
            }
            x = e.pageX - marginLeft;
            y = e.pageY;
        });
    $('#btnSelectArea').click(function () {
        context.fillStyle = '#000000';
        context.strokeStyle = "#FF0000";
        context.lineWidth = 10;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(500, 500);
        context.lineTo(1000, 1000);
        context.lineTo(0, 500);
        context.closePath();
        // context.fill();
        context.stroke()
    });
});