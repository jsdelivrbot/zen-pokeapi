FROM mongo

COPY init.json /init.json
CMD mongoimport --host mongo --db test --collection pokemon --type json --file /init.json