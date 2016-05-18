'use strict';
var models = require('uekplan-models');
const LABEL_TYPES = require('uekplan-models/labelTypes');
/**
 * @todo add event type as labels
 * @returns {Promise}
 */
var updateParentsId = () => {
  return new Promise((resolve, reject)=> {
    console.log('Labels:parrentUpdate:start');
    models.label.findAll({
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
      .then((res)=> {
        var promiseList = [];
        res.forEach((item)=> {
          promiseList.push(models.label.update({
              labelId: item.id
            }, {
              where: {
                parentText: item.key
              }
            }
          ));
        });
        Promise.all(promiseList)
          .then(()=> {
            resolve(loadLabels());
          })
          .catch((err)=> {
            reject(err);
          })
      })
      .catch((err)=> {
        reject(err);
      });
  });
}
/**
 *
 * @returns {Promise}
 */
var loadLabels = ()=> {
  console.log('INFO: Loading labels');
  return new Promise((resolve, reject)=> {
    models.label.findAll({
      // where: {
      //   type: {$ne: LABEL_TYPES.UNKNOWN}
      // },
      order: [
        [models.sequelize.fn('character_length', models.sequelize.col('key')), 'DESC']
      ],
      include: [{
        as: 'labeltutor',
        model: models.labeltutor
      }]
    })
      .then((data) => {
        var labels = {};
        data.forEach((element)=> {
          labels[element.timetableId || element.key] = element;
        });
        console.log('INFO: Succesfuly loaded labels');
        resolve(labels);
      })
      .catch((err)=> {
        console.log('ERROR: Loading labels');
        reject(err);
      });
  });
};

var updateMoodleId = (id, moodleId)=> {
  return new Promise((resolve, reject)=> {
    if (moodleId) {
      models.labeltutor.findOrCreate({
        where: {
          labelId: id
        },
        defaults: {
          labelId: id,
          moodleId: moodleId
        }
      }).then((labelTutor, created)=> {


        console.log(labelTutor, created);
        process.exit()
        if (labelTutor[0].moodleId !== moodleId) {
          labelTutor[0].moodleId = moodleId;
          resolve(labelTutor[0].save());
        }
        else {
          resolve();
        }
      });
    }
    else {
      resolve();
    }
  });

}

var updateLabel = (label)=> {
  return new Promise((resolve, reject)=> {
    models.label.findOrCreate({
      where: {
        timetableId: label.timetableId,
        key: label.key
      },
      defaults: label
    })
      .then((data, created)=> {

        if (label.type === LABEL_TYPES.TUTOR && label.moodleId) {
          resolve(updateMoodleId(data[0].id, label.labeltutor.moodleId));
        } else {
          resolve();
        }
      })
      .catch((err)=> {
        reject(err);
        // console.log(err);
      });
  });
};

var updateLabels = (data)=> {
  return new Promise((resolve, reject)=> {
    var promiseList = [];
    console.log('INFO: Updating labels');
    for (var label in data.labels) {
      promiseList.push(updateLabel(data.labels[label]));
    }
    Promise.all(promiseList)
      .then(()=> {
        updateParentsId()
          .then((labels)=> {
            data.labels = labels;
            console.log('INFO: Succesfuly updated labels');
            resolve(data);
          })
          .catch((err)=> {
            console.log('ERROR: Updating labels');
            reject(err);
          })
      })
      .catch((err)=> {
        console.log('ERROR: Updating labels');
        reject(err);
      });
  });


};

var getPrefix = (val)=> {
  return (val.split(', ').length > 1) ? val.split(',')[1].trim() : null;
}

var resolveTutorsName = ()=> {
  return new Promise((resolve, reject)=> {
    models.label
      .findAll({
        where: {
          type: LABEL_TYPES.TUTOR,
          value: {$ne: null}
        },
        include: [{
          as: 'labeltutor',
          model: models.labeltutor
        }]
      })
      .then((labels)=> {
        var list = [];
        labels.forEach((label)=> {


          if (label.value) {

            var prefix, surename, forename;


            prefix = getPrefix(label.key);

            var prefixLength = prefix ? prefix.length : 0;


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
                surename = sValue.slice(sKey.length - sKeyFirstSpace - i).trim();
                forename = sValue.slice(0, sValue.length - sKeyFirstSpace - i).trim();
                list.push(models.labeltutor.findOrCreate({
                  where: {labelId: label.id},
                  defaults: {prefix: prefix, forename: forename, surename: surename}
                }));
                break;
              }
              i++;
            } while (i < sKey.length);


          }
        });

        Promise.all(list)
          .then((d)=> {
            d.forEach((data) => {

              if (data[1] === false) {
                console.log(data[0].dataValues)
              }
            })
            console.log(data);


            resolve();
          })
          .catch((err)=> {
            reject(err);
          });
      })
      .catch((err)=> {
        reject(err);
      });
  });
};

module.exports = {
  resolveTutorsName: resolveTutorsName,
  updateLabels: updateLabels,
  loadLabels: loadLabels
}


