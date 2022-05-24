const { ipcRenderer } = require('electron')
const ipc = ipcRenderer
var _path, channels;

ipc.on('enviar-nombre', (e, title) =>{ 
    document.querySelector('title').innerHTML = title
    document.querySelector('.title').innerHTML = title
    _title = title;
    
    readInfo(title)
})

function readInfo(_nameFolder){
    _path = `${__dirname}\\Proyectos\\${_nameFolder}\\info.json`;
    
    var _response = readFile(_path)

    if(_response.Estado == 'OK'){
        displayChannels(_response.Contenido.devices)
    }else{
        alert('Hubo algún error al tratar de abrir el archivo.')
    }
}

function displayChannels(canales){
    channels = new Map(Object.entries(canales));

    var i = 1, _lista = document.querySelector('.list');

    channels.forEach(element => {
        var _config = element;

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

    setId();
}

function setId(){
    var _channels = document.querySelectorAll('.device');

    for(let i = 0; i < _channels.length; i++){
        _channels[i].addEventListener('click', function(){
            var _title = document.querySelector('.modal-title');
            _title.setAttribute('data-id', 'title-' + this.getAttribute('data-id').replace('channel-',''))
            _title.innerHTML = "Selecciona un músculo para el dispositivo:" + ' ' + this.getAttribute('data-id').replace('channel-',' ');
        })
    }
}
 
closeBtn.addEventListener('click', () =>{
    ipc.send('closeProject')
})

function selectMuscle(){
    var _muscles = document.querySelectorAll('.cls-2')

    for(let i = 0; i < _muscles.length; i++){
        _muscles[i].addEventListener('mouseover', function(e){
            // console.log(e.currentTarget)
            // var _clone = this.cloneNode(true)
            // var _nombre = document.querySelector('.nombre');

            // // Preview image.
            // var _preview = document.querySelector('.muscle-preview');

            // var _svg = document.createElement('svg');
            // _svg.setAttribute('xmlns',"http://www.w3.org/2000/svg");
            // _svg.setAttribute('viewBox', '0 0 400 400');

            // _svg.append(_clone)

            // _preview.appendChild(_svg)

            // // Info
            // _nombre.innerHTML =_clone.getAttribute('data-name').replaceAll('-',' ').toUpperCase()
        }),
        _muscles[i].addEventListener('click', function(){
            var _clone = this.cloneNode(true)
            var _nombre = document.querySelector('.nombre');
            var _tmp = document.querySelector('.cls-selected')

            if(this.classList.contains('cls-2')){
                this.classList.remove('cls-2')
                this.classList.add('cls-selected')
                // Info
                _nombre.innerHTML =_clone.getAttribute('data-name').replaceAll('-',' ').toUpperCase()
            }else{
                this.classList.add('cls-2')
                this.classList.remove('cls-selected')
                // Info
                _nombre.innerHTML = ''
            }

            // Preview image.
            var _preview = document.querySelector('.muscle-preview');

            var _svg = document.createElement('svg');
            _svg.setAttribute('xmlns',"http://www.w3.org/2000/svg");
            _svg.setAttribute('viewBox', '0 0 400 400');

            _svg.append(_clone)

            _preview.appendChild(_svg)

            

            if(_tmp){
                _tmp.classList.remove('cls-selected');
                _tmp.classList.add('cls-2')
            }
        })
    }
}

selectMuscle();

acceptBtn.addEventListener('click', () =>{
    if(document.querySelector('.cls-selected')){
        storeMuscle()
        cancelBtn.click();
    }else
        show('warning','Tienes que seleccionar un músculo.')
})

function storeMuscle(){
    var _currentDevice = document.querySelector('.modal-title').getAttribute('data-id').replace('title-','');
    var _changes = channels.get(_currentDevice)

    _changes._muscle_name = document.querySelector('.cls-selected').getAttribute('data-name')

    console.log(_changes)

}