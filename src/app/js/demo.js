const _nTimes = 100; //Times to iterate the loop.
const max = 100; // Max value
const min = 1; // Min value

process.on('message', (msg)=>{
    demo(msg)
})

// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo(msg) {
    for (let i = 0; i < _nTimes; i++) {
        // Sending data to the main chart
        var randomNumber = Math.floor(Math.random() * (max - min)) + min;

        process.send({
            chart:'main', 
            data:[randomNumber],
            label: i,  
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
            label: i,   
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
            label: i,  
            device:msg.id_zone, 
            flag: 0
        })

        await sleep(250);
    }

    // Send the order to kill the process.
    process.send({id: msg.pid, flag: 1, device: msg.id_zone})
}