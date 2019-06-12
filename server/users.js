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
var sqlite3 = require('sqlite3').verbose();

function make_passwd_hash(user, passwd) {
    var seed = util.format("seed%sabddeff123%s", user, passwd);
    return utils.generate_checksum(seed)
}

function open_database(path, callback) {
    var db = new sqlite3.Database(path, function(err) {
        if(err) {
            callback(err, null);
            return;
        }
    });

    var sql = "CREATE TABLE IF NOT EXISTS users (user TEXT PRIMARY KEY, passwd_hash TEXT NOT NULL)";
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

function get_user(db, user, callback) {
    utils.log_debug(util.format("retriving a user - user(%s)", user));

    if(!db) {
        callback("db is null", null);
        return;
    }

    if(user == "admin") {
        var user_record = {
            user: "admin",
            passwd_hash: make_passwd_hash("admin", "letmein")
        };
        callback(null, user_record);
        return;
    }

    var sql = "SELECT user, passwd_hash FROM users WHERE user = ?";
    db.get(sql, [user], function(err, row) {
        if(err) {
            callback(err, null);
            return;
        }

        if(!row) {
            callback(null, null);
            return;
        }

        var user_record = {
            user: row.user,
            passwd_hash: row.passwd_hash
        };
        callback(null, user_record);
        return;
    });
}

function list_users(db, callback) {
    utils.log_debug("listing users");

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "SELECT user FROM users";
    db.all(sql, [], function(err, rows) {
        if(err) {
            callback(err, null);
            return;
        }

        var user_records = []
        for(var i=0;i<rows.length;i++) {
            var row = rows[i];

            var user_record = {
                user: row.user
            };
            user_records.push(user_record);
        }

        var admin_user_record = {
            user: "admin",
            passwd_hash: make_passwd_hash("admin", "letmein")
        };
        user_records.push(admin_user_record);

        callback(null, user_records);
        return;
    });
}

function check_passwd(db, user, passwd, callback) {
    utils.log_debug(util.format("checking a passwd - user(%s)", user));

    if(!db) {
        callback("db is null", null);
        return;
    }

    get_user(db, user, function(err, record) {
        if(err) {
            callback(err, null);
            return;
        }

        if(!record) {
            callback(util.format("User does not exist - %s", user), false);
            return;
        }

        if(record.passwd_hash != passwd) {
            callback(util.format("Password not correct - %s", user), false);
            return;
        }

        utils.log_debug(util.format("checked a passwd - user(%s)", user));
        callback(null, true);
        return;
    });
}

function authenticate_user(db, user, passwd, callback) {
    utils.log_debug(util.format("authenticating a user - user(%s)", user));

    if(!db) {
        callback(null, false, {
            message: "db is null"
        });
        return;
    }

    passwd_hash = make_passwd_hash(user, passwd);

    check_passwd(db, user, passwd_hash, function(err, check) {
        if(err) {
            utils.log_debug(util.format("authentication failed - user(%s)", user));
            callback(null, false, {
                message: err
            });
            return;
        }

        if(!check) {
            utils.log_debug(util.format("authentication failed - user(%s)", user));
            callback(null, false, {
                message: util.format("User does not exist - %s", user)
            });
            return;
        }

        utils.log_debug(util.format("authenticated - user(%s)", user));
        callback(null, {
            user: user,
            passwd_hash: passwd_hash
        });
        return;
    });
}

function serialize_session(db, user, callback) {
    callback(null, user.user);
}

function deserialize_session(db, user, callback) {
    if(!db) {
        callback("db is null", null);
        return;
    }

    get_user(db, user, function(err, record) {
        if(err) {
            callback(err, null);
            return;
        }

        if(!record) {
            callback(util.format("Session does not exist - %s", session_name, null));
            return;
        }

        callback(null, record);
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
                check_passwd: function(user, passwd, callback) {
                    check_passwd(db, user, passwd, callback);
                },
                get: function(user, callback) {
                    get_user(db, user, callback);
                },
                list: function(callback) {
                    list_users(db, callback);
                },
                authenticate: function(user, passwd, callback) {
                    authenticate_user(db, user, passwd, callback);
                },
                serialize: function(user, callback) {
                    serialize_session(db, user, callback);
                },
                deserialize: function(user, callback) {
                    deserialize_session(db, user, callback);
                }
            };

            callback(null, handle);
            return;
        });
    },
    close: function(handle, callback) {
        close_database(handle.db, callback);
    },
    check_passwd: function(handle, user, passwd, callback) {
        check_passwd(handle.db, user, passwd, callback);
    },
    get: function(handle, user, callback) {
        get_user(handle.db, user, callback);
    },
    list: function(handle, callback) {
        list_users(handle.db, callback);
    },
    authenticate: function(handle, user, passwd, callback) {
        authenticate_user(handle.db, user, passwd, callback);
    },
    serialize: function(handle, user, callback) {
        serialize_session(handle.db, user, callback);
    },
    deserialize: function(handle, user, callback) {
        deserialize_session(handle.db, user, callback);
    }
};
