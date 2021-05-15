var multer = require("multer");
var path = require('path');
var fs = require('fs');
const url = require('url');
var csc = require('country-state-city');
var request = require("request");
var ip = require("./config/ipaddressconfig.js").ipaddress;

const DOCTORDIR = './uploads/doctorproofs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCTORDIR);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage
}).fields([{ name: "AadharProof" }, { name: "Addressproof" }, { name: "RegistrationNoProof" }]);



module.exports = function (app) {

  app.get('/viewDoctorImages', function (req, res) {

    console.log("viewDoctorImages API...");

    const imageDir = './uploads/doctorImages/';

    var id = req.params.id;
    console.log(id);

    var query = url.parse(req.url, true).query;
    pic = query.docname;

    console.log("url");
    console.log(req.url);

    console.log("pic");
    console.log(pic);

    if (typeof pic === 'undefined') {
      console.log("undefined in...");

    } else {
      console.log("Not undefined");
      //read the image using fs and send the image content back in the response
      fs.readFile(imageDir + pic, function (err, content) {
        if (err) {
          res.writeHead(400, { 'Content-type': 'text/html' })
          console.log(err);
          res.end("No such File");
        } else {
          //specify the content type in the response will be an image
          res.writeHead(200, { 'Content-type': 'image/jpg' });
          res.end(content);
        }
      });
    }
  });

  app.get('/showDoctorsInfo', async (req, res) => {

    var db = require('./config/config.js').db;

    var ip = await require('./config/ipaddressconfig.js')(db);

    console.log(ip);

    var show_Doctor_Info = 'select t2.id as "doctorid",t3.sName as "name",t3.sAddress as "address", \
    concat(?,t2.sProfileUrl,t2.sProfilePic) as "imgurl", \
    t3.sYearofExperience as "experience",t3.sConsultationfee as "fees", \
    t5.count as "Comments","25%" as "like","2.20 PM" as "videotime", "5.20 PM" as "calltime", \
    t3.sExptype,t6.sHospitalAddress,t7.sSpeciality as "speciality" \
    from tblDoctorMaster t3 \
    join tblUserMaster t2 on t2.sMobileNum=t3.sMobileNumber and t2.sActive=1 \
    left join (select iDoctorID,count(*) as count from tblAppointmentfeedback where isActive=1 group by iDoctorID) t5 on t5.iDoctorID=t3.id \
    left join (select t2.iDoctorid,t2.sHospitalAddress from \
    (select MAX(id) as "id",iDoctorid from tblDoctorHospitalList where isActive=1 group by iDoctorid) t1 \
    join tblDoctorHospitalList t2 on t2.id=t1.id ) t6 on t6.iDoctorid=t3.id \
	  left join  (select t1.iDoctorid,t2.sSpeciality from ( \
    select iDoctorid,MAX(iSpecialityid) as "specialityid" from tblDoctorspeciality where isActive=1 group by iDoctorid) t1 \
    join tblDoctormasterSpecialities t2 on t2.id=t1.specialityid and t2.isActive=1) t7 on t7.iDoctorid=t3.id \
    where t3.sActive=1';

    db.query(show_Doctor_Info, [ip], (err, result) => {

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

  app.get('/getCountriesDetails', (req, res) => {

    console.log("All countries:");

    console.log(csc.default.getAllCountries());

    return res.send(csc.default.getAllCountries());

  });

  app.get('/getStateDetails/:id', (req, res) => {

    console.log("All States from particular Country:");

    var countryID = req.params.id;

    console.log(countryID);

    console.log(csc.default.getStatesOfCountry(countryID));

    return res.send(csc.default.getStatesOfCountry(countryID));

  });

  app.get('/getCityDetails/:id', (req, res) => {

    console.log("All Cities from particular States:");

    var stateID = req.params.id;

    console.log(stateID);

    console.log(csc.default.getCitiesOfState(stateID));

    return res.send(csc.default.getCitiesOfState(stateID));

  });

  app.get('/getPinCodesDetails/:Country/:State/:City', (req, res) => {

    var Country = req.params.Country;
    var State = req.params.State;
    var City = req.params.City;

    console.log(Country + " - " + State + " - " + City);

    var pincodes = [];

    var url = 'https://api.postalpincode.in/postoffice/' + City;

    request(url, { json: true }, (err, resp, body) => {
      if (err) {
        return console.log(err);
      }

      var arr = body[0].PostOffice;

      console.log(arr);

      if (arr != null) {

        console.log("Length:" + arr.length);

        for (var i = 0; i < arr.length; i++) {

          if (arr[i].Country == Country && arr[i].State == State) {

            console.log(arr[i].Pincode);

            pincodes.push(arr[i].Pincode);
          }

        }
      }

      console.log(pincodes);

      console.log([... new Set(pincodes)]);

      return res.send([... new Set(pincodes)]);

    });
  });

  app.get('/selectdoctorspeciality', async (req, res) => {

    var db = require("./config/config.js").db;

    let sql = 'select id,sSpeciality from tblDoctormasterSpecialities where isActive=1';

    db.query(sql, (err, result) => {

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

  function fileRenameandUploadinDB(db, iDoctorid, data, username, time) {

    return new Promise((resolve, reject) => {

      console.log(iDoctorid);

      console.log("-----------");

      console.log(data);

      console.log(data.mimetype);

      var mimetype = data.mimetype;

      var doctype = mimetype.split('/')[1];

      console.log(doctype);

      var oldFileName = path.join(DOCTORDIR, data.filename);
      console.log("OldfileName: " + oldFileName);

      var newGeneratedFileName = iDoctorid + "_" + data.fieldname + "." + doctype;

      console.log("GeneratedFilename:" + newGeneratedFileName);
      var newFileName = path.join(DOCTORDIR, newGeneratedFileName);

      console.log("NewFileName:" + newFileName);

      fs.renameSync(oldFileName, newFileName);
      console.log('File Renamed in Folder...');

      var IDproofFileurl = `viewdoctorproofUpload/${iDoctorid}/?docname=`;

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

        let doctordocInsert = 'INSERT INTO tblDoctordocmaster SET ?';

        var doctordocPost = {
          iDoctorid: iDoctorid,
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

  function InsertDoctorSpecalities(db, iDoctorid, specialityid, get_user_name, get_time) {

    return new Promise((resolve, reject) => {

      var insert_Doctorspeciality = "INSERT INTO tblDoctorspeciality SET ?";

      var post_Doctorspeciality = {
        iDoctorid: iDoctorid,
        iSpecialityid: specialityid,
        Created: get_time,
        Created_by: get_user_name,
        isActive: 1
      };

      db.query(insert_Doctorspeciality, post_Doctorspeciality, (err, result) => {

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

  function InserttblDoctorHospitalList(db, hospitalinfo, iDoctorid, get_time, get_user_name) {

    return new Promise((resolve, reject) => {

      let InserttblDoctorHospitalList = 'INSERT INTO tblDoctorHospitalList SET ?';

      let PosttblDoctorHospitalList = {
        iDoctorid: iDoctorid,
        sHospital: hospitalinfo.sHospital,
        sHospitalAddress: hospitalinfo.sHospitalAddress,
        sLat: hospitalinfo.sLat,
        sLong: hospitalinfo.sLong,
        Created: get_time,
        Created_by: get_user_name,
        isActive: 1,
      };

      db.query(InserttblDoctorHospitalList, PosttblDoctorHospitalList, (err, result) => {

        if (err) return console.log(err);

        console.log(result);

        return resolve();

      });

    });
  }

  app.post('/adddoctordetails', upload, async (req, res) => {

    var db = require("./config/config.js").db;

    console.log(req.body);

    console.log(req.files);

    // var sName = "B Rohan";
    // var sEmailID = "BRohan@gmail.com";
    // var sMobileNumber = "9655242952";
    // var sAltMobileNumber = "9655242913";
    // var sGender = "M";
    // var sAddress = "No.15 ";
    // var sAddress2 = "244 T nagar"
    // var sArea = "Annanagar ";
    // var sPincode = "632007";
    // var sCity = "3659";
    // var sState = "35";
    // var sCountry = "101";
    // var sLandmark = "Anna Nagar";
    // var sDegree = "MBBS";
    // var sRegistrationNumber = "CD7890878";
    // var sRegistrationCouncil = "TamilNadu Medical Council";
    // var sPostGraduationDegree = "PG";
    // var sSpecialityDegree = "HEART SURGEON";
    // var sSpecialityExperience = "5";
    // var sYearofExperience = "8";
    // var sBeneficiaryName = "Rahul varma";
    // var sBankName = "47";
    // var sBranchName = "T Nagar";
    // var sBankAccountNo = "132546891";
    // var sAccountType = "160";
    // var sIFSCode = "HDFC0000128";
    // var sESIDetails = "ESI546891";
    // var sConsultationfee = "500";
    // var sMedi360ComissionConsultingFees = "100";
    // var sNetConsultingFees = "150";
    // var sDirectConsultingFees = "100";
    // var sMedi360DirectConsultingFee = "100";
    // var Userid = 1;
    // var sAboutDoctor = "Good given Better treatment";
    // var specialityid = [1, 5, 7];

    // var hospitalinfo = [
    //   {
    //     sHospital: "Apollo Hospital",
    //     sHospitalAddress: "No.20 Anna Nagar",
    //     sLat: "12.0989101",
    //     sLong: "81.1010101"
    //   },
    //   {
    //     sHospital: "CMC Hospital",
    //     sHospitalAddress: "No.20 Anna Nagar",
    //     sLat: "12.0989101",
    //     sLong: "81.1010101"
    //   }
    // ];

    var sName = req.body.sName;
    var sEmailID = req.body.sEmailID;
    var sMobileNumber = req.body.sMobileNumber;
    var sAltMobileNumber = req.body.sAltMobileNumber;
    var sGender = req.body.sGender;
    var sAddress = req.body.sAddress;
    var sAddress2 = req.body.sAddress2;
    var sArea = req.body.sArea;
    var sPincode = req.body.sPincode;
    var sCity = req.body.sCity;
    var sState = req.body.sState;
    var sCountry = req.body.sCountry;
    var sHospital = req.body.sHospital;
    var sHospitalAddress = req.body.sHospitalAddress;
    var sLat = req.body.sLat;
    var sLong = req.body.sLong;
    var sLandmark = req.body.sLandmark;
    var sDegree = req.body.sDegree;
    var sRegistrationNumber = req.body.sRegistrationNumber;
    var sRegistrationCouncil = req.body.sRegistrationCouncil;
    var sPostGraduationDegree = req.body.sPostGraduationDegree;
    var sSpecialityDegree = req.body.sSpecialityDegree;
    var sSpecialityExperience = req.body.sSpecialityExperience;
    var sYearofExperience = req.body.sYearofExperience;
    var sBeneficiaryName = req.body.sBeneficiaryName;
    var sBankName = req.body.sBankName;
    var sBranchName = req.body.sBranchName;
    var sBankAccountNo = req.body.sBankAccountNo;
    var sAccountType = req.body.sAccountType;
    var sIFSCode = req.body.sIFSCode;
    var sESIDetails = req.body.sESIDetails;
    var sConsultationfee = req.body.sConsultationfee;
    var sMedi360ComissionConsultingFees = req.body.sMedi360ComissionConsultingFees;
    var sNetConsultingFees = req.body.sNetConsultingFees;
    var sDirectConsultingFees = req.body.sDirectConsultingFees;
    var sMedi360DirectConsultingFee = req.body.sMedi360DirectConsultingFee;
    var Userid = req.body.Userid;
    var sAboutDoctor = req.body.sAboutDoctor;
    var specialityid = req.body.specialityid;
    var hospitalinfo = JSON.parse(req.body.hospitalinfo);

    console.log("-------------");

    var Proof_Array = [];

    if (req.files.AadharProof !== undefined) {
      console.log("AadharProof available....");
      Proof_Array.push(req.files.AadharProof[0]);
    }
    if (req.files.Addressproof !== undefined) {
      console.log("Addressproof available....");
      Proof_Array.push(req.files.Addressproof[0]);
    }
    if (req.files.RegistrationNoProof !== undefined) {
      console.log("RegistrationNo.Proof available....");
      Proof_Array.push(req.files.RegistrationNoProof[0]);
    }

    console.log(Proof_Array);

    var get_time = await require('./config/time.js')(db);
    var get_user_name = await require('./config/findusername')(db, Userid);

    var check_doctor_available = 'SELECT * FROM tblDoctorMaster where sMobileNumber=? and sActive=1';

    db.query(check_doctor_available, [sMobileNumber], (err, result5) => {

      if (err) {
        return res.send({
          status: 0,
          message: err.sqlMessage
        });
      }

      console.log(result5);

      if (result5.length == 0) {

        var insert_tblDoctorMaster = "INSERT INTO tblDoctorMaster SET ?";

        var post_tblDoctorMaster = {
          sName: sName,
          sEmailID: sEmailID,
          sMobileNumber: sMobileNumber,
          sAltMobileNumber: sAltMobileNumber,
          sGender: sGender,
          sAddress: sAddress,
          sAddress2: sAddress2,
          sArea: sArea,
          sPincode: sPincode,
          sCity: sCity,
          sState: sState,
          sCountry: sCountry,
          sLandmark: sLandmark,
          sDegree: sDegree,
          sRegistrationNumber: sRegistrationNumber,
          sRegistrationCouncil: sRegistrationCouncil,
          sPostGraduationDegree: sPostGraduationDegree,
          sSpecialityDegree: sSpecialityDegree,
          sSpecialityExperience: sSpecialityExperience,
          sYearofExperience: sYearofExperience,
          sBeneficiaryName: sBeneficiaryName,
          sBankName: sBankName,
          sBranchName: sBranchName,
          sBankAccountNo: sBankAccountNo,
          sAccountType: sAccountType,
          sIFSCode: sIFSCode,
          sESIDetails: sESIDetails,
          sConsultationfee: sConsultationfee,
          sMedi360ComissionConsultingFees: sMedi360ComissionConsultingFees,
          sNetConsultingFees: sNetConsultingFees,
          sDirectConsultingFees: sDirectConsultingFees,
          sMedi360DirectConsultingFee: sMedi360DirectConsultingFee,
          sAboutDoctor: sAboutDoctor,
          sCreatedBy: get_user_name,
          dCreated: get_time,
          sActive: 1
        };

        db.query(insert_tblDoctorMaster, post_tblDoctorMaster, async (err, result) => {

          if (err) {
            console.log(err.sqlMessage);
            return res.send({
              status: 0,
              message: err.sqlMessage
            });
          }

          console.log(result);

          var iDoctorid = result.insertId;

          console.log("Proof Array.....");

          console.log(Proof_Array);

          for (var i = 0; i < Proof_Array.length; i++) {
            await fileRenameandUploadinDB(db, iDoctorid, Proof_Array[i], get_user_name, get_time);
          }

          for (var j = 0; j < specialityid.length; j++) {
            await InsertDoctorSpecalities(db, iDoctorid, specialityid[j], get_user_name, get_time);
          }

          for (var i = 0; i < hospitalinfo.length; i++) {
            await InserttblDoctorHospitalList(db, hospitalinfo[i], iDoctorid, get_time, get_user_name);
          }

          var check_user_available = 'select * from tblUserMaster where sMobileNum=? and sActive=1';

          db.query(check_user_available, [sMobileNumber], async (err, result6) => {

            if (err) {
              return res.send({
                status: 0,
                message: err.sqlMessage
              });
            }

            console.log(result6);

            if (result6.length == 0) {

              let InserttblUserMaster = 'INSERT INTO tblUserMaster SET ?';

              console.log(req.file);

              var sProfilePic = '';
              var sProfileUrl = '';

              if (req.file) {
                console.log("Image Available");
                var result = await fileRenameandUploadinDB(req.file.originalname, id, latest_id);
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
                sName: sName,
                sMobileNum: sMobileNumber,
                sEmailID: sEmailID,
                sAddress: sAddress,
                sLandMark: sArea,
                spincode: sPincode,
                sgender: sGender,
                sProfilePic: sProfilePic,
                sProfileUrl: sProfileUrl,
                sCreatedBy: get_user_name,
                dCreated: get_time,
                sActive: 1
              };

              db.query(InserttblUserMaster, PosttblUserMaster, (err, result7) => {

                if (err) return console.log(err);

                console.log(result7);

                var id = result7.insertId;

                let Insertuserlogin = 'INSERT INTO tblUserlogin SET ?';

                let Postuserlogin = {
                  iUserID: id,
                  iRole: 1,
                  sCreatedBy: get_user_name,
                  dCreated: get_time,
                  isActive: 1,
                };

                db.query(Insertuserlogin, Postuserlogin, async (err, result8) => {

                  if (err) return console.log(err);

                  console.log(result8);

                  var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=2 and  isActive=1';

                  db.query(list_menus_for_roles, async (err, result9) => {

                    if (err) {
                      console.log(err.sqlMessage);
                      return res.send({
                        status: 0,
                        message: err.sqlMessage
                      });
                    }

                    console.log(result9);

                    for (var i = 0; i < result9.length; i++) {

                      await InsertUserRoleMapping(id, result9[i].iRoleid, result9[i].iMenuid, get_user_name, get_time, db);

                    }

                    return res.send({
                      status: 1,
                      message: 'Doctor Onboarded Successfully'
                    });

                  });

                });

              });

            }
            else {

              var id = result6[0].id;

              var list_menus_for_roles = 'select iRoleid,iMenuid from tblRoleMenuMapping where iRoleid=2 and  isActive=1';

              db.query(list_menus_for_roles, async (err, result9) => {

                if (err) {
                  console.log(err.sqlMessage);
                  return res.send({
                    status: 0,
                    message: err.sqlMessage
                  });
                }

                console.log(result9);

                for (var i = 0; i < result9.length; i++) {

                  await InsertUserRoleMapping(id, result9[i].iRoleid, result9[i].iMenuid, get_user_name, get_time, db);

                }

                return res.send({
                  status: 1,
                  message: 'Doctor Onboarded Successfully'
                });

              });

            }

          });

        });

      }
      else {

        return res.send({
          status: 0,
          message: 'Doctor Already Onboarded'
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

  app.get('/getdoctordetails', (req, res) => {

    var db = require("./config/config.js").db;

    let sql = 'select id, sName, sEmailID, sMobileNumber, sAltMobileNumber, sGender, sAddress, sAddress2,\
    sArea, sPincode, sCity,sState, sCountry,sLandmark,sDegree, sRegistrationNumber,\
    sRegistrationCouncil, sPostGraduationDegree, sSpecialityDegree, sSpecialityExperience,\
    sYearofExperience,sBeneficiaryName, sBankName,sBranchName, sBankAccountNo,sAccountType, sIFSCode,sESIDetails, sConsultationfee,\
    sMedi360ComissionConsultingFees, sNetConsultingFees, sDirectConsultingFees, sMedi360DirectConsultingFee,sAboutDoctor,sCreatedBy \
    from tblDoctorMaster where sActive=1';

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

  app.get('/getdoctordetails/:id', async (req, res) => {

    var db = require("./config/config.js").db;

    var id = req.params.id;

    var ip = await require('./config/ipaddressconfig.js')(db);

    console.log(ip);

    var get_doctor = 'select id, sName, sEmailID, sMobileNumber, sAltMobileNumber, sGender, sAddress, sAddress2,\
    sArea, sPincode, sCity,sState, sCountry,sLandmark,sDegree, sRegistrationNumber,\
    sRegistrationCouncil, sPostGraduationDegree, sSpecialityDegree, sSpecialityExperience,\
    sYearofExperience,sBeneficiaryName, sBankName,sBranchName, sBankAccountNo,sAccountType, sIFSCode,sESIDetails, sConsultationfee,\
    sMedi360ComissionConsultingFees, sNetConsultingFees, sDirectConsultingFees, sMedi360DirectConsultingFee,sAboutDoctor,sCreatedBy \
    from tblDoctorMaster where id=? and sActive=1';

    db.query(get_doctor, [id], async (err, result) => {

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

      var doctor_proofs = 'SELECT t1.id,CONCAT(?,t1.sDocPath,t1.sDocName) as "FileURL",t2.sValue as "documentProof" \
      FROM tblDoctordocmaster t1 \
      join tblAppConfig t2 on t2.id=t1.iDocTypeid and t2.isActive=1 \
      where t1.iDoctorid=? and t1.isActive=1';

      db.query(doctor_proofs, [ip, id], (err, result2) => {

        if (err) {
          console.log(err.sqlMessage);
          return res.send({
            status: 0,
            message: err.sqlMessage
          });
        }

        console.log(result2);

        var doctor_specialities = 'SELECT t1.iSpecialityid,t2.sSpeciality FROM tblDoctorspeciality t1 \
        join tblDoctormasterSpecialities t2 on t2.id=t1.iSpecialityid and t2.isActive=1 \
        where t1.iDoctorid=? and  t1.isActive=1';

        db.query(doctor_specialities, [id], (err, result3) => {

          if (err) {
            console.log(err.sqlMessage);
            return res.send({
              status: 0,
              message: err.sqlMessage
            });
          }

          console.log(result3);

          var doctor_HospitalList = 'select id, sHospital, sHospitalAddress, sLat, sLong from \
          tblDoctorHospitalList where iDoctorid=? and isActive=1';

          db.query(doctor_HospitalList, [id], (err, result4) => {

            if (err) {
              console.log(err.sqlMessage);
              return res.send({
                status: 0,
                message: err.sqlMessage
              });
            }

            console.log(result4);

            result[0].Imageurl = result2;
            result[0].Specialityid = result3;
            result[0].Hospitalinfo = result4;

            return res.send(result);

          });

        });

      });

    });

  });

  app.get('/getdoctorProofs/:id', async (req, res) => {

    var db = require("./config/config.js").db;

    var ip = await require('./config/ipaddressconfig.js')(db);

    console.log(ip);

    var id = req.params.id;

    let sql = 'SELECT id,concat(?,sDocPath,sDocName) as "ImageURL" FROM tblDoctordocmaster where\
     iDoctorid=? and isActive=1 group by iDoctorid';

    db.query(sql, [ip, id], (err, result) => {

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

      var oldFileName = path.join(DOCTORDIR, docName);

      console.log(fs.existsSync(oldFileName));

      if (fs.existsSync(oldFileName)) {

        fs.unlink(oldFileName, (err) => {

          if (err) return reject(err);

          console.log(docName + "file deleted in folder...");

          let delete_file = 'update tblDoctordocmaster set isActive=0,Modified_by=?,Modified=? where iDoctorid=?';

          db.query(delete_file, [username, get_time, id], (err, result) => {

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

  function deleteDoctorSpecialities(db, id, get_user_name, get_time) {

    return new Promise((resolve, reject) => {

      var delete_speciality = 'update tblDoctorspeciality set isActive=0,Modified=?,Modified_by=? where iDoctorid=?';

      db.query(delete_speciality, [get_time, get_user_name, id], (err, result) => {

        if (err) {
          console.log(err.sqlMessage);
        }

        console.log(result);

        console.log("Deleted Doctor Specialities......");

        return resolve();

      });

    });

  }

  function deleteDoctorHospital(db, id, get_time, get_user_name) {

    return new Promise((resolve, reject) => {

      var delete_DoctorHospital = 'update tblDoctorHospitalList set Modified=?,Modified_by=?,isActive=0 where iDoctorid=?';

      db.query(delete_DoctorHospital, [get_time, get_user_name, id], (err, result) => {

        if (err) {
          console.log(err.sqlMessage);
        }

        console.log(result);

        console.log("Deleted Doctor Hospital Details......");

        return resolve();

      });

    });

  }

  app.post('/updatedoctordetails', upload, async (req, res) => {

    var db = require("./config/config.js").db;

    console.log(req.body);

    console.log(req.files);

    // var id = 2;
    // var sName = "Varun Mehta";
    // var sEmailID = "VarunMehta@gmail.com";
    // var sMobileNumber = "9655242916";
    // var sAltMobileNumber = "9655242916";
    // var sGender = "M";
    // var sAddress = "No.15 ";
    // var sAddress2 = "244 T nagar"
    // var sArea = "Annanagar ";
    // var sPincode = "632007";
    // var sCity = "3659";
    // var sState = "35";
    // var sCountry = "101";
    // var sLandmark = "Anna Nagar";
    // var sDegree = "MBBS";
    // var sRegistrationNumber = "CD7890878";
    // var sRegistrationCouncil = "TamilNadu Medical Council";
    // var sPostGraduationDegree = "PG";
    // var sSpecialityDegree = "HEART SURGEON";
    // var sSpecialityExperience = "5";
    // var sYearofExperience = "8";
    // var sBeneficiaryName = "Varun Mehta";
    // var sBankName = "47";
    // var sBranchName = "T Nagar";
    // var sBankAccountNo = "132546891";
    // var sAccountType = "162";
    // var sIFSCode = "HDFC0000128";
    // var sESIDetails = "ESI546891";
    // var sConsultationfee = "500";
    // var sMedi360ComissionConsultingFees = "100";
    // var sNetConsultingFees = "150";
    // var sDirectConsultingFees = "100";
    // var sMedi360DirectConsultingFee = "100";
    // var Userid = 1;
    // var sAboutDoctor = "Good given Better treatment";
    // var specialityid = [1, 5];

    // var hospitalinfo = [
    //     {
    //         sHospital: "Apollo Hospital",
    //         sHospitalAddress: "No.20 Anna Nagar",
    //         sLat: "12.0989101",
    //         sLong: "81.1010101"     
    //     },
    //     {
    //         sHospital: "CMC Hospital",
    //         sHospitalAddress: "No.20 Anna Nagar",
    //         sLat: "12.0989101",
    //         sLong: "81.1010101"
    //     }
    // ];


    var id = req.body.id;
    var sName = req.body.sName;
    var sEmailID = req.body.sEmailID;
    var sMobileNumber = req.body.sMobileNumber;
    var sAltMobileNumber = req.body.sAltMobileNumber;
    var sGender = req.body.sGender;
    var sAddress = req.body.sAddress;
    var sAddress2 = req.body.sAddress2;
    var sArea = req.body.sArea;
    var sPincode = req.body.sPincode;
    var sCity = req.body.sCity;
    var sState = req.body.sState;
    var sCountry = req.body.sCountry;
    var sLandmark = req.body.sLandmark;
    var sDegree = req.body.sDegree;
    var sRegistrationNumber = req.body.sRegistrationNumber;
    var sRegistrationCouncil = req.body.sRegistrationCouncil;
    var sPostGraduationDegree = req.body.sPostGraduationDegree;
    var sSpecialityDegree = req.body.sSpecialityDegree;
    var sSpecialityExperience = req.body.sSpecialityExperience;
    var sYearofExperience = req.body.sYearofExperience;
    var sBeneficiaryName = req.body.sBeneficiaryName;
    var sBankName = req.body.sBankName;
    var sBranchName = req.body.sBranchName;
    var sBankAccountNo = req.body.sBankAccountNo;
    var sAccountType = req.body.sAccountType;
    var sIFSCode = req.body.sIFSCode;
    var sESIDetails = req.body.sESIDetails;
    var sConsultationfee = req.body.sConsultationfee;
    var sMedi360ComissionConsultingFees = req.body.sMedi360ComissionConsultingFees;
    var sNetConsultingFees = req.body.sNetConsultingFees;
    var sDirectConsultingFees = req.body.sDirectConsultingFees;
    var sMedi360DirectConsultingFee = req.body.sMedi360DirectConsultingFee;
    var Userid = req.body.Userid;
    var sAboutDoctor = req.body.sAboutDoctor;
    var specialityid = req.body.specialityid;
    var hospitalinfo = JSON.parse(req.body.hospitalinfo);

    var get_time = await require('./config/time.js')(db);
    var username = await require('./config/findusername')(db, Userid);

    var updatedoctordetails = 'update tblDoctorMaster set sName=?,sEmailID=?,sMobileNumber=?,sAltMobileNumber=?,sGender=?,\
    sAddress=?,sAddress2=?,sArea=?,sPincode=?,sCity=?,sState=?,sCountry=?,sLandmark=?,sDegree=?,sRegistrationNumber=?,sRegistrationCouncil=?,\
    sPostGraduationDegree=?,sSpecialityDegree=?,sSpecialityExperience=?,sYearofExperience=?,sBeneficiaryName=?,sBankName=?,sBranchName=?,sBankAccountNo=?,\
    sAccountType=?,sIFSCode=?,sESIDetails=?,sConsultationfee=?,sMedi360ComissionConsultingFees=?,sNetConsultingFees=?,sDirectConsultingFees=?,sMedi360DirectConsultingFee=?,\
    sAboutDoctor=?,sModifiedBy=?,dModified=? where id=?';

    var getdoc_names = '';

    db.query(updatedoctordetails, [sName, sEmailID, sMobileNumber, sAltMobileNumber, sGender, sAddress, sAddress2, sArea, sPincode, sCity, sState, sCountry,
      sLandmark, sDegree, sRegistrationNumber, sRegistrationCouncil, sPostGraduationDegree, sSpecialityDegree, sSpecialityExperience, sYearofExperience,
      sBeneficiaryName, sBankName, sBranchName, sBankAccountNo, sAccountType, sIFSCode, sESIDetails, sConsultationfee, sMedi360ComissionConsultingFees, sNetConsultingFees, sDirectConsultingFees, sMedi360DirectConsultingFee,
      sAboutDoctor, username, get_time, id], async (err, result) => {

        if (err) {

          console.log(err.sqlMessage);

          return res.send({
            status: 0,
            message: err.sqlMessage
          });
        }

        console.log(result);

        console.log("-------------");

        if (req.files.AadharProof != undefined) {

          console.log("AadharProof Received...");

          getdoc_names = 'select sDocName from tblDoctordocmaster where iDoctorid=? and  iDocTypeid=92  and isActive=1';

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


            await fileRenameandUploadinDB(db, id, req.files.AadharProof[0], username, get_time);

            console.log("AadharProof Completed...");

          });

        }

        if (req.files.Addressproof != undefined) {

          console.log("Addressproof Received...");

          getdoc_names = 'select sDocName from tblDoctordocmaster where iDoctorid=? and  iDocTypeid=77 and isActive=1';

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
            await fileRenameandUploadinDB(db, id, req.files.Addressproof[0], username, get_time);

            console.log("Addressproof Completed...");

          });

        }
        if (req.files.RegistrationNoProof != undefined) {

          console.log("RegistrationNoProof Received...");

          getdoc_names = 'select sDocName from tblDoctordocmaster where iDoctorid=? and  iDocTypeid=93 and isActive=1';

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
            await fileRenameandUploadinDB(db, id, req.files.RegistrationNoProof[0], username, get_time);

            console.log("RegistrationNoProof Completed...");

          });

        }

        await deleteDoctorSpecialities(db, id, username, get_time);

        for (var i = 0; i < specialityid.length; i++) {
          await InsertDoctorSpecalities(db, id, specialityid[i], username, get_time);
        }

        await deleteDoctorHospital(db, id, get_time, username);

        for (var i = 0; i < hospitalinfo.length; i++) {
          await InserttblDoctorHospitalList(db, hospitalinfo[i], id, get_time, username);
        }

        return res.send({
          status: 1,
          message: "Doctor Details Updated Successfully"
        });

      });
  });

  app.get('/viewdoctorproofUpload/:id', function (req, res) {

    console.log("viewdoctorproofUpload API...");
    const DOCTORDIR = './uploads/doctorproofs/';

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

      fs.readFile(DOCTORDIR + pic, function (err, content) {
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

  app.post('/deleteDoctor', async (req, res) => {

    var db = require('./config/config.js').db;

    console.log(req.body);

    var id = req.body.id;
    var userid = req.body.userid;

    var username = await require('./config/findusername.js')(db, userid);
    var get_time = await require('./config/time.js')(db);

    var delete_Doctor = "update tblDoctorMaster set sActive=0,sModifiedBy=?,dModified=? where id=?";

    var delete_Doctor_images = 'update tblDoctordocmaster set isActive=0,Modified_by=?,Modified=? where iDoctorid=?';

    var delete_Doctor_speciality = 'update tblDoctorspeciality SET isActive=0,Modified=?,Modified_by=? where iDoctorid=?';

    var delete_Doctor_Hospital_List = 'update tblDoctorHospitalList SET isActive=0,Modified=?,Modified_by=? where iDoctorid=?';

    db.query(delete_Doctor, [username, get_time, id], (err, result) => {

      if (err) {
        console.log(err.sqlMessage);
        return res.send({
          status: 0,
          message: err.sqlMessage
        });
      }

      console.log(result);

      db.query(delete_Doctor_images, [username, get_time, id], (err, result2) => {

        if (err) {
          console.log(err.sqlMessage);
          return res.send({
            status: 0,
            message: err.sqlMessage
          });
        }

        console.log(result2);

        db.query(delete_Doctor_speciality, [get_time, username, id], (err, result3) => {

          if (err) {
            console.log(err.sqlMessage);
            return res.send({
              status: 0,
              message: err.sqlMessage
            });
          }

          console.log(result3);

          db.query(delete_Doctor_Hospital_List, [get_time, username, id], (err, result4) => {

            if (err) {
              console.log(err.sqlMessage);
              return res.send({
                status: 0,
                message: err.sqlMessage
              });
            }

            console.log(result4);

            return res.send({
              status: 1,
              message: 'Doctor Deleted'
            });

          });

        });

      });

    });

  });

  app.get('/getBankAccountTypedetails', async (req, res) => {

    var db = require("./config/config.js").db;

    let getBankAccountTypedetails = 'select id,sName,sValue from tblAppConfig where sName="AccountType" and isActive=1';

    db.query(getBankAccountTypedetails, (err, result) => {

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

  app.get('/showBanks', (req, res) => {

    var db = require("./config/config.js").db;

    var show_banks = 'select id,Bank_Name from tblBankAccountDetails where isActive=1';

    db.query(show_banks, (err, result) => {

      if (err) {
        console.log(err);
        return res.send(err.sqlMessage);
      }

      console.log(result);

      return res.send(result);

    });

  });

  app.get('/showAccountdigits/:id', (req, res) => {

    var db = require("./config/config.js").db;

    var id = req.params.id;

    var show_account_digits = 'select min_digits,max_digits from tblBankAccountDetails where id=? and isActive=1';

    db.query(show_account_digits, [id], (err, result) => {

      if (err) {
        console.log(err);
        return res.send(err.sqlMessage);
      }

      console.log(result);

      return res.send(result);

    });
  });


  app.post('/showDoctorHospitals',(req,res)=>{

    var db = require("./config/config.js").db;

    var doctorid = req.body.doctorid;

    var get_doctor_hospitals='select t3.iDoctorid,t3.sHospital from tblUserMaster t1 \
    join tblDoctorMaster t2 on t2.sMobileNumber=t1.sMobileNum and t2.sActive=1 \
    join tblDoctorHospitalList t3 on t3.iDoctorid=t2.id and t3.isActive=1 \
    where t1.id=? and t1.sActive=1';

    db.query(get_doctor_hospitals,[doctorid],(err,result)=>{

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

}

