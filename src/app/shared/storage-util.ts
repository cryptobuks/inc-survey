import { StorageItem } from "../models/storage-item";
import { DEFAULT_ACTIVE_LIST_URLS, DEFAULT_LIST_OF_LISTS_TO_DISPLAY } from "./token-lists";

export class StorageUtil {

    private static readonly _displayLists = new StorageItem<string[]>("displayLists", DEFAULT_LIST_OF_LISTS_TO_DISPLAY);
    private static readonly _activeLists = new StorageItem<string[]>("activeLists", DEFAULT_ACTIVE_LIST_URLS);
    private static readonly _addedTokens = new StorageItem<any[]>("addedTokens", []);

    static get displayLists(): string[] {
        return this._displayLists.value;
    }

    static get activeLists(): string[] {
        return this._activeLists.value;
    }

    static get addedTokens(): any[] {
        return this._addedTokens.value;
    }

    static isDisplayList(url: string) {
        return this._displayLists.value.includes(url);
    }

    static addList(url: string) {
        this._displayLists.value.push(url);
        this._displayLists.save();
    }

    static removeList(url: string) {
        if (this.isDisplayList(url)) {
            this._displayLists.value = this._displayLists.value.filter((other: string) => other !== url);
            this._activeLists.value = this._activeLists.value.filter((other: string) => other !== url);
        }
    }

    static isActiveList(url: string) {
        return this._activeLists.value.includes(url);
    }

    static setActiveList(url: string, active: boolean) {
        let exists = this.isActiveList(url);

        if (active && !exists) {
            this._activeLists.value.push(url);
            this._activeLists.save();
        } else if (!active && exists) {
            this._activeLists.value = this._activeLists.value.filter((other: string) => other !== url);
        }
    }

    static isAddedToken(address: string) {
        return this._addedTokens.value.find(item => item.address.toLowerCase() == address.toLowerCase());
    }

    static addToken(token: any) {
        this._addedTokens.value.push(token);
        this._addedTokens.save();
    }

    static removeToken(address: string) {
        if (this.isAddedToken(address)) {
            this._addedTokens.value = this._addedTokens.value.filter(item => item.address.toLowerCase() !== address.toLowerCase());
        }
    }

    static removeTokens() {
        this._addedTokens.value = [];
    }
}
