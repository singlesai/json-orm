const sqlite = require('sqlite3')
const cfg = require('../../config.json')
const { table } = require('console')

class Sqlite{
    constructor(path) {
        this._path = path
        this._db = new sqlite.Database(path)
    }

    async begTran(){
        return await new Promise((resolve, reject)=>{
            this._db.run("BEGIN TRANSACTION",(err,rst)=>{
                if(err === null) {
                    resolve(rst)
                } else {
                    reject(err)
                }
            })
        })
    }

    async endTran(){
        return await new Promise((resolve, reject)=>{
            this._db.run("COMMIT TRANSACTION",(err,rst)=>{
                if(err === null) {
                    resolve(rst)
                } else {
                    reject(err)
                }
            })
        })
    }

    async exitTran(){
        return await new Promise((resolve, reject)=>{
            this._db.run("ROLLBACK TRANSACTION",(err,rst)=>{
                if(err === null) {
                    resolve(rst)
                } else {
                    reject(err)
                }
            })
        })
    }

    async excSql(strSql){
        return await new Promise((resolve, reject)=>{
            if(!strSql) {
                reject('sql sentence is null')
            }else{
                if(cfg.log.db.exec) {
                    console.log('exec Sql', strSql)
                }
                this._db.run(strSql,(err, rst)=>{
                    if(err === null) {
                        resolve(rst)
                    } else {
                        console.log('excSql Err:', strSql)
                        reject(err)
                    }
                })
            } 
        }) 
    }

    async getData(strSql) {
        return await new Promise((resolve, reject)=>{
            if(!strSql) {
                reject('sql sentence is null')
            }else{
                if(cfg.log.db.query) {
                    console.log('getData Sql', strSql)
                }
                this._db.all(strSql,(err, rst)=>{
                    if(err === null) {
                        resolve(rst)
                    } else {
                        console.log('getDate Err', strSql)
                        reject(err)
                    }
                })
            }
        })
    }

    async tableInfo(tableName) {
        if(!global.tables){
            global.tables = {}
        }
        if(!global.tables[tableName]){
            var rst = await this.getData("SELECT * FROM sqlite_master where type='table' and name='"+tableName+"' order by name")
            if(rst.length<=0){
                return
            }
            global.tables[tableName] = rst[0]
        }
        if(!global.tables[tableName]['fields']){
            global.tables[tableName]['fields']={}
            rst = await this.getData("PRAGMA table_info(["+tableName+"])")
            for(var idx in rst){
                global.tables[tableName]['fields'][rst[idx].name] = rst[idx]
            }
        }
        return global.tables[tableName]
    }

    async addField(tableName, fields) {
        if(!fields) return
        var rst = await this.getData("SELECT * FROM sqlite_master where type='table' and name='"+tableName+"' order by name")
        var strSql, strArr=[], strTmp
        if(rst.length<=0){
            for(var idx in fields){
                var field = fields[idx]
                strTmp = field.name + ' '
                switch(field.type) {
                    case "string":
                        if(!field.length){
                            field.length = 50
                        }
                        strTmp+='varchar('+field.length+')'
                        break
                    case "int":
                        strTmp="int"
                        break
                    case 'auto':
                        strTmp+=' integer primary key autoincrement'
                        break
                    default:
                        throw 'Not Support Type:'+field.type
                        break
                }
                strArr.push(strTmp)
            }
            strSql="create table "+tableName+"("+strArr.join(',')+")"
        }else{
            var ti = await this.tableInfo(tableName)
            for(var idx in fields){
                var field = fields[idx]
                strTmp = field.name + ' '
                switch(field.type) {
                    case "string":
                        if(!field.length){
                            field.length = 50
                        }
                        strTmp+='varchar('+field.length+')'
                        break
                    case "int":
                        strTmp="int"
                        break
                    case 'auto':
                        strTmp+=' integer primary key autoincrement'
                        break
                    default:
                        throw 'Not Support Type:'+field.type
                        break
                }
                if(ti.fields[field.name] === undefined) {
                    strArr.push(strTmp)
                }
            }
            if(strArr.length>0){
                strSql="alter table "+tableName+" add column "+strArr.join(',')
            }
        }
        if(strSql!==undefined){
            await this.excSql(strSql)
            if(global.tables === undefined){
                global.tables = {}
            }
            global.tables[tableName]=undefined
        }
    }

    async dropField(tableName, fields) {
        var tableInfo = await this.tableInfo(tableName)
        var tmpArr=[]
        for(var idx in fields){
            var field=fields[idx]
            if(tableInfo.fields[field]!==undefined){
                tmpArr.push(field)
            }
        }
        var strSql = "alter table "+tableName+ 'drop column '+tmpArr.join(',')
        await this.excSql(strSql)
        if(global.tables === undefined){
            global.tables = {}
        }
        global.tables[tableName]=undefined
    }

