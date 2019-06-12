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
var datasetsAPI = require('./cdns.js');
var async = require('async');
var fs = require('fs');

/**
 * Expose root class
 */
module.exports = {
    list_cdns: function(req, res) {
        var options = req.query;
        var cdns = req.cdns;

        try {
            cdns.list(function(err, result) {
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
    add_cdn: function(req, res) {
        var options = req.query;
        var cdns = req.cdns;

        var dataset = restUtils.get_post_param("dataset", options, req.body);
        if(dataset === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - dataset is not given");
            return;
        }

        var ag_url = restUtils.get_post_param("ag_url", options, req.body);
        if(ag_url === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - ag_url is not given");
            return;
        }

        try {
            cdns.add_cdn(dataset, ag_url, function(err, result) {
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
    add_cdn_site: function(req, res) {
        var options = req.query;
        var cdns = req.cdns;

        var dataset = restUtils.get_post_param("dataset", options, req.body);
        if(dataset === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - dataset is not given");
            return;
        }

        var name = restUtils.get_post_param("name", options, req.body);
        if(name === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - name is not given");
            return;
        }

        var gps_loc1 = restUtils.get_post_param("gps_loc1", options, req.body);
        if(gps_loc1 === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - gps_loc1 is not given");
            return;
        }

        var gps_loc2 = restUtils.get_post_param("gps_loc2", options, req.body);
        if(gps_loc2 === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - gps_loc2 is not given");
            return;
        }

        var cdn_prefix = restUtils.get_post_param("cdn_prefix", options, req.body);
        if(cdn_prefix === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - cdn_prefix is not given");
            return;
        }

        try {
            cdns.add_cdn_site(dataset, name, gps_loc1, gps_loc2, cdn_prefix, function(err, result) {
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
    remove_cdn_site: function(req, res) {
        var options = req.query;
        var cdns = req.cdns;

        var dataset = restUtils.get_post_param("dataset", options, req.body);
        if(dataset === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - dataset is not given");
            return;
        }

        var name = restUtils.get_post_param("name", options, req.body);
        if(name === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - name is not given");
            return;
        }

        try {
            cdns.remove_cdn_site(dataset, name, function(err, result) {
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
    remove_cdn: function(req, res) {
        var options = req.query;
        var cdns = req.cdns;

        var dataset = restUtils.get_post_param("dataset", options, req.body);
        if(dataset === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - dataset is not given");
            return;
        }

        try {
            cdns.remove_cdn(dataset, function(err, result) {
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
