<template>
  <div style="height: 100vh">
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item>定位查看</el-breadcrumb-item>
    </el-breadcrumb>
        <el-row :gutter="20">
          <el-col :span="18">
            <canvas :width="canvasW" :height="canvasH" id="canvas" style="border: 1px solid #ccc;" ref="canvas"></canvas>
          </el-col>
          <el-col :span="6">
            <el-card style="margin-left: 1rem">
              <div slot="header" class="clearfix">
                <span>历史位置</span>
              </div>

              <ul class="infinite-list" v-infinite-scroll="" style="overflow:auto">
                <li v-for="(i,index) in historyPosition" class="infinite-list-item" :key="index">X:{{ i.avx }},Y:{{
                    i.avy
                  }}
                </li>
              </ul>
            </el-card>
          </el-col>
        </el-row>
  </div>
</template>

<script>
import {fabric} from 'fabric'

export default {
  name: "MyView",
  data() {
    return {
      socket: null,
      canvas: null,
      canvasW: 800,
      canvasH: 500,
      origin: null,
      objList: [],
      position: {},
      historyPosition: [],
      path:null,
      realWidth:15,
      realHeight:10,
      anc:[{x:0,y:0},{x:10,y:0},{x:5,y:10}],
      ancobj:{
        "type": "circle",
        "version": "5.3.0",
        "originX": "left",
        "originY": "top",
        "left": -0.96,
        "top": 495.7,
        "width": 60,
        "height": 60,
        "fill": "orange",
        "stroke": "green",
        "strokeWidth": 1,
        "strokeDashArray": null,
        "strokeLineCap": "butt",
        "strokeDashOffset": 0,
        "strokeLineJoin": "miter",
        "strokeUniform": false,
        "strokeMiterLimit": 4,
        "scaleX": 0.19,
        "scaleY": 0.19,
        "angle": 0,
        "flipX": false,
        "flipY": false,
        "opacity": 1,
        "shadow": null,
        "visible": true,
        "backgroundColor": "",
        "fillRule": "nonzero",
        "paintFirst": "fill",
        "globalCompositeOperation": "source-over",
        "skewX": 0,
        "skewY": 0,
        "radius": 30,
        "startAngle": 0,
        "endAngle": 360
      }
    }
  },
computed:{
normalAnc:function (){
  let result = []
  for (let i = 0; i < this.anc.length; i++) {
    let item = {...this.ancobj}
    console.log(item,this.anc[i])
    item.left = this.anc[i].x*(this.canvasW/this.realWidth)
    item.top = this.canvasH-this.anc[i].y*(this.canvasH/this.realHeight)
    result.push(item)
  }
  return result
}
},
  mounted() {
    this.canvasW = this.$refs.canvas.parentNode.clientWidth
    this.canvasH = this.$refs.canvas.parentNode.clientHeight
    // 创建WebSocket实例
    this.socket = new WebSocket('ws://localhost:8000/ws');
    // 监听WebSocket事件
    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('error', this.onError);
    this.socket.addEventListener('close', this.onClose);


  },
  watch: {
    position: {
      handler() {
        this.updatePosition()
      }

    }
  },
  methods: {
    onOpen() {
      console.log('WebSocket连接已经建立');
    },
    onMessage(e) {
      console.log(e)
      if (e.data == 'null\n' || !e.data) {
        return;
      }
      let {data} = e

      data = JSON.parse(data)
      if (data.data) {
        this.init(data.data)
        return
      }
      console.log('接收到WebSocket服务器发送的消息：', data);
      this.position = data
      this.historyPosition.push(data)
    },
    onError(event) {
      console.error('WebSocket发生错误：', event);
    },
    onClose(event) {
      console.warn('WebSocket连接已经关闭：', event);
    },
    init(str) {
      str = JSON.parse(str)
      for (let i = 0; i < this.normalAnc.length; i++) {
        let text = new fabric.IText(`基站${i}(${this.anc[i].x},${this.anc[i].y})`,{
          left: this.normalAnc[i].left+8,    // 位置横坐标与圆心相同
          top: this.normalAnc[i].top?this.normalAnc[i].top-5:0,     // 位置纵坐标比圆心 y 坐标多一些
          fontSize:10,
        })
        // let group = new fabric.Group([this.normalAnc[i], text])
        str.objects.push(text)
        str.objects.push(this.normalAnc[i])
      }
      // 初始化画布
      const canva = new fabric.StaticCanvas('canvas',{
        width: this.$refs.canvas.parentNode.clientWidth,
        height: this.$refs.canvas.parentNode.clientHeight
      })
      // 反序列化
      canva.loadFromJSON(str)

      this.canvas = canva
      // 创建一个长方形
      //
      // const gra = new fabric.Circle({
      //   radius: 8, // 圆的半径
      //   top: 50, // 距离容器顶部 20px
      //   left: 50, // 距离容器左侧 20px
      //   fill: 'green' // 填充
      // })
      // this.origin = gra
      // canva.add(gra) // 将矩形添加到 canvas 画布里
      //
      // // 监听鼠标滚轮事件
      // canva.on('mouse:wheel', opt => {
      //   let delta = opt.e.deltaY // 滚轮向上滚一下是 -100，向下滚一下是 100
      //   let zoom = canva.getZoom() // 获取画布当前缩放值
      //
      //   // 控制缩放范围在 0.01~20 的区间内
      //   zoom *= 0.999 ** delta
      //   if (zoom > 20) zoom = 20
      //   if (zoom < 0.01) zoom = 0.01
      //
      //   // 设置画布缩放比例
      //   canva.setZoom(zoom)
      // })
    },
    updatePosition() {
      if (this.ancLocation){
        this.canvas.remove(this.ancLocation)
      }
      const x = this.position.avx*(this.canvasW/this.realWidth)
      const y = this.canvasH-this.position.avy*(this.canvasH/this.realHeight)
      console.log(x,y)
      // this.origin.set({left: x, top: y})
      // this.canvas.add(this.origin)

      // 如果已经记录了至少两个位置，则在 Canvas 上添加线段以表示轨迹
      if (this.historyPosition.length >= 2) {
        const previousPosition = this.historyPosition[this.historyPosition.length - 2];
        const line = new fabric.Line([previousPosition.avx*(this.canvasW/this.realWidth), this.canvasH-previousPosition.avy*(this.canvasH/this.realHeight), x, y], {
          stroke: 'red',
          strokeWidth: 2,
          selectable: false
        });
        this.canvas.add(line);
        console.log("line:",previousPosition.avx*(this.canvasW/10), previousPosition.avy*(this.canvasH/10), x, this.position.avy*(this.canvasH/10))
      }

      // 更新原点位置
      this.origin.set({left: x, top: y});
      const end = this.drawEndArrow(x,  y)
      let text = new fabric.IText(`(${x},${y})`,{
        left: x+10,
        top: y+10,
        fontSize:10,
      })
      this.ancLocation = text
      const group = new fabric.Group([this.origin, text])
      this.canvas.add(group);
      this.canvas.add(end);
    },
    drawEndArrow(left, top) {
      return new fabric.Triangle({
        width:  8,
        height:  8,
        left: left,
        top: top,
        fill: 'rgba(0,195,244)',
        opacity: 1,
        angle:180,
        centeredRotation: true,
        originX: 'center',
        originY: 'center',
        // 禁止选中
        selectable: true,
        hasControls: false, // 当设置为 `false` 时，对象的控件不显示并且不能用于操作对象
      });
}
  }
}
</script>

<style scoped>
.infinite-list {
  font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, SimSun, sans-serif;
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  height: 25rem;
  padding: 0;
  margin: 0;
  list-style: none;
  overflow: auto;
}

.infinite-list .infinite-list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  background: #e8f3fe;
  margin: 10px;
  color: #7dbcfc;
  overflow: auto;
  scroll-behavior: smooth;
}

.el-main-Flex {
  display: flex;
}
</style>
