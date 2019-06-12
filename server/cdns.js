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

    var sql1 = "CREATE TABLE IF NOT EXISTS cdns (dataset TEXT PRIMARY KEY, ag_url TEXT NOT NULL)";
    var sql2 = "CREATE TABLE IF NOT EXISTS cdn_sites (dataset TEXT PRIMARY KEY, name TEXT NOT NULL, gps_loc1 TEXT NOT NULL, gps_loc2 TEXT NOT NULL, cdn_prefix TEXT NOT NULL)";

    db.run(sql1, function(err1) {
        if(err1) {
            callback(err1, null);
            return;
        }

        db.run(sql2, function(err2) {
            if(err2) {
                callback(err2, null);
                return;
            }

            callback(null, db);
            return;
        });
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

function get_cdn_sites(db, dataset, callback) {
    utils.log_debug(util.format("retriving cdn sites for a dataset - name(%s)", dataset));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "SELECT dataset, name, gps_loc1, gps_loc2, cdn_prefix FROM cdn_sites WHERE dataset = ?";
    db.all(sql, [dataset], function(err, rows) {
        if(err) {
            callback(err, null);
            return;
        }

        var cdn_site_records = []
        for(var i=0;i<rows.length;i++) {
            var row = rows[i];
            var cdn_site_record = {
                name: row.name,
                gps_loc: [parseFloat(row.gps_loc1), parseFloat(row.gps_loc2)],
                cdn_prefix: row.cdn_prefix
            };
            cdn_site_records.push(cdn_site_record);
        }

        callback(null, cdn_site_records);
        return;
    });
}

function get_cdn(db, dataset, callback) {
    utils.log_debug(util.format("retriving cdn for a dataset - name(%s)", dataset));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "SELECT dataset, ag_url FROM cdns WHERE dataset = ?";
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
            ag_url: row.ag_url
        };

        callback(null, dataset_record);
        return;
    });
}

function get_cdn_info(db, dataset, callback) {
    utils.log_debug(util.format("retriving cdn info for a dataset - name(%s)", dataset));

    if(!db) {
        callback("db is null", null);
        return;
    }

    get_cdn(db, dataset, function(err1, cdn) {
        if(err1) {
            callback(err1, null);
            return;
        }

        if(!cdn) {
            callback(err1, null);
            return;
        }

        get_cdn_sites(db, dataset, function(err2, cdn_sites) {
            if(err2) {
                callback(err2, null);
                return;
            }

            sites = [];
            if(cdn_sites) {
                sites = cdn_sites;
            }

            var cdn_record = {
                dataset: row.dataset,
                ag_url: row.ag_url,
                cdn_sites: sites
            };
            callback(null, cdn_record);
        });
        return;
    });
}

