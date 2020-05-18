const mongoose = require('mongoose')

const InternshipAdd= mongoose.Schema({
    addedby:"String",
    internid:"String",
    internname:"String",
    company:"String",
    duration:"String",
    typofwork:"String",
    Skills:"String",
    stifund:"String",
    DailyWorkdur:"String",
    duedate:"String",
   
});

module.exports =mongoose.model('InternshipAdded',InternshipAdd);