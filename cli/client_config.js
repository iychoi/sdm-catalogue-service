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
var fs = require('fs');

var DEFAULT_CONFIG_FILENAME = './client_config.json';

function overwrite_config(conf1, conf2) {
    var conf = {};
    conf = conf1;
    var key;
    for(key in conf2) {
        var overwrite = false;
        var val = conf2[key];
        if(typeof val == "string" || typeof val == "object" || typeof val == "array") {
            if(val.length > 0) {
                overwrite = true;
            }
        } else if(typeof val == "number") {
            if(val > 0) {
                overwrite = true;
            }
        }

        if(overwrite) {
            conf[key] = val;
        }
    }
    return conf;
}

/**
 * Expose root class
 */
module.exports = {
    get_config: function(config_file, config_ext) {
        var default_config = {
            "user": "",
            "password": "",
            "service_host": "",
            "service_port": 8888
        }

        var cfile = config_file || DEFAULT_CONFIG_FILENAME;
        var config_str = "";

        try {
            config_str = fs.readFileSync(cfile, 'utf8');
        } catch (e) {
            utils.log_error(util.format("Cannot read config file : %s", cfile));
            return null;
        }

        var config = default_config;
        if(utils.is_json_string(config_str)) {
            var config2 = JSON.parse(config_str);
            config = overwrite_config(config, config2);
        }

        if(config_ext) {
            config = overwrite_config(config, config_ext);
        }
        return config;
    },
    get_config_without_default: function(config_file) {
        var config_str = "";

        try {
            config_str = fs.readFileSync(config_file, 'utf8');
        } catch (e) {
            utils.log_error(util.format("Cannot read config file : %s", config_file));
            return null;
        }

        var config = {};
        if(utils.is_json_string(config_str)) {
            config = JSON.parse(config_str);
        }
        return config;
    },
    overwrite_config: function(conf1, conf2) {
        return overwrite_config(conf1, conf2);
    }
};
