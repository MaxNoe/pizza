from peewee import (
    SqliteDatabase,
    IntegerField,
    TextField,
    BooleanField,
    Model,
    DateTimeField,
)


database = SqliteDatabase(None)


class Order(Model):
    description = TextField()
    author = TextField()
    price = IntegerField()
    paid = BooleanField()
    timestamp = DateTimeField()

    class Meta:
        database = database


class PizzaPlace(Model):
    name = TextField()
    url = TextField()
    active = BooleanField(default=False)

    class Meta:
        database = database


def create_tables(drop=False):
    database.connect()

    if drop:
        database.drop_tables([Order, PizzaPlace], safe=True)

    database.create_tables([Order, PizzaPlace], safe=True)
    PizzaPlace.create(
        name='Pizzeria La Scala',
        url='http://www.pizzerialascaladortmund.de',
        active=True,
    )
