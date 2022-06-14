// Packages
const { ipcRenderer } = require('electron')
const Chart = require('chart.js');
const zoomPlugin = require('chartjs-plugin-zoom');
const fork = require("child_process").fork

// Variables
const maxResBtn = document.getElementById('maximizeBtn')
const _hexColors = ['#F5BD85','#85F5AE','#85C8F5','#F585CC'];
const ipc = ipcRenderer
var _path, channels, _musclesTmp;

let iterator = 0;

// Storage structures
let _devices = [{'hola': '1'}];
var _chartsMap = new Map()
let arrChilds = new Map()

class Device{
    constructor(id, _id_muscle, _muscle_name, _hex, name){
      this.id = id;
      this._id_muscle = _id_muscle;
      this._muscle_name = _muscle_name;
      this._hex = _hex;
      this.name = name
    }
  
    
    get JSON(){
      return {
              "id": this.id,
              "_muscle_name": this._muscle_name,
              "_id_muscle": this._id_muscle,
              "_hex": this._hex,
              "name": this.name
          }
    }
}

// Set the window's title.
ipc.on('enviar-nombre', (e, title) =>{ 
    document.querySelector('title').innerHTML = title
    document.querySelector('.title').innerHTML = title
    _title = title;
    
    readInfo(title)
})

// Read the info.json inside the Project's folder.
function readInfo(_nameFolder){
    _path = `${__dirname}\\Proyectos\\${_nameFolder}`;
    
    var _response = readFile(_path + "\\info.json")

    if(_response.Estado == 'OK'){
        _devices = _response.Contenido.devices;
        displayChannels(_response.Contenido.devices)
        displayGraphs(_response.Contenido.devices);
        displayLinked(_response.Contenido.devices)
    }else{
        alert('Hubo algún error al tratar de abrir el archivo.')
        closeBtn.click()
    }

    settings()
}

// Display the channels on the left side.
function displayChannels(canales){
    var _lista = document.querySelector('.list');
    if(canales){
        channels = new Map(Object.entries(canales));

        var i = 1;
        _lista.innerHTML = '';

        var _li = document.createElement('li');
        _li.classList.add('row','py-1')

        var _col = document.createElement('div');
        _col.classList.add('col-2');
        _col.innerHTML = `<img src="icons/hash.png" width="21" height="21" alt="Número" title="Número"/>`

        _li.appendChild(_col);

        _col = document.createElement('div');
        _col.classList.add('col-7','text-center');
        // _col.innerText = 'Músculo';
        _col.innerHTML = `<img src="icons/muscle.png" width="21" height="21" alt="Músculos" title="Músculos"/>`

        _li.appendChild(_col);

        _col = document.createElement('div');
        _col.classList.add('col-3');
        // _col.innerText = 'Bat';
        _col.innerHTML = `<img src="icons/batery.png" width="21" height="21" alt="Nivel de batería" title="Nivel de batería"/>`


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
            _sub.style.border= `1px solid ${_config._hex}`

            var _p = document.createElement('p');
            _p.style.color = _config._hex;
            _p.innerHTML = '94'

            _sub.appendChild(_p)

            _div.appendChild(_sub)

            _li.appendChild(_div);

            i++;

            _lista.append(_li)
        })

        setId();
    }else{
        var _p = document.createElement('p')
        _p.classList.add('color-description','py-2','user-select-none')
        _p.innerHTML = 'No hay ningún dispositivo vinculado a este proyecto. Vincula uno en la sección <b>Dispositivos.</b>'

        _lista.appendChild(_p)
    }
}

// Display the linked devices.
function displayLinked(devices){
    var _linked = document.querySelector('.linked');
    _linked.innerHTML = '';

    if(devices){
        Object.entries(devices).forEach((entry) => {
            const [key, value] = entry;

            var _div = document.createElement('div');
            _div.classList.add('col-8')

            var _p = document.createElement('p');
            _p.style.color = devices[key]._hex;
            _p.innerText = devices[key].name;

            _div.appendChild(_p);

            _linked.appendChild(_div)

            var _div = document.createElement('div');
            _div.classList.add('col-4')

            var _p = document.createElement('button');
            _p.classList.add('btn-circle-xs')

            _div.appendChild(_p);

            _linked.appendChild(_div)

        });
    }
}

