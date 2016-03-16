"use strict";
var rp = require('request-promise'),
    xml2js = require('xml2js'),
    mongoose = require('mongoose'),
    Event = require('./event'),
    async = require('async');


mongoose.connect('mongodb://localhost/uek-etl');

var db = mongoose.connection;

var list = {
        tutors: [],
        places: [],
        groups: []
    },
    events = {
        'N': [],
        'G': [],
        'S': []
    }    ;

db.on('error', () => {
    console.error.bind(console, 'connection error:');
});
db.once('open', () => {
    console.log('Connection to database established.');
});

Event.remove().then((data)=> {
    console.log('Removed events');
});
/**
 *
 * @param input
 * @returns {Promise}
 */
function parseXmlToJS(input) {
    return new Promise((resolve, reject)=> {
        new xml2js.Parser().parseString(input, function (err, stdout, stderr) {
            if (err) reject(err);
            resolve(stdout);
        });
    });
};
// /**
//  *
//  * @param data
//  * @returns {Array}
//  */
// function transformTutorsData(data) {
//     var i, j, list = [];
//     // titlesBefore = [
//     //     'prof. dr hab. inż.',
//     //     'mgr inż. arch krajob',
//     //     'prof. UEK dr hab.',
//     //     'prof. dr hab.',
//     //     'prof. UEK',
//     //     'dr hab. inż.',
//     //     'dr hab.',
//     //     'dr inż.',
//     //     'mgr inż.',
//     //     'prof.',
//     //     'mgr',
//     //     'dr',
//     //     'inż.',
//     //     ''];
//
//
//     for (i = 0; i < data['plan-zajec']['zasob'].length; i++) {
//         // for (j = 0; j < titlesBefore.length; j++) {
//         //     // if (data['plan-zajec']['zasob'][i]['$']['nazwa'].includes(', ' + titlesBefore[j])) {
//         //     //     var d = data['plan-zajec']['zasob'][i]['$']['nazwa'].replace(', ' + titlesBefore[j], '').split(' ');
//         //     //
//         //     //     data['plan-zajec']['zasob'][i]['$']['nazwa'] = titlesBefore[j]
//         //     //         .concat(' ' + d[d.length - 1] + ' ' + d.filter((val)=> {
//         //     //                 return val !== d[d.length - 1];
//         //     //             })).toString().replace(',', ' ').trim();
//         //     // }
//         // }
//         list.push({
//             id: data['plan-zajec']['zasob'][i]['$']['id'],
//             name: data['plan-zajec']['zasob'][i]['$']['nazwa']
//         });
//     }
//     return list;
// }
/**
 *
 * @param data
 * @returns {Array}
 */
function transformDefaultData(data) {
    var i, dataList = [];
    for (i = 0; i < data['plan-zajec']['zasob'].length; i++) {
        dataList.push({
            id: data['plan-zajec']['zasob'][i]['$']['id'],
            name: data['plan-zajec']['zasob'][i]['$']['nazwa'],
            type: data['plan-zajec']['zasob'][i]['$']['typ']
        });
    }
    return dataList;
}
/**
 *
 * @param a
 * @param b
 * @returns {number}
 */
function sortData(a, b) {
    return b.name.length - a.name.length;
}
/**
 *
 * @returns {Promise}
 */
function getTutorsList() {
    return new Promise((resolve, reject)=> {
        rp.get('http://planzajec.uek.krakow.pl/index.php?typ=N&xml').then((data)=> {
            console.log('Downloaded tutors list');
            return parseXmlToJS(data);
        }).then((data)=> {
            resolve(transformDefaultData(data).sort((a, b) => {
                return sortData(a, b);
            }));
        }).catch((err)=> {
            console.log('Wystąpił błąd podczas pobierania listy nauczycieli');
            reject(err);
        });
    });
}
/**
 *
 * @returns {Promise}
 */
