Object.defineProperty(exports, "__exModule", {value: true});

const Model = require('./model.js');
const data = require('../data/base.json');
const { isObject } = require('util');

class Solution {
    constructor(cfgSrc, name){
        if(cfgSrc === undefined) {
            var solution = new Solution(data)
            var solutions = solution.model('solution').query({'=': ['{name}', 'base']})
            var solution = solutions[0]
            this._data = solution
            this._id = solution.id
            this._name = solution.name
            this._caption = solution.caption
            this._description = solution.description
            this._databases = solution.databases
            this._maindb = solution.maindb,
            this._applications = solution.applications
            this._models = solution.models
        }else{
            if(name === undefined){ //无名称，从配置获取
                this._data = cfgSrc.solution
                this._databases = this._data.databases
                this._maindb = this._data.maindb
                this._applications = this._data.applications
                this._models = this._data.models
            }else{
                var solutions = cfgSrc.model('solution').query({'=': ['{name}', name]})
            }
            if(solutions) {
                var solution = solutions[0]
                this._data = solution
                this._id = solution.id
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
        /*
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
        */
    }

    async installApplication() {

    }

    async unInstallApplication() {

    }

    async applications() {

    }
}

module.exports = Solution