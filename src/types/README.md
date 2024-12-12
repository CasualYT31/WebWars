# Object Types

Everything on a map, from the tiles, to the types of terrains on those tiles, the unit types, the commanders, etc. are all "objects." This folder documents the different fields that each category of object should store.

First, it is important to understand that each category of object rests in a hierarchy:

1. **Commander**: the playable characters available to users, each having their own custom gameplay elements.
2. **Weather**: the weather conditions a map can be in.
3. **Environment**: essentially defines how a map looks a not much else.
4. **Country**: factions.
5. **Movement**: different methods of moving available to units.
6. **Structure**: tiles with custom logic.
7. **Tile**: describes a single visual representation for a given terrain type.
8. **Terrain**: describes the different types of traversable (or not traversable) terrain that you can find on a map.
9. **Unit**: the different types of units that can be in play.
10. **Weapon**: the different types of weapons that units can have.

The higher a category is in the hierarchy, the greater precedence it has over _property overrides_.
