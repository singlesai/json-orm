var oracle = require('oracledb'),
    events = require('events'),
    util = require('util'),
    fs = require('fs');

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
        connectString:this.hostname+':'+this.port+'/'+this.database,
    }
    oracle.autoCommit=false;
    oracle.getConnection(config,function(err,cn){
        if(err){
            console.log('数据库连接错误',err);
            callBack(err);
            return;
        }
        cur.cn = cn;
        callBack();
    })
}

db.prototype.begTran = function(){
    if(oracle.autoCommit) oracle.autoCommit=false;
}

db.prototype.endTran = function(){
    if(!oracle.autoCommit){
        this.cn.commit();
        oracle.autoCommit=true;
    }
}

db.prototype.exitTran = function(){
    if(!oracle.autoCommit){
        this.cn.rollback();
        oracle.autoCommit=true;
    }
}

db.prototype.close = function(){
    this.cn.close();
}

db.prototype.excSql = function(strSql,callBack){
    var cur = this;
    if(this.cn===undefined) {
        this.open(function(){
            cur.excSql(strSql,callBack);
        })
        return;
    }
    this.cn.execute(strSql,function(err,result){
        if(err){
            console.log('db-exc-err',err,strSql);
            callBack(err);
            return;
        }
        console.log('db-exec',strSql);
        var rst = new Array;
        for(r in result.rows){
            var rs = {};
            for(idx in result.metaData){
                rs[result.metaData[idx]['name']]=result.rows[r][idx];
            }
            rst.push(rs);
        }
        callBack(err,rst);
    })
    process.on('uncaughtException', (err) => {
        console.log('db-exc-othererr',err,strSql);
        callBack(err);
    })
}

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

db.prototype.loadTableFields = function(table,callBack){
    try{
        var cur = this;
        if(cur.tables===undefined){
            var bin = fs.readFileSync(__dirname+'../db.json');
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
            var strSql = "select COLUMN_NAME,DATA_TYPE from user_tab_columns where Table_Name='"+table+"' order by column_name";
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
                for(idx in result){
                    fields[result[idx]['COLUMN_NAME']]={"name":result[idx]['COLUMN_NAME'],"type":result[idx]['DATA_TYPE']}
                }
                rst[table]=fields;
                fs.writeFileSync(__dirname+'../db.json',JSON.stringify(rst))
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
                    case "VARCHAR2":
                    case "NVARCHAR2":
                        if(vals.hasOwnProperty(key)){
                            valL.push("'"+vals[key]+"'");
                        }else{
                            valL.push("null");
                        }
                        fieldL.push(key);
                        break;
                    case "TIMESTAMP(6)": 
                        if(vals.hasOwnProperty(key)){
                            valL.push("to_date('"+vals[key]+"','yyyy-MM-dd hh24:mi:ss')");
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
            arrWhere.push("rownum<="+limit.toString());
        }
        if(offset!=undefined){
            arrWhere.push("rownum>="+offset.toString());
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
