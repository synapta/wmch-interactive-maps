"use strict";
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const config = require('../config');
const localconfig = require('../localconfig');
const utils = require('../i18n/utils');

let mailTransporter;
if (typeof localconfig.mailgun !== "undefined") {
    mailTransporter = nodemailer.createTransport(mg(localconfig.mailgun));
}

const html = (data) => `<p>${data.asktype} request received by "${data.contactname}".

<p>Message in ${utils.getLangName(config.languages, data.shortlang)}:</p>

<blockquote>${data.comment}</blockquote>

<p>Query SPARQL is:</p>

<blockquote><pre>${data.ihavesparql === 'Y' ? data.sparqlcode : "N/A"}</pre></blockquote>

<p>Reply to this mail to contact the sender.</p>

-- <br>
${config.appname} - Ask Your Map`;

const text = (data) => `${data.asktype} request received by "${data.contactname}".

Message in ${utils.getLangName(config.languages, data.shortlang)}

Query SPARQL is:

${data.ihavesparql === 'Y' ? data.sparqlcode : "N/A"}

Reply to this mail to contact the sender.

-- 
${config.appname} - Ask Your Map
`;

const sendMail = function (data) {
    const message = {
        from: `${data.contactname} <${localconfig.mailgun.mailFrom}>`,
        'h:Reply-To': `${data.contactname} <${data.contactmail}>`,
        to: localconfig.mailgun.mailTo,
        subject: `[${config.appname}] ${data.contactname} proposed a new map`,
        html: html(data),
        text: text(data)
    };
    return mailTransporter.sendMail(message);
}
exports.sendMail = sendMail;

const test = () => {
    sendMail(localconfig.exampleMail)
}
// test();
