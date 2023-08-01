import debugModule from "debug";
import express, { Request, Response, NextFunction } from 'express'
import type { LoginData, iUserStore } from "./UserStore";
import { ErrorMessage } from "./ErrorMessage";
const debug = debugModule("DeHelper"); 



export type DeHelperOptions = {
    userStore: iUserStore
}

export class DeHelper {

    private options: DeHelperOptions;

    constructor(deHelperOptions:DeHelperOptions){
        this.options = deHelperOptions;
    }

    
    
}