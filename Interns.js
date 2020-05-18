const mongoose = require('mongoose')

const InternshipAdd= mongoose.Schema({
    internid:"String",
    duedate:"String",
    applieds:[],
    applys:[],
    selected:[]
});

module.exports =mongoose.model('Selection',InternshipAdd);