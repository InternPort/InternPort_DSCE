const express = require('express');
const body= require('body-parser');
const app= express();
let  techemail;
let usn="";
//encryption
const Cryptr=require('cryptr');
const cryptr=new Cryptr('myTotalySecretKey')
//node mailer
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars')
//https for mailchimp https communication
const https=require('https');
//ejs
const ejs= require('ejs');
//loadash
const _ = require("lodash");
//mongoose
const mongoose = require('mongoose');
//multer and gridfs
const multer=require('multer');
const GridFsStorage=require('multer-gridfs-storage')
const crypto = require("crypto");
const path = require("path");
//body parser
app.use(body.urlencoded({extended:false}))
app.use(body.json());
app.set("view engine","ejs");
app.use(express.static("public"));
//database
const mongoURI = "mongodb://localhost/InternPort";
 mongoose.connect("mongodb://localhost/InternPort",{useNewUrlParser:true,useUnifiedTopology:true});
var db=mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open',function(){
  console.log("Connection Sucessful to db");
})
//upload file
var conn=mongoose.createConnection("mongodb://localhost/InternPort",{useNewUrlParser:true,useUnifiedTopology:true}) 
let gfs;
conn.once("open", () => {
  // init stream
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads"
  });
});

var Teacher=mongoose.Schema({
    uname :"String",
    password:"String",
    email:"String"

})

const Skillschema=new mongoose.Schema({
  usn:"String",
  skill:"String",
  type:"String"
})
var interncert=mongoose.Schema({
   usn:"String",
   internid:"String",
   internname:"String",
   docUp:"String",
   filenames:"String"
})
var Skills=mongoose.model("Skills",Skillschema);
var teach=mongoose.model('SignupTeach',Teacher);
// var stud=mongoose.model('SignupStud',Student);
//instead we can require a mongoose model
const stud=require("./student");
//For Internships
const internship=require('./internship')
//For Selection of Students
const selection=require('./Interns');
 var certifies=mongoose.model('UploadedDocs',interncert);
 // Storage
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString("hex") + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: "uploads"
          };
          resolve(fileInfo);
        });
      });
    }
  });
  
  const upload = multer({
    storage
  });
 
app.get('/',function(req,res){
  res.sendFile(__dirname+"/views/homepage.html")
  usn=null;
  techemail=null;
})
app.get('/internship',function(req,res){
    res.render('interninfo')
})
app.get('/signup',function(req,res){
    res.render("signup");
})
app.post('/signup', function(req,res){
var desgn=req.body.desgn;
var uname=req.body.uname;
var email=req.body.cemail;
 if(desgn.match("Teacher")||desgn.match("teacher")){
    teach.find({email:req.body.cemail}, function (err, tech) {
        if (err){
            return handleError(err);
        }
            if(tech.length==0){
            teach.create({ uname:uname,password:req.body.cpassw,email:req.body.cemail }, function (err, small) {
                if (err) return handleError(err)
                else
                {
					 var data={
        //members key value pairs
        members:[
            {
                email_address: email,
                status :"subscribed",


            }
        ]
    }
    var jsondata= JSON.stringify(data);
        //now we will make post requests
        //see documentation
        //now within the app.post
        const url="https://us19.api.mailchimp.com/3.0/lists/5e0a46da89";
        //api has us19
        const options={
            method:"POST",
            auth:"dsce:2c7a9d28e5efb7a4763504b7c983a69e-us19"

        }
        var name = uname;
      const requ=  https.request(url,options,function(response){
            response.on("data",function(data){
                    if(response.statusCode ==200)
                    {
                       console.log("Subscribed") 
                      // res.render('list',{uname : name});
                    }
                   else{
                        console.log(" not Subscribed") 
                       
                   }
            })
        })
        requ.write(jsondata);
        requ.end();
                console.log("Hurray");
                res.redirect("/loginTeacher/"+uname)
                }
              });
            }
              else
              {
                res.render("Failure")
                  console.log(tech)
              }
      })

 }
//student signup
if(desgn.match("Student")||desgn.match("student")){
  stud.find({usn:req.body.uname}, function (err, tech) {
      if (err){
          return handleError(err);
      }
          if(tech.length==0){
          stud.create({ usn:uname,password:req.body.cpassw,email:req.body.cemail }, function (err, small) {
              if (err) return handleError(err)
              else
              {
              console.log("Hurray");
     var data={
  //members key value pairs
  members:[
      {
          email_address: email,
          status :"subscribed",


      }
  ]
}
var jsondata= JSON.stringify(data);
  //now we will make post requests
  //see documentation
  //now within the app.post
  const url="https://us19.api.mailchimp.com/3.0/lists/5e0a46da89";
  //api has us19
  const options={
      method:"POST",
      auth:"dsce:2c7a9d28e5efb7a4763504b7c983a69e-us19"

  }
  var name = uname;
const requ=  https.request(url,options,function(response){
      response.on("data",function(data){
              if(response.statusCode ==200)
              {
                 console.log("Subscribed")
                // res.render('list',{uname : name});
              }
             else{
                  console.log("not Subscribed")
                 
             }
      })
  })
  requ.write(jsondata);
  requ.end();
            usn=uname;
            let enceryptedString=cryptr.encrypt(usn)
            res.redirect('/loginStud/'+enceryptedString)
              }
            });
          }

            else
            {
              //  res.render("Failure")
                console.log(tech)
            }
    })
}
  
     
})