    filterStr(tableInfo, filter){
        if(!filter) return ""
        if(!filter._op) return ''
        var idx=undefined, arrTmp=[], childFilter = undefined, strWhere = undefined
        switch(filter._op)
        {
            case "&":
                strWhere = " and "
            case "|":
                strWhere = " or "
                for(idx in filter._child) {
                    childFilter = filter._child[idx]
                    arrTmp.push("("+this.filterStr(tableInfo, childFilter)+")")
                }
                strWhere = arrTmp.join(strWhere)
                break
            case "=":
            case "!=":
            case ">":
            case ">=":
            case "<":
            case "<=":
            case "like":
                var lVal = filter._child[0],rVal=filter._child[1],lField=undefined,rField=undefined
                if(lVal.substr(0,1)==='{' && lVal.substr(lVal.length-1,1)==='}'){
                    lField = lVal.substr(1,lVal.length-2)
                    if(!tableInfo.fields[lField]){
                        throw "Table '"+tableInfo.name+" Not Exists Field '"+lField+"'"
                    }
                }
                if(rVal.substr(0,1)==='{' && rVal.substr(rVal.length-1,1)==='}'){
                    rField = rVal.substr(1,rVal.length-2)
                    if(!tableInfo.fields[rField]){
                        throw "Table '"+tableInfo.name+" Not Exists Field '"+rField+"'"
                    }
                }
                if(lField && rField){
                    strWhere=lField+filter._op+rField
                }else{
                    if(lField){
                        strWhere=lField+filter._op
                        switch(tableInfo.fields[lField].type){
                            case "int": 
                                strWhere+=rVal
                                break
                            default:
                                strWhere+="'"+rVal+"'"
                                break
                        }
                    }
                    if(rField){
                        strWhere=filter._op+rField
                        switch(tableInfo.fields[rField].type) {
                            case "int":
                                strWhere=lVal+strWhere
                                break
                            default:
                                strWhere="'"+lVal+"'"+strWhere
                                break
                        }
                    }
                    if(lField===undefined && rField===undefined){
                        strWhere = lVal+filter._op+rVal
                    }
                }
                break
            default:
                throw "Filter Err:"+JSON.stringify(filter)
                break
        }
        return strWhere
    }

    async query(table, filter, fields, order, limit, offset) {
        var tableInfo = await this.tableInfo(table)
        var nFields = []
        var field
        if(fields){
            for(field in fields){
                if(tableInfo.fields[fields[field]]) {
                    nFields.push(fields[field])
                }
            }
        }else{
            for(field in tableInfo.fields){
                nFields.push(field)
            }
        }
        var strSql = "select " + nFields.join(",") + " from "+table
        //console.log(tableInfo, filter)
        var strWhere = this.filterStr(tableInfo, filter)
        if(strWhere) {
            strSql += " where "+strWhere
        }

        var nOrder=[]
        if(order){
            for(field in order){
                if(tableInfo.fields[field]){
                    nOrder.push(field+" "+order[field])
                }
            }
            if(nOrder.length>0){
                strSql+=" order by "+nOrder.join(',')
            }
        }

        if(limit) {
            strSql += " limit " + limit
        }

        if(offset) {
            strSql += " offset " + offset
        }
        return await this.getData(strSql)
    }

    async create(table, val) {
        var tableInfo = await this.tableInfo(table)
        var strSql, arrField=[], arrValue =[]
        for(var field in val){
            if(!tableInfo.fields[field]){
                continue
            }
            arrField.push(field)
            switch(tableInfo.fields[field].type){
                case "int":
                    arrValue.push(val[field])
                    break
                default:
                    arrValue.push("'"+val[field]+"'")
                    break
            }
        }
        strSql = "insert into "+table+"("+arrField.join(',')+")values("+arrValue.join(',')+")"
        return await this.excSql(strSql)
    }

    async write(table, filter, val) {
        var tableInfo = await this.tableInfo(table)
        var strWhere = this.filterStr(tableInfo, filter)
        var arrSet = [],set = undefined
        for(var field in val){
            if(!tableInfo.fields[field]){
                continue
            }
            set = field +"="
            switch(tableInfo.fields[field].type){
                case "int":
                    set+=val[field]
                    break
                default:
                    set+="'"+val[field]+"'"
            }
            arrSet.push(set)
        }
        var strSql="update " + table +" set "+arrSet.join(',')
        if(strWhere) {
            strSql += " where " + strWhere
        }
        return await this.excSql(strSql)
    }

    async delete(table, filter) {
        var tableInfo = await this.tableInfo(table)
        var strWhere = this.filterStr(tableInfo, filter)
        var strSql = "delete from "+table+""
        if(strWhere) {
            strSql += " where " + strWhere
        }
        return await this.excSql(strSql)
    }
}
module.exports = Sqlite