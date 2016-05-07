'use strict';
/**
 * @param timetable
 * @returns {boolean}
 */
var timetableHaveEvents = (timetable) => {
    return timetable &&
        timetable.events &&
        timetable.events.length > 0 && !timetable.events[0].name.includes('Publikacja tego planu zajęć została zablokowana przez prowadzącego zajęcia');
}

/**
 * @param text
 * @param labels
 * @param type
 * @returns {*}
 */
var explodeListFromFromEventData = (text, labels, type)=> {
    var list = [];
    if (text) {
        labels.forEach((label)=> {
            if (text.includes(label.key) ||
                text.includes(label.value)) {
                text = text.replace(label.key, '').replace(label.value, '');
                list.push(label);
            }
        });
        text = text.replace(/, /img, '').trim();
        return {list: list, exception: (text) ? {key: text, type: type} : false};
    } else {
        return {list: list, exception: false};
    }
}
/**
 * @param event
 * @param labels
 * @returns {*}
 */
var explodeGroupsFromEvent = (event, labels) => {
    return explodeListFromFromEventData(event.group, labels, 'G');
}
/**
 * @param event
 * @param tutorsLabes
 * @returns {Array}
 */
var explodeTutorsFromEvent = (event, labels) => {
    return explodeListFromFromEventData(event.tutor, labels, 'N');
}
/**
 *
 * @param event
 * @param labels
 * @returns {*}
 */
var explodePlacesFromEvent = (event, labels)=> {
    return explodeListFromFromEventData(event.place, labels, 'S');
}
/**
 * @param event
 * @param tutors {Array}
 * @param groups {Array}
 * @param places {Array}
 * @returns {Array}
 */
var explodeEvent = (event, tutors, groups, places)=> {
    var events = [];
    var getDayNumber = (day)=> {
        switch (day) {
            case'Pn':
                return 0;
                break;
            case'Wt':
                return 1;
                break;
            case'Śr':
                return 2;
                break;
            case'Cz':
                return 3;
                break;
            case'Pt':
                return 4;
                break;
            case'Sb':
                return 5;
                break;
            case'Nd':
                return 6;
                break;
        }
    }
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
                    day: getDayNumber(event.day),
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
 * @param timetable
 * @param label
 * @param labels
 * @returns {Array}
 */
var explodeEventsFromTimetable = (timetable, label, labels)=> {
        var events = [];
        var tutors = {list: [], exception: false};
        var groups = {list: [], exception: false};
        var places = {list: [], exception: false};

        var exceptions = {};
        switch (label.type) {
            case 'N':
                tutors.list.push(label);
                break;
            case 'G':
                groups.list.push(label);
                break;
            case 'S':
                places.list.push(label);
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

            if (tutors.exception) {
                exceptions[tutors.exception.key] = tutors.exception;
            }
            if (groups.exception) {
                exceptions[groups.exception.key] = groups.exception;
            }
            if (places.exception) {
                exceptions[places.exception.key] = places.exception;
            }

            if (tutors.exception === false && groups.exception === false && places.exception === false) {
                events = events.concat(explodeEvent(event, tutors.list, groups.list, places.list));
            } else {
                // console.log('Exceptions:', event,tutors.exception, groups.exception, places.exception);
            }
        });
        return {events: events, exceptions: exceptions};
    }
    ;


module.exports = (data)=> {


    console.log('start:transformEvents');
    return new Promise((resolve, reject)=> {

        var timetables = data.timetables;


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


        var sort = (a, b)=> {
            if (a.key.length - b.key.length === 0) {
                return a.key.localeCompare(b.key);
            } else {
                return b.key.length - a.key.length;
            }
        }

        labels.tutors.sort(sort);
        labels.groups.sort(sort);
        labels.places.sort(sort);


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
                }
            }
        }
        delete data.timetables;
        console.log(exceptions, events.length);
        console.log('stop:transformEvents');

        resolve({events: events, exceptions: exceptions});
    });
}