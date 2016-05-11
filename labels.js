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

var getPrefix = (val)=> {
    return (val.split(',').length > 1) ? val.split(',')[1].trim() : null;
}

var resolveTutorsName = ()=> {
    return new Promise((resolve, reject)=> {
        models.label.findAll({
            where: {
                type: 'N',
                value: {$ne: null}
            }
        }).then((tutors)=> {
            tutors.forEach((tutor)=> {
                tutor.dataValues.prefix = getPrefix(tutor.dataValues.key);


                var prefix = ( tutor.dataValues.prefix) ? tutor.dataValues.prefix.length : 0;


                var sKey = tutor.dataValues.key.slice(0, ( ( prefix === 0) ? tutor.dataValues.key.length : tutor.dataValues.key.length - prefix - 1)).trim();
                var sValue = tutor.dataValues.value.slice(prefix, tutor.dataValues.value.length).trim();


                var sKeyFirstSpace = sKey.indexOf(' ');

                var i = 0;
                do {
                    /**
                     * Szukanie podobieństw
                     *          ala ma kot -->>
                     *            <<-- kota ma ale
                     */
                    if (sValue.slice(sValue.length - ( sKeyFirstSpace + i)) === sKey.slice(0, sKeyFirstSpace + i)) {
                        tutor.dataValues.surname = sValue.slice(sKey.length - sKeyFirstSpace - i).trim();
                        tutor.dataValues.forename = sValue.slice(0, sValue.length - sKeyFirstSpace - i).trim();
                        break;
                    }
                    i++;
                } while (i < sKey.length);
            })
            tutors.forEach((tutor)=> {

                var list = [];
                list.push(models.label.update({
                    surname: tutor.dataValues.surname,
                    forename: tutor.dataValues.forename,
                    prefix: tutor.dataValues.prefix
                }, {
                    where: {
                        id: tutor.dataValues.id
                    }
                }));
                Promise.all(list)
                    .then((x)=> {
                        resolve();
                    })
                    .catch((err)=> {
                        reject(err);
                    });
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


