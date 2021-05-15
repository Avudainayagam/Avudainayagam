var multer = require("multer");
var path = require('path');
var fs = require('fs');
const url = require('url');
const { result } = require("lodash");
var csc = require('country-state-city');

const LABDIR = './uploads/labproofs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, LABDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).fields([{ name: "RegistrationCertificate" }, { name: "LicenseNABL" }, { name: "DrugLicense" },
{ name: "GCP" }, { name: "ShopandEstablimentAct" }, { name: "ClinicalEstablimentAct" }, { name: "BioMedicalWasteDisposal" }, { name: "LicenseNABL" },
{ name: "ApprovalfromWasteGenerationBoard" }, { name: "NOCfromFireDept" }, { name: "NOCfromMunicipalityCorporation" }]);



module.exports = function (app) {

    function fileRenameandUploadinDB(db, iLabid, data, username, time) {

        return new Promise((resolve, reject) => {

            console.log(iLabid);

            console.log("-----------");

            console.log(data);

            console.log(data.mimetype);

            var mimetype = data.mimetype;

            var doctype = mimetype.split('/')[1];

            console.log(doctype);

            var oldFileName = path.join(LABDIR, data.filename);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = iLabid + "_" + data.fieldname + "." + doctype;

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(LABDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var IDproofFileurl = `viewlabproofUpload/${iLabid}/?docname=`;

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

                let doctordocInsert = 'INSERT INTO tblLabdocmaster SET ?';

                var doctordocPost = {
                    iLabid: iLabid,
                    iDocTypeid: id,
                    sDocName: newGeneratedFileName,
                    sDocPath: IDproofFileurl,
                    isActive: 1,
                    Created: time,
                    Created_by: username
                };

                db.query(doctordocInsert, doctordocPost, (err, result2) => {

                    if (err) return console.log(err);

                    console.log(result2);

                    return resolve();

                });

            });

        });
    }

    function Insertlabservices(db, iLabid, iServiceid, get_time, username) {

        return new Promise((resolve, reject) => {

            var insert_tblLabServices = 'INSERT INTO tblLabServices SET ?';

            var post_tblLabServices = {
                iLabid: iLabid,
                iServiceid: iServiceid,
                Created: get_time,
                Created_by: username,
                isActive: 1
            }

            db.query(insert_tblLabServices, post_tblLabServices, (err, result) => {

                if (err) {
                    console.log(err);
                 
                }

                console.log(result);

                return resolve();

            });

        });

    }

    function InsertUserRoleMapping(userid, iRoleid, iMenuid, get_user_name, get_time, db) {

        return new Promise((resolve, reject) => {

            var insert_user_role_mapping = 'INSERT INTO tbluserRoleMappimg SET ?';

            var post_user_role_mapping = {
                iuserid: userid,
                iRoleid: iRoleid,
                iMenuid: iMenuid,
                sCreated_by: get_user_name,
                dCreated_at: get_time,
                isActive: 1
            };

            db.query(insert_user_role_mapping, post_user_role_mapping, (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                return resolve();

            });

        });

    }

    app.post('/addlabdetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var sLabName = "B_lab";
        // var sName = "Raj";
        // var sContactNo = "9052289055";
        // var sContactNoSecondary = "9052283410";
        // var sEmail = "info@Rohanlab.com";
        // var sWebsiteURL = "www.Rohanlab.com ";
        // var sRegisterNo = "Medi15964";
        // var sPanNo = "CQAP25892B";
        // var sGSTNo = "UGUYGDGUH772";
        // var sArea = "Chennai";
        // var sPincode = "600100";
        // var sCity = 3659;
        // var sState = 35;
        // var sCountry = 101;
        // var sServiceatHome = "Yes";
        // var sLat = "80.56892300546";
        // var sLong = "10.56892300546";
        // var sLandmark = "T Nagar";
        // var sPremiumCost = "5000";
        // var iServiceid = [1, 5];
        // var Userid = 2;

        var sLabName = req.body.sLabName;
        var sName = req.body.sName;
        var sContactNo = req.body.sContactNo;
        var sContactNoSecondary = req.body.sContactNoSecondary;
        var sEmail = req.body.sEmail;
        var sWebsiteURL = req.body.sWebsiteURL;
        var sRegisterNo = req.body.sRegisterNo;
        var sPanNo = req.body.sPanNo;
        var sGSTNo = req.body.sGSTNo;
        var sArea = req.body.sArea;
        var sPincode = req.body.sPincode;
        var sCity = req.body.sCity;
        var sState = req.body.sState;
        var sCountry = req.body.sCountry;
        var sServiceatHome = req.body.sServiceatHome;
        var sLat = req.body.sLat;
        var sLong = req.body.sLong;
        var sLandmark = req.body.sLandmark;
        var sPremiumCost = req.body.sPremiumCost;
        var iServiceid = JSON.parse(req.body.iServiceid);
        var Userid = req.body.Userid;

        console.log("-------------");

        var Proof_Array = [];

        if (req.files.RegistrationCertificate !== undefined) {
            console.log("RegistrationCertificate available....");
            Proof_Array.push(req.files.RegistrationCertificate[0]);
        }
        if (req.files.LicenseNABL !== undefined) {
            console.log("LicenseNABL available....");
            Proof_Array.push(req.files.LicenseNABL[0]);
        }
        if (req.files.DrugLicense !== undefined) {
            console.log("DrugLicense available....");
            Proof_Array.push(req.files.DrugLicense[0]);
        }
        if (req.files.GCP !== undefined) {
            console.log("GCP available....");
            Proof_Array.push(req.files.GCP[0]);
        }
        if (req.files.ShopandEstablimentAct !== undefined) {
            console.log("ShopandEstablimentAct available....");
            Proof_Array.push(req.files.ShopandEstablimentAct[0]);
        }
        if (req.files.ClinicalEstablimentAct !== undefined) {
            console.log("ClinicalEstablimentAct available....");
            Proof_Array.push(req.files.ClinicalEstablimentAct[0]);
        }
        if (req.files.BioMedicalWasteDisposal !== undefined) {
            console.log("BioMedicalWasteDisposal available....");
            Proof_Array.push(req.files.BioMedicalWasteDisposal[0]);
        }
        if (req.files.ApprovalfromWasteGenerationBoard !== undefined) {
            console.log("ApprovalfromWasteGenerationBoard available....");
            Proof_Array.push(req.files.ApprovalfromWasteGenerationBoard[0]);
        }
        if (req.files.NOCfromFireDept !== undefined) {
            console.log("NOCfromFireDept available....");
            Proof_Array.push(req.files.NOCfromFireDept[0]);
        }
        if (req.files.NOCfromMunicipalityCorporation !== undefined) {
            console.log("NOCfromMunicipalityCorporation available....");
            Proof_Array.push(req.files.NOCfromMunicipalityCorporation[0]);
        }

        console.log(Proof_Array);

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, Userid);

        var check_lab_available = 'SELECT * FROM tblLabMaster where sContactNo=? and isActive=1';

        db.query(check_lab_available, [sContactNo], (err, result1) => {

            if (err) {
                console.log(err);
                return res.send(err.sqlMessage);
            }

            console.log(result1);

            if (result1.length == 0) {

                var insert_tblLabMaster = "INSERT INTO tblLabMaster SET ?";

                var post_tblLabMaster = {
                    sLabName: sLabName,
                    sName: sName,
                    sContactNo: sContactNo,
                    sContactNoSecondary: sContactNoSecondary,
                    sEmail: sEmail,
                    sWebsiteURL: sWebsiteURL,
                    sRegisterNo: sRegisterNo,
                    sPanNo: sPanNo,
                    sGSTNo: sGSTNo,
                    sArea: sArea,
                    sPincode: sPincode,
                    sCity: sCity,
                    sState: sState,
                    sCountry: sCountry,
                    sServiceatHome: sServiceatHome,
                    sLat: sLat,
                    sLong: sLong,
                    sLandmark: sLandmark,
                    sPremiumCost: sPremiumCost,
                    sCreatedBy: get_user_name,
                    dCreated: get_time,
                    isActive: 1
                };

                db.query(insert_tblLabMaster, post_tblLabMaster, async (err, result) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result);

                    var iLabid = result.insertId;

                    for (var i = 0; i < Proof_Array.length; i++) {
                        await fileRenameandUploadinDB(db, iLabid, Proof_Array[i], get_user_name, get_time);
                    }

                    var n = iServiceid.length;

                    console.log(iServiceid);

                    for (var j = 0; j < n; j++) {
                        await Insertlabservices(db, iLabid, iServiceid[j], get_time, get_user_name);
                    }

                    var check_user_available = 'select * from tblUserMaster where sMobileNum=? and sActive=1';

                    db.query(check_user_available, [sContactNo], async (err, result2) => {

                        if (err) {
                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result2);

                        if (result2.length == 0) {

                            let InsertUserMaster = 'INSERT INTO tblUserMaster SET ?';

                            console.log(req.file);

                            var sProfilePic = '';
                            var sProfileUrl = '';

                            if (req.file) {
                                console.log("Image Available");
                                var result = await fileRenameandUploadinDB(req.file.originalname,id, latest_id);
                                console.log(result);
                                sProfileUrl = result.Fileurl;
                                sProfilePic = result.newFileName;
                            }
                            else {
                                sProfileUrl = 'viewUserProfileImages/?docname=';
                                sProfilePic = 'dummy.jpg';
                                console.log("Image Not Available");
                            }

                            let PostUserMaster = {
                                sName: sName,
                                sMobileNum: sContactNo,
                                sEmailID: sEmail,
                                sLat:sLat,
                                sLong:sLong,
                                sLandMark: sLandmark,
                                spincode: sPincode,
                                sProfilePic:sProfilePic,
                                sProfileUrl:sProfileUrl,
                                sCreatedBy: get_user_name,
                                dCreated: get_time,
                                sActive: 1
                            };

                            db.query(InsertUserMaster, PostUserMaster, (err, result3) => {

                                if (err) return console.log(err);

                                console.log(result3);

                                var id = result3.insertId;

                                let Insertuserlogin = 'INSERT INTO tblUserlogin SET ?';

                                let Postuserlogin = {
                                    iUserID: id,
                                    iRole: 1,
                                    sCreatedBy: get_user_name,
                                    dCreated: get_time,
                                    isActive: 1,
                                };

                                db.query(Insertuserlogin, Postuserlogin, async (err, result4) => {

                                    if (err) return console.log(err);

                                    console.log(result4);

                                    var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=74 and  isActive=1';

                                    db.query(list_menus_for_roles, async (err, result5) => {

                                        if (err) {
                                            console.log(err.sqlMessage);
                                            return res.send({
                                                status: 0,
                                                message: err.sqlMessage
                                            });
                                        }

                                        console.log(result5);

                                        for (var i = 0; i < result5.length; i++) {

                                            await InsertUserRoleMapping(id, result5[i].iRoleid, result5[i].iMenuid, get_user_name, get_time, db);

                                        }

                                        return res.send({
                                            status: 1,
                                            message: 'Lab Onboarded Successfully'
                                        });

                                    });

                                });

                            });

                        }
                        else {

                            var id = result2[0].id;

                            var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=74 and  isActive=1';

                            db.query(list_menus_for_roles, async (err, result5) => {

                                if (err) {
                                    console.log(err.sqlMessage);
                                    return res.send({
                                        status: 0,
                                        message: err.sqlMessage
                                    });
                                }

                                console.log(result5);

                                for (var i = 0; i < result5.length; i++) {

                                    await InsertUserRoleMapping(id, result5[i].iRoleid, result5[i].iMenuid, get_user_name, get_time, db);

                                }

                                return res.send({
                                    status: 1,
                                    message: 'Lab Onboarded Successfully'
                                });

                            });


                        }

                    });

                });

            }
            else {
                return res.send({
                    status: 0,
                    message: 'Lab Already Onboarded'
                });
            }


        });
    });

    app.get('/viewlabproofUpload/:id', function (req, res) {

        console.log("viewlabproofUpload API...");
        const LABDIR = './uploads/labproofs/';

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

            fs.readFile(LABDIR + pic, function (err, content) {
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

    function getCountryStateCity(countryID, stateID, cityID) {

        console.log("Inside getCountryStateCity method....");

        return new Promise((resolve, reject) => {

            var Country = csc.default.getCountryById(countryID);

            console.log(Country);

            var states = csc.default.getStatesOfCountry(countryID);

            var stateName = '';

            var cityName = '';

            for (var i = 0; i < states.length; i++) {

                if (states[i].id == stateID) {
                    stateName = states[i].name;
                }
            }
            console.log(stateName);

            var cityList = csc.default.getCitiesOfState(stateID);

            for (i = 0; i < cityList.length; i++) {

                if (cityList[i].id == cityID) {
                    cityName = cityList[i].name;
                }
            }

            console.log(cityName);

            var data = [];

            data[0] = Country.name; data[1] = stateName; data[2] = cityName;

            return resolve(data);

        });

    }

    app.get('/getlabdetails', (req, res) => {

        var db = require("./config/config.js").db;

        let sql = 'select id, sLabName, sName, sContactNo, sContactNoSecondary, sEmail, sWebsiteURL, sRegisterNo,\
        sPanNo, sGSTNo, sArea, sPincode,sCity, sState, sCountry, sServiceatHome,sLat,sLong,sLandmark, \
        sPremiumCost, sCreatedBy\
        from tblLabMaster where isActive=1';

        db.query(sql, async (err, result) => {

            if (err) throw err;

            for (var i = 0; i < result.length; i++) {

                console.log("CountryID:" + result[i].sCountry);

                console.log("StateID:" + result[i].sState);

                console.log("cityID:" + result[i].sCity);

                var countryID = result[i].sCountry;

                var stateID = result[i].sState;

                var cityID = result[i].sCity;

                console.log(countryID + " " + stateID + " " + cityID);

                let a = await getCountryStateCity(countryID, stateID, cityID);

                console.log("---------------");

                console.log(a);

                result[i].sCountry = a[0]; result[i].sState = a[1]; result[i].sCity = a[2];


            }

            return res.send(result);

        });
    });

    app.get('/getlabdetails/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        let lab_details = 'select id, sLabName, sName, sContactNo, sContactNoSecondary, sEmail, sWebsiteURL, sRegisterNo,\
        sPanNo, sGSTNo, sArea, sPincode,sCity, sState, sCountry, sServiceatHome,sLat,sLong,sLandmark, \
        sPremiumCost, sCreatedBy\
        from tblLabMaster where id=? and isActive=1';

        db.query(lab_details, [id], async (err, result) => {

            if (err) throw err;

            for (var i = 0; i < result.length; i++) {

                console.log("CountryID:" + result[i].sCountry);

                console.log("StateID:" + result[i].sState);

                console.log("cityID:" + result[i].sCity);

                var countryID = result[i].sCountry;

                var stateID = result[i].sState;

                var cityID = result[i].sCity;

                console.log(countryID + " " + stateID + " " + cityID);

                let a = await getCountryStateCity(countryID, stateID, cityID);

                console.log("---------------");

                console.log(a);

                result[i].sCountry = a[0]; result[i].sState = a[1]; result[i].sCity = a[2];


            }


            console.log(result);

            let lab_proofs = 'SELECT t1.id,t2.sName,t2.sValue as "DocumentName",concat(?,t1.sDocPath,t1.sDocName) as "FileName"\
            FROM tblLabdocmaster t1\
            join tblAppConfig t2 on t2.id = t1.iDocTypeid and t2.isActive=1\
            where iLabid=? and t1.isActive=1 ';

            db.query(lab_proofs, [ip, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });

                }

                console.log(result2);

                let lab_services = ' SELECT t1.id,t1.sServices FROM tblLabMasterServices t1\
                join tblLabServices t2 on t2.iServiceid = t1.id and t2.isActive=1\
                where iLabid=? and t1.isActive=1';

                db.query(lab_services, [id], (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });

                    }

                    console.log(result3);

                    if (result.length > 0) {

                        result[0].labdocurl = [];
                        result[0].labdocurl = result2;
                        console.log(result2);
                        result[0].labservices = result3;
                        console.log(result3);

                    }

                    return res.send(result);

                });
            });
        });

    });

    app.post('/deletelabdetails', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;
        var userid = req.body.userid;

        var username = await require('./config/findusername.js')(db, userid);
        var get_time = await require('./config/time.js')(db);

        var delete_lab = "update tblLabMaster set isActive=0,sModifiedBy=?,dModified=? where id=?";

        var delete_lab_proofs = 'update tblLabdocmaster set isActive=0,Modified_by=?,Modified=? where iLabid=?';

        var delete_lab_services = 'update tblLabServices set isActive=0,Modified=?,Modified_by=? where iLabid=?';

        db.query(delete_lab, [username, get_time, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(delete_lab_proofs, [username, get_time, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                db.query(delete_lab_services, [get_time, username, id], (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    return res.send({
                        status: 1,
                        message: 'Details Deleted'
                    });

                });
            });

        });

    });

    app.get('/selectlabservices', async (req, res) => {

        var db = require("./config/config.js").db;

        let labservices = 'select id,sServices from tblLabMasterServices where isActive=1';

        db.query(labservices, (err, result) => {

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

    function deleteExistingFile(docName, db, id, username, get_time) {

        return new Promise((resolve, reject) => {

            var oldFileName = path.join(LABDIR, docName);

            console.log(fs.existsSync(oldFileName));

            if (fs.existsSync(oldFileName)) {

                fs.unlink(oldFileName, (err) => {

                    if (err) return reject(err);

                    console.log(docName + "file deleted in folder...");

                    let delete_file = 'update tblLabdocmaster set isActive=0,Modified=?,Modified_by=? where iLabid=?';

                    db.query(delete_file, [get_time, username, id], (err, result) => {

                        if (err) return console.log(err);

                        console.log(result);

                        console.log(docName + "file deleted in db...");

                        return resolve('Existing File Deleted..');

                    });


                });

            }
            else {
                return resolve();
            }

        });

    }

    function deleteLabServices(db, username, get_time, id) {

        return new Promise((resolve, reject) => {

            var delete_labservices = 'update tblLabServices set isActive=0,Modified=?,Modified_by=? where iLabid=?';

            db.query(delete_labservices, [get_time, username, id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                console.log("Deleted Lab Services......");

                return resolve();

            });

        });

    }

    app.post('/updatelabdetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var id = 2;
        // var sLabName = "Lab_Medics";
        // var sName = "Raghu Ram";
        // var sContactNo = "9876543225";
        // var sContactNoSecondary = "9874563211";
        // var sEmail = "raghuram@medicallab.com";
        // var sWebsiteURL = "www.medilab.com ";
        // var sRegisterNo = "Medi15963";
        // var sPanNo = "CQAP25896";
        // var sGSTNo = "UGUYGDGUH772";
        // var sArea = "Chennai";
        // var sPincode = "600100";
        // var sCity = 3659;
        // var sState = 35;
        // var sCountry = 101;
        // var sServiceatHome = "Yes";
        // var sLat = "80.56892300546";
        // var sLong = "10.56892300546";
        // var sLandmark = "T Nagar";
        // var sPremiumCost = "5000";
        // var Userid = 1;
        // var iServiceid = [1, 21];

        var id = req.body.id;
        var sLabName = req.body.sLabName;
        var sName = req.body.sName;
        var sContactNo = req.body.sContactNo;
        var sContactNoSecondary = req.body.sContactNoSecondary;
        var sEmail = req.body.sEmail;
        var sWebsiteURL = req.body.sWebsiteURL;
        var sRegisterNo = req.body.sRegisterNo;
        var sPanNo = req.body.sPanNo;
        var sGSTNo = req.body.sGSTNo;
        var sArea = req.body.sArea;
        var sPincode = req.body.sPincode;
        var sCity = req.body.sCity;
        var sState = req.body.sState;
        var sCountry = req.body.sCountry;
        var sServiceatHome = req.body.sServiceatHome;
        var sLat = req.body.sLat;
        var sLong = req.body.sLong;
        var sLandmark = req.body.sLandmark;
        var sPremiumCost = req.body.sPremiumCost;
        var Userid = req.body.Userid;
        var iServiceid = req.body.iServiceid;

        var get_time = await require('./config/time.js')(db);
        var username = await require('./config/findusername')(db, Userid);

        var updatedoctordetails = 'update tblLabMaster set sLabName=?,sName=?,sContactNo=?,sContactNoSecondary=?,sEmail=?,\
        sWebsiteURL=?,sRegisterNo=?,sPanNo=?,sGSTNo=?,sArea=?,sPincode=?,sCity=?,sState=?,sCountry=?,sServiceatHome=?,sLat=?,sLong=?,sLandmark=?,sPremiumCost=?,\
        sModifiedBy=?,dModified=? where id=?';

        var getdoc_names = '';

        db.query(updatedoctordetails, [sLabName, sName, sContactNo, sContactNoSecondary, sEmail, sWebsiteURL, sRegisterNo, sPanNo, sGSTNo,
            sArea, sPincode, sCity, sState, sCountry, sServiceatHome, sLat, sLong,sLandmark, sPremiumCost, username, get_time,
            id], async (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                console.log("-------------");

                if (req.files.RegistrationCertificate != undefined) {

                    console.log("RegistrationCertificate Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and  iDocTypeid=123  and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.RegistrationCertificate[0], username, get_time);

                        console.log("RegistrationCertificate Completed...");

                    });

                }

                if (req.files.LicenseNABL != undefined) {

                    console.log("LicenseNABL Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and  iDocTypeid=124 and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.LicenseNABL[0], username, get_time);
                        console.log("LicenseNABL Completed...");

                    });

                }
                if (req.files.DrugLicense != undefined) {

                    console.log("DrugLicense Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and  iDocTypeid=125 and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.DrugLicense[0], username, get_time);
                        console.log("DrugLicense Completed...");

                    });

                }

                if (req.files.GCP != undefined) {

                    console.log("GCP Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and  iDocTypeid=126  and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.GCP[0], username, get_time);
                        console.log("GCP Completed...");

                    });

                }

                if (req.files.ShopandEstablimentAct != undefined) {

                    console.log("ShopandEstablimentAct Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and  iDocTypeid=127 and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.ShopandEstablimentAct[0], username, get_time);
                        console.log("ShopandEstablimentAct Completed...");

                    });

                }
                if (req.files.ClinicalEstablimentAct != undefined) {

                    console.log("ClinicalEstablimentAct Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and iDocTypeid=128 and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.ClinicalEstablimentAct[0], username, get_time);
                        console.log("ClinicalEstablimentAct Completed...");

                    });

                }

                if (req.files.BioMedicalWasteDisposal != undefined) {

                    console.log("BioMedicalWasteDisposal Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and  iDocTypeid=129  and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.BioMedicalWasteDisposal[0], username, get_time);
                        console.log("BioMedicalWasteDisposal Completed...");

                    });

                }

                if (req.files.ApprovalfromWasteGenerationBoard != undefined) {

                    console.log("ApprovalfromWasteGenerationBoard Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and  iDocTypeid=130 and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.ApprovalfromWasteGenerationBoard[0], username, get_time);
                        console.log("ApprovalfromWasteGenerationBoard Completed...");

                    });

                }
                if (req.files.NOCfromFireDept != undefined) {

                    console.log("NOCfromFireDept Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and iDocTypeid=131 and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.NOCfromFireDept[0], username, get_time);
                        console.log("NOCfromFireDept Completed...");

                    });

                }
                if (req.files.NOCfromMunicipalityCorporation != undefined) {

                    console.log("NOCfromMunicipalityCorporation Received...");

                    getdoc_names = 'select sDocName from tblLabdocmaster where iLabid=? and  iDocTypeid=132 and isActive=1';

                    db.query(getdoc_names, [id], async (err, result2) => {

                        if (err) return console.log(err);

                        console.log(result2);

                        var docname = "";

                        if (result2.length == 0) {

                        }
                        else {
                            docname = result2[0].sDocName;

                            await deleteExistingFile(docname, db, id, username, get_time);
                        }


                        await fileRenameandUploadinDB(db, id, req.files.NOCfromMunicipalityCorporation[0], username, get_time);
                        console.log("NOCfromMunicipalityCorporation Completed...");

                    });

                }

                await deleteLabServices(db, username, get_time, id);

                for (var i = 0; i < iServiceid.length; i++) {
                    await Insertlabservices(db, id, iServiceid[i], get_time, username);
                }

                return res.send({
                    status: 1,
                    message: "Lab Details Updated Successfully"
                });

            });
    });
}
