## 2.2

- A new History table is added
- A new service cron.js is added
- A faster query

Query is:

~~~
SELECT ?item ?itemLabel ?coord ?commons ?website ?img ?lang ?langcode
            WHERE {
                ?item wdt:P31/wdt:P279* wd:Q33506 .
                ?item wdt:P17 wd:Q39 .
                ?item wdt:P625 ?coord
                OPTIONAL { ?item wdt:P373 ?commons }
                OPTIONAL { ?item wdt:P856 ?website }
                OPTIONAL { ?item wdt:P18 ?img }
                OPTIONAL {
                  ?art schema:about ?item ;
                  schema:inLanguage ?langcode .
                  BIND(IF(?langcode in ('en', 'it', 'fr', 'de'),?art,?langcode) AS ?lang)
                }
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de,fr,it". }
            }
            ORDER BY ?item ASC(?langcode) ASC(?lang)
~~~
