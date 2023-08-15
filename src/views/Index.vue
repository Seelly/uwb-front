<template>
  <div @mousewheel.prevent>
    <el-breadcrumb separator-class="el-icon-arrow-right">
<!--      <el-breadcrumb-item>范围编辑</el-breadcrumb-item>-->
    </el-breadcrumb>
    <el-container style="width: 100%">
      <el-header style="background-color: aliceblue">
        <el-row :gutter="10">
          <el-col :span="4">
            <el-button round @click="addRect" :data-set="'rect'">新增矩形</el-button>
          </el-col>
          <el-col :span="4">
            <el-button round @click="addRect" :data-set="'round'">新增圆形</el-button>
          </el-col>
          <el-col :span="4">
            <el-button round @click="addRect" :data-set="'text'">新增标签</el-button>
          </el-col>
          <el-col :span="4">
            <el-button round @click="undo">撤销</el-button>
          </el-col>
          <el-col :span="4">
            <el-select v-model="alertValue" placeholder="报警频率">
              <el-option
                  v-for="(item,index) in options"
                  :key="index"
                  :label="item.label"
                  :value="item.value">
              </el-option>
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button round @click="saveToJson">保存</el-button>
          </el-col>
        </el-row>
      </el-header>
      <el-main class="">
        <el-row :gutter="20">
          <el-col :span="18">
            <canvas :width="canvasW" :height="canvasH" id="canvas" style="border: 1px solid #ccc;" ref="canvas"></canvas>
          </el-col>
          <el-col :span="6">
            <el-card :body-style="{ padding: '0px' }">
              <img :src="'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+ticket"
                   class="image">
              <div style="padding: 14px;">
                <span>微信扫码</span>
                <div class="bottom clearfix">
                  <p class="time">订阅警报</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import {fabric} from 'fabric'
import axios from 'axios'

export default {
  name: "IndexPage",
  data() {
    return {
      canvas: null,
      canvasW: 800,
      canvasH: 500,
      origin: null,
      border: null,
      objList: [],
      position: {},
      historyPosition: [],
      ticket: "",
      alertValue:5,
      options:[
          {"label":"5min/次","value":5},
          {"label":"10min/次","value":10},
          {"label":"30min/次","value":30},
          {"label":"1h/次","value":60},
          {"label":"24h/次","value":3600},
      ]
    }
  },
  mounted() {
    const canvas = new fabric.Canvas('canvas',{
      width: this.$refs.canvas.parentNode.clientWidth,
      height: this.$refs.canvas.parentNode.clientHeight
    }) // 这里传入的是canvas元素的id
    this.canvas = canvas
    this.canvasW = this.$refs.canvas.parentNode.clientWidth
    this.canvasH = this.$refs.canvas.parentNode.clientHeight
    // 创建一个长方形
    const border = new fabric.Rect({
      top: 10, // 距离容器顶部 20px
      left: 10, // 距离容器左侧 20px
      width: this.canvasW - 20,
      height: this.canvasH - 20,
      fill: 'white', // 填充 粉色
      opacity: 0.5,
      stroke: 'red',
    })
    this.border = border
    canvas.add(border) // 将矩形添加到 canvas 画布里
    const gra = new fabric.Circle({
      radius: 8, // 圆的半径
      top: 50, // 距离容器顶部 20px
      left: 50, // 距离容器左侧 20px
      fill: 'green' // 填充
    })
    this.origin = gra
    canvas.add(gra) // 将矩形添加到 canvas 画布里

    // 监听鼠标滚轮事件
    canvas.on('mouse:wheel', opt => {
      let delta = opt.e.deltaY // 滚轮向上滚一下是 -100，向下滚一下是 100
      let zoom = canvas.getZoom() // 获取画布当前缩放值

      // 控制缩放范围在 0.01~20 的区间内
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01

      // 设置画布缩放比例
      canvas.setZoom(zoom)
    })
    this.createQrcode()
  },
  watch: {
    position: {
      handler() {
        this.updatePosition()
      }

    }
  },
  methods: {
    createQrcode() {
      axios.get('http://127.0.0.1:8000/api/qrcode')
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
    addRect(e) {
      let cat = e.currentTarget.dataset.set
      let gra = null
      console.log(cat)
      if (cat === 'round') {
        // 圆形
        gra = new fabric.Circle({
          radius: 30, // 圆的半径
          top: 20, // 距离容器顶部 20px
          left: 20, // 距离容器左侧 20px
          fill: 'orange', // 填充
          // opacity: 0.3,
          stroke: 'green'
        })
      } else if (cat === 'rect') {
        gra = new fabric.Rect({
          top: 100, // 距离容器顶部 100px
          left: 100, // 距离容器左侧 100px
          width: 30, // 矩形宽度 30px
          height: 30, // 矩形高度 30px
          fill: 'red' // 填充 红色
        })
      } else {
        gra = new fabric.IText('新建文本')
      }
      this.canvas.add(gra) // 将矩形添加到 canvas 画布里
      this.objList.push(gra)
    },
    undo() {
      this.canvas.remove(this.objList[this.objList.length - 1])
      this.objList.pop()
    },
    saveToJson() {
      this.canvas.remove(this.origin)
      const json_canvas = this.canvas.toJSON()
      const border = {
        "x": this.border.left,
        "y": this.border.top,
        "w": this.border.width,
        "h": this.border.height
      }
      // localStorage.setItem('canvas',JSON.stringify(json_canvas))
      axios.post('http://127.0.0.1:8000/api/init', {data: JSON.stringify(json_canvas), border: border,period:this.alertValue})
          .then(response => {
            const { data } =  response
            if (data.code === 200){
              this.warn("保存成功",'success')
            } else {
              this.warn("保存失败",'error')
            }
            console.log(response)
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
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  height: 300px;
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
.image {
  width: 100%;
  display: block;
}
</style>
