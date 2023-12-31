'use strict';

//const DeHelper = require('dehelper');

var DeHelper = null;
if (process.env.USELOCALLIB === "true"){
    DeHelper = require('../../dist/index.js');
}else{
    DeHelper = require('dehelper');
}

const http = require('http');
const path = require('path');
const extend = require('extend');
const express = require('express');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const debug = require('debug')("DeHelperExample");

var config = {
    "httpport": 43080,
    deHelper: {
        login:{
            "adminUsername": "admin",
            "adminPasswordHash": "b1440ed1cc3fc851f994bdcca19f454062564e975fb79a83db24c6b7dea60730",  //  grandstream
        }
    }
}

var app = express();


//This must be the first App Use for Logging of every call.
//This function will get called on every request and if useHttpsClientCertAuth is turned on only allow request with a client cert
app.use(function (req, res, next) {    
    debug( "browser", 'debug',  "url:" + req.originalUrl);
    next();
    return;
})


app.use(express.static(path.join(__dirname, 'public')));

// disable the x-power-by express message in the header
app.disable('x-powered-by');

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(favicon(__dirname + '/public/images/favicon.ico'));

let deHelperLoginConfig = {}

var deHelper = DeHelper(deHelperLoginConfig);

deHelper.attachExpress(app);
//app.use(deauth.expressMiddleWare);


app.use(function (req, res, next) {
    var connInfo = getConnectionInfo(req);
    debug("browser", 'debug',  "path:" + req.path + ", ip:" + connInfo.ip + ", port:" + connInfo.port + ", ua:" + connInfo.ua);
    next();  
})


app.use('/admin/*', function (req, res, next) {

    //if(req.loc)

    var connInfo = getConnectionInfo(req);
    debug("browser", 'debug',  "path:" + req.path + ", ip:" + connInfo.ip + ", port:" + connInfo.port + ", ua:" + connInfo.ua);
    next();
    return;
})

//serve the index.html file or any other static files in the public folder

app.use('/*', function (req, res, next) {
    var filePath = req.baseUrl;

    if (filePath === "/" || filePath === "") {
        filePath = "/index.htm";
    }
    if (fs.existsSync(path.join(__dirname, 'public',filePath)) === true) {
        res.sendFile(filePath, { root: path.join(__dirname, 'public') });  
    } else {
        //This allows any unhandled routes with no extention to be handled by the index.html file on a page refresh
        if(path.extname(filePath) === ""){
            filePath = "/index.htm";
            res.sendFile(filePath, { root: path.join(__dirname, 'public') });
        }else{
            res.sendStatus(404);
        }
    }
});


var getConnectionInfo = function (req) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) === "::ffff:") {
        ip = ip.substr(7);
    }
    var port = req.connection.remotePort;
    var ua = req.headers['user-agent'];
    return { ip: ip, port: port, ua: ua };
};


var http_srv = null;

try {
    http_srv = http.createServer(app).listen(config.httpport, function () {
        console.log("app", 'info', 'Express server listening on http port ' + config.httpport);
        debug("app", 'info', 'Express server listening on http port ' + config.httpport);
    });
} catch (ex) {
    console.log("app", 'error', 'Failed to Start Express server on http port ' + config.httpport, ex);
    debug("app", 'error', 'Failed to Start Express server on http port ' + config.httpport, ex);
}






