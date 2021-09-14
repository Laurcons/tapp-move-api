import { NextFunction, Request, Response } from "express";

export default function throttle(ms: number) {
	return (req: Request, res: Response, next: NextFunction) => {
        setTimeout(next, ms);
	};
}
