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

    if(_response.Estado == 'OK'){

    }else{
        alert('Hubo algún error al tratar de abrir el archivo.')
    }
}

closeBtn.addEventListener('click', () =>{
    ipc.send('closeProject')
})