// Read files
const fs = require('fs');
const path = require('path')


// Function to read a file and return its content.
function readFile(_path){
    try{
        let rawData = fs.readFileSync(_path);
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
            "Mensaje": 'Hubo un problema al tratar de extraer el contenido del archivo' + _path + '.',
            "Contenido": null,
            "Error": error
        };
    }
}

function readFiles(_path){
    return fs.readdirSync(_path)
}

function storeFile(__path, _data){
    fs.writeFileSync(__path, JSON.stringify(_data))
    
    return _data;
}

function readDataFolder(_path){
    let _archivos = [];

    if(fs.readdirSync(_path).length){
        fs.readdirSync(_path).forEach(file => {
            var data =  infoFile(_path + '\\' + file)
            let _json = {'name': file, 'updated_time':data.birthtime, 'type': path.extname(file), 'size': data.size}
            _archivos.push(_json)
        });

        return _archivos;
    }else{
        return 1;
    }

}


function infoFile(file){
    return  fs.statSync(file)
}