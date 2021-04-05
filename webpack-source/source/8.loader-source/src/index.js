let arrow = () => {
  console.log('lee');
};
arrow();
require('./less.less');
const img = require('./demo.png');
let imgDom = document.createElement('img');
imgDom.src = img.default;
document.documentElement.appendChild(imgDom);
