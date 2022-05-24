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
        displayChannels(_response.Contenido.devices)
    }else{
        alert('Hubo algún error al tratar de abrir el archivo.')
    }
}

function displayChannels(canales){
    const _json = JSON.parse(canales)
    var i = 1, _lista = document.querySelector('.list');

    _json['value'].forEach(element => {
        var _config = element[1];

        var _li = document.createElement('li');

        _li.classList.add('py-2')
        _li.classList.add('device')

        _li.setAttribute('data-id', 'channel-' + _config.id)
        _li.setAttribute('data-bs-toggle',"modal")
        _li.setAttribute('data-bs-target',"#staticBackdrop")

        var _span = document.createElement('span');
        _span.innerHTML = i + '.-'

        _li.appendChild(_span)

        var _span = document.createElement('span');
        _span.classList.add('p-s');

        if(!_config._muscle_name)
            _span.innerText = 'Seleccionar'
        else
            _span.innerText = _config._muscle_name

        _li.appendChild(_span);

        _li.innerHTML+= `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#${_config._hex}" class="bi bi-activity" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2Z"/>
                </svg>`;

        i++;

        _lista.append(_li)
    })
}
 
closeBtn.addEventListener('click', () =>{
    ipc.send('closeProject')
})

function reviver(key, value) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
}

