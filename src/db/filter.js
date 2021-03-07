const { isArray, isObject } = require("util");
const { Console } = require("console");

class Filter{
    constructor(val){
        var idx
        // console.log('Filter', val)
        if(isArray(val)){
            this._op = "&"
            this._child = []
            for(idx in val){
                this._child.push(new Filter(val[idx]))
            }
        }
        if(isObject(val)){
            if(val['&']){
                this._op="&"
                this._child = []
                for(var idx in val['&']){
                    this._child.push(new Filter(val['&'][idx]))
                }
            }
            if(val['|']){
                this._op="|"
                this._child = []
                for(var idx in val['|']){
                    this._child.push(new Filter(val['|'][idx]))
                }
            }
            if(val['=']){
                this._op="="
                this._child = val['=']
            }
            if(val['!=']){
                this._op="!="
                this._child = val['!=']
            }
            if(val['>']){
                this._op=">"
                this._child = val['>']
            }
            if(val['>=']){
                this._op=">="
                this._child = val['>=']
            }
            if(val['<']){
                this._op="<"
                this._child = val['<']
            }
            if(val['<=']){
                this._op="<="
                this._child = val['<=']
            }
            if(val['like']){
                this._op="like"
                this._child = val['like']
            }
        }
    }
}

module.exports = Filter