//firstime student login
app.get('/loginStud/:usn',function(req,res){
  let decryptStri=cryptr.decrypt(req.params.usn);
    res.render("loginStud",{univ:req.params.usn,usn:decryptStri});

})
//login general for student
app.get('/loginStudent',function(req,res){
  res.render("loginStudent");
})
//post of student other time login
app.post('/loginstudent',function(req,res){
  stud.findOne({usn:req.body.usern,password:req.body.passwo},function(err,result){
      if(err){
          return handleError(err);
      }
      if(result==null){
       res.render('Failure')
      }
     
     else{
          let today= new Date;
          //  var tod=today.getDay();
          let day;
            //to localeDateString can be used to set format of Date
            //it is a feature of Javascript
          let options={
              weekday:"long",
              day: "numeric",
              month:"long",
              year:"numeric"
            };
            let enceryptedString=cryptr.encrypt(result.usn);
            day=today.toLocaleDateString("en-US",options);
           res.render('homeStud',{username:req.body.usern,dates:day,ustudent:enceryptedString})
          usn=result.usn;
		
				console.log(usn)
				}
      
  })
  
})
//hompage of students to be rendered in general
app.get('/homeStudent/:usn',(req,res)=>{
  let decryptStri=cryptr.decrypt(req.params.usn)
  let today= new Date;
  //  var tod=today.getDay();
  let day;
    //to localeDateString can be used to set format of Date
    //it is a feature of Javascript
  let options={
      weekday:"long",
      day: "numeric",
      month:"long",
      year:"numeric"
    };
   
    day=today.toLocaleDateString("en-US",options);
   res.render('homeStud',{username:decryptStri,dates:day,ustudent:req.params.usn})
})

//First time Login post
app.post('/loginstu/:usn',function(req,res){
  const decryptStri=cryptr.decrypt(req.params.usn);
  
    stud.findOne({usn:decryptStri,password:req.body.passwo},function(err,result){
        if(err){
            return handleError(err);
        }
        if(result==null){
         res.render('Failure')
        }
       
       else{
           
              usns=cryptr.encrypt(result.usn);
              res.redirect('/profile/firstime/'+usns)
            usn=result.usn;
            console.log(usn)
        }
        
    })
    
})

app.get('/uploaders/:usn',(req,res)=>{
  let decryptStri=cryptr.decrypt(req.params.usn);
  certifies.find({usn:decryptStri},(err,result)=>{
    if(err){
      console.error.bind("console",'error');
    }
    else{
    // res.send(result);
      res.render('internshipAdd',{usns:req.params.usn,interns:result})
    }
  })
 
})
   

