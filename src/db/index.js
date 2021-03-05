const Model = require("../entity/model")
const Sqlite = require("./sqlite")

class Database{
    constructor(type, cfg){
        this._type = type
        this._cfg = cfg
        switch(type){
            case "sqlite":
                this._db = new Sqlite(cfg)
                break
            case "sqlserver":
            case "mssql":
                break
            case "pgsql":
            case "postgresql":
            case "pg":
                break
            case "oracle":
                break
            case "mysql":
                break
            default:
                throw('Not Support Database')
                break
        }
    }

    async beginTran() {
        return await this._db.begTran()
    }

    async endTran() {
        return await this._db.endTran()
    }

    async exitTran() {
        return await this._db.exitTran()
    }

    async excSql(strSql){
        return await this._db.excSql(strSql)
    }

    async getData(strSql){
        return await this._db.getData(strSql)
    }

    async tableInfo(table){
        return await this._db.tableInfo(table)
    }

    async addField(table, fields){
        return await this._db.addField(table,fields)
    }

    async dropField(table, fields) {
        return await this._db.dropField(table, fields)
    }

    async query(table, fields, filter, order, limit, offset) {
        return await this._db.query(table,fields, filter, order, limit, offset)
    }

    async create(table, val) {
        return await this._db.create(table, val)
    }

    async write(table, filter, val) {
        return await this._db.write(table, filter, val)
    }

    async delete(table, filter) {
        return await this._db.delete(table, filter)
    }
}
module.exports = Database