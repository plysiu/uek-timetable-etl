/**
 * @param timetable
 * @returns {boolean}
 */
function timetableHaveEvents(timetable) {
    return timetable &&
        timetable.events &&
        timetable.events.length > 0 && !timetable.events[0].name.includes('Publikacja tego planu zajęć została zablokowana przez prowadzącego zajęcia');
}
/**
 * @param event
 * @param groupsLabels
 * @returns {Array}
 */
function explodeGroupsFromEvent(event, labels) {
    var list = [];
    if (event.group) {
        labels.forEach((label)=> {
            if (event.group.includes(label.key) || event.group.includes(label.value)) {
                event.group = event.group.replace(label.key, '').replace(label.value, '');
                list.push(label);
            }
        });
        event.group = event.group.replace(/, /img, '').trim();
    }
    return {list: list, exception: {key: event.group, type: 'G'} || {}};
}
/**
 * @param event
 * @param tutorsLabes
 * @returns {Array}
 */
function explodeTutorsFromEvent(event, labels) {
    var list = [];
    if (event.tutor) {
        labels.forEach((label)=> {
            if (event.tutor.includes(label.key) || event.tutor.includes(label.value)) {
                event.tutor = event.tutor.replace(label.key, '').replace(label.value, '');
                list.push(label);
            }
        });
        event.tutor = event.tutor.replace(/, /img, '').trim();
    }
    return {list: list, exception: {key: event.tutor, type: 'N'} || {}};

}
/**
 * @param event
 * @param placesLabels
 * @returns {Array}
 */
function explodePlacesFromEvent(event, labels) {
    var list = [];
    if (event.place) {
        labels.forEach((label)=> {
            if (event.place.includes(label.key) || event.place.includes(label.value)) {
                event.place = event.place.replace(label.key, '').replace(label.value, '');
                list.push(label);
            }
        });
        event.place = event.place.replace(/, /img, '').trim();
    }
    return {list: list, exception: {key: event.place, type: 'S'} || {}};

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

    if (!groups) {
        groups = [{id: null}];
    }
    if (!tutors) {
        tutors = [{id: null}];
    }
    if (!places) {
        places = [{id: null}];
    }

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

    var exceptions = {};
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
                exceptions[groups.exception.key] = groups.exception;

                places = explodePlacesFromEvent(event, labels.places);
                exceptions[places.exception.key] = places.exception;

                break;
            case 'G':
                tutors = explodeTutorsFromEvent(event, labels.tutors);
                exceptions[tutors.exception.key] = tutors.exception;

                places = explodePlacesFromEvent(event, labels.places);
                exceptions[places.exception.key] = places.exception;

                break;
            case 'S':
                groups = explodeGroupsFromEvent(event, labels.groups);
                exceptions[groups.exception.key] = groups.exception;

                tutors = explodeTutorsFromEvent(event, labels.tutors);
                exceptions[tutors.exception.key] = tutors.exception;

                break;
        }

        events = events.concat(explodeEvent(event, tutors.list, groups.list, places.list));
    });
    return {events: events, exceptions: exceptions};
};


module.exports = function (data) {


    console.log('start:transformEvents');
    return new Promise((resolve, reject)=> {

        var timetables = require('./timetablesSingletone')();


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

        labels.places.sort((a, b)=> {
            return b.key.length - a.key.length;
        });
        labels.tutors.sort((a, b)=> {
            return b.key.length - a.key.length;
        });
        labels.groups.sort((a, b)=> {
            return b.key.length - a.key.length;
        });
        var exceptions = {};
        var events = [];
        for (var timetableType in timetables) {
            for (var timetableId in timetables[timetableType]) {
                if (timetableHaveEvents(timetables[timetableType][timetableId])) {
                    var x = explodeEventsFromTimetable(timetables[timetableType][timetableId], data.labels[timetableId], labels);
                    events = events.concat(x.events);

                    exceptions = Object.assign(exceptions, x.exceptions);
                    // console.log('Events', events.length)
                }
            }
        }

        console.log(exceptions, events.length);
        console.log('stop:transformEvents');

        resolve({events: events, exceptions: exceptions});
    });
}