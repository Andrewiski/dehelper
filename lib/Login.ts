import debugModule = require("debug");
import express, { Request, Response, NextFunction } from "express";
import type {
  AccessToken,
  AccessTokenCreateOptions,
  LoginData,
  RefreshToken,
  User,
  UsernamePasswordValidateOptions,
  iUserStore,
} from "./UserStore";
import { ErrorMessage } from "./ErrorMessage";
import { Helper } from "./Helper";
const debug = debugModule("DeHelper:Login");

/**
 * Represents the DeHelper.Login Middleware App.
 *
 * @example
 * import { DeHelper } from "DeHelper";
 * const express = require('express');
 *
 * var app = express();
 * const deHelperOptions = {
 *    userStore : new DEAuth.UserStoreFile({dataPath: './data'})
 * };
 * const deAuthLogin = new DEAuth(deAuthOptions);
 * app.use(deAuth);
 */
export type LoginOptions = {
  userStore: iUserStore;
};

export class Login {
  private options: LoginOptions;

  constructor(loginOptions: LoginOptions) {
    this.options = loginOptions;
  }

  public validateAccessTokenHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (
        req.headers &&
        req.headers.authorization &&
        req.headers.authorization.indexOf("Bearer ") === 0
      ) {
        let access_token = req.headers.authorization.substring(7);
        this.options.userStore
          .accessToken_get({ access_token: access_token })
          .then((accessToken) => {
            if (accessToken !== null) {
              res.locals.accessToken = accessToken;
            }
            next();
          });
      }
      next();
    } catch (ex) {
      next();
    }
  }

  public loginHandler(req: Request, res: Response, next: NextFunction) {
    let loginData: LoginData = { loginType: "" };
    if (req.body && req.body.grant_type === "refresh_token") {
      try {
        loginData.loginType = "refresh_token";
        this.options.userStore
          .refreshToken_get({ refresh_token: req.body.refresh_token })
          .then((refreshToken) => {
            if (refreshToken === null) {
              let errMsg = new ErrorMessage({
                error:
                  "login refresh_token not found " + req.body.refresh_token,
                msg: "Invalid RefreshToken",
                statusCode: 401,
                request: req,
                debugData: { refresh_token: req.body.refresh_token },
              });
              debug("warning", "refreshToken_upsert", errMsg);
              debug(
                "debug",
                "login refresh_token not found",
                req.body.refresh_token
              );
              res
                .status(401)
                .json({
                  msg: "Invalid RefreshToken!",
                  error: "Invalid RefreshToken",
                });
            } else {
              var loginData: LoginData = refreshToken.loginData;
              var accessTokenCreate: AccessTokenCreateOptions = {
                refreshToken: refreshToken,
              };
              this.options.userStore
                .accessToken_create({ refreshToken: refreshToken })
                .then((accessToken) => {
                  this.options.userStore
                    .user_clean({ user: loginData.user! })
                    .then((cleanedUser) => {
                      loginData.user = cleanedUser;
                      res.setHeader("Cache-Control", "no-store");
                      res.setHeader("Pragma", "no-cache");
                      res.json(loginData);
                    })
                    .catch((err) => {
                      ErrorMessage.handleHttpRequestError(
                        req,
                        res,
                        err,
                        "loginHandler"
                      );
                    });
                })
                .catch((err) => {
                  ErrorMessage.handleHttpRequestError(
                    req,
                    res,
                    err,
                    "loginHandler"
                  );
                });
            }
          })
          .catch((ex) => {
            ErrorMessage.handleHttpRequestError(req, res, ex, "loginHandler");
          });
      } catch (ex: any) {
        ErrorMessage.handleHttpRequestError(req, res, ex, "loginHandler");
      }
    } else if (req.body && req.body.grant_type === "password") {
      let usernamePasswordValidate: UsernamePasswordValidateOptions = {
        username: req.body.username,
        password: req.body.password,
      };
      this.options.userStore
        .usernamePassword_validate(req.body)
        .then((user: User) => {
          try {
            this.options.userStore
              .refreshToken_create({
                loginData: loginData,
                refresh_token: "",
                token_type: "password",
              })
              .then((refreshToken: RefreshToken) => {
                this.options.userStore
                  .accessToken_create({ refreshToken: refreshToken })
                  .then((accessToken: AccessToken) => {
                    loginData.access_token = accessToken.access_token;
                    loginData.refresh_token = refreshToken.refresh_token;
                    res.setHeader("Cache-Control", "no-store");
                    res.setHeader("Pragma", "no-cache");
                    this.options.userStore.user_clean({
                      user: loginData.user!,
                    });
                    res.json(loginData);
                  });
              })
              .catch((ex: any) => {
                ErrorMessage.handleHttpRequestError(
                  req,
                  res,
                  ex,
                  "loginHandler"
                );
              });
          } catch (ex: any) {
            ErrorMessage.handleHttpRequestError(req, res, ex, "loginHandler");
          }
        })
        .catch((ex: any) => {
          ErrorMessage.handleHttpRequestError(req, res, ex, "loginHandler");
        });
    } else {
      try {
        throw new Error("Invalid grant_type");
      } catch (ex: any) {
        ErrorMessage.handleHttpRequestError(req, res, ex, "loginHandler");
      }
    }
  }

  public logoutHandler = function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!res.locals.accessToken) {
      if (
        req.headers &&
        req.headers.authorization &&
        req.headers.authorization.indexOf("Bearer ") === 0
      ) {
        res.locals.accessToken = { refresh_token: req.query.refresh_token };
      } else {
        res
          .status(401)
          .json({
            msg: "User Not Logged In!",
            error: "Authorization Header Missing",
          });
        return;
      }
    }
    let refresh_token: String = res.locals.accessToken.refresh_token;

    let logoutPromises: Array<any> = [];

    logoutPromises.push(
      this.options.userStore.refreshToken_delete({
        refresh_token: refresh_token,
      })
    );
    logoutPromises.push(
      this.options.userStore.accessToken_delete({
        refresh_token: refresh_token,
      })
    );
    Promise.all(logoutPromises)
      .then(() => {
        res.json({ success: true });
      })
      .catch((ex: any) => {
        ErrorMessage.handleHttpRequestError(req, res, ex, "logoutHandler");
      });
  };

  //Login Page Public Data
  // public getLoginData = function (req: Request, res: Response, next: NextFunction) {

  //     this.options.userStore.user_get().then(
  //         function (data) {
  //             try {
  //                 res.json(data);
  //             } catch (ex) {
  //                 handleHttpRequestError(req,res,ex);
  //             }
  //         },
  //         function (error) {
  //             handleHttpRequestError(req,res,error);
  //         }
  //     );
  // };
}
