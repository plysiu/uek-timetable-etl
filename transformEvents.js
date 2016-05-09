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
    if (text && text !== '') {
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
var explodeActivitesFromEvent = (event, labels) => {
    return explodeListFromFromEventData(event.name, labels, 'A');
}
var explodeNotesFromEvent = (event, labels) => {
    return explodeListFromFromEventData(event.note, labels, 'I');
}
var explodeTypesFromEvent = (event, labels) => {
    return explodeListFromFromEventData(event.type, labels, 'T');
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
var explodeEvent = (event, tutors, groups, places, activites, types, notes)=> {
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
    if (groups.length ===0) {
        groups.push({id: null});
    }
    if (tutors.length ===0) {
        tutors.push({id: null});
    }
    if (places.length ===0) {
        places.push({id: null});
    }
    if (activites.length ===0) {
        activites.push({id: null});
    }
    if (types.length ===0) {
        types .push({id: null});
    }

    if (notes.length ===0) {
        notes.push({id: null});
    }

    activites.forEach((activity)=> {
        types.forEach((type)=> {
            notes.forEach((note)=> {
                tutors.forEach((tutor)=> {
                    groups.forEach((group)=> {
                        places.forEach((place)=> {
                            events.push({
                                date: event.date,
                                day: getDayNumber(event.day),
                                from: event.from,
                                to: event.to,
                                activityId: activity.id,
                                typeId: type.id,
                                tutorId: tutor.id,
                                groupId: group.id,
                                placeId: place.id,
                                noteId: note.id
                            });
                        });
                    });
                });
            });
        });
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
        var activites = {list: [], exception: false};
        var notes = {list: [], exception: false};
        var types = {list: [], exception: false};


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
            activites = explodeActivitesFromEvent(event, labels.activites);
            notes = explodeNotesFromEvent(event, labels.notes);
            types = explodeTypesFromEvent(event, labels.types);


            if (tutors.exception) {
                exceptions[tutors.exception.key] = tutors.exception;
            }
            if (groups.exception) {
                exceptions[groups.exception.key] = groups.exception;
            }
            if (places.exception) {
                exceptions[places.exception.key] = places.exception;
            }
            if (activites.exception) {
                exceptions[activites.exception.key] = activites.exception;
            }
            if (notes.exception) {
                exceptions[notes.exception.key] = notes.exception;
            }
            if (types.exception) {
                exceptions[types.exception.key] = types.exception;
            }

            if (tutors.exception === false
                && groups.exception === false
                && places.exception === false
                && activites.exception === false
                && types.exception === false
                && notes.exception === false) {
                events = events.concat(explodeEvent(event, tutors.list, groups.list, places.list, activites.list, types.list, notes.list));
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
            groups: [],
            activites: [],
            types: [],
            notes: []
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
                case 'A':
                    labels.activites.push(data.labels[label]);
                    break;
                case 'T':
                    labels.types.push(data.labels[label]);
                    break;
                case 'I':
                    labels.notes.push(data.labels[label]);
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

        labels.activites.sort(sort);

        labels.notes.sort(sort);

        labels.types.sort(sort);


        // labels.places.sort((a, b)=> {
        //     return b.key.length - a.key.length;
        // });
        // labels.tutors.sort((a, b)=> {
        //     return b.key.length - a.key.length;
        // });
        // labels.groups.sort((a, b)=> {
        //     return b.key.length - a.key.length;
        // });
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