"use strict";
const { isObject, isArray, isString } = require('util');
const Database = require('../db/index')
const Filter = require('../db/Filter')

Object.defineProperty(exports, "__esModule", {value: true});

class Model{
    constructor(solution, name) {
        this._solution = solution
        var model = this._solution._models[name]
        this._data = model
        this._table = model.table
        this._property = model.property
        this._createIfNotExists=true||model.createIfNotExists
        if(model.database===undefined) {
            this._database = this._solution._maindb
        }else{
            this._database = model.database
        }
    }

    async initDb() {
        if(this._db === undefined) {
            this._db = new Database(this._database.type, this._database.cfg)
        }
        if(this._tableInfo === undefined){
            this._tableInfo = await this._db.tableInfo(this._table)
        }
        if(this._tableInfo === undefined){
            if(this._createIfNotExists){
                var fields = []
                for(var idx in this._property){
                    var property = this._property[idx]
                    switch(property.type){
                        case 'string':
                        case 'int':
                        case 'date':
                        case 'double':
                        case 'datetime':
                        case 'auto':
                            fields.push({name: property.field, type: property.type})
                            break
                        default:
                            break
                    }
                }
                await this._db.addField(this._table,fields)
            }
            this._tableInfo = await this._db.tableInfo(this._table)
        }
        return this._db
    }

    async desc() {
        return this._data
    }

    toDbFilter(filter) {
        if(!filter) return undefined
        if(isObject(filter)){
            for(var key in filter){
                switch(key){
                    case "&":
                    case "|":
                        break
                    default:
                        filter[key]=this.toDbFilter(filter[key])
                }
            }
        }
        if(isArray(filter)){
            for(var idx in filter){
                filter[idx]=this.toDbFilter(filter[idx])
            }
        }
        if(isString(filter)){
            if(filter.substr(0,1)==='{' && filter.substr(filter.length-1,1)==='}'){
                var prop = filter.substr(1,filter.length-2)
                if(prop in this._property){
                    filter = '{'+this._property[prop].field+'}'
                }
            }       
        }
        return filter
    }

    async query( filter, fields, limit, offset, order) {
        await this.initDb()
        var dbFilter = new Filter(this.toDbFilter(filter))
        var dataRecs = await this._db.query(this._table, dbFilter,fields, order, limit, offset)
        var rst = []
        for(var idx in dataRecs){
            var r = {}
            var dataRec = dataRecs[idx]
            for(var prop in this._property){
                var property = this._property[prop]
                if(property.field in dataRec){
                    r[prop] = dataRec[property.field]
                }
            }
            rst.push(r)
        }
        return rst
    }

    async create(val) {
        await this.initDb()
        var rec = {}
        for(var prop in val){
            if(prop in this._property){
                rec[this._property[prop].field] = val[prop]
            }
        }
        var rst = await this._db.create(this._table, rec)
        return rst
    }

    async write(filter, val) {
        await this.initDb()
        var dbFilter = new Filter(this.toDbFilter(filter))
        var rec = {}
        for(var prop in val){
            if(prop in this._property){
                rec[this._property[prop].field] = val[prop]
            }
        }
        var rst = await this._db.write(this._table, dbFilter, rec)
        return rst
    }

    async delete(filter) {
        await this.initDb()
        var dbFilter = new Filter(this.toDbFilter(filter))
        var rst = await this._db.delete(this._table, dbFilter)
        return rst
    }
}

module.exports = Model