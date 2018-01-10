FROM ubuntu:16.04

EXPOSE 5000
RUN apt-get update -qq \
	&& apt-get install -y --no-install-recommends \
	    locales libcairo2 unzip python3 python3-pip libpango1.0-dev libffi-dev netbase python3-wheel\
	&& echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
	&& locale-gen \
	&& rm -rf /var/lib/apt/lists/*

ENV LC_ALL="en_US.UTF-8"
ENV LANG="en_US.UTF-8"

RUN python3 -m pip install setuptools \
    && python3 -m pip install flask markdown jinja2 lxml cffi html5lib \
    weasyprint flask-socketio eventlet peewee

ADD http://dl.1001fonts.com/fira-sans.zip /usr/share/fonts/truetype/
RUN cd /usr/share/fonts/truetype && unzip fira-sans.zip && fc-cache

COPY client /client
COPY server /server

WORKDIR /server

CMD python3 pizza.py
