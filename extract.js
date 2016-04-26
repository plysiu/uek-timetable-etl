"use strict";
var xml2js = require('xml2js'),
    rp = require('request-promise'),
    querystring = require('querystring'),
    async = require('async');

/**
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
}
/**
 * @param data
 * @return {string|*|SchemaType}
 */
function extractValue(data) {
    if (data) {
        if (data instanceof Array) {
            if (typeof data[0] === 'string') {
                return data[0];
            } else {
                return data[0]['_'];
            }
        } else {
            if (typeof data === 'string') {
                return data;
            } else {
                console.log('Wystąpił błąd podczas transformacji wartości:', typeof data, data);
            }
        }
    } else {
        // console.log('Wystąpił błąd podczas transformacji wartości:', typeof data, data);
    }
}
/**
 * @param data
 * @return {Array}
 */
function extractList(data) {
    var list = [];
    data['plan-zajec']['zasob'].forEach((element)=> {
        list.push({
            timetableId: element['$']['id'],
            name: element['$']['nazwa'],
            type: element['$']['typ'],
            group: data['plan-zajec']['$']['grupa']
        });
    });
    return list;
}
/**
 * @param a
 * @param b
 * @return {number}
 */
function sortData(a, b) {
    return b.name.length - a.name.length;
}
/**
 * @param url {sring}
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
}
/**
 * @param data
 * @return {Array}
 */
function extractSections(data) {
    var sections = [];
    data['plan-zajec']['grupowanie'].forEach((item)=> {
        sections.push({
            type: item['$']['typ'],
            group: item['$']['grupa']
        });
    });
    return sections;
}
/**
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
 * @param section P{type: string, group: string}}
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
                });
                resolve(list);
            })
            .catch((err)=> {
                reject(err);
            });
    });
};
/**
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
                });
                resolve(list);
            })
            .catch((err)=> {
                reject(err);
            });
    });
};
/**
 * @param data
 * @param type
 * @param name
 * @return {Array}
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
}
/**
 * @param data
 * @return {{timetableId: number, type: string, name: string, moodle: number, events: Array}}
 */
function extractTimetable(data) {
    return {
        timetableId: data['plan-zajec']['$']['id'],
        type: data['plan-zajec']['$']['typ'],
        name: data['plan-zajec']['$']['nazwa'],
        moodle: data['plan-zajec']['$']['idcel'],
        events: extractTimetableEvents(data['plan-zajec']['zajecia'], data['plan-zajec']['$']['typ'], data['plan-zajec']['$']['nazwa'])
    };
}
/**
 * @param timetable {{timetableId: string, type: string, name: string, group: undefined}}
 * @return {Promise}
 */
exports.getTimetableOf = function (timetable) {
    return new Promise((resolve, reject)=> {
        download('?typ=' + timetable.type + '&id=' + timetable.timetableId + '&okres=3&xml')
            .then((data)=> {
                resolve(extractTimetable(data));
            })
            .catch((err)=> {
                console.log('Wystąpił błąd podczas pobierania planu zajęć dla: ', timetable);
                reject(timetable);
            });
    });
};
/**
 *
 * @returns {Promise}
 */
exports.downloadAll = function () {
    return new Promise((resolve, reject) => {
        Promise.all([
            this.getLecturersList(),
            this.getRoomsList(),
            this.getGroupsList(),
            this.getSectionsList()])
            .then((list) => {
                var downloadQueue, interval, started,
                    index = 0,
                    sections = [],
                    timetables = {
                        'N': {}, 'S': {}, 'G': {}
                    };
                downloadQueue = async.priorityQueue((task, callback) => {
                    if (typeof task.group !== 'undefined') {

                        this.getSection(task)
                            .then((data) => {
                                sections = sections.concat(data);
                                data.forEach((addTask) => {
                                    if (!timetables[addTask.type] && !timetables[addTask.type][addTask.timetableId]) {
                                        downloadQueue.push(addTask, 2, (err) => {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                    }
                                });
                                callback();
                            })
                            .catch((err) => {
                                downloadQueue.push(task, 1, (err) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                                callback();
                            });
                    } else {
                        this.getTimetableOf(task)
                            .then((data) => {
                                timetables[data.type][data.timetableId] = data;
                                callback();
                            })
                            .catch((err) => {
                                downloadQueue.push(task, 2, (err) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    }
                                );
                                callback();
                            });
                    }
                }, process.env.UEKPLAN_CONCURRENT || 100);


                list.forEach((tasks) => {
                    index += tasks.length;
                    tasks.forEach((task) => {
                        downloadQueue.push(task, task.group ? 1 : 2);
                    });
                });

                started = Date.now();
                console.log('Started downloading', index, 'elements', 'with', downloadQueue.concurrency, 'workers');
                interval = setInterval(() => {
                    console.log('Remaing elements to download:', downloadQueue.length() + downloadQueue.running());
                }, 2500);
                downloadQueue.drain = () => {
                    downloadQueue.kill();
                    clearInterval(interval);
                    console.log('All elements has been downloaded. Elapsed time in secconds:', (Date.now() - started) / 1000);
                    resolve({
                        timetables: timetables,
                        sections: sections,
                        list: list
                    });
                };
            });
    });
}