'use strict';
var mongoose = require('mongoose');
var EventSchema = mongoose.Schema({
    date: {type: String},
    day: {type: String},
    from: {type: String},
    to: {type: String},
    activity: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        trim: true
    },
    tutorsText: {
        type: String,
        trim: true
    },
    tutors: [mongoose.Schema.Types.ObjectId],
    placesText: {
        type: mongoose.Schema.Types.Mixed,
        trim: true
    },
    places: [mongoose.Schema.Types.ObjectId],
    groupsText: {
        type: mongoose.Schema.Types.Mixed,
        trim: true
    },
    groups: [mongoose.Schema.Types.ObjectId],
    note: {
        type: mongoose.Schema.Types.Mixed,
        trim: true
    },
    fields: {type: mongoose.Schema.Types.ObjectId},
    blockBegin: {type: String},
    blockEnd: {type: String},
    custom: {
        type: Boolean,
        default: false
    }
});
module.exports = mongoose.model('Event', EventSchema);