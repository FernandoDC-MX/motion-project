// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// Enable live reload for all the files inside your project directory
require('electron-reload')(__dirname);

// Master communication (This variable will receive the signals that ipcRenderer sends)
const ipc = ipcMain

// [Main] Window
const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minHeight:600,
    minWidth: 980,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    frame:false
  })

  // and load the index.html of the app.
  mainWindow.loadFile('src/app/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Close app
  ipc.on('closeApp', ()=>{
    mainWindow.close()
    app.quit()
  })

  // Minimize app
  ipc.on('minimizeApp', ()=>{
    mainWindow.minimize()
  })

  // Maximize app
  ipc.on('maximizeRestoreApp', ()=>{
    if(mainWindow.isMaximized()){
      mainWindow.restore()
    }else{
      mainWindow.maximize()
    }
  })

  // [Secondary] Create project window.
  ipc.on('openCreateProject', (event, arg) =>{
    // Create the browser window.
    let projectWindow = new BrowserWindow({
      width: 800,
      height: 670,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: true,
      },
      frame: false
    })

    // and load the index.html of the app.
    projectWindow.loadFile('src/app/create_project.html')

    // Destroy the window
    ipc.on('closeCreateProject', ()=>{
      projectWindow.destroy()
    })

    // Event 
    projectWindow.on('ready-to-show', () =>{
      // Send the data.
      projectWindow.webContents.send('enviar-proyectos',arg)
    })

  })

  // Check if the window is maximized
  mainWindow.on('maximize', () =>{
    mainWindow.webContents.send('isMaximized')
  })

   // Check if the window is maximized
   mainWindow.on('unmaximize', () =>{
    mainWindow.webContents.send('isRestored')
  }) 
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Algunas APIs pueden solamente ser usadas despues de que este evento ocurra.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. Tu también puedes ponerlos en archivos separados y requerirlos aquí.