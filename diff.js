'use strict';
var models = require('uekplan-models');

exports.moveEventsFromTemporaryTable = (data) => {
  console.log('INFO: Moving events from temporary table');
  return new Promise((resolve, reject) => {
    var query = "INSERT INTO events(`date`,`day`,`from`,`to`,activityId,typeId,placeId,tutorId,groupId,noteId,blocks) SELECT A.`date`, A.`day`, A.`from`, A.`to`, A.activityId, A.`typeId`, A.placeId, A.tutorId, A.groupId, A.noteId, A.blocks FROM `event_temps` AS A LEFT JOIN events AS B USING (`date`, `from`, `to`, activityId, typeId, tutorId, placeId, groupId) WHERE B.id IS NULL;";
    models.sequelize
      .query(query)
      .then((result) => {
        data.logEntry.eventsInserted = result[0].affectedRows;
        data.logEntry
          .save()
          .then(()=> {
            console.log('INFO: Moved events from temporary table');
            resolve(data);
          })
          .catch((err) => {
            console.log('ERROR: Moving events from temporary table');
            reject(err);
          });
      })
      .catch((err) => {
        console.log('ERROR: Moving events from temporary table');
        reject(err);
      });
  });
};


// http://stackoverflow.com/questions/11103208/compare-two-tables-mysql
//
exports.deleteEventsWhenNotExistsInTemporaryTable = (data) => {
  console.log('INFO: Deleting events');
  return new Promise((resolve, reject) => {

    var query = 'UPDATE `events` AS A,(SELECT A.id FROM `events` AS A LEFT JOIN event_temps AS B USING (`date`, `from`, `to`, activityId, typeId, tutorId, placeId, groupId, noteId) WHERE B.id IS NULL) AS X SET A.deleted=1 WHERE A.id IN(X.id);';

    models.sequelize
      .query(query)
      .then((result) => {
        console.log(result);
        data.logEntry.eventsDeleted = result[0].changedRows;
        data.logEntry
          .save()
          .then(()=> {
            console.log('INFO: Deleted events');
            resolve(data);
          })
          .catch((err) => {
            console.log('ERROR: Deleting events');
            reject(err);
          });
      })
      .catch((err) => {
        console.log('ERROR: Deleting events');
        reject(err);
      });
  });
};

exports.undeletedEventsWhenExistsInTemporaryTable = (data) => {
  console.log('INFO: Undeleting events');
  return new Promise((resolve, reject) => {

    var query = 'UPDATE `events` AS A, (SELECT A.id FROM `events` AS A LEFT JOIN event_temps AS B USING (`date`, `from`, `to`, activityId, typeId, tutorId, placeId, groupId, noteId) WHERE B.id IS NOT NULL) AS X SET A.deleted=0 WHERE A.id IN(X.id);';
    models.sequelize.query(query)
      .then((result) => {
        console.log(result);
        data.logEntry.eventsUpdated = result[0].changedRows;
        data.logEntry
          .save()
          .then(()=> {
            console.log('INFO: Undeleted events');
            resolve(data);
          })
          .catch((err) => {
            console.log('ERROR: Undeleting events');
            console.log(err);
            reject(err);
          });
      })
      .catch((err) => {
        console.log('ERROR: Undeleting events');
        console.log(err);
        reject(err);
      });
  });
};

