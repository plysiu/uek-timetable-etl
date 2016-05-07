'use strict';
var models = require('uekplan-models');
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
                    {type: 'F'},
                    {type: 'B'},
                    {type: 'C'}
                ]
            }, order: [
                [models.sequelize.fn('', models.sequelize.col('key')), 'DESC'],
                ['key', 'DESC']
            ]
        }).then((res)=> {
            var promiseList = [];
            res.forEach((item)=> {
                promiseList.push(models.label.update(
                    {
                        parentId: item.dataValues.id
                    }, {
                        where: {
                            parentText: item.dataValues.key
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
        }).catch((err)=> {
            reject(err);
        });
    });
}
/**
 *
 * @returns {Promise}
 */
var loadLabels = ()=> {
    console.log('Loading labels from db');
    return new Promise((resolve, reject)=> {
        models.label.findAll({
            where: {
                type: {$ne: '?'}
            },
            order: [
                [models.sequelize.fn('character_length', models.sequelize.col('key')), 'DESC']
            ]
        })
            .then((data) => {
                var labels = {};
                data.forEach((element)=> {
                    labels[element.dataValues.timetableId || element.dataValues.key] = element.dataValues;
                });
                resolve(labels);
            })
            .catch((err)=> {
                reject(err);
            });
    });
}

var updateLabels = (labels)=> {
    return new Promise((resolve, reject)=> {
        console.log('Updating labels in db');

        var promiseList = [];
        for (var label in labels) {
            promiseList.push(models.label.findOrCreate({
                where: {
                    timetableId: labels[label].timetableId,
                    key: labels[label].key
                },
                defaults: labels[label]
            }));
        }
        Promise.all(promiseList)
            .then(()=> {
                resolve(updateParentsId());
            })
            .catch((err)=> {
                reject(err);
            });
    });
}

module.exports = {
    updateLabels: updateLabels,
    loadLabels: loadLabels
}


