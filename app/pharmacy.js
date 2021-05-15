var multer = require("multer");
var path = require('path');
var da = require('country-state-city');
var fs = require('fs');
const url = require('url');

const PHARMACYDIR = './uploads/pharmacyproofs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PHARMACYDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).fields([{ name: "DrugLicense" }, { name: "RegistrationCertificate" }, { name: "PanProof" }]);


module.exports = function (app) {

    function getCountryStateCity(countryID, stateID, cityID) {

        console.log("Inside getCountryStateCity method....");

        return new Promise((resolve, reject) => {

            var Country = da.default.getCountryById(countryID);

            var sCountry = Country.name;

            console.log(Country);

            var states = da.default.getStatesOfCountry(countryID);

            var stateName = '';

            var cityName = '';

            for (var i = 0; i < states.length; i++) {

                if (states[i].id == stateID) {
                    stateName = states[i].name;
                }
            }
            console.log(stateName);

            var cityList = da.default.getCitiesOfState(stateID);

            for (i = 0; i < cityList.length; i++) {

                if (cityList[i].id == cityID) {
                    cityName = cityList[i].name;
                }
            }

            console.log(cityName);

            var data = [];

            data[0] = sCountry; data[1] = stateName; data[2] = cityName;

            return resolve(data);

        });

    }

    function fileRenameandUploadinDB(db, iPharmacyid, data, get_user_name, get_time) {

        return new Promise((resolve, reject) => {

            console.log(iPharmacyid);

            console.log("-----------");

            console.log(data);

            console.log(data.mimetype);

            var mimetype = data.mimetype;

            var doctype = mimetype.split('/')[1];

            console.log(doctype);

            var oldFileName = path.join(PHARMACYDIR, data.filename);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = iPharmacyid + "_" + data.fieldname + "." + doctype;

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(PHARMACYDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var IDproofFileurl = `viewpharmacyproofUpload/${iPharmacyid}/?docname=`;

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

                let pharmacydocInsert = 'INSERT INTO tblPharmacydocmaster SET ?';

                var pharmacydocPost = {
                    iPharmacyid: iPharmacyid,
                    iDocTypeid: id,
                    sDocName: newGeneratedFileName,
                    sDocPath: IDproofFileurl,
                    isActive: 1,
                    Created: get_time,
                    Created_by: get_user_name
                };

                db.query(pharmacydocInsert, pharmacydocPost, (err, result2) => {

                    if (err) return console.log(err);

                    console.log(result2);

                    return resolve();

                });

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

    app.post('/addpharmacydetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var sPharmacyName = "GG Pharmacy";
        // var sContactName = "Ahaan";
        // var sContactNoPrimary = "8008007012";
        // var sContactNoSecondary = "8008007012";
        // var sEmail = "info@cpharma.com";
        // var sWebsiteURL = "www.cpharma.com";
        // var sPanNo = "CQBA25899"
        // var sGSTNo = "GSTIIN258964";
        // var sRegisterNo = "DP632007";
        // var sRegisterExpiryDate = "12-12-2022";
        // var sDrugLicenseNo = "DP632007";
        // var sDrugLicenseExpiryDate = "12-12-2022";
        // var sPharmacyAddress = "Perumbakkam,Chennaai";
        // var sCountry = "101";
        // var sState = "35";
        // var sCity = "3659";
        // var sPincode = "600123";
        // var sDeliveryAvailable = "Yes";
        // var sLat = "12.0989111";
        // var sLong = "81.1010112";
        // var sLandmark = "Perumbakkam";
        // var Userid = 1;

        var sPharmacyName = req.body.sPharmacyName;
        var sContactName = req.body.sContactName;
        var sContactNoPrimary = req.body.sContactNoPrimary;
        var sContactNoSecondary = req.body.sContactNoSecondary;
        var sEmail = req.body.sEmail;
        var sWebsiteURL = req.body.sWebsiteURL;
        var sPanNo = req.body.sPanNo;
        var sGSTNo = req.body.sGSTNo;
        var sRegisterNo = req.body.sRegisterNo;
        var sRegisterExpiryDate = req.body.sRegisterExpiryDate;
        var sDrugLicenseNo = req.body.sDrugLicenseNo;
        var sDrugLicenseExpiryDate = req.body.sDrugLicenseExpiryDate;
        var sPharmacyAddress = req.body.sPharmacyAddress;
        var sCountry = req.body.sCountry;
        var sState = req.body.sState;
        var sCity = req.body.sCity;
        var sPincode = req.body.sPincode;
        var sDeliveryAvailable = req.body.sDeliveryAvailable;
        var sLat = req.body.sLat;
        var sLong = req.body.sLong;
        var sLandmark = req.body.sLandmark;
        var Userid = req.body.Userid;

        console.log("-------------");

        var Proof_Array = [];

        if (req.files.DrugLicense !== undefined) {
            console.log("DrugLicense available....");
            Proof_Array.push(req.files.DrugLicense[0]);
        }
        if (req.files.RegistrationCertificate !== undefined) {
            console.log("RegistrationCertificate available....");
            Proof_Array.push(req.files.RegistrationCertificate[0]);
        }
        if (req.files.PanProof !== undefined) {
            console.log("PanProof available....");
            Proof_Array.push(req.files.PanProof[0]);
        }

        console.log(Proof_Array);

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, Userid);

        var check_pharmacy_available = 'SELECT * FROM tblPharmacyMaster where sContactNoPrimary=? and isActive=1';

        db.query(check_pharmacy_available, [sContactNoPrimary], (err, result) => {

            if (err) {
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                var insert_tblPharmacyMaster = "INSERT INTO tblPharmacyMaster SET ?";

                var post_tblPharmacyMaster = {

                    sPharmacyName: sPharmacyName,
                    sContactName: sContactName,
                    sContactNoPrimary: sContactNoPrimary,
                    sContactNoSecondary: sContactNoSecondary,
                    sEmail: sEmail,
                    sWebsiteURL: sWebsiteURL,
                    sPanNo: sPanNo,
                    sGSTNo: sGSTNo,
                    sRegisterNo: sRegisterNo,
                    sRegisterExpiryDate: sRegisterExpiryDate,
                    sDrugLicenseNo: sDrugLicenseNo,
                    sDrugLicenseExpiryDate: sDrugLicenseExpiryDate,
                    sPharmacyAddress: sPharmacyAddress,
                    sCountry: sCountry,
                    sState: sState,
                    sCity: sCity,
                    sPincode: sPincode,
                    sDeliveryAvailable: sDeliveryAvailable,
                    sLat: sLat,
                    sLong: sLong,
                    sLandmark: sLandmark,
                    sCreatedBy: get_user_name,
                    dCreated: get_time,
                    isActive: 1
                };

                db.query(insert_tblPharmacyMaster, post_tblPharmacyMaster, async (err, result4) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result4);

                    var iPharmacyid = result4.insertId;

                    console.log("Proof Array.....");

                    console.log(Proof_Array);

                    for (var i = 0; i < Proof_Array.length; i++) {
                        await fileRenameandUploadinDB(db, iPharmacyid, Proof_Array[i], get_user_name, get_time);
                    }

                    var check_user_available = 'select * from tblUserMaster where sMobileNum=? and sActive=1';

                    db.query(check_user_available, [sContactNoPrimary], async (err, result2) => {

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
                                sMobileNum: sContactNoPrimary,
                                sEmailID: sEmail,
                                sAddress: sPharmacyAddress,
                                sLat: sLat,
                                sLong: sLong,
                                sLandMark: sLandmark,
                                spincode: sPincode,
                                sProfilePic:sProfilePic,
                                sProfileUrl:sProfileUrl,
                                sCreatedBy: get_user_name,
                                dCreated: get_time,
                                sActive: 1
                            };
                            db.query(InserttblUserMaster, PosttblUserMaster, (err, result5) => {

                                if (err) return console.log(err);

                                console.log(result5);

                                var id = result5.insertId;

                                let Insertuserlogin = 'INSERT INTO tblUserlogin SET ?';

                                let Postuserlogin = {

                                    iUserID: id,
                                    iRole: 1,
                                    sCreatedBy: get_user_name,
                                    dCreated: get_time,
                                    isActive: 1,
                                };

                                db.query(Insertuserlogin, Postuserlogin, async (err, result6) => {

                                    if (err) return console.log(err);

                                    console.log(result6);

                                    var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=71 and isActive=1';

                                    db.query(list_menus_for_roles, async (err, result7) => {

                                        if (err) {
                                            console.log(err.sqlMessage);
                                            return res.send({
                                                status: 0,
                                                message: err.sqlMessage
                                            });
                                        }

                                        console.log(result7);

                                        for (var i = 0; i < result7.length; i++) {

                                            await InsertUserRoleMapping(id, result7[i].iRoleid, result7[i].iMenuid, get_user_name, get_time, db);

                                        }

                                        return res.send({
                                            status: 1,
                                            message: 'Pharmacy Onboarded Successfully'
                                        });

                                    });

                                });

                            });

                        }
                        else {

                            var id = result2[0].id;

                            var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=71 and  isActive=1';

                            db.query(list_menus_for_roles, async (err, result7) => {

                                if (err) {
                                    console.log(err.sqlMessage);
                                    return res.send({
                                        status: 0,
                                        message: err.sqlMessage
                                    });
                                }

                                console.log(result9);

                                for (var i = 0; i < result7.length; i++) {

                                    await InsertUserRoleMapping(id, result7[i].iRoleid, result7[i].iMenuid, get_user_name, get_time, db);

                                }

                                return res.send({
                                    status: 1,
                                    message: 'Pharmacy Onboarded Successfully'
                                });

                            });

                        }

                    });

                });


            }
            else {
                return res.send({
                    status: 0,
                    message: 'Pharmacy Already Onboared'
                });
            }



        });


    });

    app.get('/viewpharmacyproofUpload/:id', function (req, res) {

        console.log("viewpharmacyproofUpload API...");
        const PHARMACYDIR = './uploads/pharmacyproofs/';

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

            fs.readFile(PHARMACYDIR + pic, function (err, content) {
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

    app.get('/getpharmacydetails', (req, res) => {

        var db = require("./config/config.js").db;

        let get_pharmacy = 'select id ,sPharmacyName,sContactName,sContactNoPrimary,sContactNoSecondary,sEmail,\
        sWebsiteURL,sPanNo,sGSTNo,sRegisterNo,sRegisterExpiryDate,sDrugLicenseNo,sDrugLicenseExpiryDate,sPharmacyAddress,\
        sCountry,sState,sCity,sPincode,sDeliveryAvailable,sLat,sLong,sLandmark, sCreatedBy\
        from tblPharmacyMaster where isActive=1';

        db.query(get_pharmacy, async (err, result) => {

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

    app.get('/getpharmacydetails/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var get_pharmacydetails = 'select id ,sPharmacyName,sContactName,sContactNoPrimary,sContactNoSecondary,sEmail,\
        sWebsiteURL,sPanNo,sGSTNo,sRegisterNo,sRegisterExpiryDate,sDrugLicenseNo,sDrugLicenseExpiryDate,sPharmacyAddress,\
        sCountry,sState,sCity,sPincode,sDeliveryAvailable,sLat,sLong,sLandmark, sCreatedBy\
        from tblPharmacyMaster where id=? and isActive=1';

        db.query(get_pharmacydetails, [id], async (err, result) => {

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

            var pharmacy_proofs = 'SELECT t1.id,CONCAT(?,t1.sDocPath,t1.sDocName) as "FileURL",t2.sName ,t2.sValue as "documentProof"\
          FROM tblPharmacydocmaster t1 \
          join tblAppConfig t2 on t2.id=t1.iDocTypeid and t2.isActive=1 \
          where t1.iPharmacyid=? and t1.isActive=1';

            db.query(pharmacy_proofs, [ip, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                result[0].imageurl = result2;

                return res.send(result);

            });

        });

    });

    app.post('/deletePharmacydetails', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;
        var userid = req.body.userid;

        var username = await require('./config/findusername.js')(db, userid);
        var get_time = await require('./config/time.js')(db);

        var delete_Pharmacy = "update tblPharmacyMaster set isActive=0,sModifiedBy=?,dModified=? where id=?";

        var delete_Pharmacy_images = 'update tblPharmacydocmaster set isActive=0,Modified=?,Modified_by=? where iPharmacyid=?';

        db.query(delete_Pharmacy, [username, get_time, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(delete_Pharmacy_images, [get_time, username, id], (err, result2) => {

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
                    message: 'Pharmacy records Deleted'
                });

            });

        });

    });

    function deleteExistingFile(docName, db, id, username, get_time) {

        return new Promise((resolve, reject) => {

            var oldFileName = path.join(PHARMACYDIR, docName);

            console.log(fs.existsSync(oldFileName));

            if (fs.existsSync(oldFileName)) {

                fs.unlink(oldFileName, (err) => {

                    if (err) return reject(err);

                    console.log(docName + "file deleted in folder...");

                    let delete_file = 'update tblPharmacydocmaster set isActive=0,Modified=?,Modified_by=? where iPharmacyid=?';

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

    app.post('/updatepharmacydetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var id = 1;
        // var sPharmacyName = "96 Pharmacy";
        // var sContactName = "Anurag";
        // var sContactNoPrimary = "8008007030";
        // var sContactNoSecondary = "8008007050";
        // var sEmail = "info@96pharma.com";
        // var sWebsiteURL = "www.96pharma.com";
        // var sPanNo = "CQBA25899"
        // var sGSTNo = "GSTIIN258964";
        // var sRegisterNo = "DP632007";
        // var sRegisterExpiryDate = "12-12-2022";
        // var sDrugLicenseNo = "DP632007";
        // var sDrugLicenseExpiryDate = "12-12-2022";
        // var sPharmacyAddress = "Perumbakkam,Chennaai";
        // var sCountry = "101";
        // var sState = "35";
        // var sCity = "3659";
        // var sPincode = "600123";
        // var sDeliveryAvailable = "Yes";
        // var sLat = "12.0989111";
        // var sLong = "81.1010112";
        // var sLandmark = "Perumbakkam";
        // var Userid = 2;

        var id = req.body.id;
        var sPharmacyName = req.body.sPharmacyName;
        var sContactName = req.body.sContactName;
        var sContactNoPrimary = req.body.sContactNoPrimary;
        var sContactNoSecondary = req.body.sContactNoSecondary;
        var sEmail = req.body.sEmail;
        var sWebsiteURL = req.body.sWebsiteURL;
        var sPanNo = req.body.sPanNo;
        var sGSTNo = req.body.sGSTNo;
        var sRegisterNo = req.body.sRegisterNo;
        var sRegisterExpiryDate = req.body.sRegisterExpiryDate;
        var sDrugLicenseNo = req.body.sDrugLicenseNo;
        var sDrugLicenseExpiryDate = req.body.sDrugLicenseExpiryDate;
        var sPharmacyAddress = req.body.sPharmacyAddress;
        var sCountry = req.body.sCountry;
        var sState = req.body.sState;
        var sCity = req.body.sCity;
        var sPincode = req.body.sPincode;
        var sDeliveryAvailable = req.body.sDeliveryAvailable;
        var sLat = req.body.sLat;
        var sLong = req.body.sLong;
        var sLandmark = req.body.sLandmark;
        var Userid = req.body.Userid;

        var get_time = await require('./config/time.js')(db);
        var username = await require('./config/findusername')(db, Userid);

        var updatedoctordetails = 'update tblPharmacyMaster set sPharmacyName=?,sContactName=?,sContactNoPrimary=?,sContactNoSecondary=?,sEmail=?,\
        sWebsiteURL=?,sPanNo=?,sGSTNo=?,sRegisterNo=?,sRegisterExpiryDate=?,sDrugLicenseNo=?,sDrugLicenseExpiryDate=?,\
        sPharmacyAddress=?,sCountry=?,sState=?,sCity=?,sPincode=?,sDeliveryAvailable=?,sLat=?,sLong=?,sLandmark=?,sModifiedBy=?,dModified=? where id=?';

        var getdoc_names = '';

        db.query(updatedoctordetails, [sPharmacyName, sContactName, sContactNoPrimary, sContactNoSecondary, sEmail,
            sWebsiteURL, sPanNo, sGSTNo, sRegisterNo, sRegisterExpiryDate, sDrugLicenseNo, sDrugLicenseExpiryDate,
            sPharmacyAddress, sCountry, sState, sCity, sPincode, sDeliveryAvailable, sLat, sLong, sLandmark,
            username, get_time, id], async (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                console.log("-------------");

                if (req.files.DrugLicense != undefined) {

                    console.log("DrugLicense Received...");

                    getdoc_names = 'select sDocName from tblPharmacydocmaster where iPharmacyid=? and  iDocTypeid=125 and isActive=1';

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

                if (req.files.RegistrationCertificate != undefined) {

                    console.log("RegistrationCertificate Received...");

                    getdoc_names = 'select sDocName from tblPharmacydocmaster where iPharmacyid=? and  iDocTypeid=123 and isActive=1';

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

                    getdoc_names = 'select sDocName from tblPharmacydocmaster where iPharmacyid=? and  iDocTypeid=136 and isActive=1';

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

                return res.send({
                    status: 1,
                    message: "Pharmacy Details Updated Successfully"
                });

            });
    });

}
