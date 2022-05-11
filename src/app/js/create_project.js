const { ipcRenderer } = require('electron')
const ipc = ipcRenderer
let _proyectos_local;

// Close App
closeBtn.addEventListener('click', ()=>{
    ipc.send('closeCreateProject')
})

cancelBtn.addEventListener('click', ()=>{
    ipc.send('closeCreateProject')
})


ipc.on('enviar-proyectos', (e, _proyectos)=>{ storeLocalProjects(_proyectos)})

function storeLocalProjects(proyectos){
    _proyectos_local = proyectos;
}

createBtn.addEventListener('click', ()=>{
    let form = document.forms._form_project
    console.log(form)
})