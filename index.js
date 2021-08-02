$(document).ready(function () {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    marginTop = $("#top-bar").css('height') ? $("#top-bar").css('height').replace('px', '') * 1 : 70;
    marginLeft = $("#lef-bar").css('width') ? $("#lef-bar").css('width').replace('px', '') * 1 : 300;

    // currentAction{
    //     undo: [{x,y}],
    //     redo: [{x,y}]
    // }
    // historyAction {
    //     undo: [{list[{x,y}], type='reomve'}],
    //     redo: [{list[{x,y}], type='get'}]
    // }
    context.canvas.width = screen.width - marginLeft;
    context.canvas.height = screen.height;

    loadImage('./test.jpg');

    $('#btnOpenModal').click(() => {
        console.log('click')
        $('#path').val('no-image.png');
        $('#heightModal').val('');
        $('#areaModal').val('');
        urlSelect = './assets/no-image.png';
    });
    $('#btnOpenFile').click(() => {
        $('#openFile').trigger('click');
    });
    $('#btnStart').click(() => {
        console.log(urlSelect)
        if (urlSelect.trim() == '') return;
        let area = $('#areaModal').val();
        let height = $('#heightModal').val() * 1 || 0;
        console.log(height)
        $('#area').val(area);
        $('#height').val(height);
        loadImage(urlSelect);
    });

    $('#openFile').change((e) => {
        e.preventDefault();
        let input = e.target;
        let url = input.value;
        let filename = url.slice(url.lastIndexOf('\\') + 1);
        let ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        if (input.files && input.files[0] && (ext == "png" || ext == "jpeg" || ext == "jpg")) {
            $('#path').val(filename);
            let reader = new FileReader();
            reader.onload = function (e) {
                urlSelect = e.target.result;
            }
            reader.readAsDataURL(input.files[0]);
        } else {
            $('#path').val('no-image.png');
            urlSelect = './assets/no-image.png';
        }
    });


    $('#btnZoomIn').click(() => {
        zoom(true);
    });
    $('#btnZoomOut').click(() => {
        zoom(false);
    });
    $(window).bind('mousewheel DOMMouseScroll', (e) => {
        if (e.ctrlKey == true) {
            if (e.originalEvent.wheelDelta / 120 > 0) {
                zoom(true);
            } else {
                zoom(false);
            }

        }
    });

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
                historyAction.redo = [];
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
    $('#btnSelectArea').click(() => {
        if (selectArea) return;
        if (currentAction.undo.length > 0) return;
        selectArea = true;
        currentAction.undo = [];
    });


    $('#btnRemoveSelection').click(() => {
        processArea('remove');
    });

    $('#btnTakeSelection').click(() => {
        processArea('take');
    });


    $('#btnCancel').click(cancel);

    $(document).keydown((e) => {
        if (e.ctrlKey && (e.key == 'z' || e.key == 'Z')) {
            selectArea = false;
            if (currentAction.undo.length > 0) {
                selectArea = true;
                currentAction.redo.push(currentAction.undo.pop());
                reloadImage();
            } else if (historyAction.undo.length > 0) {
                historyAction.redo.push(historyAction.undo.pop());
                reloadImage();
            }
        }
        else if (e.ctrlKey && (e.key == 'y' || e.key == 'Y')) {
            selectArea = false;
            if (historyAction.redo.length > 0) {
                historyAction.undo.push(historyAction.redo.pop());
                reloadImage();
            }
            else if (currentAction.redo.length > 0) {
                selectArea = true;
                currentAction.undo.push(currentAction.redo.pop());
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