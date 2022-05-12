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
    var date = new Date();
    var localDate = date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    var localHour = date.getHours() + ':' + date.getMinutes() + ':' + date.getMilliseconds()
    var formData = new FormData();


    date = localDate + ' ' + localHour; //Local time.

    formData.append('name',document.querySelector('#name').value) //Project's name
    formData.append('comments',document.querySelector('#comments').value) //Project's comments
    formData.append('created_at',date) //Created time. 
    
    console.log(_proyectos)
})