require('normalize.css/normalize.css');
require('styles/App.scss');

import React from 'react';
//获取图片数据
let imageDatas = require('../data/imageDatas.json');

//利用匿名函数自调将图片名称信息转换为图片路径信息
imageDatas = (function getImageURL(imageDataArr) {
  for (let i = 0, l = imageDataArr.length; i < l; i++) {
    let singleImageData = imageDataArr[i];
    imageDataArr[i] = {...singleImageData, imageURl: require('../images/' + singleImageData.fileName)};
  }
  return imageDataArr;
})(imageDatas);


class AppComponent extends React.Component {
  render() {
    return (
     <section className="stage">
       <section className="img-sec">

       </section>
       <nav className="controller-nav">

       </nav>
     </section>
    );
  }
}

AppComponent.defaultProps = {};

export default AppComponent;
