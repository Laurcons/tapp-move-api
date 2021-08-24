
import express from "express";

const viewsRouter = express.Router();

viewsRouter.get("/test", (req, res) => {
    res.render("test", {name:"BUBU"});
});

export default viewsRouter;