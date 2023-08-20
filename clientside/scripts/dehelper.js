//"use strict"
(function ($) {

    /*
    * dehelper  1.0
    * Copyright (c) 2023 Digital Example
    * Date: 2023-08-01
    */

    /** The root class for the dehelper framework
    @name dehelper
    @class This is the root class for the dehelper framework
    */
    $.dehelper = $.dehelper || {};

    // Extend the dehelper class/namespace
    $.extend($.dehelper, {

        
        options:{
        },

        common: {
            isInited: false,
            login: {
                isUserLoggedIn: false,
                accessToken: null,
                userInfo: null,
            },
            settings: {
                system: {},
                user: {}
            },
            menu: {
                menuItems: [],
                subMenuItems: [],
                currentMenu: null
            },
            templateCache: []
        },
        appInit: function (options) {
            var deferred = $.Deferred();
            //$.dehelper.logToConsole("$.dehelper.appInit()");
            try {
                let defaultOptions ={
                    debug: true,
                    onAutoLoginComplete: null,
                    onLoginComplete: null,
                    onLogoutComplete: null,
                    baseUrl: "/dehelper/",
                    templateLogin: 'public/templates/login.htm', 
                    templateModal: 'public/templates/default.modal.htm',
                    templateError: 'public/templates/error.htm', 
                    templateMenuItems: 'public/templates/menuItems.htm',
                }

                if(options){
                    $.extend($.dehelper.options, options, defaultOptions);
                }
                //added by Andy so we only Init Once   05/29/2015
                if ($.dehelper.common.isInited === false) {
                    $.when(
                        //We want to auto login the user if possible using a RefreshToken
                        $.dehelper.autoLogin()

                    ).done(function (x, data) {
                        //$.dehelper.logToConsole("$.dehelper.appInit() DONE");
                        $.when(
                            $.dehelper.getMenuItems(),    
                            $.dehelper.loadPageContent()
                        ).done(function (x, data) {
                            $.dehelper.common.isInited = true;
                            deferred.resolve();
                        }).fail(function (result) {
                            deferred.reject(result);
                        })
                    })
                    .fail(function (result) {
                        deferred.reject(result);
                    });
                    ;
                } else {
                    deferred.resolve();
                }
            } catch (ex) {
                $.dehelper.logToConsole('Fatal Error $.dehelper.appinit: ' + ex.message)
                var objError = $.dehelper.createErrorFromScriptException(ex);
                deferred.reject(objError);
            }
            return deferred.promise();
        },

        logToConsole: function (msg) {
            // Is a console defined?
            if ($.dehelper && $.dehelper.isClientSideDebugging && $.dehelper.isClientSideDebugging()) {
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
            var myTemplate = $.dehelper.common.templateCache[templateName];
            let url = $.dehelper.options.baseUrl ;
            switch(templateName){
                case "login":
                    url = url + $.dehelper.options.templateLogin;
                    break;
                case "modal":
                    url = url + $.dehelper.options.templateModal;
                    break;
                case "error":
                    url = url + $.dehelper.options.templateError;
                case "menuitems":
                    url = url + $.dehelper.options.templateMenuItems;
            }
            if(myTemplate){
                deferred.resolve(myTemplate.data);
            }
            else{
                $.dehelper.common.templateCache[templateName] = {url: url, data:null, isLoaded:false};
                myTemplate = $.dehelper.common.templateCache[templateName];
                $.ajax({
                    url: url,
                    data: {},
                    success: function (data, textStatus, jqXHR) {
                        myTemplate.data = data;
                        myTemplate.isLoaded = true;
                        $.dehelper.logToConsole('Refreshed Template Cache $.dehelper.getTemplateCache ' + templateName + ' : ' + myTemplate.url);
                        deferred.resolve(myTemplate.data);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $.dehelper.logToConsole('Error fetching Template Cache $.dehelper.getTemplateCache ' + templateName + ' : ' + myTemplate.url + ' ' + textStatus + ' ' + errorThrown);
                        deferred.reject(jqXHR, textStatus, errorThrown);
                    }
                });
            }
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

            return $.dehelper.showErrorDialog(theError);
        },
        getErrorAccessIsDenied: function (debug) {
            return $.dehelper.createError("Access is denied", debug, "Client Error", "Access is denied", 402);
        },
        handleScriptException: function (ex, exceptionMessage) {
            var objError = $.dehelper.createErrorFromScriptException(ex, exceptionMessage);
            return $.dehelper.displayError(objError);
        },

        
        showLoginDialog: function (options) {
            // returns a promise which on success mean login on failure means user cancaled out of login
            var myDefer = jQuery.Deferred();
            //$.dehelper.loginDialogGlobal =  {isLoginDialogOpen: false, queuedLoginDialogRequests: []};
            if ($.dehelper.authGlobal.loginDialog.isLoginDialogOpen == true) {
                $.dehelper.logToConsole("$.dehelper.showLoginDialog Dialog Already Open Queueing Promise");
                $.dehelper.authGlobal.loginDialog.queuedLoginDialogRequests.push(myDefer);
            } else {
                $.dehelper.authGlobal.loginDialog.isLoginDialogOpen = true;
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
                        rememberMe: $.dehelper.getRememberMeSetting()
                    }
                }
                var myOptions = $.extend(defaultOptions, options);
                var loginData = myOptions.loginData;
                var $dialogElement;
                var $loginModal;

                var beforeClose = function (event, ui) {
                    console.log("BEFORE CLOSE - ", trigger);
                    $.dehelper.authGlobal.loginDialog.isLoginDialogOpen = false;
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
                    $('#dehelper_login_error').hide();
                    loginData.userName = $('#dehelper_login_username').val();
                    loginData.password = $('#dehelper_login_password').val();
                    loginData.rememberMe = $('#dehelper_login_rememberMe').is(':checked');

                    showLoading();
                    if (!loginData.userName) {
                        validationErrors += '<p>User Name can not be blank.</p>';
                    }
                    if (!loginData.password) {
                        validationErrors += '<p>Password can not be blank.</p>';
                    }
                    if (validationErrors) {
                        hideLoading();
                        $('#dehelper_login_errormsg').html(validationErrors);
                        $('#dehelper_login_error').show();
                        return;
                    }

                    $.dehelper.login({ grant_type: "password", username: loginData.userName, password: loginData.password, rememberMe: loginData.rememberMe }).then(
                        function (aiTokens, userInfo) {
                            //All of the $.dehelper.common.login properties should be set at this point so just close down the dialog and resolve the promise
                            
                            hideLoading();
                            //$loginModal.hide();
                            
                            myDefer.resolve(userInfo);
                            while ($.dehelper.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                                var myQueueDefered = $.dehelper.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                                myQueueDefered.resolve(userInfo);
                            }
                            $.dehelper.authGlobal.loginDialog.isLoginDialogOpen = false;
                            $loginModal.dispose();
                            $dialogElement.remove();
                            
                        },
                        function (reason) {
                            console.log('Error: dehelper.showLoginDialog() SERVER RETURNED', reason);
                            hideLoading();
                            $('#dehelper_login_errormsg').text(reason.message);
                            $('#dehelper_login_error').show();
                            trigger = "cancel";
                            $.dehelper.authGlobal.loginDialog.isLoginDialogOpen = false;
                            
                        }
                    )
                }
                var cancelLogin = function () {
                    trigger = "cancelclick";
                    $.dehelper.logToConsole("Login Dialog Cancel Button Clicked");

                    //$loginModal.hide();
                    
                    var rejectReason = "User Canceled Login Dialog";
                    myDefer.reject(rejectReason);
                    while ($.dehelper.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                        var myQueueDefered = $.dehelper.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                        myQueueDefered.reject(rejectReason);
                    }
                    $.dehelper.authGlobal.loginDialog.isLoginDialogOpen = false;
                    $loginModal.dispose();
                    $dialogElement.remove();
                    
                }
                var setDialogValues = function () {
                    //trigger = "cancel"
                    if (loginData) {
                        $dialogElement.find('#dehelper_login_username').val(loginData.userName || '');
                        $dialogElement.find('#dehelper_login_password').val(loginData.password || '');
                        $dialogElement.find('#dehelper_login_rememberMe').prop('checked', (loginData.rememberMe || false));
                    }

                }


                
                // Get markup for login and show it as a dialog

                $.when($.dehelper.getTemplate('modal'), $.dehelper.getTemplate('login') ).done(
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
                        
                        $loginModal = new bootstrap.Modal($dialogElement, myOptions.modalOptions);
                        $loginModal.show();
                        
                        setDialogValues();
                        
                        $dialogContent = $('#dehelper_login_dialog');
                    },
                    function () {
                        $.dehelper.logToConsole("Error loading Login Dialog HTML");
                    }
                );
            } // end if $.dehelper.loginDialogGlobal.isLoginDialogOpen
            return myDefer.promise();
        },

       

        

        logout: function () {

            $.dehelper.logToConsole("Debug: $.dehelper.logout Called");

            var myDeferred = $.Deferred();
            try {

                $.dehelper.logToConsole("Debug: $.dehelper.logout sending logout to server")
                $.dehelper.ajax({
                    method: "GET",
                    //timeout: 60000,
                    dataType: "json",
                    url: "/dehelper/login/logout",
                    success: function (result) {
                        //If no data is returned, spit up a message
                        if (!result || result == null) {
                            $.dehelper.logToConsole("CRITICAL ERROR: $.dehelper.logout - No Data Returned");
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = $.dehelper.createErrorFromScriptException(new Error("No Data Returned"), "No Data returned by server");
                            myDeferred.reject("No Data Returned");
                        }
                        else if (result.error) {
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject(result);
                        }
                        else if (result.success) {
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                            $.dehelper.logToConsole("Debug: $.dehelper.logout Success");
                            $.dehelper.getMenuItems().then(
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
                        $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                        var objError = $.dehelper.createErrorFromAjaxError(xhr, "Server error during logout.");
                        $.dehelper.logToConsole("ERROR dehelper.logout.refreshToken: " + objError.message);
                        myDeferred.reject(objError);
                    }
                });


            } catch (ex) {
                $.dehelper.logToConsole("ERROR dehelper.logout: " + ex.toString());
                var objError = $.dehelper.createErrorFromScriptException(ex, "Server error during token refresh.");
                myDeferred.reject(ex.toString());
            }
            return myDeferred.promise();
        },

        hasAccessToken: function () {
            var myAccessToken = $.dehelper.getAccessToken();
            if (myAccessToken == undefined || myAccessToken == null) {
                return false;
            } else {
                return true;
            }
        },

        hasRefreshToken: function () {
            var myRefreshToken = $.dehelper.getRefreshToken();
            if (myRefreshToken == undefined || myRefreshToken == null) {
                return false;
            } else {
                return true;
            }
        },

        getRememberMeSetting: function () {
            
            var rememberMe;

            if ($.dehelper.isClientSideDebugging()) {
                $.dehelper.logToConsole("Debug: $.dehelper.getRememberMeSetting Called");
            }
            

            if (typeof (window.sessionStorage) !== "undefined") {
                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: $.dehelper.getRememberMeSetting Browser Supports javascript Storage");
                }

                rememberMe = window.localStorage.dehelperRememberMe;

                if (rememberMe) {
                    if ($.dehelper.isClientSideDebugging()) {
                        $.dehelper.logToConsole("Debug: $.dehelper.getRememberMeSetting Found Remember Me in localStorage");
                    }

                    return $.dehelper.stringToBoolean(rememberMe);
                }

                rememberMe = window.sessionStorage.dehelperRememberMe;

                if (rememberMe) {
                    if ($.dehelper.isClientSideDebugging()) {
                        $.dehelper.logToConsole("Debug: $.dehelper.getRememberMeSetting Found Remember Me Temp sessionStorage");
                    }

                    return $.dehelper.stringToBoolean(rememberMe);
                }
            }
            if (Cookies.get("dehelperRememberMe")) {
                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: $.dehelper.getRememberMeSetting Found Remember Me in Cookies");
                }   
                rememberMe = Cookies.get("dehelperRememberMe")
                return $.dehelper.stringToBoolean(rememberMe);
            }

            if ($.dehelper.isClientSideDebugging()) {
                $.dehelper.logToConsole("Debug: $.dehelper.getRememberMeSetting no Remember Me found in js storage or cookies");
            }
            return false;
        },


        getAccessToken: function () {
            
            var access_token;

            if ($.dehelper.common.login.accessToken) {
                if($.dehelper.common.login.accessToken.expiresOnLocal >= new Date()){
                    access_token = $.dehelper.common.login.accessToken.access_token
                }
            }
            if (access_token) {
                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: $.dehelper.getAccessToken Found access Token in $.dehelper.common.login.accessToken");
                }

                return access_token;
            }

            

            
            $.dehelper.logToConsole("Debug: $.dehelper.getAccessToken no acess token found");
            
            return null;
        },

        getNewAccessToken: function (options) {
            //console.log('in refreshToken()');
            var defaults = {
                data: {
                    grant_type: "refresh_token",
                    refresh_token: $.dehelper.getRefreshToken()
                }
            }
            var objOptions = $.extend({}, defaults, options);

            var myDeferred = $.Deferred();
            $.dehelper.logToConsole("Debug: $.dehelper.getNewAccessToken called");
            try {
                if ($.dehelper.authGlobal.getNewAccessToken.isPending == true) {
                    $.dehelper.logToConsole("$.dehelper.getNewAccessToken Already In Progress Queueing Promise");
                    $.dehelper.authGlobal.getNewAccessToken.queuedRequests.push(myDeferred);
                } else {
                    $.dehelper.authGlobal.getNewAccessToken.isPending = true;

                    if (objOptions.data.grant_type == "refresh_token" && $.dehelper.hasRefreshToken() == false) {
                        //console.log('refreshToken() - myRefreshToken not found');
                        throw (new Error("Missing Refresh Token"));
                    }
                    // call login with the refresh_token
                    $.dehelper.login(objOptions.data).then(function (result) {
                        console.log('getNewAccessToken() resolving because its all good');
                        $.dehelper.authGlobal.getNewAccessToken.isPending = false;
                        myDeferred.resolve(result);
                        while ($.dehelper.authGlobal.getNewAccessToken.queuedRequests.length > 0) {
                            var myQueueDefered = $.dehelper.authGlobal.getNewAccessToken.queuedRequests.pop();
                            myQueueDefered.resolve(result);
                        }                        
                    },
                    function (objError) {
                        $.dehelper.authGlobal.getNewAccessToken.isPending = false;
                        myDeferred.reject(objError);
                        while ($.dehelper.authGlobal.getNewAccessToken.queuedRequests.length > 0) {
                            var myQueueDefered = $.dehelper.authGlobal.getNewAccessToken.queuedRequests.pop();
                            myQueueDefered.reject(objError);
                        }
                        
                    }
                    )
                    

                    
                } //end if
            }
            catch (ex) {
                $.dehelper.common.login.isUserLoggedIn = false;
                $.dehelper.logToConsole("ERROR dehelper.getNewAccessToken: " + ex.toString());
                var objError = $.dehelper.createErrorFromScriptException(ex, "Server error during getNewAccessToken.");
                console.log('getNewAccessToken() CAUGHT EXCEPTION - REJECTING', ex);
                myDeferred.reject(objError);
            }
            
            return myDeferred.promise();
        },

        getRefreshToken: function () {
            if ($.dehelper.isClientSideDebugging()) {
                $.dehelper.logToConsole("Debug: $.dehelper.getRefreshToken Called");
            }
            var refreshToken;

            if (typeof (window.sessionStorage) !== "undefined") {
                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: $.dehelper.getRefreshToken Browser Supports javascript Storage");
                }

                refreshToken = window.localStorage.dehelperRefreshToken;

                if (refreshToken) {
                    if ($.dehelper.isClientSideDebugging()) {
                        $.dehelper.logToConsole("Debug: $.dehelper.getRefreshToken Found Refresh Token in localStorage");
                    }

                    return refreshToken;
                }

                refreshToken = window.sessionStorage.dehelperRefreshToken;

                if (refreshToken) {
                    if ($.dehelper.isClientSideDebugging()) {
                        $.dehelper.logToConsole("Debug: $.dehelper.getRefreshToken Found Token in Temp sessionStorage");
                    }

                    return refreshToken;
                }
            }
            if (Cookies.get("dehelperRefreshToken")) {
                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: $.dehelper.getRefreshToken Found Refresh Token in Cookies");
                }                    
                return Cookies.get("dehelperRefreshToken");
            }

            if ($.dehelper.isClientSideDebugging()) {
                $.dehelper.logToConsole("Debug: $.dehelper.getRefreshToken no refresh token found in js storage or cookies");
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

            if ($.dehelper.isClientSideDebugging()) {
                $.dehelper.logToConsole("Debug: Preparing to make a ajax call to: " + options.url);
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
                if ($.dehelper.hasAccessToken()) {
                    if (settings && settings.headers && settings.headers.Authorization) {
                        $.dehelper.logToConsole("$.dehelper.ajax Authorization Header was overwriten by Calling Function")
                    } else {
                        jqXHR.setRequestHeader('Authorization', 'Bearer ' + $.dehelper.getAccessToken());
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
                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: dehelper.ajax: doing $.ajax call to:" + clonedDefaults.url);
                }
                $.ajax(clonedDefaults).then(onSuccess, onError)
            }

            //Make the call 
            retryCallback();

            function onSuccess(data, textStatus, jqXHR) {
                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: dehelper.ajax: call successful to url:" + clonedDefaults.url);
                }


                orginalCallbacks.success(data, textStatus, jqXHR);

                deferred.resolve(data, textStatus, jqXHR);
            }

            function onError(jqXHR, textStatus, errorThrown) {
                function rejectCallback(reason) {
                    var objError = $.dehelper.createErrorFromScriptException(new Error("dehelper.ajax " + reason), reason);
                    orginalCallbacks.error(jqXHR, reason, objError);
                    deferred.reject(jqXHR, reason, objError);
                };

                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: dehelper.ajax: call error to url:" + clonedDefaults.url + " status:" + jqXHR.status + ", statusText:" + jqXHR.statusText);
                }
                console.info('$.dehelper.ajax onError() - Received status code [%s] and reason [%s]', jqXHR.status, jqXHR.statusText);

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
                                    $.dehelper.showLoginDialog().then(retryCallback, rejectCallback);
                                    break;
                                case "Invalid RefreshToken":
                                    $.dehelper.logToConsole("Debug: dehelper.ajax: call error to url:\"" + clonedDefaults.url + "\". Refresh Token is invalid, clearing all the currently logged in information including refresh and auth tokens from storage");
                                    $.dehelper._clearLoginAccessTokenRefreshTokenAppCookie();
                                    $.dehelper.showLoginDialog().then(retryCallback, rejectCallback);
                                    break;
                                case "Invalid AccessToken":
                                    if ($.dehelper.hasRefreshToken()) {
                                        // Attempt to use the refresh token. If the server rejects the token as 
                                        // having been expired, show login 
                                        $.dehelper.getNewAccessToken().then(
                                            retryCallback,
                                            function (objError) {
                                                //console.log('accessToken timeout - attempted getNewAccessToken() failed, reason: ', objError)
                                                switch (objError.StatusCode) {
                                                    case 401: // This is the invalid or timed out getNewAccessToken error so throw the login Dialog
                                                        $.dehelper.showLoginDialog().then(retryCallback, rejectCallback);
                                                        break;
                                                    default:  //This is some other error such as server is down but happened during our token refresh so throw the error dialog
                                                        $.dehelper.logToConsole("Fatal Error Refreshing Token");
                                                        if (clonedDefaults.showErrorDialog == true) {
                                                            $.dehelper.showErrorDialog({ "error": objError }).then(retryCallback, rejectCallback);
                                                        } else {
                                                            deferred.reject(jqXHR, reason, objError);
                                                        }
                                                }
                                            }
                                        );
                                    } else {
                                        // User does not have a refreshToken or LoginTrackCookie so show the Login dialog
                                        $.dehelper.showLoginDialog().then(retryCallback, rejectCallback);
                                    }
                                    break;
                            }
                        } else {
                            rejectCallback('');
                        }
                        break;
                    default:
                        if (clonedDefaults.url.indexOf('Log_Insert_Same_Event') == -1) {
                            $.dehelper.logToConsole("Error Returned from Server Call to " + $.dehelper.cleanForjQuery(clonedDefaults.url + ", Error: " + errorThrown));
                        }

                        var objError = $.dehelper.createErrorFromAjaxError(jqXHR, "Error dehelper.ajax: Server error during call to " + $.dehelper.cleanForjQuery(clonedDefaults.url));
                        if (clonedDefaults.showErrorDialog) {
                            $.dehelper.showErrorDialog({ "error": objError }).then(retryCallback, rejectCallback);
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
                    window.localStorage.setItem("dehelperRefreshToken", refreshToken.refresh_token);
                    window.localStorage.setItem("dehelperRefreshTokenExpiresOn", refreshToken.expiresOn);
                    window.localStorage.setItem("dehelperRememberMe", "true")
                } else {
                    window.sessionStorage.setItem("dehelperRefreshToken", refreshToken.refresh_token)
                    window.sessionStorage.setItem("dehelperRefreshTokenExpiresOn", refreshToken.expiresOn)
                    window.localStorage.setItem("dehelperRememberMe", "false")
                }
            } else {
                Cookies.set("dehelperRefreshToken", refreshToken.refresh_token);
                Cookies.set("dehelperRefreshTokenExpiresOn", refreshToken.expiresOn);
                Cookies.set("dehelperRememberMe", rememberMe)
            }
        },
        _clearStorageRefreshToken: function () {
            if (typeof (window.sessionStorage) !== "undefined") {
                window.localStorage.removeItem("dehelperRefreshToken")
                window.sessionStorage.removeItem("dehelperRefreshToken")
                window.localStorage.removeItem("dehelperRefreshTokenExpiresOn")
                window.sessionStorage.removeItem("dehelperRefreshTokenExpiresOn")
            }
            Cookies.remove("dehelperRefreshToken");
            Cookies.remove("dehelperRefreshTokenExpiresOn");
            
        },

        setAccessToken: function (accessToken) {
            //This code is here to set the expires in if we have a clock drift
            accessToken.expiresOnLocal = new Date(new Date().getTime() + (accessToken.expiresIn * 1000));
            $.dehelper.common.login.accessToken = accessToken;
        },

        
        _clearLoginAccessTokenRefreshTokenAiToken: function () {
            $.dehelper._clearStorageRefreshToken();
            //$.dehelper._clearStorageAccessToken();
            $.dehelper.common.login.accessToken = null;
            $.dehelper.common.login.userInfo = null;
            $.dehelper.common.login.isUserLoggedIn = false;
        },

       /*
        This function is used to get the current Logged In User UserInfo using the current AccessToken
        */
        getUserInfo: function (options) {
            var myDeferred = $.Deferred();
            var defaults = {
                method: 'GET',
                url: $.dehelper.options.baseUrl + "UserInfo"
            }
            var objOptions = $.extend({}, defaults, options);
            if ($.dehelper.isClientSideDebugging()) {
                $.dehelper.logToConsole("Debug: $.dehelper.getUserInfo Called");
            }
            $.dehelper.ajax(objOptions).then(function (result) {
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

                if ($.dehelper.isClientSideDebugging()) {
                    $.dehelper.logToConsole("Debug: Calling $.dehelper.login");
                }

                var defaultOptions = {
                    grant_type: "password",   //can be password, externalBearer, refresh_token
                    username: null,
                    password: null,
                    token: null, //if using a externalBearer token set it here
                    refresh_token: null,
                    rememberMe: $.dehelper.getRememberMeSetting()
                    
                }
                var myOptions = $.extend(defaultOptions, options);
                //Check for username and password
                if (myOptions.grant_type == "password") {
                    if (myOptions.username == null || !$.trim(myOptions.username)) {
                        myDeferred.reject($.dehelper.createError("username is missing"));
                        return myDeferred.promise();

                    } else if (myOptions.password == null || !$.trim(myOptions.password)) {
                        myDeferred.reject($.dehelper.createError("password is missing"));
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
                    url: $.dehelper.properties.options.baseApiUrl + 'login',
                    success: function (result) {
                        //If no data is returned, show message
                        if (!result) {
                            $.dehelper.logToConsole("Error Login: " + "No Data Returned");

                            $.dehelper.common.login.isUserLoggedIn = false;
                            $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = $.dehelper.createErrorFromScriptException(new Error("No Data Returned"), "No Data returned by server");
                            myDeferred.reject(objError);

                        }
                        else if (result.error) {
                            //if (options.debug)
                            //    $.dehelper.logToConsole("Called dehelper.login.fetchToken: DATA RETURNED");
                            $.dehelper.logToConsole("Error login result.error: " + result.error);
                            $.dehelper.common.login.isUserLoggedIn = false;
                            $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject(result);

                        }
                        else if (result.accessToken) {
                            $.dehelper.logToConsole("Debug: $.dehelper.login Success");
                            $.dehelper._processLoginInfo(result, myOptions.rememberMe).then(
                                function (userInfo) {
                                    myDeferred.resolve(userInfo);
                                },
                                function (objError) {
                                    myDeferred.reject(objError);
                                }
                            );

                        }else{
                            $.dehelper.logToConsole("Error login unknown error: " + result);
                            $.dehelper.common.login.isUserLoggedIn = false;
                            $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject({message:"Unknown Login Error missing refreshToken", error:"Unknown Login Error"});
                        }

                    },  //End onSuccess
                    error: function (xhr, textStatus, thrownError) {
                        $.dehelper.common.login.isUserLoggedIn = false;
                        $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                        var objError = $.dehelper.createErrorFromAjaxError(xhr, "Server error during login.");
                        $.dehelper.logToConsole("ERROR dehelper.login.fetchToken: " + objError.message);

                        myDeferred.reject(objError);
                    }

                });


            }
            catch (ex) {
                $.dehelper.logToConsole("ERROR dehelper.login.fetchToken: " + ex);
                $.dehelper.common.login.isUserLoggedIn = false;
                var objError = $.dehelper.createErrorFromScriptException(ex);
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
                    $.dehelper.setAccessToken(result.accessToken, rememberMe);
                }
                //Store the refreshToken for subsequent calls
                if (result.refreshToken) {
                    $.dehelper._setStorageRefreshToken(result.refreshToken, rememberMe);
                } else {
                    // Don't clear the refreshToken as it won't be returned with refresh_token calls
                    //$.dehelper._clearStorageRefreshToken();
                }

                //Login is only Successfull if we can also use the new token to get the userInfo /disable loginprompt and show error
                if (fetchUserInfo == undefined || fetchUserInfo == true) {
                    $.when($.dehelper.getUserInfo({ showErrorDialog: false, showLoginOn401Error: false })) //, $.dehelper.getUserSettings({ showErrorDialog: false, showLoginOn401Error: false })
                        .then(function (userInfoResults){ //, userSettingResults) {
                            $.dehelper.common.login.userInfo = userInfoResults;
                            $.dehelper.common.login.isUserLoggedIn = true;
                            $.dehelper.getMenuItems().then(
                                function(){
                                    myDeferred.resolve(userInfoResults);
                                },
                                function(ex){
                                    $.dehelper.logToConsole("ERROR dehelper.login.getUserInfo.getMenuItems: " + objError.message);        
                                    myDeferred.reject(ex);
                                }
                            )
                            
                            //$.dehelper.common.settings.user = userSettingResults;

                            
                        }, function (userInfoResultsError) { //, userSettingResultsError) {
                            $.dehelper.common.login.isUserLoggedIn = false;
                            $.dehelper._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = userInfoResultsError || userSettingResultsError; //$.dehelper.createErrorFromAjaxError(userInfoResultsError, "Error retriving UserInfo during ProcessLoginInfo.");
                            $.dehelper.logToConsole("ERROR dehelper.login.getUserInfo: " + objError.message);
                            myDeferred.reject(objError);
                        });
                } else {
                    myDeferred.resolve();
                }
            } catch (ex) {
                $.dehelper.logToConsole("ERROR dehelper.login.fetchToken: " + ex);
                $.dehelper.common.login.isUserLoggedIn = false;
                var objError = $.dehelper.createErrorFromScriptException(ex);
                myDeferred.reject(objError);
            }
            return myDeferred.promise();
        },


        /* 
            the autologin function returns a promise that is always resolved even if there is no refresh token used in dehelper.appinit.
            The purpose of this function is to check to see if the accessToken is avalible and is not expired
            if its not avalible but a refreshToken is avalible then the refresh Token is set to the server to exchange for
        */

        autoLogin: function () {
            var myDeferred = $.Deferred();
            //console.info('in autologin()');
            try {
                if ($.dehelper.isClientSideDebugging())
                    $.dehelper.logToConsole("Debug: $.dehelper.autoLogin called");

                if ($.dehelper.hasRefreshToken()) {
                    $.dehelper.getNewAccessToken()
                        .done(function () {
                            if ($.dehelper.isClientSideDebugging()) {
                                $.dehelper.logToConsole("Debug: $.dehelper.autoLogin success");
                            }
                            //console.log('autologin() refreshtoken().done');
                            myDeferred.resolve();
                        })
                        .fail(function () {
                            if ($.dehelper.isClientSideDebugging()) {
                                $.dehelper.logToConsole("Debug: $.dehelper.autoLogin failed");
                            }
                            //console.log('autologin() refreshtoken().failed');
                            //console.trace()
                            //This function should never reject
                            myDeferred.resolve();
                        })
                } else {
                    $.dehelper.logToConsole("Debug: $.dehelper.autoLogin no RefreshToken or aspnet.cookie Found so skipping autologin ");
                    //we always resolve in autologin
                    myDeferred.resolve();
                }

            }

            catch (ex) {
                $.dehelper.logToConsole("ERROR $.dehelper.autoLogin: " + ex.toString());
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
            //if ($.dehelper.common.settings.isClientSideDebugging == null) {
            var DebugSetting = $.dehelper.options.debug;
            if (DebugSetting) {
                //$.dehelper.common.settings.isClientSideDebugging = DebugSetting;
                return DebugSetting;
            } else {
                //$.dehelper.common.settings.isClientSideDebugging = false;
                return false;
            }
            //} else {
            //    return $.dehelper.common.settings.isClientSideDebugging;
            //}
        },
        

        // Begin Auth

        isUserInRole: function (roleId) {
            var foundRole = false;
            if ($.dehelper.common.login.isUserLoggedIn && $.dehelper.common.login.userInfo.roles) {
                $.each($.dehelper.common.login.userInfo.roles, function (index, value) {
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
            if ($.dehelper.common.login.isUserLoggedIn && $.dehelper.common.login.userInfo.roles) {
                roleName = roleName.toLowerCase();
                $.each($.dehelper.common.login.userInfo.roles, function (index, value) {
                    if (value.roleName.toLowerCase() == roleName) {
                        foundRole = true;
                        return false;
                    }
                })
            }

            return foundRole;

        },

        isUserLoggedIn: function () {
            
            if ($.dehelper.common.login.isUserLoggedIn === true ) {
                        return true;
            
            }else{
                return false;
            }

        },


       
        

        
        // End Auth -------------------------------------------------------

        // Begin Menu Items Page Content

        getMenuItems: function () {
            var deferred = $.Deferred();
            $.when(
                $.dehelper.ajax({
                    method: 'GET',
                    url: $.dehelper.options.baseUrl + 'pageContent/menuItems'
                }), 
                $.dehelper.getTemplate("menuitems")
            ).then(
                function (ajaxResult, template) {
                    let menuItems = ajaxResult[0];
                    $.dehelper.common.menu.menuItems = menuItems;
                    
                    let $template = $(template);
                    let $menuItemTemplate = $template.find(".menuItemTemplate").find(".menuItem");
                    let $menuItemsContainer = $(".menuItems");
                    $menuItemsContainer.empty();
                    $.each(menuItems, function (index, item) {
                        if (item.roleId === undefined || item.roleId === null || item.roleId === '' || $.dehelper.isUserInRoleName(item.roleId)){
                            let $menuItem = $menuItemTemplate.clone();
                            if (item.contentType === "link") {
                                $menuItem.find("a").attr("href", item.linkUrl).attr("data-id", item.pageContentGuid).text(item.linkText);
                                if (item.linkTarget) {
                                    $menuItem.find("a").attr("target", item.linkTarget);
                                }
                            } else {
                                $menuItem.find("a").attr("href", "javascript:void(0)").attr("data-id", item.pageContentGuid).text(item.linkText).on("click", $.dehelper.menuItemClick);
                            }
                            $menuItemsContainer.append($menuItem);
                        }
                    });
                    
                    if($.dehelper.isUserLoggedIn === true){
                        //add Login MenuItem menuItemLoginTemplate
                        let $logoutMenuItem = $template.find(".menuItemLogoutTemplate").find(".menuItem").clone();
                        $menuItemsContainer.append($logoutMenuItem);
                    }else{
                        //add Login MenuItem menuItemLoginTemplate
                        let $loginMenuItem = $template.find(".menuItemLoginTemplate").find(".menuItem").clone();
                        $menuItemsContainer.append($loginMenuItem);
                    }
                    deferred.resolve();
                },
                function (reason) {
                    $.dehelper.logToConsole("Error: dehelper.getMenuItems failed " + reason);
                    deferred.reject();
                }
            );
            return deferred.promise();
        },

        loadPageContent: function () {

            const parsedUrl = new URL(window.location.href);
            let pageOptions = null;
            if (parsedUrl.pathname === '/') {
                pageOptions = {
                    pageContentGuid: '00000000-0000-0000-0000-000000000001'
                }; //Home Page                     
            } else {
                pageOptions = {
                    linkUrl: parsedUrl.pathname
                };
            }
            //$.dehelper.showLoading();
            $.dehelper.getPageContent(pageOptions).then(function (page) {
                $.dehelper.showPageContent(page);
                //$.dehelper.hideLoading();
            }
                
            )
        },

        showPageContent: function (page) {
            document.title = page.pageTitle;
            $('meta[name="description"]').attr("content", page.pageDescription);
            if(page.contentType === "template"){
                $.dehelper.getTemplateContent({templatePath: page.content}).then(
                    function(templateContent){
                        $(".pageContent").html(templateContent);
                    },
                    function(err){
                        $.dehelper.displayError({error:err});
                    }
                )
                
            }else if(page.contentType === "plugin.widget"){
                
                var $element = $("<div></div>")
                $(".pageContent").empty().append($element);
                $.dehelper.widgetFactoryHelper.loadWidget( $element[0], {widgetName: page.content}).then(
                    function(templateContent){
                        
                    },
                    function(err){
                        $.dehelper.logToConsole("ERROR: showPageContent contentType=widget ", err.toString());
                        var objError = $.dehelper.createErrorFromScriptException(err, "Server error during dehelper.loadWidget.");
                        $.dehelper.displayError(objError);
                    }
                )
                // import("/modules/my-module.js")
                //     .then((module) => {
                //         module.loadPageInto(main);
                //     })
                //     .catch((err) => {
                //         main.textContent = err.message;
                //     });
                // });
            }
            
            else{
                $(".pageContent").html(page.content);
            }
            
        },
        getPageContent: function (options) {
            var deferred = $.Deferred();
            var url = '';
            if (options.pageContentGuid) {
                url = $.dehelper.options.baseUrl + 'pageContent/pageContentGuid/' + options.pageContentGuid;
            }else if (options.linkUrl) {
                url = $.dehelper.options.baseUrl + 'pageContent/linkUrl/' + options.linkUrl;
            }
            else {
                url = $.dehelper.options.baseUrl + 'pageContent/pageContentGuid/00000000-0000-0000-0000-000000000001' ; //Home Page
            }
            $.dehelper.ajax({
                method: 'GET',
                url:  url
            }).then(
                function (page) {
                    deferred.resolve(page);
                },
                function (reason) {
                    $.dehelper.logToConsole("Error: dehelper.getPageContent failed " + reason);
                    deferred.reject();
                }
            );
            return deferred.promise();
        },
        menuItemClick: function (e) {
            let $menuItem = $(e.currentTarget);            
            let pageContentGuid = $menuItem.attr("data-id");
            
            $.dehelper.getPageContent({ pageContentGuid: pageContentGuid }).then(
                function (page) {
                    history.pushState({ page: page }, page.pageTitle, page.linkUrl);
                    $.dehelper.showPageContent(page);

                },
                function(err){
                    $.dehelper.logToConsole("ERROR: menuItemClick", err.toString());
                    var objError = $.dehelper.createErrorFromScriptException(err, "Server error during dehelper.loadWidget.");
                    $.dehelper.displayError(objError);
                }
            );
            
        },

        // End Menu Items Page Content ------------------------------------


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
                options.error = $.dehelper.createErrorFromScriptException("Default Error Handler Error", "Default Error Handler Error");
            }

            var $dialogElement = $('#dehelper_error_dialog');  //If its already added to the page select it
            var $errorModal = null;
            var onRetryClick = function () {
                trigger = "retry"
                $dialogElement.find('#dehelper_error_dialog_error').hide();
                $.dehelper.logToConsole("Error Dialog Retry Button Clicked");
                //$dialogElement.dialog("close");
                $errorModal.hide();
                myDefer.resolve("Retry");
            }
            var onCancelClick = function () {
                trigger = "cancelclick";
                $.dehelper.logToConsole("Error Dialog Cancel Button Clicked");
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
                $.dehelper.logToConsole("Error Dialog Ok Button Clicked");
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
                $dialogElement.find("#dehelper_error_dialog_errorMessageDetails_displayedErrorMessage").text(myOptions.error.message);
                $dialogElement.find("#dehelper_error_dialog_errorMessageDetails_ExceptionType").text(myOptions.error.exceptionType);
                $dialogElement.find("#dehelper_error_dialog_errorMessageDetails_ExceptionMessage").text(myOptions.error.exceptionMessage);
                var stacktrace = myOptions.error.stackTrace;

                //TODO: This approach for displaying the stack trace is a problem waiting to happen if the stack trace contains markup
                //      we should leave the newlines alone and put the stacktrace inside a <pre> using jquery's .text()
                //
                //if (typeof stacktrace === 'string') {
                //    stacktrace = stacktrace.replace(/\n/gi, '<br/>');
                //}
                //$("#dehelper_error_dialog_errorMessageDetails_StackTrace").html(stacktrace);                
                $dialogElement.find("#dehelper_error_dialog_errorMessageDetails_StackTrace").text(stacktrace);
                $dialogElement.find('#dehelper_error_dialog_messageContent_Default').hide();
                $dialogElement.find('#dehelper_error_dialog_messageContent_NoInternet').hide();
                $dialogElement.find('#dehelper_error_dialog_messageContent_AccessDenied').hide();
                $dialogElement.find('#dehelper_error_dialog_messageContent_NotFound').hide();
                switch (myOptions.error.statusCode) {
                    case 0:
                        $dialogElement.find('#dehelper_error_dialog_messageContent_NoInternet').show();
                        break;
                    case 402:
                        $dialogElement.find('#dehelper_error_dialog_messageContent_AccessDenied').show();
                        break;
                    case 404:
                        $dialogElement.find('#dehelper_error_dialog_messageContent_NotFound').show();
                        break;
                    default:
                        $dialogElement.find('#dehelper_error_dialog_messageContent_Default').show();
                        break;
                }
                $dialogElement.find('#dehelper_error_dialog_messageContent').show();
                $dialogElement.find('#dehelper_error_dialog_errorMessage_details').hide();

            }
            var toggleErrorDetails = function (){
                $dialogElement.find('#dehelper_error_dialog_messageContent').toggle();
                $dialogElement.find('#dehelper_error_dialog_errorMessage_details').toggle();
            }
            var initDialog = function () {
                $dialogElement.find('#dehelper_error_dialog_btnRetry').off("click.dehelper");
                $dialogElement.find('#dehelper_error_dialog_btnCancel').off("click.dehelper");
                $dialogElement.find('#dehelper_error_dialog_btnOk').off("click.dehelper");
                $dialogElement.find('#dehelper_error_dialog_btnRetry').on("click.dehelper", onRetryClick);
                $dialogElement.find('#dehelper_error_dialog_btnCancel').on("click.dehelper", onCancelClick);
                $dialogElement.find('#dehelper_error_dialog_btnOk').on("click.dehelper", onOkClick);
                if (myOptions.showRetry == false) {
                    $dialogElement.find('#dehelper_error_dialog_btnRetry').hide();
                }
                if (myOptions.showCancel == false) {
                    $dialogElement.find('#dehelper_error_dialog_btnCancel').hide();
                }
                if (myOptions.showOk == false) {
                    $dialogElement.find('#dehelper_error_dialog_btnOk').hide();
                }
                if (myOptions.showDetails == false) {
                    $dialogElement.find('#dehelper_error_dialog_btnShowDetails').hide();
                }
                $dialogElement.find('#dehelper_error_dialog_btnShowDetails').on("click",toggleErrorDetails);

                setDialogValues();
                $errorModal.show();
            }

            if ($dialogElement.length == 0) {
                
                $.dehelper.getTemplate('error').then(
                    function (html) {
                        //$dialogElement = $('<div id="dehelper_error_dialog"></div>'); 
                        $dialogElement = $(html); 
                        //$dialogElement.html(html);
                        //let dialogOptions = {backdrop:true, keyboard: true, focus:true};
                        $errorModal = new bootstrap.Modal($dialogElement, myOptions.dialogOptions);
                        //$errorModal = bootstrap.Modal.getInstance($dialogElement);
                        initDialog();
                    },
                    function () {
                        $.dehelper.logToConsole("Error loading Error Dialog HTML");
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
                exceptionMessage = $.dehelper.friendlyError;
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
            return $.dehelper.createError(msg, exceptionMessage, "Client Error", fullmsg, 9999);
        },

        createErrorFromAjaxError: function (xhr, exceptionMessage) {
            xhr = xhr || {};
            exceptionMessage = exceptionMessage || $.dehelper.friendlyError;
            var msg = (xhr.statusText || $.dehelper.friendlyError),
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
                    return $.dehelper.createError(errorMsg, errorExceptionMessage, "Server Error", fullmsg, xhr.status);
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
                return $.dehelper.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            } catch (ex) {
                fullmsg += "Error Building Error Message createErrorFromAjaxError:" + ex.toString();
                return $.dehelper.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            }

        }

        //End Common Error Handler
    });
})(jQuery);

