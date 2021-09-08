
import mongoose from "mongoose";
import ApiError from "../api-error";

abstract class CrudService<Doc extends mongoose.Document> {
	/**
	 * Provides Mongo database access, to a specific model's collection.
	 *
	 * @protected
	 * @type {mongoose.Model<Doc>}
	 * @memberof CrudService
	 */
	protected model: mongoose.Model<Doc>;

	constructor(model: mongoose.Model<Doc>) {
		this.model = model;
	}

	async insert(doc: Partial<Doc>) {
		const newDoc = await this.model.create(doc);
		return newDoc;
	}

	insertMany(docs: Partial<Doc>[]) {
		return this.model.insertMany(docs);
	}

	find(criteria: mongoose.FilterQuery<Doc>) {
		return this.model.find(criteria);
	}

	findOne(criteria: mongoose.FilterQuery<Doc>) {
		return this.model.findOne(criteria);
	}

	findPaginated(
		start: number,
		count: number,
		criteria: mongoose.FilterQuery<Doc> = {}
	) {
		return this.model.find(criteria).skip(start).limit(count);
	}

	findId(id: string | mongoose.Types.ObjectId) {
		if (typeof id === "string") {
			try {
				id = new mongoose.Types.ObjectId(id);
			} catch (e) {
				throw ApiError.invalidIdError;
			}
		}
		return this.model.findById(id);
	}

	updateMany(
		conditions: mongoose.FilterQuery<Doc>,
		updates: mongoose.UpdateQuery<Doc>
	) {
		return this.model.updateMany(conditions, updates);
	}

	updateOne(
		conditions: mongoose.FilterQuery<Doc>,
		updates: mongoose.UpdateQuery<Doc>
	) {
		return this.model.updateOne(conditions, updates);
	}

	deleteMany(conditions: mongoose.FilterQuery<Doc>) {
		return this.model.deleteMany(conditions);
	}

	deleteOne(conditions: mongoose.FilterQuery<Doc>) {
		return this.model.deleteOne(conditions);
	}

	aggregate(pipeline: any[]) {
		return this.model.aggregate(pipeline);
	}

	count() {
		return this.model.countDocuments();
	}
}

export default CrudService;