import jinja2
import markdown
from weasyprint import HTML, CSS
import tempfile


def cents2euros(cents):
    euros = '{},{:02d} €'.format(int(cents / 100), cents % 100)
    return euros

env = jinja2.Environment(loader=jinja2.FileSystemLoader('.'))
env.filters['cents2euros'] = cents2euros


def print_order(orders, name, phone):
    template = env.get_template('template.md')

    total = sum(order['price'] for order in orders)
    md = template.render(name=name, phone=phone, orders=orders, total=total)
    html = markdown.markdown(md, extensions=['markdown.extensions.tables'])
    document = HTML(string=html)

    tmp = tempfile.NamedTemporaryFile(mode='wb', suffix='.pdf')
    document.write_pdf(tmp, stylesheets=[CSS(filename='order-style.css')])

    return tmp
