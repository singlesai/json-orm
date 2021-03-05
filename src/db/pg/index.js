var events = require('events'),
    util = require('util'),
    fs = require('fs');

var pg = require('pg');

function db(hostname,port,database,user,password){
    this.hostname = hostname;
    this.port = port;
    this.database = database;
    this.user = user;
    this.password = password;
}

util.inherits(db, events.EventEmitter);
exports.db = db;

db.prototype.open = function(callBack){
    var cur = this;
    var config = {
        user:this.user,
        password:this.password,
        database:this.database,
        host:this.hostname,
        port:this.port,

        max:20,
        idleTimeoutMillis:3000,
    }

    var pool = new pg.Pool(config);

    pool.connect(function(err,cn,done){
        if(err){
            console.log('数据库连接错误',err);
            callBack(err);
            return;
        }
        cur.cn = cn;
        cur.done = done;
        callBack();
    })

    pool.on('error',function(err,client){
        console.log('pool error-->',err)
    })
}

db.prototype.begTran = function(){
    //if(oracle.autoCommit) oracle.autoCommit=false;
}

db.prototype.endTran = function(){
    /*
    if(!oracle.autoCommit){
        this.cn.commit();
        oracle.autoCommit=true;
    }
    */
}

db.prototype.exitTran = function(){
    /*
    if(!oracle.autoCommit){
        this.cn.rollback();
        oracle.autoCommit=true;
    }
    */
}

db.prototype.close = function(){
    this.done();
}

db.prototype.excSql = function(strSql,callBack){
    var cur = this;
    if(this.cn===undefined) {
        this.open(function(){
            cur.excSql(strSql,callBack);
        })
        return;
    }
    this.cn.query(strSql,function(err,result){
        if(err){
            console.log('db-exc-err',err,strSql);
            callBack(err);
            return;
        }
        console.log('db-exec',strSql);
        //console.log('db-rst',result);
        callBack(err,result.rows);
    })
    process.on('uncaughtException', (err) => {
        console.log('db-exc-othererr',err,strSql);
        callBack(err);
    })
}
/*
db.prototype.exc_sql = function(strSql,callBack) {
    var config = {
        user:this.user,
        password:this.password,
        connectString:this.hostname+':'+this.port+'/'+this.database,
    }
    oracle.getConnection(config,function(err,cn){
        if(err){
            callBack(err);
            return;
        }
        console.log('sql',strSql);
        cn.execute(strSql, function(err, result) {
            if(err){
                callBack(err);
                return;
            }
            //console.log('result',result);
            var rst = new Array;
            for(r in result.rows){
                var rs = {};
                for(idx in result.metaData){
                    rs[result.metaData[idx]['name']]=result.rows[r][idx];
                }
                rst.push(rs);
            }
            callBack(err,rst);
            cn.close();
        });
    })
}
*/
db.prototype.loadTableFields = function(table,callBack){
    try{
        var cur = this;
        if(cur.tables===undefined){
            var bin = fs.readFileSync(__dirname+'\\..\\db.json');
            if (bin[0] === 0xEF && bin[1] === 0xBB && bin[2] === 0xBF) {
                bin = bin.slice(3);
            }
            var json = bin.toString('utf-8');
            cur.tables = JSON.parse(json);
        }
        var rst = cur.tables
        if(rst.hasOwnProperty(table)){
            callBack(undefined,rst[table])
        }else{
            var strSql="select i.relname,j.attname,k.typname,j.attnum from pg_class i join pg_attribute j on j.attrelid=i.oid join pg_type k on k.oid=j.atttypid where j.attnum>0 and i.relname='"+table+"'"
            this.excSql(strSql,function(err,result){
                if(err){
                    callBack(err);
                    return;
                }
                if(result.length<=0){
                    callBack('表'+table+'不存在');
                    return;
                }
                var fields={};
                //console.log('result',result);
                for(idx in result){
                    fields[result[idx]['attname']]={"name":result[idx]['attname'],"type":result[idx]['typname']}
                }
                rst[table]=fields;
                fs.writeFileSync(__dirname+'\\..\\db.json',JSON.stringify(rst))
                cur.tables = rst;
                callBack(err,rst);
                return;
            })
        }
    }catch(e){
        callBack(e);
    }
}

