# Object Types

Everything on a map, from the tiles, to the types of terrains on those tiles, the unit types, the commanders, etc. are all "objects." This folder documents the different fields that each category of object should store.

Here is a list of object type categories:

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

Each object type is a subclass of one of these. Each field is a function that returns the desired value, and as input they will receive a single object, called the `context`. This object will contain a single key-value pair for each of the categories above, with the value storing the name of an object type. These will store different values depending on the object type category:

1. **Commander**:
    a. Commander: N/A* (*: Object type categories will never receive a name for their own category).
    b. Weather: the name of the weather currently in play on the map the commander is playing on.
    c. Environment: ditto.
    d. Country: the name of the country the commander is currently commanding.
    e. Movement: N/A^ (^: Since there is a many-to-one relationship between units and the commander that leads them, there is no clear unit type name to pass here. This is where having a reference to the map would be helpful).
    f. Structure: N/A^.
    g. Tile: N/A^.
    h. Terrain: N/A^.
    i. Unit: N/A^.
    j. Weapon: N/A^.
2. **Weather**:
    a. Commander: N/A^.
    b. Weather: N/A*.
    c. Environment: the name of the environment of the current map.
    d. Country: N/A^.
    e. Movement: N/A^.
    f. Structure: N/A^.
    g. Tile: N/A^.
    h. Terrain: N/A^.
    i. Unit: N/A^.
    j. Weapon: N/A^.
3. **Environment**:
    a. Same as Weather except Weather and Environment are switched around.
4. **Country**:
    a. Commander: Name of the primary commander currently leading this country.
    b. Weather: current weather.
    c. Environment: current environment.
    d. Country: N/A*.
    e. Movement - Weapon: N/A^.
5. **Movement**:
    a. Commander: blank, unless the unit that has this movement type is owned by a country, in which case the name of the primary commander leading the country that owns the unit that has this movement type. (In the original Advance Wars, all units required an owner, but on reflection this limitation seems needless, in fact I believe Advance Wars By Web has a hacky method of allowing ownerless units and it is used sometimes by map makers, so providing a proper way to achieve this could be useful). 
    b. Weather - Environment: ditto from Country.
    c. Country: blank, or the name of the country that owns the unit that has this movement type.
    d. Movement: N/A*.
    e. Structure: blank, except if the unit that has this movement type happens to be on a tile that is part of a structure, in which case the name of the structure will be given.
    f. Tile: the type of tile that the unit that has this movement type is currently located on.
    g. Terrain: the type of terrain that the above tile has.
    h. Unit: the type of unit that has this movement type.
    i. Weapon: the primary weapon of the unit that has this movement type, if the unit type has a weapon.
6. **Structure**:
    a. Commander: blank, unless the structure is owned, in which case the primary commander leading the country that owns the structure.
    b. Weather & Environment: current.
    c. Country: blank, unless the structure is owned, in which case the country that owns the structure.
    d. Movement: N/A^.
    e. Structure: N/A*.
    f. Tile: N/A^.
    g. Terrain: N/A^.
    h. Unit: N/A^.
    i. Weapon: N/A^.
7. **Tile**:
    a. Commander: blank, unless the tile is owned, in which case the primary commander leading the country that owns the tile.
    b. Weather & Environment: current.
    c. Country: blank, unless the tile is owned, in which case the country that owns the tile.
    d. Movement: blank, unless the tile is occupied, in which case the first unit in the occupancy list's movement type will be given. (In Advance Wars, only one unit can occupy a tile at a time, but on reflection, I do not see a reason why we should program this limitation into the core engine - this could open the door to features such as allowing air units to fly over ground units).
    e. Structure: blank, unless the tile makes up part of a structure, in which case the same of the structure.
    f. Tile: N/A*.
    g. Terrain: The type of terrain this tile has^^ (^^: this is a bit redundant, seeing as a tile type always has a fixed terrain type associated with it).
    h. Unit: blank, unless the tile is occupied, in which case the type of the first unit in the occupancy list.
    i. Weapon: blank, unless the tile is occupied and the first unit in the occupancy list has at least one weapon, in which case the type of the primary weapon.
8. **Terrain**:
    a. Same as Tile, except terrain and tile are reversed.
9. **Unit**:
    a. Commander: blank, or the primary commander of the country that owns the unit.
    b. Weather & Environment: current.
    c. Country: blank, or the country that owns the unit.
    d. Movement: the movement type of this unit.
    e. Structure: blank, unless the unit occupies a tile and it forms part of a structure, in which case the name of the structure.
    f. Tile: blank, unless the unit occupies a tile, in which case the name of the tile type.
    g. Terrain: blank, or the name of the tile type's terrain type.
    h. Unit: N/A*.
    i. Weapon: blank, or the primary weapon type^^ (^^: since unit types can't dynamically choose what weapons they have - there wouldn't be a need to anyway seeing as weapons can change any of their properties on a per-unit type basis).
