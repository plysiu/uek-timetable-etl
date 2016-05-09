/**
 *
 * @param labels
 * @param list collection of all list avaibled from extract;
 * @return {*}
 */
function updateLabelsFromList(labels, list) {
    console.log('updating labels from tasks');
    list.forEach((elements) => {
        elements.forEach((task) => {
            if (task.group === undefined) {
                if (labels[task.timetableId] === undefined) {
                    labels[task.timetableId] = {};
                }
                labels[task.timetableId].timetableId = task.timetableId;
                labels[task.timetableId].key = task.name;
                labels[task.timetableId].type = task.type;
                labels[task.timetableId].parentText = task.group;
                labels[task.timetableId].orginal = true;
            } else {
                if (labels[task.group] === undefined) {
                    labels[task.group] = {};
                }

                labels[task.group].key = task.group;
                labels[task.group].orginal = true;
                switch (task.type) {
                    case 'G':
                        labels[task.group].type = 'F';
                        break;
                    case 'S':
                        labels[task.group].type = 'b';
                        break;
                    case 'N':
                        labels[task.group].type = 'C';
                        break;
                    default:
                        throw new Error('Unknown task type');
                }
            }
        });
    });
    return labels;
}

function findTimetableIdFromLabels(labels, key) {
    for (var label in labels) {
        if (labels[label].key === key || labels[label].value === key) {
            return labels[label].timetableId;
        }
    }
    return;
}
function findEventInTimetable(queryEvent, timetable) {
    if (timetableHaveEvents(timetable)) {
        for (var i = 0; i < timetable.events.length; i++) {
            if (queryEvent.date === timetable.events[i].date &&
                queryEvent.from === timetable.events[i].from) {
                return timetable.events[i];
            }
        }
    }
    return;
}


function timetableHaveEvents(timetable) {
    return (timetable &&
    timetable.events &&
    timetable.events.length > 0 &&
    timetable.events[0].name !== 'Publikacja tego planu zajęć została zablokowana przez prowadzącego zajęcia.');
}


function updateLabelsFromTimetables(labels, timetables) {
    console.log('updating labels from timetables');
    var x = 0;


    for (var type in timetables) {
        for (var timetable in timetables[type]) {

            if (type === 'N' && timetables.N[timetable].moodle) {
                labels[timetable].moodleId = Math.abs(timetables.N[timetable].moodle);
            }


            if (timetableHaveEvents(timetables[type][timetable])) {
                timetables[type][timetable].events.forEach((event)=> {
                        if (event.name !== undefined && event.name.length > 0 && labels[event.name] === undefined) {
                            labels[event.name] = {};
                            labels[event.name].key = event.name.trim();
                            labels[event.name].type = 'A';
                            labels[event.name].orginal = true;
                        }

                        if (event.type !== undefined && event.type.length > 0 && labels[event.type] === undefined) {
                            labels[event.type] = {};
                            labels[event.type].key = event.type.trim();
                            labels[event.type].type = 'T';
                            labels[event.type].orginal = true;
                        }

                        if (event.note !== undefined && event.note.length > 0 && labels[event.note] === undefined) {
                            labels[event.note] = {};
                            labels[event.note].key = event.note.trim();
                            labels[event.note].type = 'I';
                            labels[event.note].orginal = true;

                        }
                    }
                );
            }
        }
    }


    for (var label in labels) {
        if (labels[label].type === 'N') {
            var tutorTimetableId = labels[label].timetableId;
            if (timetableHaveEvents(timetables.N[tutorTimetableId])) {
                for (var i = 0; i < timetables.N[tutorTimetableId].events.length; i++) {


                    var k = findTimetableIdFromLabels(labels, timetables.N[tutorTimetableId].events[i].place);
                    var searchedEvent = findEventInTimetable(timetables.N[tutorTimetableId].events[i], timetables.S[k]);
                    if (searchedEvent !== undefined) {
                        labels[label].value = searchedEvent.tutor.trim();
                        break;
                    }
                }
            }
        }

    }
    return labels;
}
/**
 *
 * @param labels
 * @param sections
 * @return {*}
 */
function addLabelsFromSections(labels, sections) {
    console.log('updating labels from sections');
    sections.forEach((section) => {
        var id = section.timetableId || section.name;
        if (labels[id] === undefined) {
            labels[id] = {};
        }
        labels[id].key = section.name;
        labels[id].type = section.type;
        labels[id].parentText = section.group;
        labels[id].orginal = true;
    });
    return labels;
}
/**
 *
 * @param data
 * @return {Promise}
 */
module.exports = function (data) {
    return new Promise((resolve, reject)=> {
        require('./labels')
            .loadLabels()
            .then((labels)=> {
                labels = updateLabelsFromList(labels, data.list);
                labels = updateLabelsFromTimetables(labels, data.timetables);
                labels = addLabelsFromSections(labels, data.sections);
                data.labels = labels;
                resolve(data);
            });
    })
};