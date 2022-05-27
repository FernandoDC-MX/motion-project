// Read files
const fs = require('fs');

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

function readFiles(path){
    return fs.readdirSync(path)
}

function storeFile(_path, _data){
    fs.writeFileSync(_path, JSON.stringify(_data))
    
    return _data;
}
