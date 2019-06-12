/*
   Copyright 2016 The Trustees of University of Arizona

   Licensed under the Apache License, Version 2.0 (the "License" );
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var util = require('util');
var utils = require('./utils.js');
var url = require('url');
var sqlite3 = require('sqlite3').verbose();


function open_database(path, callback) {
    var db = new sqlite3.Database(path, function(err) {
        if(err) {
            callback(err, null);
            return;
        }
    });

    var sql = "CREATE TABLE IF NOT EXISTS datasets (dataset TEXT PRIMARY KEY, reg_user TEXT NOT NULL, ms_host TEXT NOT NULL, volume TEXT NOT NULL, gateway TEXT NOT NULL, username TEXT NOT NULL, user_pkey TEXT NOT NULL, description TEXT NOT NULL)";
    db.run(sql, function(err) {
        if(err) {
            callback(err, null);
            return;
        }

        callback(null, db);
        return;
    });
}

function close_database(db, callback) {
    if(!db) {
        callback("db is null", null);
        return;
    }

    db.close(function(err) {
        if(err) {
            callback(err, null);
            return;
        }

        callback(null, "closed");
        return;
    });
}

function get_dataset(db, dataset, callback) {
    utils.log_debug(util.format("retriving a dataset - name(%s)", dataset));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "SELECT dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description FROM datasets WHERE dataset = ?";
    db.get(sql, [dataset], function(err, row) {
        if(err) {
            callback(err, null);
            return;
        }

        if(!row) {
            callback(null, null);
            return;
        }

        var dataset_record = {
            dataset: row.dataset,
            reg_user: row.reg_user,
            ms_host: row.ms_host,
            volume: row.volume,
            gateway: row.gateway,
            username: row.username,
            user_pkey: row.user_pkey,
            description: row.description
        };
        callback(null, dataset_record);
        return;
    });
}

function check_dataset(db, dataset, callback) {
    if(!db) {
        callback("db is null", null);
        return;
    }

    get_dataset(db, dataset, function(err, record) {
        if(err) {
            callback(err, null);
            return;
        }

        if(!record) {
            callback(null, false);
            return;
        }

        callback(null, true);
        return;
    });
}

function list_datasets(db, callback) {
    utils.log_debug("listing datasets");

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "SELECT dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description FROM datasets";
    db.all(sql, [], function(err, rows) {
        if(err) {
            callback(err, null);
            return;
        }

        var dataset_records = []
        for(var i=0;i<rows.length;i++) {
            var row = rows[i];
            var dataset_record = {
                dataset: row.dataset,
                ms_host: row.ms_host,
                volume: row.volume,
                gateway: row.gateway,
                username: row.username,
                user_pkey: row.user_pkey,
                description: row.description
            };
            dataset_records.push(dataset_record);
        }

        callback(null, dataset_records);
        return;
    });
}

function add_dataset(db, dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description, callback) {
    utils.log_debug(util.format("adding a dataset - dataset(%s) / reg_user(%s) / MS(%s) / volume(%s) / gateway(%s) / username(%s) / description(%s)", dataset, reg_user, ms_host, volume, gateway, username, description));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "INSERT INTO datasets (dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description) values (?, ?, ?, ?, ?, ?, ?, ?)";
    db.run(sql, [dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description], function(err) {
        if(err) {
            callback(err, null);
            return;
        }

        callback(null, "succeed");
        return;
    });
}

function remove_dataset(db, dataset, reg_user, callback) {
    utils.log_debug(util.format("removing a dataset - dataset(%s) / reg_user(%s)", dataset, reg_user));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "DELETE FROM datasets WHERE dataset = ? AND reg_user = ?";
    db.run(sql, [dataset, reg_user], function(err) {
        if(err) {
            callback(err, null);
            return;
        }

        callback(null, "succeed");
        return;
    });
}

/**
 * Expose root class
 */
module.exports = {
    init: function(db_path, callback) {
        if(!db_path) {
            db_path = util.format("%s/.sdm_cs/catalogue_service.db", __dirname);
        }

        open_database(db_path, function(err, db) {
            if(err) {
                callback(err, null);
                return;
            }

            handle = {
                db_path: db_path,
                db: db,
                close: function(callback) {
                    close_database(db, callback);
                },
                check: function(dataset, callback) {
                    check_dataset(db, dataset, callback);
                },
                get: function(dataset, callback) {
                    get_dataset(db, dataset, callback);
                },
                list: function(callback) {
                    list_datasets(db, callback);
                },
                add: function(dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description, callback) {
                    add_dataset(db, dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description, callback);
                },
                remove: function(dataset, reg_user, callback) {
                    remove_dataset(db, dataset, reg_user, callback);
                }
            };
            callback(null, handle);
            return;
        });
    },
    close: function(handle, callback) {
        close_database(handle.db, callback);
    },
    check: function(handle, dataset, callback) {
        check_dataset(handle.db, dataset, callback);
    },
    get: function(handle, dataset, callback) {
        get_dataset(handle.db, dataset, callback);
    },
    list: function(handle, callback) {
        list_datasets(handle.db, callback);
    },
    add: function(handle, dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description, callback) {
        add_mount(handle.db, dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description, callback);
    },
    remove: function(handle, dataset, reg_user, callback) {
        remove_dataset(handle.db, dataset, reg_user, callback);
    }
};
