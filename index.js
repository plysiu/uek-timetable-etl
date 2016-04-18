'use strict';
var mongoose = require('mongoose'),
    Event = require('uekplan-models/event'),
    Label = require('uekplan-models/label'),

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

    var labels = {};

    new Promise((resolve, reject)=> {

        if (fs.existsSync('./data.json')) {
            console.log('Cache:read');
            resolve(JSON.parse(fs.readFileSync('./data.json')));
        } else {

            Label.find()
                .then((data) => {
                    data.forEach((element)=> {
                        labels[element.id] = element.toObject({hide: 'createdAt'});
                    });
                    resolve(require('./transform')(labels));
                })
                .catch((err)=> {
                    reject(err);
                });
        }
    })
        .then((data)=> {
            // try {
            //     JSON.parse(fs.readFileSync('./data.json'));
            // } catch (err) {
            console.log('Cache:write');

            fs.writeFileSync('./data.json', JSON.stringify(data));
            // }
            return data;
        })


        .then((data)=> {


                function updateLabelsValue(labels, timetables) {
                    console.log('Start:updateLabelsValue');


                    function FindLabelId(key) {
                        key = key.trim();
                        for (var label in labels) {
                            if (labels[label].key === key || labels[label].value === key) {
                                return label;
                            }
                        }
                        return;
                    }

                    /**
                     * @todo jeśli ta sama nazwa trzeba sprawdzić czy id się zgadza
                     * @param eventQuery
                     * @returns {EventSchema.tutor|{type}|*}
                     */
                    function findTutorNameInRoomsFromEvent(eventQuery) {
                        var id = FindLabelId(eventQuery.place);
                        if (eventQuery && id && timetables.S[id].events) {


                            for (var i = 0; i < timetables.S[id].events.length; i++) {
                                // console.log(eventQuery, timetables.S[id].events[i]);

                                if (eventQuery.date = timetables.S[id].events[i].date &&
                                    eventQuery.from === timetables.S[id].events[i].from) {

                                    return timetables.S[id].events[i].tutor;
                                }
                            }

                            return;

                        }
                    }

                    function findTutorNameInGroupsFromEvent(eventQuery) {
                        var id = FindLabelId(eventQuery.group);

                        if (eventQuery && id && timetables.G[id].events) {
                            timetables.G[id].events.forEach((event)=> {
                                if (eventQuery.date === event.date &&
                                    eventQuery.from === event.from) {
                                    return event.tutor;
                                }
                            });
                            return;
                        }
                    }

                    function findReplacmentNameForTutor(timetable) {
                        for(var i =0;i < timetable.events.length ;i++){



                           var name = findTutorNameInRoomsFromEvent( timetable.events[i]);
                            if (typeof name !== 'string') {
                                name = findTutorNameInGroupsFromEvent( timetable.events[i]);
                            }
                            if (typeof name === 'string') {
                                // console.log(typeof name, name);

                                return name;
                            }
                    }

                        return;
                    };
                    /**
                     * Adds new rule if found reversed tutor name
                     */
                    var i = 0;
                    for (var label in labels) {


                        if (labels[label].type === 'N') {
                            try {
                                var x = findReplacmentNameForTutor(timetables.N[label]);
                                if (typeof x !== 'undefined') {
                                    labels[label].value = x;
                                }
                            } catch (err) {
                                console.log(labels[label], label, err);
                            }
                        }
                        i++;
                        if (i === 3) {
                            // break;

                        }
                    }
                    console.log('stop:updateLabelsValue');

                    return labels;
                }

                data.labels = updateLabelsValue(data.labels, data.timetables);
                return data;
            }
        )


        .then((data)=> {
            console.log('Labels:add:start');
            return new Promise((resolve, reject)=> {
                var x = [];
                for (var item in data.labels) {
                    x.push(Label.findOneAndUpdate({key: data.labels[item].key}, data.labels[item], {upsert: true}))
                }
                Promise.all(x)
                    .then(()=> {
                        console.log('Labels:add:stop');
                        resolve(data);
                    }).catch((err)=> {
                    reject(err);
                })
            });
        })
        .then((data)=> {
            return new Promise((resolve, reject)=> {
                console.log('Labels:parrentUpdate:start');
                Label.find()
                    .or([{type: 'F'}, {type: 'B'}, {type: 'C'}])
                    .then((res)=> {
                        var x = [];
                        res.forEach((item)=> {
                            x.push(Label.update({parentText: item.key}, {parentId: item._id}, {
                                multi: true,
                                upsert: true
                            }));
                        });
                        Promise.all(x).then(()=> {
                            console.log('Labels:parrentUpdate:stop');
                            resolve(data);
                        });
                    })
                    .catch((err)=> {
                        reject(err);
                    })
            })
        }).then((data)=> {
            console.log('Timetables:addMongoId:start');
            // console.log(data.labels);

        })
        .catch((err)=> {
            console.log(err);
            process.exit();

        });
})
;


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
