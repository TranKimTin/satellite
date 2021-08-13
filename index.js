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

    loadImage('./assets/no-image.png');
    // loadImage('./test.jpg');

    $('#btnOpenModal').click(() => {
        $('#path').val('no-image.png');
        $('#heightModal').val('');
        $('#areaModal').val('');
        urlSelect = './assets/no-image.png';
    });
    $('#btnOpenFile').click(() => {
        $('#openFile').val('');
        $('#openFile').trigger('click');
    });
    $('#btnStart').click(() => {
        if (urlSelect.trim() == '') return;
        let area = $('#areaModal').val();
        let height = $('#heightModal').val() * 1 || 0;
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

    $('#btnPredic').click(() => {
        let loading = '<div class="spinner-border"></div>';
        let name = $('#area').val();

        $('#predic-name-area').html(name);
        $('#modalPredic').modal('show');
        $('#predic-area').html(loading);
        $('#predic-number-house').html(loading);
        $('#predic-population').html(loading);
        $('#predic-density-population').html(loading);
        $('#predic-density-building').html(loading);
        $('#predic-ratio-tree').html(loading);
        $('#predic-ratio-warter').html(loading);
        $('#predic-ratio-traffic').html(loading);
    });

    $('#modalPredic').on('shown.bs.modal', () => {
        res = {};
        let base64 = context.canvas.toDataURL().split(';base64,')[1];
        postImage(`${API_SERVER}/satellite`, { image: base64 })
            .then(respon => {
                console.log(respon);
                res = respon;
                let { S_green = 0, S_house = 0, S_lake = 0, S_none = 0, S_other = 0, S_total = 0, house = -1 } = respon;

                let density = $('#density').val() * 1 || 3.5;
                let totalArea = S_green + S_house + S_lake + S_none + S_other;

                $('#predic-area').html(S_total);
                $('#predic-number-house').html(house);
                $('#predic-population').html(house * density);
                $('#predic-density-population').html(density);
                $('#predic-density-building').html((S_house / totalArea * 100 || 0).toFixed(2) + '%');
                $('#predic-ratio-tree').html((S_green / totalArea * 100 || 0).toFixed(2) + '%');
                $('#predic-ratio-warter').html((S_lake / totalArea * 100 || 0).toFixed(2) + '%');
                $('#predic-ratio-traffic').html(((S_none + S_other) / totalArea * 100 || 0).toFixed(2) + '%');

                if (totalArea == 0 || house == -1) {
                    alert('Ảnh không hợp lệ!', 'ERROR');
                    $('#modalPredic').modal('hide');
                }
            }).catch(err => {
                console.error(); (err);
            });
    });

    $('#modalPredic').on('hidden.bs.modal', () => {
        res = {};
        if (request) {
            console.log('arbort');
            request.abort();
            request = null;
        }
    });

    $('#btnCancelModalPredic').click(() => {
        $('#modalPredic').modal('hide');
    });
    $('#btnSavePredic').click(() => {
        $('#modalPredic').modal('hide');
    });

    $('#density').change(() => {
        $('#predic-area').html(S_total);
        $('#predic-number-house').html(house);
        $('#predic-population').html(house * density);
        $('#predic-density-population').html(density);
        $('#predic-density-building').html((S_house / totalArea * 100 || 0).toFixed(2) + '%');
        $('#predic-ratio-tree').html((S_green / totalArea * 100 || 0).toFixed(2) + '%');
        $('#predic-ratio-warter').html((S_lake / totalArea * 100 || 0).toFixed(2) + '%');
        $('#predic-ratio-traffic').html(((S_none + S_other) / totalArea * 100 || 0).toFixed(2) + '%');
    });
});