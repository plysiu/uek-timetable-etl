/**
 * @param labels
 * @param list collection of all list avaibled from extract;
 * @return {*}
 */
function updateLabelsFromList(labels, list) {
    console.log('Update labels from download list');
    list.forEach((elements) => {
        elements.forEach((task) => {
            if (task.group === undefined) {
                if labels[task.timetableId] === undefined)
        {
            labels[task.timetableId] = {};
        }
        labels[task.timetableId].timetableId = task.timetableId;
        labels[task.timetableId].key = task.name;
        labels[task.timetableId].type = task.type;
        labels[task.timetableId].parentText = task.group;
        labels[task.timetableId].orginal = true;
    }
else
    {
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
}
)
;
})
;
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
    timetable.events[0].activity !== 'Publikacja tego planu zajęć została zablokowana przez prowadzącego zajęcia.');
}

function updateLabelsFromTimetables(labels, timetables) {
    console.log('start:updateLabelsFromTimetables');
    try {


        var x = 0;
        for (var timetable in timetables.N) {
            if (timetables.N[timetable].moodle) {
                labels[timetable].moodleId = Math.abs(timetables.N[timetable].moodle);
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
                            labels[label].value = searchedEvent.tutor;
                            break;
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
    console.log('stop:updateLabelsFromTimetables');
    return labels;
}
/**
 *
 * @param labels
 * @param sections
 * @return {*}
 */
function addLabelsFromSections(labels, sections) {
    console.log('Start:addLabelsFromSections');
    sections.forEach((section) => {
        var id = section.timetableId || section.name;
        if (typeof labels[id] === undefined) {
            labels[id] = {};
        }
        labels[id].key = section.name;
        labels[id].type = section.type;
        labels[id].parentText = section.group;
        labels[id].orginal = true;
    });
    console.log('Stop:addLabelsFromSections');
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
                labels = updateLabelsFromTimetables(labels, data.timetable);
                labels = addLabelsFromSections(labels, data.sections);
                data.labels = labels;
                resolve(data);
            })
    })
};