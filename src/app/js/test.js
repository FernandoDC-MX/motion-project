const { exec, execSync } = require('child_process');
const path = require('path');

let _nTimes = 1; //Times to iterate the loop.
let iterator;
let local_arr = []
let path1 = path.resolve("src/app/serial", "main.exe");
const delay = 0.03

process.on('message', async (msg)=>{
    if(msg.play){
        _nTimes = msg.nTimes;
        let refresh = msg._refresh + delay;

        for (iterator = msg.iterator; iterator < _nTimes; iterator++) {
            let response = execSync(`${path1} DAT ${msg._device} ${msg._portCOM}`).toString();    

            console.log(iterator + ":" + response);

            if(response && !response.includes('Error')){
                let cleanData = response.replaceAll('\\r\\n','').split('-');
                let lastData = JSON.parse(cleanData[cleanData.length - 1]);

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
            }
            
            await sleep(refresh)
        }

        execSync(`${path1} STP ${msg._device} ${msg._portCOM}`);
        // Send the order to kill the process.
        process.send({id: msg.pid, flag: 1, device: msg.id_zone, iterator: iterator, max: _nTimes})
    }else{
        process.send({id: msg.pid, flag: 2, device: msg.id_zone, iterator: iterator, max: _nTimes})
        iterator = _nTimes;
    }    
})

// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
