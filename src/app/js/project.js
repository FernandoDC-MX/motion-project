const { ipcRenderer } = require('electron')
const ipc = ipcRenderer

ipc.on('enviar-nombre', (e, title) =>{ 
    document.querySelector('title').innerHTML = title
    document.querySelector('.title').innerHTML = title

    readInfo(title)
})

function readInfo(_nameFolder){
    var _path = `${__dirname}\\Proyectos\\${_nameFolder}\\info.json`;
    
    var _response = readFile(_path)

    console.log(_response)
}
