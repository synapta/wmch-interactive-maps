"use strict";
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const config = require('../config');
const localconfig = require('../localconfig');

let mailTransporter;
if (typeof localconfig.mailgun !== "undefined") {
    mailTransporter = nodemailer.createTransport(mg(localconfig.mailgun));
}

const sendMail = function (data) {
    const message = {
        from: `${data.contactName} <${localconfig.mailgun.mailFrom}>`,
        'h:Reply-To': `${data.contactName} <${data.contactMail}>`,
        to: localconfig.mailgun.mailTo,
        subject: `[${config.appname}] ${data.contactName} proposed a new map`,
        text: `Message is: 

${data.comment}
~~~

Query SPARQL is:

${data.sparql}

~~~

-- 
${config.appname} / Ask Your Map
`
    };
    return mailTransporter.sendMail(message);
}
exports.sendMail = sendMail;

const test = () => {
    sendMail(localconfig.exampleMail)
}
// test();
