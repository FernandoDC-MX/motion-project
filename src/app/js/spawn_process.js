const { spawn } = require('child_process');

let buffer = []
let nMaxIterations = 50;
let nRefresh = 1000;
let iterator = 0;

process.on('message', (args) => {
    switch(args.action){
        case 'play': playTest(args.id, args.com);
            break;
        case 'stop': stopTest(args.id, args.com);
            break;
        case 'get': getLastData();
            break;
    }
})

const playTest = (_id, com) =>{
    buffer = []
    const child = spawn(__dirname + '\\main.exe', ['STR', _id, com, nRefresh, nMaxIterations]);

	child.stdout.on('data', (data) => {
        let _data = JSON.parse(data);

        if(_data.edo_con){
            process.send({'stdout':_data})
            fillBuffer(_id, com);
        }
        else{
            process.send({'action': 'stop'})
        }
	});

	child.stderr.on('data', (data) => {
        process.send({'stderr':data})
	});

	child.on('error', (error) => {
        process.send({'error':error.message})
	});

	child.on('close', (code) => {
        process.send({'close': 'Saliendo de play: ' + code})
	});
}

const stopTest = (_id, com) =>{
    const child = spawn(__dirname + '\\main.exe', ['STP', _id, com]);

    child.stdout.on('data', (data) => {
        let _data = JSON.parse(data)

        process.send({'stdout':_data})

        iterator = nMaxIterations;
    });

    child.stderr.on('data', (data) => {
        process.send({'stderr':data})
    });

    child.on('error', (error) => {
        process.send({'error':error.message})
    });

    child.on('close', (code) => {
        process.send({'close': 'Saliendo de stop: ' + code})
    });
}


const fillBuffer = async (_id, com) =>{
    iterator = 0;

    while(iterator < nMaxIterations){
        const child = spawn(__dirname + '\\main.exe', ['DAT', _id, com]);

        child.stdout.on('data', (data) => {
            if(!data.toString().includes('ERROR')){
                let cleanData = data.toString().replaceAll('\\r\\n','').split('-');
                let lastData = JSON.parse(cleanData[cleanData.length - 1])

                if(!lastData.hasOwnProperty('resp_cmd')){
                    buffer.push(lastData)
                    process.send({'stdout':buffer, 'last': lastData})
                }
            }
        });

        child.stderr.on('data', (data) => {
            process.send({'stderr':data})
        });

        child.on('error', (error) => {
            process.send({'error':error.message})
        });

        // child.on('close', (code) => {
        //     process.send({'close': 'Saliendo de fill: ' + code})
        // });

        iterator++;

        await sleep(nRefresh)
    }
}

const getLastData = () =>{
    process.send({'lastData': buffer[buffer.length - 1]})
}



// Delay functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
