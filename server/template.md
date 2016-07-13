# Pizzabestellung

Hallo,

hier kommt unsere heutige Bestellung.   
Unsere Kundennummer ist 138.   
Lieferung bitte erst ab 18:00 Uhr.  

| Bestellung | Preis |
|---|---:|
{% for order in orders %}|{{ order.description }}|{{ order.price }}|
{% endfor %}

### Lieferadresse: 

{{ name }}  
Fa. TU Dortmund - Abt. Physik   
Otto-Hahn-Str. 4a   
44227 Dortmund

Raum: CP-03-123
Vom Haupteingang nach rechts,
den Aufzug in den 3. Stock nehmen. 
Durch die Glastür und den rechten Flur nehmen.
Dann ist es die erste Tür hinter der Glastür.

Bei Fragen bitte unter {{ phone }} anrufen!

Schöne Grüße und bis gleich!
