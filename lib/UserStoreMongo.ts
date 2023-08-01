

//     class UserStoreMongo {
//         constructor(options) {
//             this.db = null;
//             this.user = null;
//             this.pass = null;
//             this.host = null;
//             this.port = null;
//             this.name = null;
//             this.url = null;
//             this.collection = null;
//             this.connect = null;
//             this.options = null;
//             this.client = null;
//             this.db = null;
//             this.users = null;
//             this.groups = null;
//         }

//         var createRefreshToken = function (options){
//             var deferred = Defer();
            
//             try {
//                 const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
//                 // Use connect method to connect to the Server
//                 client.connect().then(
//                     function () {
//                         try {
                        
//                             const db = client.db(objOptions.mongoDbDatabaseName);
//                             const collection = db.collection('ut_RefreshToken');
//                             if (collection) {
//                                 let refreshToken = {};
//                                 refreshToken.refresh_token = uuidv4();
//                                 //if (options.expiresIn === undefined || options.expiresIn === null){
//                                     refreshToken.expiresIn = 259200; // 3 * 24 * 60 * 60;  //expire Token in 3 days ie it will get auto deleted by Mongo
//                                 //}
//                                 refreshToken.token_type = "bearer";
//                                 let expiresOn = new Date();
//                                 expiresOn = new Date(expiresOn.getTime() + (refreshToken.expiresIn * 1000));
//                                 refreshToken.expiresOn = expiresOn //used by Momgo to auto delete when expired
//                                 refreshToken.loginData = options.loginData;
//                                 collection.insertOne(refreshToken).then(                            
//                                     function (err, doc) {
//                                         client.close();
//                                         delete refreshToken.loginData;
//                                         deferred.resolve(refreshToken);
//                                     },
//                                     function(err){
//                                         debug('error', 'createRefreshToken',  { "msg": err.message, "stack": err.stack });
//                                         client.close();
//                                         deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": err });
//                                     }
//                                 );
//                             } else {
//                                 debug("error", "createRefreshToken", { "msg": "Not Able to Open MongoDB Connection", "stack": "" });
//                                 client.close();
//                                 deferred.reject({ "code": 500, "msg": "Not Able to Open MongoDB Connection", "error": "collection is null"});
//                             }
//                         } catch (ex) {
//                             debug("error", "createRefreshToken", { "msg": ex.message, "stack": ex.stack });
//                             client.close();
//                             deferred.reject({ "code": 500, "msg": ex.message, "error": ex });
//                         }
//                     },
//                     function(err){
//                         debug('error', 'createRefreshToken',  { "msg": err.message, "stack": err.stack });
//                         deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": err });
//                     }

//                 );
//             } catch (ex) {
//                 debug('error', 'createRefreshToken',  { "msg": ex.message, "stack": ex.stack });
//                 deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
//             }
            
//             return deferred.promise;     
//         }


//         var createAccessToken = function (options){
//             var deferred = Defer();
//             try {
//                 const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
//                 // Use connect method to connect to the Server
//                 client.connect().then(
//                     function () {
//                         try {
                            
//                             const db = client.db(objOptions.mongoDbDatabaseName);
//                             const collection = db.collection('ut_AccessToken');
//                             if (collection) {
//                                 var accessToken = {};
//                                 accessToken.access_token = uuidv4();
//                                 accessToken.expiresIn = 3600; 
//                                 let expiresOn = new Date();
//                                 expiresOn = new Date(expiresOn.getTime() + (accessToken.expiresIn * 1000));
//                                 accessToken.expiresOn = expiresOn //used by Momgo to auto delete when expired with a expireAfterSecond index
//                                 accessToken.refresh_token = options.refreshToken.refresh_token;
//                                 accessToken.refreshToken = options.refreshToken; //used as a way to prevent having to fetch refreshToken as this way it is a short cache as its a 10 minute of all connected users
//                                 accessToken.loginData = options.loginData;
//                                 collection.insertOne(accessToken).then(                            
//                                     function (doc) {
//                                         client.close();
//                                         delete accessToken.refreshToken
//                                         delete accessToken.loginData
//                                         deferred.resolve(accessToken);
//                                     },
//                                     function(err){
//                                         debug("error", "createAccessToken", { "msg": err.message, "stack": err.stack });
//                                         client.close();
//                                         deferred.reject({ "code": 500, "msg": err.message, "error": err });
//                                     }
                                        
