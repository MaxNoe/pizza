FROM continuumio/miniconda

EXPOSE 5000

RUN conda install -y  gevent gevent-websocket greenlet flask

ADD client /client
ADD server /server

WORKDIR /server
RUN python init.py
CMD python pizza.py
