const { ipcRenderer } = require('electron')
const Chart = require('chart.js');
const zoomPlugin = require('chartjs-plugin-zoom');
const fork = require("child_process").fork
const maxResBtn = document.getElementById('maximizeBtn')


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
    _lista.innerHTML = '';

    var _li = document.createElement('li');
    _li.classList.add('row','py-1')

    var _col = document.createElement('div');
    _col.classList.add('col-2');
    _col.innerText = '#';

    _li.appendChild(_col);

    _col = document.createElement('div');
    _col.classList.add('col-7');
    _col.innerText = 'Músculo';

    _li.appendChild(_col);

    _col = document.createElement('div');
    _col.classList.add('col-3');
    _col.innerText = 'Bat';

    _li.appendChild(_col);

    _li.style.borderBottom = '1px solid white'

    _lista.appendChild(_li)


    channels.forEach(element => {
        var _config = element;

        var _li = document.createElement('li');

        _li.classList.add('py-2', 'device', 'row')


        _li.setAttribute('data-id', 'channel-' + _config.id)
        _li.setAttribute('data-bs-toggle',"modal")
        _li.setAttribute('data-bs-target',"#staticBackdrop")

        var _div = document.createElement('div');
        _div.innerHTML = i + '.-'
        _div.classList.add('col-2')


        _li.appendChild(_div)

        var _div = document.createElement('div');
        _div.classList.add('col-7', 'ellips');
        
        if(!_config._muscle_name){
            _div.innerText = 'Seleccionar'
        }
        else{
            _div.innerText = _config._muscle_name
            _li.setAttribute('title',_config._muscle_name)
        }
        _li.appendChild(_div);

        _div = document.createElement('div');
        _div.classList.add('col-3');

        var _sub = document.createElement('div');
        _sub.classList.add('mx-auto','text-center', 'battery-container')
        _sub.style.border= `1px solid #${_config._hex}`

        var _p = document.createElement('p');
        _p.style.color = "#" + _config._hex;
        _p.innerHTML = '94'

        _sub.appendChild(_p)

        _div.appendChild(_sub)

        _li.appendChild(_div);

        i++;

        _lista.append(_li)
    })

    setId();
}

