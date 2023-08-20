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
import { LoginHandler, LoginHandlerOptions } from "./LoginHandler";
import type {
  PageContentStore,
  iPageContentStore,
  PageContentStoreCreateOptions,
  PageContentDeleteOptions,
  PageContentGetByLinkUrlOptions,
  PageContentGetMenuItemsOptions,
  PageContentGetOptions,
  PageContentCreateOptions,
  PageContentStoreOptions,
  PageContent,
} from "./PageContentStore";
import {
  PageContentHandler,
  PageContentHandlerOptions,
} from "./PageContentHandler";
import { PageContentStoreFile } from "./PageContentStoreFile";
import { ErrorMessage } from "./ErrorMessage";
const debug = debugModule("DeHelper");
const clientVersion = require("../package.json").version;

export type DeHelperOptions = {
  basePath?: string;
  clientSideBasePath?: string;
  clientSideFolderPath?: string;
  iUserStore?: iUserStore;
  loginHandler?: LoginHandlerOptions;
  pageContentHandler?: PageContentHandlerOptions;
  iPageContentStore?: iPageContentStore;
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
    loginHandler: undefined,
    iUserStore: undefined,
    pageContentHandler: undefined,
    iPageContentStore: undefined,
  };
  private loginHandler: LoginHandler;
  private pageContentHandler: PageContentHandler;
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
    let loginHandlerOptions: LoginHandlerOptions = {
      userStore: this.options.iUserStore,
      loginHandlerBasePath: path.posix.join(this.options.basePath!, "login"),
    };
    this.loginHandler = new LoginHandler(loginHandlerOptions);
    if (this.options.iPageContentStore === undefined) {
      //let userStoreFileOptions: UserStoreOptions = undefined
      this.options.iPageContentStore = new PageContentStoreFile(undefined);
    }
    let pageContentHandlerOptions: PageContentHandlerOptions = {
      pageContentStore: this.options.iPageContentStore,
      pageContentHandlerBasePath: path.posix.join(
        this.options.basePath!,
        "pageContent"
      ),
    };
    this.pageContentHandler = new PageContentHandler(pageContentHandlerOptions);
  }

  private clientSideFileHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    var filePath = req.path; //req.baseUrl + req.path;  //Just use req.path as it is already prefixed with the base path
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
    this.loginHandler.attachExpress(app);
    this.pageContentHandler.attachExpress(app);
    //}

    return this;
  }
}

module.exports = (options: DeHelperOptions) => new DeHelper(options);
module.exports.LoginHandler = LoginHandler;
module.exports.UserStoreFile = UserStoreFile;
module.exports.PageContentHandler = PageContentHandler;
module.exports.PageContentStoreFile = PageContentStoreFile;

export {
  LoginHandler,
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
  PageContentStore,
  iPageContentStore,
  PageContentStoreCreateOptions,
  PageContentDeleteOptions,
  PageContentGetByLinkUrlOptions,
  PageContentGetMenuItemsOptions,
  PageContentGetOptions,
  PageContentCreateOptions,
  PageContentStoreOptions,
  PageContent,
  PageContentHandler,
  PageContentStoreFile,
};
