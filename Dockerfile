FROM continuumio/miniconda3

EXPOSE 5000

RUN conda install -y  gevent greenlet \
	flask markdown jinja2 lxml cffi html5lib cairo pango
RUN conda install -c auto -y cairocffi
RUN pip install weasyprint flask-socketio

RUN apt install -y locales && dpkg-reconfigure -f noninteractive locales
RUN locale-gen en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
ENV LANG=en_US.UTF-8


ADD client /client
ADD server /server


WORKDIR /server

RUN python init.py
CMD python pizza.py
