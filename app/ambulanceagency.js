var multer = require("multer");
var path = require('path');
var fs = require('fs');
const url = require('url');
var csc = require('country-state-city');
var request = require("request");
var ip = require("./config/ipaddressconfig.js").ipaddress;

const AMBULANCEAGENCYDIR = './uploads/Ambulanceagencyproofs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, AMBULANCEAGENCYDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).fields([{ name: "BusinessLicense" }, { name: "RegistrationCertificate" }, { name: "PanProof" }, { name: "GSTProof" }]);

module.exports = function (app) {

    function fileRenameandUploadinDB(db, iAmbulanceAgencyID, data, username, time) {

        return new Promise((resolve, reject) => {

            console.log(iAmbulanceAgencyID);

            console.log("-----------");

            console.log(data);

            console.log(data.mimetype);

            var mimetype = data.mimetype;

            var doctype = mimetype.split('/')[1];

            console.log(doctype);

            var oldFileName = path.join(AMBULANCEAGENCYDIR, data.filename);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = iAmbulanceAgencyID + "_" + data.fieldname + "." + doctype;

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(AMBULANCEAGENCYDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var IDproofFileurl = `viewambulanceagencyproofUpload/${iAmbulanceAgencyID}/?docname=`;

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

                let ambulanceagencydocInsert = 'INSERT INTO tblAmbAgencyDocMaster SET ?';

                var ambulanceagencydocPost = {
                    iAmbulanceAgencyID: iAmbulanceAgencyID,
                    iDocTypeid: id,
                    sDocName: newGeneratedFileName,
                    sDocPath: IDproofFileurl,
                    isActive: 1,
                    Created: time,
                    Created_by: username
                };

                db.query(ambulanceagencydocInsert, ambulanceagencydocPost, (err, result2) => {

                    if (err) return console.log(err);

                    console.log(result2);

                    return resolve();

                });

            });

        });
    }

    function InsertAmbulanceAgencyServices(db, iAmbulanceAgencyID, sAmbulanceType, get_user_name, get_time) {

        return new Promise((resolve, reject) => {

            var insert_AmbulanceAgencyServices = "INSERT INTO tblAmbulanceMaster SET ?";

            var post_AmbulanceAgencyServices = {
                iAmbulanceAgencyID: iAmbulanceAgencyID,
                sAmbulanceType: sAmbulanceType,
                sCreatedBy: get_user_name,
                dCreated: get_time,
                isActive: 1
            };

            db.query(insert_AmbulanceAgencyServices, post_AmbulanceAgencyServices, (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
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

    app.post('/addAmbulanceAgencyDetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var sContactName = "Raghu";
        // var sMobileNum = "9898570048";
        // var sContactNoSecondary = "9639687551";
        // var sEmailID = "Raghu@gmail.com";
        // var sAgencyName = "Raghu Agency";
        // var sWebsite = "www.Raghuagency.com";
        // var sPanNo = "APHYE25875"
        // var sGSTNum = "GSTIIN3534657";
        // var sAddress = "Sharath nagar,gandhi road,chennai";
        // var slat = "80.56892300546";
        // var slong = "10.56892300546";
        // var sLandmark = "Gandhi road";
        // var sCity = "3659";
        // var sState = "35";
        // var sCountry = "101";
        // var iZoneid = 4;
        // var sPincode = "600159";
        // var sRegistrationNo = "SFN350358";
        // var sRegisterExpiryDate = "2022-03-27";
        // var Userid = 1;
        // var sAmbulanceType = ['Medical First Responder', 'Patient Transport Vehicle', 'Advanced Life Support Ambulance'];

        var sContactName = req.body.sContactName;
        var sMobileNum = req.body.sMobileNum;
        var sContactNoSecondary = req.body.sContactNoSecondary;
        var sEmailID = req.body.sEmailID;
        var sAgencyName = req.body.sAgencyName;
        var sWebsite = req.body.sWebsite;
        var sPanNo = req.body.sPanNo;
        var sGSTNum = req.body.sGSTNum;
        var sAddress = req.body.sAddress;
        var slat = req.body.slat;
        var slong = req.body.slong;
        var sLandmark = req.body.sLandmark;
        var sCity = req.body.sCity;
        var sState = req.body.sState;
        var sCountry = req.body.sCountry;
        var iZoneid = req.body.iZoneid;
        var sPincode = req.body.sPincode;
        var sRegistrationNo = req.body.sRegistrationNo;
        var sRegisterExpiryDate = req.body.sRegisterExpiryDate;
        var Userid = req.body.Userid;
        var sAmbulanceType = JSON.parse(req.body.sAmbulanceType);

        console.log("-------------");

        var Proof_Array = [];

        if (req.files.BusinessLicense !== undefined) {
            console.log("BusinessLicense available....");
            Proof_Array.push(req.files.BusinessLicense[0]);
        }
        if (req.files.RegistrationCertificate !== undefined) {
            console.log("RegistrationCertificate available....");
            Proof_Array.push(req.files.RegistrationCertificate[0]);
        }
        if (req.files.PanProof !== undefined) {
            console.log("PanProof available....");
            Proof_Array.push(req.files.PanProof[0]);
        }
        if (req.files.GSTProof !== undefined) {
            console.log("GSTProof available....");
            Proof_Array.push(req.files.GSTProof[0]);
        }

        console.log(Proof_Array);

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, Userid);

        var check_AmbulanceAgency_available = 'SELECT * FROM tblAmbAgencyMaster where sMobileNum=? and isActive=1';

        db.query(check_AmbulanceAgency_available, [sMobileNum], (err, result) => {

            if (err) {
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                var insert_tblAmbulanceAgencyMaster = "INSERT INTO tblAmbAgencyMaster SET ?";

                var post_tblAmbulanceAgencyMaster = {
                    sContactName: sContactName,
                    sMobileNum: sMobileNum,
                    sContactNoSecondary: sContactNoSecondary,
                    sEmailID: sEmailID,
                    sAgencyName: sAgencyName,
                    sWebsite: sWebsite,
                    sPanNo: sPanNo,
                    sGSTNum: sGSTNum,
                    sAddress: sAddress,
                    slat: slat,
                    slong: slong,
                    sLandmark:sLandmark,
                    sCity: sCity,
                    sState: sState,
                    sCountry: sCountry,
                    iZoneid: iZoneid,
                    sPincode: sPincode,
                    sRegistrationNo: sRegistrationNo,
                    sRegisterExpiryDate: sRegisterExpiryDate,
                    sCreated: get_user_name,
                    dCreated: get_time,
                    isActive: 1
                };

                db.query(insert_tblAmbulanceAgencyMaster, post_tblAmbulanceAgencyMaster, async (err, result1) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result1);

                    var iAmbulanceAgencyid = result1.insertId;

                    console.log("Proof Array.....");

                    console.log(Proof_Array);

                    for (var i = 0; i < Proof_Array.length; i++) {
                        await fileRenameandUploadinDB(db, iAmbulanceAgencyid, Proof_Array[i], get_user_name, get_time);
                    }

                    for (var j = 0; j < sAmbulanceType.length; j++) {
                        await InsertAmbulanceAgencyServices(db, iAmbulanceAgencyid, sAmbulanceType[j], get_user_name, get_time);
                    }

                    var check_user_available = 'select * from tblUserMaster where sMobileNum=? and sActive=1';

                    db.query(check_user_available, [sMobileNum], async (err, result2) => {

                        if (err) {
                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result2);

                        if (result2.length == 0) {

                            let InserttblUserMaster = 'INSERT INTO tblUserMaster SET ?';

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

                            let PosttblUserMaster = {
                                sName: sContactName,
                                sMobileNum: sMobileNum,
                                sEmailID: sEmailID,
                                sAddress: sAddress,
                                sLat: slat,
                                sLong: slong,
                                sLandmark:sLandmark,            
                                spincode: sPincode,
                                sProfilePic:sProfilePic,
                                sProfileUrl:sProfileUrl,
                                sCreatedBy: get_user_name,
                                dCreated: get_time,
                                sActive: 1
                            };

                            db.query(InserttblUserMaster, PosttblUserMaster, (err, result3) => {

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

                                    var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=72 and  isActive=1';

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
                                            message: 'Ambulance Agency Onboarded Successfully'
                                        });

                                    });

                                });

                            });

                        }
                        else {

                            var id = result2[0].id;

                            var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=72 and  isActive=1';

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
                                    message: 'Ambulance Agency Onboarded Successfully'
                                });

                            });


                        }

                    });



                });

            }
            else {

                return res.send({
                    status: 0,
                    message: 'Ambulance Agency Already Onboarded'
                });

            }


        });


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

    app.get('/getAmbAgencydetails', (req, res) => {

        var db = require("./config/config.js").db;

        let AmbAgencydetails = 'select id, sContactName, sAgencyName, sMobileNum, sContactNoSecondary,sEmailID,sWebsite,sAddress,\
        sLat,sLong,sLandmark,sRegistrationNo, sRegisterExpiryDate,sPanNo, sGSTNum,sCity,sState,sCountry, iZoneid, sPincode\
        from tblAmbAgencyMaster where isActive=1';

        db.query(AmbAgencydetails, async (err, result) => {

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

    app.get('/getAmbAgencydetails/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var get_AmbulanceAgencydetails = 'select id, sContactName, sAgencyName, sMobileNum, sContactNoSecondary,sEmailID,sWebsite,sAddress,\
        sLat,sLong,sLandmark,sRegistrationNo, sRegisterExpiryDate,sPanNo, sGSTNum,sCity,sState,sCountry, iZoneid, sPincode\
        from tblAmbAgencyMaster where id=? and isActive=1';

        db.query(get_AmbulanceAgencydetails, [id], async (err, result) => {

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

            var get_AmbulanceAgencydetails_proofs = 'SELECT t1.id,CONCAT(?,t1.sDocPath,t1.sDocName) as "FileURL",t2.sValue as "documentProof"\
            FROM tblAmbAgencyDocMaster t1\
            join tblAppConfig t2 on t2.id=t1.iDocTypeid and t2.isActive=1\
            where t1.iAmbulanceAgencyid=? and t1.isActive=1';

            db.query(get_AmbulanceAgencydetails_proofs, [ip, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var get_AmbulanceAgencydetails_services = 'SELECT t1.iAmbulanceAgencyID,t1.sAmbulanceType,t2.sName as "Description",\
                t1.isActive FROM tblAmbulanceMaster t1\
                join tblAppConfig t2 on t2.sValue=t1.sAmbulanceType and t2.isActive=1\
                where t1.iAmbulanceAgencyID=? and t1.isActive=1';

                db.query(get_AmbulanceAgencydetails_services, [id], (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    result[0].imageurl = result2;
                    result[0].services = result3;

                    return res.send(result);

                });

            });

        });

    });

    function deleteExistingFile(docName, db, id, username, get_time) {

        return new Promise((resolve, reject) => {

            var oldFileName = path.join(AMBULANCEAGENCYDIR, docName);

            console.log(fs.existsSync(oldFileName));

            if (fs.existsSync(oldFileName)) {

                fs.unlink(oldFileName, (err) => {

                    if (err) return reject(err);

                    console.log(docName + "file deleted in folder...");

                    let delete_file = 'update tblAmbAgencyDocMaster set isActive=0,Modified=?,Modified_by=? where iAmbulanceAgencyID=?';

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

    function deleteAmbServices(db, username, get_time, id) {

        return new Promise((resolve, reject) => {

            var delete_labservices = 'update tblAmbulanceMaster set isActive=0,sModifiedBy=?,Modified=? where iAmbulanceAgencyID=?';

            db.query(delete_labservices, [username, get_time, id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                console.log("Deleted Lab Services......");

                return resolve();

            });

        });

    }

    app.post('/updateAmbulanceAgencyServicesdetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        var id = 34;
        var sContactName = "Sandeep";
        var sMobileNum = "9898570502";
        var sContactNoSecondary = "9639687551";
        var sEmailID = "SandeepKishan@gmail.com";
        var sAgencyName = "SandeepKishan Agency";
        var sWebsite = "www.SandeepKishanagency.com";
        var sPanNo = "APHYE25875"
        var sGSTNum = "GSTIIN3534657";
        var sAddress = "Sharath nagar,gandhi road,chennai";
        var slat = "80.56892300546";
        var slong = "10.56892300546";
        var sLandmark = "Sharath nagar";
        var sCity = "3659";
        var sState = "35";
        var sCountry = "101";
        var iZoneid = 1;
        var sPincode = "600159";
        var sRegistrationNo = "SFN350358";
        var sRegisterExpiryDate = "2022-03-27";
        var Userid = 1;
        var sAmbulanceType = ['Medical First Responder', 'Patient Transport Vehicle', 'Advanced Life Support Ambulance'];

        // var id = req.body.id;
        // var sContactName = req.body.sContactName;
        // var sMobileNum = req.body.sMobileNum;
        // var sContactNoSecondary = req.body.sContactNoSecondary;
        // var sEmailID = req.body.sEmailID;
        // var sAgencyName = req.body.sAgencyName;
        // var sWebsite = req.body.sWebsite;
        // var sPanNo = req.body.sPanNo;
        // var sGSTNum = req.body.sGSTNum;
        // var sAddress = req.body.sAddress;
        // var slat = req.body.slat;
        // var slong = req.body.slong;
        // var sLandmark = req.body.sLandmark;
        // var sCity = req.body.sCity;
        // var sState = req.body.sState;
        // var sCountry = req.body.sCountry;
        // var iZoneid = req.body.iZoneid;
        // var sPincode = req.body.sPincode;
        // var sRegistrationNo = req.body.sRegistrationNo;
        // var sRegisterExpiryDate = req.body.sRegisterExpiryDate;
        // var Userid = req.body.Userid;
        // var sAmbulanceType = JSON.parse(req.body.sAmbulanceType);

        var get_time = await require('./config/time.js')(db);
        var username = await require('./config/findusername')(db, Userid);

        var updateAmbulanceAgencyServicesdetails = 'update tblAmbAgencyMaster set sContactName=?,sMobileNum=?,\
        sContactNoSecondary=?,sEmailID=?,\
        sAgencyName=?,sWebsite=?,sPanNo=?,sGSTNum=?,sAddress=?,slat=?,slong=?,sLandmark=?,sCity=?,sState=?,sCountry=?,iZoneid=?,\
        sPincode=?,sRegistrationNo=?,sRegisterExpiryDate=?,sModified=?,dModified=? where id=?';

        var getdoc_names = '';

        db.query(updateAmbulanceAgencyServicesdetails, [sContactName, sMobileNum, sContactNoSecondary, sEmailID,
            sAgencyName, sWebsite,
            sPanNo, sGSTNum, sAddress,slat,slong, sLandmark,sCity, sState, sCountry, iZoneid, sPincode,
            sRegistrationNo, sRegisterExpiryDate, username, get_time, id], async (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                console.log("-------------");

                if (req.files.BusinessLicense != undefined) {

                    console.log("BusinessLicense Received...");

                    getdoc_names = 'select sDocName from tblAmbAgencyDocMaster where iAmbulanceAgencyID=? and  iDocTypeid=140 and isActive=1';

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


                        await fileRenameandUploadinDB(db, id, req.files.BusinessLicense[0], username, get_time);

                        console.log("BusinessLicense Completed...");

                    });

                }

                if (req.files.RegistrationCertificate != undefined) {

                    console.log("RegistrationCertificate Received...");

                    getdoc_names = 'select sDocName from tblAmbAgencyDocMaster where iAmbulanceAgencyID=? and  iDocTypeid=123 and isActive=1';

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
                if (req.files.PanProof != undefined) {

                    console.log("PanProof Received...");

                    getdoc_names = 'select sDocName from tblAmbAgencyDocMaster where iAmbulanceAgencyID=? and  iDocTypeid=136 and isActive=1';

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

                        console.log("check check ........................");
                        await fileRenameandUploadinDB(db, id, req.files.PanProof[0], username, get_time);

                        console.log("PanProof Completed...");

                    });

                }

                if (req.files.GSTProof != undefined) {

                    console.log("GSTProof Received...");

                    getdoc_names = 'select sDocName from tblAmbAgencyDocMaster where iAmbulanceAgencyID=? and  iDocTypeid=79 and isActive=1';

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

                        console.log("check check ........................");
                        await fileRenameandUploadinDB(db, id, req.files.GSTProof[0], username, get_time);

                        console.log("GSTProof Completed...");

                    });

                }

                await deleteAmbServices(db, username, get_time, id);

                for (var j = 0; j < sAmbulanceType.length; j++) {
                    await InsertAmbulanceAgencyServices(db, id, sAmbulanceType[j], username, get_time);
                }

                return res.send({
                    status: 1,
                    message: "Ambulance Agency Details Updated Successfully"
                });

            });
    });

    app.get('/viewAmbulanceAgencyproofUpload/:id', function (req, res) {

        console.log("viewAmbulanceAgencyproofUpload API...");
        const AMBULANCEAGENCYDIR = './uploads/Ambulanceagencyproofs/';

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

            fs.readFile(AMBULANCEAGENCYDIR + pic, function (err, content) {
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

    app.post('/deleteAmbulanceAgency', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;
        var userid = req.body.userid;

        var username = await require('./config/findusername.js')(db, userid);
        var get_time = await require('./config/time.js')(db);

        var delete_AmbulanceAgency = "update tblAmbAgencyMaster set isActive=0,sModified=?,dModified=? where id=?";

        var delete_AmbulanceAgency_proofs = 'update tblAmbAgencyDocMaster set isActive=0,Modified=?,Modified_by=? where iAmbulanceAgencyid=?';

        var delete_AmbulanceAgency_Services = 'update tblAmbulanceMaster SET isActive=0,sModifiedBy=?,Modified=? where iAmbulanceAgencyid=?';

        db.query(delete_AmbulanceAgency, [username, get_time, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(delete_AmbulanceAgency_proofs, [get_time, username, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                db.query(delete_AmbulanceAgency_Services, [username, get_time, id], (err, result3) => {

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
                        message: 'Ambulance Agency details Deleted'
                    });

                });

            });

        });

    });

    app.get('/getZonedetails', async (req, res) => {

        var db = require("./config/config.js").db;

        let getZonedetails = 'select iZoneid,sZoneCity,sPincode,sZone from tblZoneDetails where isActive=1';

        db.query(getZonedetails, (err, result) => {

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

    app.get('/getAmbulanceAgencydetails', async (req, res) => {

        var db = require("./config/config.js").db;

        let getZonedetails = 'select id,sName,sValue from tblAppConfig where sName="AmbulanceType" and isActive=1';

        db.query(getZonedetails, (err, result) => {

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



}
