import debugModule from "debug";
import express, { Request, Response, NextFunction } from "express";
const debug = debugModule("DeHelper:Helper");

export type ExpressRequestConnectionInfo = {
  ip: string;
  port: number;
  ua: string;
};

export class Helper {
  public static getExpressRequestConnectionInfo = function (
    req: Request
  ): ExpressRequestConnectionInfo {
    let forwardedIp = req.headers["x-forwarded-for"];
    let strForwardedIp = "";
    if (forwardedIp) {
      if (typeof forwardedIp !== "string") {
        strForwardedIp + forwardedIp.toString();
      } else {
        strForwardedIp = forwardedIp[0].toString();
      }
    }
    let ip: string = strForwardedIp || req.socket.remoteAddress || "";
    if (ip.substring(0, 7) === "::ffff:") {
      ip = ip.substring(7);
    }
    let port = req.socket.remotePort || 0;
    let userAgent = req.headers["user-agent"];
    let strUserAgent: string = "";
    if (userAgent) {
      if (typeof userAgent === "string") {
        strUserAgent = userAgent;
      } else {
        strUserAgent = userAgent[0];
      }
    }
    return { ip: ip, port: port, ua: strUserAgent };
  };
}