//                                 );
//                             } else {
//                                 debug("error", "createAccessToken", { "msg": "Not Able to Open MongoDB Connection", "stack": "" });
//                                 client.close();
//                                 deferred.reject({ "code": 500, "msg": "Not Able to Open MongoDB Connection", "error": "collection is null"});
//                             }
//                         } catch (ex) {
//                             debug("error", "createAccessToken", { "msg": ex.message, "stack": ex.stack });
//                             client.close();
//                             deferred.reject({ "code": 500, "msg": ex.message, "error": ex });
//                         }
//                     },
//                     function(err){
//                         debug("error", "createAccessToken", { "msg": err.message, "stack": err.stack });
//                         deferred.reject({ "code": 500, "msg": err.message, "error": err });
//                     }
//                 );
//             } catch (ex) {
//                 debug('error', 'createAuthToken',  { "msg": ex.message, "stack": ex.stack });
//                 deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
//             }
            
//             return deferred.promise;     
//         }

//         var deleteRefreshToken = function(options){
//             var deferred = Defer();
//             //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
//             try {
//                 const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
//                 // Use connect method to connect to the Server
//                 client.connect().then(
//                     function () {
//                         try {
                            
//                             const db = client.db(objOptions.mongoDbDatabaseName);
//                             const collection = db.collection('ut_RefreshToken');
//                             var findQuery = {  refresh_token : options.refresh_token}
//                             if (collection) {
//                                 collection.deleteMany(findQuery, null).then(
//                                     function (deleteResult) {
//                                         client.close();
//                                         deferred.resolve(deleteResult);
//                                     },
//                                     function(err){
//                                         debug("error", "deleteRefreshToken", { "msg": err.message, "stack": err.stack });
//                                         deferred.reject({ "msg": "An Error Occured!", "error": err });
//                                         client.close();            
//                                     }
//                                 );
//                             } else {
//                                 debug("error", "deleteRefreshToken", { "msg": "An Error Occured!", "stack": "Collection Not Found" });
//                                 deferred.reject({ "msg": "An Error Occured!", "error": "accessToken Collection Not Found" });
//                                 client.close(); 
//                             }
//                         } catch (ex) {
//                             debug("error", "deleteRefreshToken", { "msg": ex.message, "stack": ex.stack });
//                             deferred.reject({ "msg": "An Error Occured!", "error": ex });
//                             client.close();
//                         }
//                     },
//                     function(err){
//                         debug("error", "deleteRefreshToken", { "msg": err.message, "stack": err.stack });
//                         deferred.reject({ "code": 500, "msg": err.message, "error": err });
//                     }
//                 );
//             } catch (ex) {
//                 debug("error", "deleteRefreshToken", { "msg": ex.message, "stack": ex.stack });
//                 deferred.reject({ "msg": "An Error Occured!", "error": ex });
//             }
//             return deferred.promise;
//         }
        
        
//         var deleteAccessToken = function(options){
//             var deferred = Defer();
//             //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
//             try {
//                 const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
//                 // Use connect method to connect to the Server
//                 client.connect().then(
//                     function () {
//                         try {
                            
//                             const db = client.db(objOptions.mongoDbDatabaseName);
//                             const collection = db.collection('ut_AccessToken');
//                             var findQuery = {  refresh_token : options.refresh_token}
//                             if (collection) {
//                                 collection.deleteMany(findQuery, null).then(
//                                     function (deleteResult) {
//                                         client.close();
//                                         deferred.resolve(deleteResult);
//                                     },
//                                     function(err){
//                                         debug("error", "deleteAccessToken", { "msg": err.message, "stack": err.stack });
//                                         deferred.reject({ "msg": "An Error Occured!", "error": err });
//                                         client.close();            
//                                     }
//                                 );
//                             } else {
//                                 debug("error", "deleteAccessToken", { "msg": "An Error Occured!", "stack": "Collection Not Found" });
//                                 deferred.reject({ "msg": "An Error Occured!", "error": "accessToken Collection Not Found" });
//                                 client.close(); 
//                             }
//                         } catch (ex) {
//                             debug("error", "deleteAccessToken", { "msg": ex.message, "stack": ex.stack });
//                             deferred.reject({ "msg": "An Error Occured!", "error": ex });
//                             client.close();
//                         }
//                     },
//                     function(err){
//                         debug("error", "deleteAccessToken", { "msg": err.message, "stack": err.stack });
//                         deferred.reject({ "code": 500, "msg": err.message, "error": err });
//                     }
//                 );
//             } catch (ex) {
//                 debug("error", "deleteAccessToken", { "msg": ex.message, "stack": ex.stack });
//                 deferred.reject({ "msg": "An Error Occured!", "error": ex });
//             }
//             return deferred.promise;
//         }
        

