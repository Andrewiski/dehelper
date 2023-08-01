
import debugModule from "debug";
import { ErrorMessage } from "./ErrorMessage";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
//import type { EventsMap } from "./typed-events";
const debug = debugModule("DeHelper:UserStore"); 

export type AccessTokenCreateOptions = {
    refreshToken: RefreshToken,
    expires_in?: number,
    access_token?: string
}

export type RefreshTokenCreateOptions = {
    loginData: LoginData,
    refresh_token: string,
    expires_in?: number,
    token_type: string
}

export type RefreshTokenDeleteOptions = {
    refresh_token: string
}

export type AccessTokenDeleteOptions = {
    access_token: string
}

export type RefreshTokenGetOptions = {
    refresh_token: string
}

export type AccessTokenGetOptions = {
    access_token: string
}

export type UserGetOptions = {
    userId: string
}

export type UserGetByUsernameOptions = {
    username: string
}
export type UserGetByEmailOptions = {
    email: string
}


export type UserDeleteOptions = {
    userId: string
}

export type HashOptions = {
    iterations: number,
    keyLength: number,
    digest: string
}


export type PasswordValidateOptions = {
    password: string,
    hash: string,
    salt: string,
    hashOptions?: HashOptions
}
export type PasswordHashCreateOptions = {
    password: string,
    salt: string,
    hashOptions?: HashOptions
}

export type UserPassword = {
    hash: string,
    salt: string,
    hashOptions: HashOptions
}

export type LoginData = {
    user?: User,
    loginType: string,
    lastLogin?: Date,
    loginToken?: LoginToken,
    refresh_token?: string,
    refreshtoken_expiresIn?: number,
    access_token?: string,
    accesstoken_expiresIn?: number,
}



export type User = {
    userId: string,
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    created: Date,
    password: UserPassword | null,
    lastLogin: Date,
    failedLogins: number,
    isDisabled: boolean,
    isLocked: boolean,
    lockedUntil: Date,
    roles: string[],
    userData?: any
}

export type UserStoreOptions = {
    defaultHashOptions: HashOptions
    accessTokenExpiresIn: number,
    refreshTokenExpiresIn: number
}

export type UserStoreCreateOptions = {
    defaultHashOptions?: HashOptions
    accessTokenExpiresIn?: number,
    refreshTokenExpiresIn?: number
}



export type Role = {
    roleId: string,
    rolename: string
}

export type RefreshToken = {
    loginData: LoginData,
    refresh_token: string,
    expires_in: number,
    expires_on: Date,
    token_type: string,
}
export type AccessToken = {
    access_token: string,
    refresh_token: string,
    expires_in: number,
    expires_on: Date,
    refreshToken: RefreshToken
}

export type LoginToken = {
    login_token: string,
    expires_in: number,
    expires_on: Date
}

export type UserCreateSuperUserOptions = {
    userId?: string
    username?: string,
    password?: string,
    firstname?: string,
    lastname?: string,
    email?: string,
    debugPrintPassword?: boolean,
    consolePrintPassword?: boolean
}

export type UserCreateSuperUser = {
    user: User,
    password?: string
}

export type UsernamePasswordValidateOptions = { 
    username: string,
    password: string
}

type UserCleanOptions = { 
    user: User
}

/**
    * This is the description of the interface
    *
    * @interface UserStore
    * @refreshToken_create {RefreshTokenCreateOptions} refreshToken_create is used to create a new RefreshToken and save it to the store
    * @accessToken_create {AccessTokenCreateOptions} accessToken_create is used to create a new AccessToken and save it to the store
    * @refreshToken_upsert {RefreshToken} refreshToken_upsert is used to save RefreshToken to the store
    * @accessToken_upsert {AccessToken} accessToken_upsert is used to save AccessToken to the store
    * @refreshToken_delete {RefreshTokenDeleteOptions} refreshToken_delete is used to delete a RefreshToken and any AccessTokens using it from the store
    * @accessToken_delete {AccessTokenDeleteOptions} accessToken_delete is used to delete a AccessToken from the store
    * @accessToken_get {AccessTokenGetOptions} accessToken_get is used to retrive an AccessToken from the store
    * @refreshToken_get {RefreshTokenGetOptions} refreshToken_get is used to retrive an RefreshToken from the store    
    * @user_upsert {User} user_upsert is used to create a new AccessToken and save it to the store
    * @role_upsert {AccessTokenCreateOptions} createAccessToken is used to create a new AccessToken and save it to the store

*/
export interface iUserStore {
    
