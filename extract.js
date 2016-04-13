"use strict";

var xml2js = require('xml2js'),
    rp = require('request-promise');
var querystring = require('querystring');
/**
 *
 * @param input
 * @return {Promise}
 */
function parseData(input) {
    return new Promise((resolve, reject)=> {
        new xml2js.Parser().parseString(input, function (err, stdout, stderr) {
            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
};
/**
 *
 * @param data
 * @return {string|*|SchemaType}
 * @todo refactor and use in other places
 */
function extractValue(data) {
    if (typeof data === 'object') {
        if (data instanceof Array) {
            if (typeof data[0] === 'string') {
                return data[0];
            } else {
                return data[0]['_'];
            }
        } else {
            return;
        }
    } else {
        return;
    }
};
/**
 *
 * @param data
 * @return {Array}
 */
function extractList(data) {
    var list = [];
    data['plan-zajec']['zasob'].forEach((element)=> {
        list.push({
            id: element['$']['id'],
            name: element['$']['nazwa'],
            type: element['$']['typ'],
            group: data['plan-zajec']['$']['grupa']
        });
    });
    return list;
};
/**
 *
 * @param a
 * @param b
 * @return {number}
 */
function sortData(a, b) {
    return b.name.length - a.name.length;
};
/**
 *
 * @param url {string}
 * @return {Promise}
 */
function download(url) {
    return new Promise((resolve, reject)=> {
        rp.get('http://planzajec.uek.krakow.pl/index.php' + url)
            .then((data)=> {
                resolve(parseData(data));
            })
            .catch((err)=> {
                reject(err);
            });
    });
};
/**
 *
 * @param data
 * @return {Array}
 */
function extractSections(data) {
    var sections = [];
    data['plan-zajec']['grupowanie'].forEach((item)=> {
        sections.push({
            type: item['$']['typ'],
            group: item['$']['grupa'],
        });
    });
    return sections;
};
/**
 *
 * @param taskij
 * @returns {Promise}
 */
exports.getSectionsList = function () {
    return new Promise((resolve, reject)=> {
        download('?xml')
            .then((data)=> {
                resolve(extractSections(data).sort((a, b)=> {
                    return b.group.length - a.group.length;
                }));
            })
            .catch((err)=> {
                console.log('Wystąpił błąd podczas pobierania sekcji.', err);
                reject(err);
            });
    });
};
/**
 *
 * @param task {type: String, group: String}
 * @returns {Promise}
 */
exports.getSection = function (section) {
    return new Promise((resolve, reject)=> {
        rp.get({
            url: 'http://planzajec.uek.krakow.pl/index.php',
            qs: {typ: section.type, grupa: section.group, xml: true}
        })
            .then((data)=> {
                return parseData(data);
            })
            .then((data)=> {
                resolve(extractList(data));
            })
            .catch((err)=> {
                console.log('Wystąpił błąd podczas pobierania sekcji:', err);
                reject(err);
            });
    });
};
/**
 *
 * @return {Promise}
 */
exports.getLecturersList = function () {
    return new Promise((resolve, reject)=> {
        download('?typ=N&xml')
            .then((data)=> {

                resolve(extractList(data).sort((a, b) => {
                    return sortData(a, b);
                }));

            })
            .catch((err)=> {
                console.log('Wystąpił błąd podczas pobierania listy nauczycieli', err);
                reject(err);
            });
    });
};
/**
 * @returns {Promise}
 */
exports.getGroupsList = function () {
    return new Promise((resolve, reject)=> {
        download('?typ=G&xml')
            .then((data)=> {
                resolve(extractList(data).sort((a, b)=> {
                    return sortData(a, b);
                }));
            })
            .catch((err)=> {
                console.log('Wystąpił błąd podczas pobierania listy grup.', err);
                reject(err);
            });
    });
};
/**
 *
 * @return {Promise}
 */
exports.getRoomsList = function () {
    return new Promise((resolve, reject)=> {
        download('?typ=S&xml')
            .then((data)=> {
                resolve(extractList(data).sort((a, b)=> {
                    return sortData(a, b);
                }));
            })
            .catch((err)=> {
                console.log('Wystąpił błąd podczas pobierania listy sal', err);
                reject(err);
            });
    });
};
/**
 *
 * @return {Promise}
 */
exports.getFields = function () {
    return new Promise((resolve, reject)=> {
        getSections()
            .then((data)=> {
                var list = [];
                data.forEach((element)=> {
                    if (element.type === 'G') {
                        list.push(element.name);
                    }
                })
                resolve(list);
            })
            .catch((err)=> {
                reject(err);
            });
    });
};
/**
 *
 * @return {Promise}
 */
exports.getBuildings = function () {
    return new Promise((resolve, reject)=> {
        getSections()
            .then((data)=> {
                var list = [];
                data.forEach((element)=> {
                    if (element.type === 'S') {
                        list.push(element.name);
                    }
                })
                resolve(list);
            })
            .catch((err)=> {
                reject(err);
            });
    });
};
/**
 *
 * @param data
 * @param type
 * @param name
 * @return {Array:{date: String, day: String, from: String, to: String, activity: String, type: String, tutor: String, group: String, place: String, note: String}}
 */
function extractTimetableEvents(data, type, name) {
    var events = [];
    if (data) {
        data.forEach((event)=> {
            switch (type) {
                case 'G':
                    event['grupa'] = name;
                    break;
                case 'N':
                    event['nauczyciel'] = name;
                    break;
                case 'S':
                    event['sala'] = name;
                    break;
                default:
                    throw new Error();
                    break;
            }
            events.push({
                date: extractValue(event['termin']),
                day: extractValue(event['dzien']),
                from: extractValue(event['od-godz']),
                to: extractValue(event['do-godz']),
                name: extractValue(event['przedmiot']),
                type: extractValue(event['typ']),
                tutor: extractValue(event['nauczyciel']),
                group: extractValue(event['grupa']),
                place: extractValue(event['sala']),
                note: extractValue(event['uwaga'])
            });
        });
    }
    return events;
};
/**
 *
 * @param data
 * @return {{id: number|undefined, type: String, name: String, moodle: number|undefined, events: Array}}
 */
function extractTimetable(data) {
    return {
        id: data['plan-zajec']['$']['id'],
        type: data['plan-zajec']['$']['typ'],
        name: data['plan-zajec']['$']['nazwa'],
        moodle: data['plan-zajec']['$']['idcel'],
        events: extractTimetableEvents(data['plan-zajec']['zajecia'], data['plan-zajec']['$']['typ'], data['plan-zajec']['$']['nazwa'])
    };
};
/**
 *
 * @param task
 * @returns {Promise}
 */
exports.getTimetableOf = function (timetable) {
    return new Promise((resolve, reject)=> {
        download('?typ=' + timetable.type + '&id=' + timetable.id + '&okres=3&xml')
            .then((data)=> {

                resolve(extractTimetable(data));
            })
            .catch((err)=> {
                console.log('Wystąpił błąd podczas pobierania planu zajęć dla: ', timetable);
                reject(timetable);
            });
    });
};