import { Request, Response, NextFunction } from 'express';

export function asyncWrap(child: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
        child(req, res, next).catch(next);
    }; 
}