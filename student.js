const mongoose = require('mongoose')

const Student= mongoose.Schema({
    usn:"String",
    password:"String",
    email:"String",
    name:"String",
    semester:"String",
    section:"String",
    contc:"String",
    cgpa:"String",
   
});

module.exports =mongoose.model('SignupStud',Student);