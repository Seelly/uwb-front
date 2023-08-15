<template>
  <div id="app">
      <el-container>
        <el-header style="text-align: left; font-size: 12px">
          <el-space :size="'middle'" spacer="spacer">
            <el-button>
            <router-link to="/">
              查看
            </router-link>
            </el-button>
            <el-button>
            <router-link to="/edit">
              编辑
            </router-link>
            </el-button>
          <el-dropdown>
            <i class="el-icon-menu" style="margin-right: 15px"></i>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>查看</el-dropdown-item>
              <el-dropdown-item>编辑</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          </el-space>
        </el-header>
        <el-main >
          <router-view/>
        </el-main>
      </el-container>
  </div>
</template>

<script>

export default {
  name: 'App',
  components: {
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  /*margin-top: 60px;*/
}

.el-header {
  background-color: #91bde7;
  color: #333;
  line-height: 60px;
}

.el-aside {
  /*color: #2c3e50;*/
  background-color: #2c3e50;
}
#app > section > aside > ul  {
  background-color: aliceblue;
}
#app > section > aside > ul > li > div:hover  {
  background-color: #2c3e50;
  color: white;

}
#app > section > aside > ul > li > ul > li > ul > li:hover  {
  background-color: #2c3e50 !important;
  color: white;

}
/*#app > section > aside > ul > li > ul > li{*/
/*  background-color: aliceblue;*/
/*}*/
a {
  color: inherit;
  text-decoration: none;
  /* 其它样式 */
}
a:focus a:active{
  background-color: #2c3e50 !important;
}
</style>
