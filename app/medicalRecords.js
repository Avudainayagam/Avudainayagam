const multer = require('multer');
const fs = require('fs');
const path = require('path');
const url = require('url');
var now = new Date();
const moment = require('moment');
const { db } = require('./config/config');
var ip = require("./config/ipaddressconfig.js").ipaddress;

let MEDICALRECORDSIMG = './uploads/medicalRecords';

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, MEDICALRECORDSIMG)
    },
    filename: function (req, file, cb) {

        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: storage

})


module.exports = function (app) {


    function getLatestID(db) {

        return new Promise((resolve, reject) => {

            var getID = "SELECT AUTO_INCREMENT as 'id'  FROM information_schema.tables WHERE  table_name='tblMedicalRecords' and table_schema='Medi360'";

            db.query(getID, (err, result) => {

                if (err) return console.log(err);

                console.log('getlatestID', result);

                var id = result[0].id;

                return resolve(id);

            });

        });
    }

    function getfilePathName(filename, userId, latest_id) {

        return new Promise((reslove, reject) => {
            // 
            var oldFileName = path.join(MEDICALRECORDSIMG, filename.originalname);
            console.log("OldfileName: " + oldFileName);

            var type=(filename.mimetype).split('/')[1];

            console.log(type);

            var newGeneratedFileName = userId + "_" + latest_id + "." + type;

            console.log("GeneratedFilename:" + newGeneratedFileName);
            let newFileName = path.join(MEDICALRECORDSIMG, newGeneratedFileName);

            console.log("NewFileName:" + newFileName);

            fs.renameSync(oldFileName, newFileName);
            // console.log('File Renamed in Folder...');

            var fileurl = 'viewMedicalRecords/?fileName=';

            return reslove({ fileurl: fileurl, newFileName: newGeneratedFileName })
        })
    }


    app.post('/uploadMedicalRecords', upload.single('image'), async (req, res) => {

        let db = require('./config/config').db;

        console.log(req.body);
        console.log(req.file);
        let originalname = req.file.originalname;

        // let docName = 'Body Pain'
        // let docType = 'prescription';
        // let user_id = 3;
        // let time = '2021-12-12 09:00:00'
        // let date = '2021-12-12';

        let docName = req.body.name
        let docType = req.body.type;
        let user_id = req.body.user_id;
        let time = moment(req.body.time).format('YYYY-MM-DD HH:mm:ss')
        let date = moment(req.body.date).format('YYYY-MM-DD');

        let latest_id = await getLatestID(db);

        let result2 = await getfilePathName(req.file, user_id, latest_id);

        let newFileName = result2.newFileName;

        let filePath = result2.fileurl;

        let created = await require('./config/time.js')(db);

        let createdBy = await require('./config/findusername.js')(db, user_id);

        let medcRecordsObj = {
            docName,
            docType,
            userId: user_id,
            time,
            date,
            fileName: newFileName,
            filePath,
            dCreated: created,
            sCreatedBy: createdBy,
            isActive: 1
        }

        let medicalRecordsQuery = 'INSERT INTO tblMedicalRecords SET ?';

        console.log("medcRecordObj", medcRecordsObj)

        db.query(medicalRecordsQuery, medcRecordsObj, (err, result) => {
            if (err) {

                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            } else {
                console.log(result);

                return res.send({
                    status: 1,
                    message: 'sucessfully uploaded'
                });
            }
        })

    });

    app.get('/viewMedicalRecords', function (req, res) {

        console.log("viewMedicalRecords API...");
        const MEDICALDIR = './uploads/medicalRecords/';

        var query = url.parse(req.url, true).query;
        pic = query.fileName;

        console.log("url");
        console.log(req.url);

        console.log("pic");
        console.log(pic);

        var file_type=pic.split('.')[1];

        console.log(file_type);

        if (typeof pic === 'undefined') {
            console.log("undefined in...");

        } else {
            console.log("Not undefined");

            fs.readFile(MEDICALDIR + pic, function (err, content) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' })
                    console.log(err);
                    res.end("No such File");
                } else {

                    var choose_type='';

                    if(file_type == "pdf"){
                        choose_type={ 'Content-type': 'application/'+file_type }
                    }
                    else{
                        choose_type={ 'Content-type': 'image/'+file_type }
                    }

                    console.log(choose_type);

                    // res.writeHead(200, { 'Content-type': 'image/jpg' });
                    res.writeHead(200, choose_type );
                    res.end(content);
                }
            });
        }
    });

    app.post('/showDocsbasedUser', async(req, res) => {

        let db = require('./config/config').db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var userid = req.body.userid;
        var doctype = req.body.docType;

        var show_docs_user = 'select concat(?,filepath,fileName) as "FileURL",fileName, \
        DATE_FORMAT(date,"%d %b %Y") as "date",SUBSTRING_INDEX(fileName,".",-1) as "file_type" \
        from tblMedicalRecords where userId=? and docType=? and isActive=1';

        db.query(show_docs_user, [ip,userid, doctype], (err, result) => {

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
