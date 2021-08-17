
export class Logger {
    private _prefix: string;

    constructor(options: {
        prefix: string;
    }) {
        this._prefix = options.prefix.toUpperCase();
    }

    log(...args: any[]) {
        console.log(`[${this._prefix}]`, ...args);
    }
}