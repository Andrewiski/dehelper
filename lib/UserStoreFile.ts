import debugModule from "debug";
//import type { EventsMap } from "./typed-events";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
//import 'nosql.js';
import NoSQL from "nosql/index.js";
//const NoSQL = require("nosql");
import { ErrorMessage } from "./ErrorMessage";
import type {
  RefreshTokenCreateOptions,
  AccessTokenCreateOptions,
  AccessTokenDeleteOptions,
  RefreshTokenDeleteOptions,
  AccessTokenGetOptions,
  RefreshTokenGetOptions,
  RefreshToken,
  AccessToken,
  iUserStore,
  User,
  UserGetOptions,
  UserGetByEmailOptions,
  UserGetByUsernameOptions,
  UserDeleteOptions,
  PasswordHashCreateOptions,
  UserStoreCreateOptions,
  UserCreateSuperUser,
  UserCreateSuperUserOptions,
} from "./UserStore";
import { UserStore } from "./UserStore";
const debug = debugModule("DeHelper:UserStoreFile");

type UserStoreFileOptions = {
  memoryOnly: boolean;
  dataPath: string;
};

type UserStoreFileCreateOptions = {
  memoryOnly?: boolean;
  dataPath?: string;
  userStoreCreateOptions?: UserStoreCreateOptions;
};

export class UserStoreFile extends UserStore implements iUserStore {
  private readonly userStoreFileOptions: UserStoreFileOptions;
  private readonly defaultUserStoreFileOptions: UserStoreFileOptions = {
    memoryOnly: false,
    dataPath: "./data",
  };

  private readonly dataFileNames: any = {
    refreshTokensFile: "refreshTokens.json",
    accessTokensFile: "accessTokens.json",
    usersFile: "users.json",
    loginTokensFile: "loginTokens.json",
    rolesFile: "roles.json",
  };

  private databases: any = {
    refreshTokens: null,
    accessTokens: null,
    users: null,
    loginTokens: null,
    roles: null,
  };

  constructor(
    userStoreFileCreateOptions: UserStoreFileCreateOptions | undefined
  ) {
    super(userStoreFileCreateOptions?.userStoreCreateOptions);
    let userStoreFileOptions: UserStoreFileOptions;
    if (userStoreFileCreateOptions === undefined) {
      userStoreFileCreateOptions = {};
    }
    userStoreFileOptions = {
      dataPath:
        userStoreFileCreateOptions.dataPath ||
        this.defaultUserStoreFileOptions.dataPath,
      memoryOnly:
        userStoreFileCreateOptions.memoryOnly ||
        this.defaultUserStoreFileOptions.memoryOnly,
    };

    this.setup();
  }

  public user_create_superuser(
    options: UserCreateSuperUserOptions
  ): Promise<UserCreateSuperUser> {
    return new Promise<UserCreateSuperUser>((resolve, reject) => {
      let userId: string = options.userId || uuidv4();
      let superUser: User = {
        userId: userId,
        username: options.username || "superadmin",
        firstname: options.firstname || "Super",
        lastname: options.lastname || "User",
        email: options.email || "admin@localhost",
        created: new Date(),
        password: null,
        lastLogin: new Date(),
        failedLogins: 0,
        isDisabled: false,
        isLocked: false,
        lockedUntil: new Date(),
        roles: ["superadmin"],
      };
      let password: string;
      let returnPassword: boolean = false;
      if (options.password === undefined || options.password === "") {
        password = crypto.randomBytes(8).toString("hex");
        if (options.debugPrintPassword === true) {
          debug("debug", "Super User password", password);
        }
        if (options.consolePrintPassword === true) {
          console.log("debug", "Super User password", password);
        }
        returnPassword = true;
      } else {
        password = options.password;
      }

      let createHashOptions: PasswordHashCreateOptions = {
        password: password,
        salt: "",
        hashOptions: this.defaultUserStoreOptions.defaultHashOptions,
      };
      this.passwordHash_create(createHashOptions)
        .then((result) => {
          if (superUser.password === null) {
            superUser.password = {
              hash: "",
              salt: "",
              hashOptions: this.defaultUserStoreOptions.defaultHashOptions,
            };
          }
          superUser.password.hash = result.hash;
          superUser.password.salt = result.salt;
          superUser.password.hashOptions = result.hashOptions;

          this.user_upsert(superUser)
            .then((user) => {
              debug("info", "Super User Saved", user);
              let superUserCreate: UserCreateSuperUser = { user: user };
              if (returnPassword === true) {
                superUserCreate.password = password;
              }
              resolve(superUserCreate);
            })
            .catch((error) => {
              debug("error", "user_create_superuser", error);
              reject(error);
            });
        })
        .catch((error) => {
          debug("error", "user_create_superuser", error);
          reject(error);
        });
    });
  }