function displayGraphs(canales){
    const _canales = new Map(Object.entries(canales));
    const _zone = document.querySelector('._charts');
    _zone.innerHTML = ''

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

// 
playBtn.addEventListener('click', function(){
    startDataGraph();
});

// 
function startDataGraph(){
    // Gets all the main charts.
    var _mainCharts = document.querySelectorAll('.main-graph-container');

    createCharts(_mainCharts)


    // Display Pause Button and Hide the Play Button
    playBtn.classList.add('d-none')
    pauseBtn.classList.remove('d-none')


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
                // Display Play Button and Hide the Pause Button
                playBtn.classList.remove('d-none')
                pauseBtn.classList.add('d-none')

                // Redraw each chart with all the data generated.
                reDrawChart(_chartsMap.get(`${msg.device}-main`));                
                reDrawChart(_chartsMap.get(`${msg.device}-accelerometer`));                
                reDrawChart(_chartsMap.get(`${msg.device}-gyroscope`));                

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

    show('info','La prueba ha empezado.')
}

// 
function createCharts(_divs){
    // We will iterate each chart zone by each device linked within the project.
    for(let i = 0; i < _divs.length; i++){
        var _mainContainer = _divs[i];

        var _device = channels.get(_mainContainer.getAttribute('data-device'))

        var _mainChart = _mainContainer.querySelector('.col-8');
        _mainChart.innerHTML = ''

        var _res = drawMainChart(_device._hex)
        _mainChart.appendChild(_res[0])
        _chartsMap.set(`${_device.id}-main`, {'chart':_res[1], 'values': [[]], 'labels': []})

        var _secondaryCharts = _mainContainer.querySelector('.col-4');
        _secondaryCharts.innerHTML = '';

        var _subgraph = document.createElement('div');
        _subgraph.classList.add('subgraph');

        // Accelerometer chart
        _res = drawAccelerometerGyroChart(_device._hex)
        _subgraph.appendChild(_res[0]);
        _chartsMap.set(`${_device.id}-accelerometer`, {'chart':_res[1], 'values': [[],[],[]], 'labels': []})

        _secondaryCharts.appendChild(_subgraph)

        _subgraph = document.createElement('div');
        _subgraph.classList.add('subgraph');

        // Gyroscope chart
        _res = drawAccelerometerGyroChart(_device._hex)
        _subgraph.appendChild(_res[0]);
        _chartsMap.set(`${_device.id}-gyroscope`, {'chart':_res[1], 'values': [[],[],[]], 'labels': []})

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
function addData(map, label, data) {
    // We will use this variable to determine if a label was erased or not.
    let flag = false;

    // Put the new label on the chart
    map.chart.data.labels.push(label);
    map.labels.push(label)

    // Iterate each chart's datasets
    map.chart.data.datasets.forEach((dataset, index) => {

        // If the array's length is superior to 10, the firs element will be deleted.
        if(dataset.data.length > 50){

            // Delete the first data.
            dataset.data.shift()

            // If the flag is false
            if(!flag){
                flag = true;
                map.chart.data.labels.shift()
            }
            
        }

        // Store all the data.
        map.values[index].push(data[index]);

        // Draw the data stored into the chart's array.
        dataset.data.push(data[index]);
    });

    map.chart.update();
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

// Update a chart
function reDrawChart(map){
    // Update labels
    map.chart.data.labels = map.labels;

    // Update datasets
    map.chart.data.datasets.forEach((dataset, index) => {
        dataset.data = map.values[index]

        // Clean map values.
        map.values[index] = []
    });
    
    // Clean map labels
    map.labels = []

    // Redraw chart
    map.chart.update()
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

minimizeBtn.addEventListener('click', () =>{
    ipc.send('minimizeProject')
})

function changeMaximizeBtn(isMaximized){
    if(isMaximized){
        maxResBtn.title = 'Restore'
        maxResBtn.classList.remove('maximizeBtn');
        maxResBtn.classList.add('restoreBtn');
    }else{
        maxResBtn.title = 'Maximize'
        maxResBtn.classList.remove('restoreBtn');
        maxResBtn.classList.add('maximizeBtn');
    }
}

// Maximize App
maximizeBtn.addEventListener('click', () =>{
    ipc.send('maximizeRestoreProject')
})

ipc.on('isMaximized', ()=>{ changeMaximizeBtn(true) })
ipc.on('isRestored', ()=>{ changeMaximizeBtn(false) })

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

            // Info
            _nombre.innerHTML =_clone.getAttribute('data-name').replaceAll('-',' ').toUpperCase()
        }),
        _muscles[i].addEventListener('mouseleave', function(e){
            document.querySelectorAll(`path[data-name='${this.getAttribute('data-name')}']`).forEach(element =>{
                element.style.fill = 'white'
            })

            if(document.querySelector('.cls-selected')){
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
                    displayChannels(_response.Contenido.devices)
                    displayGraphs(_response.Contenido.devices);
                    selectMuscle()
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
    var _options = document.querySelectorAll('.setting-options li');
    let title = document.querySelector('#setting-title');
    let description = document.querySelector('#setting-description');

    
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
                case 'basic':   title.innerHTML = 'Configuración básica';
                                description.innerHTML = 'La configuración básica sirve para...'
                                setSettingsValues(0,0,0,0, true)                                
                    break;
                case 'medium':  title.innerHTML = 'Configuración media';
                                description.innerHTML = 'La configuración media sirve para...'
                                setSettingsValues(1,1,1,1, true)
                    break;
                case 'hard':    title.innerHTML = 'Configuración experta';
                                description.innerHTML = 'La configuración experta sirve para...'
                                setSettingsValues(2,2,2,2, true)                                
                    break;
                case 'advanced':title.innerHTML = 'Configuración avanzada';
                                description.innerHTML = 'La configuración avanzada sirve para...'
                                setSettingsValues(0,0,0,0, false)                                
                    break;
            }

        })
    }
}

const setSettingsValues = (_valueSample, _valueNumber, _valueImu, _valueExample, flag) =>{
    // Inputs
    let sample_rate = document.querySelector('#sample-rate');
    let number_rate = document.querySelector('#number-rate');
    let imu_rate = document.querySelector('#imu-rate');
    let example_rate = document.querySelector('#example-rate');

    sample_rate.value = _valueSample;
    number_rate.value = _valueNumber;
    imu_rate.value = _valueImu;
    example_rate.value = _valueExample;

    for(let i = 0; i < document.querySelectorAll('.form-group select').length; i++){
        document.querySelectorAll('.form-group select')[i].disabled = flag
    }
}

btnSaveSettings.addEventListener('click', () => {
    var _values = document.querySelectorAll('.form-group select');
    var _json = {sample_rate: _values[0].value, number_rate: _values[1].value, imu_rate: _values[2].value, example_rate: _values[3].value}

    var _response = readFile(_path + "\\info.json")

    switch(_response.Estado){
        case 'OK': var _content = _response.Contenido;
                    _content['settings'] = _json;
                    storeFile(_path + "\\info.json", _content)
                    show('success', 'Configuración guardada correctamente.')
                    btnCloseSettings.click()
            break;
        case 'ERROR': show('error', 'Hubo un problema al guardar la información.')
            break;
    }


})

btnCloseSettings.addEventListener('click', async () =>{

})

stopBtn.addEventListener('click', () => {
    show('info','La prueba ha sido detenida.')
})

document.querySelectorAll('.channel-clickable').forEach(element =>{
    element.addEventListener('click', () =>{
        var svg = element.querySelector('.arrow-svg');
        var _sibling = element.nextElementSibling;


        if(_sibling.classList.contains('d-none')){
            _sibling.classList.remove('d-none')
            svg.style.transform = 'rotate(180deg)'
        }else{
            _sibling.classList.add('d-none')
            _sibling.style.height = '100px'
            svg.style.transform = 'rotate(0deg)'
        }

    })
})

searchDevicesBtn.addEventListener('click', async () =>{
    searchDevicesBtn.classList.add('d-none')
    var _searched = document.querySelector('.searched')
    _searched.innerHTML = '';

    var _div = searchDevicesBtn.parentNode.parentNode.querySelector('.d-flex');
    _div.classList.remove('d-none')

    var _loading = searchDevicesBtn.parentNode.parentNode.querySelector('.loading');
    _loading.style.animation = 'rotating 2s linear infinite';

    for(let i = 0; i < 4; i++){
        await sleep(1000)

        var _sub = document.createElement('div');
        _sub.setAttribute('data-mac', '192.212.100.' + i)
    
        var _p = document.createElement('p');
        _p.innerText = 'MAC Address: ' + _sub.getAttribute('data-mac')
        _p.setAttribute('title', _p.innerText)

        _sub.appendChild(_p)

        _searched.appendChild(_sub)
    }

    _div.classList.add('d-none')
    searchDevicesBtn.classList.remove('d-none')
    _loading.style.animation = '';
});


// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}