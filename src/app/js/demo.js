process.on('message', (msg)=>{
    demo(msg)
})

// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo(msg) {
    for (let i = 0; i < 10; i++) {
        // Sending data to the main chart
        var randomNumber = Math.floor(Math.random() * (100 - 1)) + 1;

        process.send({
            chart:'main', 
            data:[randomNumber],
            label: i,  
            device: msg.id_zone, 
            flag: 0
        })

        // Sending data to the accelerometer chart
        randomNumber = Math.floor(Math.random() * (100 - 1)) + 1;
        process.send({
            chart: 'accelerometer', 
            data: [randomNumber, randomNumber-10, randomNumber-20],
            label: i,   
            device: msg.id_zone,  
            flag: 0
        })
        
        // Sending data to the gyroscope chart
        randomNumber = Math.floor(Math.random() * (100 - 1)) + 1;
        process.send({
            chart:'gyroscope', 
            data:[randomNumber, randomNumber-10, randomNumber-20], 
            label: i,  
            device:msg.id_zone, 
            flag: 0
        })

        await sleep(500);
    }

    // Send the order to kill the process.
    process.send({id: msg.pid, flag: 1})
}