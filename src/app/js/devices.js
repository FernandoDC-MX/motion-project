class Project{
  constructor( id, name, created_at, comments, path, num_devices, distance, frequency, data, devices){
      this.id = id;
      this.name = name;
      this.created_at = created_at;
      this.comments = comments;
      this.path = path;
      this.num_devices = num_devices;
      this.distance = distance;
      this.frequency = frequency;
      this.data = data;
      this.devices = devices;
  }

  get JSON(){
      return {
              "id": this.id,
              "name": this.name,
              "comments": this.comments,
              "created_at": this.created_at,
              "path": this.path,
              "num_devices": this.num_devices,
              "distance": this.distance,
              "frequency": this.frequency,
              "data": this.data,
              "devices": this.devices
          }
  }
}

let i = 0;


function validateForm(){
  const sectionElement = document.querySelector('.active')
  var _entries_input = sectionElement.querySelectorAll('input');
  let flag = 0;

  if(_entries_input.length){
    Array.from(_entries_input).forEach(element =>{
      switch(element.id){
        case 'name': if(!element.value){
                        document.querySelector('#errorName').innerHTML = 'Este campo debe de ser llenado obligatoriamente.';
                        flag = 1;
                      }
                      else if (fs.existsSync(`${__dirname}\\Proyectos\\${element.value}`)){
                        document.querySelector('#errorName').innerHTML = 'Este nombre ya existe. Trata con otro.';
                        flag = 1;
                      }
                      else
                        document.querySelector('#errorName').innerHTML = '';
          break;
      }
    })
  }

  return flag;
}

function _cleanForm(){
  // First page.
  document.querySelector('.active').classList.add('d-none');
  document.querySelector('.active').classList.remove('active');
  document.querySelectorAll('section')[0].classList.remove('d-none')
  document.querySelectorAll('section')[0].classList.add('active')
  prevBtn.classList.add('d-none')
  nextBtn.innerHTML = 'Siguiente'
  i = 0;

  // Name
  document.querySelector('#name').value = '';
  document.querySelector('#errorName').innerHTML = '';
}

nextBtn.addEventListener('click', function(){
  if(!validateForm()){

    if(i >= 1){
      createProject()
    }else{
      this.innerHTML = 'Siguiente';
      document.querySelectorAll('section')[i].classList.add('d-none')
      document.querySelectorAll('section')[i].classList.remove('active')

      i++;
      if(i >= 1){
        i = 1
        this.innerHTML = 'Crear';
      }

      prevBtn.classList.remove('d-none')
      document.querySelectorAll('section')[i].classList.remove('d-none');
      document.querySelectorAll('section')[i].classList.add('active');
      }
    }
})

prevBtn.addEventListener('click', function(){
  nextBtn.innerHTML = 'Siguiente'
  document.querySelectorAll('section')[i].classList.add('d-none')
  document.querySelectorAll('section')[i].classList.remove('active')

  i--;
  if(i <= 0){
    i = 0
    prevBtn.classList.add('d-none')

  }

  document.querySelectorAll('section')[i].classList.remove('d-none')
  document.querySelectorAll('section')[i].classList.add('active')
  
})

cancelBtn.addEventListener('click', function(){
  _cleanForm();
})

function createProject(){
  var name = document.querySelector('#name').value;
  var path = `${__dirname}\\Proyectos\\${name}`


  // Se crea la carpeta 
  if (!fs.existsSync(path)){
      fs.mkdirSync(path, { recursive: true });

      // Devices folder
      fs.mkdirSync(path + '\\Devices\\' , { recursive: true });

      // Data folder
      fs.mkdirSync(path + '\\Data\\' , { recursive: true });
    
      var date = new Date();
      var localDate = date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
      var localHour = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2)
      var id = Math.floor(Math.random() * 1000) + Date.now()
      var comments = document.querySelector('#comments').value;
      var num_devices = 0
      var distance = document.querySelector('#distance').value;
      var frequency = document.querySelector('#frequency').value;
      var data = document.querySelector('#data').value;


      date = localDate + ' ' + localHour; //Local time.

      // const _map = Object.fromEntries(_devicesMap)
      
      var new_proyect = new Project(id, name, date, comments, path, num_devices, distance, frequency, data, null)
      fs.writeFileSync(path + '\\info.json', JSON.stringify(new_proyect.JSON))
      cancelBtn.click();
      ipc.send('openProject', name)
  }


  readProjects()
}

// Converts a Map to a String.
function replacer(key, value) {
  if(value instanceof Map) {
    return {
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}