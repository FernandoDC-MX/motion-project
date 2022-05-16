// Read files
const fs = require('fs');

let _flag_order_date = 0;
let _flag_order_name = 0;
let _proyectos = [];

// Close App
closeBtn.addEventListener('click', ()=>{
    ipc.send('closeApp')
})

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
    // const response = readFile('src/app/proyectos.json')
    fs.readdir(
        'src/app/Proyectos',
        (err, files) => {
          if (err) throw err;
          
          for (let file of files) {
             var x = readFile(`src\\app\\Proyectos\\${file}\\info.json`)
             _proyectos.push(x.Contenido)
          }
          displayProyectos(0)
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

    console.log(_sorted_array)
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
