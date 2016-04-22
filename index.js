'use strict';

var models = require('uekplan-models'),

    winston = require('winston');

var fs = require('fs');
var jsonfile = require('jsonfile');
var util = require('util');
winston
    .add(winston.transports.File, {filename: './logs.json', level: 'debug'})
    .remove(winston.transports.Console);


models.sequelize.sync().then(function () {
    console.log('Connection to database established.');
    new Promise((resolve, reject)=> {
        if (fs.existsSync('./data.json')) {
            console.log('Cache:read');
            resolve(JSON.parse(fs.readFileSync('./data.json')));
        } else {
            models.label.findAll({order: [['key', 'DESC']]})
                .then((data) => {
                    var labels = {};
                    data.forEach((element)=> {
                        try {
                            labels[element.dataValues.timetableId || element.dataValues.key] = element.dataValues;
                        } catch (err) {
                            console.log(err);
                        }
                    });
                    resolve(require('./transform')(labels));
                })
                .catch((err)=> {
                    reject(err);
                });
        }
    })
        .then((data)=> {
            console.log('Cache:write');
            fs.writeFileSync('./data.json', JSON.stringify(data));
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
                    for (var i = 0; i < timetable.events.length; i++) {


                        var name = findTutorNameInRoomsFromEvent(timetable.events[i]);
                        if (typeof name !== 'string') {
                            name = findTutorNameInGroupsFromEvent(timetable.events[i]);
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
        })

        .then((data)=> {
            return require('./transformLabels')(data);
        })
        .then((data)=> {
            return new Promise((resolve, reject)=> {
                return require('./loadLabels')(data.labels)
                    .then((labels)=> {
                        data.labels = labels;
                        resolve(data);
                    })
                    .catch((err)=> {
                        reject(err)
                    });
            });
        })
        .then((data)=> {

            require('./transformEvents')(data)
                .then((events)=> {
                    require('./loadEvents')(events)
                        .then((data)=> {
                            process.exit();

                        }).catch((err)=> {
                        console.log(err);
                        process.exit();
                    });
                })
                .catch((err)=> {
                    console.log(err);
                    process.exit();
                });

        }).catch((err)=> {
        console.log(err);
        process.exit();

    });
});


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