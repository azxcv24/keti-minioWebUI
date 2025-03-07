#

## node
NODE_MAJOR=18
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

## python
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt

## nginx setup
* add 127.0.0.1 ktio to /etc/hosts
* cp nginx-site-conf /etc/nginx/sites-enabled/ktio

## ktio ssh tunnel
ssh -L 0.0.0.0:9090:127.0.0.1:9090 -L 0.0.0.0:9000:127.0.0.1:9000 lordkeios@keti-ev.iptime.org -p 2002

## elasticsearch
docker run --rm --name elasticsearch --net elastic -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -t docker.elastic.co/elasticsearch/elasticsearch:8.11.1
* password
  qFlt=tpaPzkPB7vSZMJ_

## kibana
docker run --rm --name kibana --net elastic -e ELASTICSEARCH_SSL_VERIFICATIONMODE='none' --add-host host.docker.internal:host-gateway -p 5601:5601 docker.elastic.co/kibana/kibana:8.11.1

* enrollment token
```
docker exec -it elasticsearch bin/elasticsearch-create-enrollment-token --scope kibana
```

## superset

* database connection
elasticsearch+https://elastic:qFlt=tpaPzkPB7vSZMJ_@172.18.0.1:9200/?verify_certs=False

* to use visualizations for multiple indices you need to create an alias index on your cluster
POST /_aliases
{
    "actions" : [
        { "add" : { "index" : "logstash-**", "alias" : "logstash_all" } }
    ]
}

## tests.ipynb

## filebeat
```
cd filebeat
mkdir data
mkdir modules.d
docker run --name filebeat --rm -it --net elastic --add-host host.docker.internal:host-gateway --add-host ktio:host-gateway --user=root -v ./filebeat.yml:/usr/share/filebeat/filebeat.yml -v ./fields.yml:/usr/share/filebeat/fields.yml  -v ./modules.d:/usr/share/filebeat/modules.d --volume="./data:/usr/share/filebeat/data" docker.elastic.co/beats/filebeat:8.11.1 filebeat -e --strict.perms=false -E setup.kibana.host=kibana:5601
```

## superset
SELECT timestamp, agent FROM "pipeline0"


## server
python server/server.py

## test
var res = await (await fetch("http://localhost:9080/ktsearch/csv/preview?bucket=evdata&prefix=c3RlcDAxL2Jtcy4wMTI0MTA1NTU2OC4yMDIzLTA4LmNzdg==&format=lucky&version_id=null&limit=100")).text()


## app
npm login --registry=https://sencha.myget.org/F/gpl/npm/ --scope=@sencha

## docker compose
./ktsearch-up.sh
./ktsearch-down.sh
