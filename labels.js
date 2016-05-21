'use strict';
var models = require('uekplan-models');
const LABEL_TYPES = require('uekplan-models/labelTypes');
var async = require('async');
var CONFIG = require('./config');
/**
 *
 * @returns {Promise}
 */
var updateParentsId = () => {
  return new Promise((resolve, reject) => {
    console.log('INFO: Updating parents id');
    models.label.findAll({
      attributes: ['id', 'parentText', 'key', 'labelId'],
      where: {
        $or: [
          {type: LABEL_TYPES.FIELD},
          {type: LABEL_TYPES.BUILDING},
          {type: LABEL_TYPES.SURNAME}
        ]
      }, order: [
        [models.sequelize.fn('', models.sequelize.col('key')), 'DESC']
      ]
    })
      .then((labels) => {
        var promiseList = [];
        labels.forEach((label) => {
          promiseList.push(models.label.update({
              labelId: label.id
            }, {
              where: {
                parentText: label.key,
                labelId: null
              }
            }
          ));
        });

        Promise.all(promiseList)
          .then(() => {
            console.log('INFO: Updated parents id');
            resolve(this.loadLabels());
          })
          .catch((err) => {
            console.log('ERROR: Updating parents id');
            reject(err);
          });
      })
      .catch((err) => {
        console.log('ERROR: Updating parents id');
        reject(err);
      });
  });
};
/**
 *
 * @returns {Promise}
 */
exports.loadLabels = () => {
  console.log('INFO: Loading labels');
  return new Promise((resolve, reject) => {
    models.label.findAll({
      order: [
        [models.sequelize.fn('character_length', models.sequelize.col('key')), 'DESC']
      ]
    })
      .then((labels) => {
        var list = {};
        labels.forEach((label) => {
          list[(label.timetableId !== 0) ? label.timetableId : label.key] = label.dataValues;
        });
        console.log('INFO: Succesfuly loaded labels');
        resolve(list);
      })
      .catch((err) => {
        console.log('ERROR: Loading labels');
        reject(err);
      });
  });
};

var updateLabel = (label) => {
  return new Promise((resolve, reject) => {
    if (!label.id) {
      label.timetableId = label.timetableId !== 0 ? label.timetableId : 0;
      models.label.findOrCreate({
        where: {
          timetableId: label.timetableId,
          key: label.key
        },
        defaults: {
          timetable: label.timetableId,
          key: label.key,
          value: label.value,
          parentText: label.parentText,
          type: label.type,
          orginal: label.orginal
        }
      })
        .spread((data, created) => {
          if (data.type === LABEL_TYPES.TUTOR) {

            models.labeltutor.findOrCreate({
              where: {labelId: data.id},
              defaults: {moodleId: label.moodleId}
            })
              .spread((labeltutor, created)=> {

                if (labeltutor.moodleId !== label.moodleId) {
                  labeltutor.moodleId = label.moodleId;
                  resolve(labeltutor.save());
                } else {
                  resolve();
                }
              })
              .catch((err)=> {
                reject(err);
              });
          } else {
            resolve();

          }

        })
        .catch((err) => {
          console.log('ERR', label, err);
          reject(err);
        });
    }
  });
};

exports.updateLabels = (data) => {
  return new Promise((resolve, reject) => {
      console.log('INFO: Updating labels');
      var q = async.queue((label, callback)=> {

        label.timetableId = label.timetableId ? label.timetableId : 0;
        models.label.findOrCreate({
          where: {
            timetableId: label.timetableId,
            key: label.key
          },
          defaults: {
            timetableId: label.timetableId,
            key: label.key,
            value: label.value,
            type: label.type,
            parentText: label.parentText,
            orginal: label.orginal
          }
        })
          .spread((data, created)=> {
            if (data.type === LABEL_TYPES.TUTOR && label.moodleId !== undefined) {
              models.labeltutor.findOrCreate({
                where: {labelId: data.id},
                defaults: {labelId: data.id}
              })
                .spread((tutor, created)=> {
                  var name = resolveTutorName(data);
                  if (name !== false) {
                    tutor.prefix = name.prefix;
                    tutor.surename = name.surename;
                    tutor.forename = name.forename;
                  }
                  if (label.moodleId !== tutor.moodleId) {
                    tutor.moodleId = label.moodleId;
                  }
                  tutor
                    .save()
                    .then(()=> {
                      callback();
                    })
                    .catch((err)=> {
                      reject(err);
                    });
                })
                .catch((err)=> {
                  reject(err);
                });
            } else {
              callback();
            }
          })
          .catch((err)=> {
            reject(err);
          });

      }, CONFIG.CONCURRENT_DB_CONNECTIONS);

      q.drain = () => {

        updateParentsId()
          .then((labels) => {
            data.labels = labels;
            console.log('INFO: Succesfuly updated labels');
            resolve(data);
          })
          .catch((err) => {
            console.log('ERROR: Updating labels', err);
            reject(err);
          });
      };
      for (var label in data.labels) {
        q.push(data.labels[label]);
      }
    }
  )
    ;
}
;

