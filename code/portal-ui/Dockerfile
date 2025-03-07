FROM golang:1.21.1-bullseye

ENV PATH=/opt/bin:$PATH

COPY ./uiserver/ktiu /opt/bin/ktiu
COPY ./uiserver/public /opt/bin/public
COPY ./uiserver/certs /opt/bin/certs

WORKDIR "/opt/bin"

CMD ["ktiu"]
