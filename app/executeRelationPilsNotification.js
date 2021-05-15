var moment = require('moment');
var now = new Date();

module.exports=async function(){

    console.log("Relation....");

    function getRelationNotifyPills(date_format, time_format) {

        console.log("Relation pills");

        return new Promise((resolve,reject)=>{

            var db = require('./config/config.js').db;

            var get_pills_info = 'select t1.id,t1.sNotification_msg,REPLACE(REPLACE(REPLACE(REPLACE(t1.sNotification_title,"<Name>",t3.sName), \
            "<noofpills>",t1.inoofpills),"<DrugName>",t2.sDrugName),"<Time>",t1.tTime) as "notification", \
            t3.sName,t1.inoofpills,t1.tTime,t2.sDrugName,t1.inotifysent,t4.id as "iUserid" \
            from tblUserRelationPilldatesInfo t1 \
            left join tbUserPillsInfo t2 on t2.id=t1.iPillid and t2.isActive=1 \
            left join tblFamilyMemberdtls t3 on t3.id=t2.iRelationid and t2.isActive=1 \
            left join tblUserMaster t4 on t4.sMobileNum=t3.sContactNum and t4.sActive=1 \
            where t1.dDate=? and ? <= t1.tTime \
            and subtime(t1.tTime,"00:15:00") <= ? and t1.iNotification=1 and t1.inotifysent=0 and t1.isActive=1';
    
            db.query(get_pills_info, [date_format, time_format, time_format], async (err, result) => {
    
                if (err) {
                    console.log(err.sqlMessage);
                }
    
                console.log(result);
    
                console.log("------------------");
    
                var deactive_notify_id = [];
    
                for (var i = 0; i < result.length; i++) {
    
                    deactive_notify_id.push(result[i].id);
    
                }
    
                var get_time = await require('./config/time.js')(db);
    
                if (result.length != 0) {
    
                    var deactive_sent_notification = "update tblUserRelationPilldatesInfo set inotifysent=1,dModified_at=? \
                where id IN (?)";
    
                    db.query(deactive_sent_notification, [get_time, deactive_notify_id], async(err, result2) => {
    
                        if (err) {
                            console.log(err.sqlMessage);
                        }
                        console.log(result2);
    
                        for (var i = 0; i < result.length; i++) {
    
                           // await require('./config/Pillsnotify.js')(1, result[i].sNotification_msg, result[i].notification, "orderstatus");
                           require('./config/Pillsnotify.js')(result[i].iUserid, result[i].sNotification_msg, notification[i].notification,"orderstatus");
                        }

                        return resolve();
    
                    });
    
                }

                else{
                    return resolve();
                }

    
            });

        });

    }

    var date_format = moment(now).format("YYYY-MM-DD");
    var time_format = moment(now).format("HH:mm:ss");

    console.log(time_format);

    console.log(date_format);

     // getUserNotifyPills(date_format,time_format);

     await getRelationNotifyPills(date_format, time_format);

}
