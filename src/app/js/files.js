// Read files
const fs = require('fs');
const path = require('path')
let z = 0;


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

function storeData(__path, _data, filename){
    fs.writeFile(__path + filename + '.json', JSON.stringify(_data), { flag: 'wx' }, function(err){
        if(err){
            z++;

            if(filename.indexOf('(') > -1){
                filename = filename.substring(0, filename.indexOf('('))
            }
            
            storeData(`${__path}`, _data, `${filename}(${z})`);
        }
    })
        
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

function deleteFolder(_path){
    fs.rmSync(_path, { recursive: true, force: true });
}

function infoFile(file){
    return  fs.statSync(file)
}

function renameFolder(_dir, oldName, newName){
    try{
        fs.renameSync(`${_dir}\\${oldName}`, `${_dir}\\${newName}`)
        console.log("Successfully renamed the directory.")
    }catch(err) {
        console.log(err)
    }
}