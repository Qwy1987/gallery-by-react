require('normalize.css/normalize.css');
require('styles/App.scss');

import React from 'react';
import ReactDOM from 'react-dom';

//获取图片数据
let imageDatas = require('../data/imageDatas.json');

//利用匿名函数自调将图片名称信息转换为图片路径信息
imageDatas = (function getImageURL(imageDataArr) {
  for (let i = 0, l = imageDataArr.length; i < l; i++) {
    let singleImageData = imageDataArr[i];
    imageDataArr[i] = {...singleImageData, imageURL: require('../images/' + singleImageData.fileName)};
  }
  return imageDataArr;
})(imageDatas);

//生成区间内的一个随机数
function getRangeRandom(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

//生成0-30度之间的任意一个正负随机值
function get30DegRandom() {
  return ((Math.random() > 0.5 ? '' : '-') + Math.ceil(Math.random() * 30));
}

//构建单个图片的组件结构类
//注意stateless component can not use refs
class ImgFigure extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  //imgFigure的点击处理函数 需要在constructor里绑定this
  handleClick(event) {
    const {inverse, center, isCenter}=this.props;
    if (isCenter) {
      inverse();
    } else {
      center();
    }
    event.stopPropagation();
    event.preventDefault();
  }

  render() {
    const {imageURL, title, desc, pos, rotate, isInverse, isCenter}=this.props;
    let styleObj = {}; //图片的样式
    //如果指定了图片的位置则使用
    pos && (styleObj = {...pos});

    //如果图片的旋转角度有值并且不为0，添加旋转角度
    if (rotate) {
      //添加兼容浏览器的厂商前缀 内联样式的写法必须是驼峰命名方式
      ['Moz', 'Ms', 'Webkit', ''].forEach(function (currValue) {
        styleObj[currValue + 'Transform'] = 'rotate(' + rotate + 'deg)';
      });
    }
    //如果是中心图片 不能被其他图片盖住
    isCenter && (styleObj['zIndex'] = 11);

    //提取样式为一个className
    //style当中的rotate会覆盖.is-inverse里的rortate值
    let imgFigureClassName = 'img-figure';
    imgFigureClassName += isInverse ? ' is-inverse' : '';
    return (
      <figure className={imgFigureClassName} style={styleObj} onClick={this.handleClick}>
        <img className="gallery-img" src={imageURL} alt={title}/>
        <figcaption>
          <h2 className="img-title">{title}</h2>
          <div className="img-back" onClick={this.handleClick}>
            <p>{desc}</p>
          </div>
        </figcaption>
      </figure>
    );
  }
}

//控制组件
class ControllerUnit extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    const {isCenter, inverse, center}=this.props;
    //点击已经居中的图片 执行一次翻转
    //点击的是非居中的图片 让该图片居中
    if (isCenter) {
      inverse();
    } else {
      center();
    }
    event.stopPropagation();
    event.preventDefault();
  }

  render() {
    const {isInverse, isCenter}=this.props;
    let controllerUnitClassName = 'controller-unit';
    //如果当前按钮对应的是居中的图片 显示居中样式 放大
    if (isCenter) {
      controllerUnitClassName += ' is-center';
      //如果当前按钮来对应正在翻转的图片 显示翻转样式 翻转动画
      if (isInverse) {
        controllerUnitClassName += ' is-inverse';
      }
    }
    return (
      <span className={controllerUnitClassName} onClick={this.handleClick}/>
    );
  }
}

//构建主组件AppComponent 他将包含所有其他组件
class AppComponent extends React.Component {

