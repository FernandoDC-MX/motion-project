/* --------------------------  Packages ------------------------------- */

// Render
const { ipcRenderer } = require('electron')

// Charts
const Chart = require('chart.js');
const zoomPlugin = require('chartjs-plugin-zoom');

// Process
const { execSync, exec } = require('child_process');
const fork = require("child_process").fork


/* ---------------------------- Classes ------------------------------ */
class Device{
    constructor(id, _id_muscle, _muscle_name, _hex, _index, name){
      this.id = id;
      this._id_muscle = _id_muscle;
      this._muscle_name = _muscle_name;
      this._hex = _hex;
      this._index = _index
      this.name = name
    }
  
    
    get JSON(){
      return {
              "id": this.id,
              "_muscle_name": this._muscle_name,
              "_id_muscle": this._id_muscle,
              "_hex": this._hex,
              "_index": this._index,
              "name": this.name
          }
    }
}

class FileTest{
    constructor(name, created_at, data){
      this.name = name;
      this.created_at = created_at;
      this.data = data;
    }
  
    
    get JSON(){
      return {
              "name": this.name,
              "created_at": this.created_at,
              "data": this.data,
          }
    }
}

class MasterDevice{
    #_slaveDevices;

    constructor(){
        this.#_slaveDevices = new Map()
    }

    setNewDevice(mac_address, Device){
        this.#_slaveDevices.set(mac_address, Device)
        let _linkres = this.setSettingsDevice(this.#_slaveDevices.get(mac_address))
        this.#_slaveDevices.get(mac_address)['connected'] = 1;
        console.log(_linkres.toString())
        return _linkres.toString();
    }

    setSettingsDevice(_slaveDevice){
        let response;

        if(_slaveDevice){
            response = execSync(`${__dirname}\\serial\\main.exe ADD ${_slaveDevice.id} ${_portCOM} ${_slaveDevice.name} 100 ${_slaveDevice._index}`);
        }else{
          response = {'Error': 'No existe el dispositivo dentro del proyecto. Verifica que realmente este vinculado y trata de nuevo.'}
        }

        return response;
    }

    connectDevice(_id){
        let res = execSync(`${__dirname}\\serial\\main.exe TST ${_id} ${_portCOM}`);

        if(parseInt(res.toString())){
            this.#_slaveDevices.get(_id)['connected'] = 1;
            execSync(`${__dirname}\\serial\\main.exe COL ${_id} ${_portCOM} ${this.#_slaveDevices.get(_id)['_index']}`);

        }else{
            this.#_slaveDevices.get(_id)['connected'] = 0;
        }

        return parseInt(res.toString());
    }

    updateDevice(_id, nom){
        let res = execSync(`${__dirname}\\serial\\main.exe NOM ${_id} ${_portCOM} ${nom}`);
        
        if(!res.toString()){
            this.#_slaveDevices.get(_id).name = nom;
        }

        return parseInt(res.toString());
    }

    deleteDevice(_id){
        let res = execSync(`${__dirname}\\serial\\main.exe DEL ${_id} ${_portCOM}`);
        console.log(res.toString());
        if(!res.toString()){
            this.#_slaveDevices.delete(_id)
        }

        return parseInt(res.toString());
    }

    makeBinding(devices){   
        if(devices){
            this.#_slaveDevices = new Map(Object.entries(devices));
            let count = 0;
            document.querySelector('#_numDevices').innerHTML = count;

            this.#_slaveDevices.forEach((value, key) => {
                let response = execSync(`${__dirname}\\serial\\main.exe TST ${value.id} ${_portCOM}`);
                if(response.toString().includes('0'))
                 value['connected'] = 0
                else{  
                    value['connected'] = 1;
                    count++;
                    document.querySelector('#_numDevices').innerHTML = count;
                    execSync(`${__dirname}\\serial\\main.exe COL ${value.id} ${_portCOM} ${value._index}`);
                    execSync(`${__dirname}\\serial\\main.exe NOM ${value.id} ${_portCOM} ${value.name}`);
                }
                
                this.#_slaveDevices.set(key, value)
            });
        }

    }

    startTest(settings){
        this.#_slaveDevices.forEach((value, key) => {
            exec(`${__dirname}\\serial\\main.exe STR ${key} ${_portCOM} ${settings.number_rate} ${settings.imu_rate}`)
        });
    }

    get JSON(){
        return this.#_slaveDevices;
    }
}

/* -----------------------  Variables ------------------------------ */
const maxResBtn = document.getElementById('maximizeBtn')
const _hexColors = ['#F5BD85','#85F5AE','#85C8F5','#F585CC'];
const ipc = ipcRenderer
var _path, channels, _musclesTmp;

let iterator = 0;
let toggleMenuFlag = 0;
let recentsValue = -10;
let _portCOM = null;

