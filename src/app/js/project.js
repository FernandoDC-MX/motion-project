const { ipcRenderer } = require('electron')
const Chart = require('chart.js');
const ipc = ipcRenderer
var _path, channels;

ipc.on('enviar-nombre', (e, title) =>{ 
    document.querySelector('title').innerHTML = title
    document.querySelector('.title').innerHTML = title
    _title = title;
    
    readInfo(title)
})

function readInfo(_nameFolder){
    _path = `${__dirname}\\Proyectos\\${_nameFolder}`;
    
    var _response = readFile(_path + "\\info.json")

    if(_response.Estado == 'OK'){
        displayChannels(_response.Contenido.devices)
        displayGraphs(_response.Contenido.devices);
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
        _li.classList.add('row')

        _li.setAttribute('data-id', 'channel-' + _config.id)
        _li.setAttribute('data-bs-toggle',"modal")
        _li.setAttribute('data-bs-target',"#staticBackdrop")

        var _div = document.createElement('div');
        _div.innerHTML = i + '.-'
        _div.classList.add('col-2')


        _li.appendChild(_div)

        var _div = document.createElement('div');
        _div.classList.add('col-8');
        _div.classList.add('ellips');
        
        if(!_config._muscle_name){
            _div.innerText = 'Seleccionar'
        }
        else{
            _div.innerText = _config._muscle_name
            _li.setAttribute('title',_config._muscle_name)
        }
        _li.appendChild(_div);

        _li.innerHTML+= `
                <div class="col-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#${_config._hex}" class="bi bi-activity" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2Z"/>
                    </svg>
                </div>    
                `;

        i++;

        _lista.append(_li)
    })

    setId();
}

function displayGraphs(canales){
    const _canales = new Map(Object.entries(canales));
    const _zone = document.querySelector('.graphs');

    _canales.forEach(element =>{
        if(element._id_muscle){
            document.querySelector('.container-message').classList.add('d-none');

            var _div = document.createElement('div');
            _div.classList.add('main-graph-container', 'row');
            _div.setAttribute('data-device', element.id)

            _div.appendChild(createMenu())

            var _graph = document.createElement('div');
            _graph.classList.add('col-8','col-md-8', 'col-sm-12', 'pl-0', 'text-center');

            var _graph_div = document.createElement('div');
            _graph.appendChild(_graph_div)

            _div.appendChild(_graph)

            var _subgraphs = document.createElement('div');
            _subgraphs.classList.add('col-4','col-md-4','col-sm-12', 'pr-0', 'text-center')

            _div.appendChild(_subgraphs)

            readData(element, _div)

            _zone.appendChild(_div)
        }
    })

    listenerTests();
}

function listenerTests(){
    var _playButtons = document.querySelectorAll('.play-icon');

    for(let i = 0; i < _playButtons.length; i++){
        _playButtons[i].addEventListener('click', function(){
            const id = this.parentNode.parentNode.getAttribute('data-device');
            
            startDataGraph(id);
        })
    }
}

