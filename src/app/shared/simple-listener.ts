export type ListenerRemover = () => boolean;
export type ListenerAction = (...args: Array<any>) => void;
export type FireCondition = () => boolean;

// This class let's to add functions that are fire method is called.
//
export class SimpleListener {

	private listeners: Array<ListenerAction> = [ ];

	public getSize = (): number => {
		return this.listeners.length;
	};

	public add = (action: ListenerAction): ListenerRemover => {
		if (action instanceof Function) {
			this.listeners.push(action);
            let removed = false;
            const remove = (): boolean => {
				if (removed) {
                  	return false;
                }
                removed = true;
                return this.remove(action);
			};
			return remove;
		}
		throw new Error( 'Indicated listener action is not function type.' );
	};

    public addAndFire = (action: ListenerAction, condition: FireCondition, ...args: Array<any>): ListenerRemover => {
        let remove = this.add(action);

        if (condition()) {
			action.apply(action, args);
        }

        return remove;
    };

	public remove = (action: ListenerAction): boolean => {
		for (let i = 0; i < this.listeners.length; ++i) {
			if (action === this.listeners[i]) {
				this.listeners.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	public fire = (...args: Array<any>): void => {
		for (let i = 0; i < this.listeners.length; ++i) {
			const listener = this.listeners[i];
			listener.apply(listener, args);
		}
	};

    public clean = (): void => {
    	this.listeners = [ ];
    };
}