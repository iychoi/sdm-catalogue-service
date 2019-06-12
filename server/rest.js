#!/usr/bin/env node
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
var express = require('express');
var expressSession = require('express-session');
var cors = require('cors');
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var async = require('async');
var passport = require('passport');
var basicStrategy = require('passport-http').BasicStrategy;
var utils = require('./utils.js');
var usersAPI = require('./users.js');
var datasetsAPI = require('./datasets.js');
var cdnsAPI = require('./cdns.js');
var restUtils = require('./rest_utils.js');
var restUsersAPI = require('./rest_users_api.js');
var restDatasetsAPI = require('./rest_datasets_api.js');
var restCDNsAPI = require('./rest_cdns_api.js');

var authenticate = passport.authenticate('basic');

module.exports = {
    init: function(app, server_config, callback) {
        // init REST
        utils.log_info("init: initializing REST framework");

        // allow cors
        app.use(cors());

        // set session
        app.use(expressSession({
            secret: utils.generate_random_string(64),
            resave: false,
            saveUninitialized: true,
        }));

        app.use(bodyParser.urlencoded({
            extended: true
        }));

        utils.create_dir_recursively_sync(path.dirname(server_config.db_path));
        async.series({
            datasets: function(cb) {
                utils.log_info("init: initializing datasets");
                datasetsAPI.init(server_config.db_path, function(err, datasets) {
                    if(err) {
                        cb(util.format("could not init datasets - %s", err), null);
                        return;
                    }

                    // init
                    utils.log_info("init: loading init_datasets");
                    var DEFAULT_INIT_DATASET_FILENAME = './init_dataset.json';
                    try {
                        var init_data = fs.readFileSync(DEFAULT_INIT_DATASET_FILENAME, 'utf8');
                        if(utils.is_json_string(init_data)) {
                            var json_val = JSON.parse(init_data);
                            for(dataset_idx in json_val) {
                                var dataset_item = json_val[dataset_idx];
                                datasets.add(dataset_item["dataset"], "admin", dataset_item["ms_host"], dataset_item["volume"], dataset_item["gateway"], dataset_item["username"], dataset_item["user_pkey"], dataset_item["description"], function(err2, result) {});
                            }
                        }
                    } catch (e) {
                    }

                    cb(null, datasets);
                    return;
                });
            },
            cdns: function(cb) {
                utils.log_info("init: initializing cdns");
                cdnsAPI.init(server_config.db_path, function(err, cdns) {
                    if(err) {
                        cb(util.format("could not init cdns - %s", err), null);
                        return;
                    }

                    // init
                    utils.log_info("init: loading init_cdns");
                    var DEFAULT_INIT_CDN_FILENAME = './init_cdn.json';
                    try {
                        var init_data = fs.readFileSync(DEFAULT_INIT_CDN_FILENAME, 'utf8');
                        if(utils.is_json_string(init_data)) {
                            var json_val = JSON.parse(init_data);
                            for(cdn_idx in json_val) {
                                var cdn_item = json_val[cdn_idx];
                                cdns.add_cdn(cdn_item["dataset"], cdn_item["ag_url"], function(err2, result) {
                                    for(var i=0;i<cdn_item["cdn_sites"].length;i++) {
                                        var cdn_site_item = cdn_item["cdn_sites"][i];
                                        cdns.add_cdn_site(cdn_item["dataset"], cdn_site_item["name"], cdn_site_item["gps_loc"][0], cdn_site_item["gps_loc"][1], cdn_site_item["cdn_prefix"], function(err3, result) {});
                                    }
                                });
                            }
                        }
                    } catch (e) {
                    }

                    cb(null, cdns);
                    return;
                });
            },
            users: function(cb) {
                utils.log_info("init: initializing users");
                usersAPI.init(server_config.db_path, function(err, users) {
                    if(err) {
                        cb(util.format("could not init users - %s", err), null);
                        return;
                    }
                    cb(null, users);
                    return;
                });
            }
        }, function(err, results) {
            if(err) {
                callback(err, null);
                return;
            }

            var datasets = results.datasets;
            var users = results.users;
            var cdns = results.cdns;

            app.use(function(req, res, next) {
                req.datasets = datasets;
                req.users = users;
                req.cdns = cdns;
                next();
            });

            // authentication
            passport.use(new basicStrategy(function(username, password, cb) {
                users.authenticate(username, password, cb);
            }));
            passport.serializeUser(function(username, cb) {
                users.serialize(username, cb);
            });
            passport.deserializeUser(function(username, cb) {
                users.deserialize(username, cb);
            });

            app.use(passport.initialize());
            app.use(passport.session());

            callback(null, "succeed");
            return;
        });
    },
    get_router: function() {
        var router = new express.Router();
        router.use(function(req, res, next) {
            utils.log_info(util.format("%s %s", req.method, req.url));
            req.target = querystring.unescape(req.path);
            next();
        });

        // admin apis
        router.get('/users/check', restUsersAPI.check_user);
        router.get('/datasets/list', restDatasetsAPI.list_datasets);
        router.get('/cdns/list',  restCDNsAPI.list_cdns);

        /*
         * From this point, authentication is required.
         */
        router.post('/datasets/add', authenticate, restDatasetsAPI.add_dataset);
        router.delete('/datasets/remove', authenticate, restDatasetsAPI.remove_dataset);
        router.post('/cdns/add', authenticate, restCDNsAPI.add_cdn);
        router.post('/cdns/add_site', authenticate, restCDNsAPI.add_cdn_site);
        router.delete('/cdns/remove', authenticate, restCDNsAPI.remove_cdn);
        router.delete('/cdns/remove_site', authenticate, restCDNsAPI.remove_cdn_site);
        return router;
    }
};
