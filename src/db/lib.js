var events = require('events'),
    util = require('util');

function filter(op,val){
    if(val===undefined){
        if(op.length<=2){
            op="[]"
        }
        var arr=JSON.parse(op);
        var track = [];
        for(idx in arr){
            var pc = 0;
            if(track.length>0){
                track[track.length-1]-=1;
                pc=track[track.length-1];
                if(pc===0) track.pop();
            }
            var rec = arr[idx];
            if(rec instanceof Array){//字段
                return new filter("prop",rec);
            }else{
                switch(typeof rec){
                    case "string":
                    switch(rec){
                        case "&":
                        break;
                        case "|":
                        break;
                        case "!":
                        track.push(1);
                        break;
                        case "=":
                        case ">=":
                        case "<=":
                        case "like":
                        case "<>":
                            return new filter(rec,[]);
                        track.push(2);
                        break;
                        default:
                            return new filter("str",rec);
                        break;
                    }
                    break;
                    case "number":
                        return new filter("num",rec);
                    break;
                    default:
                    break;
                }
            }
        }
    }else{
        this.op = op;
        this.val = val;
    }
}

filter.prototype.toWhereSql = function(){
    try{
        switch(this.op){
            case 'field':
            case 'num': 
                return this.val.toString();
                break;
            case 'str':
                return "'"+this.val.toString()+"'";
                break;
            default:
                if(Array.isArray(this.val)){
                    var lst = new Array;
                    for(idx in this.val){
                        cf = this.val[idx];
                        lst.push(cf.toWhereSql())
                    }
                    if(lst.length>1){
                        return '('+lst.join(' '+this.op.toString()+' ')+')';
                    }else{
                        return '('+lst[0]+')';
                    }
                }else{
                    return '('+this.op.toString()+' '+this.val.toWhereSql()+')';
                }
                break;
            }
    }catch(e){
        console.log('e',e);
        console.log('op',this.op);
        console.log('val',this.val);
        throw new Error('filter 解析错误'+e.toString());
    }
}

util.inherits(filter, events.EventEmitter);
exports.filter = filter;

function order(field,order){
    this.field = field;
    this.order = order;
}

util.inherits(order, events.EventEmitter);
exports.order = order;

order.prototype.toSql = function(){
    return this.field+" "+this.order
}