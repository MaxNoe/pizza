FROM continuumio/miniconda3

EXPOSE 5000
RUN apt-get update -qq \
	&& apt-get install -y locales libcairo2 unzip\
	&& echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
	&& locale-gen

ENV LC_ALL="en_US.UTF-8"
ENV LANG="en_US.UTF-8"

RUN conda install -y flask markdown jinja2 lxml cffi html5lib cairo pango \
    && pip install weasyprint flask-socketio eventlet

ADD http://dl.1001fonts.com/fira-sans.zip /usr/share/fonts/truetype/
RUN cd /usr/share/fonts/truetype && unzip fira-sans.zip && fc-cache

ADD client /client
ADD server /server

WORKDIR /server

CMD python pizza.py
