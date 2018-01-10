var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var update = React.addons.update;
var events = new Events();



var formatTimestamp = function(timestamp) {
  var date = new Date(timestamp * 1000);
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var day = date.getDate();
  var month = date.getMonth() + 1;
  return day + '.' + month + '. ' + hours + ':' + minutes.substr(-2);
}

var root = window.location.pathname;
console.log(root);
if (root != '/'){
  var socket = io({path: root + 'socket.io'});
} else {
  var socket = io();
}

var Orders = React.createClass({

  getInitialState: function() {
    return {orders: []};
  },

  componentDidMount() {
    $.getJSON(root + 'get/entries', this._updateOrders)
    socket.on('update', this._update);
    events.on('deleteAll', this._deletAll);
  },

  _updateOrders(orders) {
    return this.setState({orders: orders});
  },

  _deletAll() {
    return this.state.orders.map(function(order) {
      return $.post(root + "edit/" + order.id + "/delete");
    });
  },

  _update(data) {
    var orders = JSON.parse(data);
    return this.setState({orders: orders});
  },

  togglePaid(i) {
    var id, orders;
    id = this.state.orders[i].id;
    orders = this.state.orders;
    orders[i].paid = !orders[i].paid;
    this.setState({
      orders: orders
    });
    return $.post(root + "edit/" + id + "/toggle_paid");
  },

  deleteOrder(i) {
    var id, neworders;
    id = this.state.orders[i].id;
    $.post(root + "edit/" + id + "/delete");
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
            "timestamp": order.timestamp,
            "togglePaid": _this.togglePaid.bind(_this, i),
            "deleteOrder": _this.deleteOrder.bind(_this, i),
            "key": order.id
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
    return React.createElement(
      "li", {"className": "list-group-item"},
      React.createElement(
        "span",
        { "className": "badge pull-left"},
        this.props.price
      ),
      this.props.description + ' (' + this.props.author + ', ' + formatTimestamp(this.props.timestamp) + ')',
      React.createElement(
        "div", {"className": "btn-group pull-right"},
        React.createElement(
          "button",
          {
            "onClick": this.props.togglePaid,
            "className": "btn btn-default btn-xs " + paidClass
          },
          "bezahlt"
        ),
        React.createElement(
          "button",
          {"onClick": this.props.deleteOrder, "className": "btn btn-default btn-xs"},
          "löschen"
        )
      )
    );
  }
});

var OrderForm = React.createClass({
  onSubmit: function(e) {
    e.preventDefault();
    var author = this.refs.author.getDOMNode().value;
    var description = this.refs.description.getDOMNode().value;
    var price = this.refs.price.getDOMNode().value;

    $.post(
      root + 'add',
      {
        author: author,
        description: description,
        price: price
      },
      function(data) {
        var div;
        if (data.type === 'error') {
          div = $('<div>', {"class": 'alert alert-danger alert-dismissable'});
          div.html('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>');
          div.append($('<strong>').text('Failure! '));
          div.append(data.msg);
          return $('#orders-panel').before(div);
        }
      }
    );
    this.refs.author.getDOMNode().value = '';
    this.refs.description.getDOMNode().value = '';
    return this.refs.price.getDOMNode().value = '';
  },
  render: function() {
    return React.createElement(
      "div",
      {
        "id": "order-form",
        "className": "panel-footer"
      },
      React.createElement(
        "form",
        {
          "id": "addpizza",
          "className": "form-inline",
          "role": "form",
          "onSubmit": this.onSubmit
        },
        React.createElement(
          "div",
          {
            "className": "form-group col-sm-4"
          },
          React.createElement(
            "input",
            {
              "type": "text",
              "className": "form-control",
              "ref": "description",
              "placeholder": "Bestellung"
            }
          )
        ),
        React.createElement(
          "div",
          {"className": "form-group col-sm-3"},
          React.createElement(
            "input",
            {
              "type": "text",
              "className": "form-control",
              "ref": "author",
              "placeholder": "Name"
            }
          )
        ),
        React.createElement(
          "div",
          {"className": "form-group col-sm-3"},
          React.createElement(
            "div",
            {"className": "input-group"},
            React.createElement(
              "input",
              {
                "type": "text",
                "className": "form-control",
                "ref": "price",
                "placeholder": "Preis"
              }
            ),
            React.createElement("span", {"className": "input-group-addon"}, "€")
          )
        ),
        React.createElement(
          "div",
          { "className": "form-group" },
          React.createElement(
            "button",
            {"type": "submit", "className": "btn btn-primary"},
            "Bestellen"
          )
        )
      )
    );
  }
});

