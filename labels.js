'use strict';
var models = require('uekplan-models');
/**
 *
 */
exports.loadLabels = ()=> {
    console.log('Load labels from db');
    return new Promise((resolve, reject)=> {
        models.label.findAll({
            where: {type: {$ne: '?'}},
            order: [[models.sequelize.fn('character_length', models.sequelize.col('key')), 'DESC']]
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
    })
}

exports.updateLabels = (labels)=> {
    return new Promise((resolve, reject)=> {
        console.log('Update labels id db');

        var promiseList = [];
        for (var item in labels) {
            promiseList.push(models.label.findOrCreate({
                where: {timetableId: labels[item].timetableId, key: labels[item].key},
                defaults: labels[item]
            }));
        }
        Promise.all(promiseList)
            .then(()=> {
                console.log('Labels:add:stop');
                resolve(updateParentsId());
            }).catch((err)=> {
            reject(err);
        });
    });
};

function updateParentId() {
    return new Promise((resolve, reject)=> {
        console.log('Labels:parrentUpdate:start');
        models.label.findAll({
            where: {
                $or: [{type: 'F'}, {type: 'B'}, {type: 'C'}],
            }, order: [[models.sequelize.fn('', models.sequelize.col('key')), 'DESC']]
        })
            .then((res)=> {
                var promiseList = [];
                res.forEach((item)=> {
                    promiseList.push(models.label.update({parentId: item.dataValues.id}, {where: {parentText: item.dataValues.key}}));
                });

                Promise.all(promiseList)
                    .then(()=> {
                        resolve(this.loadLabels());
                    })
                    .catch((err)=> {
                        reject(err);
                    })
            });
    }).catch((err)=> {
        reject(err);
    })
}



