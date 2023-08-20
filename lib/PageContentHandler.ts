import debugModule = require("debug");
import express, { Request, Response, NextFunction } from "express";
import type {
  PageContentGetMenuItemsOptions,
  PageContentGetOptions,
  PageContentGetByLinkUrlOptions,
  iPageContentStore,
} from "./PageContentStore";
import path, { posix } from "node:path";
import { ErrorMessage } from "./ErrorMessage";
import { Helper } from "./Helper";
const debug = debugModule("DeHelper:PageContent");

export type PageContentHandlerOptions = {
  pageContentHandlerBasePath: string;
  pageContentStore: iPageContentStore;
};

export class PageContentHandler {
  private options: PageContentHandlerOptions;

  constructor(pageContentOptions: PageContentHandlerOptions) {
    this.options = pageContentOptions;
  }

  public attachExpress(app: express.Express) {
    app.use(
      posix.join("/", this.options.pageContentHandlerBasePath, "/menuItems"),
      this.menuItemsHandler.bind(this)
    );

    app.use(
      posix.join(
        "/",
        this.options.pageContentHandlerBasePath,
        "/pageContentGuid/:pageContentGuid"
      ),
      this.pageContentByPageContentGuidHandler.bind(this)
    );

    app.use(
      posix.join("/", this.options.pageContentHandlerBasePath, "*"),
      this.pageContentByLinkUrlHandler.bind(this)
    );

    /*
      if (options.pageContentGuid) {
          url = $.dehelper.options.baseUrl + '/pageContent/pageContentGuid/' + options.pageContentGuid;
      }else if (options.linkUrl) {
          url = $.dehelper.options.baseUrl + '/pageContent/linkUrl/' + options.linkUrl;
      }
      else {
          url = $.dehelper.options.baseUrl + '/pageContent/pageContentGuid/00000000-0000-0000-0000-000000000001' ; //Home Page
      }

    */
  }

  public pageContentByLinkUrlHandler = function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    let linkUrl: string = req.path;
    let pageContent_getByLinkUrl: PageContentGetByLinkUrlOptions = {
      linkUrl: linkUrl,
    };

    this.options.pageContentStore
      .pageContent_getByLinkUrl(pageContent_getByLinkUrl)
      .then((pageContent) => {
        if (pageContent === undefined) {
          next();
        } else {
          res.json(pageContent);
        }
      })
      .catch((ex: any) => {
        ErrorMessage.handleHttpRequestError(
          req,
          res,
          ex,
          "pageContentByLinkUrlHandler"
        );
      });
  };

  public pageContentByPageContentGuidHandler = function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    let pageContentGuid: string = req.params.pageContentGuid;
    let pageContentGetOptions: PageContentGetOptions = {
      pageContentGuid: pageContentGuid,
    };
    if (req.body && req.body.pageContentGuid) {
      pageContentGetOptions.pageContentGuid = req.body.pageContentGuid;
    }
    this.options.pageContentStore
      .pageContent_get(pageContentGetOptions)
      .then((pageContent) => {
        res.json(pageContent);
      })
      .catch((ex: any) => {
        ErrorMessage.handleHttpRequestError(
          req,
          res,
          ex,
          "pageContentByPageContentGuidHandler"
        );
      });
  };

  public menuItemsHandler = function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    let pageContentGetMenuItemsOptions: PageContentGetMenuItemsOptions = {
      parentPageContentGuid: "",
    };
    if (req.body && req.body.parentPageContentGuid) {
      pageContentGetMenuItemsOptions.parentPageContentGuid =
        req.body.parentPageContentGuid;
    }
    this.options.pageContentStore
      .pageContent_getMenuItems(pageContentGetMenuItemsOptions)
      .then((pageContentArray) => {
        res.json(pageContentArray);
      })
      .catch((ex: any) => {
        ErrorMessage.handleHttpRequestError(req, res, ex, "menuItemsHandler");
      });
  };
}
