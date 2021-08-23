
import {Request, Response, NextFunction} from "express";

export default function handleNotFound() {
    return (req: Request, res: Response, next: NextFunction) => {
        res.status(404).json({
            status: "route-not-found",
            method: req.method,
            path: req.path
        });
    }
}