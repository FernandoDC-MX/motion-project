const { ipcRenderer } = require('electron')
const maxResBtn = document.getElementById('maximizeBtn')
const ipc = ipcRenderer

// Read files
const fs = require('fs');

let _flag_order = 0;

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
    readProyects()
}

function readProyects(){
    const response = readFile('src/app/proyectos.json')

    switch(response.Estado){
        case 'OK': displayProyectos(response.Contenido)
            break;
        case 'ERROR': alert('ERROR')
            break;
    }
}

// Sort the data in ascending way.
function sortByDateAsc(a, b) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

// Sort the data in descending way.
function sortByDateDesc(a, b) {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

// Display projects on DOM.
function displayProyectos(proyectos){
    // Sort the data.
    let _sorted_array;

    switch(_flag_order){
        case 0: _sorted_array = proyectos.sort(sortByDateDesc);
            break;
        case 1: _sorted_array = proyectos.sort(sortByDateAsc);
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
        _td.innerText = element.nombre;

        // Append the column name.
        _tr.appendChild(_td);

        // Create the column date.
        _td = document.createElement('td');
        _td.innerText = element.created_at;

        // Append the column date.
        _tr.appendChild(_td);

        _body.appendChild(_tr)
    });

    
}

_order_date.addEventListener('click', ()=>{
    // (_flag_order) ? _flag_order = 0 : _flag_order = 1
    if(_flag_order){
        document.querySelector('#_order_date').style.transform = "rotate(180deg)"
        _flag_order = 0;
    }else{
        document.querySelector('#_order_date').style.transform = "rotate(0deg)"
        _flag_order = 1;
    }
    
    readProyects()
})

// Close App
closeBtn.addEventListener('click', ()=>{
    ipc.send('closeApp')
})

// Minimize App
minimizeBtn.addEventListener('click', ()=>{
    ipc.send('minimizeApp')
})

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
