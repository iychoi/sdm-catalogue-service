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
var usersAPI = require('./users.js');
var async = require('async');


/**
 * Expose root class
 */
module.exports = {
    check_user: function(req, res) {
        var options = req.query;
        var users = req.users;

        var user = options.user;
        var passwd = options.passwd;

        if(user === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - user is not given");
            return;
        }

        if(passwd === null) {
            restUtils.return_badrequest(req, res, "invalid request parameters - passwd is not given");
            return;
        }

        try {
            users.check_passwd(user, passwd, function(err, result) {
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
    }
};
