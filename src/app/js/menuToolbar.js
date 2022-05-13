const { ipcRenderer } = require('electron')
const maxResBtn = document.getElementById('maximizeBtn')
const ipc = ipcRenderer

// Minimize App
minimizeBtn.addEventListener('click', ()=>{
    ipc.send('minimizeApp')
})

// Maximize App
maximizeBtn.addEventListener('click', () =>{
    ipc.send('maximizeRestoreApp')
})

function changeMaximizeBtn(isMaximized){
    if(isMaximized){
        maxResBtn.title = 'Restore'
        maxResBtn.classList.remove('maximizeBtn');
        maxResBtn.classList.add('restoreBtn');
    }else{
        maxResBtn.title = 'Maximize'
        maxResBtn.classList.remove('restoreBtn');
        maxResBtn.classList.add('maximizeBtn');
    }
}

ipc.on('isMaximized', ()=>{ changeMaximizeBtn(true) })
ipc.on('isRestored', ()=>{ changeMaximizeBtn(false) })


