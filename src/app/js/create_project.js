const { ipcRenderer } = require('electron')
const ipc = ipcRenderer
const fs = require('fs');

let _proyectos_local;

class Project{
    constructor( id, name, created_at, comments, path){
        this.id = id;
        this.name = name;
        this.created_at = created_at;
        this.comments = comments;
        this.path = path
    }

    get JSON(){
        return {
                "id": this.id,
                "name": this.name,
                "comments": this.comments,
                "created_at": this.date,
                "path": this.path
            }
    }
}




cancelBtn.addEventListener('click', ()=>{
    ipc.send('closeCreateProject')
})

function storeLocalProjects(proyectos){
    _proyectos_local = proyectos;
}

createBtn.addEventListener('click', ()=>{
    var name = document.querySelector('#name').value;
    var path = `${__dirname}\\Proyectos\\${name}`

    // Se crea la carpeta 
    if (!fs.existsSync(path)){
        fs.mkdirSync(path, { recursive: true });

        var date = new Date();
        var localDate = date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        var localHour = date.getHours() + ':' + date.getMinutes() + ':' + date.getMilliseconds()
        var id = Math.floor(Math.random() * 1000) + Date.now()
        var comments = document.querySelector('#comments').value;
        date = localDate + ' ' + localHour; //Local time.

        var new_proyect = new Project(id, name, date, comments, path)

        fs.writeFileSync(path + '\\info.json', JSON.stringify(new_proyect.JSON))
        
        _proyectos_local.push(new_proyect.JSON)

        console.log('inde')
    }

})