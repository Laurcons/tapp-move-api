
export default class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string) {
        super(`${code}(${status}): ${message}`);
        this.status = status;
        this.code = code;
    }
}