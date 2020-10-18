Object.defineProperty(exports, "__exModule", {value: true});

const Model = require('./model.js');
const data = require('../data/base.json');
const { isObject } = require('util');

class Solution {
    constructor(cfgSrc, name){
        if(name === undefined){
            this._data = data.solution
        } 
        if(isObject(cfgSrc)) {
            var solutions = cfgSrc.model('solution').query({'=': ['{name}', name]})
            if(solutions) {
                this._data = solutions[0]
            }else{
                throw 'Solution '+name+' Not Exists'
            }
        }
    }
    
    async model(name) {
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