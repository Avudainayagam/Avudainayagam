var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');
const { db } = require('./config/config.js');

const FAMILYMEMBERSDIR = './uploads/familymembers';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, FAMILYMEMBERSDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
});

module.exports = function (app) {

    app.get('/selectdata', (req, res) => {

        var db = require('./config/config.js').db;

        var data = 'select * from tblUserlogin';

        db.query(data, (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send(err.sqlMessage);
            }

            console.log(result);

            return res.send(result);

        });

    });


    function getLatestID(db) {

        return new Promise((resolve, reject) => {

            var getID = "SELECT AUTO_INCREMENT as 'id' FROM information_schema.tables WHERE table_name = 'tblFamilyMemberdtls' and table_schema = 'Medi360'";

            db.query(getID, (err, result) => {

                if (err) return console.log(err);

                console.log(result);

                var id = result[0].id;

                return resolve(id);

            });

        });
    }

    app.get('/viewFamilyMembersImages', function (req, res) {

        console.log("vviewFamilyMembersImages API...");

        const FAMILYMEMBERSDIR = './uploads/familymembers/';

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

            fs.readFile(FAMILYMEMBERSDIR + pic, function (err, content) {
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

    function deleteExistFile(iUserID, db) {

        return new Promise((resolve, reject) => {

            let getExistImage = 'select sProfilePic from tblFamilyMemberdtls where id=?';
            console.log('iUserID', iUserID)
            db.query(getExistImage, [iUserID], (err, result) => {

                if (err) return console.log(err);

                console.log(result[0]);

                if (result[0].sProfilePic == undefined || result[0].sProfilePic == '') {
                    console.log('result.imgFileName', result[0].sProfilePic)
                    return resolve({ "File": 0 });
                }

                if (result.length > 0 && result[0].sProfilePic != 'dummy.jpg') {

                    var oldFileName = path.join(FAMILYMEMBERSDIR, result[0].sProfilePic);

                    fs.unlink(oldFileName, (err) => {
                        if (err) return reject(err);
                        console.log(result[0].sProfilePic + "file deleted in folder...");

                        return resolve({ "File": 1, filename: result[0].sProfilePic });
                    });
                }
                else {
                    return resolve();
                }


            });
        });
    }

    function fileRename(filename, user_id, latest_id) {

        return new Promise((resolve, reject) => {

            var oldFileName = path.join(FAMILYMEMBERSDIR, filename);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = user_id + "_" + latest_id + "." + "jpg";

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(FAMILYMEMBERSDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var Fileurl = 'viewFamilyMembersImages/?docname=';

            console.log(Fileurl);

            return resolve({ Fileurl: Fileurl, newFileName: newGeneratedFileName });

        });

    }


    app.post('/login', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var sMobileNum = req.body.sMobileNum;

        var check_available = 'select count(*) as "isAvailable" from tblUserMaster where sMobileNum=? and sActive=1';

        db.query(check_available, [sMobileNum], async (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                })
            }

            console.log(result);

            if (result[0].isAvailable == 0) { // NOT AVAILABLE

                console.log(`New User...`);

                var get_time = await require('./config/time.js')(db);

                console.log(get_time);

                var insert_user = 'INSERT INTO tblUserMaster SET ?';

                var post_user = {
                    sMobileNum: sMobileNum,
                    sCreatedBy: sMobileNum,
                    dCreated: get_time,
                    sActive: 1
                };

                db.query(insert_user, post_user, async (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    var userid = result2.insertId;

                    var otp = await require('./config/generateotp')(db);

                    console.log(`Otp:${otp}`);

                    var insert_user_login = 'INSERT INTO tblUserlogin SET ?';

                    var post_user_login = {
                        iUserID: userid,
                        iRole: 1,
                        otp: otp,
                        deffectivetill: get_time,
                        sCreatedBy: sMobileNum,
                        dCreated: get_time,
                        isActive: 1
                    };

                    db.query(insert_user_login, post_user_login, async (err, result4) => {

                        if (err) {

                            console.log(err.sqlMessage);

                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result4);

                        await require('./config/sendotp')(sMobileNum, otp);

                        return res.send({
                            status: 1,
                            message: 'sent otp to new user',
                            iRole: 1,
                            otp: otp
                        });

                    });

                });

            }
            else {

                console.log(`Existing User....`);

                var getID = 'select id from tblUserMaster where sMobileNum=? and sActive=1';

                db.query(getID, [sMobileNum], async (err, result5) => {

                    if (err) {
                        console.log(err.sqlMessage);

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result5);

                    var user_id = result5[0].id;

                    var otp = await require('./config/generateotp')(db);

                    console.log(`Otp:${otp}`);

                    var get_time = await require('./config/time.js')(db);

                    var update_otp = 'update tblUserlogin SET otp=?,deffectivetill=?,sModifiedBy=?,dModified=? where iUserID=?';

                    db.query(update_otp, [otp, get_time, sMobileNum, get_time, user_id], (err, result6) => {

                        if (err) {
                            console.log(err.sqlMessage);

                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result6);

                        var get_Role = 'select iRole from tblUserlogin where iUserID=? and isActive=1';

                        db.query(get_Role, [user_id], async (err, result7) => {

                            if (err) {
                                console.log(err.sqlMessage);

                                return res.send({
                                    status: 0,
                                    message: err.sqlMessage
                                });
                            }

                            console.log(result7);

                            var iRole = result7[0].iRole;

                            await require('./config/sendotp')(sMobileNum, otp);

                            return res.send({
                                status: 1,
                                message: 'sent otp to existing user',
                                iRole: iRole,
                                otp: otp
                            });

                        });

                    });
                });

            }

        });

    });


    app.post('/otpverify', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var sMobileNum = req.body.sMobileNum;
        var otp = req.body.otp;

        var getOtp = 'select b.iUserID,b.Otp,b.iRole,b.deffectivetill from tblUserMaster a \
        join tblUserlogin b on b.iUserID=a.id and b.isActive=1 \
        where a.sMobileNum=? and a.sActive=1';

        db.query(getOtp, [sMobileNum], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                return res.send({
                    status: 0,
                    message: "MobileNO not Available...."
                });

            }
            else {

                var id = result[0].iUserID;
                var dbotp = result[0].Otp;
                var iRole = result[0].iRole;

                if (otp == dbotp) {

                    console.log(`Otp Matched....`);

                    var check_otp_validity = 'SELECT TIME_TO_SEC(TIMEDIFF(now(),(select deffectivetill from tblUserlogin where iUserID=?))) diff';

                    db.query(check_otp_validity, [id], (err, result2) => {

                        if (err) {

                            console.log(err.sqlMessage);
                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }
                        else {

                            console.log(result2);

                            var seconds = result2[0].diff;

                            if (seconds <= 300) { // 5mins => 300 seconds

                                return res.send({
                                    status: 1,
                                    message: 'Otp Matched and Otp alive....',
                                    iUserID: id,
                                    iRole: iRole
                                });

                            }
                            else {

                                return res.send({
                                    status: 0,
                                    message: 'Otp Matched but Otp expires....'
                                });

                            }

                        }

                    });

                }
                else {

                    console.log(`Otp Not Matched....`);

                    return res.send({
                        status: 0,
                        message: 'Please Enter Valid Verfication Code'
                    });
                }

            }

        });


    });


    app.post('/addFamilyMembers', upload.single('image'), async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var iUserID = 91;
        // var sFirstName = "Ravi";
        // var sLastName = "Kumar";
        // var sContactNum = "8989898989"
        // var sEmailID = "ravikumar@gmail.com";
        // var gender = "M";
        // var sRelationShipType = "Father";
        // var sBloodGroup = "A+";
        // var dob = "2021-02-09";
        // var Name = sFirstName.concat(sLastName);

        var userinfo = JSON.parse(req.body.userinfo);

        var iUserID = userinfo.iUserID;
        var sFirstName = userinfo.sFirstName;
        var sLastName = userinfo.sLastName;
        var sContactNum = userinfo.sContactNum;
        var sEmailID = userinfo.sEmailID;
        var gender = userinfo.gender;
        var sRelationShipType = userinfo.sRelationShipType;
        var sBloodGroup = userinfo.sBloodGroup;
        var dob = moment(userinfo.dob).format('YYYY-MM-DD');
        var Name = sFirstName.concat(sLastName);

        console.log(req.file);

        var imgfilename = '';
        var imgfilepath = '';

        if (req.file) {
            console.log("Image Available");
            var latest_id = await getLatestID(db);
            console.log("latest_id:");
            console.log(latest_id);
            var result = await fileRename(req.file.originalname, iUserID, latest_id);
            console.log(result);
            imgfilepath = result.Fileurl;
            imgfilename = result.newFileName;
        }
        else {
            imgfilepath = 'viewFamilyMembersImages/?docname=';
            imgfilename = 'dummy.jpg';
            console.log("Image Not Available");
        }

        var get_Username = 'select sName,sMobileNum from tblUserMaster where id=? and sActive=1';

        db.query(get_Username, [iUserID], async (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var username = result[0].sName;

            var get_time = await require('./config/time.js')(db);

            console.log(get_time);

            var insert_familymembers = 'INSERT INTO tblFamilyMemberdtls SET ?';

            var post_familymembers = {
                iUserID: iUserID,
                sFirstName: sFirstName,
                sLastName: sLastName,
                sName: Name,
                sContactNum: sContactNum,
                sEmailID: sEmailID,
                sRelationShipType: sRelationShipType,
                sGender: gender,
                dDOB: dob,
                sBloodGroup: sBloodGroup,
                sProfilePath: imgfilepath,
                sProfilePic: imgfilename,
                sCreatedBy: username || result[0].sMobileNum,
                dCreated: get_time,
                isActive: 1
            };

            db.query(insert_familymembers, post_familymembers, (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                return res.send({
                    status: 1,
                    message: 'Family Member Added Succesffully'
                });

            });


        });

    });


    app.post('/updateFamilyMember', upload.single('image'), async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var id = 19;
        // var iUserID = 28;
        // var sFirstName = "John";
        // var sLastName = "RathnaKumar";
        // var sContactNum = "8989898989"
        // var sEmailID = "John@gmail.com";
        // var sGender = "Male";
        // var sRelationShipType = "Father";
        // var sBloodGroup = "A+";
        // var dDOB = "2021-02-09";
        // var sName = sFirstName.concat(sLastName);
 

        var userinfo = JSON.parse(req.body.userinfo);

        console.log(userinfo);

        var id = userinfo.id;
        var iUserID = userinfo.iUserID;
        var sFirstName = userinfo.sFirstName;
        var sLastName = userinfo.sLastName;
        var sContactNum = userinfo.sContactNum;
        var sEmailID = userinfo.sEmailID;
        var sGender = userinfo.sGender;
        var sRelationShipType = userinfo.sRelationShipType;
        var sBloodGroup = userinfo.sBloodGroup;
        var dDOB = moment(userinfo.dDOB).format("YYYY-MM-DD");
        var sf = userinfo.sFirstName;
        var lf = userinfo.sLastName;
        console.log(sf);
        console.log(lf);
        var sName = sf.concat(lf);
        console.log("----------");
        console.log(sName);

        console.log(req.file);

        var sProfilePic = '';
        var sProfilePath = '';

        var Update_familymembers = '';
        var update_familymembers_arr = [];

        var get_time = await require('./config/time.js')(db);
        var username = await require('./config/findusername')(db, iUserID);


        if (req.file) {
            console.log("Image Available");
            var deleteresult = await deleteExistFile(id, db);
            console.log(deleteresult);
            var result = await fileRename(req.file.originalname, id, iUserID);
            console.log(result);
            sProfilePath = result.Fileurl;
            sProfilePic = result.newFileName;

            Update_familymembers = 'Update tblFamilyMemberdtls SET iUserID=?,sFirstName=?,sLastName=?,sName=?,sContactNum=?,sEmailID=?,sRelationShipType=?,\
           sProfilePic=?,sProfilePath=?,sGender=?,dDOB=?,sBloodGroup=?,sModifiedBy=?,dModified=? where id=?';

            update_familymembers_arr = [iUserID, sFirstName, sLastName, sName, sContactNum, sEmailID, sRelationShipType, sProfilePic, sProfilePath,
                sGender, dDOB, sBloodGroup, username, get_time, id];

        }
        else {

            console.log("Image Not Available");

            Update_familymembers = 'Update tblFamilyMemberdtls SET iUserID=?,sFirstName=?,sLastName=?,sName=?,sContactNum=?,sEmailID=?,sRelationShipType=?,\
            sGender=?,dDOB=?,sBloodGroup=?,sModifiedBy=?,dModified=? where id=?';

            update_familymembers_arr = [iUserID, sFirstName, sLastName, sName, sContactNum, sEmailID, sRelationShipType,
                sGender, dDOB, sBloodGroup, username, get_time, id];
        }

     

        console.log(get_time);

        db.query(Update_familymembers, update_familymembers_arr, (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            return res.send({
                status: 1,
                message: 'Family Member Updated Successfully'
            });

        });
    });


    app.get('/getFamilyDetails/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        let getFamilyDetails = 'select id, iUserID,sFirstName,sLastName, sName, sContactNum, sEmailID, sRelationShipType,concat(?,sProfilePath,sProfilePic) as "Filename" ,\
        sGender, dDOB,sBloodGroup, dCreated from tblFamilyMemberdtls where iUserID=? and isActive=1';

        db.query(getFamilyDetails, [ip, id], (err, result) => {

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



    app.post('/createUserRelation', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var iUserid = 1;
        // var sRelation = "NEIGHBOUR";
        // var sRelationName = "MUTHU";
        // var sRelationPhNo = "9597654150";

        const { iUserid, sRelation, sRelationName, sRelationPhNo } = req.body;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iUserid);

        var insert_user_relation = 'INSERT INTO tblUserRelation SET ?';

        var post_user_relation = {
            iUserid: iUserid,
            sRelation: sRelation,
            sRelationName: sRelationName,
            sRelationPhNo: sRelationPhNo,
            sCreated_by: get_user_name,
            dCreated: get_time,
            isActive: 1
        };

        db.query(insert_user_relation, post_user_relation, (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            return res.send({
                status: 1,
                message: 'User Relations Created...'
            });

        });

    });

    app.post('/showUserRelations', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var userid = req.body.userid;

        var show_Relation_users = 'select id,iUserid,sRelation,sRelationName,sRelationPhNo from tblUserRelation where iUserid=? and isActive=1';

        db.query(show_Relation_users, [userid], (err, result) => {

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

    app.get('/showUserRelations/:id', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.params);

        var id = req.params.id;

        var show_user_Relations = 'select id,iUserid,sRelation,sRelationName,sRelationPhNo from tblUserRelation where id=? and isActive=1';

        db.query(show_user_Relations, [id], (err, result) => {

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

    app.post('/deleteUserRelations', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;

        var update_user_relations = 'update tblUserRelation SET isActive=0 where id=?';

        db.query(update_user_relations, [id], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            return res.send({
                status: 0,
                message: 'User Relation Deleted'
            });

        });

    });

    app.post('/updateUserRelations', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var id=req.body.id;
        // var iUserid = 1;
        // var sRelation = "NEIGHBOUR";
        // var sRelationName = "MUTHU";
        // var sRelationPhNo = "9597654150";

        const { id, iUserid, sRelation, sRelationName, sRelationPhNo } = req.body;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, iUserid);

        var update_user_Relations = 'update tblUserRelation SET sRelationName=?,sRelation=?,sRelationPhNo=?, \
        sModified_by=?,dModified=? where id=?';

        db.query(update_user_Relations, [sRelationName, sRelation, sRelationPhNo, get_user_name, get_time, id], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            return res.send({
                status: 1,
                message: 'User Relations Updated'
            });

        });

    });

    function Split_date_time_slot(doctorschedulemasterid, dDate, dTime, session, username, get_time) {

        console.log(get_time);

        return new Promise((resolve, reject) => {

            var insert_doctor_schedule_dtls = 'INSERT INTO tblDocScheduledtls SET ?';

            var post_doctor_schedule_dtls = {
                iDocScheduleMasterID: doctorschedulemasterid,
                dDate: dDate,
                dTime: dTime,
                sSession: session,
                iAllocated: 0,
                sCreatedBy: username,
                dCreated: get_time,
                isActive: 1
            };

            db.query(insert_doctor_schedule_dtls, post_doctor_schedule_dtls, (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                return resolve();

            });

        });

    }

    function get_Session_Name(dt, db) {

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
                else if (h >= 12 && h <= 15) {
                    session = "afternoon";
                }
                else if (h >= 16 && h <= 20) {
                    session = "evening";
                }
                else if (h >= 21 && h <= 24) {
                    session = "night";
                }

                console.log(session);

                return resolve(session);

            });

        });

    }

    
    app.post('/InsertdateTimeSlot', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var hospitalid = 1;
        // var start_date = "2021-04-17";
        // var end_date = "2021-04-19";
        // var start_time = "11:00:00";
        // var end_time = "15:00:00";
        // var interval = 15;
        // var iuserid = 1;

        var hospitalid = req.body.hospitalid;
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;
        var start_time = req.body.start_time;
        var end_time = req.body.end_time;
        var interval = req.body.interval;
        var iuserid = req.body.iuserid;

        var time_slot = [];

        var beginningTime = moment(start_time, 'HH:mm:ss');
        var endTime = moment(end_time, 'HH:mm:ss');

        console.log(beginningTime);

        console.log(endTime);

        while (beginningTime.isBefore(endTime)) {

            console.log(moment(beginningTime, "HH:mm:ss").format("HH:mm:ss"));
            console.log("****");
            time_slot.push(moment(beginningTime, "HH:mm:ss").format("HH:mm:ss"))
            beginningTime.add(interval, 'minutes')
            console.log(beginningTime)
        }

        console.log("-----------");
        console.log(time_slot);

        var dateList = [];

        var startDate = moment(start_date);

        var endDate = moment(end_date);

        while (startDate.isSameOrBefore(endDate, 'day ')) {
            dateList.push(moment(startDate).format("YYYY-MM-DD"))
            startDate.add(1, 'days')
        }

        console.log(dateList);

        var username = await require('./config/findusername.js')(db, iuserid);
        var get_time = await require('./config/time.js')(db);

        var insert_doctormaster = 'INSERT INTO tblDocScheduleMaster SET ?';

        var post_doctormaster = {
            iDoctorID: iuserid,
            dstrdate: start_date + " " + "00:00:00",
            dEnddate: end_date + " " + "00:00:00",
            tstrtime: start_time,
            tendtime: end_time,
            sInterval: interval,
            sCreatedBy: username,
            dCreated: get_time,
            isActive: 1
        };

        db.query(insert_doctormaster, post_doctormaster, async (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var doctorschedulemasterid = result.insertId;

            for (var i = 0; i < dateList.length; i++) {

                for (var j = 0; j < time_slot.length; j++) {

                    console.log(dateList[i] + "---" + time_slot[j]);

                    var a = dateList[i] + " " + time_slot[j];

                    console.log(a);

                    var b = dateList[i] + " " + "00:00:00";

                    console.log(b);

                    var session = await get_Session_Name(a, db);

                    await Split_date_time_slot(doctorschedulemasterid, b, a, session, username, get_time);

                    console.log("******");
                }

            }

            return res.send({
                status: 1,
                message: 'Doctor Time Slot Created'
            });

        });


    });

    app.post('/checkMenuAvailable', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var mobileno = req.body.mobileno;
        var menuid = req.body.menuid;

        var check_menu_available = "select t2.iRoleid from tblUserMaster t1 \
        join tbluserRoleMappimg t2 on t2.iuserid=t1.id and t2.Imenuid=? and t2.isActive=1 \
        where t1.sMobileNum=? and t1.sActive=1";

        db.query(check_menu_available, [menuid, mobileno], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }
            else {

                if (result.length == 0) {

                    return res.send({
                        status: 0,
                        role: 1
                    });

                }
                else {
                    console.log(result);

                    return res.send({
                        status: 1,
                        role: result[0].iRoleid
                    });


                }
            }

        });

    });

    app.get('/showAllMenus', (req, res) => {

        var show_menus = 'select id,sMenuName,sMenuDescription,concat("",sMenuIconPath,sMenuIconFileName) as "FileName" from tblMenuMaster where isActive=1';

        db.query(show_menus, (err, result) => {

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

    app.post('/checkUpdateUserProfile', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var userid = req.body.userid;

        var check_update_user_profile = 'select * from tblUserMaster where \
        sName IS NOT NULL and sMobileNum IS NOT NULL and sAddress IS NOT NULL and id=? and sActive=1';

        db.query(check_update_user_profile, [userid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }
            else {
                console.log(result);

                if (result.length == 0) {
                    return res.send({
                        status: 0,
                        message: 'Profile Not Updated'
                    });
                }
                else {
                    return res.send({
                        status: 1,
                        message: 'Profile Updated'
                    });
                }
            }

        });

    });

    app.post('/showDoctorSlots', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var userid = req.body.userid;

        var show_doctors_slot = 'select "" as "hospital", DATE_FORMAT(dstrdate,"%d %b") as "startdate",DATE_FORMAT(dEnddate,"%d %b") as "enddate", \
        TIME_FORMAT(tstrtime,"%h:%m %p") as "starttime",TIME_FORMAT(tendtime,"%h:%m %p") as "endtime",sConsultType as "type",CONCAT(sInterval," min") as "slot" \
        from tblDocScheduleMaster where iDoctorID=? and isActive=1';

        db.query(show_doctors_slot, [userid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    sttaus: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            return res.send(result);

        });
    });

}
