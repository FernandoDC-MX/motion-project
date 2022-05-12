const _linkDevices = () =>{
    var _num_devices = Math.floor(Math.random() * (5 - 1) + 1)
    var i = 1;

    setTimeout(function() {   //  call a 3s setTimeout when the loop is called
        console.log('hello');   //  your code here
        i++;                    //  increment the counter
        if (i < _num_devices) {           //  if the counter < 10, call the loop function
          _linkDevices();             //  ..  again which will trigger another 
        }                       //  ..  setTimeout()
    }, 2000)

}

nextBtn.addEventListener('click',_linkDevices)