// Storage structures
let _devices = [{'hola': '1'}];
var _chartsMap = new Map()
let arrChilds = new Map()
let _master = new MasterDevice()
let _filesData = null;
let _settings = null;

/* ------------------------------------ Functions ---------------------------- */

// Set the window's title.
ipc.on('enviar-nombre', (e, args) =>{
    _title = args.title;
    document.querySelector('title').innerHTML = _title
    document.querySelector('.title').innerHTML = _title

    _portCOM = args.port
    if(_portCOM){
        document.querySelector('#_namePort').innerHTML = _portCOM.toString()
        readInfo(_title)
    }else{
        document.querySelector('.hd-close').click()
    }
    
    statusElement.previousElementSibling.classList.add('d-none')
})

// Read the info.json inside the Project's folder.
function readInfo(_nameFolder){
    _path = `${__dirname}\\Proyectos\\${_nameFolder}`;
    var _response = readFile(_path + "\\info.json")

    if(_response.Estado == 'OK'){
        _devices = _response.Contenido.devices;
        _settings = _response.Contenido.settings;
        _master.makeBinding(_devices)
        displayChannels(_response.Contenido.devices)
        displayGraphs(_response.Contenido.devices);
        displayLinked()
        statusElement.innerText = 'Listo'
    }else{
        alert('Hubo algún error al tratar de abrir el archivo.')
        closeBtn.click()
    }

    statusElement.previousElementSibling.classList.remove('rotating')
    settings()
}

// Display the channels on the left side.
function displayChannels(canales){
    var _lista = document.querySelector('.list');
    _lista.innerHTML = '';

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
        _col.classList.add('col-7','col-lg-7','col-md-6','text-center');
        // _col.innerText = 'Músculo';
        _col.innerHTML = `<img src="icons/muscle.png" width="21" height="21" alt="Músculos" title="Músculos"/>`

        _li.appendChild(_col);

        _col = document.createElement('div');
        _col.classList.add('col-3','col-lg-3','col-md-4');
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
            _div.classList.add('col-7', 'col-lg-7', 'col-md-6', 'ellips');
            
            if(!_config._muscle_name){
                _div.innerText = 'Seleccionar'
            }
            else{
                _div.innerText = _config._muscle_name
                _li.setAttribute('title',_config._muscle_name)
            }
            _li.appendChild(_div);

            _div = document.createElement('div');
            _div.classList.add('col-3','col-lg-3','col-md-4','mx-auto');

            var _sub = document.createElement('div');
            _sub.classList.add('text-center', 'battery-container')

            var _p = document.createElement('p');
            _p.classList.add('text-center')
            _p.style.color = _config._hex;
            _p.innerHTML = '94 %'

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
function displayLinked(){
    var _linked = document.querySelector('.linked');
    _linked.innerHTML = '';

    console.log(_master.JSON);
    if( _master.JSON.size > 0){
        _master.JSON.forEach((value, key) => {

            var _div = document.createElement('div');
            _div.classList.add('px-3','py-2','modal-editable')
            _div.setAttribute('edit-device', key)
            _div.setAttribute('data-bs-toggle',"modal")
            _div.setAttribute('data-bs-target',"#editableDevice")

            var _p = document.createElement('p');
            _p.classList.add('m-0')
            _p.style.color = _devices[key]._hex;
            _p.innerText = _devices[key].name;

            _div.appendChild(_p);

            var _p = document.createElement('p');
            _p.classList.add('m-0')

            if(value.connected){
                _p.innerText = 'Conectado';
            }else{
                _p.innerText = 'No conectado';
            }

            _div.appendChild(_p);

            _linked.appendChild(_div)
        });

        editableDevices()
    }
}

function editableDevices(){
    var _devices = document.querySelectorAll('.modal-editable')

    for(let i = 0; i < _devices.length; i++){
        _devices[i].addEventListener('click', function(){
            var _modal = document.querySelector('#editableDevice');
            
            if(!this.querySelectorAll('p')[1].innerText.includes('No conectado')) {
                _modal.querySelector('#_editName').disabled = false;
                _modal.querySelector('#_editName').parentNode.classList.remove('d-none')


                _modal.querySelector('.update').classList.remove('d-none');
            }else{  
                _modal.querySelector('.connect').classList.remove('d-none')
            }
            _modal.querySelector('.modal-title').innerHTML = `Editar dispositivo: ${this.getAttribute('edit-device')} (${this.querySelectorAll('p')[1].innerText})`; 
            _modal.querySelector('.modal-title').setAttribute('temporal-id', this.getAttribute('edit-device'))
        })
    }
}

connect.addEventListener('click', async function(){
    let _id = document.querySelector('#editableDevice .modal-title').getAttribute('temporal-id');

    document.querySelector('#editableDevice .waves').classList.remove('d-none')
    await sleep(100)
    if(_master.connectDevice(_id)){
        show('success','Dispositivo conectado correctamente')
        document.querySelector('#editableDevice #connect').classList.add('d-none')
        displayLinked()
    }else{
        show('error', 'No se pudo conectar.')
    }


    document.querySelector('#editableDevice .waves').classList.add('d-none')

})

update.addEventListener('click', async function(){
    let _id = document.querySelector('#editableDevice .modal-title').getAttribute('temporal-id');
    let nom = document.querySelector('#editableDevice #_editName').value

    document.querySelector('#editableDevice .waves').classList.remove('d-none')
    await sleep(100)
    if(!_master.updateDevice(_id, nom)){
        show('success','Dispositivo actualizado correctamente')
        document.querySelector('#editableDevice #connect').classList.add('d-none')

        var _response = readFile(_path + "\\info.json")
        
        if(_response.Contenido.devices){
                _response.Contenido.devices[_id].name = nom;
        }
    
        storeFile(_path + "\\info.json", _response.Contenido)
        _devices = _response.Contenido.devices
        displayChannels(_response.Contenido.devices)
        displayGraphs(_response.Contenido.devices);
        displayLinked()
    }else{
        show('error', 'No se pudo actualizar.')
    }


    document.querySelector('#editableDevice .waves').classList.add('d-none')

})

deleteB.addEventListener('click', async function(){
    let _id = document.querySelector('#editableDevice .modal-title').getAttribute('temporal-id');

    document.querySelector('#editableDevice .waves').classList.remove('d-none')
    await sleep(10)

    if(!_master.deleteDevice(_id)){
        show('success','Dispositivo eliminado correctamente')

        var _response = readFile(_path + "\\info.json")
        
        if(_response.Contenido.devices){
            var tmp = new Map(Object.entries(_response.Contenido.devices))
            tmp.delete(_id);
            if(tmp.size === 0)
                tmp = null;

            _response.Contenido.devices = tmp;

            storeFile(_path + "\\info.json", _response.Contenido)
            _devices = _response.Contenido.devices
            displayChannels(_response.Contenido.devices)
            displayGraphs(_response.Contenido.devices);
            displayLinked()
        }
    
        
    }else{
        show('error', 'No se pudo actualizar.')
    }


    document.querySelector('#editableDevice .waves').classList.add('d-none')

})

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
            document.querySelector('._charts').classList.remove('d-none')
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
            document.querySelector('.menu').classList.add('d-none')
            document.querySelector('._charts').classList.add('d-none')
        }
        
    }else{
        document.querySelector('.container-message').classList.remove('d-none')
        document.querySelector('.menu').classList.add('d-none')
        document.querySelector('._charts').classList.add('d-none')
    }
}

