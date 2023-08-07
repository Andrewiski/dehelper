import http = require("http");
import type { Server as HTTPSServer } from "https";
import type { Http2SecureServer } from "http2";
import debugModule from "debug";
import express, { Request, Response, NextFunction } from "express";
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
import { Login } from "./Login";
import { ErrorMessage } from "./ErrorMessage";
const debug = debugModule("DeHelper");
const clientVersion = require("../package.json").version;

export type DeHelperOptions = {
  userStore: iUserStore;
  path?: string;
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
  private _defaultPath: string = "/dehelper";
  constructor(deHelperOptions: DeHelperOptions) {
    this.options = deHelperOptions;
  }

  /**
   * Attaches dehelper to a server.
   *
   * @param srv - server
   * @param opts - options passed to dehelper
   * @return self
   */
  public attach(
    srv: http.Server | HTTPSServer | Http2SecureServer,
    options: Partial<DeHelperOptions> = {}
  ): this {
    if ("function" == typeof srv) {
      const msg =
        "You are trying to attach dehelper to an express " +
        "request handler function. Please pass a http.Server instance.";
      throw new Error(msg);
    }

    // merge the options passed to the DeHelper
    Object.assign(options, this.options);
    // set dehelper path to `/dehelper`
    options.path = options.path || this._defaultPath;

    //this.initEngine(srv, opts);

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
