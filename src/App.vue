<template>
  <div id="app">
    <fieldset>
      <legend>插件-单文件上传</legend>
      <button @click="upload_plugin">选择文件</button>
      <button @click="()=>uInst.upload({id:'upload_plugin'})">上传</button>
      <div v-for="file in upload_plugin_data" :key="file.id">
        {{file.name}}
        {{file.msg}}
        <button @click="deletefile('uInst',file.id)">删除</button>
        <button @click="cancel('uInst',file.id)">取消上传</button>
      </div>
    </fieldset>

    <fieldset>
      <legend>插件-单文件上传【追加模式】</legend>
      <button @click="()=>uaInst.open()">添加文件</button>
      <button @click="()=>uaInst.upload({id:'upload_pluginAppend'})">上传</button>
      <div v-for="file in upload_pluginAppend_data" :key="file.id">
        {{file.name}}
        {{file.msg}}
        <button @click="deletefile('uaInst',file.id)">删除</button>
        <button @click="cancel('uaInst',file.id)">取消上传</button>
      </div>
    </fieldset>

    <fieldset>
      <legend>插件-多文件上传</legend>
      <button @click="()=>umInst.open()">选择文件</button>
      <button @click="()=>umInst.upload({id:'upload_multiplt_plugin'})">上传</button>
      <div v-for="file in upload_multiplt_plugin_data" :key="file.id">
        {{file.name}}
        {{file.msg}}
        <button @click="deletefile('umInst',file.id)">删除</button>
        <button @click="cancel('umInst',file.id)">取消上传</button>
      </div>
    </fieldset>

    <fieldset>
      <legend>插件-多文件上传【追加模式】</legend>
      <button @click="()=>umaInst.open()">添加文件</button>
      <button @click="()=>umaInst.upload({id:'upload_multiplt_pluginAppend'})">上传</button>
      <div v-for="file in upload_multiplt_pluginAppend_data" :key="file.id">
        {{file.name}}
        {{file.msg}}
        <button @click="deletefile('umaInst',file.id)">删除</button>
        <button @click="cancel('umaInst',file.id)">取消上传</button>
      </div>
    </fieldset>
    <fieldset>
      <legend>插件-多文件上传【单请求模式】-{{upload_requestOne_plugin_data_info.msg||''}}</legend>
      <button @click="()=>oneInst.open()">添加文件</button>
      <button @click="()=>oneInst.upload({id:'upload_requestOn_plugin'})">上传</button>
      <button @click="()=>oneInst.cancel('single')">取消上传</button>

      <div v-for="file in upload_requestOne_plugin_data" :key="file.id">
        {{file.name}}
        {{file.msg}}
        <button @click="deletefile('oneInst',file.id)">删除</button>
      </div>
    </fieldset>
  </div>
</template>
<script>
import UploadPlugin from "./components/upload";
const uploadURL = window.location.origin + "/api/upload";
export default {
  name: "App",
  components: {},
  data() {
    return {
      upload_plugin_data: [],
      upload_pluginAppend_data: [],
      upload_multiplt_plugin_data: [],
      upload_multiplt_pluginAppend_data: [],
      upload_requestOne_plugin_data: [],
      upload_requestOne_plugin_data_info: { msg: "" }
    };
  },
  methods: {
    deletefile(key, id) {
      this[key] && this[key].remove(id);
    },
    cancel(key, id) {
      this[key] && this[key].cancel(id);
    },
    upload_plugin() {
      this.uInst.open();
    },

    init_upload_event(inst, datas) {
      inst
        .on("before-select", () => {
          console.log("我要开始选择文件啦~~");
        })
        .on("after-select", () => {
          console.log("我选择文件结束啦");
        })
        .on("change", files => {
          datas.splice(
            0,
            datas.length,
            ...files.map(p => ({
              ...p,
              msg: ""
            }))
          );
        })
        .on("progress", (id, data) => {
          console.log("上传中...", id, data);
          let item = datas.filter(p => p.id === id)[0];
          if (item) {
            if (+data.percent >= 100) {
              item.msg = "【上传完成,正在处理...】";
            } else {
              item.msg = this.formatMsg(data);
            }
          }
        })
        .on("success", id => {
          console.log("上传完成");
          let item = datas.filter(p => p.id === id)[0];
          if (item) {
            item.msg = "【上传成功】";
          }
        })
        .on("error", (id, e) => {
          console.log("上传失败", e.readyState, e.status);
          let item = datas.filter(p => p.id === id)[0];
          if (item) {
            item.msg = "【上传失败】";
          }
        });
    },
    init_upload_plugin() {
      this.uInst = new UploadPlugin({
        url: uploadURL,
        accept: ".txt"
      });
      this.init_upload_event(this.uInst, this.upload_plugin_data);
    },
    init_upload_pluginAppend() {
      this.uaInst = new UploadPlugin({
        url: uploadURL,
        append: true
      });
      this.init_upload_event(this.uaInst, this.upload_pluginAppend_data);
    },
    init_upload_multiplt_plugin() {
      this.umInst = new UploadPlugin({
        url: uploadURL,
        multiple: true
      });
      this.init_upload_event(this.umInst, this.upload_multiplt_plugin_data);
    },
    init_upload_multiplt_pluginAppend() {
      this.umaInst = new UploadPlugin({
        url: uploadURL,
        multiple: true,
        append: true,
        accept: ".jpg"
      });
      this.init_upload_event(
        this.umaInst,
        this.upload_multiplt_pluginAppend_data
      );
    },
    init_upload_requestOne_plugin() {
      this.oneInst = new UploadPlugin({
        url: uploadURL,
        multiple: true,
        append: true,
        uploadType: "single",
        accept: ".jpg|.txt"
      })
        .on("progress", (id, data) => {
          this.upload_requestOne_plugin_data_info.msg = this.formatMsg(data);
        })
        .on("success", () => {
          this.upload_requestOne_plugin_data_info.msg = "【上传成功】";
        })
        .on("error", () => {
          this.upload_requestOne_plugin_data_info.msg = "【上传失败】";
        });
      this.init_upload_event(this.oneInst, this.upload_requestOne_plugin_data);
    },
    formatMsg(data) {
      return (
        "【进度:" +
        data.percent +
        "%】【 当前速度:" +
        data.speed.toFixed(2) +
        "】平均速度:" +
        data.AvgSpeed.toFixed(2) +
        "】"
      );
    }
  },
  mounted() {
    this.init_upload_plugin();
    this.init_upload_pluginAppend();
    this.init_upload_multiplt_plugin();
    this.init_upload_multiplt_pluginAppend();
    this.init_upload_requestOne_plugin();
  }
};
</script>

<style >
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
fieldset {
  margin: 10px auto;
}
</style>
