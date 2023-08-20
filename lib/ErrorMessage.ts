import { Helper, ExpressRequestConnectionInfo } from "./Helper";
import express, { Request, Response } from "express";
type ErrorMessageOptions = {
  msg: string;
  stack?: string;
  statusCode?: number;
  error: any;
  debugData?: any;
  request?: Request;
};

export class ErrorMessage {
  public readonly msg: string = "An Error Has Occured!";
  public readonly stack: string | null = "";
  public readonly statusCode: number = 500;
  public readonly error: any = null;
  public readonly module: string | null = null;
  public readonly connectionInfo: any | null = null;
  public readonly debugData: any | null = null;

  constructor(options?: ErrorMessageOptions | Error | any) {
    if (options !== undefined) {
      if (options instanceof Error) {
        let error: Error = options;
        this.msg = error.message;
        if (error.stack) {
          this.stack = error.stack;
        }
        this.error = error;
      } else if (options instanceof Object) {
        if (options.msg) {
          this.msg = options.msg;
        }
        if (options.statusCode || options.code) {
          this.statusCode = options.statusCode || options.code;
        }
        if (options.error) {
          if (options.error.stack) {
            this.stack = options.error.stack;
          }
        }
        if (options.stack) {
          this.stack = options.stack;
        }
        if (options.connectionInfo) {
          if (options.connectionInfo) {
            this.connectionInfo = options.connectionInfo;
          }
        } else {
          if (options.request) {
            //if (options.request instanceof Request) {
            this.connectionInfo = Helper.getExpressRequestConnectionInfo(
              options.request
            );
            //}
          }
        }
        this.error = options;
      }
      if (options.debugData) {
        this.debugData = options.debugData;
      }
      if (options.statusCode) {
        this.statusCode = options.statusCode;
      }
    }
  }

  public static handleHttpRequestError = function (
    req: Request,
    res: Response,
    err: ErrorMessage,
    debugData: any,
    statusCode: number = 500
  ) {
    let errorData = new ErrorMessage({
      error: err,
      debugData: debugData,
      request: req,
      statusCode: statusCode,
    });
    res.status(errorData.statusCode).json(errorData);
  };
}