var getPrefix = (val) => {
  return (val.split(', ').length > 1) ? val.split(',')[1].trim() : null;
};

var updateLabelTutor = (labelTutor, data) => {

  return new Promise((resolve, reject) => {

    labelTutor
      .then((result) => {
        console.log('INFO: Updating label tutorx');

        for (var item in data) {
          result[item] = data[item];
        }
        resolve(result.save());
      })
      .catch((err) => {
        console.log('ERROR: Updating label tutor');
        reject(err);
      });

  });
};
/**
 *
 * @param {{id:number, timetable:number|null, key:string, value:string|null, labelId:number|null, parentText:number|null, orginal:boolean}} label
 */
var resolveTutorName = (label)=> {
  if (label.value) {
    var data = {
      prefix: null,
      surename: null,
      forename: null
    };
    data.prefix = getPrefix(label.key);
    var prefixLength = data.prefix ? data.prefix.length : 0;
    var sKey = label.key.slice(0, ( ( prefixLength === 0) ? label.key.length : label.key.length - prefixLength - 2)).trim();
    var sValue = label.value.slice(prefixLength, label.value.length).trim();
    var sKeyFirstSpace = sKey.indexOf(' ');
    var i = 0;
    do {
      /**
       * Szukanie podobieństw
       *          ala ma kot -->>
       *            <<-- kota ma ale
       */
      if (sValue.slice(sValue.length - ( sKeyFirstSpace + i)) === sKey.slice(0, sKeyFirstSpace + i)) {
        data.surename = sValue.slice(sKey.length - sKeyFirstSpace - i).trim();
        data.forename = sValue.slice(0, sValue.length - sKeyFirstSpace - i).trim();
        return data;
      }
      i++;
    } while (i < sKey.length);
    return false;
  } else {
    return false;
  }
};

// exports.resolveTutorsName = (data) => {
//   console.log('INFO: Resolving tutors name');
//   return new Promise((resolve, reject) => {
//     models.label.findAll({
//       where: {
//         type: LABEL_TYPES.TUTOR,
//         value: {$ne: null}
//       },
//       include: [{
//         as: 'labeltutor',
//         model: models.labeltutor
//       }]
//     })
//       .then((labels) => {
//         var list = [];
//         labels.forEach((label) => {
//
//
//           if (label.value) {
//             var prefix, surename, forename;
//             prefix = getPrefix(label.key);
//             var prefixLength = prefix ? prefix.length : 0;
//             var sKey = label.key.slice(0, ( ( prefixLength === 0) ? label.key.length : label.key.length - prefixLength - 2)).trim();
//             var sValue = label.value.slice(prefixLength, label.value.length).trim();
//             var sKeyFirstSpace = sKey.indexOf(' ');
//             var i = 0;
//             do {
//               /**
//                * Szukanie podobieństw
//                *          ala ma kot -->>
//                *            <<-- kota ma ale
//                */
//               if (sValue.slice(sValue.length - ( sKeyFirstSpace + i)) === sKey.slice(0, sKeyFirstSpace + i)) {
//                 surename = sValue.slice(sKey.length - sKeyFirstSpace - i).trim();
//                 forename = sValue.slice(0, sValue.length - sKeyFirstSpace - i).trim();
//
//                 break;
//               }
//               i++;
//             } while (i < sKey.length);
//             list.push(
//               updateLabelTutor(models.labeltutor.findOrCreate({
//                   where: {
//                     labelId: label.id
//                   },
//                   defaults: {
//                     labelId: label.id
//                   }
//                 }).,
//                 {prefix: prefix, forename: forename, surename: surename})
//             );
//           }
//         });
//
//         Promise.all(list)
//           .then(() => {
//             console.log('INFO: Resolved tutors name');
//             resolve(data);
//           })
//           .catch((err) => {
//             console.log('ERROR: Resolving tutors name');
//             reject(err);
//           });
//       })
//       .catch((err) => {
//         console.log('ERROR: Resolving tutors name');
//         reject(err);
//       });
//   });
// };

