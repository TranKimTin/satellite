$(document).ready(function () {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    marginTop = $("#top-bar").css('height') ? $("#top-bar").css('height').replace('px', '') * 1 : 100;
    marginLeft = $("#lef-bar").css('width') ? $("#lef-bar").css('width').replace('px', '') * 1 : 300;
    console.log(marginTop)

    context.canvas.width = screen.width - marginLeft;
    context.canvas.height = screen.height;

    loadImage('./assets/no-image.png');
    // loadImage('./test.jpg');

    $('#btnOpenModal').click(() => {
        $('#path').val('no-image.png');
        $('#heightModal').val(500);
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
            else if (!selectArea) {
                areaChange = null;
                for (let item of historyAction.undo) {
                    let center = getCenterCoordinate(item.list);
                    let w = Math.min(context.canvas.width / 30, context.canvas.height / 30);
                    center.x -= w / 2;
                    center.y -= w;
                    if (coodiname.x - center.x >= 0 && coodiname.x - center.x <= w && coodiname.y - center.y >= 0 && coodiname.y - center.y <= w * 1.5) {
                        areaChange = item;
                        break;
                    }
                }
                if (areaChange != null) {
                    $('#input-polulation').val(areaChange.d || 0);
                    $('#modal-population').modal('show');
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
        let len = currentAction.undo.length;
        if (len > 3 && equalCoordinate(currentAction.undo[0], currentAction.undo[len - 1])) {
            processArea('remove');
            areaChange = null;
            $('#input-polulation').val(0);
            $('#modal-population').modal('show');

        }
    });

    $('#btnTakeSelection').click(() => {
        let len = currentAction.undo.length;
        if (len > 3 && equalCoordinate(currentAction.undo[0], currentAction.undo[len - 1])) {
            processArea('take');
        }
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
        $('#predic-shouse').html(loading);
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
        reloadImage(null, true);
        let altitude = $('#height').val() * 1 || 500;
        let base64 = context.canvas.toDataURL().split(';base64,')[1];
        reloadImage();
        let population = 0;
        for (let item of historyAction.undo) {
            population += item.d * 1;
        }
        console.log('altitude', altitude);
        console.log('population', population);
        let body = {
            image: base64,
            altitude: altitude,
            population
        };
        postImage(`${API_SERVER}/satellite`, body)
            .then(respon => {
                console.log({ ...respon });
                respon.S_house = respon.S_house.split('~')[0] * 1 || 0;
                res = respon;
                let { S_green = 0, S_house = 0, S_lake = 0, S_none = 0, S_other = 0, S_total = 0, house = -1 } = respon;

                let density = $('#density').val() * 1 || 3.5;

                $('#predic-area').html((S_total / 1000000 || 0).toFixed(2));
                $('#predic-shouse').html((S_house / 1000000 || 0).toFixed(2));
                $('#predic-number-house').html(house);
                $('#predic-population').html(Math.round(house * density));
                $('#predic-density-population').html(Math.round((Math.round(house * density) * 1000000 / S_total || 0)));
                $('#predic-density-building').html((S_house / S_total * 100 || 0).toFixed(2) + '%');
                $('#predic-ratio-tree').html((S_green / S_total * 100 || 0).toFixed(2) + '%');
                $('#predic-ratio-warter').html((S_lake / S_total * 100 || 0).toFixed(2) + '%');
                $('#predic-ratio-traffic').html(((S_none + S_other) / S_total * 100 || 0).toFixed(2) + '%');

                if (S_total == 0 || house == -1) {
                    alert('Ảnh không hợp lệ!', 'ERROR');
                    $('#modalPredic').modal('hide');
                }
                request = null;
            }).catch(err => {
                console.error(err);
                $('#modalPredic').modal('hide');
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
        if (!request) {
            let text = '';
            text += `Khu vực:\t\t\t\t${$('#area').val() || ''}\n`;
            text += `Số người / nhà:\t\t\t\t${$('#density').val() * 1 || 3.5}\n`;
            text += '\n';
            text += `Diện tích khu vực:\t\t\t${$('#predic-area').text() || ''}\tkm2\n`;
            text += `Diện tích nhà ở:\t\t\t${$('#predic-shouse').text() || ''}\tnhà\n`;
            text += `Dân số:\t\t\t\t\t${$('#predic-population').text() || ''}\tngười\n`;
            text += `Mật độ dân số:\t\t\t\t${$('#predic-density-population').text() || ''}\tngười / km2\n`;
            text += '\n';
            text += `Mật độ xây dựng:\t\t\t${$('#predic-density-building').text() || ''}%\n`;
            text += `Tỷ lệ cây xanh:\t\t\t\t${$('#predic-ratio-tree').text() || ''}%\n`;
            text += `Tỷ lệ mặt nước:\t\t\t\t${$('#predic-ratio-warter').text() || ''}%\n`;
            text += `Tỷ lệ giao thông và diện tích khác:\t${$('#predic-ratio-traffic').text() || ''}%`;

            exportFile('data.txt', text);
        }
        else {
            alert('Đang đợi kết quả, vui lòng chờ')
        }
    });

    $('#density').change(() => {
        if (request) return;
        let { S_total = 0, house = -1 } = res;
        let density = $('#density').val() * 1 || 3.5;

        $('#predic-density-population').html(Math.round((Math.round(house * density) * 1000000 / S_total || 0)));
    });

    $('#btnEnterPopulation').click(() => {
        console.log(historyAction.undo);
        if (areaChange == null) {
            let len = historyAction.undo.length || 0;
            if (len > 0) {
                historyAction.undo[len - 1].d = $('#input-polulation').val() * 1 || 0;
            }
        }
        else {
            areaChange.d = $('#input-polulation').val() * 1 || 0;
        }
        $('#modal-population').modal('hide');
        reloadImage();
    });
});