import sqlite3
from flask import Flask, request, g, jsonify, send_file
from flask_socketio import SocketIO
from contextlib import closing
from genorder import print_order
from datetime import datetime

import re
import json

from collections import namedtuple

Order = namedtuple('Order', ['description', 'price'])

DATABASE = './pizza.sqlite3'
DEBUG = False
SECRET_KEY = 'development key'
USERNAME = 'admin'
PASSWORD = 'default'

app = Flask(__name__, static_url_path='', static_folder='../client')
app.config.from_object(__name__)
app.config.from_envvar('PIZZA_SETTINGS', silent=True)

socketio = SocketIO(app)

host = '0.0.0.0'
port = 5000


def cents_to_euros(cents):
    return '{},{:02d} €'.format(int(cents / 100), cents % 100)


def init_db():
    with closing(connect_db()) as db:
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()


def connect_db():
    return sqlite3.connect(app.config['DATABASE'])


@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.before_request
def before_request():
    g.db = connect_db()


@app.teardown_request
def teardown_request(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()


@app.route('/get/entries')
def get_entries():
    cur = g.db.execute(
        '''
        SELECT id, description, author, price, paid, timestamp
        FROM entries
        ORDER BY id ASC
        '''
    )
    entries = [
        dict(
            pid=row[0], description=row[1], author=row[2],
            price=row[3], paid=row[4],
            timestamp=row[5],
        )
        for row in cur.fetchall()
    ]

    for e in entries:
        e['price'] = cents_to_euros(e['price'])

    return json.dumps(entries)


@app.route('/edit/<int:pid>/<action>', methods=['POST'])
def edit_entry(pid, action):
    if action == 'toggle_paid':
        cur = g.db.execute('SELECT paid from entries WHERE id=?', [pid])
        paid = cur.fetchone()[0]
        g.db.execute('UPDATE entries SET paid=? WHERE id=?', [not paid, pid])
    if action == 'delete':
        g.db.execute('DELETE FROM entries WHERE id=?', [pid])
    g.db.commit()
    update_clients()
    return json.dumps({'status': 'success'})


@app.route('/add', methods=['POST'])
def add_entry():
    data = request.form.to_dict()
    description = data['description']
    author = data['author']
    price = re.findall('(\d+)(?:[,.](\d))?\s*(?:€|E)?', data['price'])
    timestamp = int(datetime.utcnow().timestamp())

    if not description:
        return jsonify(msg='Please provide a description', type='error')
    elif not author:
        return jsonify(msg='Please provide your name', type='error')
    elif not price:
        return jsonify(msg='Price must be formed like this: 3.14', type='error')
    else:
        value = price[0]
        price = int(value[0]) * 100
        if value[1]:
            if len(value[1]) == 1:
                price += int(value[1]) * 10
            else:
                price += int(value[1])
        g.db.execute(
            '''
            INSERT INTO entries
            (description, author, price, paid, timestamp)
            VALUES (?, ?, ?, ?, ?)
            ''',
            [description, author, price, False, timestamp]
        )
        g.db.commit()
        update_clients()

    return jsonify(msg='New entry added', type='success')


def update_clients():
    entries = get_entries()
    socketio.emit('update', entries)


@app.route('/order.pdf', methods=['GET'])
def get_order():
    name = request.args.get('name', 'Hans')
    phone = request.args.get('phone', '1234')
    csr = g.db.execute('SELECT description, price FROM entries ORDER BY id ASC')
    orders = [Order(description, price) for description, price in csr.fetchall()]
    fname = print_order(orders, name, phone)
    return send_file(fname)


if __name__ == '__main__':
    socketio.run(app, host=host, port=port)
    # app.run(host, port)