function getPlacesList() {
    return new Promise((resolve, reject)=> {
        rp.get('http://planzajec.uek.krakow.pl/index.php?typ=S&xml').then((data)=> {
            return parseXmlToJS(data);
        }).then((data)=> {
            console.log('Downloaded places list');
            resolve(transformDefaultData(data).sort((a, b)=> {
                return sortData(a, b);
            }));
        }).catch((err)=> {
            console.log('Wystąpił błąd podczas pobierania listy sal');
            reject(err);
        });
    });
}
/**
 *
 * @returns {Promise}
 */
function getGroupsList() {
    return new Promise((resolve, reject)=> {
        rp.get('http://planzajec.uek.krakow.pl/index.php?typ=G&xml').then((data)=> {
            return parseXmlToJS(data);
        }).then((data)=> {
            console.log('Downloaded groups list');
            resolve(transformDefaultData(data).sort((a, b)=> {
                return sortData(a, b);
            }));
        }).catch((err)=> {
            console.log('Wystąpił błąd podczas pobierania listy grup');
            reject(err);
        });
    });
}
// /**
//  * ucięcie częsci z tytułem  pocięcie  na tablice co spacje
//  *
//  * @param data
//  * @param x
//  * @returns {Array}
//  */
// function transformTutorsToArray(str, tutors) {
//     var i, index, str, splitedStr = [], list = [];
//     splitedStr = str.split(', ');
//     for (i = 0; i < tutors.length; i++) {
//         index = 0;
//         do {
//             if (splitedStr[index].includes(tutors[i].name)) {
//                 splitedStr[index].replace(tutors[i].name, '');
//                 list.push(tutors[i]);
//                 break;
//             }
//             index++;
//         } while (index < splitedStr.length);
//         if (splitedStr.length === list.length) {
//             break;
//         }
//     }
//     return list;
// }
/**
 *
 * @param typ
 * @param id
 * @returns {Promise}
 */
function getTimetableOf(task) {
    var blockBegin = [
            '7:50',
            '8:45',
            '9:35',
            '10:30',
            '11:20',
            '12:15',
            '13:05',
            '14:00',
            '14:50',
            '15:40',
            '16:30',
            '17:20',
            '18:10',
            '19:00',
            '19:50'
        ],
        blockEnd = [
            '8:35',
            '9:30',
            '10:20',
            '11:15',
            '12:05',
            '13:00',
            '13:50',
            '14:45',
            '15:35',
            '16:25',
            '17:15',
            '18:05',
            '18:55',
            '19:45',
            '20:35'
        ];
    return new Promise((resolve, reject)=> {
        rp.get('http://planzajec.uek.krakow.pl/index.php?typ=' + task.type + '&id=' + task.id + '&okres=3&xml')
            .then((data)=> {
                // console.log('Pobrano plan zajeć dla: ', task);
                return parseXmlToJS(data);
            }).then((data)=> {
                // var i, events, index;

                // var getTutor = function (data) {
                //     if (typeof data[0] === 'string') {
                //         return data[0];
                //     } else {
                //         return data[0]['_'];
                //     }
                // }
                // if (data['plan-zajec']['zajecia']) {
                //     for (i = 0; i < data['plan-zajec']['zajecia'].length; i++) {
                //
                //         var index = blockBegin.indexOf(data['plan-zajec']['zajecia'][i]['od-godz'][0]);
                //         events = {};
                //         do {
                //             try {
                //
                //                 events = {
                //                     termin: data['plan-zajec']['zajecia'][i]['termin'][0],
                //                     dzien: data['plan-zajec']['zajecia'][i]['dzien'][0],
                //                     'od-godziny': data['plan-zajec']['zajecia'][i]['od-godz'][0],
                //                     'do-godziny': data['plan-zajec']['zajecia'][i]['do-godz'][0],
                //                     przedmiot: data['plan-zajec']['zajecia'][i]['przedmiot'][0],
                //                     typ: data['plan-zajec']['zajecia'][i]['typ'][0],
                //                     nauczyciel: data['plan-zajec']['zajecia'][i]['nauczyciel'],
                //
                //                     // nauczyciel: transformTutorsToArray(getTutor(data['plan-zajec']['zajecia'][i]['nauczyciel']), tutors),
                //                     // grupa: (data['plan-zajec']['zajecia'][i]['grupa']) ? data['plan-zajec']['zajecia'][i]['grupa'][0] : (data['plan-zajec']['$']['typ'] === 'G') ? data['plan-zajec']['$']['nazwa'] : '',
                //                     // sala: (data['plan-zajec']['zajecia'][i]['sala']) ? data['plan-zajec']['zajecia'][i]['sala'][0] : (data['plan-zajec']['$']['typ'] === 'S') ? data['plan-zajec']['$']['nazwa'] : '',
                //                     // uwaga: (data['plan-zajec']['zajecia'][i]['uwaga']) ? data['plan-zajec']['zajecia'][i]['uwaga'][0] : '',
                //                     blockBegin: blockBegin[index],
                //                     blockEnd: blockEnd[index]
                //                 };
                //             } catch (err) {
                //                 console.log(err);
                //             }
                //
                //             index++;
                //             // Event.create(events)
                //             //     .then((data)=> {
                //             //         // console.log(data);
                //             //     }).catch((err)=> {
                //             //     // console.log(err);
                //             // });
                //         } while (blockBegin[index] < data['plan-zajec']['zajecia'][i]['do-godz'][0]);
                //     }
                // }

                return resolve(data);
            })
            .catch((err)=> {
                console.log('Wystąpił błąd podczas pobierania planu zajęć dla: ', task);
                reject(task);
            });
    });
};


