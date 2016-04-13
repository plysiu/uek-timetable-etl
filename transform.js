"use strict";
var UEK = require('./extract'),
    async = require('async');
/**
 *
 * @param data
 * @return {Array}
 */
function explodeByPlacesFromEvent(data) {
    var i,
        events = [];
    //
    // if (data instanceof Array) {
    //     for (i = 0; i < data.length; i++) {
    //         events = events.concat(explodePlaces(data[i]));
    //     }
    // } else {
    //
    //     if (typeof data.place !== 'undefined') {
    //         for (i = 0; i < list.places.length; i++) {
    //             if (data.place.name.includes(list.places[i].name)) {
    //                 /**
    //                  * todo
    //                  */
    //                 data.place = data.place.replace(list.places[i].name, '');
    //                 var eventBlock = Object.assign({}, data);
    //                 eventBlock.place = list.places[i];
    //                 events.push(eventBlock);
    //             }
    //         }
    //
    //     } else {
    //         events.push(event);
    //     }

    // }
    return events;
}

/**
 *
 * @param data
 * @return {Array}
 */
function expoldeByTimeFromEvent(event) {
    var i,
        events = [];

    if (event instanceof Array) {
        event.forEach((item)=> {
            events = events.concat(expoldeByTimeFromEvent(item));
        });
    } else {
        var eventBlock,
            groups = [];
        if (typeof event.group !== 'undefined') {
            event.group.split(', ').forEach((item)=> {
                eventBlock = Object.assign({}, event);
                eventBlock.group = item;
                events.push(eventBlock);
            });
        } else {
            events.push(event);
        }
    }
    return events;
};
/**
 *
 * @param event
 * @return {Array}
 */
function expoldeByGroupFromEvent(event) {
    var i,
        events = [];
    if (event instanceof Array) {
        event.forEach((item)=> {
            events = events.concat(expoldeByGroupFromEvent(item));
        });
    }
    else {
        var eventBlock,
            timeBlocksBegins = [
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
            timeBlocksEnds = [
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
            ],
            i = timeBlocksBegins.indexOf(event.from);
        do {
            eventBlock = Object.assign({}, event);
            eventBlock.timeBlocksBegins = timeBlocksBegins[i];
            eventBlock.timeBlocksEnds = timeBlocksEnds[i];
            events.push(eventBlock);
            i++;
        } while (timeBlocksBegins[i] < eventBlock.to);
    }
    return events;
};
/**
 *
 * @return {Promise}
 */
function getTimetables() {
    return new Promise((resolve, reject)=> {

        Promise.all([
            UEK.getLecturersList(),
            UEK.getRoomsList(),
            UEK.getGroupsList(),
            UEK.getSectionsList()])
            .then((list)=> {

                try {

                    var downloadQueue, interval, started,
                        index = 0, sections = [],
                        timetables = {
                            'N': {},
                            'S': {},
                            'G': {}
                        };
                    downloadQueue = async.priorityQueue((task, callback) => {
                        if (typeof task.group !== 'undefined') {
                            UEK.getSection(task)
                                .then((data)=> {
                                    sections = sections.concat(data);
                                    data.forEach((addTask)=> {
                                        if (!timetables[addTask.type] && !timetables[addTask.type][addTask.id]) {
                                            downloadQueue.push(addTask, 2, (err)=> {
                                                if (err) {
                                                    console.log(err);
                                                }
                                            });
                                            callback();
                                        }
                                    });
                                    callback();
                                })
                                .catch((err)=> {
                                    downloadQueue.push(task, 1, (err)=> {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                    callback();
                                });
                        } else {
                            UEK.getTimetableOf(task)
                                .then((data)=> {
                                    timetables[data.type][data.id] = data;
                                    callback();
                                })
                                .catch((err)=> {
                                    downloadQueue.push(task, 2, (err)=> {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                    callback();
                                });
                        }
                    }, 200);


                    list.forEach((elements)=> {
                        index += elements.length;
                        elements.forEach((task)=> {
                            downloadQueue.push(task, task.group ? 1 : 2);

                        });
                    });

                    started = Date.now();
                    console.log('Started downloading', index, 'elements', 'with', downloadQueue.concurrency, 'workers');
                    interval = setInterval(()=> {
                        console.log('Remaing elements to download:', downloadQueue.length() + downloadQueue.running());
                    }, 2500);


                    downloadQueue.drain = () => {
                        downloadQueue.kill();
                        clearInterval(interval);
                        console.log('All elements has been downloaded. Elapsed time in secconds:', (Date.now() - started) / 1000);

                        resolve({
                            timetables: timetables,
                            // sections: sections,
                            // labels: lists
                        });
                    };

                } catch (err) {
                    console.log(err);
                }
            });
    });
}
;
exports.expoldeByGroupFromEvent = expoldeByGroupFromEvent;
/**
 *
 * @param event
 * @return {Array}
 */
exports.expoldeByTimeFromEvent = expoldeByTimeFromEvent;


/**
 *
 * @return {Promise}
 */
module.exports = function () {
    return new Promise((resolve, reject)=> {
        getTimetables()
            .then((data)=> {


                // function findTutorNameInRoomsFromEvent(eventQuery) {
                //     data.timetables.S[eventQuery.place].events.forEach((event)=> {
                //         if (eventQuery.date === event.date &&
                //             eventQuery.from === event.from &&
                //             event.tutor) {
                //             return event.tutor;
                //         }
                //     });
                //     return;
                // };
                // function findReplacmentNameForTutor(timetable) {
                //     timetable.events.forEach((event)=> {
                //         if (event.place) {
                //             return findTutorNameInRoomsFromEvent(event);
                //         }
                //     });
                //     return;
                // };
                /**
                 * Adds new rule if found reversed tutor name
                 */
                // for (var timetable in data.timetables.N) {
                //     console.log(data.timetables.N[timetable].name);
                //
                //     var name = findReplacmentNameForTutor(data.timetables.N[timetable]);
                //
                //     if (typeof name !== 'undefined') {
                //         data.timetables.N[timetable].name = name;
                //     }
                // }

                resolve(data);
            })
            .catch((err)=> {
                console.log(err);
                reject(err);
            });
    });
};