// Return if at least one device has linked with a muscle.
function existsMuscle(canales){
    var flag = 0;

    canales.forEach(canal => {
        if(canal._id_muscle)  flag = 1;
    })

    return flag;
}

// Create the charts zone.
function displayGraphs(canales){
    if(canales){
        const _canales = new Map(Object.entries(canales));

        if(existsMuscle(_canales)){
            const _zone = document.querySelector('._charts');
            _zone.innerHTML = ''

            document.querySelector('.container-message').classList.add('d-none');

            document.querySelector('.menu').classList.remove('d-none')
            _canales.forEach(element =>{
                if(element._id_muscle){

                    var _div = document.createElement('div');
                    _div.classList.add('main-graph-container', 'row');
                    _div.setAttribute('data-device', element.id)

                    var _graph = document.createElement('div');
                    _graph.classList.add('col-8','col-md-8', 'col-sm-12', 'pl-0', 'text-center','h-100');

                    var _graph_div = document.createElement('div');
                    _graph.appendChild(_graph_div)

                    _div.appendChild(_graph)

                    var _subgraphs = document.createElement('div');
                    _subgraphs.classList.add('col-4','col-md-4','col-sm-12', 'pr-0', 'text-center', 'h-100')

                    _div.appendChild(_subgraphs)

                    readData(element, _div)

                    _zone.appendChild(_div)
                }
            })
        }else{
            document.querySelector('.container-message').classList.remove('d-none');
        }
        
    }else{
        document.querySelector('.container-message').classList.remove('d-none')
    }
}

// Finish the test.
stopBtn.addEventListener('click', () =>{
   

    // Kill all the childs created.
    arrChilds.forEach((value, key) => {
        process.kill(key)
    });

    // Clear the map.
    arrChilds.clear()

    // Message
    show('info','La prueba ha sido terminada por el usuario.')

    // Display Play Button and Hide the Pause Button
    playBtn.classList.remove('d-none','pressed')
    pauseBtn.classList.add('d-none')

    // Redraw the charts.
    document.querySelectorAll('.main-graph-container').forEach(element => {
        var device = element.getAttribute('data-device')
        reDrawChart(_chartsMap.get(`${device}-main`));                
        reDrawChart(_chartsMap.get(`${device}-accelerometer`));                
        reDrawChart(_chartsMap.get(`${device}-gyroscope`));
    });
});

// Start the test.
playBtn.addEventListener('click', () => {
    
    // Gets all the main charts.
    var _mainCharts = document.querySelectorAll('.main-graph-container');

    if(!playBtn.classList.contains('pressed')){
        // Display Pause Button and Hide the Play Button
        playBtn.classList.add('d-none')
        pauseBtn.classList.remove('d-none')

        createCharts(_mainCharts)
        playBtn.classList.add('pressed')
        iterator = 0;

        for(let i = 0; i < _mainCharts.length; i++){
            var _child = fork(__dirname + "\\js\\demo.js")
    
            arrChilds.set(_child.pid, _child)
           
            // Execute the test.
            _child.send({ 
                msg: 'do work',
                pid : _child.pid, // passing pid to child
                id_zone: _mainCharts[i].getAttribute('data-device'),
                play: 1,
                iterator: iterator
            })
    
            _child.on('message', (msg) =>{
                switch(msg.flag){
                    // Start the process.
                    case 0: switch(msg.chart){
                                case 'main': addData(_chartsMap.get(`${msg.device}-main`), msg.label, msg.data)
                                    break;
                                case 'accelerometer': addData(_chartsMap.get(`${msg.device}-accelerometer`), msg.label, msg.data)
                                    break;
                                case 'gyroscope': addData(_chartsMap.get(`${msg.device}-gyroscope`), msg.label, msg.data)
                                    break;
                            }
                        break;
                    case 1: // Display Play Button and Hide the Pause Button
                            playBtn.classList.remove('d-none')
                            pauseBtn.classList.add('d-none')
    
                            if(msg.iterator === msg.max){ 
                                // Redraw each chart with all the data generated.
                                reDrawChart(_chartsMap.get(`${msg.device}-main`));                
                                reDrawChart(_chartsMap.get(`${msg.device}-accelerometer`));                
                                reDrawChart(_chartsMap.get(`${msg.device}-gyroscope`));
    
                                show('success','Monitoreo terminado.')
                                process.kill(msg.id)

                                playBtn.classList.remove('pressed')
                                arrChilds.clear()
                            }
                        break;
                    case 2: iterator = msg.iterator
                            show('info','La prueba ha sido pausada por el usuario')

                            // Display Pause Button and Hide the Play Button
                            playBtn.classList.remove('d-none')
                            pauseBtn.classList.add('d-none')
                          break;
                }
            })
        }
        
        show('info','La prueba ha empezado.')

    }else{
        // Display Play Button and Hide the Pause Button
        playBtn.classList.add('d-none')
        pauseBtn.classList.remove('d-none')
        

        let i = 0;
        // Resume the pending data.
        arrChilds.forEach((value, key) => {
            // Execute the test.
            value.send({ 
                msg: 'do work',
                pid : key, // passing pid to child
                id_zone: _mainCharts[i].getAttribute('data-device'),
                play: 1,
                iterator: iterator
            })
            
            i++;
        });

        show('info', 'La prueba ha sido reanudada')
    } 
});