//         var getAccessToken = function(options){
//             var deferred = Defer();
//             //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
//             try {
//                 const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
//                 // Use connect method to connect to the Server
//                 client.connect().then(
//                     function () {
//                         try {
                            
//                             const db = client.db(objOptions.mongoDbDatabaseName);
//                             const collection = db.collection('ut_AccessToken');
//                             var findQuery = {  access_token : options.access_token}
//                             if (collection) {
//                                 collection.findOne(findQuery, null).then(
//                                     function (doc) {
//                                         deferred.resolve(doc);
//                                         client.close();
//                                     },
//                                     function(err){
//                                         debug("error", "getAccessToken", { "msg": err.message, "stack": err.stack });
//                                         deferred.reject({ "msg": "An Error Occured!", "error": err });
//                                         client.close();            
//                                     }
//                                 );
//                             } else {
//                                 debug("error", "getAccessToken", { "msg": "An Error Occured!", "stack": "Collection Not Found" });
//                                 deferred.reject({ "msg": "An Error Occured!", "error": "getAccessToken Collection Not Found" });
//                                 client.close(); 
//                             }
//                         } catch (ex) {
//                             debug("error", "getAccessToken", { "msg": ex.message, "stack": ex.stack });
//                             deferred.reject({ "msg": "An Error Occured!", "error": ex });
//                             client.close();
//                         }
//                     },
//                     function(err){
//                         debug("error", "getAccessToken", { "msg": err.message, "stack": err.stack });
//                         deferred.reject({ "code": 500, "msg": err.message, "error": err });
//                     }
//                 );
//             } catch (ex) {
//                 debug("error", "getAccessToken", { "msg": ex.message, "stack": ex.stack });
//                 deferred.reject({ "msg": "An Error Occured!", "error": ex });
//             }
//             return deferred.promise;
//         }

//         var getRefreshToken = function(options){
//             var deferred = Defer();
//             //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
//             try {
//                 const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
//                 // Use connect method to connect to the Server
//                 client.connect().then(
//                     function () {
//                         try {
//                             const db = client.db(objOptions.mongoDbDatabaseName);
//                             const collection = db.collection('ut_RefreshToken');
//                             var findQuery = {  refresh_token : options.refresh_token}
//                             if (collection) {
//                                 collection.findOne(findQuery, null).then(
//                                     function (doc) {
//                                         deferred.resolve(doc);
//                                         client.close();
//                                     },
//                                     function(err){
//                                         debug("error", "getRefreshToken", { "msg": err.message, "stack": err.stack });
//                                         deferred.reject({ "msg": "An Error Occured!", "error": err });
//                                         client.close();            
//                                     }
//                                 );
//                             } else {
//                                 debug("error", "getRefreshToken", { "msg": "An Error Occured!", "stack": "Collection Not Found" });
//                                 deferred.reject({ "msg": "An Error Occured!", "error": "getRefreshToken Collection Not Found" });
//                                 client.close(); 
//                             }
//                         } catch (ex) {
//                             debug("error", "getRefreshToken", { "msg": ex.message, "stack": ex.stack });
//                             deferred.reject({ "msg": "An Error Occured!", "error": ex });
//                             client.close();
//                         }
//                     },
//                     function(err){
//                         debug("error", "getRefreshToken", { "msg": err.message, "stack": err.stack });
//                         deferred.reject({ "msg": "An Error Occured!", "error": err });           
//                     }
//                 );
//             } catch (ex) {
//                 debug("error", "getRefreshToken", { "msg": ex.message, "stack": ex.stack });
//                 deferred.reject({ "msg": "An Error Occured!", "error": ex });
//             }
//             return deferred.promise;
//         }
//     }
// }