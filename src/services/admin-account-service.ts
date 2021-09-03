import { Admin, AdminModel } from "../routes/admin/admin-account/admin-model";
import CrudService from "./crud-service-base";

export default abstract class AdminAccountService extends CrudService<Admin> {
    private static _instance: AdminAccountService | null = null;
    static get instance() {
        if (!this._instance) this._instance = new AdminAccountServiceInstance();
        return this._instance;
    }

    constructor() {
        super(AdminModel);
    }

}
class AdminAccountServiceInstance extends AdminAccountService {}