FROM continuumio/miniconda3

EXPOSE 5000

RUN conda install -y flask markdown jinja2 lxml cffi html5lib cairo pango \
    && pip install weasyprint flask-socketio eventlet \
    && apt install -y libcairo2-dev locales \
    && dpkg-reconfigure -f noninteractive locales \
    && locale-gen en_US.UTF-8

ENV LC_ALL=en_US.UTF-8
ENV LANG=en_US.UTF-8

ADD client /client
ADD server /server

WORKDIR /server

RUN python init.py
CMD python pizza.py