db.prototype.create = function(table,vals,callBack){
    var cur=this;
    try{
        this.loadTableFields(table,function(err,fields){
            if(err){
                console.log('db-create-loadfield-err',err);
                callBack(err);
                return;
            }
            var fieldL = new Array;
            var valL = new Array;
            for(key in fields){
                var field=fields[key];
                switch(field.type){
                    case "varchar":
                        if(vals.hasOwnProperty(key)){
                            valL.push("'"+vals[key]+"'");
                        }else{
                            valL.push("null");
                        }
                        fieldL.push(key);
                        break;
                    case "timestamp": 
                        if(vals.hasOwnProperty(key)){
                            valL.push("'"+vals[key]+"'");
                        }else{
                            valL.push("null");
                        }
                        fieldL.push(key);
                        break;
                    default:
                        if(vals.hasOwnProperty(key)){
                            valL.push(vals[key].toString());
                        }else{
                            valL.push("0");
                        }
                        fieldL.push(key);
                        break;
                }
            }
            var strSql="insert into "+table+"("+fieldL.join(",")+")values("+valL.join(",")+")";
            cur.excSql(strSql,function(err,rst){
                if(err){
                    console.log('db-create-excsql-err',err);
                    callBack(err);
                    return;
                }
                callBack(undefined,rst);
            })
        });
    }catch(e){
        console.log('db-create-other-err',e);
        callBack(e);
    }
}

db.prototype.write = function(table, filter, vals,callBack){
    try{
        var fields = this.loadTableFields(table,callBack);
        var valL = new Array;
        var idL = new Array;
        for(key in vals){
            if(!fields.hasOwnProperty(key)){
                continue;
            }
            var field = fields[key];
            switch(field.type){
                case "":
                    valL.push(field.name+"='"+vals[key]+"'")
                    break;
                default:
                    valL.push(field.name+"="+vals[key].ToString())
                    break;
            }
        }
        var strWhere = filter.toWhereSql();
        strWhere = strWhere===""?"":"where "+strWhere;
        var strSql = "update "+table+" set "+valL.join(",")+" "+strWhere;
        this.excSql(strSql,callBack)
    }catch(e){
        callBack(e);
    }
}

db.prototype.delete = function(table,filter,callBack){
    try{
        var strWhere = filter.toWhereSql();
        strWhere = strWhere===""?"":"where "+strWhere;
        var strSql = "delete from "+table+" "+strWhere;
        this.excSql(strSql,callBack);
    }catch(e){
        callBack(e);
    }
}

db.prototype.query = function(table,callBack,filter,limit,offset,order,fields){
    var db = this;

    try{
        var fieldL= new Array;
        for(key in fields){
            fieldL.push(key);
        }
        //console.log('filter',filter);
        var strFields = "*";
        if(fieldL.length>0){
            strFields = fieldL.join(",");
        }
        var strOrder = order ===undefined?"":"order by"+order;
        var arrWhere = []
        if(filter!=undefined){
            arrWhere.push(filter.toWhereSql());
        }
        if(limit!=undefined){
            if(offset===undefined){
                offset=0;
            }
            arrWhere.push("i_id>"+offset.toString()+" limit "+limit.toString());
        }
        if(arrWhere.length<=0){
            strWhere="";
        }else{
            strWhere="where "+arrWhere.join(" and ");
        }

        var strSql = "select "+strFields+" from "+table+" "+strWhere+" "+strOrder;
        db.excSql(strSql,function(err,rst){
            if(err){
                callBack(err);
                return;
            }
            //console.log(rst);
            callBack(err,rst);
        });
    }catch(e){
        callBack(e);
    }
}
