'use strict';
var models = require('uekplan-models');

exports.moveFromTempToEvents = (data) => {
  console.log('moveFromTempToEvents')

  return new Promise((resolve, reject) => {
    var query = "INSERT INTO events(`date`,`day`,`from`,`to`,activityId,typeId,placeId,tutorId,groupId,noteId,blocks) SELECT A.`date`, A.`day`, A.`from`, A.`to`, A.activityId, A.`typeId`, A.placeId, A.tutorId, A.groupId, A.noteId, A.blocks FROM `eventtemps` AS A LEFT JOIN events AS B USING (`date`, `from`, `to`, activityId, typeId, tutorId, placeId, groupId) WHERE B.id IS NULL;";
    models.sequelize
      .query(query)
      .then((result) => {
        data.logEntry.eventsInserted = result[0].affectedRows;
        data.logEntry
          .save()
          .then(()=> {
            resolve(data);
          })
          .catch((err) => {
            console.log(err);
            reject(err);
          });
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};
// http://stackoverflow.com/questions/11103208/compare-two-tables-mysql
//
exports.setDeleteInEventsWhenNotExists = (data) => {
  console.log('setDeleteInEventsWhenNotExists')
  return new Promise((resolve, reject) => {

    var query = 'UPDATE `events` AS A,' +
      '(SELECT A.id ' +
      'FROM `events` AS A ' +
      'LEFT JOIN eventtemps AS B ' +
      'USING (`date`, `from`, `to`, activityId, typeId, tutorId, placeId, groupId, noteId) ' +
      'WHERE B.id IS NULL) AS X ' +
      'SET A.deleted=1 ' +
      'WHERE A.id IN(X.id);';

    models.sequelize
      .query(query)
      .then((result) => {
        console.log(result);
        data.logEntry.eventsDeleted = result[0].affectedRows;
        data.logEntry
          .save()
          .then(()=> {
            resolve(data);
          })
          .catch((err) => {
            console.log(err);
            reject(err);
          });
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      })
  });
};

exports.setUnDeletedInEventsWhenExists = (data) => {
  console.log('setUnDeletedInEventsWhenExists')
  return new Promise((resolve, reject) => {

    var query = 'UPDATE `events` AS A, ' +
      '(SELECT A.id ' +
      'FROM `events` AS A ' +
      'LEFT JOIN eventtemps AS B ' +
      'USING (`date`, `from`, `to`, activityId, typeId, tutorId, placeId, groupId) ' +
      'WHERE B.id IS NOT NULL) AS X ' +
      'SET A.deleted=0 ' +
      'WHERE ' +
      'A.id IN(X.id);';
    models.sequelize.query(query)
      .then((result) => {
        console.log(result);
        data.logEntry.eventsUpdated = result[0].affectedRows;
        data.logEntry
          .save()
          .then(()=> {
            resolve(data);
          })
          .catch((err) => {
            console.log(err);
            reject(err);
          });
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

