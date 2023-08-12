import http = require("http");
import path from "node:path";
import fs from "node:fs";
import debugModule from "debug";
import express, { Request, Response, NextFunction, Express } from "express";
import type {
  LoginData,
  iUserStore,
  User,
  UserStoreOptions,
  UserStoreCreateOptions,
  Role,
  RefreshToken,
  RefreshTokenCreateOptions,
  AccessTokenCreateOptions,
  AccessTokenDeleteOptions,
  RefreshTokenDeleteOptions,
  AccessTokenGetOptions,
  RefreshTokenGetOptions,
  AccessToken,
  UserGetOptions,
  UserGetByEmailOptions,
  UserGetByUsernameOptions,
  UserDeleteOptions,
  PasswordHashCreateOptions,
  UserCreateSuperUser,
  UserCreateSuperUserOptions,
} from "./UserStore";
import { UserStoreFile } from "./UserStoreFile";
import { Login, LoginOptions } from "./Login";
import { ErrorMessage } from "./ErrorMessage";
const debug = debugModule("DeHelper");
const clientVersion = require("../package.json").version;

export type DeHelperOptions = {
  basePath?: string;
  clientSideBasePath?: string;
  clientSideFolderPath?: string;
  iUserStore?: iUserStore;
  login?: LoginOptions;
};

/**
 * Represents a DeHelper Instance.
 *
 * @example
 * import { DeHelper } from "@Andrewiski/DeHelper";
 *
 * const dehelper = new DeHelper();
 *
 * dehelper.on("userLogin", (user) => {
 *   console.log(`userLogin ${user.userid} connected`);
 *
 * });
 *
 * dehelper.attach(httpServer);
 */

export class DeHelper {
  private options: DeHelperOptions;
  private readonly _defaultOptions: DeHelperOptions = {
    basePath: "/dehelper",
    clientSideFolderPath: "../clientside",
    clientSideBasePath: "/public",
    login: undefined,
    iUserStore: undefined,
  };
  private login: Login;
  private userStore: iUserStore;

  constructor(deHelperOptions?: DeHelperOptions) {
    this.options = deHelperOptions || this._defaultOptions;
    if (deHelperOptions !== undefined) {
      this.options.basePath =
        deHelperOptions.basePath || this._defaultOptions.basePath;
      this.options.clientSideFolderPath =
        deHelperOptions.clientSideFolderPath ||
        this._defaultOptions.clientSideFolderPath;
      this.options.clientSideBasePath =
        deHelperOptions.clientSideBasePath ||
        this._defaultOptions.clientSideBasePath;
      this.options.iUserStore =
        deHelperOptions.iUserStore || this._defaultOptions.iUserStore;
    }
    // merge the options passed to the DeHelper
    //Object.assign(options, this.options);
    this._init();
  }

  private _init() {
    if (this.options.iUserStore === undefined) {
      //let userStoreFileOptions: UserStoreOptions = undefined
      this.options.iUserStore = new UserStoreFile(undefined);
    }
    let loginOptions: LoginOptions = {
      userStore: this.options.iUserStore,
      loginBasePath: path.posix.join(this.options.basePath!, "login"),
    };
    this.login = new Login(loginOptions);
  }

  private clientSideFileHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    var filePath = req.path;  //req.baseUrl + req.path;  //Just use req.path as it is already prefixed with the base path
    if (
      fs.existsSync(
        path.join(__dirname, this.options.clientSideFolderPath!, filePath)
      ) === true
    ) {
      res.sendFile(filePath, {
        root: path.join(__dirname, this.options.clientSideFolderPath!),
      });
    } else {
      res.sendStatus(404);
    }
  }

  /**
   * Attaches dehelper to Express.
   *
   * @param app - Express Instance
   * @return self
   */
  public attachExpress(app: Express): this {
    let clientSideBasePath = path.posix.join(
      this.options.basePath!,
      this.options.clientSideBasePath!
    );
    app.use(clientSideBasePath, this.clientSideFileHandler.bind(this));
    //if(this.options.useLogin === true) {
    this.login.attachExpress(app);
    //}

    return this;
  }
}

module.exports = (options: DeHelperOptions) => new DeHelper(options);
module.exports.Login = Login;
module.exports.UserStoreFile = UserStoreFile;

export {
  Login,
  LoginData,
  iUserStore,
  User,
  UserStoreOptions,
  UserStoreCreateOptions,
  Role,
  RefreshToken,
  RefreshTokenCreateOptions,
  AccessTokenCreateOptions,
  AccessTokenDeleteOptions,
  RefreshTokenDeleteOptions,
  AccessTokenGetOptions,
  RefreshTokenGetOptions,
  AccessToken,
  UserGetOptions,
  UserGetByEmailOptions,
  UserGetByUsernameOptions,
  UserDeleteOptions,
  PasswordHashCreateOptions,
  UserCreateSuperUser,
  UserCreateSuperUserOptions,
};