  /**
   * Sets up database.
   *
   * @private
   */
  private setup() {
    const nosqlDataDirectory = path.join(
      this.userStoreFileOptions.dataPath,
      "nosql"
    );
    if (fs.existsSync(nosqlDataDirectory) === false) {
      fs.mkdirSync(nosqlDataDirectory, { recursive: true });
    }
    let refreshTokensFilePath = path.join(
      nosqlDataDirectory,
      this.dataFileNames.refreshTokensFile
    );
    let accessTokensFilePath = path.join(
      nosqlDataDirectory,
      this.dataFileNames.accessTokensFile
    );
    let loginTokensFilePath = path.join(
      nosqlDataDirectory,
      this.dataFileNames.loginTokensFile
    );
    let usersFilePath = path.join(
      nosqlDataDirectory,
      this.dataFileNames.usersFile
    );
    let rolesFilePath = path.join(
      nosqlDataDirectory,
      this.dataFileNames.rolesFile
    );

    this.databases.refreshTokens = NoSQL.load(refreshTokensFilePath);
    this.databases.accessTokens = NoSQL.load(accessTokensFilePath);
    this.databases.loginTokens = NoSQL.load(loginTokensFilePath);
    this.databases.users = NoSQL.load(usersFilePath);
    this.databases.roles = NoSQL.load(rolesFilePath);

    //this.onlogin = this.onlogin.bind(this);
  }