// 
function stopAll(e, status = 0){
    // Kill all the childs created.
    arrChilds.forEach((value, key) => {
        process.kill(key)
    });

    // Clear the map.
    arrChilds.clear()

    // Display Play Button and Hide the Pause Button
    playBtn.classList.remove('d-none','pressed')
    playBtn.querySelector('title').innerHTML = 'Empezar prueba.'
    pauseBtn.classList.add('d-none')

    if(!status){
        var date = new Date () 
        var localDate = date.getFullYear() + '/' + ('0' + (date.getMonth()+1)).slice(-2) + '/' + ('0' + date.getDate()).slice(-2);
        var localHour = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2)
        var meridian = date.getHours() > 12 ? 'P.M.' : 'A.M.'

        // Message
        show('info','La prueba ha sido terminada por el usuario.')

        // Redraw the charts.
        document.querySelectorAll('.main-graph-container').forEach(element => {
            var device = element.getAttribute('data-device')
            reDrawChart(_chartsMap.get(`${device}-main`));                
            reDrawChart(_chartsMap.get(`${device}-accelerometer`));                
            reDrawChart(_chartsMap.get(`${device}-gyroscope`));
        });

        saveData()
        document.querySelector('.menu p').innerHTML = 'Última prueba: ' + localDate + ' ' + localHour + ' ' + meridian;
    }else{
        // Message
        show('error','Cerebro desconectado.')
    }    
}

// Finish the test.
stopBtn.addEventListener('click',stopAll);

