const { exec, execSync } = require('child_process');
const path = require('path');

let _nTimes = 1; //Times to iterate the loop.
let iterator;

// Buffer to avoid losing data.
let buffer = {
    data: [],
    labels: []
}

let path1 = path.resolve("src/app/serial", "main.exe");
const delay = 0.03

process.on('message', async (msg)=>{

    if(msg.play){
        _nTimes = msg.nTimes;
        let refresh = msg._refresh + delay;
        let resp_cmd = null;
        iterator = msg.iterator;

        while(resp_cmd != 'F'){
            let response = execSync(`${path1} DAT ${msg._device} ${msg._portCOM}`).toString();
            if(response && !response.includes('Error')){
                let cleanData = response.replaceAll('\\r\\n','').split('-');
                let lastData = JSON.parse(cleanData[cleanData.length - 1]);

                if(lastData.resp_cmd === 'F' || lastData.resp_cmd === 'P'){
                    resp_cmd = lastData.resp_cmd;

                    let x = execSync(`${path1} STP ${msg._device} ${msg._portCOM}`).toString();

                    while(x.includes('ERROR')){
                        x = execSync(`${path1} STP ${msg._device} ${msg._portCOM}`).toString();
                    }

                    console.log('Dipositivo ' + msg.id_zone + ': ', x);

                    // Send the order to kill the process.
                    process.send({id: msg.pid, flag: 1, device: msg.id_zone, iterator: iterator, cmd: resp_cmd, buffer: buffer})

                }else{
                    process.send({
                        chart:'main', 
                        data:[lastData.myo],
                        label: iterator,  
                        device: msg.id_zone, 
                        flag: 0
                    })
            
                    process.send({
                        chart: 'accelerometer', 
                        data: [lastData.ax, lastData.ay, lastData.az],
                        label: iterator,   
                        device: msg.id_zone,  
                        flag: 0
                    })
        
                    process.send({
                        chart:'gyroscope', 
                        data: [lastData.gx, lastData.gy, lastData.gz],
                        label: iterator,  
                        device:msg.id_zone, 
                        flag: 0
                    })

                    buffer.data.push(...cleanData)

                    process.send({
                        chart:'buffer', 
                        buffer: buffer,
                        device: msg.id_zone,
                        flag: 0
                    })

                    iterator++;

                }
            }
            await sleep(refresh)
        }
    }else{
        process.send({id: msg.pid, flag: 2, device: msg.id_zone, iterator: iterator, max: _nTimes})
        iterator = _nTimes;
    }    
})

// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
