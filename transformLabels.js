const LABEL_TYPES = require('uekplan-models/labelTypes');
var async = require('async');
/**
 *
 * @param labels
 * @param list collection of all list avaibled from extract;
 * @return {*}
 */
function updateLabelsFromList(data) {

  return new Promise((resolve, reject)=> {

    console.log('INFO: Updating data.labels from task data.list');
    data.list.forEach((elements) => {
      elements.forEach((task) => {
        if (task.group === undefined) {
          if (data.labels[task.timetableId] === undefined) {
            data.labels[task.timetableId] = {};
          }
          data.labels[task.timetableId].timetableId = task.timetableId;
          data.labels[task.timetableId].key = task.name;
          data.labels[task.timetableId].type = task.type;
          data.labels[task.timetableId].parentText = task.group;
          data.labels[task.timetableId].orginal = true;
        } else {
          if (data.labels[task.group] === undefined) {
            data.labels[task.group] = {};
          }

          data.labels[task.group].key = task.group;
          data.labels[task.group].orginal = true;
          switch (task.type) {
            case LABEL_TYPES.GROUP:
              data.labels[task.group].type = LABEL_TYPES.FIELD;
              break;
            case LABEL_TYPES.ROOM:
              data.labels[task.group].type = LABEL_TYPES.BUILDING;
              break;
            case LABEL_TYPES.TUTOR:
              data.labels[task.group].type = LABEL_TYPES.SURNAME;
              break;
            default:
              throw new Error('Unknown task type');
          }
        }
      });
    });
    console.log('INFO: Succesfuly updated data.labels from task list');
    resolve(data)
  });

};

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
};


function timetableHaveEvents(timetable) {
  return (timetable &&
  timetable.events &&
  timetable.events.length > 0 &&
  timetable.events[0].name !== 'Publikacja tego planu zajęć została zablokowana przez prowadzącego zajęcia.');
};

function updateLabelsFromTimetables(data) {

  return new Promise((resolve, reject)=> {
    console.log('INFO: Updating data.labels from data.timetables');
    var x = 0;
    for (var type in data.timetables) {
      for (var timetable in data.timetables[type]) {

        if (type === LABEL_TYPES.TUTOR && data.timetables.N[timetable].moodle) {
          data.labels[timetable].moodleId = Math.abs(data.timetables.N[timetable].moodle);
        }

        if (timetableHaveEvents(data.timetables[type][timetable])) {
          data.timetables[type][timetable].events
            .forEach((event)=> {
              if (event.name !== undefined && event.name.length > 0 && data.labels[event.name] === undefined) {
                data.labels[event.name] = {};
                data.labels[event.name].key = event.name.trim();
                data.labels[event.name].type = LABEL_TYPES.ACTIVITY;
                data.labels[event.name].orginal = true;
              }

              if (event.type !== undefined && event.type.length > 0 && data.labels[event.type] === undefined) {
                data.labels[event.type] = {};
                data.labels[event.type].key = event.type.trim();
                data.labels[event.type].type = LABEL_TYPES.TYPE;
                data.labels[event.type].orginal = true;
              }

              if (event.note !== undefined && event.note.length > 0 && data.labels[event.note] === undefined) {
                data.labels[event.note] = {};
                data.labels[event.note].key = event.note.trim();
                data.labels[event.note].type = LABEL_TYPES.NOTE;
                data.labels[event.note].orginal = true;
              }
            });
        }
      }
    }

    async.forEachOfLimit(data.labels, 5, (label, key, callback)=> {
      if (label.type === LABEL_TYPES.TUTOR) {
        var tutorTimetableId = label.timetableId;
        if (timetableHaveEvents(data.timetables.N[tutorTimetableId])) {
          for (var i = 0; i < data.timetables.N[tutorTimetableId].events.length; i++) {

            var k = findTimetableIdFromLabels(data.labels, data.timetables.N[tutorTimetableId].events[i].place);
            var searchedEvent = findEventInTimetable(data.timetables.N[tutorTimetableId].events[i], data.timetables.S[k]);
            if (searchedEvent !== undefined) {
              break;
            }
          }
        }
      }
      async.setImmediate(() => {
        callback();
      });
    }, (err) => {
      if (err) {
        reject(err);
      }
      console.log('INFO: Succesfuly updated data.labels from data.timetables');
      resolve(data);
    });
    //
    // for (var label in data.labels) {
    //   if (data.labels[label].type === LABEL_TYPES.TUTOR) {
    //     var tutorTimetableId = data.labels[label].timetableId;
    //     if (timetableHaveEvents(data.timetables.N[tutorTimetableId])) {
    //       for (var i = 0; i < data.timetables.N[tutorTimetableId].events.length; i++) {
    //
    //         var k = findTimetableIdFromLabels(data.labels, data.timetables.N[tutorTimetableId].events[i].place);
    //         var searchedEvent = findEventInTimetable(data.timetables.N[tutorTimetableId].events[i], data.timetables.S[k]);
    //         if (searchedEvent !== undefined) {
    //           data.labels[label].value = searchedEvent.tutor.trim();
    //           break;
    //         }
    //       }
    //     }
    //   }
    // }
  });
};
/**
 *
 * @param labels
 * @param sections
 * @return {*}
 */
function addLabelsFromSections(data) {
  return new Promise((resolve, reject)=> {
    console.log('INFO: Updating labels from data.sections');
    data.sections.forEach((section) => {
      var id = section.timetableId || section.name;
      if (data.labels[id] === undefined) {
        data.labels[id] = {};
      }
      data.labels[id].key = section.name;
      data.labels[id].type = section.type;
      data.labels[id].parentText = section.group;
      data.labels[id].orginal = true;
    });
    console.log('INFO: Succesfuly updated labels from data sections');
    resolve(data);
  });
};
/**
 *
 * @param data
 * @return {Promise}
 */
module.exports = (data)=> {
  console.log('INFO: Transforming labels');
  return new Promise((resolve, reject)=> {
    require('./labels')
      .loadLabels()
      .then((labels)=> {
        data.labels = labels;
        return updateLabelsFromList(data);
      })
      .then((data)=> {
        return addLabelsFromSections(data);
      })
      .then((data)=> {
        return updateLabelsFromTimetables(data);
      })
      .then((data)=> {
        delete data.sections;
        delete data.list;
        console.log('INFO: Successfuly transformed labels');
        resolve(data);
      })
      .catch((err)=> {
        console.log('ERROR: Transforming labels failed');
        reject(err);
      });
  });
};
