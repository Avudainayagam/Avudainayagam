var multer = require("multer");
var path = require('path');
var fs = require('fs');
const url = require('url');

const PROOFDIR = './uploads/partnerproofs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PROOFDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).fields([{ name: "IdProof" }, { name: "Addressproof" }, { name: "LicenseProof" }, { name: "GSTProof" }]);


module.exports = function (app) {

    app.get('/viewproofUpload/:id', function (req, res) {

        console.log("viewproofUpload API...");
        const PROOFDIR = './uploads/partnerproofs/';

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

    function fileRenameandUploadinDB(db, partner_id, data, username, time) {

        return new Promise((resolve, reject) => {

            console.log(partner_id);

            console.log("-----------");

            console.log(data);

            console.log(data.mimetype);

            var mimetype = data.mimetype;

            var doctype = mimetype.split('/')[1];

            console.log(doctype);

            var oldFileName = path.join(PROOFDIR, data.filename);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = partner_id + "_" + data.fieldname + "." + doctype;

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(PROOFDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var IDproofFileurl = `viewproofUpload/${partner_id}/?docname=`;

            console.log(IDproofFileurl);

            let sqlgetDocumentID = 'select id from tblAppConfig where sName="DocumentProof" and sValue=? and isActive=1';

            var file_proof = data.fieldname;

            db.query(sqlgetDocumentID, [file_proof], (err, result) => {

                if (err) return console.log(err);

                console.log(result);

                var id = '';
                if (result.length > 0) {
                    id = result[0].id;
                }
                else {
                    id = 0;
                }

                let partnerdocInsert = 'INSERT INTO tblpartnerdocmaster SET ?';

                var partnerdocPost = {
                    iPartnerid: partner_id,
                    iDocTypeid: id,
                    sDocName: newGeneratedFileName,
                    sDocPath: IDproofFileurl,
                    isActive: 1,
                    Created: time,
                    Created_by: username
                };

                db.query(partnerdocInsert, partnerdocPost, (err, result2) => {

                    if (err) return console.log(err);

                    console.log(result2);

                    return resolve();

                });

            });

        });
    }

    app.post('/partnerwithus', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var name = "KK";
        // var contactno = "9094090081";
        // var mailid = "kk3@gmail.com";
        // var companyname = "kkLabs";
        // var regno = "768UI667UYHY12";
        // var requestfor = 74;
        // var Userid = 9;

        var partnerInfo = JSON.parse(req.body.partnerInfo);

        console.log(partnerInfo);

        var name = partnerInfo.name;
        var contactno = partnerInfo.contactno;
        var mailid = partnerInfo.mailid;
        var companyname = partnerInfo.companyname;
        var regno = partnerInfo.regno;
        var requestfor = partnerInfo.requestfor;
        var Userid = partnerInfo.Userid;

        console.log("-------------");
        console.log(name);

        var Proof_Array = [];

        if (req.files.IdProof !== undefined) {
            console.log("IdProof available....");
            Proof_Array.push(req.files.IdProof[0]);
        }
        if (req.files.Addressproof !== undefined) {
            console.log("Addressproof available....");
            Proof_Array.push(req.files.Addressproof[0]);
        }
        if (req.files.LicenseProof !== undefined) {
            console.log("LicenseProof available....");
            Proof_Array.push(req.files.LicenseProof[0]);
        }
        if (req.files.GSTProof !== undefined) {
            console.log("GSTProof available....");
            Proof_Array.push(req.files.GSTProof[0]);
        }

        console.log(Proof_Array);

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, Userid);

        // await fileRenameandUploadinDB(db, 1,req.files.GSTProof[0],"viki","2021-03-02 17:30:00");

        var getMaxId = 'select \
        CASE \
          WHEN max(id) IS NULL THEN 1 \
          WHEN max(id) IS NOT NULL THEN max(id)+1 \
          END AS "max_value" \
        from tblPartner_Request';

        db.query(getMaxId, (err, result) => {

            if (err) {

                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var max_value = result[0].max_value;

            var id_length = max_value.toString().length;

            console.log("Id length:");

            console.log(id_length);

            var request_id = "";

            if (id_length == 1) {
                request_id = "PREQ0000".concat(max_value);
            }
            else if (id_length == 2) {
                request_id = "PREQ000".concat(max_value);
            }
            else if (id_length == 3) {
                request_id = "PREQ00".concat(max_value);
            }
            else if (id_length == 4) {
                request_id = "PREQ0".concat(max_value);
            }
            else if (id_length == 5) {
                request_id = "PREQ".concat(max_value);
            }

            console.log("Request Id:");

            console.log(request_id);

            var insert_tblPartner_Request = "INSERT INTO tblPartner_Request SET ?";

            var post_tblPartner_Request = {
                iReqid: request_id,
                sName: name,
                sContactNo: contactno,
                sMailId: mailid,
                sCompanyName: companyname,
                sRegNo: regno,
                request_for: requestfor,
                iUserid: Userid,
                status: 'Requested',
                sCreated: get_user_name,
                dCreated: get_time,
                isActive: 1
            };

            db.query(insert_tblPartner_Request, post_tblPartner_Request, async (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var partner_id = result2.insertId;

                console.log("Proof Array.....");

                console.log(Proof_Array);

                for (var i = 0; i < Proof_Array.length; i++) {
                    await fileRenameandUploadinDB(db, partner_id, Proof_Array[i], get_user_name, get_time);
                }

                return res.send({
                    status: 1,
                    message: 'Partner Requested'
                });


            });
        });

    });

    app.get('/makeRequestsfor', (req, res) => {

        var db = require("./config/config.js").db;

        var show_requests_for = 'select id,sName,sValue from tblAppConfig where sName="Role" and id NOT IN(1,34,48) and isActive=1';

        db.query(show_requests_for, (err, result) => {

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

    app.post('/RequestedbyUser', (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var userid = req.body.userid;

        var show_partner_users = 'select t1.iReqid,t1.sName,t1.sContactNo,t1.sMailId,t1.sCompanyName,t1.sRegNo,t1.status,t2.sValue as "Request_for" \
        from tblPartner_Request t1 \
        join tblAppConfig t2 on t2.id=t1.request_for and t2.isActive=1 \
        where t1.iUserid=? and t1.isActive=1';

        db.query(show_partner_users, [userid], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                })
            }

            console.log(result);

            return res.send(result);

        });



    });

    app.get('/showRequestedPartner', (req, res) => {

        var db = require("./config/config.js").db;

        var showRequests = 'select t1.iReqid,t1.sName,t1.sContactNo,t1.sMailId,t1.sCompanyName,t1.sRegNo,t1.status,t2.sValue as "Request_for",t1.request_for as "Request_for_id",t1.iUserid \
        from tblPartner_Request t1 \
        join tblAppConfig t2 on t2.id=t1.request_for and t2.isActive=1 \
        where t1.status="Requested" and t1.isActive=1';

        db.query(showRequests, (err, result) => {

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

    app.get('/showRequestedPartner/:id', async(req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.params);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var id = req.params.id;

        var showRequests = 'select t1.iReqid,t1.sName,t1.sContactNo,t1.sMailId,t1.sCompanyName,t1.sRegNo,t1.status,\
        t2.sValue as "Request_for",t1.request_for as "Request_for_id",t1.iUserid \
        from tblPartner_Request t1 \
        join tblAppConfig t2 on t2.id=t1.request_for and t2.isActive=1 \
        where t1.id=? and t1.isActive=1';

        var show_partner_details = 'select id, iPartnerid,concat(?,sDocPath,sDocName) as "FilePath",sDocPath as \
        "FileURL",sDocName as "FileName" from tblpartnerdocmaster where iPartnerid=? and isActive=1';

        db.query(showRequests, [id], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(show_partner_details, [ip,id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                result[0].partnerproofs = result2;

                return res.send(result);

            });
        });

    });

    function RequestApproved(username,usertime,id){

        return new Promise((resolve,reject)=>{

            var update_Approved = 'update tblPartner_Request set status="Approved",sModified=?,dModified=? where id=?';

            db.query(update_Approved, [username, usertime, id], (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }
                console.log(result);

                return resolve();

            });

        });

    }

    app.post('/updateRequeststatus', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var id = req.body.id;
        var status = req.body.status;
        var name = req.body.name;
        var contactno = req.body.contactno;
        var mailid = req.body.mailid;
        var companyname = req.body.companyname;
        var regno = req.body.regno;
        var requestfor = req.body.requestfor;
        var Request_for_id = req.body.Request_for_id;
        var Userid = req.body.Userid;

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, Userid);
        var get_mobile=await require('./config/findMobile')(db,Userid);

        if (status == "Approved") {

            if (Request_for_id == 2) { // DOCTOR

                var check_available = 'SELECT count(*) as "Available" FROM tblDoctorMaster where sMobileNumber=? and sActive=1';

                db.query(check_available, [get_mobile], (err, result2) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    if (result2.length == 0) {

                        var insert_doctor_master='INSERT INTO tblDoctorMaster SET ?';

                        var post_doctor_master={
                            sName:name,
                            sEmailID:mailid,
                            sMobileNumber:contactno,
                            sHospital:companyname,
                            sCreatedBy:get_user_name,
                            dCreated:get_time,
                            sActive:1
                        };

                        db.query(insert_doctor_master,post_doctor_master,async(err,result3)=>{

                            if(err){

                                console.log(err.sqlMessage);
                                return res.send({
                                    status:0,
                                    message:err.sqlMessage
                                });

                            }

                            console.log(result3);

                            await RequestApproved(get_user_name,get_time,id);

                            return res.send({
                                status:1,
                                message:'Approved'
                            });

                        });
                    }
                    else {
                        return res.send({
                            status: 0,
                            message: 'Already he/she played as a Doctor'
                        });
                    }

                });

            }
            else if (Request_for_id == 71) { // PHARMACY

                await RequestApproved(get_user_name,get_time,id);
                
                return res.send({
                    status:1,
                    message:'Approved'
                });

            }
            else if (Request_for_id == 72) { // AMBULANCE AGENCY

                var check_available = 'SELECT count(*) as "Available" FROM tblAmbAgencyMaster where sMobileNum=? and sActive=1';

                db.query(check_available, [contactno], (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    if (result2.length == 0) {

                        var insert_agency_master='INSERT INTO tblAmbAgencyMaster SET ?';

                        var post_agency_master={
                            sAgencyName:companyname,
                            sContactSpocName:name,
                            nContactSpocNum:contactno,
                            sContactSpocEmailID:mailid,
                            sCreatedBy:get_user_name,
                            dCreated:get_time,
                            sActive:1
                        };

                        db.query(insert_agency_master,post_agency_master,async(err,result3)=>{

                            if(err){

                                console.log(err.sqlMessage);
                                return res.send({
                                    status:0,
                                    message:err.sqlMessage
                                });

                            }

                            console.log(result3);

                            await RequestApproved(get_user_name,get_time,id);

                            return res.send({
                                status:1,
                                message:'Approved'
                            });

                        });

                    }
                    else {
                        return res.send({
                            status: 0,
                            message: 'Already he/she Owned as a Ambulance Agency'
                        });
                    }

                });

            }
            else if (Request_for_id == 73) { // BLOOD BANK

                var check_available = 'SELECT count(*) as "Available" FROM tblbldbankRegs where sMobileNum=? and sActive=1';

                db.query(check_available, [contactno], (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    if (result2.length == 0) {

                        var insert_blood_bank='INSERT INTO tblbldbankRegs SET ?';

                        var post_blood_bank={
                            sBBName:companyname,
                            sSpocName:name,
                            sMobileNum:contactno,
                            seMailID:mailid,
                            sCreatedBy:get_user_name,
                            dCreated:get_time,
                            sActive:1
                        };

                        db.query(insert_blood_bank,post_blood_bank,async(err,result3)=>{

                            if(err){

                                console.log(err.sqlMessage);
                                return res.send({
                                    status:0,
                                    message:err.sqlMessage
                                });

                            }

                            console.log(result3);

                            await RequestApproved(get_user_name,get_time,id);

                            return res.send({
                                status:1,
                                message:'Approved'
                            });

                        });

                    }
                    else {
                        return res.send({
                            status: 0,
                            message: 'Already he/she Owned as a Blood Bank'
                        });
                    }

                });

            }
            else if (Request_for_id == 74) { // LAB

                await RequestApproved(get_user_name,get_time,id);
                
                return res.send({
                    status:1,
                    message:'Approved'
                });
            }
            else if (Request_for_id == 75) { // EXPERTS
                await RequestApproved(get_user_name,get_time,id);
                
                return res.send({
                    status:1,
                    message:'Approved'
                });
            } 
        }
        else if (status == "Rejected") {

            var update_Rejected = 'update tblPartner_Request set status="Rejected",sModified=?,dModified=? where id=?';

            db.query(update_Rejected, [get_user_name, get_time, id], (err, result) => {

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
                    message: 'Rejected'
                });

            })

        }
        else {
            return res.send({
                status: 0,
                message: 'Status Failed...'
            });
        }

    });

}
