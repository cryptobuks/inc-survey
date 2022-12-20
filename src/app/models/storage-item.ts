import BigNumber from "bignumber.js";
import { DATE_ISO_PATTERN } from "../shared/constants";
import { cloneDeep } from "../shared/helper";

const BN_NAMES = ["budget", "reward", "gasReserve", "balance"];

export class StorageItem<T> {

    name: string;
    defaultValue: T;
    private _value: T;

    constructor(name: string, defaultValue?: T) {
        this.name = name;
        this.defaultValue = defaultValue ? cloneDeep(defaultValue) : undefined;
    }

    get value(): T {
        if (!this._value) {
            this._value = this.getSaved();
        }

        return this._value;
    }
    set value(value: T) {
        this._value = value;
        this.save();
    }

    save() {
        if (this._value) {
            //localStorage[this.name] = JSON.stringify(this._value);
            localStorage.setItem(this.name, JSON.stringify(this._value));
        } else {
            localStorage.removeItem(this.name);
        }
    }

    private getSaved() {
        let saved = localStorage[this.name];
        if (saved) {
            try {
                return JSON.parse(saved, (key, value) => {
                    if(BN_NAMES.includes(key)) {
                        return new BigNumber(value);
                    } else if (typeof value === 'string' && DATE_ISO_PATTERN.test(value)) {
                        return new Date(value);
                    }

                    return value;
                });
            } catch (error) {
                console.error(error);
                localStorage[this.name] = undefined;
            }
        }
        return this.defaultValue;
    }
}