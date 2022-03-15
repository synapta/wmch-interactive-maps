You can contribute in many ways to this project via pull requests.

## Translate

All translations are key-based and hosted in JSON file named after the [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) code under the i18n folder.

Directory structure is associated with the respective section.

~~~
i18n
|-- admin
|   |-- en.json
|   `-- it.json
|-- frontend
|   |-- en.json
|   `-- it.json
|-- manual
|   |-- en.json
|   `-- it.json
`-- wizard
    |-- en.json
    `-- it.json

~~~

To add a new translation:

1. Add a new ISO 639-1 file to each directory inside `i18n` copying a file like `en.json` and changing the keys.
2. Edit `config.json` and add a new language code, e.g. `{"code": "ja", "name": "日本語"}`
3. [Create a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)


## Add icons

### Generate a new icon list

Icon list can be selected between [those available on Semantic UI](https://semantic-ui.com/elements/icon.html) and saved on /public/js/icons.json.

However, list of icons can be generated visiting the Icon section of Semantic UI and using this code on browser console:

~~~
var src = jQuery(".main").find(".icon");
var myt = [];
jQuery.each(src, function (icoindex) {
    myt.push(jQuery(this).attr("class").replace(' icon', ''));
});
var uniquet = Array.from(new Set(myt.sort()));
var myels = [];
for (u of uniquet) {
  myels.push({
    title: u + '<i class="' + u + ' icon"></i>'
  });
}
JSON.stringify(myels, null, ' ');
~~~

Then expand and copy object to get a JSON array.

Semantic UI Icons are available on wizard searching by class name.

These steps are useful when the Semantic UI version is changed.