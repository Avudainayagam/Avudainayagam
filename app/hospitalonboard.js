var multer = require("multer");
var path = require('path');
var fs = require('fs');
const url = require('url');
var csc = require('country-state-city');
var request = require("request");
var ip = require("./config/ipaddressconfig.js").ipaddress;

const HOSPITALDIR = './uploads/HospitalProofs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, HOSPITALDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).fields([{ name: "RegistrationCertificate" }, { name: "IMCRegistrationCertificate" },
{ name: "SMCRegistrationCertificate" }, { name: "LandAndConstruction" }, { name: "ElectricityProof" },
{ name: "WaterProof" }, { name: "SewageProof" }, { name: "BioMedicalWasteDisposal" },
{ name: "StorageOfLPGCylinders" }, { name: "NOCfromFireDept" }, { name: "NOCFromPollutionProof" },]);


module.exports = function (app) {

    function fileRenameandUploadinDB(db, iHospitalID, data, username, time) {

        return new Promise((resolve, reject) => {

            console.log(iHospitalID);

            console.log("-----------");

            console.log(data);

            console.log(data.mimetype);

            var mimetype = data.mimetype;

            var doctype = mimetype.split('/')[1];

            console.log(doctype);

            var oldFileName = path.join(HOSPITALDIR, data.filename);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = iHospitalID + "_" + data.fieldname + "." + doctype;

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(HOSPITALDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var IDproofFileurl = `viewHospitalProofUpload/${iHospitalID}/?docname=`;

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

                let HospitaldocInsert = 'INSERT INTO tblHospitalDocMaster SET ?';

                var HospitaldocPost = {
                    iHospitalID: iHospitalID,
                    iDocTypeid: id,
                    sDocName: newGeneratedFileName,
                    sDocPath: IDproofFileurl,
                    isActive: 1,
                    Created: time,
                    dCreated: username
                };

                db.query(HospitaldocInsert, HospitaldocPost, (err, result2) => {

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

    app.post('/addHospitalDetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var sHospitalName = "F_Hospital";
        // var sContactName = "Sharma";
        // var sContactNo = "6358965470";
        // var sContactEmail = "Sharma@gmail.com";
        // var sAddress = "T Nagar,Chennai";
        // var sWebsiteURL = "info@F_Hospital.com";
        // var sGSTNo = "GSTIIN89654";
        // var sPANNo = "CRTNH2589N";
        // var sRelationshipManagerName = "Varun";
        // var sRelationshipManagerContactNo = "6359872034";
        // var sRelationshipManagerEmail = "varun@gmail.com";
        // var sHospitalLicenceNo = "ALIC125874";
        // var sRegistrationExpireDate = "2022-10-05";
        // var sPharmacy = "Yes";
        // var sCovidVaccine = "Yes";
        // var sLat = "35.14785236";
        // var sLong = "10.258963147";
        // var sLandmark = "T Nagar";
        // var Userid = 1;

        var sHospitalName = req.body.sHospitalName;
        var sContactName = req.body.sContactName;
        var sContactNo = req.body.sContactNo;
        var sContactEmail = req.body.sContactEmail;
        var sAddress = req.body.sAddress;
        var sWebsiteURL = req.body.sWebsiteURL;
        var sGSTNo = req.body.sGSTNo;
        var sPANNo = req.body.sPANNo;
        var sRelationshipManagerName = req.body.sRelationshipManagerName;
        var sRelationshipManagerContactNo = req.body.sRelationshipManagerContactNo;
        var sRelationshipManagerEmail = req.body.sRelationshipManagerEmail;
        var sHospitalLicenceNo = req.body.sHospitalLicenceNo;
        var sRegistrationExpireDate = req.body.sRegistrationExpireDate;
        var sPharmacy = req.body.sPharmacy;
        var sCovidVaccine = req.body.sCovidVaccine;
        var sLat = req.body.sLat;
        var sLong = req.body.sLong;
        var sLandmark = req.body.sLandmark;
        var Userid = req.body.Userid;

        console.log("-------------");

        var Proof_Array = [];

        if (req.files.RegistrationCertificate !== undefined) {
            console.log("RegistrationCertificate available....");
            Proof_Array.push(req.files.RegistrationCertificate[0]);
        }
        if (req.files.IMCRegistrationCertificate !== undefined) {
            console.log("IMCRegistrationCertificate available....");
            Proof_Array.push(req.files.IMCRegistrationCertificate[0]);
        }
        if (req.files.SMCRegistrationCertificate !== undefined) {
            console.log("SMCRegistrationCertificate available....");
            Proof_Array.push(req.files.SMCRegistrationCertificate[0]);
        }
        if (req.files.LandAndConstruction !== undefined) {
            console.log("LandAndConstruction available....");
            Proof_Array.push(req.files.LandAndConstruction[0]);
        }
        if (req.files.ElectricityProof !== undefined) {
            console.log("ElectricityProof available....");
            Proof_Array.push(req.files.ElectricityProof[0]);
        }
        if (req.files.WaterProof !== undefined) {
            console.log("WaterProof available....");
            Proof_Array.push(req.files.WaterProof[0]);
        }
        if (req.files.SewageProof !== undefined) {
            console.log("SewageProof available....");
            Proof_Array.push(req.files.SewageProof[0]);
        }
        if (req.files.BioMedicalWasteDisposal !== undefined) {
            console.log("BioMedicalWasteDisposal available....");
            Proof_Array.push(req.files.BioMedicalWasteDisposal[0]);
        }
        if (req.files.StorageOfLPGCylinders !== undefined) {
            console.log("StorageOfLPGCylinders available....");
            Proof_Array.push(req.files.StorageOfLPGCylinders[0]);
        }
        if (req.files.NOCfromFireDept !== undefined) {
            console.log("NOCfromFireDept available....");
            Proof_Array.push(req.files.NOCfromFireDept[0]);
        }
        if (req.files.NOCFromPollutionProof !== undefined) {
            console.log("NOCFromPollutionProof available....");
            Proof_Array.push(req.files.NOCFromPollutionProof[0]);
        }

        console.log(Proof_Array);

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, Userid);

        var check_Hospital_available = 'SELECT * FROM tblHospital where sContactNo=? and isActive=1';

        db.query(check_Hospital_available, [sContactNo], (err, result) => {

            if (err) {
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                var insert_tblHospital = "INSERT INTO tblHospital SET ?";

                var post_tblHospital = {
                    sHospitalName: sHospitalName,
                    sContactName: sContactName,
                    sContactNo: sContactNo,
                    sContactEmail: sContactEmail,
                    sAddress: sAddress,
                    sWebsiteURL: sWebsiteURL,
                    sGSTNo: sGSTNo,
                    sPANNo: sPANNo,
                    sRelationshipManagerName: sRelationshipManagerName,
                    sRelationshipManagerContactNo: sRelationshipManagerContactNo,
                    sRelationshipManagerEmail: sRelationshipManagerEmail,
                    sHospitalLicenceNo: sHospitalLicenceNo,
                    sRegistrationExpireDate: sRegistrationExpireDate,
                    sPharmacy: sPharmacy,
                    sCovidVaccine: sCovidVaccine,
                    sLat: sLat,
                    sLong: sLong,
                    sLandmark: sLandmark,
                    sCreated_by: get_user_name,
                    dCreated_at: get_time,
                    isActive: 1
                };

                db.query(insert_tblHospital, post_tblHospital, async (err, result1) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result1);

                    var iHospitalID = result1.insertId;

                    console.log("Proof Array.....");

                    console.log(Proof_Array);

                    for (var i = 0; i < Proof_Array.length; i++) {
                        await fileRenameandUploadinDB(db, iHospitalID, Proof_Array[i], get_user_name, get_time);
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
                                sMobileNum: sContactNo,
                                sEmailID: sContactEmail,
                                sAddress: sAddress,
                                sLat: sLat,
                                sLong: sLong,
                                sLandMark: sLandmark,
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

                                    var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=184 and isActive=1';

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
                                            message: 'Hospital Onboarded Successfully'
                                        });

                                    });

                                });

                            });

                        }
                        else {
                            var id = result2[0].id;

                            var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=184 and  isActive=1';

                            db.query(list_menus_for_roles, async (err, result5) => {

                                if (err) {
                                    console.log(err.sqlMessage);
                                    return res.send({
                                        status: 0,
                                        message: err.sqlMessage
                                    });
                                }

                                console.log(result5);


                                for (var i = 0; i < result9.length; i++) {

                                    await InsertUserRoleMapping(id, result5[i].iRoleid, result5[i].iMenuid, get_user_name, get_time, db);

                                }

                                return res.send({
                                    status: 1,
                                    message: 'Hospital Onboarded Successfully'
                                });
                            });
                        }

                    });
                });
            }
            else {

                return res.send({
                    status: 0,
                    message: 'Hospital Already Onboarded'
                });

            }

        });

    });

    function deleteExistingFile(docName, db, id, username, get_time) {

        return new Promise((resolve, reject) => {

            var oldFileName = path.join(HOSPITALDIR, docName);

            console.log(fs.existsSync(oldFileName));

            if (fs.existsSync(oldFileName)) {

                fs.unlink(oldFileName, (err) => {

                    if (err) return reject(err);

                    console.log(docName + "file deleted in folder...");

                    let delete_file = 'update tblHospitalDocMaster set Modified=?,Modified_by=?,isActive=0 where iHospitalID=?';

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

    app.post('/updateHospitalDetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var id = 2;
        // var sHospitalName = "A_Hospital";
        // var sContactName = "Rohan Sharma";
        // var sContactNo = "9874563210";
        // var sContactEmail = "RohanSharma@gmail.com";
        // var sAddress = "T Nagar,Chennai";
        // var sWebsiteURL = "info@A_Hospital.com";
        // var sGSTNo = "GSTIIN89654";
        // var sPANNo = "CRTNH2589N";
        // var sRelationshipManagerName = "Varun";
        // var sRelationshipManagerContactNo = "7896541230";
        // var sRelationshipManagerEmail = "varun@gmail.com";
        // var sHospitalLicenceNo = "ALIC125874";
        // var sRegistrationExpireDate = "2022-10-05";
        // var sPharmacy = "Yes";
        // var sCovidVaccine = "Yes";
        // var sLat = "35.14785236";
        // var sLong = "10.258963147";
        // var sLandmark = "T Nagar";
        // var Userid = 1;

        var id = req.body.id;
        var sHospitalName = req.body.sHospitalName;
        var sContactName = req.body.sContactName;
        var sContactNo = req.body.sContactNo;
        var sContactEmail = req.body.sContactEmail;
        var sAddress = req.body.sAddress;
        var sWebsiteURL = req.body.sWebsiteURL;
        var sGSTNo = req.body.sGSTNo;
        var sPANNo = req.body.sPANNo;
        var sRelationshipManagerName = req.body.sRelationshipManagerName;
        var sRelationshipManagerContactNo = req.body.sRelationshipManagerContactNo;
        var sRelationshipManagerEmail = req.body.sRelationshipManagerEmail;
        var sHospitalLicenceNo = req.body.sHospitalLicenceNo;
        var sRegistrationExpireDate = req.body.sRegistrationExpireDate;
        var sPharmacy = req.body.sPharmacy;
        var sCovidVaccine = req.body.sCovidVaccine;
        var sLat = req.body.sLat;
        var sLong = req.body.sLong;
        var sLandmark = req.body.sLandmark;
        var Userid = req.body.Userid;

        var get_time = await require('./config/time.js')(db);
        var username = await require('./config/findusername')(db, Userid);

        var updateHospitaldetails = 'update tblHospital set sHospitalName=?,sContactName=?,sContactNo=?,\
        sContactEmail=?,sAddress=?,sWebsiteURL=?,sGSTNo=?,sPANNo=?,sRelationshipManagerName=?,sRelationshipManagerContactNo=?,\
        sRelationshipManagerEmail=?,sHospitalLicenceNo=?,sRegistrationExpireDate=?,sPharmacy=?,sCovidVaccine=?,\
        sLat=?,sLong=?,sLandmark=?,sModified_by=?,dModified_at=? where id=?';

        var getdoc_names = '';

        db.query(updateHospitaldetails, [sHospitalName, sContactName, sContactNo, sContactEmail, sAddress,
            sWebsiteURL, sGSTNo, sPANNo, sRelationshipManagerName, sRelationshipManagerContactNo, sRelationshipManagerEmail,
            sHospitalLicenceNo, sRegistrationExpireDate, sPharmacy, sCovidVaccine, sLat, sLong, sLandmark, username,
            get_time, id], async (err, result) => {

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

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=123 and isActive=1';

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

                if (req.files.IMCRegistrationCertificate != undefined) {

                    console.log("IMCRegistrationCertificate Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=176 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.IMCRegistrationCertificate[0], username, get_time);

                        console.log("IMCRegistrationCertificate Completed...");

                    });

                }

                if (req.files.SMCRegistrationCertificate != undefined) {

                    console.log("SMCRegistrationCertificate Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=177 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.SMCRegistrationCertificate[0], username, get_time);

                        console.log("SMCRegistrationCertificate Completed...");

                    });

                }

                if (req.files.LandAndConstruction != undefined) {

                    console.log("LandAndConstruction Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=178 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.LandAndConstruction[0], username, get_time);

                        console.log("LandAndConstruction Completed...");

                    });

                }

                if (req.files.ElectricityProof != undefined) {

                    console.log("ElectricityProof Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=179 and isActive=1';

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


                        await fileRenameandUploadinDB(db, id, req.files.ElectricityProof[0], username, get_time);

                        console.log("ElectricityProof Completed...");

                    });

                }

                if (req.files.WaterProof != undefined) {

                    console.log("WaterProof Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and iDocTypeid=180 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.WaterProof[0], username, get_time);

                        console.log("WaterProof Completed...");

                    });

                }

                if (req.files.SewageProof != undefined) {

                    console.log("SewageProof Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=181 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.SewageProof[0], username, get_time);

                        console.log("SewageProof Completed...");

                    });

                }

                if (req.files.BioMedicalWasteDisposal != undefined) {

                    console.log("BioMedicalWasteDisposal Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=129 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.BioMedicalWasteDisposal[0], username, get_time);

                        console.log("BioMedicalWasteDisposal Completed...");

                    });

                }

                if (req.files.StorageOfLPGCylinders != undefined) {

                    console.log("StorageOfLPGCylinders Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=182 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.StorageOfLPGCylinders[0], username, get_time);

                        console.log("StorageOfLPGCylinders Completed...");

                    });

                }

                if (req.files.NOCfromFireDept != undefined) {

                    console.log("NOCfromFireDept Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=131 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.NOCfromFireDept[0], username, get_time);

                        console.log("NOCfromFireDept Completed...");

                    });

                }

                if (req.files.NOCFromPollutionProof != undefined) {

                    console.log("NOCFromPollutionProof Received...");

                    getdoc_names = 'select sDocName from tblHospitalDocMaster where iHospitalID=? and  iDocTypeid=183 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.NOCFromPollutionProof[0], username, get_time);

                        console.log("NOCFromPollutionProof Completed...");

                    });

                }

                return res.send({
                    status: 1,
                    message: "Hospital Details Updated Successfully"
                });

            });
    });

    app.get('/getHospitalDetails', async (req, res) => {

        var db = require("./config/config.js").db;

        var getHospitalDetails = 'select id, sHospitalName, sContactName, sContactNo, sContactEmail, sAddress, sWebsiteURL,\
         sGSTNo, sPANNo,sRelationshipManagerName, sRelationshipManagerContactNo, sRelationshipManagerEmail,sHospitalLicenceNo, \
         sRegistrationExpireDate, sPharmacy, sCovidVaccine,sLat, sLong, sLandmark from tblHospital where isActive=1';

        db.query(getHospitalDetails, (err, result) => {

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

    app.get('/getHospitalDetails/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var getHospitalDetails = 'select id, sHospitalName, sContactName, sContactNo, sContactEmail, sAddress, sWebsiteURL,\
        sGSTNo, sPANNo,sRelationshipManagerName, sRelationshipManagerContactNo, sRelationshipManagerEmail,sHospitalLicenceNo, \
        sRegistrationExpireDate, sPharmacy, sCovidVaccine,sLat, sLong, sLandmark from tblHospital where id=? and isActive=1';

        db.query(getHospitalDetails, [id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }
            console.log(result);

            var getHospitalDetailsproofs = 'SELECT t1.id,CONCAT(?,t1.sDocPath,t1.sDocName) as "FileURL",t2.sValue as "documentProof"\
            FROM tblHospitalDocMaster t1\
            join tblAppConfig t2 on t2.id=t1.iDocTypeid and t2.isActive=1\
            where t1.iHospitalID=? and t1.isActive=1';

            db.query(getHospitalDetailsproofs, [ip, id], (err, result2) => {

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

    app.post('/deleteHospitalDetails', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;
        var userid = req.body.userid;

        var username = await require('./config/findusername.js')(db, userid);
        var get_time = await require('./config/time.js')(db);

        var deleteHospitalDetails = "update tblHospital set isActive=0,sModified_by=?,dModified_at=? where id=?";

        var deleteHospitalImages = 'update tblHospitalDocMaster set isActive=0,Modified=?,Modified_by=? where iHospitalID=?';

        db.query(deleteHospitalDetails, [username, get_time, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(deleteHospitalImages, [get_time, username, id], (err, result2) => {

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
                    message: 'Hospital records Deleted'
                });

            });
        });
    });

    app.get('/viewHospitalProofUpload/:id', function (req, res) {

        console.log("viewHospitalProofUpload API...");
        const HOSPITALDIR = './uploads/HospitalProofs/';

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

            fs.readFile(HOSPITALDIR + pic, function (err, content) {
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


}
