# encoding: UTF-8
'''
    Pizzaboy
    Automated generation of pizza orders.

    Authors: Igor Babuschkin <igor.babuschkin@udo.edu>
             Kevin Dungs <kevin.dungs@udo.edu>
    Version: 1.0 (2013-01-30)
'''

from __future__ import print_function
import jinja2

from datetime import datetime


def cents_to_euros(cents):
    return u'{},{:02d} €'.format(int(cents / 100), cents % 100)


def escape_latex(pizzas):
    return pizzas  # pizzas.replace('\\', '\\\\').replace('%', '\\%').replace('&', '\\&')


def sanitize_tex(text):
    return text.replace('\\', '').replace('{', '\\{').replace('}', '\\}')


def print_order(pizzas, prices):
    coststring = u'Preis: {}'.format(
        cents_to_euros(sum(prices)),
        cents_to_euros(int(round(0.9 * sum(prices))))
    )

    pizzas = map(sanitize_tex, pizzas)
    pizzas = '\\item ' + escape_latex(' \\ \n \\item '.join(pizzas))
    identifier = 'pizza-{}'.format(datetime.now().strftime('%Y-%m-%d'))
    filename = '/tmp/{}.tex'.format(identifier)

    with open(filename, 'w') as texfile:
        texfile.write(
            TEMPLATE.decode('utf-8')
            .replace(u'%PIZZA', pizzas)
            .replace(u'%PRICE', coststring)
            .encode('utf-8')
        )

    return '{}.pdf'.format(identifier)

with open('template.md', 'r') as f:
    TEMPLATE = f.read()
