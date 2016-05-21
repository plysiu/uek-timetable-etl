"use strict";
var xml2js = require('xml2js');
var rp = require('request-promise');
var async = require('async');
var CONFIG = require('./config');
var LABEL_TYPES = require('uekplan-models/labelTypes');
/**
 *
 * @param input
 * @returns {Promise}
 */
var parseData = (input) => {
  return new Promise((resolve, reject) => {
    new xml2js.Parser()
      .parseString(input, (err, stdout) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout);
        }
      });
  });
};
/**
 * @param {string} text String
 * @return {string} Trimmed and replaced text. In other words cleaned from unwanted characters
 */
var cleanText = (text) => {
  return text.trim().replace(/,$/img, '');
};
/**
 * 
 * @param data
 * @returns {string}
 */
var extractValue = (data) => {
  if (data) {
    if (data instanceof Array) {
      if (typeof data[0] === 'string') {
        return cleanText(data[0]);
      } else {
        return cleanText(data[0]._);
      }
    } else {
      if (typeof data === 'string') {
        return cleanText(data);
      } else {
        console.log('Wystąpił błąd podczas transformacji wartości:', typeof data, data);
      }
    }
  } else {
    // console.log('Wystąpił błąd podczas transformacji wartości:', typeof data, data);
  }
};
/**
 * Returns label type
 * @param type
 * @returns {string}
 */
var getLabelType = (type) => {
  for (var label_type in LABEL_TYPES) {
    if (LABEL_TYPES[label_type] === type) {
      return LABEL_TYPES[label_type];
    }
  }
  return LABEL_TYPES.UNKNOWN;
};
/**
 * @param data
 * @return {Array}
 */
var extractList = (data) => {
  var list = [];
  data['plan-zajec'].zasob.forEach((element) => {
    list.push({
      timetableId: element.$.id,
      name: element.$.nazwa.replace(/, $/img, '').trim(),
      type: getLabelType(element.$.typ),
      group: data['plan-zajec'].$.grupa
    });
  });
  return list;
}
/**
 * @param a
 * @param b
 * @return {number}
 */
var sortData = (a, b) => {
  return b.name.length - a.name.length;
};
/**
 * @param url {sring}
 * @return {Promise}
 */
var download = (url) => {
  return new Promise((resolve, reject) => {
    rp.get('http://planzajec.uek.krakow.pl/index.php' + url)
      .then((data) => {
        resolve(parseData(data));
      })
      .catch((err) => {
        reject(err);
      });
  });
};
/**
 * @param data
 * @return {Array}
 */
var extractSections = (data) => {
  var sections = [];
  data['plan-zajec'].grupowanie.forEach((item) => {
    sections.push({
      type: getLabelType(item.$.typ),
      group: item.$.grupa.replace(/, $/img, '').trim()
    });
  });
  return sections;
};
/**
 * @param taskij
 * @returns {Promise}
 */
exports.getSectionsList = () => {
  return new Promise((resolve, reject) => {
    download('?xml')
      .then((data) => {
        resolve(extractSections(data).sort((a, b) => {
          return b.group.length - a.group.length;
        }));
      })
      .catch((err) => {
        console.log('Wystąpił błąd podczas pobierania sekcji.', err);
        reject(err);
      });
  });
};
/**
 * @param section P{type: string, group: string}}
 * @returns {Promise}
 */
exports.getSection = (section) => {
  return new Promise((resolve, reject) => {
    rp.get({
      url: 'http://planzajec.uek.krakow.pl/index.php',
      qs: {typ: section.type, grupa: section.group, xml: true}
    })
      .then((data) => {
        return parseData(data);
      })
      .then((data) => {
        resolve(extractList(data));
      })
      .catch((err) => {
        console.log('Wystąpił błąd podczas pobierania sekcji:', err);
        reject(err);
      });
  });
};
/**
 * @return {Promise}
 */
exports.getLecturersList = () => {
  return new Promise((resolve, reject) => {
    download('?typ=N&xml')
      .then((data) => {
        resolve(extractList(data).sort((a, b) => {
          return sortData(a, b);
        }));
      })
      .catch((err) => {
        console.log('Wystąpił błąd podczas pobierania listy nauczycieli', err);
        reject(err);
      });
  });
};
/**
 * @returns {Promise}
 */
exports.getGroupsList = () => {
  return new Promise((resolve, reject) => {
    download('?typ=G&xml')
      .then((data) => {
        resolve(extractList(data).sort((a, b) => {
          return sortData(a, b);
        }));
      })
      .catch((err) => {
        console.log('Wystąpił błąd podczas pobierania listy grup.', err);
        reject(err);
      });
  });
};
/**
 * @return {Promise}
 */
exports.getRoomsList = () => {
  return new Promise((resolve, reject) => {
    download('?typ=S&xml')
      .then((data) => {
        resolve(extractList(data).sort((a, b) => {
          return sortData(a, b);
        }));
      })
      .catch((err) => {
        console.log('Wystąpił błąd podczas pobierania listy sal', err);
        reject(err);
      });
  });
};
/**
 * @return {Promise}
 */