  constructor(props) {
    //当且仅当使用了extends关键字创建了一个class时，必须调用super()
    // super()相当于创建了一个对象，且该对象作为context调用extends所指向的函数，这个对象成为constructor的context
    //super()的调用必须出现在第一个this之前 否则报this is not defined的ReferenceError
    super(props);
    this.state = {
      centerPos: {   //中心图片的位置信息
        left: 0,
        right: 0
      },
      hPosRange: {     //水平方向的取值范围
        leftSecX: [0, 0],
        rightSecX: [0, 0],
        y: [0, 0]
      },
      vPosRange: {   //垂直方向的取值范围
        x: [0, 0],
        topY: [0, 0]
      },
      imgsArrangeArr: [
        /*
         {
         pos: {
         left: '0',
         top: '0'
         },
         rotate: 0,    // 旋转角度
         isInverse: false,    // 图片正反面
         isCenter: false,    // 图片是否居中
         }     */
      ]
    };
    //为该类所有的自定义方法绑定this
    for (let key in this) {
      //返回直接定义在对象上的可枚举的属性
      if (this.hasOwnProperty(key)) {
        const method = this[key];
        //返回自定义属性中类型为function的属性
        if (method instanceof Function) {
          //绑定this
          this[key] = this[key].bind(this);
        }
      }
    }
  }

  /*
   * 图片翻转
   * @param index 输入当前执行inverse操作的图片对应的图片信息数组的index值
   * @returns {Function} 这是一个闭包函数，其内return一个真正被执行的函数
   * 可将index参数保留下来
   * */
  inverse(index) {
    return () => {
      let imgsArrangeArr = this.state.imgsArrangeArr;
      imgsArrangeArr[index].isInverse = !imgsArrangeArr[index].isInverse;
      this.setState({
        imgsArrangeArr
      });
    };
  }

  /*
   * 利用reArrange函数， 居中对应index的图片
   * @param index, 需要被居中的图片对应的图片信息数组的index值
   * @returns {Function}
   */
  center(index) {
    return () => {
      this.reArrange(index);
    }
  }

  /*
   * 重新布局所有图片
   * @param centerIndex 指定居中排布哪个图片
   * */
  reArrange(centerIndex) {
    //获取当前的数据对象
    const {centerPos, hPosRange, vPosRange, imgsArrangeArr}=this.state;
    const hPosRangeLeftSecX = hPosRange.leftSecX,
      hPosRangeRightSecX = hPosRange.rightSecX,
      hPosRangeY = hPosRange.y,
      vPosRangeX = vPosRange.x,
      vPosRangeTopY = vPosRange.topY;

    //splice() 方法向/从数组中添加/删除项目，然后返回被删除的项目
    let imgsArrangeCenterArr = imgsArrangeArr.splice(centerIndex, 1);//从图片数组对象中取出当前要居中的图片数据
    //设置居中图片的状态信息
    imgsArrangeCenterArr[0] = {
      pos: centerPos,//首先居中这张图片  设置居中图片的位置信息
      rotate: 0, //居中的图片不需旋转
      isCenter: true //居中状态为true
    };

    //设置上侧图片的状态信息
    let imgsArrangeTopArr,//上侧分布图片数据
      topImgNum = Math.floor(Math.random() * 2), //取0 或者1 上侧放一张图片或者不放
      topImgSpliceIndex;//上侧图片的索引值 从数组对象中的哪个位置拿到的


    //取出要布局在上侧的图片的状态信息
    topImgSpliceIndex = Math.floor(Math.random() * imgsArrangeArr.length - topImgNum);
    imgsArrangeTopArr = imgsArrangeArr.splice(topImgSpliceIndex, topImgNum);

    //布局位于上侧的图片
    imgsArrangeTopArr.forEach(function (currValue, index) {
      imgsArrangeTopArr[index] = {
        pos: {
          top: getRangeRandom(vPosRangeTopY[0], vPosRangeTopY[1]),
          left: getRangeRandom(vPosRangeX[0], vPosRangeX[1])
        },
        rotate: get30DegRandom(),
        isCenter: false
      }
    });

    //布局左右两侧的图片
    for (let i = 0, j = imgsArrangeArr.length, k = j / 2; i < j; i++) {
      let hPosRangeLORX;
      //前半部分图片布局在左边 后半部分图片布局在右边
      if (i < k) {
        hPosRangeLORX = hPosRangeLeftSecX;
      } else {
        hPosRangeLORX = hPosRangeRightSecX;
      }
      imgsArrangeArr[i] = {
        pos: {
          top: getRangeRandom(hPosRangeY[0], hPosRangeY[1]),
          left: getRangeRandom(hPosRangeLORX[0], hPosRangeLORX[1])
        },
        rotate: get30DegRandom(),
        isCenter: false
      };
    }

    //还原图片数据数组 将置中的图片和置于上侧的图片数据插回到原数组
    if (imgsArrangeTopArr && imgsArrangeTopArr[0]) {
      imgsArrangeArr.splice(topImgSpliceIndex, 0, imgsArrangeTopArr[0]);
    }
    imgsArrangeArr.splice(centerIndex, 0, imgsArrangeCenterArr[0]);

    //重置state 驱动渲染
    this.setState({
      imgsArrangeArr
    });
  }

