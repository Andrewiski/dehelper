"use strict";

const path = require('path');
const extend = require('extend');

var DeAuth = function (options) {
    var self = this;
    var defaultOptions = {
        baseApiUrl: "/deauth/",
    }
    
    self.options = extend({}, defaultOptions, options);
    const debug = require('debug')("deauth");


    var expressMiddleWare = function (req, res, next) {
        
        try {
            
            if (req.url.startsWith(self.baseApiUrl)) {
                let apiPath = req.path.replace(self.baseApiUrl, "");
                switch(apiPath){
                    case "login/login":
                        login(req, res, next);
                        break;
                    case "login/logout":
                        logout(req, res, next);
                        break;
                    case "login/loginData":
                        getLoginData(req, res, next);
                        break;
                    case "errorHandlerTest":
                        errorHandlerTest(req, res, next);
                        break;
                    case "errorHandlerTestRawError":
                        errorHandlerTestRawError(req, res, next);
                        break;
                    case "api/UserInfo":
                        getUserInfo(req, res, next);
                        break;
                    
                }
       
            }else{
                next();
            }
            
            
            
        } catch (ex) {
           debug("error", ex.msg, ex.stack);
        }
        
    }


    function checkUser(username, password, ipAddress, resetLoginFailedIfSuccess) {
        const accountLockFailedAttempts = 5;
        const accountLockMinutes = 5;
        let passwordHash = crypto.createHash('md5').update(password).digest("hex");
        let isvalidUserPass = username.toLowerCase() === objOptions.adminUsername.toLowerCase() && passwordHash === objOptions.adminPasswordHash;
        let msg = "success";
        let isAccountLocked = false;
        if (username.toLowerCase() !== objOptions.adminUsername.toLowerCase()) {
            logUtilHelper.log(appLogName, "app", 'warning', 'login', 'Invalid username ', username);
            msg = "Invalid Username/Password";
        }
    
        //prevent Brute Force
        if (commonData.logins[username.toLowerCase()] && commonData.logins[username.toLowerCase()].ipaddresses[ipAddress] && commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginCount > accountLockFailedAttempts && moment().diff(commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginTimeStamp, 'minutes') < accountLockMinutes) {
    
            isAccountLocked = true;
        }
        if (commonData.logins[username.toLowerCase()] === undefined) {
            commonData.logins[username.toLowerCase()] = {
                ipaddresses: {}
            };
        }
        if (commonData.logins[username.toLowerCase()].ipaddresses[ipAddress] === undefined) {
            commonData.logins[username.toLowerCase()].ipaddresses[ipAddress] = {
                failedLoginCount: 0
            };
        }
        if ((isvalidUserPass === false || isAccountLocked === true) && username.toLowerCase() === objOptions.adminUsername.toLowerCase()) {
            commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginTimeStamp = moment();
            commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginCount++;
    
    
            if (isAccountLocked === true) {
                msg = "User Account is locked for " + accountLockMinutes.toString() + " minutes";
            } else {
                msg = "Invalid Username/Password";
            }
            logUtilHelper.log(appLogName, "app", 'warning', 'login', msg, "username:" + username + ", ip:" + ipAddress + ", isAccountLocked:" + isAccountLocked);
        } else {
            msg = "success";
            if (resetLoginFailedIfSuccess === true) {
                commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginCount = 0;
            }
        }
    
        return { success: isvalidUserPass && !isAccountLocked, username: username, msg: msg, isAccountLocked: isAccountLocked };
    }


    self.getLogLevelAppLogLevels = getLogLevelAppLogLevels;

};
module.exports = DeAuth;