app.post("/uploaded/:usn/", upload.single("file"), (req, res) => {
  let decryptStri=cryptr.decrypt(req.params.usn);
 // console.log(req.body.interDoc)
  certifies.create({ usn:decryptStri,internid:req.body.interid,internname:req.body.intername,docUp:req.body.interDoc,filenames:req.file.filename}, function (err, small) {
    if (err){return handleError(err)
    }
    else
    {
    console.log("Hurray i uploaded my file");
  
    }
  });	
    res.redirect("/uploaders/"+req.params.usn);
  });
  

//read stream can be used to output the image 
app.get("/image/:filename", (req, res) => {
    // console.log('id', req.params.id)
    const file = gfs
      .find({
        filename: req.params.filename
      })
      .toArray((err, files) => {
        if (!files || files.length === 0) {
          return res.status(404).json({
            err: "no files exist"
          });
        }
        gfs.openDownloadStreamByName(req.params.filename).pipe(res);
        
      });
  });
//first time updatin of student details 
app.get("/profile/firstime/:usn",(req,res)=>{
  let usns='';
  let decryptStri=cryptr.decrypt(req.params.usn);
  stud.findOne({usn:decryptStri},(err,result)=>{
    if(err){
      return handleError(err)
    }
    else
    usns=result.usn;

  })
    res.render("updato",{universal:req.params.usn,univ:decryptStri})
})
//firstime updation of student Details
app.post("/updato/:usn",(req,res)=>{
  let decryptStri=cryptr.decrypt(req.params.usn);
  stud.updateOne({'usn':decryptStri}, {$set:{name:req.body.name,semester:req.body.semester,section:req.body.section,contc:req.body.contc,cgpa:req.body.cgpa }}, function(err, result) {
    // Updated at most one doc, `res.modifiedCount` contains the number
    // of docs that MongoDB updated
   console.log(result); 
   let today= new Date;
          //  var tod=today.getDay();
          let day;
            //to localeDateString can be used to set format of Date
            //it is a feature of Javascript
          let options={
              weekday:"long",
              day: "numeric",
              month:"long",
              year:"numeric"
            };
            day=today.toLocaleDateString("en-US",options);
          
   res.render('homeStud',{username:decryptStri,dates:day, ustudent:req.params.usn})
  });
})
//get method of student skillset page
app.get("/profile/skillset/:usn",(req,res)=>{
  let decryptStri=cryptr.decrypt(req.params.usn);
  Skills.find({usn:decryptStri},(err,posts)=>{
    if(err){
      return handleError(err);
    }
    else{
  res.render("skillo",{usns:req.params.usn,skills:posts})
   
    }
  })
})
// post method Skillset Page of Student
 app.post("/profile/skillset/:usn",(req,res)=>{
  let decryptStri=cryptr.decrypt(req.params.usn);
  var item={
    skill:req.body.skill,
      type:req.body.types
   };
   Skills.create({usn:decryptStri,skill:item.skill,type:item.type},(err1,res1)=>{
    if(err1){
      return handleError();
    }
   
      res.redirect('/profile/skillset/'+req.params.usn)
     })
   })
   
  
 /*Skills.create({usn:decryptStri,skill:item.skills},(err,result)=>{
   if(err){
     return handleError();
   }
   res.redirect('/profile/skillset/'+decryptStri)
 })*/



 app.get("/profile/:usn",(req,res)=>{
  let decryptStri=cryptr.decrypt(req.params.usn);
   stud.findOne({usn:decryptStri},(err,result)=>{
     if(err){
       return handleError(err)
     }
     else{
     console.log(result)
    //names=result.name;
     }
   })
     res.render("updNext",{unvi:req.params.usn,universal :decryptStri,sucess:""})
 })
 //manytime updation of student Details
 app.post("/updated/:usn",(req,res)=>{
  let decryptStri=cryptr.decrypt(req.params.usn);
   stud.updateOne({'usn':decryptStri}, {$set:{semester:req.body.semester,section:req.body.section,cgpa:req.body.cgpa }}, function(err, result) {
     // Updated at most one doc, `res.modifiedCount` contains the number
     // of docs that MongoDB updated
   if(err){
   return handleError(err);
   }
    else{
      res.render("updNext",{unvi:req.params.usn,universal :decryptStri,sucess:"Your Information was updated"}) 
      
    }  
           
   });
 })
 //seeing the self profile by student
 app.get("/MyDetail/:usn/",(req,res)=>{
  decryptStri=cryptr.decrypt(req.params.usn);
  console.log(decryptStri)
  let studDets=new Object();
  let skilleds=new Object();
  let interned=new Object();
  stud.findOne({usn:decryptStri},(err,student)=>{
    if(err){
      return handleError(err);
    }
    else{
      
      studDets=JSON.parse(JSON.stringify(student))
    console.log(studDets)
    console.log(student)
    }
})
Skills.find({usn:decryptStri},(err,skills)=>{
  if(err){
    return handleError(err);
  }
  else{
    skilleds=JSON.parse(JSON.stringify(skills))
    console.log(skilleds)
    
  }
})
certifies.find({usn:decryptStri},(err,interns)=>{
  if(err){
    return handleError(err);
  }
  else{
    
    interned=JSON.parse(JSON.stringify(interns))
    res.render("myProfile",{studDet:studDets,skills:skilleds,internss:interned})
  }
})
})

