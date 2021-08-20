import { Request, Response, NextFunction } from "express";

// we need to add function generics for Request and Response
//  to accomodate for passing generics to the classes (which, apparently, changes the type)
export function asyncWrap<Params, ResBody, ReqBody, ReqQuery, Locals>(
	child: (
		req: Request<Params, ResBody, ReqBody, ReqQuery, Locals>,
		res: Response<ResBody, Locals>,
		next: NextFunction
	) => Promise<void>
) {
	return (
		req: Request<Params, ResBody, ReqBody, ReqQuery, Locals>,
		res: Response<ResBody, Locals>,
		next: NextFunction
	) => {
		child(req, res, next).catch(next);
	};
}
