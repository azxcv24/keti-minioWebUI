FROM python:3.10-bookworm

ENV PATH=/opt/bin:$PATH

EXPOSE 9080

WORKDIR /opt/bin

COPY ./requirements.txt /opt/bin
COPY ./server/server.py /opt/bin
RUN pip install -r requirements.txt

CMD ["python", "server.py"]
