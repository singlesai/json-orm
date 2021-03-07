Object.defineProperty(exports, "__exModule", {value: true});

const Model = require('./model.js');
const data = require('../data/base.json');
const { isObject } = require('util');

class Solution {
    constructor(cfgSrc, name){
        if(name === undefined){
            this._data = data.solution
            this._databases = data.solution.databases
            this._maindb = data.solution.maindb
            this._applications = data.solution.applications
            this._models = data.solution.models
        }
        if(isObject(cfgSrc)) {
            var solutions = cfgSrc.model('solution').query({'=': ['{name}', name]})
            if(solutions) {
                var solution = solutions[0]
                this._data = solution
                this._name = solution.name
                this._caption = solution.caption
                this._description = solution.description
                this._databases = solution.databases
                this._maindb = solution.maindb,
                this._applications = solution.applications
                this._models = solution.models
            }else{
                throw 'Solution '+name+' Not Exists'
            }
        }
    }
    
    async model(name) {
        return new Model(this, name)
        if(this._data === undefined) {
            return new Model(this, name)
        }else{
            var rst = undefined
            for(var idx in this._data.application) {
                var app = this._data.application[idx]
                if(app.model[name] !== undefined) {
                    if(rst === undefined) {
                        rst = app.model[name]
                    }else{
                        rst.extend(app.model[namme])
                    }
                }
            }
            return new Model(this, rst)
        }
    }

    async installApplication() {

    }

    async unInstallApplication() {

    }

    async applications() {

    }
}

module.exports = Solution