    refreshToken_create(options : RefreshTokenCreateOptions) : Promise<RefreshToken>;
    refreshToken_upsert(refreshToken : RefreshToken) : Promise<RefreshToken>;
    refreshToken_get(options : RefreshTokenGetOptions) : Promise<RefreshToken | null>;
    refreshToken_delete(options : RefreshTokenDeleteOptions) : Promise<void>;
    accessToken_create(options : AccessTokenCreateOptions) : Promise<AccessToken>;
    accessToken_upsert(accessToken : AccessToken) : Promise<AccessToken>;
    accessToken_get(options : AccessTokenGetOptions) : Promise<AccessToken | null>;
    accessToken_delete(options : AccessTokenDeleteOptions) : Promise<void>;
    user_upsert(user : User) : Promise<User>;
    user_get(options : UserGetOptions) : Promise<User | null>;
    user_getByUsername(options : UserGetByUsernameOptions) : Promise<User | null>;
    user_getByEmail(options : UserGetByEmailOptions) : Promise<User | null>;
    passwordHash_create(options : PasswordHashCreateOptions) : Promise<UserPassword>;
    usernamePassword_validate(options : UsernamePasswordValidateOptions) : Promise<User>;
    password_validate(options : PasswordValidateOptions) : Promise<Boolean>;
    user_create_superuser(options: UserCreateSuperUserOptions): Promise<UserCreateSuperUser>;
    user_clean(options: UserCleanOptions): Promise<User>;
}




export class UserStore implements iUserStore {
    
    
    constructor(userStoreCreateOptions : UserStoreCreateOptions | undefined){
        
        let userStoreOptions : UserStoreOptions 
        if(userStoreCreateOptions === undefined){
            userStoreCreateOptions = {};
        };
        userStoreOptions = {
            accessTokenExpiresIn: userStoreCreateOptions.accessTokenExpiresIn || this.defaultUserStoreOptions.accessTokenExpiresIn, 
            refreshTokenExpiresIn: userStoreCreateOptions.refreshTokenExpiresIn || this.defaultUserStoreOptions.refreshTokenExpiresIn, 
            defaultHashOptions: userStoreCreateOptions.defaultHashOptions || this.defaultUserStoreOptions.defaultHashOptions
        };
        this.userStoreOptions = userStoreOptions;
    }

    public readonly defaultUserStoreOptions : UserStoreOptions =  {
        accessTokenExpiresIn:  3600, 
        refreshTokenExpiresIn:  3600, 
        defaultHashOptions: {iterations: 10240, keyLength: 64, digest: 'sha512'}
    };
    
    public readonly userStoreOptions : UserStoreOptions;

    public passwordHash_create(options : PasswordHashCreateOptions) : Promise<UserPassword> {
        return new Promise<UserPassword>((resolve, reject) => {
            let hashOptions : HashOptions = options.hashOptions || this.userStoreOptions.defaultHashOptions;
            
            let password = options.password.normalize('NFKC');
            crypto.pbkdf2(password, options.salt, hashOptions.iterations, hashOptions.keyLength, hashOptions.digest, (err, derivedKey) => {
                if(err){
                    let errMsg = new ErrorMessage(err);
                    debug('error', 'createHash',  errMsg);
                    reject(errMsg);
                }
                let userPassword : UserPassword = {hash: derivedKey.toString('hex'), salt: options.salt, hashOptions : {iterations: hashOptions.iterations, keyLength: hashOptions.keyLength, digest: hashOptions.digest}}
                resolve(userPassword);
            });
        });
    }