app.get('/loginTeach',function(req,res){
  res.render("loginTeach");
})
 //firstime teacher login
app.get('/loginTeacher/:user',(req,res)=>{
res.render('loginTeachbef',{username:req.params.user})
})
//post of firstime login
app.post('/loginteacher/:uname',(req,res)=>{
teach.findOne({uname:req.params.uname,password:req.body.passwo},(err,resu)=>{
  if(err){
      return handleError(err);
  }
  if(resu==null){
    res.render('Failure')
  }
  else{
    let enceryptedString=cryptr.encrypt(resu.email);
    let today= new Date;
          //  var tod=today.getDay();
          let day;
            //to localeDateString can be used to set format of Date
            //it is a feature of Javascript
          let options={
              weekday:"long",
              day: "numeric",
              month:"long",
              year:"numeric"
            };
           
            day=today.toLocaleDateString("en-US",options);
    res.render('homeTech',{uname:enceryptedString,dates:day})
    techemail=resu.email;
  }
})
})

app.post('/logintech',function(req,res){
  teach.findOne({uname:req.body.usern,password:req.body.passwo},function(err,resu){
      if(err){
          return handleError(err);
      }
      if(resu==null){
        res.render('Failure')
      }
      else{
        
          techemail=resu.email; 
          console.log(techemail)
          let enceryptedString=cryptr.encrypt(resu.email)
          let today= new Date;
          //  var tod=today.getDay();
          let day;
            //to localeDateString can be used to set format of Date
            //it is a feature of Javascript
          let options={
              weekday:"long",
              day: "numeric",
              month:"long",
              year:"numeric"
            };
           
            day=today.toLocaleDateString("en-US",options);
    res.render('homeTech',{uname:enceryptedString,dates:day})
      }
  })
  })
  //Teachers Adding Internships
  app.get("/intadd/:email",(req,res)=>{
    res.render('TechInternShipadds',{email:req.params.email})
  })
  //post on adding internships
  app.post("/intadds/:email",(req,res)=>{
    let decryptStri=cryptr.decrypt(req.params.email);
internship.findOne({internid:req.body.id},(err ,result1)=>{
  console.log(req.body.id)
  if(err){
    return handleError(err);
  }
  if(result1==null){
    internship.create({addedby:decryptStri,internid:req.body.id,internname:req.body.name,company:req.body.company,
      duration:req.body.dur,typofwork:req.body.type,Skills:req.body.skill,stifund:req.body.sti,DailyWorkdur:req.body.dail,duedate:req.body.duedate},(error,result2)=>{
        if(err){
          return handleError(error)
        }
        else{
          console.log(result2)
        }
      })
      selection.create({internid:req.body.id,duedate:req.body.duedate},(err2,result3)=>{
        if(err2){
          return handleError(error)
        }
        else{
          console.log(result3)
        }
      })
  }
  else{
   res.render('AlreadyExists',{email:req.params.email});
  }
 res.render('SucessAddInt',{email:req.params.email})
})   
  })
  //For teachers to see the Internships they added
  app.get('/addedInter/:email',(req,res)=>{
    let decryptStri=cryptr.decrypt(req.params.email)
    internship.find({addedby:decryptStri},(err,result1)=>{
     if(err){
        return handleError(err);
      }
     
      else{
        res.render("addedinter",{internships:result1,email:req.params.email})
        
      // res.send(result1)as
      }
    })
  })
  //home page for teachers
  app.get("/homeTeacher/:email",(req,res)=>{
    let decryptStri=req.params.email;
    let today= new Date;
    //  var tod=today.getDay();
    let day;
      //to localeDateString can be used to set format of Date
      //it is a feature of Javascript
    let options={
        weekday:"long",
        day: "numeric",
        month:"long",
        year:"numeric"
      };
     
      day=today.toLocaleDateString("en-US",options);
     
        
        res.render('homeTech',{uname:req.params.email,dates:day})
      
  })
  //for teachers to delete Internships
  app.get('/delete/:internid/:email',(req,res)=>{
    let decryptStri=cryptr.decrypt(req.params.email);
    //console.log("The email parameter recieved is "+decryptStri)
    internship.deleteOne({addedby:decryptStri,internid:req.params.internid},(err,result)=>{
      if(err){
        return handleError(err);
      }
      else{
       // res.send(result)
       selection.deleteOne({internid:req.params.internid},(erro,ress)=>{
         if(erro){
           return handleError(erro);
         }
         else{
             res.redirect('/addedInter/'+req.params.email)
         }
       })
     
      }
    })
  })
  //application of Internship page for students
  app.get('/applyIntern/:usn',(req,res)=>{
      let resu=new Array();
    const today=require('./date.js')
          let decryptStri=cryptr.decrypt(req.params.usn)
    selection.find({applys:{$nin:[decryptStri]}},(err,results)=>{
       if(err){
         return handleError(err);
       }
       else{
        let j=0;
        let leng=results.length;
        for(let i=0;i<leng;i++){
         if ((results[i].duedate)>=(today)){
          console.log("Due Over not")
          console.log(results[i])
           resu[j]=results[i];
           j++;
         }
        }
       res.render('applyInterns',{skills:resu,usn:req.params.usn})
        
              }

            })
  })
  //applying for internships
  app.get('/applied/:internid/:usn',(req,res)=>{
    let decryptStri=cryptr.decrypt(req.params.usn);
    let ids= req.params.internid;
    selection.find({internid:ids},(err,result)=>{
        if(err){
            return handleError(err);
        }
        else{
           selection.updateOne({'internid':ids},{$push:{applieds:decryptStri,applys:decryptStri}},(err,results)=>{
               if(err){
                   console.log(err)
               }
               else{
                res.redirect("/applyIntern/"+req.params.usn)
               }
           })
          
        }
    })
    
  })
  //students can view internship Details through this
