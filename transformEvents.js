/**
 * @param timetable
 * @returns {boolean}
 */
function timetableHaveEvents(timetable) {
    return timetable &&
        timetable.events &&
        timetable.events.length > 0 &&
        !timetable.events[0].name.includes('Publikacja tego planu zajęć została zablokowana przez prowadzącego zajęcia');
}
/**
 * @param event
 * @param groupsLabels
 * @returns {Array}
 */
function explodeGroupsFromEvent(event, labels) {
    var list = [];
    labels.forEach((label)=> {
        try {
            if (event.group.includes(label.key) || event.group.includes(label.value)) {
                event.group = event.group.replace(label.key, '').replace(label.value, '');
                list.push(label);
            }
        } catch (err) {
            console.log('Groups', err);
        }
    });
    if (list.length === 0) {
        list.push({id: null});
    }
    return list;
}
/**
 * @param event
 * @param tutorsLabes
 * @returns {Array}
 */
function explodeTutorsFromEvent(event, labels) {
    var list = [];
    labels.forEach((label)=> {
        try {
            if (event.tutor.includes(label.key) || event.tutor.includes(label.value)) {
                event.tutor = event.tutor.replace(label.key, '').replace(label.value, '');
                list.push(label);
            }
        } catch (err) {
            console.log('Tutors', err);
        }
    });
    if (list.length === 0) {
        list.push({id: null});
    }
    return list;
}
/**
 * @param event
 * @param placesLabels
 * @returns {Array}
 */
function explodePlacesFromEvent(event, labels) {
    var list = [];
    labels.forEach((label)=> {
        try {
            if (event.place.includes(label.key) || event.place.includes(label.value)) {
                event.place = event.place.replace(label.key, '').replace(label.value, '');
                list.push(label);
            }
        } catch (err) {
            console.log('Places', err);
        }
    });
    if (list.length === 0) {
        list.push({id: null});
    }
    return list;
}
/**
 * @param event
 * @param tutors {Array}
 * @param groups {Array}
 * @param places {Array}
 * @returns {Array}
 */
function explodeEvent(event, tutors, groups, places) {
    var events = [];
    try {
        tutors.forEach((tutor)=> {
            groups.forEach((group)=> {
                places.forEach((place)=> {
                    events.push({
                        date: event.date,
                        day: event.day,
                        from: event.from,
                        to: event.to,
                        activity: event.name,
                        type: event.type,
                        tutorId: tutor.id,
                        groupId: group.id,
                        placeId: place.id,
                        note: event.note
                    });
                });
            })
        });
    } catch (err) {
        console.log('explodeEvent', err, event);
    }
    return events;
}
/**
 *
 * @param timetable
 * @param label
 * @param labels
 * @returns {Array}
 */
function explodeEventsFromTimetable(timetable, label, labels) {
    var events = [];
    var tutors = [], groups = [], places = [];

    try {
        switch (label.type) {
            case 'N':
                tutors.push(label);
                break;
            case 'G':
                groups.push(label);
                break;
            case 'S':
                places.push(label);
                break;
            default:
                console.log('Error', label);
        }

        timetable.events.forEach((event)=> {
            switch (label.type) {
                case 'N':
                    groups = explodeGroupsFromEvent(event, labels.groups);
                    places = explodePlacesFromEvent(event, labels.places);
                    break;
                case 'G':
                    tutors = explodeTutorsFromEvent(event, labels.tutors);
                    places = explodePlacesFromEvent(event, labels.places);
                    break;
                case 'S':
                    groups = explodeGroupsFromEvent(event, labels.groups);
                    tutors = explodeTutorsFromEvent(event, labels.tutors);
                    break;
            }
            events = events.concat(explodeEvent(event, tutors, groups, places));
        });
    } catch (err) {
        console.log('Events', 'd', err);
    }
    return events;
};


module.exports = function (data) {


    console.log('start:transformEvents');
    return new Promise((resolve, reject)=> {
        try {


            var labels = {
                tutors: [],
                places: [],
                groups: []
            };
            for (var label in data.labels) {
                switch (data.labels[label].type) {
                    case 'N':
                        labels.tutors.push(data.labels[label]);
                        break;
                    case 'G':
                        labels.groups.push(data.labels[label]);
                        break;
                    case 'S':
                        labels.places.push(data.labels[label]);
                        break;
                }
            }
            var events = [];
            for (var timetableType in data.timetables) {
                for (var timetableId in data.timetables[timetableType]) {
                    if (timetableHaveEvents(data.timetables[timetableType][timetableId])) {
                        events = events.concat(explodeEventsFromTimetable(data.timetables[timetableType][timetableId], data.labels[timetableId], labels));
                        console.log('Events', events.length)
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
        console.log('stop:transformEvents');

        resolve(events);
    });
}