#
curl 'localhost:9009/api/v1/csv/preview?'
curl 'localhost:9009/api/v1/buckets'
curl 'localhost:9009/_api/csv/preview?bucket=evdata&prefix=c3RlcDAxL2Jtcy4wMTI0MTA1NTU2OC4yMDIzLTA4LmNzdg==&format=lucky&version_id=null'

## build
rm -rf ./build
npm run build
rm -rf ./uiserver/public
cp -R ./build ./uiserver/public

openssl genrsa -out ca.key 2048 
openssl req -new -key ca.key -out ca.csr 
openssl x509 -req -days 365 -in ca.csr -signkey ca.key -out ca.crt 