app.get('/internshi/:internid/:usn',(req,res)=>{
  internship.findOne({internid:req.params.internid},(err,result)=>{
    if(err){
      return handleError(err);
    }
    else{
      
      res.render("SeeInterns",{skills:result,usn:req.params.usn})
    }
  })
})

 //route for selections of students
 app.get('/internselections/:techemail/:internid',(req,res)=>{
  let decryptStri=cryptr.decrypt(req.params.techemail)
  let apply=new Array();
  selection.find({internid:req.params.internid},(err,result)=>{
    if(err){
      return handleError(err);
    }
    else{
          //console.log(result[0].applieds)
      res.render('sappliedstudents',{idno:req.params.internid,skills:result[0].applieds,mail:req.params.techemail})
        }
  })
 })
 //nodemailer transporter setup
 const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'internportdsce2020@gmail.com',
    pass: 'intern@2020' // naturally, replace both with your real credentials or an application-specific password
  }
});
//nodemailer hbs
//transporter.use('compile',hbs({
  //viewEngine:'express-handlebars',
 // viewPath:"./views/"
//}))

//post of student selection
 app.post("/accepted/:internid/:internselect/:techmail",(req,res)=>{
  let idss=req.params.internid;
  let techmails=cryptr.decrypt(req.params.techmail);
  selection.updateOne({'internid':idss},{$push:{selected:req.params.internselect}},(err1,response)=>{
      if(err1){
        return handleError(err1);
      }
      else{
        console.log(response)
      }
  })
  selection.updateOne({'internid':idss},{$pull:{applieds:{$in:req.params.internselect}}},(err2,response2)=>{
    if(err2){
      return handleError(err2)
    }
    else{
      console.log(response2)
    }
  })
  res.redirect('/sendMail/'+idss+'/'+techmails+'/'+req.params.internselect)
})
//mail sending
app.get('/sendMail/:internid/:techmail/:studusn',(req,res)=>{
teachers=cryptr.encrypt(req.params.techmail);

  internship.findOne({internid:req.params.internid},(err2,inter)=>{

    if(err2){
      return handleError(err2);
   
    }
    else{
      inters=JSON.parse(JSON.stringify(inter));
    
      teach.findOne({email:req.params.techmail},(err3,teacher)=>{
        if(err3){
          return handleError(err);
        }
        let  name=teacher.uname;
        let  email=teacher.email;
        let usnemail='';
        stud.findOne({usn:req.params.studusn},async(err4,ress)=>{
              if(err4){
                return handleError(err4)
              }
              else{
                   usnemail=ress.email;
                   let data = await ejs.renderFile(__dirname + "/views/mail.ejs", { interninfo:inter,name:name,email:email });
                  
                   const mailOptions = {
                    from: 'internportdsce2020@gmail.com',
                    to: usnemail,
                    subject: 'Notification on Selection to the Internship',
                   // html:"<html>"+"<body>"+"<p>Hi This is a notification You have Recieved from internport DSCE</p>"+
                    //"<p>You have been selected for the internship with following details</p>",
                    html:data
                  };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          console.log('Email sent: ' + info.response);
                        }
                      }); 
                      try {
                        await returnsPromise()
                      } catch (errors) {
                        console.log('That did not go well.')
                        throw errors
                      }   
              }
        })
       
        
      })
     }
   })  
   res.redirect("/internselections/"+teachers+"/"+req.params.internid) 
})

