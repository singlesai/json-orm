var events = require('events'),
    util = require('util'),
    fs = require('fs'),
    db = require('../db'),
    async = require('../../node_modules/async');

function model(name){
    this.name = name;
}

util.inherits(model, events.EventEmitter);
exports.model = model;

model.prototype.loadModelList = function(){
    var bin = fs.readFileSync(__dirname+'/models.json');
    if (bin[0] === 0xEF && bin[1] === 0xBB && bin[2] === 0xBF) {
        bin = bin.slice(3);
    }
    var json = bin.toString('utf-8')
    var rst = JSON.parse(json);
    var props = []
    for(key in rst){
        props.push(key)
    }
    return props;
}

model.prototype.loadModelInfo = function(db,callBack){
    var model = this;
    try{
        var bin = fs.readFileSync(__dirname+'/models.json');
        if (bin[0] === 0xEF && bin[1] === 0xBB && bin[2] === 0xBF) {
            bin = bin.slice(3);
        }
        var json = bin.toString('utf-8')
        var rst = JSON.parse(json);
        if(!rst.hasOwnProperty(this.name)) {
            console.log('model-loadprops',this);
            callBack('对象'+this.name+'无定义',rst)
            return;
        }
        
        mdl = rst[this.name];
        
        if(mdl.hasOwnProperty('table')){
            model.table = mdl.table;
        }else{
            model.table = model.name;
        }
        db.loadTableFields(mdl.table,function(err,fields){
            if(err){
                callBack(err);
                return;
            }
            if(!mdl.hasOwnProperty('props')){
                console.log('fields',fields);
                mdl.props={}
                for(idx in fields){
                    mdl['props'][fields[idx].name]={field:fields[idx].name}
                }
                console.log('mdl',JSON.stringify(mdl));
            }
            for(idx in mdl['props']){
                if(mdl['props'][idx].hasOwnProperty('field')){
                    if(!mdl['props'][idx]['field'].hasOwnProperty('name')){
                        mdl['props'][idx]['field']=fields[mdl['props'][idx]['field']];
                    }
                }
            }
            
            callBack(undefined,mdl);
        })
    }catch(e){
        callBack(e);
    }
}

model.prototype.expand = function(db, vals, callBack){
    //console.log('vals',vals)
    this.loadModelInfo(db,function(err,mi){
        if(err){
            callBack(err);
            return;
        }
        propSet = {};
        //console.log('vals',vals)
        for(prop in vals){
            if(!mi.props.hasOwnProperty(prop)){
                //vals[prop]=undefined
            }else{
                var pi=mi.props[prop];
                if(pi.hasOwnProperty('relation')){
                    var rl = pi['relation']
                    if(rl.type==='m2o'||rl.type==='o2m'){
                        propSet[prop] = vals[prop];
                    }
                }
            } 
        }
        async.forEachOfLimit(propSet,5,(value,key, cb) =>{
            var rl = mi.props[key]['relation']
            var mdl = new model(rl.model);
            if(rl.type==='m2o'){
                //console.log('mdl',rl.model)
                mdl.queryByVal(db,vals[key],function(err,propVal){
                    if(err){
                        cb(err);
                        return;
                    }
                    vals[key] = propVal;
                    cb(err,propVal)
                })
            }
            if(rl.type==='o2m'){
                mdl.expendList(db,vals[key],function(err,propVal){
                    if(err){
                        cb(err);
                        return;
                    }
                    vals[key]=propVal;
                    cb(err,propVal)
                })
            }
        },err=>{
            if(err){
                callBack(err);
                return;
            }
            callBack(undefined,vals)
        })
    })
}

model.prototype.expendList = function(db,vals,callBack){
    //console.log('list',vals);
    async.forEachOf(vals,(value,key,cb)=>{
        this.expand(db,value,function(err,rst){
            if(err){
                cb(err);
                return;
            }
            vals[key]=rst;
            cb(err,rst);
        })
    },err=>{
        if(err){
            callBack(err);
            return;
        }
        //console.log('listr',vals);
        callBack(undefined,vals);
    })
}

model.prototype.setDefault = function(db,vals,cp){
    this.loadModelInfo(db,function(err,mdl){
        if(err){
            cp(err);
            return;
        }
        propSetVal = {};
        
        for(prop in mdl.props){
            if(mdl.props[prop].hasOwnProperty('default') && mdl.props[prop].default!=undefined && (!vals.hasOwnProperty(prop)||vals[prop]===undefined)){
                var formula = "var defaultFormula = "+mdl.props[prop].default;
                
                try{
                    eval(formula);
                }catch(e){
                    cp('表达式设置出错'+formula);
                    return;
                }
                //console.log('fma',formula)
                //console.log('def',defaultFormula)
                
                if(typeof defaultFormula==="function"){
                    propSetVal[prop]=defaultFormula;
                }else{
                    vals[prop]=defaultFormula;
                }
            }
        }
        async.forEachOf(propSetVal,(value,key,cb)=>{
            //console.log('key',key);
            //console.log('fma',value)
            value(function(err,rst){
                vals[key]=rst;
                cb(err,rst);
            })
            //cb(undefined,undefined)
        },err=>{
            cp(err,vals);
        })
    })
}

