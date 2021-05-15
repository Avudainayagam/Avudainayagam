var multer = require("multer");
var path = require('path');
var fs = require('fs');
const url = require('url');
var csc = require('country-state-city');
var request = require("request");
var ip = require("./config/ipaddressconfig.js").ipaddress;

const AMBULANCEDIR = './uploads/AmbulanceProofs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, AMBULANCEDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).fields([{ name: "VechiclePermitCertificate" }, { name: "VechicleRC" }, { name: "DriverAadhar" }, { name: "DriverLicence" }]);

module.exports = function (app) {

    function fileRenameandUploadinDB(db, iAmbulanceID, data, username, time) {

        return new Promise((resolve, reject) => {

            console.log(iAmbulanceID);

            console.log("-----------");

            console.log(data);

            console.log(data.mimetype);

            var mimetype = data.mimetype;

            var doctype = mimetype.split('/')[1];

            console.log(doctype);

            var oldFileName = path.join(AMBULANCEDIR, data.filename);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = iAmbulanceID + "_" + data.fieldname + "." + doctype;

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(AMBULANCEDIR, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            console.log('File Renamed in Folder...');

            var IDproofFileurl = `viewambulanceproofUpload/${iAmbulanceID}/?docname=`;

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

                let ambulancedocInsert = 'INSERT INTO tblAmbDocMaster SET ?';

                var ambulancedocPost = {
                    iAmbulanceID: iAmbulanceID,
                    iDocTypeid: id,
                    sDocName: newGeneratedFileName,
                    sDocPath: IDproofFileurl,
                    isActive: 1,
                    Created: time,
                    dCreated: username
                };

                db.query(ambulancedocInsert, ambulancedocPost, (err, result2) => {

                    if (err) return console.log(err);

                    console.log(result2);

                    return resolve();

                });

            });

        });
    }

    function InserttblAmbChecklistList(db, AmbulanceChecklist, iAmbulanceID, get_time, get_user_name) {

        return new Promise((resolve, reject) => {

            let InserttblAmbChecklistList = 'INSERT INTO tblAmbChecklist SET ?';

            let PosttblAmbChecklistList = {
                iAmbulanceID: iAmbulanceID,
                sType: AmbulanceChecklist.sType,
                sValue: AmbulanceChecklist.sValue,
                Created: get_time,
                Created_by: get_user_name,
                isActive: 1,
            };

            db.query(InserttblAmbChecklistList, PosttblAmbChecklistList, (err, result) => {

                if (err) return console.log(err);

                console.log(result);

                return resolve();

            });

        });
    }

    app.post('/addAmbulanceDetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        // var iAgency = "3";
        // var iAmbulancetype = "2";
        // var sManufactureName = "Raj";
        // var sManufactureContactNo = "9874563590";
        // var sManufactureEmail = "Ram@gmail.com";
        // var sManufactureAddress = "Sharath nagar,gandhi road,chennai";
        // var sManufactureCompanyName = "Sandy Agency";
        // var sVehicleType = "163"
        // var sVehicleRegistrationNum = "TN 09 AB 9090";
        // var dPermitExpiryDate = "2022-05-31";
        // var Userid = 1;

        // var AmbulanceChecklist = [
        //     {
        //         sType: "Fire Extanguisher",
        //         sValue: "Yes"
        //     },
        //     {
        //         sType: "No of Seats",
        //         sValue: "20"
        //     },
        //     {
        //         sType: "Strecher Type(Main/Pickup)",
        //         sValue: "Yes"
        //     },
        //     {
        //         sType: "Air Conditioning",
        //         sValue: "Yes"
        //     },
        //     {
        //         sType: "Medical Divices For First Aid and Nursing Care",
        //         sValue: "Yes"
        //     },
        //     {
        //         sType: "Basic Life Support",
        //         sValue: "Yes"
        //     },
        //     {
        //         sType: "Advance Life Support",
        //         sValue: "Yes"
        //     },
        //     {
        //         sType: "No of Stationary Oxygen Cylinders",
        //         sValue: "2"
        //     },
        //     {
        //         sType: "No of Portable Oxygen Cylinders",
        //         sValue: "2"
        //     },
        //     {
        //         sType: "Power Supply",
        //         sValue: "Yes"
        //     }

        // ];

        var iAgency = req.body.iAgency;
        var iAmbulancetype = req.body.iAmbulancetype;
        var sManufactureName = req.body.sManufactureName;
        var sManufactureContactNo = req.body.sManufactureContactNo;
        var sManufactureEmail = req.body.sManufactureEmail;
        var sManufactureAddress = req.body.sManufactureAddress;
        var sManufactureCompanyName = req.body.sManufactureCompanyName;
        var sVehicleType = req.body.sVehicleType;
        var sVehicleRegistrationNum = req.body.sVehicleRegistrationNum;
        var dPermitExpiryDate = req.body.dPermitExpiryDate;
        var Userid = req.body.Userid;
        var AmbulanceChecklist = JSON.parse(req.body.AmbulanceChecklist);


        console.log("-------------");

        var Proof_Array = [];

        if (req.files.VechiclePermitCertificate !== undefined) {
            console.log("VechiclePermitCertificate available....");
            Proof_Array.push(req.files.VechiclePermitCertificate[0]);
        }
        if (req.files.VechicleRC !== undefined) {
            console.log("VechicleRC available....");
            Proof_Array.push(req.files.VechicleRC[0]);
        }
        if (req.files.DriverAadhar !== undefined) {
            console.log("DriverAadhar available....");
            Proof_Array.push(req.files.DriverAadhar[0]);
        }
        if (req.files.DriverLicence !== undefined) {
            console.log("DriverLicence available....");
            Proof_Array.push(req.files.DriverLicence[0]);
        }

        console.log(Proof_Array);

        var get_time = await require('./config/time.js')(db);
        var get_user_name = await require('./config/findusername')(db, Userid);

        var check_Ambulance_available = 'SELECT * FROM tblAmbulancedtls where sManufactureContactNo=? and isActive=1';

        db.query(check_Ambulance_available, [sManufactureContactNo], (err, result) => {

            if (err) {
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            if (result.length == 0) {

                var insert_tblAmbulanceMaster = "INSERT INTO tblAmbulancedtls SET ?";

                var post_tblAmbulanceMaster = {
                    iAgency: iAgency,
                    iAmbulancetype: iAmbulancetype,
                    sManufactureName: sManufactureName,
                    sManufactureContactNo: sManufactureContactNo,
                    sManufactureEmail: sManufactureEmail,
                    sManufactureAddress: sManufactureAddress,
                    sManufactureCompanyName: sManufactureCompanyName,
                    sVehicleType: sVehicleType,
                    sVehicleRegistrationNum: sVehicleRegistrationNum,
                    dPermitExpiryDate: dPermitExpiryDate,
                    sCreatedBy: get_user_name,
                    dCreated: get_time,
                    isActive: 1
                };

                db.query(insert_tblAmbulanceMaster, post_tblAmbulanceMaster, async (err, result1) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result1);

                    var iAmbulanceID = result1.insertId;

                    console.log("Proof Array.....");

                    console.log(Proof_Array);

                    for (var i = 0; i < Proof_Array.length; i++) {
                        await fileRenameandUploadinDB(db, iAmbulanceID, Proof_Array[i], get_user_name, get_time);
                    }

                    for (var i = 0; i < AmbulanceChecklist.length; i++) {
                        await InserttblAmbChecklistList(db, AmbulanceChecklist[i], iAmbulanceID, get_time, get_user_name);
                    }


                    var check_user_available = 'select * from tblUserMaster where sMobileNum=? and sActive=1';

                    db.query(check_user_available, [sManufactureContactNo], async (err, result2) => {

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
                                sName: sManufactureName,
                                sMobileNum: sManufactureContactNo,
                                sEmailID: sManufactureEmail,
                                sAddress: sManufactureAddress,
                                sProfilePic:sProfilePic,
                                sProfileUrl:sProfileUrl,                
                                sCreatedBy: get_user_name,
                                dCreated: get_time,
                                sActive: 1
                            };

                            db.query(InserttblUserMaster, PosttblUserMaster, (err, result3) => {

                                if (err) return console.log(err);

                                console.log(result3);

                                return res.send({
                                    status: 1,
                                    message: 'Ambulance Onboarded Successfully'
                                });

                            });

                        }
                        else {

                            return res.send({
                                status: 1,
                                message: 'Ambulance Onboarded Successfully'
                            });

                        }

                    });



                });

            }
            else {

                return res.send({
                    status: 0,
                    message: 'Ambulance Already Onboarded'
                });

            }


        });


    });

    function deleteExistingFile(docName, db, id, username, get_time) {

        return new Promise((resolve, reject) => {

            var oldFileName = path.join(AMBULANCEDIR, docName);

            console.log(fs.existsSync(oldFileName));

            if (fs.existsSync(oldFileName)) {

                fs.unlink(oldFileName, (err) => {

                    if (err) return reject(err);

                    console.log(docName + "file deleted in folder...");

                    let delete_file = 'update tblAmbDocMaster set isActive=0,Modified=?,Modified_by=? where iAmbulanceID=?';

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

    function deleteAmbChecklist(db, id, get_time, get_user_name) {

        return new Promise((resolve, reject) => {

            var deleteAmbChecklist = 'update tblAmbChecklist set Modified=?,Modified_by=?,isActive=0 where iAmbulanceID=?';

            db.query(deleteAmbChecklist, [get_time, get_user_name, id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                console.log("Deleted AmbChecklist Details......");

                return resolve();

            });

        });

    }

    app.post('/updateAmbulanceDetails', upload, async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        console.log(req.files);

        var id = 24;
        var iAgency = "3";
        var iAmbulancetype = "3";
        var sManufactureName = "Raj";
        var sManufactureContactNo = "9639687571";
        var sManufactureEmail = "Ram@gmail.com";
        var sManufactureAddress = "Sharath nagar,gandhi road,chennai";
        var sManufactureCompanyName = "Ram Agency";
        var sVehicleType = "163"
        var sVehicleRegistrationNum = "TN 09 AB 9090";
        var dPermitExpiryDate = "2022-05-31";
        var Userid = 1;

        var AmbulanceChecklist = [
            {
                sType: "Fire Extanguisher",
                sValue: "Yes"
            },
            {
                sType: "No of Seats",
                sValue: "20"
            },
            {
                sType: "Strecher Type(Main/Pickup)",
                sValue: "Yes"
            },
            {
                sType: "Air Conditioning",
                sValue: "Yes"
            },
            {
                sType: "Medical Divices For First Aid and Nursing Care",
                sValue: "Yes"
            },
            {
                sType: "Basic Life Support",
                sValue: "Yes"
            },
            {
                sType: "Advance Life Support",
                sValue: "Yes"
            },
            {
                sType: "No of Stationary Oxygen Cylinders",
                sValue: "2"
            },
            {
                sType: "No of Portable Oxygen Cylinders",
                sValue: "2"
            }

        ];

        // var id = req.body.id;
        // var iAgency = req.body.iAgency;
        // var iAmbulancetype = req.body.iAmbulancetype;
        // var sManufactureName = req.body.sManufactureName;
        // var sManufactureContactNo = req.body.sManufactureContactNo;
        // var sManufactureEmail = req.body.sManufactureEmail;
        // var sManufactureAddress = req.body.sManufactureAddress;
        // var sManufactureCompanyName = req.body.sManufactureCompanyName;
        // var sVehicleType = req.body.sVehicleType;
        // var sVehicleRegistrationNum = req.body.sVehicleRegistrationNum;
        // var dPermitExpiryDate = req.body.dPermitExpiryDate;
        // var Userid = req.body.Userid;
        // var AmbulanceChecklist = JSON.parse(req.body.AmbulanceChecklist);


        var get_time = await require('./config/time.js')(db);
        var username = await require('./config/findusername')(db, Userid);

        var updateAmbulanceAgencyServicesdetails = 'update tblAmbulancedtls set iAgency=?,iAmbulancetype=?,sManufactureName=?,\
        sManufactureContactNo=?,sManufactureEmail=?,\
        sManufactureAddress=?,sManufactureCompanyName=?,sVehicleType=?,sVehicleRegistrationNum=?,dPermitExpiryDate=?,sModifiedBy=?,dModified=? where id=?';

        var getdoc_names = '';

        db.query(updateAmbulanceAgencyServicesdetails, [iAgency, iAmbulancetype, sManufactureName, sManufactureContactNo, sManufactureEmail,
            sManufactureAddress, sManufactureCompanyName,
            sVehicleType, sVehicleRegistrationNum, dPermitExpiryDate, username, get_time, id], async (err, result) => {

                if (err) {

                    console.log(err.sqlMessage);

                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result);

                console.log("-------------");

                if (req.files.VechiclePermitCertificate != undefined) {

                    console.log("VechiclePermitCertificate Received...");

                    getdoc_names = 'select sDocName from tblAmbDocMaster where iAmbulanceID=? and  iDocTypeid=165 and isActive=1';

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


                        await fileRenameandUploadinDB(db, id, req.files.VechiclePermitCertificate[0], username, get_time);

                        console.log("VechiclePermitCertificate Completed...");

                    });

                }

                if (req.files.VechicleRC != undefined) {

                    console.log("VechicleRC Received...");

                    getdoc_names = 'select sDocName from tblAmbDocMaster where iAmbulanceID=? and  iDocTypeid=166 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.VechicleRC[0], username, get_time);

                        console.log("VechicleRC Completed...");

                    });

                }
                if (req.files.DriverAadhar != undefined) {

                    console.log("DriverAadhar Received...");

                    getdoc_names = 'select sDocName from tblAmbDocMaster where iAmbulanceID=? and  iDocTypeid=167 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.DriverAadhar[0], username, get_time);

                        console.log("DriverAadhar Completed...");

                    });

                }

                if (req.files.DriverLicence != undefined) {

                    console.log("DriverLicence Received...");

                    getdoc_names = 'select sDocName from tblAmbDocMaster where iAmbulanceID=? and  iDocTypeid=168 and isActive=1';

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
                        await fileRenameandUploadinDB(db, id, req.files.DriverLicence[0], username, get_time);

                        console.log("DriverLicence Completed...");

                    });

                }

                await deleteAmbChecklist(db, id, get_time, username);

                for (var i = 0; i < AmbulanceChecklist.length; i++) {
                    await InserttblAmbChecklistList(db, AmbulanceChecklist[i], id, get_time, username);
                }

                return res.send({
                    status: 1,
                    message: "Ambulance Details Updated Successfully"
                });

            });
    });

    app.get('/getAmbulanceDetails', async (req, res) => {

        var db = require("./config/config.js").db;

        var getAmbulanceDetails = 'select t1.id, t1.iAgency,t1.iAmbulancetype as "Ambulancetypeid", t1.sManufactureName, t1.sManufactureContactNo, t1.sManufactureEmail, \
        t1.sManufactureAddress, t1.sManufactureCompanyName,\
        t1.sVehicleType, t1.sVehicleRegistrationNum,t1.dPermitExpiryDate,t1.sCreatedBy,t2.sAmbulancetype as "Ambulancetype",t3.sAgencyName as "AmbAgencyName"\
        from tblAmbulancedtls t1  \
        join tblAmbulanceMaster t2 on t2.id=t1.iAmbulancetype and t2.isActive=1\
        join tblAmbAgencyMaster t3 on t3.id=t1.iAgency and t3.isActive=1\
        where t1.isActive=1';

        db.query(getAmbulanceDetails, (err, result) => {

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

    app.get('/getAmbulanceDetails/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var get_Ambulancedetails = 'select id, iAgency,iAmbulancetype, sManufactureName, sManufactureContactNo, sManufactureEmail, sManufactureAddress, sManufactureCompanyName,\
        sVehicleType, sVehicleRegistrationNum,dPermitExpiryDate,sCreatedBy from tblAmbulancedtls where id=? and isActive=1';

        db.query(get_Ambulancedetails, [id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }
            console.log(result);

            var get_Ambulancedetails_proofs = 'SELECT t1.id,CONCAT(?,t1.sDocPath,t1.sDocName) as "FileURL",t2.sValue as "documentProof"\
            FROM tblAmbDocMaster t1\
            join tblAppConfig t2 on t2.id=t1.iDocTypeid and t2.isActive=1\
            where t1.iAmbulanceID=? and t1.isActive=1';

            db.query(get_Ambulancedetails_proofs, [ip, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                var get_Ambulancedetails_checklist = 'select sType, sValue from \
                tblAmbChecklist where iAmbulanceID=? and isActive=1';

                db.query(get_Ambulancedetails_checklist, [id], (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result3);

                    result[0].imageurl = result2;
                    result[0].checklist = result3;

                    return res.send(result);

                });
            });
        });

    });

    app.get('/getAgencyDetails', async (req, res) => {

        var db = require("./config/config.js").db;

        let getAgencyDetails = 'select id, sAgencyName from tblAmbAgencyMaster where isActive=1';

        db.query(getAgencyDetails, (err, result) => {

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

    app.get('/viewambulanceproofUpload/:id', function (req, res) {

        console.log("viewambulanceproofUpload API...");
        const AMBULANCEDIR = './uploads/AmbulanceProofs/';

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

            fs.readFile(AMBULANCEDIR + pic, function (err, content) {
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

    app.get('/getVehicleTypeDetails', async (req, res) => {

        var db = require("./config/config.js").db;

        let getVehicleTypeDetails = 'select id, sName,sValue from tblAppConfig where sName="AmbulancevehicleType" and isActive=1';

        db.query(getVehicleTypeDetails, (err, result) => {

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

    app.get('/getAmbChecklistMasterDetails', async (req, res) => {

        var db = require("./config/config.js").db;

        let getAmbChecklistMasterDetails = 'select id, sType from tblAmbChecklistMaster where isActive=1';

        db.query(getAmbChecklistMasterDetails, (err, result) => {

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

    app.post('/deleteAmbulancedetails', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;
        var userid = req.body.userid;

        var username = await require('./config/findusername.js')(db, userid);
        var get_time = await require('./config/time.js')(db);

        var delete_Ambulance = "update tblAmbulancedtls set isActive=0,sModifiedBy=?,dModified=? where id=?";

        var delete_Ambulance_images = 'update tblAmbDocMaster set isActive=0,Modified=?,Modified_by=? where iAmbulanceID=?';

        var delete_Ambulance_checklist = 'update tblAmbChecklist set isActive=0,Modified=?,Modified_by=? where iAmbulanceID=?';

        db.query(delete_Ambulance, [username, get_time, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(delete_Ambulance_images, [get_time, username, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                db.query(delete_Ambulance_checklist, [get_time, username, id], (err, result3) => {

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
                    message: 'Ambulance records Deleted'
                });

            });
        });

        });

    });

    app.get('/getAmbulanceTypeDetails/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        let getAgencyDetails = 'select id,sAmbulanceType from tblAmbulanceMaster where iAmbulanceAgencyID=? and isActive=1';

        db.query(getAgencyDetails, [id], (err, result) => {

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
