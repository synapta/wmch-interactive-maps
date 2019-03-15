var express = require('express');
// var request = require('request');
module.exports = function(app, apicache, passport) {
    app.use('/wizard',express.static('./public/wizard'));
    app.use('/',express.static('./public/frontend'));
}