// Start the test.
playBtn.addEventListener('click', () => {
    
    // Gets all the main charts.
    var _mainCharts = document.querySelectorAll('.main-graph-container');

    if(!playBtn.classList.contains('pressed') && _settings != null){
        // Display Pause Button and Hide the Play Button
        playBtn.classList.add('d-none')
        pauseBtn.classList.remove('d-none')
        playBtn.querySelector('title').innerHTML = "Reanudar prueba"


        createCharts(_mainCharts)
        playBtn.classList.add('pressed')
        iterator = 0;

        _master.startTest(_settings)

        for(let i = 0; i < _mainCharts.length; i++){

            var _child = fork(__dirname + "\\js\\test.js")
    
            arrChilds.set(_child.pid, _child)
           
            // Execute the test.
            _child.send({ 
                msg: 'do work',
                nTimes: _settings.imu_rate,
                _portCOM: _portCOM,
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
                                var date = new Date()
                                // Redraw each chart with all the data generated.
                                reDrawChart(_chartsMap.get(`${msg.device}-main`));                
                                reDrawChart(_chartsMap.get(`${msg.device}-accelerometer`));                
                                reDrawChart(_chartsMap.get(`${msg.device}-gyroscope`));
    
                                show('success','Monitoreo terminado.')
                                process.kill(msg.id)

                                var localDate = date.getFullYear() + '/' + ('0' + (date.getMonth()+1)).slice(-2) + '/' + ('0' + date.getDate()).slice(-2);
                                var localHour = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2)
                                var meridian = date.getHours() > 12 ? 'P.M.' : 'A.M.'

                                document.querySelector('.menu p').innerHTML = 'Última prueba: ' + localDate + ' ' + localHour + ' ' + meridian;    

                                playBtn.classList.remove('pressed')
                                playBtn.querySelector('title').innerHTML = 'Empezar prueba.'

                                arrChilds.clear()
                                saveData()
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

    }else if(_settings == null){
        show('error', 'Primero debes de seleccionar una configuración.')
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
    var _deviceFolder = _path + '\\Data\\';

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
    if(!playBtn.classList.contains('d-none') && !playBtn.classList.contains('pressed')){
        ipc.send('closeProject', 1)
    }    
    else{
        document.querySelector('.hd-close').click()
        document.querySelector('#emergentWindow').classList.remove('d-none')
    }
})

outBtn.addEventListener('click', () =>{
    // Kill all the childs created.
    arrChilds.forEach((value, key) => {
        process.kill(key)
    });
    ipc.send('closeProject')
})

comOut.addEventListener('click', () =>{
    ipc.send('closeProject',0)
})

homeBtn.addEventListener('click', () =>{
    ipc.send('closeProject',0)
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
                    element.style.fill = '#FF7B54'
                })
            }
        }),
        _muscles[i].addEventListener('click', function(){
            var _tmp = document.querySelectorAll('.cls-selected')

            _musclesTmp.forEach(element =>{
                if(element.classList.contains('cls-2')){
                    element.classList.remove('cls-2')
                    element.classList.add('cls-selected')
                    element.style.fill = '#FF7B54';
    
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

staticBackdrop.addEventListener('hidden.bs.modal', () =>{

   // Remove all false selected
    if(document.querySelectorAll('.cls-selected')){
        Array.from(document.querySelectorAll('.cls-selected')).forEach(element =>{
            element.classList.add('cls-2')
            element.classList.remove('cls-selected')
            element.style.fill="#F8F8F8"
        })
    }

    selectMuscle()
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
            element.style.fill = '#FF7B54';
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
                                setSettingsValues(0,0,60, true)                                
                    break;
                case 'medium':  title.innerHTML = 'Modalidad 2';
                                description.innerHTML = 'La configuración media sirve para...'
                                setSettingsValues(1,1,60, true)
                    break;
                case 'hard':    title.innerHTML = 'Modalidad 3';
                                description.innerHTML = 'La configuración experta sirve para...'
                                setSettingsValues(2,2,60, true)                                
                    break;
                case 'advanced':title.innerHTML = 'Configuración avanzada';
                                description.innerHTML = 'La configuración avanzada sirve para...'
                                setSettingsValues(1,1,60, false)                                
                    break;
            }

        })
    }
}

// Sets the values in the modal settings inputs.
const setSettingsValues = (_valueSample, _valueNumber, _valueImu, _valueExample, flag) =>{
    // Inputs
    let sample_rate = document.querySelector('#sampleRate');
    let number_rate = document.querySelector('#numberRate');
    let imu_rate = document.querySelector('#imuRate');

    sample_rate.value = _valueSample;
    number_rate.value = _valueNumber;
    imu_rate.value = _valueImu;

    for(let i = 0; i < document.querySelectorAll('.form-group input').length; i++){
        document.querySelectorAll('.form-group input')[i].disabled = flag
    }

    for(let i = 0; i < document.querySelectorAll('.form-group select').length; i++){
        document.querySelectorAll('.form-group select')[i].disabled = flag
    }
}

sampleRate.addEventListener('change', function(){

    if(this.value < 1 || this.value === undefined){
        this.value = 1
    }

    var _minData = 60;
    var _formule = this.value * _minData;

    imuRate.value = Math.round(_formule)
})

imuRate.addEventListener('change', function(){
    if(this.value < 60 || this.value === undefined)
        this.value = 60
    
    const _time = parseInt(numberRateMeasure.value) ? 1 : 1000;

    var _formule = (imuRate.value * (numberRate.value/_time)) / 60;
    
    sampleRate.value = _formule % 1 === 0 ? _formule :_formule.toFixed(1);
})

numberRate.addEventListener('change', function(){
    var _min = numberRateMeasure.value ? 1 : 100

    if(this.value < _min || this.value === undefined)
        this.value = _min

    const _time = parseInt(numberRateMeasure.value) ? 1 : 1000;

    var _formule = (imuRate.value * (numberRate.value/_time)) / 60;
        
    sampleRate.value = _formule % 1 === 0 ? _formule :_formule.toFixed(1);
})

numberRateMeasure.addEventListener('change', function(){

    numberRate.value = parseInt(this.value) ? 1 : 100
    numberRate.setAttribute('min',numberRate.value);
    
    const e = new Event("change");
    imuRate.dispatchEvent(e);
})

// Save settings.
btnSaveSettings.addEventListener('click', () => {    
    var sample = parseInt(sampleRateMeasure.value) ? (sampleRate.value * 60) * 60000 : sampleRate.value * 60000;
    var number = parseInt(numberRateMeasure.value) ? numberRate.value * 1000 : numberRate.value


    var _response = readFile(_path + "\\info.json")

    switch(_response.Estado){
        case 'OK':  _settings = {sample_rate: sample, number_rate: parseInt(number), imu_rate: parseInt(imuRate.value)}
                    var _content = _response.Contenido;
                    _content['settings'] = _settings;
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
            svg.style.transform = 'rotate(0deg)'
        }else{
            _sibling.classList.add('d-none')
            svg.style.transform = 'rotate(180deg)'
        }

    })
})

