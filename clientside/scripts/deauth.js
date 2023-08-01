//"use strict"
(function ($) {

    /*
    * deauth  1.0
    * Copyright (c) 2023 Digital Example
    * Date: 2023-05-01
    */

    /** The root class for the deauth framework
    @name deauth
    @class This is the root class for the deauth framework
    */
    $.deauth = $.deauth || {};

    // Extend the deauth class/namespace
    $.extend($.deauth, {

        
        options:{
        },

        common: {
            isInited: false,
            login: {
                isUserLoggedIn: false,
                accessToken: null,
                userInfo: null,
            }
        },
        
        

        appInit: function (options) {
            var deferred = $.Deferred();

            //$.deauth.logToConsole("$.deauth.appInit()");

            try {

                let defaultOptions ={
                    debug: true,
                    onAutoLoginComplete: null,
                    onLoginComplete: null,
                    onLogoutComplete: null,
                    baseUrl: "/deauth/",
                    templateLogin: 'templates/login.htm', 
                    templateModal: 'templates/default.modal.htm',
                    templateError: 'templates/error.htm' 
                }

                if(options){
                    $.extend($.deauth.options, options, defaultOptions);
                }
                //added by Andy so we only Init Once   05/29/2015
                if ($.deauth.common.isInited === false) {
                    $.when(
                        //We want to auto login the user if possible using a RefreshToken
                        $.deauth.autoLogin(),

                    ).done(function (x, data) {
                        //$.deauth.logToConsole("$.deauth.appInit() DONE");

                        $.when(
                            
                        ).done(function (x, data) {
                            $.deauth.common.isInited = true;
                            
                            deferred.resolve();
                        }).fail(function (result) {
                            deferred.reject(result);
                        })
                            .fail(function (result) {
                                deferred.reject(result);
                            });
                    });
                } else {
                    deferred.resolve();
                }
            } catch (ex) {
                $.deauth.logToConsole('Fatal Error $.deauth.appinit: ' + ex.message)
                var objError = $.deauth.createErrorFromScriptException(ex);
                deferred.reject(objError);
            }
            return deferred.promise();
        },




        logToConsole: function (msg) {
            // Is a console defined?
            if ($.deauth && $.deauth.isClientSideDebugging && $.deauth.isClientSideDebugging()) {
                if (window.console && console.log) {
                    var isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
                    if (isChrome) {
                        try {
                            var stack = new Error().stack;
                            var callingFile = stack.split("\n")[2];
                            var url = callingFile.split("(")[1];
                            url = url.substring(0, url.length - 1);
                            var urlparts = url.split("/");
                            var file = urlparts[urlparts.length - 1];
                            //var line = stack.split("\n")[2].split(":")[5];
                            //var append = file + ":" + line;
                            console.log(msg, url);
                        } catch (ex) {
                            console.log(msg);
                        }
                    } else {
                        console.log(msg);
                    }

                }
            }
        },
        getQueryStringParms: function () {
            var queryString = location.search.split('&'),
                  params = {};

            $.each(queryString, function (index, string) {
                var parts = string.split('='),
                    paramName = parts[0].replace(/^\?/gi, '');
                if (params[paramName]) {
                    if (Array.isArray(params[paramName])) {
                        params[paramName].push(parts[1]);
                    } else {
                        // Duplicate names in query string, store as array.
                        var prevValue = params[paramName];
                        params[paramName] = [prevValue, parts[1]];
                    }
                } else {
                    params[paramName] = parts[1];
                }
            });
            return params
        },
        

        getTemplate: function (templateName) {
            var deferred = $.Deferred()
            var myTemplate = $.deauth.common.templateCache[templateName];
            let url = $.deauth.options.baseApiUrl ;
            switch(templateName){
                case "login":
                    url = url + $.deauth.options.templateLogin;
                    break;
                case "modal":
                    url = url + $.deauth.options.templateModal;
                    break;
                case "error":
                    url = url + $.deauth.options.templateError;
            }
            
            $.ajax({
                url: url,
                data: {},
                success: function (data, textStatus, jqXHR) {
                    myTemplate.data = data;
                    myTemplate.isLoaded = true;
                    $.logToConsole('Refreshed Template Cache $.deauth.getTemplateCache ' + templateName + ' : ' + myTemplate.url);
                    deferred.resolve(myTemplate.data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    $.logToConsole('Error fetching Template Cache $.deauth.getTemplateCache ' + templateName + ' : ' + myTemplate.url + ' ' + textStatus + ' ' + errorThrown);
                    deferred.reject(jqXHR, textStatus, errorThrown);
                }
            });
            return deferred.promise();
        },

        


        

        stringToBoolean: function (string) {
            switch (string.toLowerCase()) {
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": case null: return false;
                default: return Boolean(string);
            }
        },



        /* This function will remove reserved jQuery chars from a string 

        Currently it removes    #;&,.+*~':"!^$[]()=>|/%{}
        */
        cleanForjQuery: function (stringToClean) {

            //If this is a string
            if (stringToClean.replace) {
                var newString = stringToClean.replace(/\#/g, '').replace(/\;/g, '').replace(/\&/g, '');
                newString = newString.replace(/\,/g, '').replace(/\./g, '').replace(/\+/g, '');
                newString = newString.replace(/\*/g, '').replace(/\~/g, '').replace(/\'/g, '');
                newString = newString.replace(/\:/g, '').replace(/\"/g, '').replace(/\!/g, '');
                newString = newString.replace(/\^/g, '').replace(/\$/g, '').replace(/\[/g, '');
                newString = newString.replace(/\]/g, '').replace(/\(/g, '').replace(/\)/g, '');
                newString = newString.replace(/\=/g, '').replace(/\>/g, '').replace(/\|/g, '');
                //newString = newString.replace(/\//g, '');
                newString = newString.replace(/\%/g, '');
                newString = newString.replace(/\}/g, '').replace(/\{/g, '');

                return newString;
            }
            else {
                return stringToClean;
            }

        },

        /* This function will escape reserved JSON chars from a JSON object 

        Currently it escapes a single quote, double quote, a forward slash and a backslash with a backslash
        */
        escapeJSON: function (stringToClean) {
            try {
                var newString;

                if (stringToClean.replace) {
                    newString = stringToClean.replace(/\'/g, '').replace(/\"/g, '');
                    //.replace(/\//g, '\\');
                } else {
                    newString = stringToClean;
                }

                return newString;
            }
            catch (ex) {
                console.log("escapeJSON: " + ex + "  String: " + stringToClean); 
            }
        },

        /* 
        Will return a boolean specifying whether a variable is a string or not
        */
        isString: function (a) {
            return typeof a === 'string';
        },

        /* Generate a guid / uuid  --  682db637-0f31-4847-9cdf-25ba9613a75c
        */
        uuid: function uuid() {
            var chars = '0123456789abcdef'.split('');

            var uuid = [], rnd = Math.random, r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4'; // version 4

            for (var i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | rnd() * 16;

                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
                }
            }

            return uuid.join('');
        },
        
       

        /** This is the friendly error we will push out there */
        friendlyError: 'An Error Has Occurred, Please Try Again',

        // Begin Auth ---------------------------------------------------
        authGlobal : {
            loginDialog: { isLoginDialogOpen: false, queuedLoginDialogRequests: [] },
            getNewAccessToken: { isPending: false, queuedRequests: [] }

        },

        displayError: function (objError) {
            let theError;
            if(objError.error){
                theError = objError;
            }else{
                theError = { error: objError }
            }

            return $.deauth.showErrorDialog(theError);
        },
        getErrorAccessIsDenied: function (debug) {
            return $.deauth.createError("Access is denied", debug, "Client Error", "Access is denied", 402);
        },
        handleScriptException: function (ex, exceptionMessage) {
            var objError = $.deauth.createErrorFromScriptException(ex, exceptionMessage);
            return $.deauth.displayError(objError);
        },
        showLoginDialog: function (options) {
            // returns a promise which on success mean login on failure means user cancaled out of login
            var myDefer = jQuery.Deferred();
            //$.deauth.loginDialogGlobal =  {isLoginDialogOpen: false, queuedLoginDialogRequests: []};
            if ($.deauth.authGlobal.loginDialog.isLoginDialogOpen == true) {
                $.deauth.logToConsole("$.deauth.showLoginDialog Dialog Already Open Queueing Promise");
                $.deauth.authGlobal.loginDialog.queuedLoginDialogRequests.push(myDefer);
            } else {
                $.deauth.authGlobal.loginDialog.isLoginDialogOpen = true;
                var trigger = "cancel";

                var defaultOptions = {
                    modalOptions: {backdrop:true, 
                        keyboard:true, 
                        focus:true
                    },
                    loginOptions: {
                        title: "Please Log In",
                        modalSize: "modal-fullscreen-md-down",
                        beforeClose: beforeClose,
                        showExternalLogins: true,
                        closeText: "Cancel"
                    },
                    loginData: {
                        userName: '',
                        password: '',
                        rememberMe: $.deauth.getRememberMeSetting()
                    }
                }
                var myOptions = $.extend(defaultOptions, options);
                var loginData = myOptions.loginData;
                var $dialogElement;
                var $loginModal;

                var beforeClose = function (event, ui) {
                    console.log("BEFORE CLOSE - ", trigger);
                    $.deauth.authGlobal.loginDialog.isLoginDialogOpen = false;
                    if (trigger == 'cancel') {
                        cancelLogin();
                    }
                    return true;
                };
                var showLoading = function () {
                    $dialogElement.find('.dialogContent').hide();
                    $dialogElement.find('.dialogLoading').show();
                };
                var hideLoading = function () {
                    $dialogElement.find('.dialogContent').show();
                    $dialogElement.find('.dialogLoading').hide();
                };
                var attemptLogin = function () {
                    var validationErrors = "";

                    trigger = "login"
                    $('#deauth_login_error').hide();
                    loginData.userName = $('#deauth_login_username').val();
                    loginData.password = $('#deauth_login_password').val();
                    loginData.rememberMe = $('#deauth_login_rememberMe').is(':checked');

                    showLoading();
                    if (!loginData.userName) {
                        validationErrors += '<p>User Name can not be blank.</p>';
                    }
                    if (!loginData.password) {
                        validationErrors += '<p>Password can not be blank.</p>';
                    }
                    if (validationErrors) {
                        hideLoading();
                        $('#deauth_login_errormsg').html(validationErrors);
                        $('#deauth_login_error').show();
                        return;
                    }

                    $.deauth.login({ grant_type: "password", username: loginData.userName, password: loginData.password, rememberMe: loginData.rememberMe }).then(
                        function (aiTokens, userInfo) {
                            //All of the $.deauth.common.login properties should be set at this point so just close down the dialog and resolve the promise
                            
                            hideLoading();
                            //$loginModal.hide();
                            
                            myDefer.resolve(userInfo);
                            while ($.deauth.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                                var myQueueDefered = $.deauth.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                                myQueueDefered.resolve(userInfo);
                            }
                            $.deauth.authGlobal.loginDialog.isLoginDialogOpen = false;
                            $loginModal.dispose();
                            $dialogElement.remove();
                            
                        },
                        function (reason) {
                            console.log('Error: deauth.showLoginDialog() SERVER RETURNED', reason);
                            hideLoading();
                            $('#deauth_login_errormsg').text(reason.message);
                            $('#deauth_login_error').show();
                            trigger = "cancel";
                            $.deauth.authGlobal.loginDialog.isLoginDialogOpen = false;
                            
                        }
                    )
                }
                var cancelLogin = function () {
                    trigger = "cancelclick";
                    $.deauth.logToConsole("Login Dialog Cancel Button Clicked");

                    //$loginModal.hide();
                    
                    var rejectReason = "User Canceled Login Dialog";
                    myDefer.reject(rejectReason);
                    while ($.deauth.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                        var myQueueDefered = $.deauth.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                        myQueueDefered.reject(rejectReason);
                    }
                    $.deauth.authGlobal.loginDialog.isLoginDialogOpen = false;
                    $loginModal.dispose();
                    $dialogElement.remove();
                    
                }
                var setDialogValues = function () {
                    //trigger = "cancel"
                    if (loginData) {
                        $dialogElement.find('#deauth_login_username').val(loginData.userName || '');
                        $dialogElement.find('#deauth_login_password').val(loginData.password || '');
                        $dialogElement.find('#deauth_login_rememberMe').prop('checked', (loginData.rememberMe || false));
                    }

                }


                
                // Get markup for login and show it as a dialog

                $.when($.deauth.getTemplate('defaultModal'), $.deauth.getTemplate('login') ).done(
                    function (defaultModalhtml, loginhtml) {
                        $dialogElement = $(defaultModalhtml);
                        $dialogElement.find('.modal-body').html(loginhtml);
                        if(myOptions.loginOptions.modalSize){
                            $dialogElement.find('.modal-dialog').addClass(myOptions.loginOptions.modalSize);
                        }
                        if(myOptions.loginOptions.title){
                            
                            $dialogElement.find('.modal-title').text(myOptions.loginOptions.title);
                        }
                        $dialogElement.find('.btn-primary')
                            .text("Login")
                            .on('click', attemptLogin)
                            .end();
                            $dialogElement.find('.btn-secondary')
                            .text("Cancel")
                            .on('click', cancelLogin)
                            .end();
                            $dialogElement.find('input')
                            .on('keypress', function (event) {
                                if (event.which === 13) {
                                    attemptLogin();
                                }
                            })
                            .end();
                        
                        $loginModal = new bootstrap.Modal($dialogElement, myOptions.dialogOptions);
                        $loginModal.show();
                        
                        setDialogValues();
                        
                        $dialogContent = $('#deauth_login_dialog');
                    },
                    function () {
                        $.deauth.logToConsole("Error loading Login Dialog HTML");
                    }
                );
            } // end if $.deauth.loginDialogGlobal.isLoginDialogOpen
            return myDefer.promise();
        },

       

        

        logout: function () {

            $.deauth.logToConsole("Debug: $.deauth.logout Called");

            var myDeferred = $.Deferred();
            try {

                $.deauth.logToConsole("Debug: $.deauth.logout sending logout to server")
                $.deauth.ajax({
                    method: "GET",
                    //timeout: 60000,
                    dataType: "json",
                    url: "/deauth/login/logout",
                    success: function (result) {
                        //If no data is returned, spit up a message
                        if (!result || result == null) {
                            $.deauth.logToConsole("CRITICAL ERROR: $.deauth.logout - No Data Returned");
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = $.deauth.createErrorFromScriptException(new Error("No Data Returned"), "No Data returned by server");
                            myDeferred.reject("No Data Returned");
                        }
                        else if (result.error) {
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject(result);
                        }
                        else if (result.success) {
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                            $.deauth.logToConsole("Debug: $.deauth.logout Success");
                            $.deauth.getMenuItems().then(
                                function(){
                                    myDeferred.resolve(result);
                                },
                                function(ex){
                                    myDeferred.reject(ex);
                                }
                            )
                            
                        }
                    },  //End onSuccess
                    error: function (xhr, textStatus, thrownError) {
                        //this clears all of the Storage and UserInfo resets isLoggedIn etc
                        $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                        var objError = $.deauth.createErrorFromAjaxError(xhr, "Server error during logout.");
                        $.deauth.logToConsole("ERROR deauth.logout.refreshToken: " + objError.message);
                        myDeferred.reject(objError);
                    }
                });


            } catch (ex) {
                $.deauth.logToConsole("ERROR deauth.logout: " + ex.toString());
                var objError = $.deauth.createErrorFromScriptException(ex, "Server error during token refresh.");
                myDeferred.reject(ex.toString());
            }
            return myDeferred.promise();
        },

        hasAccessToken: function () {
            var myAccessToken = $.deauth.getAccessToken();
            if (myAccessToken == undefined || myAccessToken == null) {
                return false;
            } else {
                return true;
            }
        },

        hasRefreshToken: function () {
            var myRefreshToken = $.deauth.getRefreshToken();
            if (myRefreshToken == undefined || myRefreshToken == null) {
                return false;
            } else {
                return true;
            }
        },

        getRememberMeSetting: function () {
            
            var rememberMe;

            if ($.deauth.isClientSideDebugging()) {
                $.deauth.logToConsole("Debug: $.deauth.getRememberMeSetting Called");
            }
            

            if (typeof (window.sessionStorage) !== "undefined") {
                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: $.deauth.getRememberMeSetting Browser Supports javascript Storage");
                }

                rememberMe = window.localStorage.deauthRememberMe;

                if (rememberMe) {
                    if ($.deauth.isClientSideDebugging()) {
                        $.deauth.logToConsole("Debug: $.deauth.getRememberMeSetting Found Remember Me in localStorage");
                    }

                    return $.deauth.stringToBoolean(rememberMe);
                }

                rememberMe = window.sessionStorage.deauthRememberMe;

                if (rememberMe) {
                    if ($.deauth.isClientSideDebugging()) {
                        $.deauth.logToConsole("Debug: $.deauth.getRememberMeSetting Found Remember Me Temp sessionStorage");
                    }

                    return $.deauth.stringToBoolean(rememberMe);
                }
            }
            if (Cookies.get("deauthRememberMe")) {
                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: $.deauth.getRememberMeSetting Found Remember Me in Cookies");
                }   
                rememberMe = Cookies.get("deauthRememberMe")
                return $.deauth.stringToBoolean(rememberMe);
            }

            if ($.deauth.isClientSideDebugging()) {
                $.deauth.logToConsole("Debug: $.deauth.getRememberMeSetting no Remember Me found in js storage or cookies");
            }
            return false;
        },


        getAccessToken: function () {
            
            var access_token;

            if ($.deauth.common.login.accessToken) {
                if($.deauth.common.login.accessToken.expiresOnLocal >= new Date()){
                    access_token = $.deauth.common.login.accessToken.access_token
                }
            }
            if (access_token) {
                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: $.deauth.getAccessToken Found access Token in $.deauth.common.login.accessToken");
                }

                return access_token;
            }

            

            
            $.deauth.logToConsole("Debug: $.deauth.getAccessToken no acess token found");
            
            return null;
        },

        getNewAccessToken: function (options) {
            //console.log('in refreshToken()');
            var defaults = {
                data: {
                    grant_type: "refresh_token",
                    refresh_token: $.deauth.getRefreshToken()
                }
            }
            var objOptions = $.extend({}, defaults, options);

            var myDeferred = $.Deferred();
            $.deauth.logToConsole("Debug: $.deauth.getNewAccessToken called");
            try {
                if ($.deauth.authGlobal.getNewAccessToken.isPending == true) {
                    $.deauth.logToConsole("$.deauth.getNewAccessToken Already In Progress Queueing Promise");
                    $.deauth.authGlobal.getNewAccessToken.queuedRequests.push(myDeferred);
                } else {
                    $.deauth.authGlobal.getNewAccessToken.isPending = true;

                    if (objOptions.data.grant_type == "refresh_token" && $.deauth.hasRefreshToken() == false) {
                        //console.log('refreshToken() - myRefreshToken not found');
                        throw (new Error("Missing Refresh Token"));
                    }
                    // call login with the refresh_token
                    $.deauth.login(objOptions.data).then(function (result) {
                        console.log('getNewAccessToken() resolving because its all good');
                        $.deauth.authGlobal.getNewAccessToken.isPending = false;
                        myDeferred.resolve(result);
                        while ($.deauth.authGlobal.getNewAccessToken.queuedRequests.length > 0) {
                            var myQueueDefered = $.deauth.authGlobal.getNewAccessToken.queuedRequests.pop();
                            myQueueDefered.resolve(result);
                        }                        
                    },
                    function (objError) {
                        $.deauth.authGlobal.getNewAccessToken.isPending = false;
                        myDeferred.reject(objError);
                        while ($.deauth.authGlobal.getNewAccessToken.queuedRequests.length > 0) {
                            var myQueueDefered = $.deauth.authGlobal.getNewAccessToken.queuedRequests.pop();
                            myQueueDefered.reject(objError);
                        }
                        
                    }
                    )
                    

                    
                } //end if
            }
            catch (ex) {
                $.deauth.common.login.isUserLoggedIn = false;
                $.deauth.logToConsole("ERROR deauth.getNewAccessToken: " + ex.toString());
                var objError = $.deauth.createErrorFromScriptException(ex, "Server error during getNewAccessToken.");
                console.log('getNewAccessToken() CAUGHT EXCEPTION - REJECTING', ex);
                myDeferred.reject(objError);
            }
            
            return myDeferred.promise();
        },

        getRefreshToken: function () {
            if ($.deauth.isClientSideDebugging()) {
                $.deauth.logToConsole("Debug: $.deauth.getRefreshToken Called");
            }
            var refreshToken;

            if (typeof (window.sessionStorage) !== "undefined") {
                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: $.deauth.getRefreshToken Browser Supports javascript Storage");
                }

                refreshToken = window.localStorage.deauthRefreshToken;

                if (refreshToken) {
                    if ($.deauth.isClientSideDebugging()) {
                        $.deauth.logToConsole("Debug: $.deauth.getRefreshToken Found Refresh Token in localStorage");
                    }

                    return refreshToken;
                }

                refreshToken = window.sessionStorage.deauthRefreshToken;

                if (refreshToken) {
                    if ($.deauth.isClientSideDebugging()) {
                        $.deauth.logToConsole("Debug: $.deauth.getRefreshToken Found Token in Temp sessionStorage");
                    }

                    return refreshToken;
                }
            }
            if (Cookies.get("deauthRefreshToken")) {
                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: $.deauth.getRefreshToken Found Refresh Token in Cookies");
                }                    
                return Cookies.get("deauthRefreshToken");
            }

            if ($.deauth.isClientSideDebugging()) {
                $.deauth.logToConsole("Debug: $.deauth.getRefreshToken no refresh token found in js storage or cookies");
            }
            return;
        },

        ajax: function (url, options) {
            var deferred = $.Deferred(),
                promise = deferred.promise(),
                defaultOptions = {
                    showErrorDialog: true,
                    showLoginOn401Error: true,
                    contentType: "application/json",
                    dataType: 'json',
                    async: true,
                    cache: false,
                    success: $.noop,
                    error: $.noop,
                    complete: $.noop,
                    beforeSend: $.noop
                };



            options = options || {};

            if (typeof url === "object") {
                options = url;
            } else {
                options.url = url;
            }

            if ($.deauth.isClientSideDebugging()) {
                $.deauth.logToConsole("Debug: Preparing to make a ajax call to: " + options.url);
            }

            // Overwrite default options with specified options
            var clonedDefaults = $.extend(true, defaultOptions, options);
            if (clonedDefaults.method == undefined && clonedDefaults.type == undefined) {
                if (clonedDefaults.data) {
                    clonedDefaults.method = "POST";
                } else {
                    clonedDefaults.method = "GET";
                }
            }
            var orginalCallbacks = {
                error: clonedDefaults.error,
                success: clonedDefaults.success,
                complete: clonedDefaults.complete,
                onBeforeSend: clonedDefaults.beforeSend
            };

            //If Json and data is object not string then stringify it 
            if (clonedDefaults.dataType == "json" && typeof (clonedDefaults.data) === "object") {
                clonedDefaults.data = JSON.stringify(clonedDefaults.data);
            }
            var addAccessTokenHeader = function (jqXHR, settings) {
                if (settings.crossDomain) {
                    return;
                }
                // Do not pass in accessToken we always use the current accessToken for the current login or pass undefined if not logged in
                if ($.deauth.hasAccessToken()) {
                    if (settings && settings.headers && settings.headers.Authorization) {
                        $.deauth.logToConsole("$.deauth.ajax Authorization Header was overwriten by Calling Function")
                    } else {
                        jqXHR.setRequestHeader('Authorization', 'Bearer ' + $.deauth.getAccessToken());
                    }

                }

                if (orginalCallbacks.onBeforeSend) {
                    orginalCallbacks.onBeforeSend(jqXHR, settings);
                }
            }

            clonedDefaults.error = null;
            clonedDefaults.success = null;
            clonedDefaults.complete = null;
            clonedDefaults.beforeSend = addAccessTokenHeader;

            function retryCallback() {
                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: deauth.ajax: doing $.ajax call to:" + clonedDefaults.url);
                }
                $.ajax(clonedDefaults).then(onSuccess, onError)
            }

            //Make the call 
            retryCallback();

            function onSuccess(data, textStatus, jqXHR) {
                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: deauth.ajax: call successful to url:" + clonedDefaults.url);
                }


                orginalCallbacks.success(data, textStatus, jqXHR);

                deferred.resolve(data, textStatus, jqXHR);
            }

            function onError(jqXHR, textStatus, errorThrown) {
                function rejectCallback(reason) {
                    var objError = $.deauth.createErrorFromScriptException(new Error("deauth.ajax " + reason), reason);
                    orginalCallbacks.error(jqXHR, reason, objError);
                    deferred.reject(jqXHR, reason, objError);
                };

                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: deauth.ajax: call error to url:" + clonedDefaults.url + " status:" + jqXHR.status + ", statusText:" + jqXHR.statusText);
                }
                console.info('$.deauth.ajax onError() - Received status code [%s] and reason [%s]', jqXHR.status, jqXHR.statusText);

                switch (jqXHR.status) {
                    // Don't need this any more as default Error Handler will handle this 
                    //case 0:
                    //User is offline

                    // Don't need this any more as default Error Handler will handle this
                    //case 402:
                    // HTTP 402, Access is denied you tried to access a document that you do not have permissions to 

                    case 401:
                        if (clonedDefaults.showLoginOn401Error && jqXHR.statusText ==="Unauthorized" && jqXHR.responseJSON   ) {
                            // This is a unauthorized the StatusText tells us if this is an "Access Is 
                            // Denied" or "Not Logged In". If "Not Logged In" we need to try to refresh 
                            // the accessToken if we have a refreshToken or throw the Login Prompt  To specificaly throw Access is Denied as 
                            // in user is logged in but does not have permission 
                            // All API methods should be wrapped in Try Catch 

                            switch (jqXHR.responseJSON.error) {
                                case "Login Failed":
                                    $.deauth.showLoginDialog().then(retryCallback, rejectCallback);
                                    break;
                                case "Invalid RefreshToken":
                                    $.deauth.logToConsole("Debug: deauth.ajax: call error to url:\"" + clonedDefaults.url + "\". Refresh Token is invalid, clearing all the currently logged in information including refresh and auth tokens from storage");
                                    $.deauth._clearLoginAccessTokenRefreshTokenAppCookie();
                                    $.deauth.showLoginDialog().then(retryCallback, rejectCallback);
                                    break;
                                case "Invalid AccessToken":
                                    if ($.deauth.hasRefreshToken()) {
                                        // Attempt to use the refresh token. If the server rejects the token as 
                                        // having been expired, show login 
                                        $.deauth.getNewAccessToken().then(
                                            retryCallback,
                                            function (objError) {
                                                //console.log('accessToken timeout - attempted getNewAccessToken() failed, reason: ', objError)
                                                switch (objError.StatusCode) {
                                                    case 401: // This is the invalid or timed out getNewAccessToken error so throw the login Dialog
                                                        $.deauth.showLoginDialog().then(retryCallback, rejectCallback);
                                                        break;
                                                    default:  //This is some other error such as server is down but happened during our token refresh so throw the error dialog
                                                        $.deauth.logToConsole("Fatal Error Refreshing Token");
                                                        if (clonedDefaults.showErrorDialog == true) {
                                                            $.deauth.showErrorDialog({ "error": objError }).then(retryCallback, rejectCallback);
                                                        } else {
                                                            deferred.reject(jqXHR, reason, objError);
                                                        }
                                                }
                                            }
                                        );
                                    } else {
                                        // User does not have a refreshToken or LoginTrackCookie so show the Login dialog
                                        $.deauth.showLoginDialog().then(retryCallback, rejectCallback);
                                    }
                                    break;
                            }
                        } else {
                            rejectCallback('');
                        }
                        break;
                    default:
                        if (clonedDefaults.url.indexOf('Log_Insert_Same_Event') == -1) {
                            $.deauth.logToConsole("Error Returned from Server Call to " + $.deauth.cleanForjQuery(clonedDefaults.url + ", Error: " + errorThrown));
                        }

                        var objError = $.deauth.createErrorFromAjaxError(jqXHR, "Error deauth.ajax: Server error during call to " + $.deauth.cleanForjQuery(clonedDefaults.url));
                        if (clonedDefaults.showErrorDialog) {
                            $.deauth.showErrorDialog({ "error": objError }).then(retryCallback, rejectCallback);
                        } else {
                            deferred.reject(jqXHR, textStatus, objError);
                        }
                }
            }


            promise.always(orginalCallbacks.complete);
            return promise;
        },

        _setStorageRefreshToken: function (refreshToken, rememberMe) {
            if (typeof (window.sessionStorage) !== "undefined") {
                if (rememberMe == true) {
                    // Code for localStorage/sessionStorage.
                    window.localStorage.setItem("deauthRefreshToken", refreshToken.refresh_token);
                    window.localStorage.setItem("deauthRefreshTokenExpiresOn", refreshToken.expiresOn);
                    window.localStorage.setItem("deauthRememberMe", "true")
                } else {
                    window.sessionStorage.setItem("deauthRefreshToken", refreshToken.refresh_token)
                    window.sessionStorage.setItem("deauthRefreshTokenExpiresOn", refreshToken.expiresOn)
                    window.localStorage.setItem("deauthRememberMe", "false")
                }
            } else {
                Cookies.set("deauthRefreshToken", refreshToken.refresh_token);
                Cookies.set("deauthRefreshTokenExpiresOn", refreshToken.expiresOn);
                Cookies.set("deauthRememberMe", rememberMe)
            }
        },
        _clearStorageRefreshToken: function () {
            if (typeof (window.sessionStorage) !== "undefined") {
                window.localStorage.removeItem("deauthRefreshToken")
                window.sessionStorage.removeItem("deauthRefreshToken")
                window.localStorage.removeItem("deauthRefreshTokenExpiresOn")
                window.sessionStorage.removeItem("deauthRefreshTokenExpiresOn")
            }
            Cookies.remove("deauthRefreshToken");
            Cookies.remove("deauthRefreshTokenExpiresOn");
            
        },

        setAccessToken: function (accessToken) {
            //This code is here to set the expires in if we have a clock drift
            accessToken.expiresOnLocal = new Date(new Date().getTime() + (accessToken.expiresIn * 1000));
            $.deauth.common.login.accessToken = accessToken;
        },

        
        _clearLoginAccessTokenRefreshTokenAiToken: function () {
            $.deauth._clearStorageRefreshToken();
            //$.deauth._clearStorageAccessToken();
            $.deauth.common.login.accessToken = null;
            $.deauth.common.login.userInfo = null;
            $.deauth.common.login.isUserLoggedIn = false;
        },

       /*
        This function is used to get the current Logged In User UserInfo using the current AccessToken
        */
        getUserInfo: function (options) {
            var myDeferred = $.Deferred();
            var defaults = {
                method: 'GET',
                url: "/deauth/api/UserInfo"
            }
            var objOptions = $.extend({}, defaults, options);
            if ($.deauth.isClientSideDebugging()) {
                $.deauth.logToConsole("Debug: $.deauth.getUserInfo Called");
            }
            $.deauth.ajax(objOptions).then(function (result) {
                myDeferred.resolve(result);
            },
            function (result) {
                myDeferred.reject(result);
            })
            return myDeferred.promise();
        },
        /*
        This function is used to fetch an refreshToken, accessToken, a userInfo for a user returns a promise object
        */


        login: function (options) {

            var myDeferred = $.Deferred();

            try {

                if ($.deauth.isClientSideDebugging()) {
                    $.deauth.logToConsole("Debug: Calling $.deauth.login");
                }

                var defaultOptions = {
                    grant_type: "password",   //can be password, externalBearer, refresh_token
                    username: null,
                    password: null,
                    token: null, //if using a externalBearer token set it here
                    refresh_token: null,
                    rememberMe: $.deauth.getRememberMeSetting()
                    
                }
                var myOptions = $.extend(defaultOptions, options);
                //Check for username and password
                if (myOptions.grant_type == "password") {
                    if (myOptions.username == null || !$.trim(myOptions.username)) {
                        myDeferred.reject($.deauth.createError("username is missing"));
                        return myDeferred.promise();

                    } else if (myOptions.password == null || !$.trim(myOptions.password)) {
                        myDeferred.reject($.deauth.createError("password is missing"));
                        return myDeferred.promise();
                    }
                }

                $.ajax({
                    type: "POST",
                    //timeout: 60000,
                    dataType: "json",
                    //contentType: "application/json",
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    //data: JSON.stringify(postdata),
                    data: myOptions,
                    url: $.deauth.properties.options.baseApiUrl + 'login',
                    success: function (result) {
                        //If no data is returned, show message
                        if (!result) {
                            $.deauth.logToConsole("Error Login: " + "No Data Returned");

                            $.deauth.common.login.isUserLoggedIn = false;
                            $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = $.deauth.createErrorFromScriptException(new Error("No Data Returned"), "No Data returned by server");
                            myDeferred.reject(objError);

                        }
                        else if (result.error) {
                            //if (options.debug)
                            //    $.deauth.logToConsole("Called deauth.login.fetchToken: DATA RETURNED");
                            $.deauth.logToConsole("Error login result.error: " + result.error);
                            $.deauth.common.login.isUserLoggedIn = false;
                            $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject(result);

                        }
                        else if (result.accessToken) {
                            $.deauth.logToConsole("Debug: $.deauth.login Success");
                            $.deauth._processLoginInfo(result, myOptions.rememberMe).then(
                                function (userInfo) {
                                    myDeferred.resolve(userInfo);
                                },
                                function (objError) {
                                    myDeferred.reject(objError);
                                }
                            );

                        }else{
                            $.deauth.logToConsole("Error login unknown error: " + result);
                            $.deauth.common.login.isUserLoggedIn = false;
                            $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject({message:"Unknown Login Error missing refreshToken", error:"Unknown Login Error"});
                        }

                    },  //End onSuccess
                    error: function (xhr, textStatus, thrownError) {
                        $.deauth.common.login.isUserLoggedIn = false;
                        $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                        var objError = $.deauth.createErrorFromAjaxError(xhr, "Server error during login.");
                        $.deauth.logToConsole("ERROR deauth.login.fetchToken: " + objError.message);

                        myDeferred.reject(objError);
                    }

                });


            }
            catch (ex) {
                $.deauth.logToConsole("ERROR deauth.login.fetchToken: " + ex);
                $.deauth.common.login.isUserLoggedIn = false;
                var objError = $.deauth.createErrorFromScriptException(ex);
                myDeferred.reject(objError);
            }
            return myDeferred.promise();
        },

        /*
          This function is common to login and register user as it handles the returned accessToken, refresh Token Data
        */
        _processLoginInfo: function (result, rememberMe, fetchUserInfo) {
            var myDeferred = $.Deferred();
            try {
                if (result.accessToken) {
                    $.deauth.setAccessToken(result.accessToken, rememberMe);
                }
                //Store the refreshToken for subsequent calls
                if (result.refreshToken) {
                    $.deauth._setStorageRefreshToken(result.refreshToken, rememberMe);
                } else {
                    // Don't clear the refreshToken as it won't be returned with refresh_token calls
                    //$.deauth._clearStorageRefreshToken();
                }

                //Login is only Successfull if we can also use the new token to get the userInfo /disable loginprompt and show error
                if (fetchUserInfo == undefined || fetchUserInfo == true) {
                    $.when($.deauth.getUserInfo({ showErrorDialog: false, showLoginOn401Error: false })) //, $.deauth.getUserSettings({ showErrorDialog: false, showLoginOn401Error: false })
                        .then(function (userInfoResults){ //, userSettingResults) {
                            $.deauth.common.login.userInfo = userInfoResults;
                            $.deauth.common.login.isUserLoggedIn = true;
                            $.deauth.getMenuItems().then(
                                function(){
                                    myDeferred.resolve(userInfoResults);
                                },
                                function(ex){
                                    $.deauth.logToConsole("ERROR deauth.login.getUserInfo.getMenuItems: " + objError.message);        
                                    myDeferred.reject(ex);
                                }
                            )
                            
                            //$.deauth.common.settings.user = userSettingResults;

                            
                        }, function (userInfoResultsError) { //, userSettingResultsError) {
                            $.deauth.common.login.isUserLoggedIn = false;
                            $.deauth._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = userInfoResultsError || userSettingResultsError; //$.deauth.createErrorFromAjaxError(userInfoResultsError, "Error retriving UserInfo during ProcessLoginInfo.");
                            $.deauth.logToConsole("ERROR deauth.login.getUserInfo: " + objError.message);
                            myDeferred.reject(objError);
                        });
                } else {
                    myDeferred.resolve();
                }
            } catch (ex) {
                $.deauth.logToConsole("ERROR deauth.login.fetchToken: " + ex);
                $.deauth.common.login.isUserLoggedIn = false;
                var objError = $.deauth.createErrorFromScriptException(ex);
                myDeferred.reject(objError);
            }
            return myDeferred.promise();
        },


        /* 
            the autologin function returns a promise that is always resolved even if there is no refresh token used in deauth.appinit.
            The purpose of this function is to check to see if the accessToken is avalible and is not expired
            if its not avalible but a refreshToken is avalible then the refresh Token is set to the server to exchange for
        */

        autoLogin: function () {
            var myDeferred = $.Deferred();
            //console.info('in autologin()');
            try {
                if ($.deauth.isClientSideDebugging())
                    $.deauth.logToConsole("Debug: $.deauth.autoLogin called");

                if ($.deauth.hasRefreshToken()) {
                    $.deauth.getNewAccessToken()
                        .done(function () {
                            if ($.deauth.isClientSideDebugging()) {
                                $.deauth.logToConsole("Debug: $.deauth.autoLogin success");
                            }
                            //console.log('autologin() refreshtoken().done');
                            myDeferred.resolve();
                        })
                        .fail(function () {
                            if ($.deauth.isClientSideDebugging()) {
                                $.deauth.logToConsole("Debug: $.deauth.autoLogin failed");
                            }
                            //console.log('autologin() refreshtoken().failed');
                            //console.trace()
                            //This function should never reject
                            myDeferred.resolve();
                        })
                } else {
                    $.deauth.logToConsole("Debug: $.deauth.autoLogin no RefreshToken or aspnet.cookie Found so skipping autologin ");
                    //we always resolve in autologin
                    myDeferred.resolve();
                }

            }

            catch (ex) {
                $.deauth.logToConsole("ERROR $.deauth.autoLogin: " + ex.toString());
                //this must be a resolve as its autologin and even if it errors it should be successful
                myDeferred.resolve();
            }

            return myDeferred.promise();
        },

        isClientSideDebugging: function () {
            //localhost always has clientside debuging enabled
            if (document.location.hostname == "localhost" || document.location.hostname == "127.0.0.1") {
                return true;
            }
            //if ($.deauth.common.settings.isClientSideDebugging == null) {
            var DebugSetting = $.deauth.options.debug;
            if (DebugSetting) {
                //$.deauth.common.settings.isClientSideDebugging = DebugSetting;
                return DebugSetting;
            } else {
                //$.deauth.common.settings.isClientSideDebugging = false;
                return false;
            }
            //} else {
            //    return $.deauth.common.settings.isClientSideDebugging;
            //}
        },
        

        // Begin Auth

        isUserInRole: function (roleId) {
            var foundRole = false;
            if ($.deauth.common.login.isUserLoggedIn && $.deauth.common.login.userInfo.roles) {
                $.each($.deauth.common.login.userInfo.roles, function (index, value) {
                    if (value.roleId == roleId) {
                        foundRole = true;
                        return false;
                    }
                })
            } 

            return foundRole;
           
        },

        isUserInRoleName: function (roleName) {
            var foundRole = false;
            if ($.deauth.common.login.isUserLoggedIn && $.deauth.common.login.userInfo.roles) {
                roleName = roleName.toLowerCase();
                $.each($.deauth.common.login.userInfo.roles, function (index, value) {
                    if (value.roleName.toLowerCase() == roleName) {
                        foundRole = true;
                        return false;
                    }
                })
            }

            return foundRole;

        },

        isUserLoggedIn: function () {
            
            if ($.deauth.common.login.isUserLoggedIn === true ) {
                        return true;
            
            }else{
                return false;
            }

        },

        
        // End Auth -------------------------------------------------------

        


        //Begin Common Error Handler


        showErrorDialog: function (options) {
            //console.log('auth.js showErrorDialog()');
            //returns a promise which on success mean login on failur means user cancaled out of login
            var myDefer = jQuery.Deferred();
            var trigger = "cancel";
            var beforeClose = function (event, ui) {
                if (trigger === 'cancel') {
                    onCancelClick();
                }
                return true;
            }
            var defaultOptions = {
                dialogOptions: {backdrop:true, keyboard: true, focus:true},
                error: undefined,
                showRetry: true,
                showCancel: true
            }
            var myOptions = $.extend(defaultOptions, options);

            if (options.error == undefined || options.error == null) {
                options.error = $.uisptools.createErrorFromScriptException("Default Error Handler Error", "Default Error Handler Error");
            }

            var $dialogElement = $('#uisptools_error_dialog');  //If its already added to the page select it
            var $errorModal = null;
            var onRetryClick = function () {
                trigger = "retry"
                $dialogElement.find('#uisptools_error_dialog_error').hide();
                $.logToConsole("Error Dialog Retry Button Clicked");
                //$dialogElement.dialog("close");
                $errorModal.hide();
                myDefer.resolve("Retry");
            }
            var onCancelClick = function () {
                trigger = "cancelclick";
                $.logToConsole("Error Dialog Cancel Button Clicked");
                if (myOptions.showCancel == false) {
                    myDefer.resolve("User Canceled Error Dialog");
                } else {
                    myDefer.reject("User Canceled Error Dialog");
                }

                //$dialogElement.dialog("close");
                $errorModal.hide();
            }
            var onOkClick = function () {
                trigger = "okclick";
                $.logToConsole("Error Dialog Ok Button Clicked");
                if (myOptions.showCancel == false) {
                    myDefer.resolve("User Ok Error Dialog");
                } else {
                    myDefer.reject("User Ok Error Dialog");
                }

                //$dialogElement.dialog("close");
                $errorModal.hide();
            }

            var setDialogValues = function () {
                trigger = "cancel";
                $dialogElement.find("#uisptools_error_dialog_errorMessageDetails_displayedErrorMessage").text(myOptions.error.message);
                $dialogElement.find("#uisptools_error_dialog_errorMessageDetails_ExceptionType").text(myOptions.error.exceptionType);
                $dialogElement.find("#uisptools_error_dialog_errorMessageDetails_ExceptionMessage").text(myOptions.error.exceptionMessage);
                var stacktrace = myOptions.error.stackTrace;

                //TODO: This approach for displaying the stack trace is a problem waiting to happen if the stack trace contains markup
                //      we should leave the newlines alone and put the stacktrace inside a <pre> using jquery's .text()
                //
                //if (typeof stacktrace === 'string') {
                //    stacktrace = stacktrace.replace(/\n/gi, '<br/>');
                //}
                //$("#uisptools_error_dialog_errorMessageDetails_StackTrace").html(stacktrace);                
                $dialogElement.find("#uisptools_error_dialog_errorMessageDetails_StackTrace").text(stacktrace);
                $dialogElement.find('#uisptools_error_dialog_messageContent_Default').hide();
                $dialogElement.find('#uisptools_error_dialog_messageContent_NoInternet').hide();
                $dialogElement.find('#uisptools_error_dialog_messageContent_AccessDenied').hide();
                $dialogElement.find('#uisptools_error_dialog_messageContent_NotFound').hide();
                switch (myOptions.error.statusCode) {
                    case 0:
                        $dialogElement.find('#uisptools_error_dialog_messageContent_NoInternet').show();
                        break;
                    case 402:
                        $dialogElement.find('#uisptools_error_dialog_messageContent_AccessDenied').show();
                        break;
                    case 404:
                        $dialogElement.find('#uisptools_error_dialog_messageContent_NotFound').show();
                        break;
                    default:
                        $dialogElement.find('#uisptools_error_dialog_messageContent_Default').show();
                        break;
                }
                $dialogElement.find('#uisptools_error_dialog_messageContent').show();
                $dialogElement.find('#uisptools_error_dialog_errorMessage_details').hide();

            }
            var toggleErrorDetails = function (){
                $dialogElement.find('#uisptools_error_dialog_messageContent').toggle();
                $dialogElement.find('#uisptools_error_dialog_errorMessage_details').toggle();
            }
            var initDialog = function () {
                $dialogElement.find('#uisptools_error_dialog_btnRetry').off("click.uisptools");
                $dialogElement.find('#uisptools_error_dialog_btnCancel').off("click.uisptools");
                $dialogElement.find('#uisptools_error_dialog_btnOk').off("click.uisptools");
                $dialogElement.find('#uisptools_error_dialog_btnRetry').on("click.uisptools", onRetryClick);
                $dialogElement.find('#uisptools_error_dialog_btnCancel').on("click.uisptools", onCancelClick);
                $dialogElement.find('#uisptools_error_dialog_btnOk').on("click.uisptools", onOkClick);
                if (myOptions.showRetry == false) {
                    $dialogElement.find('#uisptools_error_dialog_btnRetry').hide();
                }
                if (myOptions.showCancel == false) {
                    $dialogElement.find('#uisptools_error_dialog_btnCancel').hide();
                }
                if (myOptions.showOk == false) {
                    $dialogElement.find('#uisptools_error_dialog_btnOk').hide();
                }
                if (myOptions.showDetails == false) {
                    $dialogElement.find('#uisptools_error_dialog_btnShowDetails').hide();
                }
                $dialogElement.find('#uisptools_error_dialog_btnShowDetails').on("click",toggleErrorDetails);

                setDialogValues();
                $errorModal.show();
            }

            if ($dialogElement.length == 0) {
                
                $.uisptools.getTemplate('error').then(
                    function (html) {
                        //$dialogElement = $('<div id="uisptools_error_dialog"></div>'); 
                        $dialogElement = $(html); 
                        //$dialogElement.html(html);
                        //let dialogOptions = {backdrop:true, keyboard: true, focus:true};
                        $errorModal = new bootstrap.Modal($dialogElement, myOptions.dialogOptions);
                        //$errorModal = bootstrap.Modal.getInstance($dialogElement);
                        initDialog();
                    },
                    function () {
                        $.logToConsole("Error loading Error Dialog HTML");
                    }
                );

            } else {
                //setDialogValues();
                // had to unbind and rebind to get myOptions update wierd but myOptions would stay to last values when bound not update like they got scoped funny
                if($errorModal === null){
                    $errorModal = bootstrap.Modal.getInstance($dialogElement);
                }
                initDialog();
            }

            //$dialogElement.dialog(myOptions.dialogOptions);
            //$dialogElement.dialog("open");
            
            return myDefer.promise();
        },

        createError: function (message, exceptionmessage, exceptiontype, stacktrace, statusCode) {
            if (statusCode == undefined) {
                statusCode = 500;
            }
            if (exceptionmessage == undefined) {
                exceptionmessage = message;
            }
            if (exceptiontype == undefined) {
                exceptiontype = 'client';
            }
            if (stacktrace == undefined) {
                try {
                    //We Throw an Error that was we get the full Javascript Stack Trace so we can tell what functions were called to get here
                    //throw ("Dummy Error");
                    throw new Error("Dummy Error");
                } catch (ex) {
                    stacktrace = ex.stack;
                }
            }
            return { "error": true, "message": message, "exceptionMessage": exceptionmessage, "exceptionType": exceptiontype, "stackTrace": stacktrace, "statusCode": statusCode };
        },
        createErrorFromScriptException: function (ex, exceptionMessage) {
            if (!exceptionMessage) {
                exceptionMessage = $.deauth.friendlyError;
            }
            if (typeof (ex) !== "object") {
                try {
                    var ex2;

                    if (typeof (ex) === "String") {
                        ex2 = new Error(ex)
                    } else {
                        ex2 = new Error("Invalid Error Type passed into createErrorFromScriptException")
                    }

                    throw (ex2);
                } catch (ex3) {
                    ex = ex3
                }
            }
            var msg = ex.message;
            var fullmsg = '';
            try {
                fullmsg = "Java Script Error: " + exceptionMessage + ':' + msg +
                    "Name:" + ex.name + "\n" +
                    "Message:" + ex.message + "\n" +
                    "File Name:" + ex.fileName + "\n" +
                    "Line Number:" + ex.lineNumber + "\n" +
                    "Stack Trace:" + ex.stack + "\n";

            } catch (ex2) {
                fullmsg = fullmsg + "CRITICAL ERROR: Building Error Message createErrorFromScriptException:" + ex2.toString();
            }
            return $.deauth.createError(msg, exceptionMessage, "Client Error", fullmsg, 9999);
        },

        createErrorFromAjaxError: function (xhr, exceptionMessage) {
            xhr = xhr || {};
            exceptionMessage = exceptionMessage || $.deauth.friendlyError;
            var msg = (xhr.statusText || $.deauth.friendlyError),
                myurl = (xhr.url || ''),
                statusnum = ((xhr.status != undefined) ? xhr.status : 500),
                fullmsg = '',
                javascriptStackTrace = '';

            try {
                //We Throw an Error that was we get the full Javascript Stack Trace so we can tell what functions were called to get here
                //throw ("Dummy Error");
                throw new Error("Dummy Error");
            } catch (ex) {
                javascriptStackTrace = ex.stack;
            }

            try {
                //var statuscode = xhr.statusCode();
                if (xhr.responseJSON && (typeof xhr.responseJSON.error === 'string' || xhr.responseJSON.error == true)) {
                    var errorMsg = xhr.responseJSON.error_description || xhr.responseJSON.message || xhr.responseJSON.error;
                    var errorExceptionMessage = xhr.responseJSON.exceptionMessage || xhr.responseJSON.error;
                    //If this is a WebApi2 error then the statusCode will be a json object of type CTMError
                    fullmsg = "Message: Error during Ajax Request to " + myurl + "\n" +
                        "Status Code:" + xhr.status + "\n" +
                        "Status:" + xhr.responseJSON.exceptionType || xhr.statusText + "\n" +
                        "Status Text:" + errorExceptionMessage + "\n" +
                        "Server Message:" + errorMsg + "\n" +
                        "Server StackTrace:" + xhr.responseJSON.stackTrace || '' + "\n" +
                        "Response Headers:" + xhr.getAllResponseHeaders() + "\n" +
                        "Client Exception:" + exceptionMessage + "\n" +
                        "Client Message:" + msg + "\n" +
                        "Client StackTrace:" + javascriptStackTrace;
                    return $.deauth.createError(errorMsg, errorExceptionMessage, "Server Error", fullmsg, xhr.status);
                } else {
                    fullmsg = "Message: Error during Ajax Request to " + myurl + "\n" +
                        "Status Code:" + xhr.status + "\n" +
                        "Status:" + statusnum + "\n" +
                        "Status Text:" + xhr.statusText + "\n" +
                        "Server Message:\n" +
                        "Server StackTrace:\n" +
                        "Response Headers:" + xhr.getAllResponseHeaders() + "\n" +
                        "Client Exception:" + exceptionMessage + "\n" +
                        "Client Message:" + msg + "\n" +
                        "Client StackTrace:" + javascriptStackTrace;
                }
                return $.deauth.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            } catch (ex) {
                fullmsg += "Error Building Error Message createErrorFromAjaxError:" + ex.toString();
                return $.deauth.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            }

        }

        //End Common Error Handler
    });
})(jQuery);

$(function () {
    $.deauth.appInit().then(
        function () {

        },
        function (err) {
            console.log('error', err)
        }

    )
})