// 
function startDataGraph(id){
    var color = channels.get(id)._hex;

    var _mainDiv = document.querySelector(`[data-device=${id}]`);

    var _dataDiv = _mainDiv.querySelector('.col-8')
    const _canvas = document.createElement('canvas')
    const ctx = _canvas.getContext('2d');

    // Device chart
    var chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                backgroundColor: "#" + color,
                borderColor: "#" + color,
                label: 'Dispositivo',
                data: []
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    _dataDiv.innerHTML = '';
    _dataDiv.appendChild(_canvas)

    var _subgraphs = _mainDiv.querySelector('.col-4');
    _subgraphs.innerHTML = ''

    var _div = document.createElement('div');
    _div.classList.add('subgraph')


    const _accelerometerCanvas = document.createElement('canvas')
    const _accelerometerCtx = _accelerometerCanvas.getContext('2d');

    // Device chart
    var _accelerometerChart = new Chart(_accelerometerCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                backgroundColor: "#" + color,
                borderColor: "#" + color,
                label: 'Acelerómetro',
                data: []
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    _div.appendChild(_accelerometerCanvas)

    _subgraphs.appendChild(_div)

    var _div = document.createElement('div');
    _div.classList.add('subgraph')

    const _gyroCanvas = document.createElement('canvas')
    const _gyroCtx = _gyroCanvas.getContext('2d');

    const _gyroChart = new Chart(_gyroCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                backgroundColor: "#" + color,
                borderColor: "#" + color,
                label: 'Giroscopio',
                data: []
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    _div.appendChild(_gyroCanvas)

    _subgraphs.appendChild(_div)

    demo(chart, _accelerometerChart, _gyroChart);
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Update a chart.
function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

async function demo(chart,_accelerometerChart, _gyroChart) {
    for (let i = 0; i < 10; i++) {
        var randomNumber = Math.floor(Math.random() * (10 - 1)) + 1;
        addData(chart, i, randomNumber)

        randomNumber = Math.floor(Math.random() * (10 - 1)) + 1;
        addData(_accelerometerChart, i, randomNumber)

        randomNumber = Math.floor(Math.random() * (10 - 1)) + 1;
        addData(_gyroChart, i, randomNumber)


        // console.log(`Waiting ${i+1} seconds...`);
        await sleep(1);
    }
    show('success','Monitoreo terminado.')
}

// We will read the files that contains all the data stored by each device.
function readData(device, div){
    // Path: 
    var _deviceFolder = _path + '\\Devices\\'+ device.id;

    // Read the path
    if (fs.existsSync(_deviceFolder)){
        // Read all the content within the folder.
        if(readFiles(_deviceFolder).length){
            
        }else{
            const _mainDiv = div.querySelector('.col-8')
            _mainDiv.innerHTML = 'Aún no hay ningún archivo generado por este dispositivo.'

            const _secDiv = div.querySelector('.col-4')
            _secDiv.innerHTML = 'Aún no hay ningún archivo generado por este dispositivo.'
        }

    }

}

const createGraph = () =>{
    var _canvas = document.createElement('canvas');
    const _graphic = _canvas.getContext('2d');
    const myChart = new Chart(_graphic, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false

        }
    });

    return _canvas;
}

const lineGraph = () =>{

  

    var _canvas = document.createElement('canvas');
    const _graphic = _canvas.getContext('2d');




var dataFirst = {
    label: "Car A - Speed (mph)",
    data: [0, 59, 75, 20, 20, 55, 40],
    lineTension: 0,
    fill: false,
    borderColor: 'red'
  };

var dataSecond = {
    label: "Car B - Speed (mph)",
    data: [20, 15, 60, 60, 65, 30, 70],
    lineTension: 0,
    fill: false,
  borderColor: 'blue'
  };

var speedData = {
  labels: ["0s", "10s", "20s", "30s", "40s", "50s", "60s"],
  datasets: [dataFirst]
};

var chartOptions = {
  legend: {
    display: true,
    position: 'top',
    labels: {
      boxWidth: 80,
      fontColor: 'black'
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

var lineChart = new Chart(_graphic, {
  type: 'line',
  data: speedData,
  options: chartOptions
});


    return _canvas;
}

const createMenu = () =>{
    var _menu = document.createElement('div');
    _menu.classList.add('menu');

  
    const _play = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-play-circle play-icon mx-2" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                    </svg>`;

    const _pause = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-pause-circle pause-icon mx-2" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5z"/>
                    </svg>`;
    
    const _config = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-gear setting-icon mx-2" viewBox="0 0 16 16">
                        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                    </svg>`;
    
    const _download = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" class="bi bi-download download-icon mx-2" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>`;

    _menu.innerHTML+= _play;
    _menu.innerHTML+= _pause;
    _menu.innerHTML+= _config;
    _menu.innerHTML+= _download;


    return _menu
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
        getMuscle()
        show('success', 'Dispositivo ligado al músculo.')
        cancelBtn.click();
    }else
        show('warning','Tienes que seleccionar un músculo.')
})

function getMuscle(){
    var _currentDevice = document.querySelector('.modal-title').getAttribute('data-id').replace('title-','');
    var _changes = channels.get(_currentDevice)

    _changes._muscle_name = document.querySelector('.cls-selected').getAttribute('data-name').replaceAll('-',' ');
    _changes._muscle_name = _changes._muscle_name.charAt(0).toUpperCase() + _changes._muscle_name.slice(1);
    _changes._id_muscle = document.querySelector('.cls-selected').getAttribute('data-id');
    channels.set(_currentDevice, _changes)

    var _response = readFile(_path);

    switch(_response.Estado){
        case 'OK':  
                    _response.Contenido.devices = Object.fromEntries(channels)
                    storeFile(_path, _response.Contenido)
            break;
    }
}

staticBackdrop.addEventListener('shown.bs.modal', function(){
    var _device = document.querySelector('.modal-title').getAttribute('data-id').replace('title-','')
    var _muscle_info = channels.get(_device)

    if(document.querySelector('.cls-selected')){
        document.querySelector('.cls-selected').classList.add('cls-2')
        document.querySelector('.cls-selected').classList.remove('cls-selected')
    }

    if(_muscle_info){
        document.querySelector(`path[data-id="${_muscle_info._id_muscle}"]`).classList.remove('cls-2')
        document.querySelector(`path[data-id="${_muscle_info._id_muscle}"]`).classList.add('cls-selected')
    }
})