// Search devices.
// searchDevicesBtn.addEventListener('click', async () =>{
//     searchDevicesBtn.classList.add('d-none')

//     var _searched = document.querySelector('.searched')
//     _searched.innerHTML = '';

//     var _founded = document.createElement('p');
//     _founded.classList.add('color-description','d-none', 'mx-3', 'mt-4','mb-0')

//     _searched.appendChild(_founded)

//     var _div = searchDevicesBtn.parentNode.parentNode.querySelector('.d-flex');
//     _div.classList.remove('d-none')

//     var _loading = searchDevicesBtn.parentNode.parentNode.querySelector('.loading');
//     _loading.style.animation = 'rotating 2s linear infinite';

//     var _cont = 0;

//     for(let i = 0; i < 4; i++){
//         await sleep(500)
//         const _address = '192.212.100.' + i

//         var _sub = document.createElement('div');
//         _sub.setAttribute('data-mac', _address)
//         _sub.setAttribute('data-bs-toggle',"modal")
//         _sub.setAttribute('data-bs-target',"#linkModal")
    
//         var _p = document.createElement('p');
//         _p.innerText = 'MAC Address: ' + _sub.getAttribute('data-mac')
//         _p.setAttribute('title', _p.innerText)

//         _sub.appendChild(_p)
//         // Display the element in founded zone.
//         if(!_devices || !(_address in _devices)){
//             _sub.classList.add('founded')
//             _searched.appendChild(_sub)
//             setAddress()
//             _cont++;
//             displayLinked(_devices)
//         }
//     }

//     _div.classList.add('d-none')
//     _founded.classList.remove('d-none')
//     _founded.innerText = 'Encontrados: ' + _cont;
//     searchDevicesBtn.classList.remove('d-none')
//     _loading.style.animation = '';

// });

// Link event.

