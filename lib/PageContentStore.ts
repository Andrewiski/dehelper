import debugModule from "debug";
import { ErrorMessage } from "./ErrorMessage";
import { v4 as uuidv4 } from "uuid";
const debug = debugModule("DeHelper:PageContentStore");

export type PageContentGetOptions = {
  pageContentGuid: string;
};

export type PageContentGetByLinkUrlOptions = {
  linkUrl: string;
};

export type PageContentDeleteOptions = {
  pageContentGuid: string;
};

export type PageContent = {
    "content" : string,
    "contentType" : string,
    "createdBy" : string,
    "createdDate" : Date,
    "deleted" : boolean,
    "displayOrder" : number,
    "extendedData" : any,
    "linkMenuDisplay" : boolean,
    "linkStatus" : number,
    "linkTarget" : string,
    "linkText" : string,
    "linkUrl" : string,
    "pageContentGuid" : string,
    "pageDescription" : string,
    "pageKeywords" : string,
    "pageName" : string,
    "pageTitle" : string,
    "parentPageContentGuid" : string | null,
    "roleId" : string,
    "updatedBy" : string,
    "updatedDate" : Date
};

export type PageContentStoreOptions = {
  
};

export type PageContentStoreCreateOptions = {
  
};

export type PageContentCreateOptions = {
  pageContent: PageContent;
};

export type PageContentGetMenuItemsOptions = {
  
}

/**
    * This is the description of the interface
    *
    * @interface ContentStore
    * @pageContent_create {PageContentCreateOptions} pagecontent_create is used to create a new PageContent and save it to the store
    * @pageContent_upsert {PageContent} pagecontent_upsert is used to save PageContent to the store
    * @pageContent_delete {PageContentDeleteOptions} pagecontent_delete is used to delete a PageContent from the store
    * @pageContent_get {PageContentGetOptions} pagecontent_get is used to retrive an PageContent from the store
    

*/
export interface iPageContentStore {
  pageContent_create(
    options: PageContentCreateOptions
  ): Promise<PageContent>;
  pageContent_upsert(pageContent: PageContent): Promise<PageContent>;
  pageContent_get(
    options: PageContentGetOptions
  ): Promise<PageContent | null>;
  pageContent_delete(options: PageContentDeleteOptions): Promise<void>;
  pageContent_getByLinkUrl(options: PageContentGetByLinkUrlOptions): Promise<PageContent | null>;
  pageContent_getMenuItems(options: PageContentGetMenuItemsOptions): Promise<Array<PageContent> | null>;
  
  
}

export class PageContentStore implements iPageContentStore {
  constructor(pageContentStoreCreateOptions: PageContentStoreCreateOptions | undefined) {
    let pageContentStoreOptions: PageContentStoreOptions;
    if (pageContentStoreCreateOptions === undefined) {
      pageContentStoreCreateOptions = {};
    }
    pageContentStoreOptions = {
      
    };
    this.pageContentStoreOptions = pageContentStoreOptions;
  }

  public readonly defaultPageContentStoreOptions: PageContentStoreOptions = {
    
  };

  public readonly pageContentStoreOptions: PageContentStoreOptions;

  public pageContent_create(
    options: PageContentCreateOptions
  ): Promise<PageContent> {
    return new Promise<PageContent>((resolve, reject) => {
      try {
        
        if (options.pageContent !== undefined) {
          if(options.pageContent.pageContentGuid === undefined){
            options.pageContent.pageContentGuid = uuidv4();
          };
        }
        resolve(options.pageContent);
      } catch (ex) {
        let errMsg = new ErrorMessage(ex);
        debug("error", "pageContent_create", errMsg);
        reject(errMsg);
      }
    });
  }

  /** upsert an Page Content into the Store */
  public pageContent_upsert(
    pageContent: PageContent
  ): Promise<PageContent> {
    throw new Error("Method not implemented.");
  }
  
  /** delete Page Content from the Store */
  public pageContent_delete(
    options: PageContentDeleteOptions
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
 
  /** retrive an Page Content from the Store */
  public pageContent_get(
    options: PageContentGetOptions
  ): Promise<PageContent | null> {
    throw new Error("Method not implemented.");
  }
  
  /** retrive an Page Content from the Store using the LinkUrl */
  public pageContent_getByLinkUrl(options: PageContentGetByLinkUrlOptions): Promise<PageContent | null> {
    throw new Error("Method not implemented.");
  }

  /** get an User from the Store */
  public pageContent_getMenuItems(
    options: PageContentGetMenuItemsOptions
  ): Promise<Array<PageContent> | null> {
    throw new Error("Method not implemented.");
  }  
}
