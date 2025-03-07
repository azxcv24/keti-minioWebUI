rm -rf ./build && npm run build && rm -rf ./uiserver/public && cp -R ./build ./uiserver/public
cd uiserver && go mod tidy && CGO_ENABLED=0 go build -o ktiu . && cd ..