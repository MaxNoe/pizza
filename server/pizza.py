from flask import Flask, request, jsonify, send_file, Blueprint, render_template
from flask_socketio import SocketIO
from genorder import print_order
from datetime import datetime
import os

import re
import json

from database import database, Order, PizzaPlace, create_tables

host = '0.0.0.0'
port = 5000
basepath = os.environ.get('PIZZA_BASEPATH')

bp = Blueprint('pizza', __name__, static_url_path='', static_folder='../client')
socket_address = 'socket.io' if not basepath else basepath.strip('/') + '/socket.io'


def cents_to_euros(cents):
    return '{},{:02d} €'.format(int(cents / 100), cents % 100)


@bp.route('/')
def root():
    place = PizzaPlace.select().where(PizzaPlace.active).get()
    return render_template('index.html', name=place.name, url=place.url)


@bp.before_app_first_request
def before_first_request():
    database.init(app.config['DATABASE'])
    if not os.path.isfile(app.config['DATABASE']):
        create_tables()


@bp.before_request
def before_request():
    database.connect()


@bp.teardown_request
def teardown_request(exception):
    database.close()


@bp.route('/get/entries')
def get_entries():
    entries = list(Order.select().dicts())
    for e in entries:
        e['price'] = cents_to_euros(e['price'])
        e['timestamp'] = e['timestamp'].timestamp()
    return json.dumps(entries)


@bp.route('/edit/<int:pid>/<action>', methods=['POST'])
def edit_entry(pid, action):
    if action == 'toggle_paid':
        order = Order.get(id=pid)
        order.paid = not order.paid
        order.save()
    if action == 'delete':
        Order.delete().where(Order.id == pid).execute()
    update_clients()
    return json.dumps({'status': 'success'})


@bp.route('/add', methods=['POST'])
def add_entry():
    data = request.form.to_dict()

    price = re.findall('(\d+)(?:[,.](\d))?\s*(?:€|E)?', data['price'])
    timestamp = datetime.utcnow()

    if not data['description']:
        return jsonify(msg='Please provide a description', type='error')
    elif not data['author']:
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

        Order.create(
            author=data['author'],
            description=data['description'],
            price=price,
            timestamp=timestamp,
            paid=False,
        )
        update_clients()

    return jsonify(msg='New entry added', type='success')


@bp.route('/addPlace', methods=['POST'])
def add_place():
    data = request.form.to_dict()

    if not data['name']:
        return jsonify(msg='Please provide a name', type='error')
    elif not data['url']:
        return jsonify(msg='Please provide an url', type='error')
    else:
        PizzaPlace.create(
            name=data['name'],
            url=data['url'],
        )
        update_clients()

    return jsonify(msg='New entry added', type='success')


@bp.route('/get/places')
def get_places():
    places = list(PizzaPlace.select().dicts())
    return json.dumps(places)


@bp.route('/selectPlace/<place_id>', methods=['POST'])
def select_place(place_id):
    PizzaPlace.update(active=False).execute()

    place = PizzaPlace.get(id=place_id)
    place.active = True
    place.save()

    update_clients()

    return jsonify(msg='New place selected', type='success')


def update_clients():
    entries = get_entries()
    socketio.emit('update', entries)


@bp.route('/order.pdf', methods=['GET'])
def get_order():
    name = request.args.get('name', 'Hans')
    phone = request.args.get('phone', '1234')

    orders = list(Order.select(Order.description, Order.price).dicts())

    tmp = print_order(orders, name, phone)
    return send_file(tmp.name)


app = Flask(
    __name__,
    static_url_path=basepath,
    static_folder='../client',
    template_folder='../client',
)
socketio = SocketIO(app, resource=socket_address)
app.register_blueprint(
    bp,
    url_prefix=basepath,
)
app.config['DATABASE'] = os.environ.get('PIZZA_DB', './pizza.sqlite3')
app.config['DEBUG'] = os.environ.get('PIZZA_DEBUG') == 'True'


if __name__ == '__main__':
    database.init(app.config['DATABASE'])
    create_tables()
    socketio.run(app, host=host, port=port)
