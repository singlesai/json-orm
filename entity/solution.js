Object.defineProperty(exports, "__exModule", {value: true});

const Model = require('./model.js');
const data = require('../data/base.json');

class Solution {
    constructor(name){
        if(name === undefined){
            this._data = data.solution
        } else {
            this._name = name
        }
    }
    
    model(name) {
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

    installApplication() {

    }

    unInstallApplication() {

    }

    applications() {

    }
}

module.exports = Solution