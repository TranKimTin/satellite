const electron = require('electron');
const { app, Menu } = electron;
const BrowserWindow = electron.BrowserWindow;
const isMac = process.platform === 'darwin';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({ show: false, width: 1200, height: 800 });
    // mainWindow.webContents.openDevTools()
    mainWindow.maximize();
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    
    mainWindow.on('closed', function () {
        mainWindow = null;
    })
}

app.on('ready', () => {
    createWindow();
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
})

//Create menu
// const templateMenu = [
//     {
//         label: 'File',
//         submenu: [
//             {
//                 label: 'Undo',
//                 accelerator: isMac ? 'Cmd+Z' : 'Ctrl+Z',
//                 click(){

//                 }
//             },
//             {
//                 label: 'Redo',
//                 accelerator: isMac ? 'Cmd+Y' : 'Ctrl+Y',
//                 click(){
                    
//                 }
//             },
//             {
//                 label: 'Exit',
//                 click(){
//                     app.quit();
//                 },
//                 accelerator: isMac ? 'Cmd+Q' : 'Ctrl+Q'
//             }
//         ]
//     }
// ];
// if (isMac) templateMenu.unshift({});
// const menu = Menu.buildFromTemplate(templateMenu);
// Menu.setApplicationMenu(menu);
Menu.setApplicationMenu(null);