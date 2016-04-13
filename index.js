'use strict';
var mongoose = require('mongoose'),
    Event = require('./models/event'),
    async = require('async'),

    winston = require('winston');

var fs = require('fs');
var jsonfile = require('jsonfile');
var util = require('util');
winston
    .add(winston.transports.File, {filename: './logs.json', level: 'debug'})
    .remove(winston.transports.Console);


mongoose.connect('mongodb://localhost/uek-etl');

var db = mongoose.connection;


db.on('error', () => {
    console.error.bind(console, 'connection error:');
});
db.once('open', () => {
    console.log('Connection to database established.');
});
Event.remove().then((data)=> {
    console.log('Removed events');
});

//
// function transformTutorsData(data) {
//     var i, j, list = [],
//         titlesBefore = [
//             'prof. dr hab. inż.',
//             'mgr inż. arch krajob',
//             'prof. UEK dr hab.',
//             'prof. dr hab.',
//             'prof. UEK',
//             'dr hab. inż.',
//             'dr hab.',
//             'dr inż.',
//             'mgr inż.',
//             'prof.',
//             'mgr',
//             'dr',
//             'inż.',
//             ''];
//
//
//     for (i = 0; i < data['plan-zajec']['zasob'].length; i++) {
//         if (data['plan-zajec']['zasob'][i]['$']['moodle']) {
//
//             for (j = 0; j < titlesBefore.length; j++) {
//                 if (data['plan-zajec']['zasob'][i]['$']['nazwa'].includes(', ' + titlesBefore[j])) {
//                     var d = data['plan-zajec']['zasob'][i]['$']['nazwa'].replace(', ' + titlesBefore[j], '').split(' ');
//
//                     data['plan-zajec']['zasob'][i]['$']['nazwa'] = titlesBefore[j]
//                         .concat(' ' + d[d.length - 1] + ' ' + d.filter((val)=> {
//                                 return val !== d[d.length - 1];
//                             })).toString().replace(',', ' ').trim();
//                 }
//             }
//         } else {
//             console.log(data['plan-zajec']['zasob'][i]['$']);
//         }
//         list.push({
//             id: data['plan-zajec']['zasob'][i]['$']['id'],
//             name: data['plan-zajec']['zasob'][i]['$']['nazwa']
//         });
//     }
//     return list;
// }
//


// require('')
//wystarczy pobrać pełen plan z 2 źródeł aby przy porównywaniu znaleźć wspólną całośc
// insert or update upsert
//
//
// Promise
//     .all([UEK.getLecturers(),
//         UEK.getRooms(),
//         UEK.getGroups()])
//
//     .then(()=> {
//         return new Promise((resolve, reject)=> {
//             resolve(events = JSON.parse(fs.readFileSync('./data.json')));
//         });
//     })

// .then(()=> {
//     return new Promise((resolve, reject)=> {
//         resolve(fs.writeFileSync('./data.json', JSON.stringify(events)));
//     });
// })


// // // .then((data) => {
// // // console.log(data);
// // // return new Promise((resolve, reject)=> {
// // //     resolve();
// // // for (var type in events) {
// // //     events[type].forEach((timetable)=> {
// // //         eventsList = eventsList.concat(UEK.expoldeByGroupFromEvent(UEK.expoldeByTimeFromEvent(timetable.events)));
// // //     });
// // // }
// // // resolve(eventsList.length);
// // // });
// // // })
// //
// // .then((data)=> {
// //     console.log(data);
// //     process.exit();
// // })
// // .catch((err)=> {
// //     console.log(err);
// //     process.exit();
// // });
//
//
//
//
require('./transform')()
    .then((data)=> {

        console.log(data.timetables);
        process.exit();

    }).catch((err)=> {
    console.log(err);
    process.exit();

});
