
let _flag_order_date = 0;
let _flag_order_name = 0;
let _proyectos = [];
const maxResBtn = document.getElementById('maximizeBtn')
var projects = document.querySelectorAll('.project')
const exec = require("child_process").exec;
const { ipcRenderer } = require('electron')
const ipc = ipcRenderer

// Close App
closeBtn.addEventListener('click', ()=>{
    ipc.send('closeApp')
})

// Minimize App
minimizeBtn.addEventListener('click', () =>{
    ipc.send('minimizeApp')
})

// Update Projects 
ipc.on('read-projects', () =>{ readProjects()})

// Function to read a file and return its content.
function readFile(path){
    try{
        let rawData = fs.readFileSync(path);
        let cleanData = JSON.parse(rawData);

        return { 
            "Estado": 'OK',
            "Mensaje": 'El archivo fue extraído correctamente',
            "Contenido": cleanData,
            "Error": null
        };
    }catch(error){

        return { 
            "Estado": 'ERROR',
            "Mensaje": 'Hubo un problema al tratar de extraer el contenido del archivo' + path + '.',
            "Contenido": null,
            "Error": error
        };
    }
}

window.onload = function(){
    readProjects()
}

function readProjects(){
    _proyectos = []

    fs.readdir(
        __dirname + '\\Proyectos',
        (err, files) => {
          if (err) throw err;
          
          for (let file of files) {
             var x = readFile(__dirname + `\\Proyectos\\${file}\\info.json`)
             _proyectos.push(x.Contenido)
          }
          if(_proyectos.length){
            _openProject.classList.remove('d-none')
            document.querySelector('#_container_table .table').classList.remove('d-none')
            document.querySelector('#_container_table div').classList.add('d-none')
          }
          displayProyectos(0)
          update_projects();
        }
      );

}

// Sort the data in ascending way.
function sortByDateAsc(a, b) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

// Sort the data in descending way.
function sortByDateDesc(a, b) {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

// Sort the data in ascending way.
function sortByNameAsc(a, b) {
    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }

    // names must be equal
    return 0;
}

// Sort the data in descending way.
function sortByNameDesc(a, b) {
    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA > nameB) {
        return -1;
    }
    if (nameA < nameB) {
        return 1;
    }

    // names must be equal
    return 0;
}

// Display projects on DOM.
function displayProyectos(filter){
    // Sort the data.
    let _sorted_array;

    if(!filter)
        switch(_flag_order_date){
            case 0: _sorted_array = _proyectos.sort(sortByDateDesc);
                break;
            case 1: _sorted_array = _proyectos.sort(sortByDateAsc);
                break;
        }
    else
        switch(_flag_order_name){
            case 0: _sorted_array = _proyectos.sort(sortByNameDesc);
                break;
            case 1: _sorted_array = _proyectos.sort(sortByNameAsc);
                break;
        }

    let _body =  document.getElementById('_table_projects');
    _body.innerHTML = '';

    _sorted_array.forEach(element => {
        // Row in table.
        let _tr = document.createElement('tr');

        // Create the column name.
        let _td = document.createElement('td');
        _td.setAttribute('scope','row');
        _td.innerText = element.name;

        // Append the column name.
        _tr.appendChild(_td);

        // Create the column date.
        _td = document.createElement('td');
        _td.innerText = element.created_at;

        // Append the column date.
        _tr.appendChild(_td);
        _tr.classList.add('project')
        _tr.setAttribute('data-id', element.name)

        _body.appendChild(_tr)
    });

}

_order_date.addEventListener('click', ()=>{
    // (_flag_order_date) ? _flag_order_date = 0 : _flag_order_date = 1
    if(!_flag_order_date){
        document.querySelector('#_order_date').style.transform = "rotate(180deg)"
        _flag_order_date = 1;
    }else{
        document.querySelector('#_order_date').style.transform = "rotate(0deg)"
        _flag_order_date = 0;
    }
    
    displayProyectos(0)
})

_order_name.addEventListener('click', ()=>{
    // (_flag_order_date) ? _flag_order_date = 0 : _flag_order_date = 1
    if(!_flag_order_name){
        document.querySelector('#_order_name').style.transform = "rotate(180deg)"
        _flag_order_name = 1;
    }else{
        document.querySelector('#_order_name').style.transform = "rotate(0deg)"
        _flag_order_name = 0;
    }
    
    displayProyectos(1)
})

function update_projects(){
    projects = document.querySelectorAll('.project')

    for(let i = 0; i < projects.length; i++) {
        projects[i].addEventListener("click", function(){
            ipc.send('openProject', projects[i].getAttribute('data-id'))
        });
    }
}

fileExplorer.addEventListener('shown.bs.modal', readAllProjects)

function readAllProjects(){
    var _pathProjects = path.resolve("src","app","Proyectos");

    const arrFiles = readFiles(_pathProjects);

    if(arrFiles.length){
        let elementZone = document.querySelector('#fileExplorer .modal-body')
        elementZone.innerHTML = '';

        arrFiles.forEach(element =>{
            const information = readFile(`${_pathProjects}\\${element}\\info.json`)
            
            if(information.Estado === 'OK'){
                const _div = document.createElement('div');
                _div.classList.add('project-element', 'py-3', 'px-4','project')
                _div.setAttribute('data-id', element)

                const _flex = document.createElement('div');
                _flex.classList.add('d-flex','justify-content-between');

                const h5 = document.createElement('h5');
                h5.innerText = element;

                _flex.appendChild(h5);

                const _time = document.createElement('div');

                const _dataTime = document.createElement('span')
                _dataTime.innerText = information.Contenido.created_at;

                _time.appendChild(_dataTime)

                _flex.append(_time)

                _div.appendChild(_flex)

                const _p = document.createElement('p');
                _p.classList.add('my-2', 'font-rubik');

                _p.innerText = information.Contenido.comments ?  information.Contenido.comments : '[Sin comentarios]'

                _div.appendChild(_p)

                elementZone.appendChild(_div)
            }
        })

        update_projects()
    }
}

// Maximize App
maximizeBtn.addEventListener('click', () =>{
    ipc.send('maximizeRestoreApp')
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

ipc.on('isMaximized', ()=>{ changeMaximizeBtn(true) })
ipc.on('isRestored', ()=>{ changeMaximizeBtn(false) })
