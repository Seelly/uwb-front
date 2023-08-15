<template>
  <div @mousewheel.prevent>
    <el-breadcrumb separator-class="el-icon-arrow-right">

    </el-breadcrumb>
    <el-container style="width: 100%">
      <el-header style="background-color: aliceblue">
        <el-row :gutter="10">
          <el-col :span="4">
            轨迹保留时间：1 min 导出数据
          </el-col>
          <el-col :span="4">
            <el-tooltip class="item" effect="dark" content="请先输入要导出的时间，单位分钟，例如 15 后点击导出。查询结果按照1μs间隔取均值聚合，数据中的时间为UTC时间" placement="bottom-start">
            <el-input placeholder="时间(分钟) 默认值5分钟" v-model="exportPeriod"></el-input>
            </el-tooltip>
          </el-col>
          <el-col :span="4">
            <el-tooltip class="item" effect="dark" content="请先输入要导出的时间，单位分钟，例如 15 后点击导出。查询结果按照1μs间隔取均值聚合，数据中的时间为UTC时间" placement="bottom-start">
              <a :href="'http://127.0.0.1:8000/api/query?range=' +exportPeriod"><i class="el-icon-edit-outline"></i>导出</a>
            </el-tooltip>
          </el-col>
        </el-row>
      </el-header>
      <el-main class="">
        <el-row :gutter="20">
          <el-col :span="18">
            <canvas :width="canvasW" :height="canvasH" id="canvas" style="border: 1px solid #ccc;" ref="canvas"></canvas>
          </el-col>
          <el-col :span="6">
            <el-card style="margin-left: 1rem" >
              <el-descriptions title="基站位置信息(单位:m)x/y" direction="vertical" :column="4" border :size="'small'">
                <el-descriptions-item v-for="(item,idx) in anc" :label="'基站'+idx" :key="idx"><el-input v-model="anc[idx].x" @change="handleChange(idx, 'x')"></el-input><el-input v-model="anc[idx].y" @change="handleChange(idx, 'x')"></el-input></el-descriptions-item>
              </el-descriptions>
              <el-descriptions title="标签信息(单位:m)" direction="vertical" :column="1" border :size="'small'">
                <el-descriptions-item label="坐标">
                  <el-tag size="small">（{{this.position.avx}},{{this.position.avy}}）</el-tag>
                </el-descriptions-item>
              </el-descriptions>
              <el-descriptions direction="vertical" :column="3" border>
                <el-descriptions-item label="距离1">{{position.anc1 || 0}}</el-descriptions-item>
                <el-descriptions-item label="距离2">{{position.anc2 || 0}}</el-descriptions-item>
                <el-descriptions-item label="距离3">{{position.anc3 || 0}}</el-descriptions-item>
              </el-descriptions>
              <el-descriptions title="比例信息" direction="vertical" :column="2" :size="'small'">
                <el-descriptions-item label="画布宽度">
                  <el-tag size="small">{{canvasW}}px</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="画布高度">
                  <el-tag size="small">{{canvasH}}px</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="场地长度">
                  <el-tag size="small">{{realWidth}}m</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="场地宽度">
                  <el-tag size="small">{{realHeight}}m</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="比例尺">
                  <el-tag size="small">{{ scale(canvasW, realWidth) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="比例尺">
                  <el-tag size="small">{{ scale(canvasH, realHeight) }}</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>

</template>

<script>
import {fabric} from 'fabric'
import axios from "axios";

export default {
  name: "ViewDetail",
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
      realWidth:8,
      realHeight:7,
      anc:[{x:0,y:0},{x:8,y:0},{x:4,y:6.9}],
      ancr:{},
      lines:[],
      timer:null,
      exportPeriod:null,
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
    let left = this.anc[i].x*(this.canvasW/this.realWidth)
    item.left = left?left-20:0
    let top  = this.canvasH-this.anc[i].y*(this.canvasH/this.realHeight)
    item.top = top?top-3:0
    result.push(item)
  }
  return result
}
},
  beforeDestroy() {
    console.log("清除定时器")
    clearInterval(this.timer); // 清除定时器，停止循环
  },
  mounted() {
    this.timer = setInterval(() => {
      // 每秒执行的操作
      this.historyPosition=[]
      for (let i = 0; i < this.lines.length; i++) {
        this.canvas.remove(this.lines[i])
      }
      console.log("执行了",this.historyPosition)
    }, 60000);
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
    },
    // anc: {
    //   handler() {
    //     console.log("anc change")
    //     this.init()
    //   }
    // },
  },
  methods: {
    onOpen() {
      console.log('WebSocket连接已经建立')
      this.warn("连接已经建立",'success');
    },
    onMessage(e) {
      console.log("zhe shi e:",e)
      if (e.data == 'null\n' || !e.data) {
        return;
      }
      let {data} = e
      data = JSON.parse(data)
      console.log(data)
      if (!data.dataType) {
        this.configStr = data.data
        this.init()
        return
      }
      else {
        // if (data.dataType === "coordinate"){
          this.position = data
          this.historyPosition.push(data)
        // }else {
        //   this.ancr = data
        // }
      }
      console.log('接收到WebSocket服务器发送的消息：', data);
    },
    onError(event) {

      this.warn("连接发生错误",'success');
      console.error('WebSocket发生错误：', event);
    },
    onClose(event) {

      this.warn("连接已经关闭",'success');
      console.warn('WebSocket连接已经关闭：', event);
    },
    init() {
      let str = JSON.parse(this.configStr)
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
      for (let i = 0; i < str.objects.length; i++) {
        str.objects[i].selectable=false
      }
      // 初始化画布
      const canva = new fabric.Canvas('canvas',{
        width: this.$refs.canvas.parentNode.clientWidth,
        height: this.$refs.canvas.parentNode.clientHeight
      })
      // 反序列化
      canva.loadFromJSON(str)

      this.canvas = canva
      // 创建初始点
      //
      const gra = new fabric.Circle({
        radius: 8, // 圆的半径
        top: 50, // 距离容器顶部 20px
        left: 50, // 距离容器左侧 20px
        fill: 'green' // 填充
      })
      this.origin = gra
      canva.add(gra) // 将矩形添加到 canvas 画布里
      //

      //监听鼠标滚轮事件
      canva.on('mouse:wheel', opt => {
        let delta = opt.e.deltaY // 滚轮向上滚一下是 -100，向下滚一下是 100
        let zoom = canva.getZoom() // 获取画布当前缩放值

        // 控制缩放范围在 0.01~20 的区间内
        zoom *= 0.999 ** delta
        if (zoom > 20) zoom = 20
        if (zoom < 0.01) zoom = 0.01

        // 设置画布缩放比例
        // 关键点！！！
        // 参数1：将画布的所放点设置成鼠标当前位置
        // 参数2：传入缩放值
        canva.zoomToPoint(
            {
              x: opt.e.offsetX, // 鼠标x轴坐标
              y: opt.e.offsetY  // 鼠标y轴坐标
            },
            zoom // 最后要缩放的值
        )
      })

    },
    updatePosition() {
      const x = this.position.avx*(this.canvasW/this.realWidth)
      const y = this.canvasH-this.position.avy*(this.canvasH/this.realHeight)

      // 如果已经记录了至少两个位置，则在 Canvas 上添加线段以表示轨迹
      // if (this.historyPosition.length >= 2) {
      //   const previousPosition = this.historyPosition[this.historyPosition.length - 2];
      //   const line = new fabric.Line([previousPosition.avx*(this.canvasW/this.realWidth), this.canvasH-previousPosition.avy*(this.canvasH/this.realHeight), x, y], {
      //     stroke: 'red',
      //     strokeWidth: 2,
      //     selectable: false
      //   });
      //   this.lines.push(line)
      //   this.canvas.add(line);
      // }
      // 更新标签点位置
      this.origin.set({left: x, top: y});
      const end = this.drawEndArrow(x,  y)
      this.lines.push(end)
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
},
    // 计算比例尺
    scale(canvasSize, realSize) {
      // 计算比例尺
      const scaleValue = canvasSize / realSize;
      if (Number.isInteger(scaleValue)) {
        return `${scaleValue}:1`;
      } else {
        return `${scaleValue.toFixed(3)}:1`;
      }

    },
    handleChange(idx, axios){
      this.anc[idx][axios] = parseFloat(this.anc[idx][axios])
      this.init()
    },
    outdata(){
      console.log("ddd")
      axios.get('http://127.0.0.1:8000/api/query?range='+this.exportPeriod)
          .then(response => {
            const {data} = response
            if (data.code === 1) {
              this.ticket = JSON.parse(data.data).ticket
            }
          })
          .catch(error => {
            console.log(error)
          })
    },
    warn(content,type) {
      this.$message({
        message: content,
        type: type
      });
    },
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