  //在组件挂载后初始化每张图片的位置范围
  componentDidMount() {
    //获取舞台的大小
    let stageDOM = ReactDOM.findDOMNode(this.refs.stage),
      stageW = stageDOM.scrollWidth,
      stageH = stageDOM.scrollHeight,
      halfStageW = Math.ceil(stageW / 2),
      halfStageH = Math.ceil(stageH / 2);
    //获取一个imgFigure的大小 根据imgFigure的索引来获取
    let imgFigureDOM = ReactDOM.findDOMNode(this.refs.imgFigure0),
      imgW = imgFigureDOM.scrollWidth,
      imgH = imgFigureDOM.scrollHeight,
      halfImgW = Math.ceil(imgW / 2),
      halfImgH = Math.ceil(imgH / 2);

    //计算图片的位置点
    let centerPos = {   //计算中心图片的位置点
      left: halfStageW - halfImgW,
      top: halfStageH - halfImgH
    };
    let hPosRange = {     //计算左侧，右侧区域图片的取值范围
      leftSecX: [0 - halfImgW, halfStageW - halfImgW * 3],
      rightSecX: [halfStageW + halfImgW, stageW - halfImgW],
      y: [0 - halfImgH, stageH - halfImgH]
    };
    let vPosRange = {   //计算上侧区域图片的取值范围
      topY: [-halfImgH, halfStageH - halfImgH * 3],
      x: [halfStageW - imgW, halfStageW]
    };
    //*******setState()不保证是同步的，如果后一步操作依赖state的更新 则需要setState的第二个参数：回调函数来处理
    this.setState({
      centerPos,
      hPosRange,
      vPosRange
    }, function () {
      this.reArrange(0);//默认指定第一张在中心位置
    });
  }

  render() {
    let imgFigures = [],//存储图片组件
      controllerUnits = []; //存储控制器组件
    //遍历图片数据数组imgsArrangeArr
    imageDatas.forEach(function (currValue, index) {
      if (!this.state.imgsArrangeArr[index]) {
        this.state.imgsArrangeArr[index] = {
          pos: {
            left: 0,
            top: 0
          },
          rotate: 0,
          isInverse: false,
          isCenter: false
        }
      }
      //填充ImgFigure组件并且追加到imgFigures数组中
      //数组数据必须增加key属性
      const {pos, rotate, isInverse, isCenter}=  this.state.imgsArrangeArr[index];
      imgFigures.push(<ImgFigure
        {...currValue}
        key={index}
        ref={'imgFigure' + index}
        pos={pos}
        rotate={rotate}
        isInverse={isInverse}
        isCenter={isCenter}
        inverse={this.inverse(index)}
        center={this.center(index)}
      />);
      controllerUnits.push(<ControllerUnit
        {...currValue}
        key={index}
        isInverse={isInverse}
        isCenter={isCenter}
        inverse={this.inverse(index)}
        center={this.center(index)}
      />);
    }.bind(this));    //函数当参数时想读取父级的context必须绑定this
    return (
      <section className="stage" ref="stage">
        <section className="img-sec">
          {imgFigures}
        </section>
        <nav className="controller-nav">
          {controllerUnits}
        </nav>
      </section>
    );
  }
}

AppComponent.defaultProps = {};

export default AppComponent;
