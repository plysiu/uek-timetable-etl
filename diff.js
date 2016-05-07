'use strict';
var models = require('uekplan-models');

var moveFromTempToEvents = ()=> {
    console.log('moveFromTempToEvents')

    return new Promise((resolve, reject)=> {

        models.sequelize.query('INSERT INTO events(`date`,`day`,`from`,`to`,activity,`type`,placeId,tutorId,groupId,note,blocks) ' +
            'SELECT A.`date`, A.`day`, A.`from`, A.`to`, A.activity, A.`type`, A.placeId, A.tutorId, A.groupId, A.note, A.blocks ' +
            'FROM `eventTemps` AS A ' +
            'LEFT JOIN events AS B ' +
            'USING (`date`, `from`, `to`, activity, `type`, tutorId, placeId, groupId) ' +
            'WHERE B.id IS NULL;').then((data, meta)=> {
            console.log(data, meta);
            resolve();
        }).catch((err)=> {
            reject(err);
        })
    });
}
// http://stackoverflow.com/questions/11103208/compare-two-tables-mysql
//
var setDeleteInEventsWhenNotExists = ()=> {
    console.log('setDeleteInEventsWhenNotExists')
    return new Promise((resolve, reject)=> {

        models.sequelize.query('UPDATE `events` AS A,' +
            '(SELECT A.id ' +
            'FROM `events` AS A ' +
            'LEFT JOIN eventTemps AS B ' +
            'USING (`date`, `from`, `to`, activity, `type`, tutorId, placeId, groupId) ' +
            'WHERE B.id IS NULL) AS X ' +
            'SET A.deleted=1 ' +
            'WHERE A.id IN(X.id);'
        ).then((data, meta)=> {
            console.log(data, meta);
            resolve();

        }).catch((err)=> {
            reject(err);
        })
    });
}

var setUnDeletedInEventsWhenExists = ()=> {
    console.log('setUnDeletedInEventsWhenExists')
    return new Promise((resolve, reject)=> {

        models.sequelize.query('UPDATE `events` AS A, ' +
            '(SELECT A.id ' +
            'FROM `events` AS A ' +
            'LEFT JOIN eventTemps AS B ' +
            'USING (`date`, `from`, `to`, activity, `type`, tutorId, placeId, groupId) ' +
            'WHERE B.id IS NOT NULL) AS X ' +
            'SET A.deleted=0 ' +
            'WHERE ' +
            'A.id IN(X.id);'
        ).then((data, meta)=> {
            console.log(data, meta);
            resolve();

        }).catch((err)=> {
            reject(err);
        })
    });
}

module.exports = {

    moveFromTempToEvents: moveFromTempToEvents,
    setDeleteInEventsWhenNotExists: setDeleteInEventsWhenNotExists,
    setUnDeletedInEventsWhenExists: setUnDeletedInEventsWhenExists
}