10. **Weapon**:
    a. Commander - Terrain: ditto as Unit, replace "unit" with "unit that has this weapon."
    b. Unit: the type of unit that has this weapon (remember that a weapon can be shared across many different types of units).
    c. Weapon: N/A*.

Additionally, the `context` object will hold a reference to the current map in play (and if a tile, army or unit is pertient to that object category (i.e. there isn't a many-to-one relationship that can't be easily reduced), some kind of reference to that tile, army or unit, such as a tile coordinate or some unit ID). This provides even more options for customization, such as being able to tell if the pertinent army's primary commander has their power active.

One limitation to note is that fields that store names of other object types (e.g. "what weapons does this unit type have?" "What type of terrain does this tile type have?" Etc.) CANNOT be changed, since there'd be no way for the engine to know what object type names to give to the context object (could introduce cyclical dependencies), and changing object types is largely irrelevant anyway since you can just make any changes you want on the object type you're referencing (e.g. "change this weapon [drastically] if it belongs to this type of unit," "change this terrain type if the tile whose terrain you're querying is a specific type," etc.). 

The idea behind the `context` is to allow object types to dynamically change their properties based on the context of where they are used. A simple example might be Dual Strike's sandstorm weather, that reduces the maximum range of all indirect units by 1. This can be easily implemented by checking for the sandstorm Weather under each indirect weapon and knocking off 1 from the max range if that weather is active.

But this duplicates logic. And what if I want to add another indirect weapon? I might forget to add the sandstorm logic in there! For this use case, as well as another that will be touched on shortly, we can introduce an `override(objectTypeName, objectType, context)` function that is separate from any object type class and is invoked after invoking all field-specific accessors of the object type. It might look something like this:

```js
override(objectTypeName, objectType, context) {
    if (objectTypeName == "Weapon" && objectType.range.max > 2 && context.weather == "Sandstorm") {
        // context.weather === context.map.getWeatherName()
        --objectType.range.max;        
    }
}
```

`objectType` is a version of the object type with all of the context-based functions resolved. The original object type, for example, could have some `range(context)` method, and its returned value will be added to the `objectType` under the same name as an editable property `range`. In `range`'s case, it could be an object that looks like this:

```js
range = {
    min: 2,
    max: 3,
    isDirect: function() { return this.min <= 1 && this.max == 1; }
    isIndirect: function() { return !this.isDirect(); }
}
```

The `override()` function can then make further amendments to this property, and any others, before the `objectType` is given to whomever requested it (a `Map` object will be responsible for resolving object types). I think it makes the most sense to export this as a separate function in `exports.mjs`.

This also covers the map-specific logic case. Maps could embed their own custom scripts, and one of their exports could be their own `override()` function that gets called after the globally-defined one previously mentioned.

One concern I have with this approach is that it could drastically slow the game down if we build object types every time we request them. One option to mitigate this is to continuously build object types as and when the `Map` updates. E.g. when a unit moves from one tile to another, the previous tile's type objects are rebuilt, the next tile's type objects are rebuilt, and the unit's type objects are rebuilt. But this could make certain operations such as changing the weather even slower (since __every__ type object would need rebuilding).

It would not be possible to compile object type overrides like I did in my C++ solution that never saw proper release, because now these override functions may rely on dynamic map data.

I mean, unless we *do* build object types every time they're requested? It's not as if override logic will be huge. But it might be important to think about performance impacts within the `override()` functions in particular, maybe avoid using slower branching methods in favour of faster ones for example (`if-elseif` versus map-based branching: https://stackoverflow.com/questions/8624939/performance-of-if-else-switch-or-map-based-conditioning).

Caching object types during an operation, whilst sounding good for performance since you wouldn't need to constantly rebuild the object type every time you accessed a field, *could* introduce buggy behaviour if a change in a game object could trigger a rebuild of an object type that is never retrieved since the operation would still be using the cached object.

Maybe, then, we should only be able to request one field of an object type at a time? The `override()` functions would then need to pass another parameter that stores the name of the field, and the new value would have to be returned instead of editted in-place (since the incoming value could be immutable).

Why not just have the `override()` functions? Why store fields in object types as functions? Because I believe logic pertaining to a single field of a single object type should stay with that field. Additionally, it would reduce the conditional checking required in the `override()` function.

Still concerned about speed with this approach but I'm not sure how else I can introduce this kind of dynamic design whilst remaining as simple as possible.