  public refreshToken_upsert(
    refreshToken: RefreshToken
  ): Promise<RefreshToken> {
    return new Promise<RefreshToken>((resolve, reject) => {
      try {
        if (refreshToken.refresh_token === "") {
          refreshToken.refresh_token = uuidv4();
        }
        this.databases.refreshTokens
          .update(refreshToken, true)
          .make(function (filter: any) {
            filter.where("refresh_token", refreshToken.refresh_token);
            filter.callback(function (
              err: any,
              count: number,
              newRefreshToken: RefreshToken
            ) {
              debug("debug", "refreshToken_upsert", count);
              if (err) {
                let errMsg = new ErrorMessage(err);
                debug("error", "refreshToken_upsert", errMsg);
                reject(errMsg);
              } else {
                resolve(newRefreshToken);
              }
            });
          });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "refreshToken_upsert", errMsg);
        reject(errMsg);
      }
    });
  }

  public refreshToken_get(
    options: RefreshTokenGetOptions
  ): Promise<RefreshToken> {
    return new Promise<RefreshToken>((resolve, reject) => {
      try {
        if (options.refresh_token === "") {
          throw new Error("refresh_token is required");
        }
        this.databases.refreshTokens.first().make(function (filter: any) {
          filter.where("refresh_token", options.refresh_token);
          filter.callback(function (
            err: any,
            count: number,
            RefreshToken: RefreshToken
          ) {
            debug("debug", "refreshToken_get", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "refreshToken_get", errMsg);
              reject(errMsg);
            } else {
              resolve(RefreshToken);
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "refreshToken_get", errMsg);
        reject(errMsg);
      }
    });
  }

  public refreshToken_delete(
    options: RefreshTokenDeleteOptions
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (options.refresh_token === "") {
          throw new Error("refresh_token is empty");
        }
        this.databases.refreshTokens.remove().make(function (filter: any) {
          filter.where("refresh_token", options.refresh_token);
          filter.callback(function (err: any, count: number) {
            debug("debug", "refreshToken_delete", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "refreshToken_delete", errMsg);
              reject(errMsg);
            } else {
              //delete all the accessTokens using this refreshToken
              this.databases.accessTokens.remove().make(function (filter: any) {
                filter.where("refresh_token", options.refresh_token);
                filter.callback(function (err: any, count: number) {
                  debug(
                    "debug",
                    "refreshToken_delete",
                    "accessTokens.remove",
                    count
                  );
                  if (err) {
                    let errMsg = new ErrorMessage(err);
                    debug(
                      "error",
                      "refreshToken_delete",
                      "accessTokens.remove",
                      errMsg
                    );
                    reject(errMsg);
                  } else {
                    resolve();
                  }
                });
              });
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "refreshToken_delete", errMsg);
        reject(errMsg);
      }
    });
  }

  public accessToken_upsert(accessToken: AccessToken): Promise<AccessToken> {
    return new Promise<AccessToken>((resolve, reject) => {
      try {
        if (accessToken.access_token === "") {
          accessToken.access_token = uuidv4();
        }
        this.databases.accessTokens
          .update(accessToken, true)
          .make(function (filter: any) {
            filter.where("access_token", accessToken.access_token);
            filter.callback(function (
              err: any,
              count: number,
              newAccessToken: AccessToken
            ) {
              debug("debug", "accessToken_upsert", count);
              if (err) {
                let errMsg = new ErrorMessage(err);
                debug("error", "accessToken_upsert", errMsg);
                reject(errMsg);
              } else {
                resolve(newAccessToken);
              }
            });
          });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "accessToken_upsert", errMsg);
        reject(errMsg);
      }
    });
  }

  public accessToken_get(options: AccessTokenGetOptions): Promise<AccessToken> {
    return new Promise<AccessToken>((resolve, reject) => {
      try {
        if (options.access_token === "") {
          throw new Error("access_token is required");
        }
        this.databases.accessTokens.first().make(function (filter: any) {
          filter.where("access_token", options.access_token);
          filter.callback(function (
            err: any,
            count: number,
            accessToken: AccessToken
          ) {
            debug("debug", "accessToken_get", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "accessToken_get", errMsg);
              reject(errMsg);
            } else {
              resolve(accessToken);
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "accessToken_get", errMsg);
        reject(errMsg);
      }
    });
  }

  public accessToken_delete(options: AccessTokenDeleteOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (options.access_token === "") {
          throw new Error("access_token is empty");
        }
        this.databases.accessTokens.remove().make(function (filter: any) {
          filter.where("access_token", options.access_token);
          filter.callback(function (err: any, count: number) {
            debug("debug", "accessToken_delete", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "accessToken_delete", errMsg);
              reject(errMsg);
            } else {
              resolve();
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "accessToken_delete", errMsg);
        reject(errMsg);
      }
    });
  }

  public user_upsert(user: User): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      try {
        if (user.userId === "") {
          user.userId = uuidv4();
        }
        this.databases.users.update(user, true).make(function (filter: any) {
          filter.where("userId", user.userId);
          filter.callback(function (err: any, count: number, newUser: User) {
            debug("debug", "user_upsert", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "user_upsert", errMsg);
              reject(errMsg);
            } else {
              resolve(newUser);
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "user_upsert", errMsg);
        reject(errMsg);
      }
    });
  }

  public user_getAll(): Promise<Array<User>> {
    return new Promise<Array<User>>((resolve, reject) => {
      try {
        this.databases.users.find().make(function (filter: any) {
          filter.callback(function (
            err: any,
            count: number,
            users: Array<User>
          ) {
            debug("debug", "user_getAll", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "user_getAll", errMsg);
              reject(errMsg);
            } else {
              resolve(users);
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "user_getAll", errMsg);
        reject(errMsg);
      }
    });
  }

  public user_get(options: UserGetOptions): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      try {
        if (options.userId === "") {
          throw new Error("userId is required");
        }
        this.databases.accessTokens.first().make(function (filter: any) {
          filter.where("userId", options.userId);
          filter.callback(function (err: any, count: number, user: User) {
            debug("debug", "user_get", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "user_get", errMsg);
              reject(errMsg);
            } else {
              resolve(user);
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "user_get", errMsg);
        reject(errMsg);
      }
    });
  }

  public user_getByUserName(options: UserGetByUsernameOptions): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      try {
        if (options.username === "") {
          throw new Error("username is required");
        }
        this.databases.accessTokens.first().make(function (filter: any) {
          filter.where("username", options.username);
          filter.callback(function (err: any, count: number, user: User) {
            debug("debug", "user_getByUserName", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "user_getByUserName", errMsg);
              reject(errMsg);
            } else {
              resolve(user);
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "user_getByUserName", errMsg);
        reject(errMsg);
      }
    });
  }

  public user_getByEmail(options: UserGetByEmailOptions): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      try {
        if (options.email === "") {
          throw new Error("email is required");
        }
        this.databases.accessTokens.first().make(function (filter: any) {
          filter.where("email", options.email);
          filter.callback(function (err: any, count: number, user: User) {
            debug("debug", "user_getByEmail", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "user_getByEmail", errMsg);
              reject(errMsg);
            } else {
              resolve(user);
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "user_getByEmail", errMsg);
        reject(errMsg);
      }
    });
  }

  public user_delete(options: UserDeleteOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (options.userId === "") {
          throw new Error("userId is required");
        }
        this.databases.user.remove().make(function (filter: any) {
          filter.where("userId", options.userId);
          filter.callback(function (err: any, count: number) {
            debug("debug", "user_delete", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "user_delete", errMsg);
              reject(errMsg);
            } else {
              resolve();
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "user_delete", errMsg);
        reject(errMsg);
      }
    });
  }

  public refreshToken_create(
    options: RefreshTokenCreateOptions
  ): Promise<RefreshToken> {
    return new Promise<RefreshToken>((resolve, reject) => {
      try {
        super
          .refreshToken_create(options)
          .then((refreshToken) => {
            this.refreshToken_upsert(refreshToken).then((refreshToken) => {
              resolve(refreshToken);
            });
          })
          .catch((ex) => {
            let errMsg = new ErrorMessage(ex);
            debug("error", "createRefreshToken", "saveRefreshToken", errMsg);
            reject(errMsg);
          });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "createRefreshToken", errMsg);
        reject(errMsg);
      }
    });
  }

  public accessToken_create(
    options: AccessTokenCreateOptions
  ): Promise<AccessToken> {
    return new Promise<AccessToken>((resolve, reject) => {
      try {
        super
          .accessToken_create(options)
          .then((accessToken) => {
            this.accessToken_upsert(accessToken).then((accessToken) => {
              resolve(accessToken);
            });
          })
          .catch((ex) => {
            let errMsg = new ErrorMessage(ex);
            debug("error", "createAccessToken", errMsg);
            reject(errMsg);
          });
      } catch (ex) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "createAccessToken", errMsg);
        reject(errMsg);
      }
    });
  }
}
