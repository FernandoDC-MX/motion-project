const { exec } = require('child_process');
const path = require('path');

let _nTimes = 1; //Times to iterate the loop.
let iterator;
let local_arr = []
let path1 = path.resolve("src/app/serial", "main.exe");


process.on('message', async (msg)=>{
    if(msg.play){
        _nTimes = msg.nTimes;

        for (iterator = msg.iterator; iterator < _nTimes; iterator++) {

            exec(`${path1} DAT ${msg._device} ${msg._portCOM}`, (error, stdout, stderr) =>{
                if(!stdout.includes('ERROR')){
                    let res = stdout.replaceAll('\\r\\n','').split('-');

                    res.forEach(element => {
                        local_arr.push(JSON.parse(element));
                    });                                   
                }
            });    

            if(local_arr.length < 1)
                iterator = 0;
            else if( typeof local_arr[iterator] !== 'undefined'){
                process.send({
                    chart:'main', 
                    data:[local_arr[iterator].myo],
                    label: iterator,  
                    device: msg.id_zone, 
                    flag: 0
                })
            
                process.send({
                    chart: 'accelerometer', 
                    data: [local_arr[iterator].ax, local_arr[iterator].ay, local_arr[iterator].az],
                    label: iterator,   
                    device: msg.id_zone,  
                    flag: 0
                })
    
                process.send({
                    chart:'gyroscope', 
                    data: [local_arr[iterator].gx, local_arr[iterator].gy, local_arr[iterator].gz],
                    label: iterator,  
                    device:msg.id_zone, 
                    flag: 0
                })
            }
            await sleep(40)
        }


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
