import { cloneDeep } from "../shared/helper";

export class StorageItem<T> {

    name: string;
    defaultValue: T;
    private _value: T;

    constructor(name: string, defaultValue: T) {
        this.name = name;
        this.defaultValue = defaultValue?? cloneDeep(defaultValue);
    }
    
    get value(): T {
        if(!this._value) {
            let saved = localStorage[this.name];
            this._value = saved? JSON.parse(saved): this.defaultValue;
        }

        return this._value;
    }
    set value(value: T) {
        this._value = value;
        this.save();
    }

    save() {
        if(this._value) {
            //localStorage[this.name] = JSON.stringify(this._value);
            localStorage.setItem(this.name, JSON.stringify(this._value));
        } else {
            localStorage.removeItem(this.name);
        }
    }
}