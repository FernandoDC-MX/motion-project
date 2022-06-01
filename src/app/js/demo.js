process.on('message', (msg)=>{
    console.log(msg)
    process.send(msg.pid)
})