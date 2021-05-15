var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');
var _ = require('lodash');
const { db } = require('./config/config.js');


const PILLSDIR = './uploads/PillsImages';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PILLSDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
});


function fileRenameandUploadinDB(filename, id) {

    console.log("****************************");

    console.log(id);

    console.log(filename.originalname);

    var file_type = filename.originalname;

    console.log(file_type.split('.')[1]);

    return new Promise((resolve, reject) => {

        var oldFileName = path.join(PILLSDIR, filename.originalname);
        console.log("OldfileName: " + oldFileName);

        var newGeneratedFileName = id + "." + file_type.split('.')[1];

        console.log("GeneratedFilename:" + newGeneratedFileName);
        var newFileName = path.join(PILLSDIR, newGeneratedFileName);

        console.log("NewFileName:" + newFileName);

        fs.renameSync(oldFileName, newFileName);
        console.log('File Renamed in Folder...');

        var Fileurl = `viewPillsImages/?docname=`;

        console.log(Fileurl);

        return resolve({ Fileurl: Fileurl, newFileName: newGeneratedFileName });

    });

}


module.exports = function (app) {

    app.get('/viewPillsImages', function (req, res) {

        console.log("viewPillsImages API...");

        const PROOFDIR = './uploads/PillsImages/';

        var query = url.parse(req.url, true).query;
        pic = query.docname;

        console.log("url");
        console.log(req.url);

        console.log("pic");
        console.log(pic);

        var file_type = pic.split('.')[1];

        console.log(file_type);

        if (typeof pic === 'undefined') {
            console.log("undefined in...");

        } else {
            console.log("Not undefined");

            fs.readFile(PROOFDIR + pic, function (err, content) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' })
                    console.log(err);
                    res.end("No such File");
                } else {

                    var choose_type = '';

                    if (file_type == "pdf") {
                        choose_type = { 'Content-type': 'application/' + file_type }
                    }
                    else {
                        choose_type = { 'Content-type': 'image/' + file_type }
                    }

                    console.log(choose_type);

                    // res.writeHead(200, { 'Content-type': 'image/jpg' });
                    res.writeHead(200, choose_type);
                    res.end(content);
                }
            });
        }
    });

    function InsertUserPillDatesInfo(id, date, time, no_of_pills, data, session, get_mobile, username, get_time) {

        return new Promise((resolve, reject) => {

            console.log(date);

            console.log(data);

            console.log("-----------");

            var insert_user_pillsdates_info = "INSERT INTO tblUserPilldatesInfo SET ?";

            var post_user_pillsdates_info = {
                iPillid: id,
                dDate: date,
                tTime: time,
                inoofpills: no_of_pills,
                iNotification: data.iUserNotification,
                iMessage: data.iUserMessage,
                iUserid: data.iUserid,
                sUserPhno: get_mobile,
                sSession:session,
                sPillStatus:"Take",
                inotifysent: 0,
                imessagesent: 0,
                sNotification_msg: 'PILLS REMAINDER',
                sNotification_title: 'Hi, <Name> Kindly take <noofpills> pills in <DrugName> on <Time>',
                sCreated_by: username,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_user_pillsdates_info, post_user_pillsdates_info, (err, result) => {

                if (err) {
                    console.log(err);
                }

                console.log(result);

                return resolve();

            });



        });
    }

    function InsertUserRelationPillDatesInfo(id, date, time, no_of_pills, data,session, get_mobile, username, get_time) {

        return new Promise((resolve, reject) => {

            console.log(date);

            console.log(data);

            console.log("-----------");

            var insert_user_pillsdates_info = "INSERT INTO tblUserRelationPilldatesInfo SET ?";

            var post_user_pillsdates_info = {
                iPillid: id,
                dDate: date,
                tTime: time,
                inoofpills: no_of_pills,
                iNotification: data.iRelationNotification,
                iMessage: data.iRelationMessage,
                iRelationid: data.iRelationid,
                sRelationPhno: get_mobile,
                sSession:session,
                sPillStatus:"Take",
                inotifysent: 0,
                imessagesent: 0,
                sNotification_msg: 'PILLS REMAINDER',
                sNotification_title: 'Hi, <Name> Kindly take <noofpills> pills in <DrugName> on <Time>',
                sCreated_by: username,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_user_pillsdates_info, post_user_pillsdates_info, (err, result) => {

                if (err) {
                    console.log(err);
                }

                console.log(result);

                return resolve();

            });

        });
    }

    function get_Medicine_Reminder_Time(dt, db) {

        return new Promise((resolve, reject) => {

            var get_hours = "SELECT TIME_FORMAT(?,'%H') as 'hours' ";

            db.query(get_hours, [dt], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                var h = result[0].hours;

                var session = "";

                if (h >= 00 && h <= 11) {
                    session = "morning";
                }
                else if (h >= 12 && h <= 16) {
                    session = "afternoon";
                }
                else if (h >= 17 && h <= 19) {
                    session = "evening";
                }
                else if (h >= 20 && h <= 24) {
                    session = "night";
                }

                console.log(session);

                return resolve(session);

            });

        });

    }


    app.post('/addPillInfo', upload.single('image'), async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        console.log(req.file);

        var sDrugName = "Cold Act";
        var dFromDate = "2021-04-21";
        var dToDate = "2021-04-25";
        var sPillUsage = "STANDARD";
        var sPillConsume = "Before Food";
        var iUserid = 91;
        var iRelationid = 0;
        var sUserType = "SELF";
        var iUserMessage = 1;
        var iUserNotification = 1;
        var iRelationMessage = 0;
        var iRelationNotification = 0;
        var timeandNo_of_pills = [
            { time: '09:00:00', no_of_pills: 3 },
            { time: '10:00:00', no_of_pills: 2 },
            { time: '19:30:00', no_of_pills: 1 }
        ];
        var sPillNotify=187;
        var sRemainderto=191;


        // var sDrugName = req.body.sDrugName;
        // var dFromDate = req.body.dFromDate;
        // var dToDate = req.body.dToDate;
        // var sPillUsage = req.body.sPillUsage;
        // var sPillConsume = req.body.sPillConsume;
        // var iUserid = req.body.iUserid;
        // var iRelationid = req.body.iRelationid;
        // var sUserType = req.body.sUserType;
        // var iUserMessage = req.body.iUserMessage;
        // var iUserNotification = req.body.iUserNotification;
        // var iRelationMessage = req.body.iRelationMessage;
        // var iRelationNotification = req.body.iRelationNotification;
        // var timeandNo_of_pills=req.body.timeandNo_of_pills;
        // var sPillNotify=req.body.sPillNotify;
        // var sRemainderto=req.body.sRemainderto;

        var getMaxId = 'select \
        CASE \
          WHEN max(id) IS NULL THEN 1 \
          WHEN max(id) IS NOT NULL THEN max(id)+1  \
          END AS "max_value" \
        from tbUserPillsInfo';

        db.query(getMaxId, async (err, result) => {

            if (err) {

                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var id = result[0].max_value;

            var aa = await fileRenameandUploadinDB(req.file, id);

            console.log(aa);

            var imgpath = aa.Fileurl;
            var imagename = aa.newFileName;

            var username = await require('./config/findusername.js')(db, iUserid);
            var get_time = await require('./config/time.js')(db);

            var insert_pills_info = 'INSERT INTO tbUserPillsInfo SET ?';

            var post_pills_info = {
                sDrugName: sDrugName,
                dFromDate: dFromDate,
                dToDate: dToDate,
                sPillUsage: sPillUsage,
                sPillConsume: sPillConsume,
                sPillNotify: sPillNotify,
                sRemainderto:sRemainderto,
                iUserid: iUserid,
                iRelationid: iRelationid,
                sUserType: sUserType,
                sCreated_by: username,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_pills_info, post_pills_info, (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var pill_id = result2.insertId;

                var insert_pill_Images = "INSERT INTO tblpillsImages SET ?";

                var post_pill_Images = {
                    iPillid: pill_id,
                    sFileName: imagename,
                    sFileURL: imgpath,
                    sCreated_by: username,
                    dCreated_at: get_time,
                    isActive: 1
                };

                db.query(insert_pill_Images, post_pill_Images, async (err, result3) => {

                    if (err) {

                        console.log(err.sqlMessage);

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    var user_dateList = [];

                    if (iUserMessage == 1 || iUserNotification == 1) {

                        var startDate = moment(dFromDate);

                        while (startDate.isSameOrBefore(dToDate, 'day ')) {
                            user_dateList.push(moment(startDate).format("YYYY-MM-DD"))
                            startDate.add(1, 'days')
                        }

                        var get_mobile = await require('./config/findMobile')(db, iUserid);

                        console.log(user_dateList);

                        for (var i = 0; i < user_dateList.length; i++) {

                            for (j = 0; j < timeandNo_of_pills.length; j++) {

                                console.log(user_dateList[i] + "---" + timeandNo_of_pills[j].time + "---" + timeandNo_of_pills[j].no_of_pills);

                                var session=await get_Medicine_Reminder_Time(timeandNo_of_pills[j].time,db);

                                await InsertUserPillDatesInfo(pill_id, user_dateList[i], timeandNo_of_pills[j].time, timeandNo_of_pills[j].no_of_pills, req.body,session, get_mobile, username, get_time);

                            }

                        }

                    }


                    var user_relation_dateList = [];

                    if (iRelationMessage == 1 || iRelationNotification == 1) {

                        var startDate = moment(dFromDate);

                        while (startDate.isSameOrBefore(dToDate, 'day ')) {
                            user_relation_dateList.push(moment(startDate).format("YYYY-MM-DD"))
                            startDate.add(1, 'days')
                        }

                        var get_relatives_mobile = await require('./config/findRelativesname')(db, iRelationid);

                        var relatives_mobile = get_relatives_mobile.sContactNum;

                        console.log(user_relation_dateList);

                        for (var i = 0; i < user_relation_dateList.length; i++) {

                            for (j = 0; j < timeandNo_of_pills.length; j++) {

                                console.log(user_relation_dateList[i] + "---" + timeandNo_of_pills[j].time + "---" + timeandNo_of_pills[j].no_of_pills);

                                var session=await get_Medicine_Reminder_Time(timeandNo_of_pills[j].time,db);

                                await InsertUserRelationPillDatesInfo(pill_id, user_relation_dateList[i], timeandNo_of_pills[j].time, timeandNo_of_pills[j].no_of_pills, req.body,session, relatives_mobile, username, get_time);

                            }

                        }

                    }

                    return res.send({
                        status: 1,
                        message: "Remainder set Successfully"
                    });

                });

            });

        });

    });

    app.get('/showWeeklydates', (req, res) => {

        var dateList = [];

        var st_date = moment(now).format("YYYY-MM-DD");

        var startDate = moment(st_date);

        var cur_date = moment(now).format("YYYY-MM-DD");

        console.log(cur_date);

        var endDate = moment().add(6, 'days').format("YYYY-MM-DD");

        while (startDate.isSameOrBefore(endDate, 'day')) {

            console.log("-----------");

            console.log(startDate.isSameOrBefore(cur_date, 'day'));

            var selected = "";

            if (startDate.isSameOrBefore(cur_date, 'day')) {
                selected = true;
            }
            else {
                selected = false;
            }

            dateList.push({
                "datestring": moment(startDate).format("YYYY-MM-DD"),
                "day": moment(startDate).format('ddd'),
                "date": moment(startDate).format('DD'),
                "year": moment(startDate).format('MMM YYYY'),
                "selected": selected
            });

            startDate.add(1, 'days')
        }

        console.log(dateList);

        var arr=dateList.slice(0,7);

        return res.send(arr);


    });


    app.post('/showDrugs1', async (req, res) => {

        //  require('./config/Pillsnotify.js')(1, "Medicine Remainder", "Kindly Take 2 pills ","orderstatus");

        var db = require('./config/config.js').db;

        console.log(req.body);

        var iuserid = req.body.iuserid;

        var date = req.body.date;

        var ipaddress = await require('./config/ipaddressconfig.js')(db);

        var show_drugs = 'select t1.sDrugName,concat(?,t2.sFileURL,t2.sFileName) as "ImageUrl",DATE_FORMAT(curdate(),"%d-%m-%y" ) as "current_date" from tbUserPillsInfo t1 \
       join tblpillsImages t2 on t2.iPillid=t1.id and t2.isActive=1 \
       where iUserid=? and ? >=t1.dFromDate and ? <=t1.dToDate and t1.isActive=1';

        db.query(show_drugs, [ipaddress, iuserid, date, date], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            return res.send(result);

        });


    });


    app.post('/showDrugs', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var iuserid = req.body.iuserid;

        var date = req.body.date;

        var ipaddress = await require('./config/ipaddressconfig.js')(db);

        var show_drugs = 'select t1.id,t1.sDrugName,concat(?,t2.sFileURL,t2.sFileName) as "ImageUrl",TIME_FORMAT(t3.tTime,"%h:%i %p") as "tTime", \
        t3.inoofpills,t1.sPillConsume,t3.sSession,t3.id as "pilltimingsid",t3.sPillStatus,TIME_FORMAT(t3.sPillStatustime,"%h:%i %p")  as "sPillStatustime" \
        from tbUserPillsInfo t1 \
        join tblpillsImages t2 on t2.iPillid=t1.id and t2.isActive=1 \
        join tblUserPilldatesInfo t3 on t3.iPillid=t1.id and t3.isActive=1 \
        where t1.iUserid=? and t3.dDate=? and t1.isActive=1';

        db.query(show_drugs, [ipaddress, iuserid, date], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var groups = _.groupBy(result, function (value) {
                return value.id + '#' + value.sDrugName + '#' + value.ImageUrl + '#' + value.sPillConsume + '#' + value.tTime + '#' + value.sSession + "#" +value.pilltimingsid + "#" +value.sPillStatus + "#" +value.sPillStatustime;
            });

            console.log("--------------");

            var data = _.map(groups, function (group) {
                return {
                    id: group[0].id,
                    sDrugName: group[0].sDrugName,
                    ImageUrl: group[0].ImageUrl,
                    sPillConsume: group[0].sPillConsume,
                    tTime: group[0].tTime,
                    sSession:group[0].sSession,
                    pilltimingsid:group[0].pilltimingsid,
                    sPillStatus:group[0].sPillStatus,
                    sPillStatustime:group[0].sPillStatustime,
                    inoofpills: _.map(group, 'inoofpills')
                }
            });

            console.log(data);

            for (var i = 0; i < data.length; i++) {

                console.log(data[i]);

                console.log(data[i].inoofpills);

                var frequnecy = "";
              

                for (var j = 0; j < data[i].inoofpills.length; j++) {

                    frequnecy = frequnecy + data[i].inoofpills[j] + "-";

                }

                data[i].frequency = frequnecy.slice(0,-1);

            }

            console.log(data);

            return res.send(data);

        });

    });

    app.post('/showPillInformation',(req,res)=>{

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id=req.body.pillid;

        var show_pill_Info_data='select t1.id,t1.sDrugName,t1.dFromDate,t1.dToDate,t1.sPillUsage,t1.sPillConsume,t2.sValue as "sPillNotify",t3.sValue as "sRemainderto", \
        t1.iUserid,t1.iRelationid,t1.sUserType,t4.sName as "RelationName",t1.sPillNotify as "idsPillNotify",t1.sRemainderto as "idsRemainderto" \
        from tbUserPillsInfo t1 \
        left join tblAppConfig t2 on t2.id=t1.sPillNotify and t2.isActive=1 \
        left join tblAppConfig t3 on t3.id=t1.sRemainderto and t2.isActive=1 \
        left join tblFamilyMemberdtls t4 on t4.id=t1.iRelationid and t4.isActive=1 \
        where t1.id=? and t1.isActive=1'

        db.query(show_pill_Info_data,[id],(err,result)=>{

            if(err){
                console.log(err.sqlMessage);
                return res.send({
                    status:0,
                    message:err.sqlMessage
                });
            }

            console.log(result);

            return res.send(result);

        });

    });


    app.post('/updatePillsTimings',(req,res)=>{

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id=req.body.id;

        var time=req.body.time;

        var check_status_data='select * from tblUserPilldatesInfo where id=? and sPillStatus="Taken"';

        db.query(check_status_data,[id],(err,result)=>{

            if(err){
                console.log(err.sqlMessage);
                return res.send({
                    status:0,
                    message:err.sqlMessage
                });
            }
            else{
                console.log(result);

                if(result.length == 1){

                    return res.send({
                        status:1,
                        message:'Already Taken'
                    });

                }
                else{

                    var update_data='update tblUserPilldatesInfo SET sPillStatus="Taken",sPillStatustime=? where id=?';

                    db.query(update_data,[time,id],(err,result2)=>{

                        if(err){
                            console.log(err.sqlMessage);
                            return res.send({
                                status:0,
                                message:err.sqlMessage
                            });
                        }

                        console.log(result2);

                        return res.send({
                            status:1,
                            message:'Updated'
                        });

                    });

                }
            }

        });

    });


}
