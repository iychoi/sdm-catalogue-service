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
var utils = require('./utils.js');
var clientConfig = require('./client_config.js');
var restler = require('restler');
var minimist = require('minimist');
var fs = require('fs');
var async = require('async');
var path = require('path');

function get_default_client_config_path() {
    return util.format("%s/%s", __dirname, "client_config.json");
}

function parse_args(args) {
    var options = {
        user: "",
        password: "",
        username: "",
        user_pkey_path: "",
        dataset: "",
        volume: "",
        ms_host: "",
        gateway: "",
        description: "",
        config_path: ""
    };

    // skip first two args
    // 1: node
    // 2: *.js script
    var argv = minimist(args.slice(2));

    // parse
    options.user = argv.u || "";
    options.password = argv.p || "";
    options.username = argv.n || "";
    options.user_pkey_path = argv.k || "";
    options.dataset = argv.d || "";
    options.volume = argv.v || options.dataset;
    options.ms_host = argv.m || "http://syndicate-ms-datasets-prod.appspot.com:80";
    options.gateway = argv.g || "";
    options.description = argv.description || options.dataset;
    options.config_path = argv.c || get_default_client_config_path();

    return options;
}

function check_config(conf) {
    if(conf.user && conf.password && conf.username && conf.user_pkey_path && conf.dataset && conf.volume && conf.ms_host && conf.gateway && conf.description && conf.service_host && conf.service_port > 0) {
        return true;
    }
    return false;
}

function add_dataset(host, port, user, password, username, user_pkey_path, dataset, volume, ms_host, gateway, description, callback) {
    var url = util.format("http://%s:%d/datasets/add", host, port);
    var complete_callback = function(result, response) {
        if(result instanceof Error) {
            //utils.log_error(util.format("[%s:%d] %s", node_host, node_port, result));
            callback(result, null);
            return;
        } else {
            //utils.log_info(util.format("[%s:%d] %s", node_host, node_port, JSON.stringify(result)));
            callback(null, result);
            return;
        }
    };

    fs.stat(user_pkey_path, function(err, stat) {
        if(err) {
            utils.log_error("Error occurred - "+ err);
            callback(util.format("Cannot open cert: %s", user_pkey_path), null);
            return;
        }

        fs.readFile(user_pkey_path, function(err, cert_data) {
            if(err) {
                utils.log_error(util.format("error occurred - %s", err));
                callback(util.format("cannot read cert: %s", user_pkey_path), null);
                return;
            }

            restler.post(url, {
                multipart: false,
                username: user,
                password: password,
                data: {
                    'username': username,
                    'dataset': dataset,
                    'volume': volume,
                    'ms_host': ms_host,
                    'gateway': gateway,
                    'description': description,
                    'user_pkey': cert_data
                }
            }).on('complete', complete_callback);
        });
    });
}

(function main() {
    utils.log_info("Add a dataset");

    var param = parse_args(process.argv);
    var client_config = clientConfig.get_config(param.config_path, {
        "user": param.user,
        "password": param.password,
        "username": param.username,
        "user_pkey_path": param.user_pkey_path,
        "dataset": param.dataset,
        "volume": param.volume,
        "ms_host": param.ms_host,
        "gateway": param.gateway,
        "description": param.description
    });
    if(client_config == null) {
        utils.log_error("cannot read configuration");
        process.exit(1);
    }

    if(!check_config(client_config)) {
        utils.log_error("arguments are not given properly");
        process.exit(1);
    }

    try {
        var host = client_config.service_host;
        var port = client_config.service_port;

        add_dataset(host, port, client_config.user, client_config.password, client_config.username, client_config.user_pkey_path, client_config.dataset, client_config.volume, client_config.ms_host, client_config.gateway, client_config.description, function(err, result) {
            if(err) {
                utils.log_error(util.format("[%s:%d] %s", host, port, err));
                return;
            }

            console.log("DONE!")
            process.exit(0);
        });
    } catch (e) {
        utils.log_error(util.format("Exception occured: %s", e));
        process.exit(1);
    }
})();
