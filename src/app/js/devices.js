let i = 0;

var elements = document.querySelectorAll('.device')

function _linkDevice() {
  var random_color = Math.floor(Math.random()*16777215).toString(16);

  this.style.background = '#' + random_color
  this.style.border = '1px solid #' + random_color;
  Array.from(this.childNodes).forEach((element, index) => {
      if(element.style !== undefined){
        element.style.opacity = '1'
      }
  })

  this.querySelector('p').innerHTML = 'Conectado'

};

function validateForm(){
  const sectionElement = document.querySelector('.active')
  var _entries_input = sectionElement.querySelectorAll('input');
  var _entries_select = sectionElement.querySelectorAll('select');

  if(_entries_input.length){
    Array.from(_entries_input).forEach(element =>{
      switch(element.id){
        case 'name': 
      }
    })
  }

  return 0;
}

Array.from(elements).forEach(function(element) {
  element.addEventListener('click', _linkDevice);
});

nextBtn.addEventListener('click', function(){
  validateForm()
  // this.innerHTML = 'Siguiente';
  // document.querySelectorAll('section')[i].classList.add('d-none')
  // document.querySelectorAll('section')[i].classList.remove('active')


  // i++;
  // if(i >= 2){
  //   i = 2
  //   this.innerHTML = 'Crear';
  // }

  
  // prevBtn.classList.remove('d-none')
  // document.querySelectorAll('section')[i].classList.remove('d-none')
  // document.querySelectorAll('section')[i].classList.add('active')

  
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