app.get("/studentDetail/:usn/:email",(req,res)=>{
  decryptStri=req.params.usn;
  let studDets=new Object();
  let skilleds=new Object();
  let interned=new Object();
  stud.findOne({usn:decryptStri},(err,student)=>{
    if(err){
      return handleError(err);
    }
    else{
      
      studDets=JSON.parse(JSON.stringify(student))
    
    }
})
Skills.find({usn:decryptStri},(err,skills)=>{
  if(err){
    return handleError(err);
  }
  else{
    skilleds=JSON.parse(JSON.stringify(skills))
    
  }
})
certifies.find({usn:decryptStri},(err,interns)=>{
  if(err){
    return handleError(err);
  }
  else{
    
    interned=JSON.parse(JSON.stringify(interns))
    res.render("Studdetails",{studDet:studDets,skills:skilleds,internss:interned})
  }
})
})
app.get('/selectedss/:internid/:techmail',(req,res)=>{
  console.log("selected"+req.params.techmail)
  selection.find({internid:req.params.internid},(err,result1)=>{
        if(err){
          return handleError(err);
        }
        else{
          console.log(result1[0].selected);
          res.render('seletedList',{skills:result1[0].selected,idno:req.params.internid,mail:req.params.techmail})
        }
  })
})
app.get("/studentDetail/AfterSelection/:internid/:usn/:email",(req,res)=>{
  decryptStri=req.params.usn;
  let studDets=new Object();
  let skilleds=new Object();
  let interned=new Object();
  stud.findOne({usn:decryptStri},(err,student)=>{
    if(err){
      return handleError(err);
    }
    else{
      
      studDets=JSON.parse(JSON.stringify(student))
    
    }
})
certifies.find({usn:decryptStri,internid:req.params.internid},(err,interns)=>{
  if(err){
    return handleError(err);
  }
  else{
    
    interned=JSON.parse(JSON.stringify(interns))
    console.log(interned)
    res.render("StuddetailsAfterSelection",{studDet:studDets,internss:interned})
  }
})
})
//demo for date
app.get('/date',(req,res)=>{
  const today=require('./date.js')
  
})
app.listen(3000,function(){
    console.log("Server 8080 running at your service");
})
