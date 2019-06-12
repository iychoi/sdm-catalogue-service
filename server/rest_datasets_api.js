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
var restUtils = require('./rest_utils.js');
var utils = require('./utils.js');
var datasetsAPI = require('./datasets.js');
var async = require('async');
var fs = require('fs');

/**
 * Expose root class
 */
module.exports = {
    list_datasets: function(req, res) {
        var options = req.query;
        var datasets = req.datasets;

        try {
            datasets.list(function(err, result) {
                if(err) {
                    restUtils.return_error(req, res, err);
                    return;
                }

                restUtils.return_data(req, res, result);
                return;
            });
        } catch (ex) {
            restUtils.return_error(req, res, ex);
            return;
        }
    },
    add_dataset: function(req, res) {
        var options = req.query;
        var datasets = req.datasets;
        var reg_user = req.user.user;

        var ms_host = restUtils.get_post_param("ms_host", options, req.body);
        if(ms_host === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - ms_host is not given");
            return;
        }

        var dataset = restUtils.get_post_param("dataset", options, req.body);
        if(dataset === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - dataset is not given");
            return;
        }

        var volume = restUtils.get_post_param("volume", options, req.body);
        if(volume === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - volume is not given");
            return;
        }

        var gateway = restUtils.get_post_param("gateway", options, req.body);
        if(gateway === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - gateway is not given");
            return;
        }

        var username = restUtils.get_post_param("username", options, req.body);
        if(username === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - username is not given");
            return;
        }

        var description = restUtils.get_post_param("description", options, req.body);
        if(description === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - description is not given");
            return;
        }

        var user_pkey = restUtils.get_post_param("user_pkey", options, req.body);
        if(user_pkey === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - user_pkey is not given");
            return;
        }

        try {
            datasets.add(dataset, reg_user, ms_host, volume, gateway, username, user_pkey, description, function(err, result) {
                if(err) {
                    restUtils.return_error(req, res, err);
                    return;
                }

                restUtils.return_boolean(req, res, true);
                return;
            });
        } catch (ex) {
            restUtils.return_error(req, res, ex);
            return;
        }
        return;
    },
    remove_dataset: function(req, res) {
        var options = req.query;
        var datasets = req.datasets;
        var reg_user = req.user.user;

        var dataset = restUtils.get_post_param("dataset", options, req.body);
        if(dataset === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - dataset is not given");
            return;
        }

        try {
            datasets.remove(dataset, reg_user, function(err, result) {
                if(err) {
                    restUtils.return_error(req, res, err);
                    return;
                }

                restUtils.return_boolean(req, res, true);
                return;
            });
        } catch (ex) {
            restUtils.return_error(req, res, ex);
            return;
        }
        return;
    }
};