exports.getFields = () => {
  return new Promise((resolve, reject) => {
    getSections()
      .then((data) => {
        var list = [];
        data.forEach((element) => {
          if (element.type === LABEL_TYPES.GROUP) {
            list.push(element.name);
          }
        });
        resolve(list);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
/**
 * @return {Promise}
 */
exports.getBuildings = () => {
  return new Promise((resolve, reject) => {
    getSections()
      .then((data) => {
        var list = [];
        data.forEach((element) => {
          if (element.type === LABEL_TYPES.ROOM) {
            list.push(element.name);
          }
        });
        resolve(list);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
/**
 * @param data
 * @param type
 * @param name
 * @return {Array}
 */
var extractTimetableEvents = (data, type, name) => {
  var events = [];
  if (data) {
    data.forEach((event) => {
      switch (type) {
        case LABEL_TYPES.GROUP:
          event.grupa = name;
          break;
        case LABEL_TYPES.TUTOR:
          event.nauczyciel = name;
          break;
        case LABEL_TYPES.ROOM:
          event.sala = name;
          break;
        default:
          throw new Error();
          break;
      }
      events.push({
        date: extractValue(event.termin),
        day: extractValue(event.dzien),
        from: extractValue(event['od-godz']),
        to: extractValue(event['do-godz']),
        name: extractValue(event.przedmiot),
        type: extractValue(event.typ),
        tutor: extractValue(event.nauczyciel),
        group: extractValue(event.grupa),
        place: extractValue(event.sala),
        note: extractValue(event.uwagi)
      });
    });
  }
  return events;
};
/**
 * @param data
 * @return {{timetableId: number, type: string, name: string, moodle: number, events: Array}}
 */
var extractTimetable = (data) => {
  return {
    timetableId: data['plan-zajec'].$.id,
    type: getLabelType(data['plan-zajec'].$.typ),
    name: extractValue(data['plan-zajec'].$.nazwa),
    moodle: data['plan-zajec'].$.idcel,
    events: extractTimetableEvents(data['plan-zajec'].zajecia, getLabelType(data['plan-zajec'].$.typ), data['plan-zajec'].$.nazwa)
  };
};
/**
 * @param timetable {{timetableId: string, type: string, name: string, group: undefined}}
 * @return {Promise}
 */
exports.getTimetableOf = (timetable) => {
  return new Promise((resolve, reject) => {
    download('?typ=' + timetable.type + '&id=' + timetable.timetableId + '&okres=3&xml')
      .then((data) => {
        resolve(extractTimetable(data));
      })
      .catch((err) => {
        console.log('Wystąpił błąd podczas pobierania planu zajęć dla: ', timetable);
        reject(timetable);
      });
  });
};
/**
 *
 * @returns {Promise}
 */
exports.downloadAll = (data) => {
  console.log('INFO: Downoading timetables');
  return new Promise((resolve, reject) => {
    Promise.all([
      this.getLecturersList(),
      this.getRoomsList(),
      this.getGroupsList(),
      this.getSectionsList()])
      .then((list) => {
        var downloadQueue;
        var interval;
        var started;
        var index = 0;
        var sections = [];
        var test = 10000;
        var counter = 0;
        var timetables = {};
        timetables[LABEL_TYPES.TUTOR] = {};
        timetables[LABEL_TYPES.GROUP] = {};
        timetables[LABEL_TYPES.ROOM] = {};
        const PRIORITY = {HIGH: 1, LOW: 2};
        downloadQueue = async.priorityQueue((task, callback) => {
          if (typeof task.group !== 'undefined') {
            this.getSection(task)
              .then((data) => {
                sections = sections.concat(data);
                data.forEach((addTask) => {
                  if (!timetables[addTask.type] && !timetables[addTask.type][addTask.timetableId]) {
                    downloadQueue.push(addTask, PRIORITY.HIGH, (err) => {
                      if (err) {
                        console.log(err);
                      }
                    });
                  }
                });
                callback();
              })
              .catch((err) => {
                downloadQueue.push(task, PRIORITY.LOW, (err) => {
                  if (err) {
                    console.log(err);
                  }
                });
                callback();
              });
          } else {
            this.getTimetableOf(task)
              .then((data) => {
                timetables[data.type][data.timetableId] = data;
                callback();
              })
              .catch((err) => {
                downloadQueue.push(task, PRIORITY.HIGH, (err) => {
                  if (err) {
                    console.log(err);
                  }
                });
                callback();
              });
          }
        }, CONFIG.CONCURRENT_HTTP_CONECTIONS);
        list.forEach((tasks) => {
          index += tasks.length;
          tasks.forEach((task) => {
            downloadQueue.push(task, task.group ? PRIORITY.LOW : PRIORITY.HIGH);
          });
        });
        started = Date.now();
        interval = setInterval(() => {
          /**
           * If downloading faild
           */
          if (downloadQueue.length() < test) {
            test = downloadQueue.length();
            counter = 0;
          } else {
            counter++;
            if (counter > CONFIG.SECONDS_WAIT) {
              downloadQueue.drain();
            }
          }
          console.log('Remaing elements to download:', downloadQueue.length() + downloadQueue.running());

        }, 1000);

        downloadQueue.drain = () => {
          downloadQueue.kill();
          clearInterval(interval);

          var sum = 0;
          Object.keys(timetables)
            .forEach((x) => {
              sum = sum + Object.keys(timetables[x]).length;
            });

          data.logEntry.downloadedTimetables = sum;
          data.logEntry
            .save()
            .then(() => {
              console.log('INFO: Succesfully downloaded events');
              data.timetables = timetables;
              data.sections = sections;
              data.list = list;
              resolve(data);
            })
            .catch((err) => {
              console.log('ERROR: Downloading timetables failed');
              reject(err);
            });
        };

      });
  });
}

