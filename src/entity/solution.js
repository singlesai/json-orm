Object.defineProperty(exports, "__exModule", {value: true});

const Model = require('./model.js');
const data = require('../data/base.json');

class Solution {
    constructor(cfgSrc, name){
        this._cfgSrc = cfgSrc
        this._name = name
    }

    async init(){
        if(!this._data){ //未初始化
            if(!this._cfgSrc) { //无配置，默认读取主数据库，主方案
                this._name = this._name || 'base'
                var solution = new Solution(data)
                var model = await solution.model('solution')
                var solutions = await model.query({'=': ['{name}', this._name]})
                if(solutions.length>0){
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
                    throw 'Solution {base} Not Exists'
                }
            }else{
                if(this._name === undefined){ //无名称，从配置获取
                    this._data = this._cfgSrc.solution
                    this._databases = this._data.databases
                    this._maindb = this._data.maindb
                    this._applications = this._data.applications
                    this._models = this._data.models
                }else{ //有方案，从主数据库根据方案名称获取方案
                    var model = await this._cfgSrc.model('solution')
                    var solutions = model.query({'=': ['{name}', this._name]})
                    if(solutions.length>0) {
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
                        throw 'Solution {'+this._name+'} Not Exists'
                    }
                }
            }
        }
    }
    
    async model(name) {
        await this.init()
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