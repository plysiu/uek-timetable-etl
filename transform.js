"use strict";
var UEK = require('./extract');
/**
 * @param labels
 * @returns {Promise}
 */
module.exports = function (labels) {
    return new Promise((resolve, reject) => {
        Promise.all([
            UEK.getLecturersList(),
            UEK.getRoomsList(),
            UEK.getGroupsList(),
            UEK.getSectionsList()])
            .then((list) => {
                var downloadQueue, interval, started,
                    index = 0,
                    sections = [];
                downloadQueue = async.priorityQueue((task, callback) => {
                    if (typeof task.group !== 'undefined') {

                        UEK.getSection(task)
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
                                return;
                            })
                            .catch((err) => {
                                downloadQueue.push(task, 1, (err) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                                callback();
                                return;

                            });
                    } else {
                        UEK.getTimetableOf(task)
                            .then((data) => {
                                timetables[data.type][data.timetableId] = data;
                                callback();
                                return;

                            })
                            .catch((err) => {
                                downloadQueue.push(task, 2, (err) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    }
                                );
                                callback();
                                return;

                            });
                    }
                }, 200);
                list.forEach((elements, key) => {
                    index += elements.length;
                    elements.forEach((task) => {
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
                        labels: labels,
                        sections: sections,
                        list: list
                    });
                };
            });
    });
};