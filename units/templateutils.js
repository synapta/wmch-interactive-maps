"use strict";

const { promises: fsa } = require("fs");

exports.readMustachePartials = async (key) => {
    let fileData = await fsa.readFile(`${key}`);
    // get template content, server-side
    let template = fileData.toString();
    return template;
};

exports.notFound = async (context, message) => {
    return `<h2>${message ? message : "Not Found"}</h2>`;
}
