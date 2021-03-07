const Solution = require('./src/entity/solution')

// var sol =new Solution()
// var model = sol.model('model')
// var rst = model.query()
// console.log(rst) test

const Sqlite = require('./src/db/sqlite')
const Filter = require('./src/db/Filter')
var sqlite = new Sqlite('./db/btest.db')
//sqlite.excSql("create table t_user(fid varchar(255))")
async function test(){
    var sol = new Solution()
    var model = await sol.model('model')
    console.log('model desc', await model.desc())
    await model.create({name: 'test'})
    await model.create({name: 'test1'})
    await model.create({name: 'test2'})
    var rst = await model.query()
    console.log('rst', rst)
    await model.delete({'=': ['{name}','test']})
    await model.delete({'=': ['{name}','test1']})
    await model.delete({'=': ['{name}','test2']})
    rst = await model.query()
    console.log('rst', rst)
/*
    await sqlite.addField('t_user', [{name: "fid", type: "string"},{name: "fname",type:"string"}])
    //await sqlite.begTran()
    await sqlite.excSql("insert into t_user(fid) select count(fid)+1 from t_user")
    //await sqlite.exitTran()
    await sqlite.excSql("delete from t_user where fid is null")
    //await sqlite.endTran()
    var filter = new Filter({">": ["{fid}","1"]})
    var rst1 = await sqlite.query('t_user', undefined, filter)
    var table = await sqlite.tableInfo('t_user')

    var rec = await sqlite.query('t_user',['fid','fname'])
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
*/
}

test().then(()=>{
    console.log('success')
}).catch(err=>{
    console.log(err)
})