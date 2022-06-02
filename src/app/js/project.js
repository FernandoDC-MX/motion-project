const { ipcRenderer } = require('electron')
const Chart = require('chart.js');
const zoomPlugin = require('chartjs-plugin-zoom')
const fork = require("child_process").fork

const ipc = ipcRenderer
var _path, channels, _musclesTmp;
var _chartsMap = new Map()

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
        closeBtn.click()
    }

    settings()
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
    const _zone = document.querySelector('.zone');

    _canales.forEach(element =>{
        if(element._id_muscle){
            document.querySelector('.container-message').classList.add('d-none');

            var _div = document.createElement('div');
            _div.classList.add('main-graph-container', 'row');
            _div.setAttribute('data-device', element.id)

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

}

playBtn.addEventListener('click', function(){
    startDataGraph();
});

// 
function startDataGraph(){
    // Gets all the main charts.
    var _mainCharts = document.querySelectorAll('.main-graph-container');

    createCharts(_mainCharts)

    for(let i = 0; i < _mainCharts.length; i++){
        var _child = fork(__dirname + "\\js\\demo.js")
       
        // Execute the test.
        _child.send({ 
            msg: 'do work',
            pid : _child.pid, // passing pid to child
            id_zone: _mainCharts[i].getAttribute('data-device')
        })

        // Kill the process.
        _child.on('message', (msg) =>{
            if(msg.flag){
                process.kill(msg.id)
                show('success','Monitoreo terminado.')
            }
            else{
                switch(msg.chart){
                    case 'main': addData(_chartsMap.get(`${msg.device}-main`), msg.label, msg.data)
                        break;
                    case 'accelerometer': addData(_chartsMap.get(`${msg.device}-accelerometer`), msg.label, msg.data)
                        break;
                    case 'gyroscope': addData(_chartsMap.get(`${msg.device}-gyroscope`), msg.label, msg.data)
                        break;
                }
            }
        })
    }

}

function createCharts(_divs){
    // We will iterate each chart zone by each device linked within the project.
    for(let i = 0; i < _divs.length; i++){
        var _mainContainer = _divs[i];

        var _device = channels.get(_mainContainer.getAttribute('data-device'))

        var _mainChart = _mainContainer.querySelector('.col-8');
        _mainChart.innerHTML = ''

        var _res = drawMainChart(_device._hex)
        _mainChart.appendChild(_res[0])
        _chartsMap.set(`${_device.id}-main`, _res[1])

        var _secondaryCharts = _mainContainer.querySelector('.col-4');
        _secondaryCharts.innerHTML = '';

        var _subgraph = document.createElement('div');
        _subgraph.classList.add('subgraph');

        // Accelerometer chart
        _res = drawAccelerometerGyroChart(_device._hex)
        _subgraph.appendChild(_res[0]);
        _chartsMap.set(`${_device.id}-accelerometer`, _res[1])

        _secondaryCharts.appendChild(_subgraph)

        _subgraph = document.createElement('div');
        _subgraph.classList.add('subgraph');

        // Gyroscope chart
        _res = drawAccelerometerGyroChart(_device._hex)
        _subgraph.appendChild(_res[0]);
        _chartsMap.set(`${_device.id}-gyroscope`, _res[1])

        _secondaryCharts.appendChild(_subgraph)
    }

}

function drawMainChart(color){
    const _canvas = document.createElement("canvas");
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
            plugins: {
                zoom: {
                    zoom: {
                      wheel: {
                        enabled: true,
                        speed: 0.1,
                      },
                      drag: {
                        enabled: true
                      },
                      pinch: {
                        enabled: true
                      },
                      mode: 'xy',
                    },
                    limits: {
                        y: {min: 1, max: 100},}
                }
            },
            transitions: {
                zoom: {
                  animation: {
                    duration: 1000,
                    easing: 'easeOutCubic'
                  }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    return [_canvas, chart];
}

function drawAccelerometerGyroChart(color){
    const _canvas = document.createElement("canvas");
    const ctx = _canvas.getContext('2d');

    // Accelerometer chart
    var chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                // X Value
                {
                    backgroundColor: "#ff000070",
                    borderColor: "#ff000034",
                    label: 'X',
                    data: []
                },
                // Y Value
                {
                    backgroundColor: "#002aff70",
                    borderColor: "#002aff34",
                    label: 'Y',
                    data: []
                },
                // Z Value
                {
                    backgroundColor: "#00ff2270",
                    borderColor: "#00ff2234",
                    label: 'Z',
                    data: []
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                zoom: {
                    zoom: {
                      wheel: {
                        enabled: true,
                        speed: 0.1,
                      },
                      drag: {
                        enabled: true
                      },
                      pinch: {
                        enabled: true
                      },
                      mode: 'xy',
                    },
                    limits: {
                        y: {min: 1, max: 100},}
                }
            },
            transitions: {
                zoom: {
                  animation: {
                    duration: 1000,
                    easing: 'easeOutCubic'
                  }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });



    return [_canvas, chart];
}

// Update a chart.
function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset, index) => {
        dataset.data.push(data[index]);
    });
    chart.update();
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
        _muscles[i].addEventListener('mouseenter', function(e){
            cleanHover()

            _musclesTmp = document.querySelectorAll(`path[data-name="${this.getAttribute('data-name')}"]`);
            
            for(let i = 0; i < _musclesTmp.length; i++){
                _musclesTmp[i].style.fill = '#ffffff75';
            }

            var _clone = this.cloneNode(true)
            var _nombre = document.querySelector('.nombre');
            _nombre.classList.add('txt-shadow')

            _nombre.style.animation = 'highlight-text 1s forwards';

            // Info
            _nombre.innerHTML =_clone.getAttribute('data-name').replaceAll('-',' ').toUpperCase()
        }),
        _muscles[i].addEventListener('mouseleave', function(e){
            document.querySelectorAll(`path[data-name='${this.getAttribute('data-name')}']`).forEach(element =>{
                element.style.fill = 'white'
            })


            if(document.querySelector('.cls-selected').getAttribute('data-name')){
                var _nombre = document.querySelector('.cls-selected').getAttribute('data-name')

                document.querySelector('.nombre').innerHTML = _nombre.toUpperCase()
                document.querySelector('.nombre').classList.remove('txt-shadow')

                Array.from(document.querySelectorAll('.cls-selected')).forEach(element =>{
                    element.style.fill = 'red'
                })
            }
        }),
        _muscles[i].addEventListener('click', function(){
            var _tmp = document.querySelectorAll('.cls-selected')
            
            _musclesTmp.forEach(element =>{
                if(element.classList.contains('cls-2')){
                    element.classList.remove('cls-2')
                    element.classList.add('cls-selected')
                    element.style.fill = 'red';
    
                }else{
                    element.classList.add('cls-2')
                    element.classList.remove('cls-selected')
                    element.style.fill = 'white';                    
                }
            })

            if(_tmp.length){
                Array.from(_tmp).forEach(element =>{
                    element.classList.remove('cls-selected');
                    element.classList.add('cls-2')
                    element.style.fill = 'white'
                })
            }
        })
    }
}

