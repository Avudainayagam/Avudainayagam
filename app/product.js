var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');
var ip = require("./config/ipaddressconfig.js").ipaddress;

const ASSESSMENTDIR = './uploads/Products';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, ASSESSMENTDIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
});

module.exports = function (app) {

    app.get('/viewAssesmentImages', function (req, res) {

        console.log("viewAssesmentImages API...");

        const PROOFDIR = './uploads/Products/';

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


    function fileRename(id, img_id, data) {

        return new Promise((resolve, reject) => {

            console.log(data);

            var oldFileName = path.join(ASSESSMENTDIR, data.filename);
            console.log("OldfileName: " + oldFileName);

            var newGeneratedFileName = id + "_" + img_id + "." + "jpg";

            console.log("GeneratedFilename:" + newGeneratedFileName);
            var newFileName = path.join(ASSESSMENTDIR, newGeneratedFileName);

            fs.renameSync(oldFileName, newFileName);

            console.log('File Renamed in Folder...');

            var Fileurl = `viewAssesmentImages/?docname=`;

            console.log(Fileurl);

            return resolve({ Fileurl: Fileurl, newFileName: newGeneratedFileName, id: id });

        });

    }

    function InsertProductImages(storage_files, db, username, get_time) {

        return new Promise((resolve, reject) => {

            var insert_tblproductImages = 'INSERT INTO tblproductImages SET ?';

            var post_tblproductImages = {
                iproductId: storage_files.id,
                sproductFileName: storage_files.newFileName,
                sproductFilePath: storage_files.Fileurl,
                isActive: 1,
                screated_by: username,
                dcreated_at: get_time
            }

            db.query(insert_tblproductImages, post_tblproductImages, (err, result) => {

                if (err) {
                    console.log(err);
                    return res.send(err.sqlMessage);
                }

                console.log(result);

                return resolve();

            });

        });

    }

    app.post('/addProducts', upload.array('image'), async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        console.log(req.files);

        var data = req.files;

        // var icategoryId = 3;
        // var sproductName = "Thermometer X Ray";
        // var sProductDescription = "ECG description";
        // var stitle = "'MEDICAL DEVICE & EQUIPMENTS'";
        // var sphysicalCondition = "Working";
        // var dprice = 2000.00;
        // var iUserid = 3;
        // var sFirstName = "John";
        // var sLastName = "";
        // var sGmail = "john";
        // var sAddress = "No.12 Anna Nagar";
        // var sState = "TamilNadu";
        // var sCity = "Chennai";
        // var sPincode = "678901";
        // var No_of_units = 2;

        var icategoryId = req.body.icategoryId;
        var sproductName = req.body.sproductName;
        var sProductDescription = req.body.sProductDescription;
        var stitle = req.body.stitle;
        var sphysicalCondition = req.body.sphysicalCondition;
        var dprice = req.body.dprice;
        var iUserid = req.body.iUserid;
        var sFirstName = req.body.sFirstName;
        var sLastName = req.body.sLastName;
        var sGmail = req.body.sGmail;
        var sAddress = req.body.sAddress;
        var sState = req.body.sState;
        var sCity = req.body.sCity;
        var sPincode = req.body.sPincode;
        var No_of_units = req.body.No_of_units;

        var n = req.files.length;

        var storage_path = [];

        var find_id = 'select CASE \
       WHEN MAX(id) IS NULL THEN 1 \
       WHEN MAX(id) IS NOT NULL THEN Max(id)+1 \
       END AS "id" from tblProducts where isActive=1';

        db.query(find_id, async (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var id = result[0].id;

            var username = await require('./config/findusername.js')(db, iUserid);
            var get_time = await require('./config/time.js')(db);

            var insert_product = 'INSERT INTO tblProducts SET ?';

            var post_products = {
                icategoryId: icategoryId,
                sproductName: sproductName,
                sProductDescription: sProductDescription,
                stitle: stitle,
                sphysicalCondition: sphysicalCondition,
                dprice: dprice,
                iUserid: iUserid,
                sFirstName: sFirstName,
                sLastName: sLastName,
                sGmail: sGmail,
                sAddress: sAddress,
                sState: sState,
                sCity: sCity,
                sPincode: sPincode,
                sProductStatus: "ACTIVE",
                iviews: 0,
                ilikes: 0,
                No_of_units: No_of_units,
                sCreated: username,
                dCreated: get_time,
                isActive: 1
            };

            db.query(insert_product, post_products, async (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }

                console.log(result2);

                if (req.files) {

                    for (var i = 0; i < n; i++) {

                        var result = await fileRename(id, i + 1, data[i]);

                        console.log(result);

                        storage_path.push(result);
                    }

                }

                console.log(storage_path);

                for (var i = 0; i < storage_path.length; i++) {

                    await InsertProductImages(storage_path[i], db, username, get_time);

                }

                var insert_product_status = "INSERT INTO tblproductStatus SET ?";

                var post_product_status = {
                    iProductid: id,
                    sStatus: 'ACTIVE',
                    sCreated_by: username,
                    dCreated_at: get_time,
                    isActive: 1
                };

                db.query(insert_product_status, post_product_status, (err, result3) => {

                    if (err) {
                        console.log(err.sqlMessage);
                    }

                    console.log(result3);

                    return res.send({
                        status: 1,
                        message: 'Product Created'
                    });

                });

            });

        });

    });

    app.post('/getProductsbasedUser', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var userid = req.body.userid;

        var get_products_user = 'SELECT t1.id,t1.sproductName,t1.dprice,DATE_FORMAT(t1.dCreated,"%b %d %Y") as "postedon", \
        t1.iviews,t1.ilikes,t1.No_of_units,t2.Filepath,t3.sStatus as "sProductStatus" \
        FROM tblProducts t1 \
        left join (select MIN(id) as "id",iproductId as "productid",concat(?,sproductFilePath,sproductFileName) as "Filepath" \
        from tblproductImages where isActive=1 group by iproductId) t2 on t2.productid=t1.id \
        left join (select iProductid as "productid",sStatus from tblproductStatus where id IN( \
		select MAX(id) as "id" from tblproductStatus group by iProductid)) t3 on t3.productid=t1.id \
        where t1.iUserid=? and t1.isActive=1';

        db.query(get_products_user, [ip, userid], (err, result) => {

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

    app.get('/selectproducts/:id', async (req, res) => {

        var db = require("./config/config.js").db;

        var id = req.params.id;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        let sql = 'SELECT t1.id,t1.icategoryId,t1.sProductDescription,t1.stitle,t1.sphysicalCondition,t1.dprice, \
        concat(t1.sFirstName,t1.sLastName) as "Full Name",t3.sStatus as "sProductStatus", \
        t1.sGmail,t1.sAddress,t1.sCity,t1.sState,t1.sPincode,t1.sproductName,t1.No_of_units,t2.sCategoryName,t1.sFirstName,t1.sLastName \
        FROM tblProducts t1 \
        join tblcategories t2 on t2.id=t1.icategoryId and t2.isActive=1 \
	    left join (select iProductid as "productid",sStatus from tblproductStatus where id IN( \
		select MAX(id) as "id" from tblproductStatus group by iProductid)) t3 on t3.productid=t1.id \
        where t1.id=? and t1.isActive=1';

        db.query(sql, [id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });

            }

            console.log(result);

            let sql2 = 'SELECT id,concat(?,sproductFilePath,sproductFileName) as "FileName" FROM tblproductImages where iproductId=? and isActive=1 ';

            db.query(sql2, [ip, id], (err, result2) => {

                if (err) {
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });

                }
                console.log(result2);

                if (result.length > 0) {

                    result[0].productimage = [];
                    result[0].productimage = result2;
                    console.log(result2);

                }
                return res.send(result);

            });
        });
    });

    function deleteExistingLoadedImages(id, db, username, get_time) {

        return new Promise((resolve, reject) => {

            var delete_product = 'update tblproductImages set isActive=0,smodified_by=?,dmodified_at=? where id=?';

            db.query(delete_product, [username, get_time, id], (err, result) => {

                if (err) {
                    console.log(err.sqlMessage);
                }

                console.log(result);

                return resolve();

            });

        });

    }

    app.post('/updateProducts', upload.array('image'), async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        console.log(req.files);

        var data = req.files;

        // var id = 8;
        // var sproductName = "ECG AZ";
        // var sProductDescription = "ECG AZ description";
        // var stitle = "MEDICAL DEVICE & EQUIPMENTS";
        // var sphysicalCondition = "Good";
        // var dprice = 2005.00;
        // var sFirstName = "John";
        // var sLastName = "";
        // var sGmail = "john";
        // var sAddress = "No.11 T Nagar";
        // var sState = "TamilNadu";
        // var sCity = "Chennai";
        // var sPincode = "6789011";
        // var sProductStatus = "ACTIVE";
        // var No_of_units = 3;
        // var iUserid=3;
        // var delete_image_id=[];

        var id = req.body.id;
        var sproductName = req.body.sproductName;
        var sProductDescription = req.body.sProductDescription;
        var stitle = req.body.stitle;
        var sphysicalCondition = req.body.sphysicalCondition;
        var dprice = req.body.dprice;
        var sFirstName = req.body.sFirstName;
        var sLastName = req.body.sLastName;
        var sGmail = req.body.sGmail;
        var sAddress = req.body.sAddress;
        var sState = req.body.sState;
        var sCity = req.body.sCity;
        var sPincode = req.body.sPincode;
        var sProductStatus = req.body.sProductStatus;
        var No_of_units = req.body.No_of_units;
        var iUserid = req.body.iUserid;
        var delete_image_id = req.body.delete_image_id;


        var find_id = 'select CASE \
       WHEN MAX(id) IS NULL THEN 1 \
       WHEN MAX(id) IS NOT NULL THEN Max(id)+1 \
       END AS "id" from tblProducts where isActive=1';

        db.query(find_id, async (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            var username = await require('./config/findusername.js')(db, iUserid);
            var get_time = await require('./config/time.js')(db);

            var upload_product = 'update tblProducts SET \
            sproductName=?,sProductDescription=?,stitle=?,sphysicalCondition=?,dprice=?,sFirstName=?,sLastName=?,sGmail=?,sAddress=?, \
            sState=?,sCity=?,sPincode=?,sProductStatus=?,No_of_units=?,sModified=?,dModified=? where id=?';

            db.query(upload_product, [sproductName, sProductDescription, stitle, sphysicalCondition, dprice, sFirstName, sLastName,
                sGmail, sAddress, sState, sCity, sPincode, sProductStatus, No_of_units, username, get_time, id], async (err, result2) => {

                    if (err) {

                        console.log(err.sqlMessage);

                        return res.send({
                            status: 0,
                            message: err.sqlMessage
                        });
                    }

                    console.log(result2);

                    var get_File_Length = 'SELECT count(*) as "FileLength" FROM tblproductImages where iproductid=? and  isActive=1';

                    db.query(get_File_Length, [id], async (err, result3) => {

                        if (err) {

                            console.log(err.sqlMessage);

                            return res.send({
                                status: 0,
                                message: err.sqlMessage
                            });
                        }

                        console.log(result3);

                        var storage_path = [];

                        var exist_file_len = result3[0].FileLength || 0;

                        var total_file_len = exist_file_len + req.files.length;

                        var k = 0;

                        if (req.files) {

                            for (var i = exist_file_len + 1; i <= total_file_len; i++) {

                                var result = await fileRename(id, i, data[k]);

                                k++;

                                console.log(result);

                                storage_path.push(result);
                            }

                        }

                        console.log(storage_path);

                        for (var i = 0; i < storage_path.length; i++) {

                            await InsertProductImages(storage_path[i], db, username, get_time);

                        }

                        for (var i = 0; i < delete_image_id.length; i++) {
                            await deleteExistingLoadedImages(delete_image_id[i], db, username, get_time);
                        }

                        var insert_product_status = "INSERT INTO tblproductStatus SET ?";

                        var post_product_status = {
                            iProductid: id,
                            sStatus: sProductStatus,
                            sCreated_by: username,
                            dCreated_at: get_time,
                            isActive: 1
                        };

                        db.query(insert_product_status, post_product_status, (err, result3) => {

                            if (err) {
                                console.log(err.sqlMessage);
                            }

                            console.log(result3);

                            return res.send({
                                status: 1,
                                message: 'Product Updated'
                            });

                        });


                    });

                });
        });
    });

    app.post('/getProductsbasedCategoryCity', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var categoryid = req.body.categoryid;
        var state_city = req.body.state_city;

        var show_products = "";

        if (categoryid == "" || state_city == "") {

            show_products = 'SELECT t1.id,t1.sproductName,t1.dprice,t1.sCity,t1.sState,DATE_FORMAT(t1.dCreated,"%b %d %Y") as "postedon", \
            t1.No_of_units,t2.Filepath \
            FROM tblProducts t1 \
            left join (select MIN(id) as "id",iproductId as "productid",concat(?,sproductFilePath,sproductFileName) as "Filepath" \
            from tblproductImages where isActive=1 group by iproductId,Filepath) t2 on t2.productid=t1.id \
            where t1.isActive=1';

        }
        else {

            var show_products = `select t1.id,t1.sproductName,t1.sCity,t1.sState,DATE_FORMAT(t1.dCreated,"%d %b %Y") as "posted_on",t1.No_of_units,t2.Filepath,t1.dprice \
        from tblProducts t1 \
        join (select MIN(id) as "id",iproductId as "productid",concat(?,sproductFilePath,sproductFileName) as "Filepath" \
        from tblproductImages where isActive=1 group by iproductId,Filepath) t2 on t2.productid=t1.id \
        where t1.icategoryId=${categoryid} \
        and (LOWER(t1.sState) like '%${state_city}%' OR UPPER(t1.sState) like '%${state_city}%' OR LOWER(t1.sCity) like '%${state_city}%' OR UPPER(t1.sCity) like '%${state_city}%' OR LOWER(t1.sPincode) like '%${state_city}%' OR UPPER(t1.sPincode) like '%${state_city}%' ) and t1.isActive=1`;

        }

        db.query(show_products, [ip], (err, result) => {

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


    app.get('/getProductfromSeller/:id', async (req, res) => {

        var db = require('./config/config.js').db;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var id = req.params.id;

        console.log(id);

        var show_product = `select t1.id, \
        t1.sproductName,t1.sState,t1.sCity, \
        t1.No_of_units,DATE_FORMAT(t1.dCreated,"%b %d") as "Postedon", \
        t1.dprice,t1.sProductDescription,t1.sphysicalCondition,t1.sCreated as "Postedby", \
        t1.icategoryId as "ProductType",t3.sName,t3.sMobileNum,  t1.iUserid as "posteduserid", \
        concat('${ip}',t3.sProfileUrl,t3.sProfilePic) as "UserImageUrl" \
        from tblProducts t1 \
        join tblUserMaster t3 on t3.id = t1.iUserid and t3.sActive=1 \
        where t1.id='${id}' and t1.isActive=1 group by t1.id asc `;

        let getImages=` select concat('${ip}',sproductFilePath,sproductFileName) as "FileName" from 
        tblproductImages where iproductId=${id} and isActive=1`;

        db.query(show_product, (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(getImages,(err,result2)=>{
                if(err){
                    console.log(err.sqlMessage);
                    return res.send({
                        status: 0,
                        message: err.sqlMessage
                    });
                }else{
                    console.log(result2)
                    result[0].productImages=result2
                    
                    return res.send(result);

                }
            })

          
        });

    });


    app.post('/updatelikes', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var current_state = req.body.current_state;

        var iUserid = req.body.iUserid;

        var id = req.body.id;

        var sql_query = '';

        var username = await require('./config/findusername.js')(db, iUserid);
        var get_time = await require('./config/time.js')(db);

        if (current_state == 0) {
            sql_query = 'update tblProducts SET ilikes=ilikes+1,sModified=?,dModified=? where id=?'
        }
        else {
            sql_query = 'update tblProducts SET ilikes=ilikes-1,sModified=?,dModified=? where id=?'
        }

        db.query(sql_query, [username, get_time, id], (err, result) => {

            if (err) {

                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            return res.send({
                status: 1,
                message: 'Likes Updated'
            });

        });


    });

    app.post('/updateviews', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var iUserid = req.body.iUserid;

        var id = req.body.id;

        var sql_query = 'update tblProducts SET iviews=iviews+1,sModified=?,dModified=? where id=?';

        var username = await require('./config/findusername.js')(db, iUserid);
        var get_time = await require('./config/time.js')(db);

        db.query(sql_query, [username, get_time, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);

                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            return res.send({
                status: 1,
                message: 'views Updated'
            });

        });

    });

    app.post('/deleteProduct', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;

        var userid = req.body.userid;

        var username = await require('./config/findusername.js')(db, userid);
        var get_time = await require('./config/time.js')(db);

        var delete_product = "update tblProducts set isActive=0,sModified=?,dModified=? where id=?";

        var delete_product_images = 'update tblproductImages set isActive=0,smodified_by=?,dmodified_at=? where iproductId=?';

        db.query(delete_product, [username, get_time, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            db.query(delete_product_images, [username, get_time, id], (err, result2) => {

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
                    message: 'Product Deleted'
                });

            });


        });

    });

    app.post('/updateProductDeactivated', async (req, res) => {

        var db = require('./config/config.js').db;

        console.log(req.body);

        var id = req.body.id;

        var userid = req.body.userid;

        var username = await require('./config/findusername.js')(db, userid);
        var get_time = await require('./config/time.js')(db);

        var product_deactivated = 'update tblProducts set sProductStatus="INACTIVE",sModified=?,dModified=? where id=?';

        db.query(product_deactivated, [username, get_time, id], (err, result) => {

            if (err) {
                console.log(err.sqlMessage);
                return res.send({
                    status: 0,
                    message: err.sqlMessage
                });
            }

            console.log(result);

            return res.send({
                status: 1,
                message: 'Product-DeActivated'
            });

        });

    });

    app.post('/contactSeller',async(req,res)=>{

        var db = require('./config/config.js').db;

        console.log(req.body);

        // var iProductId=1;
        // var sContactNumber ="9597653749";
        // var iUserId=88;
        // var iPostedUserId=3;
        
        var iProductId=req.body.iProductId;
        var sContactNumber =req.body.sContactNumber;
        var iUserId=req.body.iUserId;
        var iPostedUserId=req.body.iPostedUserId;

        
        var username = await require('./config/findusername.js')(db, iUserId);
        var get_time = await require('./config/time.js')(db);


        var insert_ProductUserContactInfo="INSERT INTO tblProductUserContactInfo SET ?";

        var post_ProductUserContactInfo={
            iProductId:iProductId,
            sContactNumber:sContactNumber,
            iUserId:iUserId,
            iPostedUserId:iPostedUserId,
            sCreated_by:username,
            dCreated_at:get_time,
            isActive:1
        }

        db.query(insert_ProductUserContactInfo,post_ProductUserContactInfo,(err,result)=>{

            if(err){
                console.log(err.sqlMessage);
                return res.send({
                    status:0,
                    message:err.sqlMessage
                });
            }

            console.log(result);

            return res.send({
                status:1,
                message:'Buyer Contacted'
            });

        });

    });




}
