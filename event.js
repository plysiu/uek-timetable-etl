'use strict';

var mongoose = require('mongoose');

var EventSchema = mongoose.Schema({
    termin: {type: String},
    dzien: {type: String},
    'od-godziny': {type: String},
    'do-godziny': {type: String},
    przedmiot: {type: String},
    typ: {type: String},
    nauczyciel: {type: String},
    sala: {type: String},
    grupa: {type: String},
    id:{type:Number},
    uwaga: {type: String},

    blockBegin: {type: String},
    blockEnd: {type: String}


});


module.exports = mongoose.model('Event', EventSchema);