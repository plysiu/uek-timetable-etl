'use strict';
const LABEL_TYPES = require('uekplan-models/labelTypes');
const blockBegin = ['7:00', '7:50', '8:45', '9:35', '10:30', '11:20', '12:15', '13:05', '14:00', '14:50', '15:40', '16:30', '17:20', '18:10', '19:00', '19:50', '20:40'];
const blockEnd = ['7:45', '8:35', '9:30', '10:20', '11:15', '12:05', '13:00', '13:50', '14:45', '15:35', '16:25', '17:15', '18:05', '18:55', '19:45', '20:35', '21:25'];
const DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
/**
 *
 * @param timetable
 * @returns {*|Array|Array.<T>|boolean}
 */
var timetableHaveEvents = (timetable) => {
  return timetable &&
    timetable.events &&
    timetable.events.length > 0 && !timetable.events[0].name.includes(
      'Publikacja tego planu zajęć została' +
      ' zablokowana przez prowadzącego zajęcia');
};

/**
 * @param from
 * @param to
 * @returns {number}
 */
var getNumberOfBlocks = (from, to) => {
  if (blockEnd.indexOf(to) >= 0 && (blockBegin.indexOf(from) >= 0)) {
    return parseInt((blockEnd.indexOf(to)) - blockBegin.indexOf(from)) + 1;
  }
  return 0;
};
/**
 * @param text
 * @param labels
 * @param type
 * @returns {*}
 */
var explodeListFromFromEventData = (text, labels, type) => {
  var list = [];
  if (text && text !== '') {
    labels.forEach((label) => {
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
};
/**
 * @param event
 * @param labels
 * @returns {*}
 */
var explodeActivitesFromEvent = (event, labels) => {
  return explodeListFromFromEventData(event.name, labels, LABEL_TYPES.ACTIVITY);
};
/**
 *
 * @param event
 * @param labels
 * @returns {{list, exception}}
 */
var explodeNotesFromEvent = (event, labels) => {
  return explodeListFromFromEventData(event.note, labels, LABEL_TYPES.NOTE);
};
/**
 *
 * @param event
 * @param labels
 * @returns {{list, exception}}
 */
var explodeTypesFromEvent = (event, labels) => {
  return explodeListFromFromEventData(event.type, labels, LABEL_TYPES.TYPE);
};

/**
 * @param event
 * @param labels
 * @returns {*}
 */
var explodeGroupsFromEvent = (event, labels) => {
  return explodeListFromFromEventData(event.group, labels, LABEL_TYPES.GROUP);
};
/**
 * @param event
 * @param tutorsLabes
 * @returns {Array}
 */
var explodeTutorsFromEvent = (event, labels) => {
  return explodeListFromFromEventData(event.tutor, labels, LABEL_TYPES.TUTOR);
};
/**
 *
 * @param event
 * @param labels
 * @returns {*}
 */
var explodePlacesFromEvent = (event, labels) => {
  return explodeListFromFromEventData(event.place, labels, LABEL_TYPES.ROOM);
};

/**
 *
 * @param day
 * @returns {number}
 */
var getDayNumber = (day) => {
  return DAYS.indexOf(day);
};

var explodeEvent = (event, tutors, groups, places, activites, types, notes) => {
  var events = [];
  if (groups.length === 0) {
    groups.push({id: 0});
  }
  if (tutors.length === 0) {
    tutors.push({id: 0});
  }
  if (places.length === 0) {
    places.push({id: 0});
  }
  if (activites.length === 0) {
    activites.push({id: 0});
  }
  if (types.length === 0) {
    types.push({id: 0});
  }
  if (notes.length === 0) {
    notes.push({id: 0});
  }

  activites.forEach((activity) => {
    types.forEach((type) => {
      notes.forEach((note) => {
        tutors.forEach((tutor) => {
          groups.forEach((group) => {
            places.forEach((place) => {
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
                noteId: note.id,
                blocks: getNumberOfBlocks(event.from, event.to)
              });
            });
          });
        });
      });
    });
  });
  return events;
};

/**
 * @param timetable
 * @param label
 * @param labels
 * @returns {Array}
 */
var explodeEventsFromTimetable = (timetable, label, labels) => {

  var events = [];
  var tutors = {list: [], exception: false};
  var groups = {list: [], exception: false};
  var places = {list: [], exception: false};
  var activites = {list: [], exception: false};
  var notes = {list: [], exception: false};
  var types = {list: [], exception: false};
  var exceptions = {};

  switch (label.type) {
    case LABEL_TYPES.TUTOR:
      tutors.list.push(label);
      break;
    case LABEL_TYPES.GROUP:
      groups.list.push(label);
      break;
    case LABEL_TYPES.ROOM:
      places.list.push(label);
      break;
    default:
      throw new Error('Złty typ', label);
  }

  timetable.events.forEach((event) => {
    switch (label.type) {
      case LABEL_TYPES.TUTOR:
        groups = explodeGroupsFromEvent(event, labels.groups);
        places = explodePlacesFromEvent(event, labels.places);
        break;
      case LABEL_TYPES.GROUP:
        tutors = explodeTutorsFromEvent(event, labels.tutors);
        places = explodePlacesFromEvent(event, labels.places);
        break;
      case LABEL_TYPES.ROOM:
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

    if (tutors.exception === false && groups.exception === false && places.exception === false && activites.exception === false && types.exception === false && notes.exception === false) {
      events = events.concat(explodeEvent(event, tutors.list, groups.list, places.list, activites.list, types.list, notes.list));
    }
  });
  return {events: events, exceptions: exceptions};
};
/**
 *
 * @param data
 * @returns {{tutors: Array, places: Array, groups: Array, activites: Array, types: Array, notes: Array}}
 */
var explodeLabels = (data) => {

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
      case LABEL_TYPES.TUTOR:
        labels.tutors.push(data.labels[label]);
        break;
      case LABEL_TYPES.GROUP:
        labels.groups.push(data.labels[label]);
        break;
      case LABEL_TYPES.ROOM:
        labels.places.push(data.labels[label]);
        break;
      case LABEL_TYPES.ACTIVITY:
        labels.activites.push(data.labels[label]);
        break;
      case LABEL_TYPES.TYPE:
        labels.types.push(data.labels[label]);
        break;
      case LABEL_TYPES.NOTE:
        labels.notes.push(data.labels[label]);
        break;
      case LABEL_TYPES.BUILDING:
        break;
      case LABEL_TYPES.SURNAME:
        break;
      case LABEL_TYPES.FIELD:
        break;
      default:
        console.log(data.labels[label].type);
        break;
    }
  }
  return labels;
};

