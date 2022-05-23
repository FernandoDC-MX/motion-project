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

class Device{
  constructor(id, _id_muscle, _muscle_name, _hex){
    this.id = id;
    this._id_muscle = _id_muscle;
    this._muscle_name = _muscle_name;
    this._hex = _hex;
  }

  
  get JSON(){
    return {
            "id": this.id,
            "_muscle_name": this._muscle_name,
            "_id_muscle": this._id_muscle,
            "_hex": this._hex,
        }
  }
}

let i = 0;

let _devicesMap = new Map()

var elements = document.querySelectorAll('.device')

function _linkDevice() {
  var _num_input = document.querySelector('#num_devices')

  if(this.classList.contains('device')){
    var random_color = Math.floor(Math.random()*16777215).toString(16);
    var _device = new Device(this.getAttribute('data-id'), null, null, random_color)

    this.style.background = '#' + random_color
    this.style.border = '1px solid #' + random_color;
    Array.from(this.childNodes).forEach((element, index) => {
        if(element.style !== undefined){
          element.style.opacity = '1'
        }
    })

    this.querySelector('p').innerHTML = 'Conectado'
    this.classList.remove('device')
    this.classList.add('device_selected')

    _devicesMap.set(this.getAttribute('data-id'), _device.JSON)
    _num_input.value++;
  }else{
    this.style.background = '';
    this.style.border = '1px solid white'
    Array.from(this.childNodes).forEach((element, index) => {
      if(element.style !== undefined){
        element.style.opacity = '0'
      }
    })
    this.querySelector('p').innerHTML = 'Conectar'
    this.classList.remove('device_selected')
    this.classList.add('device')

    _devicesMap.delete(this.getAttribute('data-id'))
    _num_input.value--;
  }

};

function validateForm(){
  const sectionElement = document.querySelector('.active')
  var _entries_input = sectionElement.querySelectorAll('input');
  let flag = 0;

  if(_entries_input.length){
    Array.from(_entries_input).forEach(element =>{
      switch(element.id){
        case 'name': if(!element.value){
                        if(fs.existsSync(`${__dirname}\\Proyectos\\${element.value}`))
                          document.querySelector('#errorName').innerHTML = 'Este nombre ya existe. Trata con otro.';
                        else
                          document.querySelector('#errorName').innerHTML = 'Este campo debe de ser llenado obligatoriamente.';
                        flag = 1;
                      }
                      else
                        document.querySelector('#errorName').innerHTML = '';
          break;
        case 'num_devices':
                        if(element.value <= 0){
                          document.querySelector('#errorNumDevices').innerHTML = 'Tienes que seleccionar uno o más dispositivos';
                          flag = 1;
                        }else{
                          document.querySelector('#errorNumDevices').innerHTML = '';
                        }
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

  // Devices
  document.querySelectorAll('.device_selected').forEach(element =>{
    Array.from(element.childNodes).forEach((element, index) => {
      if(element.style !== undefined){
        element.style.opacity = '0'
      }
    })
    element.classList.add('device')
    element.classList.remove('device_selected')
    element.style.background = '';
    element.style.border = '1px solid white';
  })

  document.querySelector('#num_devices').value = 0;
  document.querySelector('#errorNumDevices').innerHTML = '';

  _devicesMap = new Map();
}

Array.from(elements).forEach(function(element) {
  element.addEventListener('click', _linkDevice);
});

nextBtn.addEventListener('click', function(){
  if(!validateForm()){

    if(i >= 2){
      createProject()
    }else{
      this.innerHTML = 'Siguiente';
      document.querySelectorAll('section')[i].classList.add('d-none')
      document.querySelectorAll('section')[i].classList.remove('active')

      i++;
      if(i >= 2){
        i = 2
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

      var date = new Date();
      var localDate = date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
      var localHour = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + date.getMilliseconds()
      var id = Math.floor(Math.random() * 1000) + Date.now()
      var comments = document.querySelector('#comments').value;
      var num_devices = document.querySelector('#num_devices').value;
      var distance = document.querySelector('#distance').value;
      var frequency = document.querySelector('#frequency').value;
      var data = document.querySelector('#data').value;


      date = localDate + ' ' + localHour; //Local time.

      const _map = JSON.stringify(_devicesMap, replacer);
      
      var new_proyect = new Project(id, name, date, comments, path, num_devices, distance, frequency, data, _map)
      fs.writeFileSync(path + '\\info.json', JSON.stringify(new_proyect.JSON))
      cancelBtn.click();
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