model.prototype.checkRequired = function(db,vals,cp){
    this.loadModelInfo(db,function(err,mdl){
        if(err){
            cp(err);
            return;
        }
        var errMsg=undefined
        for(prop in mdl.props){
            
            if(mdl.props[prop].hasOwnProperty('required') && mdl.props[prop]['required']===true && (vals[prop]===undefined || vals[prop]==='')){
                errMsg='屬性'+prop+'不能為空';
                break;
            }
            
        }
        if(errMsg!=undefined)
            cp(errMsg,vals)
        else
            cp(undefined,vals)
    })
}

model.prototype.create = function(db, vals, callBack){
    //console.log('vals',vals);
    var cur = this;
    this.loadModelInfo(db,function(err,mdl){
        if(err){
            callBack(err);
            return;
        }
        var saveOp = []
        
        saveOp.push(function(cp){
            cur.setDefault(db,vals,function(err,rst){
                if(err){
                    cp(err);
                    return;
                }
                //console.log('val',vals);
                vals = rst;
                cp(undefined,rst);
            })
        })
        
        saveOp.push(function(cp){
            cur.checkRequired(db,vals,function(err,rst){
                if(err){
                    cp(err);
                    return;
                }
                //console.log('va',rst);
                cp(undefined,rst);
            })
        })
        
        saveOp.push(function(cp){
            dval = {};
            for(prop in vals){
                if(mdl.props.hasOwnProperty(prop) && mdl.props[prop].hasOwnProperty('field')){
                    if(mdl.props.hasOwnProperty('dataauto') && mdl.props['dataauto']===true){

                    }else{
                        if(mdl.props[prop].hasOwnProperty('relation')){
                            if(mdl.props[prop]['relation'].type==='m2o'){
                                dval[mdl.props[prop]['field'].name]=vals[prop].id
                            }
                        }else{
                            dval[mdl.props[prop]['field'].name]=vals[prop];
                        }
                    }
                }
            }
            //console.log('dval',dval);
            db.create(mdl.table,dval,function(err,rst){
                if(err){
                    console.log('Save Rec',err);
                    cp(err);
                    return;
                }
                cp(undefined,rst);
            })
        })
        
        saveOp.push(function(cp){
            eVals = {}
            for(prop in vals){
                if(mdl.props.hasOwnProperty(prop) && mdl.props[prop].hasOwnProperty('relation') && mdl.props[prop]['relation'].type==='o2m'){
                    eVals[prop]={model:mdl.props[prop]['relation'].model,vals:[]}
                    for(idx in vals[prop]){
                        vals[prop][idx][mdl.props[prop]['relation'].key]=vals['id'];
                        eVals[prop].vals.push(vals[prop][idx])
                        //eVals[mdl.props[prop]['relation'].model]=vals[prop][idx];
                    }
                }
            }
            //console.log('evals',eVals);
            async.forEachOfLimit(eVals,3,(value,key,ccp)=>{
                var eMdl = new model(value.model);
                eMdl.createList(db,value.vals,function(err,rst){
                    if(err){
                        ccp(err);
                        return;
                    }
                    ccp(undefined,rst);
                });
            },err=>{
                if(err){
                    cp(err);
                    return;
                }
                cp(undefined,undefined)
            })
        })
        
        async.series(saveOp,function(err,datas){
            if(err){
                callBack(err);
                return;
            }
            callBack(undefined,vals);
        })
        
    })
}
model.prototype.createList = function(db,vals,callBack){
    async.forEachOfLimit(vals,3,(value,key,cb)=>{
        this.create(db,value,function(err,rst){
            if(err){
                console.log('entryCreate',err);
                cb(err);
                return;
            }
            //console.log('entry',rst);
            vals[key]=rst;
            cb(err,rst);
        })
    },err=>{
        if(err){
            callBack(err);
            return;
        }
        callBack(undefined,vals);
    })
}

model.prototype.write = function(filter,vals,callBack){
    callBack(undefined,vals);
}

model.prototype.delete = function(filter,callBack){
    callBack(undefined,vals);
}

