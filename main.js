// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const usbDetect = require('usb-detection');
const path = require('path')

// Serial
const { SerialPort } = require('serialport');
const { execSync } = require('child_process');

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
const  createWindow = () => {
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

   // Event 
   mainWindow.on('ready-to-show', async () =>{
    // Send the data.
    mainWindow.show()
  })
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
  let _title = args;

  if(!project){
    let _portCOM = null;

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
  project.on('ready-to-show', async () =>{
    await listSerialPorts();
    // Send the data.
    project.webContents.send('enviar-nombre', {'title': _title, 'port': _portCOM})
    project.show()
  })

  ipc.on('update-name', (e, title) =>{
    _title = title;
    project.webContents.send('enviar-nombre', {'title': _title, 'port': _portCOM})
  });

  // Start process to listen any usb event on the computer.
  usbDetect.startMonitoring();

  // USB Connected.
  usbDetect.on('add', async function(device){ 
    await listSerialPorts()
    project.webContents.send('usb-event', {'device' : device, 'action': 'connected', 'com': _portCOM}) 
  });

  // USB Disconnected
  usbDetect.on('remove', function(device){ 
    project.webContents.send('usb-event', {'device' : device, 'action': 'removed', 'com': _portCOM}) 
  });

  // Close app
  ipc.on('closeProject', (evt, msg)=>{
    project.close()

    // Stop the USB process.
    usbDetect.stopMonitoring();
    
    if(msg){
       app.quit()
    }else{
      mainWindow.show()
      ipc.removeAllListeners('maximizeRestoreProject');
      mainWindow.webContents.send('read-projects');
    }
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
      project = null;
  })

  ipc.on('startPong', (evt, args) =>{
    pingpongWindow(evt, args)
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


  // Function to read all the Serial Ports
  async function listSerialPorts() {
    await SerialPort.list().then((ports, err) => {
        if(ports.length){
            ports.forEach((ports) => {
              let res = execSync(`${__dirname}\\src\\app\\serial\\main.exe LSS ${ports.path}`).toString();
              if(res && !res.includes('Error')){
                _portCOM = ports.path;
                return;
              }
            });
        }
      })
    }
  }
}

const pingpongWindow = (evt, args) =>{
  if(!game){
    // Create the ping pong window.
    game = new BrowserWindow({
      Height:800,
      Width: 1000,
      webPreferences: {
        devTools: true,
        nodeIntegration: true,
        contextIsolation: false,
      },
      frame: false,
      show: false,
      backgroundColor: '#383838'
    })

    game.maximize()

    // and load the index.html of the app.
    game.loadFile('src/app/pingpong.html')

    // Event 
    game.on('ready-to-show', () =>{
      // game.webContents.send('enviar-dispositivos', {'devices': args.devices, 'com': args.com})
      game.show()
      game.webContents.send('enviar-dispositivos', {'devices': args.devices, 'com':args.com})
    })

    // Close app
    ipc.on('closeGame', ()=>{
      game.close()
    })

    game.on('closed',()=>{
      ipc.removeAllListeners('maximizeRestoreProject');
      game = null;
    })
  }

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Algunas APIs pueden solamente ser usadas despues de que este evento ocurra.
app.whenReady().then(() => {
  splashScreen()
  
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