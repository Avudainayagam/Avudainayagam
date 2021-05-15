var moment = require('moment');
var now = new Date();
var multer = require("multer");
var path = require('path');
var fs = require('fs');
var url = require('url');
var async = require('async');
const uuid = require("uuid")



const upload_path = "./uploads/Oneus"

//FSEFGserFG-SRGSRG-SRGRG
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, upload_path);
    },
    filename: function (req, file, cb) {
        const random = uuid.v4()
        console.log(file)
        const constructname = random+file.originalname;
        cb(null, constructname);
    }
});
const upload = multer({
    storage: storage
});

const upload_pathone = "./uploads/Group"

//FSEFGserFG-SRGSRG-SRGRG
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, upload_pathone);
    },
    filename: function (req, file, cb) {
        const random = uuid.v4()
        console.log(file)
        const constructname = random+file.originalname;
        cb(null, constructname);
    }
});
const uploadone = multer({
    storage: storage
});

const upload_pathtwo = "./uploads/Post"


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, upload_pathtwo);
    },
    filename: function (req, file, cb) {
        const random = uuid.v4()
        console.log(file)
        const constructname = random+file.originalname;
        cb(null, constructname);
    }
});
const uploadtwo = multer({
    storage: storage
});








module.exports = function (app) {





    app.post("/Oneus",upload.single("imageArray"),function(req,res){
        console.log(req.body);

              var db = require('./config/config.js').db;
              console.log(">>>",req.file)
            
            const query = `INSERT INTO TblPrayerForm(Name,Email,MessageSubject,PrayerTopic,Message,userId,FileName,isActive) VALUES(?,?,?,?,?,?,?,?)`;
            db.query(query,[req.body.Name,req.body.Email,req.body.MessageSubject,req.body.PrayerTopic,req.body.Message,req.body.userId,req.file.filename,1],(err,response)=>{
               if(err){
                 console.log(err.message)
                res.send({ status: 0, msg: "Failed", data: [] }); 
               }else{
          
                res.send({ status: 0, msg: "Success", data: response });
              }

            })
         
      
           
      })

      app.put("/editprayerlist",upload.single("imageArray"),function(req,res){
        console.log(req.body);
      
              var db = require('./config/config.js').db;
      
          var query = "UPDATE  `TblPrayerForm` SET Name = '" + req.body.Name + "',Email = '" + req.body.Email + "',MessageSubject = '" + req.body.MessageSubject + "',PrayerTopic = '" + req.body.PrayerTopic + "',Message = '" + req.body.Message + "',FileName = '" + req.file.filename + "' WHERE id=" + req.body.prayerId + "";
      
          db.query(query, async function(err,response){
              if(err){
                console.log(err.message)
                  res.send({ status: 0, msg: "Failed", data: [] }); 
              }else{
                 
                 res.send({ status: 0, msg: "updated", data: response });
              }  
            });
      })
      

      

    app.get("/getoneus",async function(req,res){
        
        var db = require('./config/config.js').db;

        var ip = await require('./config/ipaddressconfig.js')(db);
           ///169.545.11//uploads/Oneus/image.png
        const ONEUSDIR =  `${ip}uploads/Oneus/`;


    var query =  `SELECT Name,PrayerTopic,Message,MessageSubject,concat('${ONEUSDIR}',FileName) as imgurl FROM TblPrayerForm where isActive=1`;
    db.query(query,function(err,response){
        if(err){
        console.log(err.message);
        }else{
        res.send({ status: 0, msg: "Success", data: response });
      }  
    });
  })

  app.delete("/deleteprayerlist", function(req,res){ 
    var db = require('./config/config.js').db;
    console.log(req.body)
    var query = "UPDATE  TblPrayerForm SET isActive=0  WHERE id=?";
  
  
    db.query(query,[req.body.prayerId],function(err,response){
  
      if(err){
        console.log(err.message);
      }else{
      
      res.send({ status: 0, msg: "Prayerlist Deleted", data: response });
      }  
    });
  })

      app.post("/CreateGroup",uploadone.single("imageArray"),function(req,res){
        console.log(req.body);
      
              var db = require('./config/config.js').db;

               const query = `INSERT INTO tblgroup(Name,Description,UserID,gtid,FileName,screatedby,isActive) VALUES(?,?,?,?,?,?,?)`;
            db.query(query,[req.body.Name,req.body.Description,req.body.UserID,req.body.gtId,req.file.filename,req.body.screatedby,1],(err,response)=>{
      
            if(err){
                console.log(err.message)
                  res.send({ status: 0, msg: "Failed", data: [] }); 
              }else{

                
                 res.send({ status: 0, msg: "Success", data: response });
              }  
            });
      })

      app.put("/editgroup",uploadone.single("imageArray"),function(req,res){
        console.log(req.body);
      
              var db = require('./config/config.js').db;
      
          var query = "UPDATE  `tblgroup` SET Name = '" + req.body.Name + "',Description = '" + req.body.Description + "',UserID = '" + req.body.UserId + "',gtid = '" + req.body.gtId + "',smodifiedby = '" + req.body.smodifiedby + "',FileName = '" + req.body.filename + "' WHERE id=" + req.body.groupId+"";
      
          db.query(query, async function(err,response){
              if(err){
                console.log(err.message)
                  res.send({ status: 0, msg: "Failed", data: [] }); 
              }else{
                 
                 res.send({ status: 0, msg: "Group updated", data: response });
              }  
            });
      })

      
      
    app.post("/getusrgrps",async function(req,res){
        var db = require('./config/config.js').db;

        var ip = await require('./config/ipaddressconfig.js')(db);

        const GROUPDIR =  `${ip}uploads/Group/`;

        var query = `SELECT id,Name,Description,,concat('${GROUPDIR}',FileName) as imgurl FROM tblgroup where isActive=1`;;
        db.query(query,function(err,response){
        if(err){
            console.log(err.message);
        }else{
      //   res.send(response);
         res.send({ status: 0, msg: "Success", data: response });
        }  
    });
})

app.delete("/deletegroup", function(req,res){ 
    var db = require('./config/config.js').db;

    var query = "UPDATE tblgroup SET isActive=0 WHERE id=?";
  
  
    db.query(query,[req.body.groupId],function(err,response){
      if(err){
        console.log(err.message);
      }else{
      
      res.send({ status: 0, msg: "Grouppost Deleted", data: response });
      }  
    });
  })

app.post("/addPost",uploadtwo.single("imageArray"),function(req,res){
    console.log(req.body);
  
          var db = require('./config/config.js').db;

          const query = `INSERT INTO tblgrouppost(UserId,Message,Createdat,FileName,isActive) VALUES(?,?,?,?,?)`;
            db.query(query,[req.body.UserId,req.body.Message,NOW(),req.file.filename,1],(err,response)=>{
  
      
  
      db.query(query,async function(err,response){
          if(err){
            console.log(err.message)
              res.send({ status: 0, msg: "Failed", data: [] }); 
          }else{
            res.send({ status: 0, msg: "Success", data: response });
          }  
        });
  })

  app.put("/editpost",uploadtwo.single,function(req,res){
        console.log(req.body);
      
              var db = require('./config/config.js').db;
      
          var query = "UPDATE  `tblgrouppost` SET UserId = '" + req.body.userId + "',Message = '" + req.body.Message + "',FileName = '" + req.body.filename + "' WHERE id=" + req.body.postId   + "";
      
          db.query(query, async function(err,response){
              if(err){
                console.log(err.message)
                  res.send({ status: 0, msg: "Failed", data: [] }); 
              }else{
                 
                 res.send({ status: 0, msg: "Grouppost updated", data: response });
              }  
          });
  })
  
  

  app.delete("/deletepost", function(req,res){ 
    var db = require('./config/config.js').db;

    var query = "UPDATE tblgrouppost SET isActive=0 WHERE id=?";
  
  
    db.query(query,[req.body.postId],function(err,response){
      if(err){
        console.log(err.message);
      }else{
      
      res.send({ status: 0, msg: "Grouppost Deleted", data: response });
      }  
    });
  })

app.post("/postcomment", function (req, res) {
    var db = require('./config/config.js').db;

var query = "INSERT INTO `tblpostcomments`(`ipostid`,`icommenterid`,`scomments`,`dcreated`,`isActive`) VALUES ('"+req.body.ipostId+"','"+req.body.icommenterId+"','"+req.body.scomments+"',NOW(),1)";
  db.query(query, function (err, response) {
    if (err) {
      console.log(err.message);
      res.send({ status: 1, msg: "Failed", data: response });
    }
    else {
      res.send({ status:0, msg: "Comment posted", data: response });
    }
      
  })
})

app.post("/commentslist",function(req,res){
      var db = require('./config/config.js').db;

  var query = "SELECT ipostcommentid,icommenterid AS userId,scomments FROM `tblpostcomments` WHERE tblpostcomments.ipostid = '"+req.body.ipostId+"' AND isActive=1";
  db.query(query,function(err,response){
      if(err){
        console.log(err.message);
      }else{
      //   res.send(response);
      res.send({ status: 0, msg: "Success", data: response });
      }  
    });
})

app.delete("/deletecomment", function(req,res){ 
    var db = require('./config/config.js').db;

    var query = "UPDATE tblpostcomments SET isActive=0 WHERE `ipostcommentid`='"+req.body.commentId+"'";
  
  
    db.query(query,function(err,response){
      if(err){
        console.log(err.message);
      }else{
      
      res.send({ status: 0, msg: "Comment Deleted", data: response });
      }  
    });
  })


app.post("/postlike", function (req, res) {
    var db = require('./config/config.js').db;

var query = "INSERT INTO `tblpoststatus`(`ipostid`,`iuserid`,`ilikecount`,`dcreated`,`isActive`) VALUES ('"+req.body.ipostId+"','"+req.body.iuserId+"',1,NOW(),1)";
  db.query(query, function (err, response) {
    if (err) {
      console.log(err.message);
      res.send({ status: 1, msg: "Failed", data: response });
    }
    else {
      res.send({ status:0, msg: "liked", data: response });
    }
      
  })
})

app.put("/postunlike", function (req, res) {
    var db = require('./config/config.js').db;

var query = "UPDATE  `tblpoststatus` SET ipostid = '" + req.body.ipostId + "',iuserid = '" + req.body.iuserId + "',ilikecount = 0 WHERE ipoststatsid=" + req.body.poststatsId+"";
  db.query(query, function (err, response) {
    if (err) {
      console.log(err.message);
      res.send({ status: 1, msg: "Failed", data: response });
    }
    else {
      res.send({ status:0, msg: "Updated", data: response });
    }
      
  })
})

app.post("/postsave", function (req, res) {
    var db = require('./config/config.js').db;

var query = "INSERT INTO `tblpoststatus`(`ipostid`,`iuserid`,`isavecount`,`dcreated`,`isActive`) VALUES ('"+req.body.ipostId+"','"+req.body.iuserId+"',1,NOW(),1)";
  db.query(query, function (err, response) {
    if (err) {
      console.log(err.message);
      res.send({ status: 1, msg: "Failed", data: response });
    }
    else {
      res.send({ status:0, msg: "Saved", data: response });
    }
      
  })
})

app.put("/postunsave", function (req, res) {
    var db = require('./config/config.js').db;

var query = "UPDATE  `tblpoststatus` SET ipostid = '" + req.body.ipostId + "',iuserid = '" + req.body.iuserId + "',isavecount = 0 WHERE ipoststatsid=" + req.body.poststatsId+" ";
  db.query(query, function (err, response) {
    if (err) {
      console.log(err.message);
      res.send({ status: 1, msg: "Failed", data: response });
    }
    else {
      res.send({ status:0, msg: "updated", data: response });
    }
      
  })
})

app.post("/likecount", function (req, res) { 
      var db = require('./config/config.js').db;

  var query = "SELECT ipoststatsid,COUNT(ilikecount) AS likes FROM `tblpoststatus` where ilikecount=1 AND ipostid='"+req.body.ipostid+"' AND iuserid='" + req.body.iuserId + "' AND isActive=1";
  db.query(query, function (err, response) {
    if (err) {
      console.log(err.message);
    } else {
      //   res.send(response);
      res.send({ status: 0, msg: "Success", data: response });
    }
  });
})

app.post("/savecount", function (req, res) { 
      var db = require('./config/config.js').db;

  var query = "SELECT ipoststatsid,COUNT(isavecount) AS Save FROM `tblpoststatus` where isavecount=1 AND ipostid='"+req.body.ipostid+"' AND iuserid='" + req.body.iuserId + "' AND isActive=1";
  db.query(query, function (err, response) {
    if (err) {
      console.log(err.message);
    } else {
      //   res.send(response);
      res.send({ status: 0, msg: "Success", data: response });
    }
  });
})

app.post("/communitysearch", function (req, res) {

    var db = require('./config/config.js').db;

    var sName = req.body.sName

  var query = "SELECT id,sName FROM `tblUserMaster` WHERE sName LIKE '%" +
  req.body.sName +
  "%' AND isActive=1";
  db.query(query, function (err, response) {
    if (err) {
      console.log(err.message);
    } else {
      //   res.send(response);
      res.send({ status: 0, msg: "Success", data: response });
    }
  });
})

app.get("/getprayertopic",function(req,res){
    var query = "SELECT * FROM `tblprayertopic` WHERE isActive=1";
    db.query(query,function(err,response){
        if(err){
          console.log(err.message);
        }else{
  
        //   res.send(response);
        res.send({ status: 0, msg: "Success", data: response });
        }  
      });
})

app.post("/showtrendingGroups",function(req,res){
        var db = require('./config/config.js').db;



        var query = "SELECT id AS groupid,Name AS groupname,COUNT(igroupid) AS Follower FROM `tblgroup` Join tblgroupfollower ON tblgroupfollower.igroupid=tblgroup.id WHERE tblgroup.gtid = '"+req.body.gtId+"' AND isActive=1";
        db.query(query,function(err,response){
        if(err){
            console.log(err.message);
        }else{
      //   res.send(response);
         res.send({ status: 0, msg: "Success", data: response });
        }  
    });
})

app.get("/getgrouptype",function(req,res){
    var query = "SELECT * FROM `tblgrouptype` WHERE isActive=1";
    db.query(query,function(err,response){
        if(err){
          console.log(err.message);
        }else{

        res.send({ status: 0, msg: "Success", data: response });
        }  
      });
})
})}
