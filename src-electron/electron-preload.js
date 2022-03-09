/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */

import { contextBridge, shell, ipcRenderer, ipcMain } from "electron";
import { app, BrowserWindow } from "@electron/remote";

import { SharedState } from "../src/interactors/appState";
import { Interactor } from "../src/interactors/interactor";
import * as pathLib from "path";

const sharedState = new SharedState();
const interactor = new Interactor(sharedState);

contextBridge.exposeInMainWorld("api", {
    // Window functions
    minimize() {
        BrowserWindow.getFocusedWindow().minimize();
    },

    toggleMaximize() {
        const win = BrowserWindow.getFocusedWindow();

        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    },

    close() {
        BrowserWindow.getFocusedWindow().close();
    },

    // ==============================
    // Interactor functions
    // Load
    async load(search, flag, tag, folder, sortBy, sortOrder) {
        return await interactor.load(
            search,
            flag,
            tag,
            folder,
            sortBy,
            sortOrder
        );
    },

    async loadTags() {
        return await interactor.loadTags();
    },

    async loadFolders() {
        return await interactor.loadFolders();
    },

    // Add
    async add(pathList) {
        return await interactor.add(pathList);
    },

    // Delete
    delete(entities) {
        interactor.delete(entities);
    },

    deleteSup(entity, supURL) {
        interactor.deleteSup(entity, supURL);
    },

    deleteTag(tagName) {
        interactor.deleteTag(tagName);
    },

    deleteFolder(folderName) {
        interactor.deleteFolder(folderName);
    },

    // Update
    async scrape(entities) {
        return await interactor.scrape(entities);
    },

    update(entities) {
        interactor.update(entities);
    },

    // Open
    open(url) {
        shell.openPath(url.replace("file://", ""));
    },

    // Export
    export(entities, format) {
        interactor.export(entities, format);
    },

    // ==============================
    // Preferences
    updatePreference(name, value) {
        interactor.updatePreference(name, value);
    },

    loadPreferences() {
        return interactor.loadPreferences();
    },

    version() {
        return app.getVersion();
    },

    openLib() {
        interactor.openLib()
    },

    migrateLocaltoSync() {
        interactor.migrateLocaltoSync()
    },

    // ==============================

    getJoinedPath(url, withProtocol) {
        let joinedPath = pathLib.join(interactor.appLibPath(), url);
        if (withProtocol) {
            return "file://" + joinedPath;
        } else {
            return joinedPath.replace("file://", "");
        }
    },

    setRoutineTimer() {
        interactor.setRoutineTimer();
    },

    // ==============================
    registerSignal(signal, callback) {
        ipcRenderer.on(signal, callback);
    },

    sendSignal(signal, data) {
        sharedState.set(signal, data);
    }
});