function cleanHover(){
    if(_musclesTmp)
        _musclesTmp.forEach(element =>{
            element.style.fill = 'white';
        })
}

cancelBtn.addEventListener('click', () =>{
    cleanHover()
})

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

    var _response = readFile(_path + "\\info.json")

    switch(_response.Estado){
        case 'OK':  
                    _response.Contenido.devices = Object.fromEntries(channels)
                    storeFile(_path + "\\info.json", _response.Contenido)
            break;
    }
}

staticBackdrop.addEventListener('shown.bs.modal', function(){
    var _device = document.querySelector('.modal-title').getAttribute('data-id').replace('title-','')
    var _muscle_info = channels.get(_device)

    // Remove all false selected
    if(document.querySelectorAll('.cls-selected')){
        Array.from(document.querySelectorAll('.cls-selected')).forEach(element =>{
            element.classList.add('cls-2')
            element.classList.remove('cls-selected')
        })
    }

    // Add the selected muscle.
    if(_muscle_info._id_muscle){
        var name = _muscle_info._muscle_name.toLowerCase().replaceAll(' ','-')

        Array.from(document.querySelectorAll(`path[data-name="${name}"]`)).forEach(element => {
            element.classList.remove('cls-2') 
            element.classList.add('cls-selected')
            element.style.fill = 'red';
        })

        this.querySelector('.nombre').innerHTML = _muscle_info._muscle_name.toUpperCase()
        this.querySelector('.nombre').classList.remove('txt-shadow')

    }

    disableMuscles(_muscle_info);
})

function disableMuscles(_muscle_info){
    channels.forEach((value, key) =>{
        if(value._muscle_name !== _muscle_info._muscle_name && value._muscle_name)
            Array.from(document.querySelectorAll(`path[data-name='${value._muscle_name.replaceAll(' ','-').toLowerCase()}']`)).forEach(element =>{
                element.classList.remove('cls-2')
                element.classList.remove('cls-selected')
                element.classList.add('cls-disabled')
                element.style.fill = "#626262";
            })
    });

    selectMuscle()
    updateDisabledMuscles();
}

function updateDisabledMuscles(){
    var musculos = document.querySelectorAll('.cls-disabled')

    for(let i = 0; i < musculos.length; i++){
        musculos[i].addEventListener('click', function(){
            show('warning', 'Este músculo ya esta ligado a otro dispositivo.')
        })
    }
}

function settings(){
    var _options = document.querySelectorAll('.setting-options li')

    for(let i = 0; i < _options.length; i++){
        _options[i].addEventListener('click', function(){

            // Unselect the last option selected.
            if(document.querySelector('.setting-options .bg-square')){
                document.querySelector('.setting-options .bg-square').classList.remove('bg-square')
            }

            // Select the new one.
            this.classList.add('bg-square')

            // Displays the correct description and sets the default values.
            switch(this.getAttribute('data-option')){
                case 'basic': 
                    break;
            }

        })
    }
}
