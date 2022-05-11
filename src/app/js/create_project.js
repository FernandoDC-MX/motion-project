const { ipcRenderer } = require('electron')
const ipc = ipcRenderer

// Close App
closeBtn.addEventListener('click', ()=>{
    ipc.send('closeCreateProject')
})