module.exports = (data) => {

  console.log('INFO: Extracting events');
  return new Promise((resolve, reject) => {
    data.exceptions = {};
    data.events = [];
    var labels = explodeLabels(data);
    var sort = (a, b) => {
      if (a.key.length - b.key.length === 0) {
        return a.key.localeCompare(b.key);
      } else {
        return b.key.length - a.key.length;
      }
    };
    labels.tutors.sort(sort);
    labels.groups.sort(sort);
    labels.places.sort(sort);
    labels.activites.sort(sort);
    labels.notes.sort(sort);
    labels.types.sort(sort);

    for (var timetableType in data.timetables) {
      for (var timetableId in data.timetables[timetableType]) {
        if (timetableHaveEvents(data.timetables[timetableType][timetableId])) {
          var timetable = explodeEventsFromTimetable(
            data.timetables[timetableType][timetableId],
            data.labels[timetableId],
            labels);
          data.events = data.events.concat(timetable.events);
          data.exceptions = Object.assign(
            data.exceptions,
            timetable.exceptions);
        }
      }
    }

    delete data.timetables;
    delete data.labels;
    data.logEntry.eventsExtracted = data.events.length;
    data.logEntry.exceptionsExtracted = Object.keys(data.exceptions).length;
    data.logEntry
      .save()
      .then(() => {
        console.log('INFO: Succesfuly extracted events');
        resolve(data);
      })
      .catch((err) => {
        console.log('ERROR: Extracting events');
        reject(err);
      });
  });
};
