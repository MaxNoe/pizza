# -*- coding: utf-8 -*-
'''
    Pizzaboy
    Automated generation of pizza orders.

    Authors: Igor Babuschkin <igor.babuschkin@udo.edu>
             Kevin Dungs <kevin.dungs@udo.edu>
    Version: 1.0 (2013-01-30)
'''

from __future__ import print_function
import jinja2
import markdown
from weasyprint import HTML
import codecs

from datetime import datetime


def cents_to_euros(cents):
    return u'{},{:02d} €'.format(int(cents / 100), cents % 100)


def print_order(orders, name, phone):
    with codecs.open('template.md', encoding='utf-8') as f:
        template = jinja2.Template(f.read())

    md = template.render(name=name, phone=phone, orders=orders)
    html = markdown.markdown(md, extensions=['markdown.extensions.tables'])
    document = HTML(string=html)

    filename = 'pizza-{}.pdf'.format(datetime.now().strftime('%Y-%m-%d'))
    document.write_pdf(filename)

    return filename