model.prototype.query = function(db, callBack, filter, limit, offset, order, props){
    var cur = this;
    this.loadModelInfo(db,function(err,model){
        if(err){
            callBack(err);
            return;
        }
        try{
            var table = model.table;
            var dbFilter=undefined;
            if(filter!=undefined){
                dbFilter = filter.toDbFilter(model.props);
            }
            var dbOrder=undefined;
            if(order!=undefined){
                dbOrder = [];
                for(ord in order){
                    dbOrder.push(ord.toDbOrder(model.props));
                }
            }
            var fields={},
                ps = {};
            //console.log('props',model.props);
            if(props!=undefined){
                for(key in props){
                    if(model.props.has(key)){
                        if(model.props[key].field===undefined) continue;
                        ps[model.props[key].field.name]={"name":key,"field":model.props[key].field};
                        fields[model.props[key].field.name] = model.props[key].field;
                    }
                }
            }else{
                for(key in model.props){
                    if(model.props[key].field===undefined) continue;
                    ps[model.props[key].field.name]={"name":key,"field":model.props[key].field};
                    fields[model.props[key].field.name] = model.props[key].field;
                }
            }
            //console.log('ps',ps);
            db.query(model.table, function(err,data){
                if(err){
                    callBack(err);
                    return;
                }
                var rst = []
                for(idx in data){
                    var rec = data[idx];
                    var obj = {};
                    for(key in rec){
                        if(ps.hasOwnProperty(key)){
                            if(model.props[ps[key].name].hasOwnProperty('relation')){
                                obj[ps[key].name]={id:rec[key]};
                            }else{
                                obj[ps[key].name]=rec[key];
                            }
                            
                        }
                    }
                    rst.push(obj);
                }
                callBack(err,rst);
            },dbFilter,limit,offset,order,fields)
        }catch(e){
            callBack(e);
        }
    })
}

model.prototype.queryByVal = function(db, val, callBack){//通过部分值还原所有属性
    var cur = this;
    
    this.loadModelInfo(db,function(err,mi){
        if(err){
            callBack(err);
            return;
        }

        var filters = [];
        for(prop in val){
            if(!mi.props.hasOwnProperty(prop)) continue;
            if(!mi.props[prop].hasOwnProperty("field")) continue;
            var value = val[prop]
            if(mi.props[prop].hasOwnProperty('relation')){
                value=value.id
            }
            switch(mi.props[prop]["field"].type){
                case "NUMBER":
                    filters.push(new filter("=",[new filter("prop",prop),new filter("num",value)]))
                    break;
                case "VARCHAR2":
                case "NVARCHAR2":
                    filters.push(new filter("=",[new filter("prop",prop),new filter("str",value)]))
                break;
            }
        }
        flt = new filter("and",filters);
        //console.log(cur.name,val,mi.props[prop],flt);
        var mdl = cur.query(db,function(err,rst){
            if(err){
                console.log((mi.desc===undefined?cur.name:mi.desc)+':findrec-err',val,flt)
                callBack(err);
                return;
            }
            if(rst.length<=0){
                callBack('对象记录'+(mi.desc===undefined?cur.name:mi.desc)+':'+JSON.stringify(val)+'不存在')
                return;
            }
            if(rst.length>1){
                callBack('对象记录'+(mi.desc===undefined?cur.name:mi.desc)+':'+JSON.stringify(val)+'不唯一')
                return;
            }
            callBack(undefined,rst[0])
        },flt)
    })
}

function filter(op,val){
    this.op = op;
    this.val = val;
}

util.inherits(filter, events.EventEmitter);
exports.filter = filter;

filter.prototype.toDbFilter = function(modelProps){
    switch(this.op){
        case 'prop':
            if(modelProps.hasOwnProperty(this.val)){
                return new db.filter("field",modelProps[this.val].field.name);
            }else{
                throw ('属性'+this.val+'不存在')
            }
            break;
        case 'num':
        case 'str':
            return new db.filter(this.op,this.val);
            break;
        default:
            if(Array.isArray(this.val)){
                var rst = new db.filter(this.op,[]);
                for(idx in this.val){
                    var tf = this.val[idx];
                    //rst.val.push(new db.filter(tf.op,tf.toDbFilter(modelProps)));
                    rst.val.push(tf.toDbFilter(modelProps));
                }
                return rst;
            }else{
                return new db.filter(this.op,this.val.toDbFilter(modelProps));
            }
            break;
    }
}

function order(prop, order){
    this.prop = prop;
    this.order = order;
}

util.inherits(order, events.EventEmitter);
exports.order = order;

order.prototype.toDbOrder = function(modelProps){
    if(modelProps.hasOwnProperty(this.prop)){
        return new db.order(modelProps[this.prop].field.name,order);
    }else{
        throw new error('属性'+this.prop+'未定义');
    }
}



