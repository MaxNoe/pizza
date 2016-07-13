var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var update = React.addons.update;

var socket = io();

var Orders = React.createClass({

  getInitialState: function() {
    return {orders: []};
  },

  componentDidMount() {
    $.getJSON('/get/entries', this._updateOrders)
    socket.on('update', this._update);
    socket.on('deleteAll', this._deletAll);
  },

  _updateOrders(orders) {
    return this.setState({orders: orders});
  },

  _deletAll() {
    return this.state.orders.map(function(order) {
      return $.post("/edit/" + order.pid + "/delete");
    });
  },

  _update(data) {
    var orders = JSON.parse(data);
    return this.setState({orders: orders});
  },

  togglePaid(i) {
    var id, orders;
    id = this.state.orders[i].pid;
    orders = this.state.orders;
    orders[i].paid = !orders[i].paid;
    this.setState({
      orders: orders
    });
    return $.post("/edit/" + id + "/toggle_paid");
  },

  deleteOrder(i) {
    var id, neworders;
    id = this.state.orders[i].pid;
    $.post("/edit/" + id + "/delete");
    neworders = update(this.state.orders, {
      $splice: [[i, 1]]
    });
    return this.setState({
      orders: neworders
    });
  },

  render() {
    var orderList;
    if (this.state.orders.length === 0) {
      orderList = React.createElement("li", {
        "className": "list-group-item"
      }, React.createElement("em", null, "Soweit keine Bestellungen."));
    } else {
      orderList = this.state.orders.map((function(_this) {
        return function(order, i) {
          return React.createElement(Order, {
            "description": order.description,
            "price": order.price,
            "author": order.author,
            "paid": order.paid,
            "togglePaid": _this.togglePaid.bind(_this, i),
            "deleteOrder": _this.deleteOrder.bind(_this, i),
            "key": order.pid
          });
        };
      })(this));
    }
    return React.createElement(
      ReactCSSTransitionGroup,
      {
        "transitionName": "orders",
        "component": "ul",
        "id": "orders-list",
        "className": "list-group"
      },
      orderList
    );
  }
});

var Order = React.createClass({
  render: function() {
    var paidClass;
    paidClass = this.props.paid ? "active btn-success" : "";
    return React.createElement("li", {
      "className": "list-group-item"
    }, React.createElement("span", {
      "className": "badge pull-left"
    }, this.props.price), this.props.description + ' (' + this.props.author + ')', React.createElement("div", {
      "className": "btn-group pull-right"
    }, React.createElement("button", {
      "onClick": this.props.togglePaid,
      "className": "btn btn-default btn-xs " + paidClass
    }, "bezahlt"), React.createElement("button", {
      "onClick": this.props.deleteOrder,
      "className": "btn btn-default btn-xs"
    }, "löschen")));
  }
});

var OrderForm = React.createClass({
  onSubmit: function(e) {
    var author, description, price;
    e.preventDefault();
    author = this.refs.author.getDOMNode().value;
    description = this.refs.description.getDOMNode().value;
    price = this.refs.price.getDOMNode().value;
    $.post('/add', {
      author: author,
      description: description,
      price: price
    }, function(data) {
      var div;
      if (data.type === 'error') {
        div = $('<div>', {
          "class": 'alert alert-danger alert-dismissable'
        });
        div.html('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>');
        div.append($('<strong>').text('Failure! '));
        div.append(data.msg);
        return $('#orders-panel').before(div);
      }
    });
    this.refs.author.getDOMNode().value = '';
    this.refs.description.getDOMNode().value = '';
    return this.refs.price.getDOMNode().value = '';
  },
  render: function() {
    return React.createElement("div", {
      "id": "order-form",
      "className": "panel-footer"
    }, React.createElement("form", {
      "id": "addpizza",
      "className": "form-inline",
      "role": "form",
      "onSubmit": this.onSubmit
    }, React.createElement("div", {
      "className": "form-group col-sm-4"
    }, React.createElement("input", {
      "type": "text",
      "className": "form-control",
      "ref": "description",
      "placeholder": "Bestellung"
    })), React.createElement("div", {
      "className": "form-group col-sm-3"
    }, React.createElement("input", {
      "type": "text",
      "className": "form-control",
      "ref": "author",
      "placeholder": "Name"
    })), React.createElement("div", {
      "className": "form-group col-sm-3"
    }, React.createElement("div", {
      "className": "input-group"
    }, React.createElement("input", {
      "type": "text",
      "className": "form-control",
      "ref": "price",
      "placeholder": "Preis"
    }), React.createElement("span", {
      "className": "input-group-addon"
    }, "€"))), React.createElement("div", {
      "className": "form-group"
    }, React.createElement("button", {
      "type": "submit",
      "className": "btn btn-primary"
    }, "Bestellen"))));
  }
});

var OrdersPanel = React.createClass({
  render: function() {
    return React.createElement("div", {
      "className": "panel panel-default"
    }, React.createElement("div", {
      "className": "panel-heading"
    }, React.createElement("h3", {
      "className": "panel-title"
    }, "Bestellungen")), React.createElement(Orders, null), React.createElement(OrderForm, null));
  }
});

React.render(React.createElement(OrdersPanel, null), document.getElementById('orders-panel'));

var AdminPanel = React.createClass({
  deleteAll() {
    console.log("deleteAll");
    return socket.emit('deleteAll');
  },
  render: function() {
    return React.createElement("div", {
      "className": "col-sm-5"
    }, React.createElement("div", {
      "className": "panel panel-default"
    }, React.createElement("div", {
      "className": "panel-heading"
    }, React.createElement("h3", {
      "className": "panel-title"
    }, "Admin")), React.createElement("ul", {
      "className": "list-group"
    }, React.createElement("li", {
      "className": "list-group-item"
    }, React.createElement("a", {
      "href": "/order.pdf",
      "className": "btn btn-primary"
    }, "Bestellung herunterladen")), React.createElement("li", {
      "className": "list-group-item"
    }, React.createElement("a", {
      "onClick": this.deleteAll,
      "className": "btn btn-primary"
    }, "Bestellungen löschen")))));
  }
});

React.render(React.createElement(AdminPanel, null), document.getElementById('admin-panel'));
