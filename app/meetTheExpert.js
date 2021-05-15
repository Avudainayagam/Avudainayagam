var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');
var async = require('async');






module.exports = function (app) {

	app.get("/getcategories",function(req,res){

        var db = require('./config/config.js').db;

        var path = "http://65.0.230.185/uploads/MeetTheExpertsproofs"

  var query = "SELECT sservicename,sexperts,CONCAT('"+path+"',FileName) AS FileUrl FROM `tblmtexpservicecategory` where isActive=1";
  db.query(query,function(err,response){
      if(err){
        console.log(err.message);
      }else{
      //   res.send(response);
      res.send({ status: 0, msg: "Success", data: response });
      }  
    });
  })

 
 app.get("/getTechnicians",function(req,res){

        var db = require('./config/config.js').db;

        var path = "http://65.0.230.185/uploads/MeetTheExpertsproofs"

  var query = "SELECT imtexptechnicianmasterid,sname,sspecialized,tworkingstarttime,tworkingfinishtime,CONCAT('"+path+"',FileName) AS FileUrl,sservicefee FROM `tblmtexptechnicianmaster` where isActive=1";
  db.query(query,function(err,response){
      if(err){
        console.log(err.message);
      }else{
      //   res.send(response);
      res.send({ status: 0, msg: "Success", data: response });
      }  
    });
  })
