var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');

const USERPROFILESDIR = './uploads/userprofile';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, USERPROFILESDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
});

module.exports = function (app) {

    app.get('/getMasterData/:sName', (req, res) => {

        var db = require("./config/config.js").db;

        var sName = req.params.sName;

        console.log(sName + "---");

        let sql = 'select id,sName,sValue,sDescription from tblAppConfig where sName=? and isActive=1';

        console.log(sql);

        db.query(sql, [sName], (err, result) => {

            if (err) return console.log(err);

            console.log(result);

            return res.send(result);
        
        });

    });



    app.post('/showFamilyMembersbasedUser', (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var userid = req.body.userid;

        var show_family_members = 'select id,sName,"OTHERS" as "type" from tblFamilyMemberdtls where iUserID=? and isActive=1';

        db.query(show_family_members, [userid], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var show_user_name = 'select sName from tblUserMaster where id=? and sActive=1';

            db.query(show_user_name, [userid], (err, result2) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });

                }

                console.log(result2);

                var sName = result2[0].sName;

                var user = {
                    id: userid,
                    sName: sName,
                    type: 'SELF'
                }

                result.unshift(user);

                return res.send(result);

            });

        });

    });

    app.get('/viewUserProfileImages', function (req, res) {

        console.log("viewUserProfileImages API...");

        const USERPROFILESDIR = './uploads/userprofile/';

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

            fs.readFile(USERPROFILESDIR + pic, function (err, content) {
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

            let getExistImage = 'select sProfilePic from tblUserMaster where id=?';

            db.query(getExistImage, [iUserID], (err, result) => {

                if (err) return console.log(err);

                console.log(result[0]);

                if (result[0].sProfilePic == undefined || result[0].sProfilePic == '') {
                    console.log('result.imgFileName', result[0].sProfilePic)
                    return resolve();
                }

                if (result.length > 0 && result[0].sProfilePic != 'dummy.jpg') {

                    var oldFileName = path.join(USERPROFILESDIR, result[0].sProfilePic);

                    console.log("----------");

                    console.log(oldFileName);

                    fs.unlink(oldFileName, (err) => {
                        if (err) return reject(err);
                        console.log("file deleted in folder...");

                        return resolve();
                    });
                }
                else {
                    return resolve();
                }


            });
        });
    }

    function fileRename(filename, user_id) {

        return new Promise((resolve, reject) => {

            var oldFileName = path.join(USERPROFILESDIR, filename);
            console.log("OldfileName: " + oldFileName);

            console.log("----------");

            console.log(Math.round(new Date().getTime()/1000));

            var newGeneratedFileName = user_id +"_" + Math.round(new Date().getTime()/1000) +"." + "jpg";

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(USERPROFILESDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var Fileurl = 'viewUserProfileImages/?docname=';

            console.log(Fileurl);

            return resolve({ Fileurl: Fileurl, newFileName: newGeneratedFileName });

        });

    }

    app.post('/updateUserProfile', upload.single('image'), async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);
        console.log(req.file);

        var firstname = "Muthu Kumar KK";
        var email = "Muthu@gmail.com";
        var dob = "1995-01-03";
        var landmark = "Near Anna Nagar";
        var gender = "Male";
        var address = "NO.15 Chennai";
        var blood = "A-";
        var userid = 28;

        // var userinfo=JSON.parse(req.body.userinfo);
        // var firstname = userinfo.firstname;
        // var email =userinfo.email;
        // var dob = moment(userinfo.dateofbirth).format("YYYY-MM-DD");
        // var landmark = userinfo.landmark;
        // var gender = userinfo.gender;
        // var address = userinfo.address;
        // var blood = userinfo.blood;
        // var userid = userinfo.userid;

        console.log(req.file);

        var sProfilePic = '';
        var sProfilePath = '';

        var get_time = await require('./config/time.js')(db);
        var username = await require('./config/findusername')(db, userid);

        var Update_profile = '';
        var update_profile_arr;

        if (req.file) {
            console.log("Image Available");
            var deleteresult = await deleteExistFile(userid, db);
            console.log(deleteresult);
            var result = await fileRename(req.file.originalname, userid);
            console.log(result);
            sProfilePath = result.Fileurl;
            sProfilePic = result.newFileName;

            Update_profile = 'update tblUserMaster SET sName=?,sEmailID=?,sDOB=?,sLandMark=?,sgender=?,sAddress=?,sBloodGroup=?,sProfilePic=?,sProfileUrl=?,sModifiedBy=?,dModified=? \
        where id=?';

            update_profile_arr = [firstname, email, dob, landmark, gender, address, blood, sProfilePic, sProfilePath, username, get_time, userid];


        } else {
            console.log("Image Not Available");

            Update_profile = 'update tblUserMaster SET sName=?,sEmailID=?,sDOB=?,sLandMark=?,sgender=?,sAddress=?,sBloodGroup=?,sModifiedBy=?,dModified=? \
            where id=?';

            update_profile_arr = [firstname, email, dob, landmark, gender, address, blood, username, get_time, userid];


        }

        db.query(Update_profile, update_profile_arr, (err, result) => {

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
                message: 'User Profile Updated'
            });

        });
    });

    app.get('/showUserProfile/:id', async (req, res) => {
        var db = require('./config/config.js').db;

        console.log(req.params);

        var id = req.params.id;
        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var show_user = 'select sAddress as "address",sBloodGroup as "blood", \
        sDOB as "dateofbirth", sName as "firstname", sEmailID as "email", sLandMark as "landmark", \
        sMobileNum as "mobile", sgender as "gender", id as "userid",concat(?,sProfileUrl,sProfilePic) as "imgurl" from tblUserMaster where id=? and sActive=1';

        db.query(show_user, [ip, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            // console.log(result);

            var data = result[0]
            if (data != null) {
                return res.send({
                    "data": data
                })
            } else {
                return res.send({
                    "data": null
                })
            }
            // return res.send(result);

        });
    });



}
