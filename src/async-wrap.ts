import { Request, Response, NextFunction } from 'express';

// we need to add function generics for Request and Response
//  to accomodate for passing generics to the classes (which, apparently, changes the type)
export function asyncWrap<Req extends Request, Res extends Response>(
	child: (req: Req, res: Res, next: NextFunction) => Promise<void>
) {
	return (req: Req, res: Res, next: NextFunction) => {
		child(req, res, next).catch(next);
	};
}