// Pause the test.
pauseBtn.addEventListener('click', () =>{
    // 👇️ Using forEach
    arrChilds.forEach((value, key) => {
        value.send({
            play: 0
        })
    });
})

// Create the canvas and the charts.
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
        _res = drawAccelerometerGyroChart(_device._hex, 'Acelerometro')
        _subgraph.appendChild(_res[0]);
        _chartsMap.set(`${_device.id}-accelerometer`, {'chart':_res[1], 'values': [[],[],[]], 'labels': []})

        _secondaryCharts.appendChild(_subgraph)

        _subgraph = document.createElement('div');
        _subgraph.classList.add('subgraph');

        // Gyroscope chart
        _res = drawAccelerometerGyroChart(_device._hex, 'Giroscopio')
        _subgraph.appendChild(_res[0]);
        _chartsMap.set(`${_device.id}-gyroscope`, {'chart':_res[1], 'values': [[],[],[]], 'labels': []})

        _secondaryCharts.appendChild(_subgraph)
    }

}

// Draw all the mains charts. 
function drawMainChart(color){
    const _canvas = document.createElement("canvas");
    const ctx = _canvas.getContext('2d');

    // Device chart
    var chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                backgroundColor: color,
                borderColor: color,
                label: 'EMG',
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
                },
                title: {
                    display: true,
                    text: 'EMG'
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

// Draw all the Accelerometers and Gyros Charts.
function drawAccelerometerGyroChart(color, title){
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
                },
                title: {
                    display: true,
                    text: title
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

// Close the window.
closeBtn.addEventListener('click', () =>{
    ipc.send('closeProject')
})

// Minimize the window.
minimizeBtn.addEventListener('click', () =>{
    ipc.send('minimizeProject')
})

// Restore/Maximize the window.
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

ipc.on('isMaximized_2', ()=>{ changeMaximizeBtn(true) })
ipc.on('isRestored_2', ()=>{ changeMaximizeBtn(false) })

// Events to link a muscle with a device.
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

// Restore the original colors.
function cleanHover(){
    if(_musclesTmp)
        _musclesTmp.forEach(element =>{
            element.style.fill = 'white';
        })
}

cancelBtn.addEventListener('click', () =>{
    cleanHover()
})

// Event to link the device with the muscle and save into the info.json file.
acceptBtn.addEventListener('click', () =>{
    if(document.querySelector('.cls-selected')){
        getMuscle()
        show('success', 'Dispositivo ligado al músculo.')
        cancelBtn.click();
    }else
        show('warning','Tienes que seleccionar un músculo.')
})

// Store the info inside the info.json file.
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

// Enable/Disable all the muscles that are already unselected/selected.
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

// Disable the muscles that are already selected.
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

//Avoid that a muscle can be linked twice on different devices in the project.
function updateDisabledMuscles(){
    var musculos = document.querySelectorAll('.cls-disabled')

    for(let i = 0; i < musculos.length; i++){
        musculos[i].addEventListener('click', function(){
            show('warning', 'Este músculo ya esta ligado a otro dispositivo.')
        })
    }
}

// Displays the info in the modal settings.
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
                case 'basic':   title.innerHTML = 'Modalidad 1';
                                description.innerHTML = 'La configuración básica sirve para...'
                                setSettingsValues(0,0,0,0, true)                                
                    break;
                case 'medium':  title.innerHTML = 'Modalidad 2';
                                description.innerHTML = 'La configuración media sirve para...'
                                setSettingsValues(1,1,1,1, true)
                    break;
                case 'hard':    title.innerHTML = 'Modalidad 3';
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

// Sets the values in the modal settings inputs.
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

// Save settings.
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

// Close modal settings.
btnCloseSettings.addEventListener('click', async () =>{

})

// CSS event: Displays a zone.
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

// Search devices.
searchDevicesBtn.addEventListener('click', async () =>{
    searchDevicesBtn.classList.add('d-none')

    var _searched = document.querySelector('.searched')
    _searched.innerHTML = '';

    var _founded = document.createElement('p');
    _founded.classList.add('color-description','d-none', 'mx-3', 'mt-4','mb-0')

    _searched.appendChild(_founded)

    var _div = searchDevicesBtn.parentNode.parentNode.querySelector('.d-flex');
    _div.classList.remove('d-none')

    var _loading = searchDevicesBtn.parentNode.parentNode.querySelector('.loading');
    _loading.style.animation = 'rotating 2s linear infinite';

    var _cont = 0;

    for(let i = 0; i < 4; i++){
        await sleep(500)
        const _address = '192.212.100.' + i

        var _sub = document.createElement('div');
        _sub.setAttribute('data-mac', _address)
        _sub.setAttribute('data-bs-toggle',"modal")
        _sub.setAttribute('data-bs-target',"#linkModal")
    
        var _p = document.createElement('p');
        _p.innerText = 'MAC Address: ' + _sub.getAttribute('data-mac')
        _p.setAttribute('title', _p.innerText)

        _sub.appendChild(_p)
        // Display the element in founded zone.
        if(!_devices || !(_address in _devices)){
            _sub.classList.add('founded')
            _searched.appendChild(_sub)
            setAddress()
            _cont++;
            displayLinked(_devices)
        }
    }

    _div.classList.add('d-none')
    _founded.classList.remove('d-none')
    _founded.innerText = 'Encontrados: ' + _cont;
    searchDevicesBtn.classList.remove('d-none')
    _loading.style.animation = '';

});

// Link event.
linkBtn.addEventListener('click', async () => {
    linkBtn.parentNode.classList.add('d-none')
    linkBtn.parentNode.nextElementSibling.classList.remove('d-none')
    linkBtn.parentNode.parentNode.parentNode.querySelector('p').innerText = 'Espera a que el dispositivo se vincule con el proyecto.';

    var _address = document.querySelector('#linkModal .modal-title').innerText.replace('Vincular dispositivo ', '')
    var _device = new Device(_address, null, null, _hexColors[pickColor()], _address)

    await sleep(1500)
    var _response = readFile(_path + "\\info.json")
    
    if(_response.Contenido.devices){
        var _tmp = _response.Contenido.devices;
        _tmp[_address] = _device.JSON;
        _response.Contenido.devices = _tmp
        
    }else{
        var map = new Map()
        map.set(_address, _device.JSON);
        _response.Contenido.devices = Object.fromEntries(map)
    }
    fs.mkdirSync(_path + '\\Devices\\' + _address , { recursive: true });
    storeFile(_path + "\\info.json", _response.Contenido)
    _devices = _response.Contenido.devices
    displayChannels(_response.Contenido.devices)
    displayGraphs(_response.Contenido.devices);
    displayLinked(_devices)
    show('success', 'Dispositivo vinculado correctamente.')
    document.querySelector(`[data-mac="${_address}"]`).remove()

    linkClose.click()

    // Restore animation modal
    linkBtn.parentNode.classList.remove('d-none')
    linkBtn.parentNode.nextElementSibling.classList.add('d-none')
    linkBtn.parentNode.parentNode.parentNode.querySelector('p').innerText = 'Presiona el botón para empezar la vinculación del dispositivo.';

})

// Return a color that has not been selected yet.
const pickColor = () =>{
    var index = 0;

    if(_devices){       
        index =  Object.keys(_devices).length;
    }

    return index;
}

// Sets title in the modal link.
function setAddress(){
    var _addresses = document.querySelectorAll('.founded');

    for(let i = 0; i < _addresses.length; i++){
        _addresses[i].addEventListener('click', function(){
            var _address = this.getAttribute('data-mac')
            document.querySelector('#linkModal .modal-title').innerHTML = 'Vincular dispositivo ' + _address;
        })
    }
}

// Sets title in the modal muscle.
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

// Hides the beat chart.
hideBeatBtn.addEventListener('click', () =>{
    var _chartsBeat = document.querySelectorAll('.main-graph-container .col-8')
    var flag;

    // If the button was pressed before, then...
    if(hideBeatBtn.classList.contains('pressed')){
        hideBeatBtn.classList.remove('pressed')
        hideBeatBtn.querySelector('p').classList.add('d-none')
        flag = 0;
    }else{
        hideBeatBtn.classList.add('pressed')
        hideBeatBtn.querySelector('p').classList.remove('d-none')
        flag = 1;
    }

    // Iterate the loop to hide/show each beat graph.
    for(let i = 0; i < _chartsBeat.length; i++){
        flag ? _chartsBeat[i].classList.add('d-none') : _chartsBeat[i].classList.remove('d-none') 
    }

    extendsChart('main', flag)
})

// Hides the accelerometer chart.
hideAceBtn.addEventListener('click', ()=>{
    var _accelerometerCharts = document.querySelectorAll('.main-graph-container .col-4 .subgraph')
    var flag;

     // If the button was pressed before, then...
     if(hideAceBtn.classList.contains('pressed')){
        hideAceBtn.classList.remove('pressed')
        hideAceBtn.querySelector('p').classList.add('d-none')
        flag = 0;
    }else{
        hideAceBtn.classList.add('pressed')
        hideAceBtn.querySelector('p').classList.remove('d-none')
        flag = 1;
    }

    // Iterate the loop to hide/show each beat graph.
    for(let i = 0; i < _accelerometerCharts.length; i++){
        if( i % 2)
            flag ? _accelerometerCharts[i].classList.add('d-none') : _accelerometerCharts[i].classList.remove('d-none') 
        else
            flag ? _accelerometerCharts[i].style.height = "100%" : _accelerometerCharts[i].style.height = "50%" 
    }

    extendsChart('sub', flag)
})


// Hides the gyroscope chart.
hideGyroBtn.addEventListener('click', ()=>{
    var _gyroCharts = document.querySelectorAll('.main-graph-container .col-4 .subgraph')
    var flag;

     // If the button was pressed before, then...
     if(hideGyroBtn.classList.contains('pressed')){
        hideGyroBtn.classList.remove('pressed')
        hideGyroBtn.querySelector('p').classList.add('d-none')
        flag = 0;
    }else{
        hideGyroBtn.classList.add('pressed')
        hideGyroBtn.querySelector('p').classList.remove('d-none')
        flag = 1;
    }

    // Iterate the loop to hide/show each beat graph.
    for(let i = 0; i < _gyroCharts.length; i++){
        if(!(i % 2))
            flag ? _gyroCharts[i].classList.add('d-none') : _gyroCharts[i].classList.remove('d-none') 
        else
            flag ? _gyroCharts[i].style.height = "100%" : _gyroCharts[i].style.height = "50%" 
    }

    extendsChart('sub', flag)

})

// Resize charts.
function extendsChart(chart, flag){
    var _charts;

    switch(chart){
        case 'main': _charts = document.querySelectorAll('.main-graph-container .col-4')
                    // Iterate the loop to hide/show each beat graph.
                    for(let i = 0; i < _charts.length; i++){
                        if(flag){
                            _charts[i].classList.add('col-md-12');
                            _charts[i].classList.remove('col-md-4');
                        }else{
                            _charts[i].classList.remove('col-md-12');
                            _charts[i].classList.add('col-md-4');
                        }
                    }
            break;
        case 'sub': _charts = document.querySelectorAll('.main-graph-container .col-8')
                    if(hideAceBtn.classList.contains('pressed') && hideGyroBtn.classList.contains('pressed')){
                        // Iterate the loop to hide/show each beat graph.
                        for(let i = 0; i < _charts.length; i++){
                            _charts[i].classList.add('col-md-12');
                            _charts[i].classList.remove('col-md-8');
                        }
                    }else{
                        // Iterate the loop to hide/show each beat graph.
                        for(let i = 0; i < _charts.length; i++){
                            _charts[i].classList.remove('col-md-12');
                            _charts[i].classList.add('col-md-8');
                        }
                    }
            break;
    }

    
}

// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}