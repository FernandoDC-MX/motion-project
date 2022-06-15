// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
let flag_reopen = 0;

// Enable live reload for all the files inside your project directory
require('electron-reload')(__dirname, {ignored: /Proyectos|[\/\\]\./});

// Master communication (This variable will receive the signals that ipcRenderer sends)
const ipc = ipcMain
let mainWindow, project, game;

// Splash screen.
const splashScreen = () =>{
   // Create the browser window.
   const splash_screen = new BrowserWindow({
    height:450,
    width: 400,
    transparent: true, 
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    backgroundColor: '#383838',
    show: false,
    frame: false
  })

  // and load the index.html of the app.
  splash_screen.loadFile('src/app/splash.html')

  // Center screen
  splash_screen.center();

  // Event 
  splash_screen.on('ready-to-show', () =>{
    // Send the data.
    splash_screen.show()

    setTimeout(function () {
      splash_screen.close();
      createWindow()
    }, 4000);
  })
}

// [Main] Window
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minHeight:600,
    minWidth: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    frame:false,
    show: false,
    backgroundColor: '#383838',
  })

  mainWindow.maximize()

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

  ipc.on('openProject', (evt, args)=>{
    mainWindow.hide()
    projectWindow(evt, args)
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

const projectWindow = (evt, args) =>{

  // Create the browser window.
  project = new BrowserWindow({
    minHeight:600,
    minWidth: 1000,
    Height:800,
    Width: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    frame: false,
    show: false,
    backgroundColor: '#383838'
  })

  project.maximize()

  // and load the index.html of the app.
  project.loadFile('src/app/project.html')

  // Event 
  project.on('ready-to-show', () =>{
    // Send the data.
    project.webContents.send('enviar-nombre', args)
    project.show()
  })

  // Close app
  ipc.on('closeProject', ()=>{
    mainWindow.show()
    project.close()
  })

   // Minimize app
   ipc.on('minimizeProject', ()=>{
    project.minimize()
  })

  // Check if the project is maximized
  project.on('maximize', () =>{
    project.webContents.send('isMaximized_2')
  })

  project.on('closed',()=>{
      ipc.removeAllListeners('maximizeRestoreProject');
  })

  // Maximize app
  ipc.on('maximizeRestoreProject', ()=>{
    if(project.isMaximized()){
      project.restore()
    }else{
      project.maximize()
    }
  })

  // Check if the project is maximized
  project.on('unmaximize', () =>{
    project.webContents.send('isRestored_2')
  }) 
}

const pingpongWindow = () =>{
  // Create the ping pong window.
  game = new BrowserWindow({
    Height:800,
    Width: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    frame: true,
  })

  game.maximize()

  // and load the index.html of the app.
  game.loadFile('src/app/pingpong.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Algunas APIs pueden solamente ser usadas despues de que este evento ocurra.
app.whenReady().then(() => {
  // splashScreen()
  pingpongWindow()
  
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