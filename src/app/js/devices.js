// const _linkDevices = () =>{
//     var _num_devices = Math.floor(Math.random() * (5 - 1) + 1)
//     var i = 1;
//     setTimeout(function() {   //  call a 3s setTimeout when the loop is called
//         document.getElementById('devices').innerHTML+= `
//         <div class="device d-inline-block">
//           <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill="currentColor" class="bi bi-wifi" viewBox="0 0 16 16">
//             <path d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.444 12.444 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c2.507 0 4.827.802 6.716 2.164.205.148.49.13.668-.049z"/>
//             <path d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.455 9.455 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.576 1.336c.206.132.48.108.653-.065zm-2.183 2.183c.226-.226.185-.605-.1-.75A6.473 6.473 0 0 0 8 9c-1.06 0-2.062.254-2.946.704-.285.145-.326.524-.1.75l.015.015c.16.16.407.19.611.09A5.478 5.478 0 0 1 8 10c.868 0 1.69.201 2.42.56.203.1.45.07.61-.091l.016-.015zM9.06 12.44c.196-.196.198-.52-.04-.66A1.99 1.99 0 0 0 8 11.5a1.99 1.99 0 0 0-1.02.28c-.238.14-.236.464-.04.66l.706.706a.5.5 0 0 0 .707 0l.707-.707z"/>
//           </svg>
//           <p>conectar</p>
//         </div>
//         `   //  your code here
//         i++;                    //  increment the counter
//         if (i < _num_devices) {           //  if the counter < 10, call the loop function
//           _linkDevices();             //  ..  again which will trigger another 
//         }                       //  ..  setTimeout()
//     }, 600)

// }

// nextBtn.addEventListener('click',_linkDevices)

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

Array.from(elements).forEach(function(element) {
  element.addEventListener('click', _linkDevice);
});

nextBtn.addEventListener('click', function(){
  console.log(i)
  document.querySelectorAll('section')[i].classList.add('d-none')

  i++;
  if(i >= 2)
    i = 2
  
  prevBtn.classList.remove('d-none')
  document.querySelectorAll('section')[i].classList.remove('d-none')
  
})

prevBtn.addEventListener('click', function(){
  console.log(i)
  document.querySelectorAll('section')[i].classList.add('d-none')

  i--;
  if(i <= 0){
    i = 0
    prevBtn.classList.add('d-none')

  }

  document.querySelectorAll('section')[i].classList.remove('d-none')
  
})

