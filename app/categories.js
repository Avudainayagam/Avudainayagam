var multer = require("multer");
var path = require('path');
var fs = require('fs');
const url = require('url');
var ip = require("./config/ipaddressconfig.js").ipaddress;

module.exports=function(app){

    app.get('/viewCategories', function (req, res) {

        console.log("viewCategories API...");

        const PROOFDIR = './uploads/categories/';

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

    app.get('/getAllCategories',async(req,res)=>{

        var db = require('./config/config.js').db;

        var ip = await require('./config/ipaddressconfig.js')(db);

        console.log(ip);

        var show_categories='SELECT id,sCategoryName,sFilePath,sFileName,concat(?,sFilePath,sFileName) as "FileURL" FROM tblcategories where isActive=1';

        db.query(show_categories,[ip],(err,result)=>{

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
