"use strict";
Object.defineProperty(exports, "__esModule", {value: true});

class Model{
    constructor(solution, name) {
        this._solution = solution
        if(name['table'] === undefined) {
            this._name = name;
        }else{
            this._data = name
        }
    }

    async desc() {
        return this._data
    }

    async query(fields, limit, offset, filter, order) {
        return 'test'
    }

    async get(fields) {

    }

    async create(val) {

    }

    async wirte(filter, val) {

    }

    async delete(filter) {

    }
}

module.exports = Model