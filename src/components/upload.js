(function(global, factory) {
  "use strict";
  /*global define*/
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(global);
  } else if (typeof define === "function" && define.amd) {
    define("UploadPlugin", [], factory);
  } else {
    global.UploadPlugin = factory(global);
  }
})(typeof window !== "undefined" ? window : this, function() {
  var nativeHasOwn = Object.prototype.hasOwnProperty;
  function inherits(clazz, baseClazz) {
    var clazzPrototype = clazz.prototype;
    function F() {}
    F.prototype = baseClazz.prototype;
    clazz.prototype = new F();

    for (var prop in clazzPrototype) {
      clazz.prototype[prop] = clazzPrototype[prop];
    }
    clazz.prototype.constructor = clazz;
    clazz.superClass = baseClazz;
  }

  function extend(target, source) {
    for (var key in source) {
      if (nativeHasOwn.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function bind(fn, context) {
    if (Function.prototype.bind) {
      return fn.bind(context);
    }
    return function FunctionBindProxy() {
      fn.apply(context, Array.prototype.slice.call(arguments));
    };
  }

  function uuid() {
    var _u4 = function() {
      return [1, 2, 3, 4]
        .map(function() {
          return Math.ceil(Math.random() * 15)
            .toString(16)
            .toLocaleUpperCase();
        })
        .join("");
    };
    return _u4() + "-" + _u4() + "-" + _u4() + "-" + _u4();
  }
  var Emitter = function() {
    this.listener = {};
  };

  Emitter.prototype = {
    constructor: Emitter,
    on: function on(name, fn, context) {
      var list = this.listener[name] || (this.listener[name] = []);
      list.push({
        name: name,
        fn: fn,
        context: context
      });
      return this;
    },
    once: function once(name, fn, context) {
      var list = this.listener[name] || (this.listener[name] = []);
      var that = this;

      var proxyFuntion = function proxyFuntion() {
        var res = fn.apply(context || this, arguments);
        that.off(name, proxyFuntion);
        return res;
      };

      list.push({
        name: name,
        fn: proxyFuntion,
        context: context
      });
      return this;
    },
    off: function off(name, fn, context) {
      var list = this.listener[name] || (this.listener[name] = []);

      for (var i = list.length; i >= 0; i--) {
        var item = list[i];

        if (item.fn === fn || item.context === context) {
          list.splice(i, 1);
        }
      }

      return this;
    },
    emit: function emit(name) {
      var list = this.listener[name] || (this.listener[name] = []);

      for (
        var _len = arguments.length,
          args = new Array(_len > 1 ? _len - 1 : 0),
          _key = 1;
        _key < _len;
        _key++
      ) {
        args[_key - 1] = arguments[_key];
      }

      for (var i = 0, len = list.length; i < len; i++) {
        var _list$i = list[i],
          fn = _list$i.fn,
          context = _list$i.context;
        fn.apply(context, args);
      }

      return this;
    }
  };

  var DEAFULT_UPLOAD_CONFIG = {
    url: "", // 上传地址
    multiple: false, // 是否多选
    // 多个文件上传方式
    //multiple: 多请求上传模式，每个可单独取消，查看进度
    //single:  单请求上传模式 当多个文件上传时，只能查看总进度，取消所有上传
    uploadType: "multiple",
    append: false, // 是否追加
    field: "file", // 上传字段
    accept: "*" // 上传文件类型
  };
  var UploadPlugin = function(options) {
    Emitter.call(this);
    this.files = [];
    this.__uploadStack = [];
    this.config = extend({}, DEAFULT_UPLOAD_CONFIG);
    this._init(options);
    this._createInput();
  };
  UploadPlugin.prototype = {
    constructor: UploadPlugin,
    _init: function(options) {
      for (var attr in DEAFULT_UPLOAD_CONFIG) {
        if (attr in options) {
          this.config[attr] = options[attr];
        }
      }
    },

    _createInput: function() {
      this._$input = document.createElement("input");
      this._$input.setAttribute("type", "file");
      if (this.config.multiple) {
        this._$input.setAttribute("multiple", "multiplt");
      }
      if (this.config.type !== "*") {
        this._$input.setAttribute(
          "accept",
          getAceeptsByType(this.config.accept)
        );
      }
      this._$input.addEventListener(
        "change",
        bind(this._onChange, this),
        false
      );
    },

    _onChange: function() {
      var that = this;
      var equal = function(file1, file2) {
        return (
          file1.name === file2.name &&
          file1.type === file2.type &&
          file1.size === file2.size
        );
      };
      var exist = function(file) {
        return that.files.some(function(f) {
          return equal(f.file, file);
        });
      };
      var files = (function(files) {
        var list = [];
        for (var i = 0, len = files.length; i < len; i++) {
          var file = files[i];
          if (exist(file)) continue;
          list.push({
            id: uuid(),
            name: file.name,
            type: file.type,
            size: file.size,
            file: file,
            status: "pending" // | 'uploading' | 'canceled' | 'uploaded' // todo
          });
        }
        return list;
      })(this._$input.files);
      if (!this.config.append || !this.files.length) {
        this.files = files;
      } else {
        this.files = this.files.concat(files);
      }
      /*eslint no-debugger: 0*/
      this.emit("after-select", this.files, this);
      this.emit("change", this.files, this);
    },

    open: function() {
      this.emit("before-select", this);
      this._$input.click();
    },

    request(data, id) {
      var that = this;
      var startTime;
      var prevTime;
      var prevLoaded = 0;
      return post({
        url: this.config.url,
        data: data,
        success: function() {
          that.emit("success", id);
        },
        fail: function(e) {
          that.emit("error", id, e);
        },
        start: function(e) {
          startTime = prevTime = Date.now();
          that.emit("start", id, e);
        },
        progress: function(e) {
          var data = {
            percent: ((e.loaded / e.total) * 100).toFixed(2),
            speed: (e.loaded - prevLoaded) / (Date.now() - prevTime),
            AvgSpeed: e.loaded / (Date.now() - startTime),
            total: e.total,
            loaded: e.loaded
          };
          prevLoaded = e.loaded;
          prevTime = Date.now();
          that.emit("progress", id, data);
        }
      });
    },
    upload: function(data) {
      var that = this;
      var parseFormdata = function(formdata) {
        data = data || {};
        for (var attr in data) {
          if (nativeHasOwn.call(data, attr)) {
            formdata.append(attr, data[attr]);
          }
        }
        return formdata;
      };
      if (this.config.uploadType === "single") {
        var formdata = new window.FormData();
        this.files.forEach(function(file) {
          formdata.append(that.config.field, file.file);
        });
        parseFormdata(formdata);
        this.__uploadStack.push({
          id: "upload_single",
          task: this.request(formdata, "upload_all")
        });
      } else {
        Array.prototype.forEach.call(this.files, function(file) {
          var formdata = new window.FormData();
          formdata.append(that.config.field, file.file);
          parseFormdata(formdata);
          that.__uploadStack.push({
            id: "upload_" + file.id,
            task: that.request(formdata, file.id)
          });
        });
      }
    },
    cancel: function(id) {
      var stack = this.__uploadStack || [];
      for (var i = 0, len = stack.length; i < len; i++) {
        if (stack[i].id === "upload_" + id) {
          stack[i].task.abort();
          break;
        }
      }
    },
    remove: function(id) {
      this.files = this.files.filter(function(file) {
        return file.id !== id;
      });
      this.emit("change", this.files, this);
    }
  };
  inherits(UploadPlugin, Emitter);

  function post(data) {
    var xhr = new XMLHttpRequest();
    xhr.open("post", data.url);
    xhr.onreadystatechange = function(e) {
      if (xhr.status == 200) {
        if (xhr.readyState == 4) {
          data.success(e, xhr);
        }
      } else {
        console.log(xhr.readyState, xhr.status, "--------");
        data.fail(e, xhr);
      }
    };
    xhr.upload.onprogress = function(event) {
      data.progress(event);
    };
    xhr.upload.onloadstart = function(event) {
      data.start(event);
    };
    xhr.send(data.data);

    return xhr;
  }

  var ACCEPT_MAPS = {
    ".3gpp": "audio/3gpp",
    ".ac3": "audio/ac3",
    ".asf": "allpication/vnd.ms-asf",
    ".au": "audio/basic",
    ".css": "text/css",
    ".csv": "text/csv",
    ".doc": "application/msword",
    ".dot": "application/msword",
    ".dtd": "application/xml-dtd",
    ".dwg": "image/vnd.dwg",
    ".dxf": "image/vnd.dxf",
    ".gif": "image/gif",
    ".htm": "text/html",
    ".html": "text/html",
    ".jp2": "image/jp2",
    ".jpe": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript，",
    ".json": "application/json",
    ".mp2": "audio/mpeg，",
    ".mp3": "audio/mpeg",
    ".mp4": "audio/mp4，",
    ".mpeg": "video/mpeg",
    ".mpg": "video/mpeg",
    ".mpp": "application/vnd.ms-project",
    ".ogg": "application/ogg，",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".pot": "application/vnd.ms-powerpoint",
    ".pps": "application/vnd.ms-powerpoint",
    ".ppt": "application/vnd.ms-powerpoint",
    ".rtf": "application/rtf，",
    ".svf": "image/vnd.svf",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".txt": "text/plain",
    ".wdb": "application/vnd.ms-works",
    ".wps": "application/vnd.ms-works",
    ".xhtml": "application/xhtml+xml",
    ".xlc": "application/vnd.ms-excel",
    ".xlm": "application/vnd.ms-excel",
    ".xls": "application/vnd.ms-excel",
    ".xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
    ".xlt": "application/vnd.ms-excel",
    ".xlw": "application/vnd.ms-excel",
    ".xml": "text/xml，",
    ".zip": "aplication/zip",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xltx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    ".potx":
      "application/vnd.openxmlformats-officedocument.presentationml.template",
    ".ppsx":
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".sldx":
      "application/vnd.openxmlformats-officedocument.presentationml.slide",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".dotx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    ".xlsb": "application/vnd.ms-excel.sheet.binary.macroEnabled.12"
  };

  function getAceeptsByType(type) {
    var types = type.split("|");
    var accepts = [];
    for (var i = 0, len = types.length; i < len; i++) {
      type = ACCEPT_MAPS[types[i]];
      if (type) {
        accepts.push(type);
      }
    }
    return accepts.join(",");
  }

  return UploadPlugin;
});