function check_cdn(db, dataset, callback) {
    if(!db) {
        callback("db is null", null);
        return;
    }

    get_cdn(db, dataset, function(err, record) {
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

function list_cdn(db, callback) {
    utils.log_debug("listing cdn");

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "SELECT dataset, ag_url FROM cdns";
    db.all(sql, [], function(err, rows) {
        if(err) {
            callback(err, null);
            return;
        }

        var cdn_records = [];
        for(var i=0;i<rows.length;i++) {
            var row = rows[i];
            var cdn_record = {
                dataset: row.dataset,
                ag_url: row.ag_url
            };
            cdn_records.push(cdn_record);
        }

        callback(null, cdn_records);
        return;
    });
}

function list_cdn_sites(db, callback) {
    utils.log_debug("listing cdn sites");

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "SELECT dataset, name, gps_loc1, gps_loc2, cdn_prefix FROM cdn_sites";
    db.all(sql, [], function(err, rows) {
        if(err) {
            callback(err, null);
            return;
        }

        var cdn_site_records = []
        for(var i=0;i<rows.length;i++) {
            var row = rows[i];
            var cdn_site_record = {
                dataset: row.dataset,
                name: row.name,
                gps_loc: [parseFloat(row.gps_loc1), parseFloat(row.gps_loc2)],
                cdn_prefix: row.cdn_prefix
            };
            cdn_site_records.push(cdn_site_record);
        }

        callback(null, cdn_site_records);
        return;
    });
}

function list_cdn_info(db, callback) {
    utils.log_debug("listing cdn info");

    if(!db) {
        callback("db is null", null);
        return;
    }

    list_cdn(db, function(err1, cdns) {
        if(err1) {
            callback(err1, null);
            return;
        }

        list_cdn_sites(db, function(err2, cdn_sites) {
            if(err2) {
                callback(err2, null);
                return;
            }

            var cdn_infos = [];

            for(var i=0;i<cdns.length;i++) {
                var cdn = cdns[i];
                cdn.cdn_sites = [];

                for(var j=0;j<cdn_sites.length;j++) {
                    var cdn_site = cdn_sites[j];
                    if(cdn_site.dataset === cdn.dataset) {
                        cdn.cdn_sites.push({
                            name: cdn_site.name,
                            gps_loc: cdn_site.gps_loc,
                            cdn_prefix: cdn_site.cdn_prefix
                        });
                    }
                }
                cdn_infos.push(cdn);
            }

            callback(null, cdn_infos);
        });
        return;
    });
}

function add_cdn(db, dataset, ag_url, callback) {
    utils.log_debug(util.format("adding a cdn for a dataset - dataset(%s) / ag_url(%s)", dataset, ag_url));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "INSERT INTO cdns (dataset, ag_url) values (?, ?)";
    db.run(sql, [dataset, ag_url], function(err) {
        if(err) {
            callback(err, null);
            return;
        }

        callback(null, "succeed");
        return;
    });
}

function add_cdn_site(db, dataset, name, gps_loc1, gps_loc2, cdn_prefix, callback) {
    utils.log_debug(util.format("adding a cdn site for a dataset - dataset(%s) / name(%s) / gps_loc (%f, %f) / cdn_prefix (%s)", dataset, name, gps_loc1, gps_loc2, cdn_prefix));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "INSERT INTO cdn_sites (dataset, name, gps_loc1, gps_loc2, cdn_prefix) values (?, ?, ?, ?, ?)";
    db.run(sql, [dataset, name, gps_loc1.toString(), gps_loc2.toString(), cdn_prefix], function(err) {
        if(err) {
            callback(err, null);
            return;
        }

        callback(null, "succeed");
        return;
    });
}

function remove_cdn(db, dataset, callback) {
    utils.log_debug(util.format("removing a cdn for a dataset - dataset(%s)", dataset));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql1 = "DELETE FROM cdns WHERE dataset = ?";
    var sql2 = "DELETE FROM cdn_sites WHERE dataset = ?";
    db.run(sql1, [dataset], function(err1) {
        if(err1) {
            callback(err1, null);
            return;
        }

        db.run(sql2, [dataset], function(err2) {
            if(err2) {
                callback(err2, null);
                return;
            }

            callback(null, "succeed");
        });
        return;
    });
}

function remove_cdn_site(db, dataset, name, callback) {
    utils.log_debug(util.format("removing a cdn site for a dataset - dataset(%s) / name(%s)", dataset, name));

    if(!db) {
        callback("db is null", null);
        return;
    }

    var sql = "DELETE FROM cdn_sites WHERE dataset = ? AND name = ?";
    db.run(sql, [dataset, name], function(err) {
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
                    check_cdn(db, dataset, callback);
                },
                get: function(dataset, callback) {
                    get_cdn_info(db, dataset, callback);
                },
                list: function(callback) {
                    list_cdn_info(db, callback);
                },
                add_cdn: function(dataset, ag_url, callback) {
                    add_cdn(db, dataset, ag_url, callback);
                },
                add_cdn_site: function(dataset, name, gps_loc1, gps_loc2, cdn_prefix, callback) {
                    add_cdn_site(db, dataset, name, gps_loc1, gps_loc2, cdn_prefix, callback);
                },
                remove_cdn: function(dataset, callback) {
                    remove_cdn(db, dataset, callback);
                },
                remove_cdn_site: function(dataset, name, callback) {
                    remove_cdn_site(db, dataset, name, callback);
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
        check_cdn(handle.db, dataset, callback);
    },
    get: function(handle, dataset, callback) {
        get_cdn_info(handle.db, dataset, callback);
    },
    list: function(handle, callback) {
        list_cdn_info(handle.db, callback);
    },
    add_cdn: function(handle, dataset, ag_url, callback) {
        add_cdn(handle.db, dataset, ag_url, callback);
    },
    add_cdn_site: function(handle, dataset, name, gps_loc1, gps_loc2, cdn_prefix, callback) {
        add_cdn_site(handle.db, dataset, name, gps_loc1, gps_loc2, cdn_prefix, callback);
    },
    remove_cdn: function(handle, dataset, callback) {
        remove_cdn(handle.db, dataset, callback);
    },
    remove_cdn_site: function(handle, dataset, name, callback) {
        remove_cdn_site(handle.db, dataset, name, callback);
    },
};
