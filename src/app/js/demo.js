const _nTimes = 1; //Times to iterate the loop.
const max = 100; // Max value
const min = 1; // Min value
let iterator;

process.on('message', async (msg)=>{
    if(msg.play){
        for (iterator = msg.iterator; iterator < _nTimes; iterator++) {
            // Sending data to the main chart
            var randomNumber = Math.floor(Math.random() * (max - min)) + min;
    
            process.send({
                chart:'main', 
                data:[randomNumber],
                label: iterator,  
                device: msg.id_zone, 
                flag: 0
            })
    
            // Sending data to the accelerometer chart
            var _num1 = Math.floor(Math.random() * (max - min)) + min;
            var _num2 = Math.floor(Math.random() * (max - min)) + min;
            var _num3 = Math.floor(Math.random() * (max - min)) + min;
    
            process.send({
                chart: 'accelerometer', 
                data: [_num1, _num2, _num3],
                label: iterator,   
                device: msg.id_zone,  
                flag: 0
            })
            
            // Sending data to the gyro chart
            var _num1 = Math.floor(Math.random() * (max - min)) + min;
            var _num2 = Math.floor(Math.random() * (max - min)) + min;
            var _num3 = Math.floor(Math.random() * (max - min)) + min;
    
            process.send({
                chart:'gyroscope', 
                data: [_num1, _num2, _num3],
                label: iterator,  
                device:msg.id_zone, 
                flag: 0
            })
    
            await sleep(250);
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
