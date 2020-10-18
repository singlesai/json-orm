const Solution = require('./index')

var sol =new Solution()
var model = sol.model('model')
var rst = model.query()
console.log(rst)

const Sqlite = require('./db/sqlite')
const Filter = require('./db/Filter')
var sqlite = new Sqlite('btest.db')
//sqlite.excSql("create table t_user(fid varchar(255))")

async function test(){
    //await sqlite.begTran()
    await sqlite.excSql("insert into t_user(fid) select count(fid)+1 from t_user")
    //await sqlite.exitTran()
    await sqlite.excSql("delete from t_user where fid is null")
    //await sqlite.endTran()
    var filter = new Filter({">": ["{fid}","1"]})
    var rst1 = await sqlite.query('t_user', undefined, filter)
    var table = await sqlite.tableInfo('t_user')

    var rec = await sqlite.query('t_user')
    console.log('rec init', rec)

    var create = await sqlite.create('t_user', {fid: 'abc'})
    var rec = await sqlite.query('t_user')
    console.log('rec created', rec)

    var update = await sqlite.write('t_user', filter, {fid: 'ac'})
    var rec = await sqlite.query('t_user')
    console.log('rec writed', rec)
    
    var update = await sqlite.delete('t_user', filter)
    var rec = await sqlite.query('t_user')
    console.log('rec deleted', rec)
}

test().catch(err=>{
    console.log(err)
})