var OrdersPanel = React.createClass({
  render: function() {
    return React.createElement(
      "div",
      {"className": "panel panel-default"},
      React.createElement(
        "div",
        {"className": "panel-heading"},
        React.createElement("h3", { "className": "panel-title" }, "Bestellungen")
      ),
      React.createElement(Orders, null),
      React.createElement(OrderForm, null)
    );
  }
});

React.render(React.createElement(OrdersPanel, null), document.getElementById('orders-panel'));

var AdminPanel = React.createClass({
  deleteAll() {
    return events.emit('deleteAll');
  },
  getInitialState: function() {
    return {places: []};
  },
  componentDidMount() {
    this.getPlaces();
  },
  updateSelected() {
    console.log("")
    console.log(this.state.places.filter(this.getActive));
    this.setState({selected: this.state.places.filter(this.getActive)[0].id});
  },
  getActive(place, i) {
    console.log("get active");
    console.log(place);
    return place.active == true;
  },
  error(msg) {
      div = $('<div>', {"class": 'alert alert-danger alert-dismissable'});
      div.html('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>');
      div.append($('<strong>').text('Failure! '));
      div.append(msg);
      return $('#orders-panel').before(div);
  },
  success() {
      div = $('<div>', {"class": 'alert alert-success alert-dismissable'});
      div.html('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>');
      div.append($('<strong>').text('Success!'));
      return $('#orders-panel').before(div);
  },
  printOrders(event) {
    var name = this.refs.name.getDOMNode().value;
    var phone = this.refs.phone.getDOMNode().value;
    if (!name || !phone) {
      return this.error("You need to provide your name and phone number");
    } else {
      window.location = "order.pdf?" + $.param({name: name, phone: phone});
    }
  },
  addPlace(event) {
    var name = this.refs.name.getDOMNode().value;
    var url = this.refs.url.getDOMNode().value;
    if (!name || !url) {
      return this.error("You need to provide name and url");
    } else {
      $.post(root + 'addPlace', {name: name, url: url});
      this.success();
    }
    this.getPlaces();
  },
  selectPlace(event) {
    console.log("Select Place");
    var id = this.refs.place.getDOMNode().value;
    $.post(root + 'selectPlace/' + id);
    return this.success();
  },
  getPlaces() {
    $.getJSON(root + 'get/places', this._updatePlaces)
  },
  _updatePlaces(data) {
    this.setState({places: data});
    this.updateSelected();
    console.log(this.state.places);
    console.log(this.state.selected);
  },
  createPlaceElement(place, i) {
    return React.createElement(
      "option", {value: place.id}, place.name
    );
  },
  render: function() {
    return React.createElement(
      "div", {"className": "panel panel-default"},
      React.createElement(
        "div", {"className": "panel-heading"},
        React.createElement(
          "h3", {"className": "panel-title"},
          "Admin"
        )
      ),
      React.createElement(
        "div", {"className": "panel-body"},
        React.createElement(
          "div", {"className": "row"},
          React.createElement(
            "div", {"className": "col-sm-4"},
            React.createElement(
              "input",
              {
                "type": "text",
                "className": "form-control",
                "ref": "name",
                "placeholder": "Name"
              }
            ),
            React.createElement(
              "input",
              {
                "type": "text",
                "className": "form-control",
                "ref": "phone",
                "placeholder": "Telefonnummer"
              }
            ),
            React.createElement(
              "a", {"onClick": this.printOrders, "className": "btn btn-primary"},
              "Bestellung herunterladen"
            )
          ),
          React.createElement(
            "div", {className: "col-sm-4"},
            React.createElement(
              "select", {"value": this.state.selected, "className": "form-control", ref: "place", "onChange": this.selectPlace},
              this.state.places.map(this.createPlaceElement)
            ),
            React.createElement(
                "a", {"onClick": this.deleteAll, "className": "btn btn-primary"},
                "Bestellungen löschen"
            )
          ),
          React.createElement(
            "div", {"className": "col-sm-4"},
            React.createElement(
              "input",
              {
                "type": "text",
                "className": "form-control",
                "ref": "name",
                "placeholder": "Name"
              }
            ),
            React.createElement(
              "input",
              {
                "type": "text",
                "className": "form-control",
                "ref": "url",
                "placeholder": "url"
              }
            ),
            React.createElement(
              "a", {"onClick": this.addPlace, "className": "btn btn-primary"},
              "Neue Pizzeria hinzufügen"
            )
          )
        )
      )
    );
  }
});

React.render(React.createElement(AdminPanel, null), document.getElementById('admin-panel'));
