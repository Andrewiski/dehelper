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

import {
  PageContentStore,
  PageContentStoreOptions,
  iPageContentStore,
  PageContentCreateOptions,
  PageContentDeleteOptions,
  PageContentGetByLinkUrlOptions,
  PageContentGetMenuItemsOptions,
  PageContent,
  PageContentGetOptions,
  PageContentStoreCreateOptions,
} from "./PageContentStore";
const debug = debugModule("DeHelper:PageContentStoreFile");

type PageContentStoreFileOptions = {
  memoryOnly: boolean;
  dataPath: string;
};

export class PageContentStoreFile
  extends PageContentStore
  implements iPageContentStore
{
  private readonly pageContentStoreFileOptions: PageContentStoreFileOptions;

  private readonly defaultPageContentStoreFileOptions: PageContentStoreFileOptions =
    {
      memoryOnly: false,
      dataPath: "./data",
    };

  private readonly dataFileNames: any = {
    pageContentFile: "pageContent.json",
  };

  private databases: any = {
    pageContent: null,
  };

  constructor(
    pageContentStoreFileOptions: PageContentStoreFileOptions | undefined
  ) {
    super(pageContentStoreFileOptions);
    if (this.pageContentStoreFileOptions === undefined) {
      this.pageContentStoreFileOptions = {
        memoryOnly: this.defaultPageContentStoreFileOptions.memoryOnly,
        dataPath: this.defaultPageContentStoreFileOptions.dataPath,
      };
    }

    this.setup();
  }

  /**
   * Sets up database.
   *
   * @private
   */
  private setup() {
    const nosqlDataDirectory = path.join(
      this.pageContentStoreFileOptions.dataPath,
      "nosql"
    );
    if (fs.existsSync(nosqlDataDirectory) === false) {
      fs.mkdirSync(nosqlDataDirectory, { recursive: true });
    }
    let pageContentFilePath = path.join(
      nosqlDataDirectory,
      this.dataFileNames.pageContentFile
    );

    this.databases.pageContent = NoSQL.load(pageContentFilePath);
  }

  public pageContent_upsert(pageContent: PageContent): Promise<PageContent> {
    return new Promise<PageContent>((resolve, reject) => {
      try {
        if (pageContent.pageContentGuid === "") {
          pageContent.pageContentGuid = uuidv4();
        }
        this.databases.pageContent
          .update(pageContent, true)
          .make(function (filter: any) {
            filter.where("pageContentGuid", pageContent.pageContentGuid);
            filter.callback(function (
              err: any,
              count: number,
              newPageContent: PageContent
            ) {
              debug("debug", "pageContent_upsert", count);
              if (err) {
                let errMsg = new ErrorMessage(err);
                debug("error", "pageContent_upsert", errMsg);
                reject(errMsg);
              } else {
                resolve(newPageContent);
              }
            });
          });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "pageContent_upsert", errMsg);
        reject(errMsg);
      }
    });
  }

  public pageContent_get(
    options: PageContentGetOptions
  ): Promise<PageContent | null> {
    return new Promise<PageContent | null>((resolve, reject) => {
      try {
        if (options.pageContentGuid === "") {
          throw new Error("pageContentGuid is required");
        }
        this.databases.pageContent
          .one()
          .where("pageContentGuid", options.pageContentGuid)
          .make(function (filter: any) {
            filter.callback(function (
              err: any,
              pageContent: PageContent | null
            ) {
              debug("debug", "pageContent_get", pageContent);
              if (err) {
                let errMsg = new ErrorMessage(err);
                debug("error", "pageContent_get", errMsg);
                reject(errMsg);
              } else {
                if (pageContent === undefined) {
                  resolve(null);
                } else {
                  resolve(pageContent);
                }
              }
            });
          });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "pageContent_get", errMsg);
        reject(errMsg);
      }
    });
  }

  public pageContent_delete(options: PageContentDeleteOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (options.pageContentGuid === "") {
          throw new Error("pageContentGuid is empty");
        }
        this.databases.pageContent.remove().make(function (filter: any) {
          filter.where("PageContentGuid", options.pageContentGuid);
          filter.callback(function (err: any, count: number) {
            debug("debug", "pageContent_delete", count);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "pageContent_delete", errMsg);
              reject(errMsg);
            } else {
              resolve();
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "pageContent_delete", errMsg);
        reject(errMsg);
      }
    });
  }

  public pageContent_getByLinkUrl(
    options: PageContentGetByLinkUrlOptions
  ): Promise<PageContent | null> {
    return new Promise<PageContent | null>((resolve, reject) => {
      try {
        if (options.linkUrl === "") {
          throw new Error("linkUrl is required");
        }
        this.databases.pageContent
          .one()
          .where("linkUrl", options.linkUrl)
          .make(function (filter: any) {
            filter.callback(function (
              err: any,
              pageContent: PageContent | null
            ) {
              debug("debug", "pageContent_getByLinkUrl", pageContent);
              if (err) {
                let errMsg = new ErrorMessage(err);
                debug("error", "pageContent_getByLinkUrl", errMsg);
                reject(errMsg);
              } else {
                if (pageContent === undefined) {
                  resolve(null);
                } else {
                  resolve(pageContent);
                }
              }
            });
          });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "pageContent_getByLinkUrl", errMsg);
        reject(errMsg);
      }
    });
  }

  public pageContent_getMenuItems(
    options: PageContentGetMenuItemsOptions
  ): Promise<Array<PageContent>> {
    return new Promise<Array<PageContent>>((resolve, reject) => {
      try {
        this.databases.pageContent.find().make(function (filter: any) {
          filter.where("deleted", false);
          if (options.parentPageContentGuid !== "") {
            filter.where(
              "parentPageContentGuid",
              options.parentPageContentGuid
            );
          }

          filter.callback(function (err: any, menuItems: Array<PageContent>) {
            debug("debug", "pageContent_getMenuItems", menuItems.length);
            if (err) {
              let errMsg = new ErrorMessage(err);
              debug("error", "pageContent_getMenuItems", errMsg);
              reject(errMsg);
            } else {
              resolve(menuItems);
            }
          });
        });
      } catch (ex: any) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "pageContent_getMenuItems", errMsg);
        reject(errMsg);
      }
    });
  }
}
