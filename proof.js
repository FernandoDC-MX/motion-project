const path = require('path')

const _url = path.format({
    dir: 'C:\\Users\\ferba\\OneDrive\\Escritorio\\MotionProject\\build\\Release',
    base: 'addon'
  });
  
  const addon = require(_url)

console.log('hola')
addon.sum()
console.log('his')