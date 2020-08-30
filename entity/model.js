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

    desc() {
        return this._data
    }

    query(fields, limit, offset, filter, order) {
        return 'test'
    }

    get(fields) {

    }

    create(val) {

    }

    wirte(filter, val) {

    }

    delete(filter) {

    }
}

module.exports = Model