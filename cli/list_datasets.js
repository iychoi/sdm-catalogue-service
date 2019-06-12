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
        config_path: ""
    };

    // skip first two args
    // 1: node
    // 2: *.js script
    var argv = minimist(args.slice(2));

    // parse
    options.user = argv.u || "";
    options.password = argv.p || "";
    options.config_path = argv.c || get_default_client_config_path();

    return options;
}

function check_config(conf) {
    if(conf.user && conf.password && conf.service_host && conf.service_port > 0) {
        return true;
    }
    return false;
}

function list_datasets(host, port, user, password, callback) {
    var url = util.format("http://%s:%d/datasets/list", host, port);
    restler.get(url).on('complete', function(result, response) {
        if(result instanceof Error) {
            //utils.log_error(util.format("[%s:%d] %s", host, port, result));
            callback(result, null);
            return;
        } else {
            //utils.log_info(util.format("[%s:%d] %s", host, port, JSON.stringify(result)));
            callback(null, result);
            return;
        }
    });
}

(function main() {
    utils.log_info("List datasets");

    var param = parse_args(process.argv);
    var client_config = clientConfig.get_config(param.config_path, {
        "user": param.user,
        "password": param.password
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
        list_datasets(host, port, client_config.user, client_config.password, function(err, result) {
            if(err) {
                utils.log_error(util.format("[%s:%d] %s", host, port, err));
                return;
            }

            for(i in result) {
                item = result[i];
                console.log(JSON.stringify(item))
                //utils.log_info(JSON.stringify(item));
            }
            process.exit(0);
        });
    } catch (e) {
        utils.log_error(util.format("Exception occured: %s", e));
        process.exit(1);
    }
})();