    public password_validate(options: PasswordValidateOptions) : Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                let createHashOptions : PasswordHashCreateOptions = {password: options.password, salt: options.salt, hashOptions: options.hashOptions};
                this.passwordHash_create(createHashOptions).then((userPassword) => {
                    if(userPassword.hash === options.hash){
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch((ex) => {
                    let errMsg = new ErrorMessage(ex);
                    debug('error', 'password_validate',  errMsg);
                    reject(errMsg);
                })
                
            } catch (ex) {
                let errMsg = new ErrorMessage(ex);
                debug('error', 'password_validate',  errMsg);
                reject(errMsg);
            }
        });
    }


    public usernamePassword_validate(options: UsernamePasswordValidateOptions) : Promise<User> {

        return new Promise<User>((resolve, reject) => {
            try {
                let userGetByUsernameOptions : UserGetByUsernameOptions = {username: options.username};
                this.user_getByUsername(userGetByUsernameOptions).then((user) => {
                    if(user === null){
                        reject(new ErrorMessage({message: 'Invalid username or password', code: 404, debugData: {username: options.username}}));
                    } else {
                        
                        let passwordValidateOptions : PasswordValidateOptions = {password: options.password, salt: user!.password!.salt, hash: user!.password!.hash, hashOptions: user!.password!.hashOptions};
                        this.password_validate(passwordValidateOptions).then((valid) => {
                            if(valid){
                                resolve(user);
                            } else {
                                reject(new ErrorMessage({message: 'Invalid username or password', code: 404, debugData: {username: options.username}}));
                            }
                        }).catch((ex) => {
                            let errMsg = new ErrorMessage({error:ex, debugData: {username: options.username}});
                            debug('error', 'usernamePassword_validate',  errMsg);
                            reject(errMsg);
                        });
                    }
                }).catch((ex) => {
                    let errMsg = new ErrorMessage({error:ex, debugData: {username: options.username}});
                    debug('error', 'usernamePassword_validate',  errMsg);
                    reject(errMsg);
                });
            } catch (ex) {
                let errMsg = new ErrorMessage({error:ex, debugData: {username: options.username}});
                debug('error', 'usernamePassword_validate',  errMsg);
                reject(errMsg);
            }
        });
    }

    public refreshToken_create (options: RefreshTokenCreateOptions) : Promise<RefreshToken> {
        return new Promise<RefreshToken>((resolve, reject) => {
            try {
                let now : Date = new Date();
                let expires_in : number = options.expires_in || this.userStoreOptions.refreshTokenExpiresIn;
                let expires_on : Date = new Date();
                expires_on.setSeconds(now.getSeconds() + expires_in);
                let refreshToken : RefreshToken = {
                    loginData: options.loginData,
                    refresh_token: options.refresh_token || uuidv4(),
                    expires_in: expires_in,
                    expires_on: expires_on,
                    token_type: options.token_type,
                };
                resolve(refreshToken);
            } catch (ex) {
                let errMsg = new ErrorMessage(ex);
                debug('error', 'refreshToken_create',  errMsg);
                reject(errMsg);
            }
        });
    }
    
    public accessToken_create(options : AccessTokenCreateOptions) : Promise<AccessToken>{
        return new Promise<AccessToken>((resolve, reject) => {
            try {
                let now : Date = new Date();
                let expires_in : number = options.expires_in || this.userStoreOptions.accessTokenExpiresIn;
                let expires_on : Date = new Date();
                expires_on.setSeconds(now.getSeconds() + expires_in);
                let accessToken : AccessToken = {
                    refreshToken: options.refreshToken,
                    refresh_token: options.refreshToken.refresh_token,
                    access_token: options.access_token || uuidv4(),
                    expires_in: expires_in,
                    expires_on: expires_on
                };
                resolve(accessToken);
            } catch (ex) {
                let errMsg = new ErrorMessage(ex);
                debug('error', 'accessToken_create',  errMsg);
                reject(errMsg);
            }
        });
    }
    /** create a delete Refresh Token including any Access Tokens using it from the Store */
    public refreshToken_delete(options : RefreshTokenDeleteOptions) : Promise<void>{
        throw new Error("Method not implemented.");
    }
    /** delete a Access Token from the Store */
    public accessToken_delete(options : AccessTokenDeleteOptions) : Promise<void >{
        throw new Error("Method not implemented.");
    }
    /** retrive an Access Token from the Store */
    public accessToken_get(options : AccessTokenGetOptions) : Promise<AccessToken | null >{
        throw new Error("Method not implemented.");
    }
    /** retrive an Refresh Token from the Store */
    public refreshToken_get(options : RefreshTokenGetOptions) : Promise<RefreshToken | null >{
        throw new Error("Method not implemented.");
    }

    /** upsert an Refresh Token into the Store */
    public refreshToken_upsert(refreshToken : RefreshToken) : Promise<RefreshToken>{
        throw new Error("Method not implemented.");
    }

    /** upsert an Access Token into the Store */
    public accessToken_upsert(accessToken : AccessToken) : Promise<AccessToken>{
        throw new Error("Method not implemented.");
    }

    /** upsert an User into the Store */
    public user_upsert(user : User) : Promise<User>{
        throw new Error("Method not implemented.");
    }

    /** get an User from the Store */
    public user_get(options : UserGetOptions) : Promise<User | null>{
        throw new Error("Method not implemented.");
    }
    /** get an User from the Store */
    public user_getByEmail(options : UserGetByEmailOptions) : Promise<User | null>{
        throw new Error("Method not implemented.");
    }
    /** get an User from the Store */
    public user_getByUsername(options : UserGetByUsernameOptions) : Promise<User | null>{
        throw new Error("Method not implemented.");
    }

    public user_create_superuser(options: UserCreateSuperUserOptions): Promise<UserCreateSuperUser> {
        throw new Error("Method not implemented.");
    }

    public user_clean(options : UserCleanOptions) : Promise<User>{
        return new Promise<User >((resolve, reject) => {
           try{
                options.user.password = null;
                resolve(options.user);
           }catch (ex) {
                let errMsg = new ErrorMessage(ex);
                debug('error', 'user_clean',  errMsg);
                reject(errMsg);
           }
        });
    }
}


