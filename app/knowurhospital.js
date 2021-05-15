var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');
var ip = require("./config/ipaddressconfig.js").ipaddress;

module.exports = function (app) {

    app.get('/viewFacilities', function (req, res) {

        console.log("viewFacilities API...");

        const PROOFDIR = './uploads/FacilityMaster/';

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

    app.get('/viewSpecialties', function (req, res) {

        console.log("viewSpecialties API...");

        const PROOFDIR = './uploads/specialityMaster/';

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

    app.get('/viewHospitalImages', function (req, res) {

        console.log("viewHospital Images API...");

        const PROOFDIR = './uploads/hospitalImages/';

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

    app.get('/selecthospital/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var id = req.params.id;

        let sql = 'select sHospitalName,sAddress,sdescription from tblHospital where id=? and isActive=1';

        db.query(sql, [id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            let sql2 = 'select t1.ifacilityid,t2.sFacilityName,concat(?,t2.sImageURL,t2.sImageName) as "Facility_image"\
            from tblhospitalFacilities t1\
            join tblMasterHospitalFacilities t2 on t2.id = t1.ifacilityid\
            where t1.ihospitalid=?';

            db.query(sql2, [ip, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });

                }
                console.log(result2);

                let sql3 = 'select concat(?,sImgURL,sImgName) as "hospital_image" from tblhospitalImages \
                where ihospitalid=? and isActive=1';

                db.query(sql3, [ip, id], (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });

                    }
                    console.log(result3);

                    if (result.length > 0) {

                        result[0].facilityimage = [];
                        result[0].facilityimage = result2;
                        console.log(result2);
                        result[0].hospitalimage = [];
                        result[0].hospitalimage = result3;
                        console.log(result3);

                    }
                    return res.send(result);
                });
            });
        });
    });


    app.get('/selectspecialityhospital/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var id = req.params.id;

        let sql = 'select t1.ihospitalid,t2.sHospitalName,t2.sAddress,t3.Hospital_Image_URL \
        from tblhospitalSpeciality t1 \
        join tblHospital t2 on t2.id=t1.ihospitalid and t2.isActive=1 \
        left join \
        (select MIN(id) as "id",ihospitalid,concat(?,sImgURL,sImgName) as "Hospital_Image_URL" from tblhospitalImages \
        where isActive=1 group by ihospitalid) t3 on t3.ihospitalid=t2.id \
        where t1.ispecialityid=? and t1.isActive=1 ';

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


    app.get('/searchhHospital/:name', (req, res) => {

        var db = require("./config/config.js").db;

        var name = req.params.name;

        let sHospitalName = name == '' ? null : name;

        var search_hospital = `select id,sHospitalName from tblHospital where (sHospitalName like '${sHospitalName}%' OR  \
        sHospitalName like '%${sHospitalName}' OR sHospitalName like '%${sHospitalName}%' ) \
        and isActive=1`;

        db.query(search_hospital, (err, result) => {

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


    app.get('/showSpecialties', async (req, res) => {

        var db = require("./config/config.js").db;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var show_specialities = 'select id, sSpecialityName ,concat(?,sImageURL,sImageName) as "ImageURL" from \
    tblMasterHospitalSpecialities where isActive=1';

        db.query(show_specialities, [ip], (err, result) => {

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


    app.post('/hospitaldetails', async (req, res) => {

        var db = require("./config/config.js").db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var ssHospitalName = req.body.sHospitalName;
        var ssLocation = req.body.sLocation;
        var isspecialityid = req.body.ispecialityid;

        // var ssHospitalName = "CMC Hospital";
        // var ssLocation = "";
        // var isspecialityid ='';

        let sHospitalName = ssHospitalName == '' ? null : ssHospitalName;
        let sLocation = ssLocation == '' ? null : ssLocation;
        let ispecialityid = isspecialityid == '' ? null : isspecialityid;

        console.log('sHospitalName', sHospitalName)
        var sql = "";

        if (sHospitalName == null && sLocation == null && ispecialityid == null) {

            console.log("Empty.....");

            // sql=`select t1.id,t1.sHospitalName,t1.sAddress,t2.Hospital_Image_URL 
            // from tblHospital t1 left join
            // (select MIN(id) as "id",ihospitalid,concat(?,sImgURL,sImgName) as "Hospital_Image_URL" from tblhospitalImages
            // where isActive=1 group by ihospitalid,Hospital_Image_URL) t2 on t2.ihospitalid=t1.id where t1.isActive=1 `;

            sql = `select t1.id,t1.sHospitalName,t1.sAddress from tblHospital t1 where t1.isActive=1 ;`
        }
        else {

            console.log("Not Empty....");

            sql = `select distinct t1.id,t1.sHospitalName,t1.sAddress \
        from tblHospital t1 \
        left join tblhospitalSpeciality t2 on t1.id=t2.ihospitalid and t2.isActive=1 \
        where (t1.sHospitalName like '${sHospitalName}%' OR  t1.sHospitalName like '%${sHospitalName}' OR 
        t1.sHospitalName like '%${sHospitalName}%') \
        or (t1.sCity='${sLocation}' or t1.sState='${sLocation}' or t1.sCountry='${sLocation}' or t1.sPincode='${sLocation}') \
        or t2.ispecialityid='${ispecialityid}' and t1.isActive=1`;
        }



        db.query(sql, (err, result) => {


            // console.log(sql);

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            let idS = result.map((re) => re.id)

            //  let   FILTERidS = idS.filter(function(item, pos) {
            //         return idS.indexOf(item) == pos;
            //     })

            console.log(idS, 'FILTERidS')

            let getDocImages = `select MIN(id) as "id",ihospitalid,concat(?,sImgURL,sImgName) as "Hospital_Image_URL" from tblhospitalImages 
        where isActive=1 and ihospitalid in (${idS}) group by Hospital_Image_URL,ihospitalid`;

            db.query(getDocImages, [ip], (err, result2) => {
                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });

                }
                // console.log(getDocImages)



                console.log(result2)

                var result3 = result.map(function (v) {
                    v['image'] = [];
                    result2.forEach((item, index, arr) => {
                        if (item.ihospitalid == v.id) {
                            v['image'].push(item.Hospital_Image_URL)

                            return v
                        }
                    });


                    return v;
                });

                console.log(result3);



                return res.send(result3);


            })


        });


    });

}