//wystarczy pobrać pełen plan z 2 źródeł aby przy porównywaniu znaleźć wspólną całośc
// insert or update upsert


// q.empty = function () {
//     console.log('Empty all items have been processed', events.length);
//     process.exit();
// }
// assign a callback


Promise
    .all([getTutorsList(), getPlacesList(), getGroupsList()])
    .then((data)=> {
        return new Promise((resolve, reject)=> {
            var i, downloadQueue, interval, index = 0, started;
            list.tutors = data[0];
            list.places = data[1];
            list.groups = data[2];
            downloadQueue = async.queue(function (task, callback) {
                getTimetableOf(task)
                    .then((data)=> {
                        events[task.type].push(data);
                        callback();
                    })
                    .catch((err)=> {
                        console.log(err);
                        //powtórne dodanie do kolejki
                        downloadQueue.push(task);
                        callback();
                    });
            }, 20);
            downloadQueue.pause();
            downloadQueue.drain = function () {
                console.log('All timetables has been downloaded. Elapsed time in secconds:', (Date.now() - started) / 1000);
                clearInterval(interval);
                resolve();
            };
            /**
             * add groups places and tutors list elements to timetable download queue
             */
            Object.keys(list).forEach((item)=> {
                // for (i = 0; i < list[item].length; i++, index++) {
                for (i = 0; i < 50; i++, index++) {

                    list[item][i].index = index;
                    downloadQueue.push(list[item][i]);
                }
            });
            started = Date.now(), downloadQueue.resume();
            console.log('Started downloading', index, 'timetables', 'with', downloadQueue.concurrency, 'workers');
            interval = setInterval(()=> {
                console.log('Remaing timetables to download:', downloadQueue.length() + downloadQueue.running());
            }, 1000);
        });
    })
    .then((data)=> {
        console.log('A tutaj powinna być magia porównywania :V');
        console.log(events);
        //
        // for (var i = 0; i < events.length; i++) {
        //     // console.log(events[i]['plan-zajec']['zajecia']);
        // }
        process.exit();
    })
    .catch((err)=> {
        console.log(err);
        process.exit();
    });




