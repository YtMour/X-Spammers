"use strict";const r=require("electron"),c={readCookies:()=>r.ipcRenderer.invoke("readCookies"),saveCookies:e=>r.ipcRenderer.invoke("saveCookies",e),launchBrowser:e=>r.ipcRenderer.invoke("launchBrowser",e),closeBrowser:()=>r.ipcRenderer.invoke("closeBrowser")};r.contextBridge.exposeInMainWorld("electronAPI",c);r.contextBridge.exposeInMainWorld("ipcRenderer",{on:(e,n)=>{r.ipcRenderer.on(e,(i,...o)=>n(...o))},once:(e,n)=>{r.ipcRenderer.once(e,(i,...o)=>n(...o))},send:(e,...n)=>{r.ipcRenderer.send(e,...n)},invoke:(e,...n)=>r.ipcRenderer.invoke(e,...n)});
