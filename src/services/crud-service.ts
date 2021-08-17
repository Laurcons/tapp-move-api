
import mongoose from "mongoose";

abstract class CrudService<Item extends mongoose.Document> {
    /**
     * Provides Mongo database access, to a specific model's collection.
     *
     * @protected
     * @type {mongoose.Model<Item>}
     * @memberof CrudService
     */
    protected model: mongoose.Model<Item>;

    constructor(model: mongoose.Model<Item>) {
        this.model = model;
    }
}

export default CrudService;