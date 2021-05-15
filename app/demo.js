app.post('/addlabdetails', upload, async (req, res) => {

    var db = require("./config/config.js").db;

    console.log(req.body);

    console.log(req.files);

    // var sLabName = "F_lab";
    // var sName = "Lucy";
    // var sContactNo = "9052289810";
    // var sContactNoSecondary = "9052283409";
    // var sEmail = "info@flab.com";
    // var sWebsiteURL = "www.flab.com ";
    // var sRegisterNo = "Medi15963";
    // var sPanNo = "CQAP25896";
    // var sGSTNo = "UGUYGDGUH772";
    // var sArea = "Chennai";
    // var sPincode = "600100";
    // var sCity = 3659;
    // var sState = 35;
    // var sCountry = 101;
    // var sServiceatHome = "Yes";
    // var sPremiumCost = "5000";
    // var sCovidTestAvailable = "Yes";
    // var iServiceid = [1, 2, 3, 5];
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
    var sPremiumCost = req.body.sPremiumCost;
    var sCovidTestAvailable = req.body.sCovidTestAvailable;
    var iServiceid = req.body.iServiceid;
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
                sPremiumCost: sPremiumCost,
                sCovidTestAvailable: sCovidTestAvailable,
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

                        let PostUserMaster = {
                            sName: sName,
                            sMobileNum: sContactNo,
                            sEmailID: sEmail,
                            sLandMark: sArea,
                            spincode: sPincode,
                            sCreatedBy: get_user_name,
                            dCreated: get_time,
                            sActive: 1
                        };

                        db.query(InsertUserMaster, PostUserMaster, (err, result3) => {

                            if (err) return console.log(err);

                            console.log(result3);

                            console.log(result.insertId);

                            var id = result3.insertId;

                            let Insertuserlogin = 'INSERT INTO tblUserlogin SET ?';

                            let Postuserlogin = {
                                iUserID: id,
                                iRole: 74,
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
