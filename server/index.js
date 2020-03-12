var http = require("http");

var fs = require("fs");

var path = require("path");

var formidable = require("formidable");

var querystring = require("querystring");

var server = http.createServer();

server.on("request", (request, response) => {
  response.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PUT, GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "X-Requested-With",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  if (request.url === "/upload") {
    var form = new formidable.IncomingForm();

    var paramsId = "";
    form.uploadDir = "./test";
    form.keepExtensions = true;
    form.multiples = true; // 多先文件实现

    form
      .on("field", function(name, value) {
        console.log("fied...", name, value);
        paramsId += value;
      })
      .on("file", function(name, file) {
        console.log("name....", name);
      })
      .on("end", function() {
        response.end("end");
        console.log("end");
      });
    form.parse(request, (err, fields, files) => {
      console.log("parse.callback");
      let file = files.file;
      if (file) {
        let _files = Array.isArray(file) ? file : [file];

        for (let i = 0, len = _files.length; i < len; i++) {
          file = _files[i];
          var ran = parseInt(Math.random() * 10000 + 100);
          //拿到扩展名
          var extname = path.extname(file.name);
          //旧的路径
          var oldpath = __dirname + "/" + file.path;
          //新的路径
          var newpath =
            __dirname + "/test/" + paramsId + "-" + Date.now() + ran + extname;
          console.log(newpath, oldpath);
          //改名
          fs.rename(oldpath, newpath, function(err) {
            if (err) {
              throw Error("改名失败");
            }
            // response.writeHead(200, { "content-type": "text/plain" });
            response.end("成功");
          });
        }
      }
    });
  } else {
    response.write(request.url);
    response.end();
  }
});

server.listen(9000);
