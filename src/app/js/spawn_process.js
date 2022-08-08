const { execSync } = require('child_process');

let buffer = []
let nMaxIterations = 20000;
let nRefresh = 100;
let iterator = 0;

process.on('message', (args) => {
    switch(args.action){
        case 'init': initGame(args.id, args.com);
            break;
        case 'play': playTest(args.id, args.com);
            break;
        case 'stop': stopTest(args.id, args.com);
            break;
    }
})

const initGame = (_id, com) => {
    if(stopTest(_id,com)){
        if(playTest(_id,com)){
            if(stopTest(_id,com)){
                process.send({response: 1, message: 'Configuración inicial completada', function: 'initGame', action: 'continue'});
            }else{
                process.send({response: 0, message: 'Hubo un problema al parar la prueba en stopTest final',function: 'initGame', action: 'failed'});
            }
        }else{
            process.send({response: 0, message: 'Hubo un problema al reproducir la prueba en playTest', function: 'initGame', action: 'failed'});
        }
    }else{
        process.send({response: 0, message: 'Hubo un problema al parar la prueba en stopTest inicial',function: 'initGame', action: 'failed'});
    }
}

const playTest = (_id, com) =>{
    buffer = []

    let response = execSync(`${__dirname}\\main.exe STR ${_id} ${com} ${nRefresh} ${nMaxIterations}`).toString();

    // Si no existe un error en el puerto.
    if(!response.includes('ERROR')){

        let res = JSON.parse(response);

        if(res.edo_con){
            fillBuffer(_id, com);
            process.send({response: res.edo_con, message: res, action: 'play', function: 'playTest'})
        }else{
            process.send({response: res.edo_con, message: res, action: 'stop', function: 'playTest'})
        } 

        return res.edo_con;
        
    }else{ //Se manda un error.
        process.send({response: 0, message: res, action: 'stop', function: 'playTest'})
        return 0;
    }

    
}

const stopTest = (_id, com) =>{
    buffer = [];

    let response = execSync(`${__dirname}\\main.exe STP ${_id} ${com}`).toString();
     // Si no existe un error en el puerto.
     if(!response.includes('ERROR')){
        let res = JSON.parse(response);

        if(res.edo_con){
            process.send({response: res.edo_con, message: res, action: 'play', function: 'stopTest'})
        }else{
            process.send({response: res.edo_con, message: res, action: 'loop', function: 'stopTest'})
        }        

        iterator = nMaxIterations;

        return res.edo_con;
    }else{ //Se manda un error.
        process.send({response: 0, message: res, action: 'loop', function: 'stopTest'})

        iterator = nMaxIterations;

        return 0;
    }

}


const fillBuffer = async (_id, com) =>{
    iterator = 0;

    while(iterator < nMaxIterations){
        let response = execSync(`${__dirname}\\main.exe DAT ${_id} ${com}`).toString();

        if(!response.includes('ERROR')){
            process.send({'buffer': response})
            
            let cleanData = response.replaceAll('\r\n','').split('-');

            let lastData = JSON.parse(cleanData[cleanData.length - 1])

            if(!lastData.hasOwnProperty('resp_cmd')){
                buffer.push(lastData)
                process.send({'last': lastData.myo, 'action': 'movement'})
            }
        }

        iterator++;

        await sleep(nRefresh)
    }
}

// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