linkBtn.addEventListener('click', async () => {
    var _address = document.querySelector('#_deviceMac').value;
    var _name = document.querySelector('#_deviceName').value;

    if(_name && _address){
        linkBtn.parentNode.parentNode.parentNode.classList.add('d-none')
        linkBtn.parentNode.parentNode.parentNode.nextElementSibling.classList.remove('d-none')
        linkBtn.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('p').innerText = 'Espera a que el dispositivo se vincule con el proyecto.';

        var color = pickColor()

        var _device = new Device(_address, null, null, _hexColors[color], color + 1, _name)

        await sleep(1500)

        const _linkResponse = _master.setNewDevice(_address,_device)

        if(!_linkResponse.includes('Se agrego correctamente')){
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
    
            storeFile(_path + "\\info.json", _response.Contenido)
            _devices = _response.Contenido.devices
            displayChannels(_response.Contenido.devices)
            displayGraphs(_response.Contenido.devices);
            displayLinked()
            show('success', 'Dispositivo vinculado correctamente.')
        }else{
            show('error', 'Hubo un error en la vinculación.')
        }
       

        linkClose.click()

        // Restore animation modal
        linkBtn.parentNode.parentNode.parentNode.classList.remove('d-none')
        linkBtn.parentNode.parentNode.parentNode.nextElementSibling.classList.add('d-none')
        linkBtn.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('p').innerText = 'Presiona el botón para empezar la vinculación del dispositivo.';
        console.log(_master)
    }else{
        if(!_name){
            document.querySelector('#errorName').innerText = 'Este campo es obligatorio';
        }else{
            document.querySelector('#errorName').innerText = '';
        }

        if(!_address){
            document.querySelector('#errorMac').innerText = 'Este campo es obligatorio';
        }else{
            document.querySelector('#errorMac').innerText = '';
        }
    }
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

// Show/Hide toggle menu.
document.onkeyup = function () {
    var e = e || window.event; // for IE to cover IEs window event-object
    let toggleMenu = document.querySelector('.toggle-menu')

    if(e.ctrlKey && e.which == 68) { //Press CTRL + D
        if(!toggleMenuFlag){
            toggleMenu.style.width = '60px'
            toggleMenuFlag = 1
        }else{
            toggleMenu.style.width = '0px'
            toggleMenuFlag = 0
        }

      return false;
    }
}

// Toggle menu button
_toggleMenu.addEventListener('click', () =>{
    let toggleMenu = document.querySelector('.toggle-menu')

    if(!toggleMenuFlag){
        toggleMenu.style.width = '60px'
        toggleMenuFlag = 1
    }else{
        toggleMenu.style.width = '0px'
        toggleMenuFlag = 0
    }

    return false;
})

function saveData(){
    var _graphs = document.querySelectorAll('.main-graph-container');
    var map = new Map();
    // var data_main = {'labels': null, 'data': null}, data_gyro =  {'labels': null, 'data': null}, data_accelerometer =  {'labels': null, 'data': null};

    _graphs.forEach(element => {
        var data_main = {'labels': null, 'data': null}, data_gyro =  {'labels': null, 'data': null}, data_accelerometer =  {'labels': null, 'data': null};

        var _device = element.getAttribute('data-device')

        var tmp = _chartsMap.get(`${_device}-main`)
        data_main.labels = tmp.chart.data.labels
        data_main.data = tmp.chart.data.datasets


        tmp = _chartsMap.get(`${_device}-accelerometer`)
        data_accelerometer.labels = tmp.chart.data.labels
        data_accelerometer.data = tmp.chart.data.datasets
        
        tmp = _chartsMap.get(`${_device}-gyroscope`)
        data_gyro.labels = tmp.chart.data.labels
        data_gyro.data = tmp.chart.data.datasets

        map.set(_device, {'main': data_main, 'accelerometer': data_accelerometer, 'gyroscope': data_gyro})
    })

    var date = new Date () 
    var localDate = date.getFullYear() + '_' + ('0' + (date.getMonth()+1)).slice(-2) + '_' + ('0' + date.getDate()).slice(-2);
    var localHour = date.getHours() + '_' + ('0' + date.getMinutes()).slice(-2)
    var meridian = date.getHours() > 12 ? 'PM' : 'AM'
    var name = localDate + localHour + meridian

    var _fileTest = new FileTest(name, name, Object.fromEntries(map))   

    storeFile(_path + '\\Data\\' + name + '.json', _fileTest.JSON)
}

document.querySelectorAll('.toggle-menu div').forEach(element => {
    element.addEventListener('click', function(){        
        if(document.querySelector('.toggle-icon-pressed')){

            if(document.querySelector('.toggle-icon-pressed').getAttribute('id') === 'devicesBtn'){
                
                // document.querySelector('.vinculados').click()

                document.querySelector('.vinculados .arrow-svg').style.transform = 'rotate(0deg)'
                document.querySelector('.vinculados').nextElementSibling.classList.add('d-none')
                document.querySelector('.vinculados').classList.add('d-none')
            }

            document.querySelector('.toggle-icon-pressed').classList.remove('toggle-icon-pressed')
        }
        
        this.classList.add('toggle-icon-pressed')
    })
})

pdfModal.addEventListener('hidden.bs.modal', function(){
    cleanToggle()
})

fileExplorer.addEventListener('hidden.bs.modal', function(){
    document.querySelector('.waiting').classList.remove('d-none');
    document.querySelector('.table-responsive').classList.add('d-none');
    document.querySelector('.images-responsive').classList.add('d-none');
    document.querySelector('.non-result').classList.add('d-none');

    cleanToggle();
})

fileExplorer.addEventListener('shown.bs.modal', function(){
    _filesData =  readDataFolder(_path + '\\Data');

    if(_filesData.length){
       displayListFiles(recentsValue) 

       document.querySelector('.info .elements').innerHTML = _filesData.length + ' elementos';
       document.querySelector('#fileExplorer .table-responsive').classList.remove('d-none')
       document.querySelectorAll('#fileExplorer .info svg').forEach(svg =>{
        svg.classList.remove('invisible')
       })

       updateReadables()
    }else{
        document.querySelector('#fileExplorer .non-result').classList.remove('d-none')
        document.querySelector('.info .elements').innerHTML = 0 + ' elementos';
    }

    document.querySelector('.waiting').classList.add('d-none');
})

document.querySelectorAll('#fileExplorer .files .col-2 .row').forEach(element => {
    element.addEventListener('click', function(){
        if(document.querySelector('.selected-option'))
            document.querySelector('.selected-option').classList.remove('selected-option')
        
        this.classList.add('selected-option')

        const val = parseInt(this.getAttribute('data-value'))
        const display = parseInt(document.querySelector('#fileExplorer .selected-svg').getAttribute('data-value'))
        
        if(val){
            display ? displayImageFiles() : displayListFiles()
        }else{
            display ? displayImageFiles(recentsValue) : displayListFiles(recentsValue)
        }
    });
})

document.querySelectorAll('#fileExplorer .info svg').forEach(element => {
    element.addEventListener('click', function(){
        if(document.querySelector('.selected-svg'))
            document.querySelector('.selected-svg').classList.remove('selected-svg')
        
        this.classList.add('selected-svg')

        const val = parseInt(this.getAttribute('data-value'))
        const display = parseInt(document.querySelector('#fileExplorer .selected-option').getAttribute('data-value'))

        switch(val){
            case 0: zone = document.querySelector('.table-responsive').classList.remove('d-none')
                    document.querySelector('.images-responsive').classList.add('d-none')
                    display ? displayListFiles() : displayListFiles(recentsValue)
                break;
            case 1: zone = document.querySelector('.images-responsive').classList.remove('d-none')
                    document.querySelector('.table-responsive').classList.add('d-none')
                    display ? displayImageFiles() : displayImageFiles(recentsValue)
                break;
        }

        updateReadables()
    });
})

function displayListFiles(limit){
    let tbody = document.querySelector('#fileExplorer table tbody')
    tbody.innerHTML = '';
    let arrTmp = [];

    limit ? arrTmp = _filesData.slice(limit) : arrTmp = _filesData    

    arrTmp.forEach(_file =>{
        var _tr = document.createElement('tr');
        _tr.classList.add('readable')
        _tr.setAttribute('title', _file.name)

        var _td = document.createElement('td');
        _td.innerText = _file.name

        _tr.appendChild(_td)

        _td = document.createElement('td');
        _td.innerText = _file.updated_time;

        _tr.appendChild(_td)

        _td = document.createElement('td');
        _td.innerText = 'Archivo ' + _file.type;

        _tr.appendChild(_td)

        _td = document.createElement('td');
        _td.innerText = _file.size + ' KB'

        _tr.appendChild(_td)

        tbody.appendChild(_tr)
    })
}

function displayImageFiles(limit){
    let body = document.querySelector('#fileExplorer .images-responsive')
    body.innerHTML = ''

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-filetype-json" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM4.151 15.29a1.176 1.176 0 0 1-.111-.449h.764a.578.578 0 0 0 .255.384c.07.049.154.087.25.114.095.028.201.041.319.041.164 0 .301-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .084-.29.387.387 0 0 0-.152-.326c-.101-.08-.256-.144-.463-.193l-.618-.143a1.72 1.72 0 0 1-.539-.214 1.001 1.001 0 0 1-.352-.367 1.068 1.068 0 0 1-.123-.524c0-.244.064-.457.19-.639.128-.181.304-.322.528-.422.225-.1.484-.149.777-.149.304 0 .564.05.779.152.217.102.384.239.5.41.12.17.186.359.2.566h-.75a.56.56 0 0 0-.12-.258.624.624 0 0 0-.246-.181.923.923 0 0 0-.37-.068c-.216 0-.387.05-.512.152a.472.472 0 0 0-.185.384c0 .121.048.22.144.3a.97.97 0 0 0 .404.175l.621.143c.217.05.406.12.566.211a1 1 0 0 1 .375.358c.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Zm-3.104-.033a1.32 1.32 0 0 1-.082-.466h.764a.576.576 0 0 0 .074.27.499.499 0 0 0 .454.246c.19 0 .33-.055.422-.164.091-.11.137-.265.137-.466v-2.745h.791v2.725c0 .44-.119.774-.357 1.005-.237.23-.565.345-.985.345a1.59 1.59 0 0 1-.568-.094 1.145 1.145 0 0 1-.407-.266 1.14 1.14 0 0 1-.243-.39Zm9.091-1.585v.522c0 .256-.039.47-.117.641a.862.862 0 0 1-.322.387.877.877 0 0 1-.47.126.883.883 0 0 1-.47-.126.87.87 0 0 1-.32-.387 1.55 1.55 0 0 1-.117-.641v-.522c0-.258.039-.471.117-.641a.87.87 0 0 1 .32-.387.868.868 0 0 1 .47-.129c.177 0 .333.043.47.129a.862.862 0 0 1 .322.387c.078.17.117.383.117.641Zm.803.519v-.513c0-.377-.069-.701-.205-.973a1.46 1.46 0 0 0-.59-.63c-.253-.146-.559-.22-.916-.22-.356 0-.662.074-.92.22a1.441 1.441 0 0 0-.589.628c-.137.271-.205.596-.205.975v.513c0 .375.068.699.205.973.137.271.333.48.589.626.258.145.564.217.92.217.357 0 .663-.072.917-.217.256-.146.452-.355.589-.626.136-.274.205-.598.205-.973Zm1.29-.935v2.675h-.746v-3.999h.662l1.752 2.66h.032v-2.66h.75v4h-.656l-1.761-2.676h-.032Z"/>
                </svg>`

    let arrTmp = [];

    limit ? arrTmp = _filesData.slice(limit) : arrTmp = _filesData    

    arrTmp.forEach(file => {
        let div = document.createElement('div')
        div.classList.add('card-file', 'd-flex-column', 'align-items-center', 'justify-content-center','readable')
        div.setAttribute('title', file.name)

        div.innerHTML+= svg

        let p = document.createElement('p');
        p.classList.add('text-center')
        p.innerHTML = file.name;

        div.appendChild(p)

        body.appendChild(div)
    });

}

function updateReadables(){
    var _readables = document.querySelectorAll('.readable');

    _readables.forEach(element =>{
        element.addEventListener('click', function(){
            const _nameFile = this.getAttribute('title');

            const _response = readFile(_path + '\\Data\\' + _nameFile)

            if(_response.Estado === 'OK'){
                var _content = _response.Contenido.data;

                // Gets all the main charts.
                var _mainCharts = document.querySelectorAll('.main-graph-container');
                createCharts(_mainCharts)

                var keys = Object.keys(_content)

                keys.forEach(key =>{
                    var main = _chartsMap.get(`${key}-main`);
                    var accelerometer = _chartsMap.get(`${key}-accelerometer`);
                    var gyroscope = _chartsMap.get(`${key}-gyroscope`);

                    main.values[0] = _content[key].main.data[0].data;
                    main.labels = _content[key].main.labels;

                    accelerometer.values[0] = _content[key].accelerometer.data[0].data
                    accelerometer.values[1] = _content[key].accelerometer.data[1].data
                    accelerometer.values[2] = _content[key].accelerometer.data[2].data
                    accelerometer.labels = _content[key].accelerometer.labels;

                    gyroscope.values[0] = _content[key].gyroscope.data[0].data
                    gyroscope.values[1] = _content[key].gyroscope.data[1].data
                    gyroscope.values[2] = _content[key].gyroscope.data[2].data
                    gyroscope.labels = _content[key].gyroscope.labels;


                    reDrawChart(main)
                    reDrawChart(accelerometer)
                    reDrawChart(gyroscope)
                    
                })

                document.querySelector('#fileExplorer .modal-header button').click()
                show('success', 'Archivo extraído correctamente.');

            }else{
                show('error','Hubo un problema al abrir el archivo.');
            }
        })
    })
}

linkModal.addEventListener('hidden.bs.modal', function(){
    document.querySelector('#_deviceMac').value = '';
    document.querySelector('#_deviceName').value = '';

    document.querySelector('#errorName').innerText = '';
    document.querySelector('#errorMac').innerText = '';
})

const cleanToggle = () =>{
    document.querySelector('.toggle-icon-pressed').classList.remove('toggle-icon-pressed')
}

pongBtn.addEventListener('click', () =>{
    ipc.send('startPong');
})

devicesBtn.addEventListener('click', () =>{
    var tmp = document.querySelector('.vinculados');
    tmp.nextElementSibling.classList.remove('d-none')
    tmp.classList.contains('d-none') ? tmp.classList.remove('d-none') : tmp.classList.add('d-none')
})

ipc.on('usb-event', (e, msg)=>{ 
    if(msg.action === 'connected'){
        document.querySelector('#main-notification .btn-clse').click()
        readInfo(_title)
    }else{
        document.querySelector('.hd-close').click()
        stopAll('click',1)
    }
})
