import { Request, Response } from "express";

export const rawBodySaver = (req: Request, res: Response, buf: Buffer, encoding: any) => {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
};