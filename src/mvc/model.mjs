/**
 * @file model.mjs
 * Defines the base class for models.
 */

import { newLogger } from "#src/logging/logger.mjs";

/**
 * Abstract base class for all models in the back end.
 * A model encapsulates data from the rest of the game, and exposes public-facing commands that allow external actors to
 * update the data in controlled ways. A majority of the lower-level game logic will be within models.
 * When a model is instantiated by the controller, it will scan its methods and index those that follow the naming
 * convention (note that `on` and `when` are case sensitive):
 * 1. Public methods starting with `on` and then followed by an event name, e.g. `onUnitCreated`, are categorized as
 *    event handlers. Whenever any model emits that event, that method will be invoked, and the event's data will be
 *    passed in: e.g. `onUnitCreated(...data)`. You must not rely on event handlers to be invoked in a certain order.
 * 2. Public methods starting with `when` and then followed by a command name, e.g. `whenCreateUnit`, are categorized as
 *    command handlers. Whenever a client submits that command, that method will be invoked, and the command's arguments
 *    will be passed in: e.g. `whenCreateUnit(...unitOptions)`. Commands can return anything they wish, but since
 *    clients can't access those return values, this feature has limited useability.
 * There can be many event handlers, but there can only be one command handler throughout every model in a controller.
 * This is because you don't want two different models changing their state when a single command is submitted. This
 * usually implies that one of those models is "owned" by the other: either it should be encapsulated entirely within
 * the "owning" model and removed from the controller, or it should listen out for an event from the "owning" model,
 * once the "owning" model has validated the command and updated its data in a valid manner.
 * @interface
 */
export default class Model {
    /// All models will have a logger object, the name of which will match the subclass's.
    #logger = newLogger(this.constructor.name);

    /// Hides the controller from the model implementation, since models shouldn't have full access to it.
    #controller = null;

    /**
     * Grants models guarded access to the controller.
     * @param {Controller} controller Reference to the controller that this model was attached to.
     */
    constructor(controller) {
        this.#controller = controller;
    }

    /**
     * Writes to the model's log.
     * @param {...any} args The arguments to pass to the log() method.
     */
    log(...args) {
        return this.#logger.log(...args);
    }

    /**
     * Models can request that some of their commands be given the sender's session key as their first argument.
     * Since views are the only actors that can send commands, this request must always be respected. Subclasses can
     * override this field with a list of names, one for each command that requires a session key argument. Do not
     * prepend any command name with "when".
     * @abstract
     */
    prependSessionKeyToCommands = [];

    /**
     * Emits an event from this model and publishes it to every model and view attached to the controller.
     * @param {String} name The name of the event to emit to every model and view.
     * @param {...any} data The data to attached to the event.
     */
    event(name, ...data) {
        this.#controller.event(name, ...data);
    }

    /**
     * Emit multiple events from this model.
     * @param {...Array} events The events to fire. Each array must be the arguments given directly to a this.event()
     *        call.
     * @returns {Array<String>} The names of the events fired.
     */
    events(...events) {
        const eventNames = [];
        for (const event of events) {
            eventNames.push(event.at(0));
            this.event(...event);
        }
        return eventNames;
    }

    /**
     * Creates a new object that is given the ability to emit events to the controller.
     * This is achieved by passing a frozen object as the first argument to the object's constructor. This object will
     * contain a single function called "event" that has the same signature as Model.event. The new object can then
     * store this frozen object and emit events whenever it likes.
     * @param {Function} type The type of object to instantiate.
     * @param {...any} params The parameters to pass to the object's constructor (after the "emitter" object).
     * @returns {any} A new object of the given type.
     */
    newObjectWithEmitter(type, ...params) {
        return new type(
            Object.freeze({
                event: (name, ...data) => this.#controller.event(name, ...data),
            }),
            ...params
        );
    }

    /**
     * Every model has a default NewClient event handler that pushes the model's front-end data to the new client, as
     * well as a list of initial front-end events to emit.
     * @param {String} sessionKey The new client's session key.
     * @see Model.emitOnNewClient
     */
    onNewClient(sessionKey) {
        this.log("debug", `Detected a new client ${sessionKey}`);
        const events = [];
        for (const event of this.emitOnNewClient) {
            // The initial events never come with arguments, as they're front-end only.
            events.push([event]);
        }
        this.log("debug", "Will emit these events in the front-end:", events);
        this.replaceFrontEndData(sessionKey, ...events);
    }

    /**
     * Publishes the entirety of the model's front-end data for a given client, alongside its [new] structure.
     * @param {String} sessionKey The client to replace the front-end model of.
     * @param {...Array} events A list of additional events to emit alongside the NewFrontEndData event. Each array must
     *        be the arguments given to a this.event() call. Each event name given in these arrays will also be added to
     *        the NewFrontEndData event so that client controllers know which events to emit on their end.
     */
    replaceFrontEndData(sessionKey, ...events) {
        const structure = this.frontEndDataStructure();
        const data = this.frontEndData(sessionKey);
        const eventNames = this.events(...events);
        this.log(
            "debug",
            `Replacing front-end model for client ${sessionKey} (structure, data, events):`,
            structure,
            data,
            eventNames
        );
        this.event("NewFrontEndData", this.constructor.name, sessionKey, structure, data, eventNames);
    }

    /**
     * Publishes an update to the model's front-end data for a given client.
     * @param {String} sessionKey The client to update the front-end model of.
     * @param {Object} data The changes to the front-end data to publish. May or may not be the result of
     *        this.frontEndData(). If it is not, then a partial update is published. Partial updates must have the same
     *        structure/hierarchy as the one defined by this.frontEndDataStructure().
     * @param {...Array} events A list of additional events to emit alongside the FrontEndDataChange event. Each array
     *        must be the arguments given to a this.event() call. Each event name given in these arrays will also be
     *        added to the FrontEndDataChange event so that client controllers know which events to emit on their end.
     */
    updateFrontEndData(sessionKey, data, ...events) {
        const eventNames = this.events(...events);
        this.log(
            "debug",
            `Publishing an update to the front-end model for client ${sessionKey} (data, events):`,
            data,
            eventNames
        );
        this.event("FrontEndDataChange", this.constructor.name, sessionKey, data, eventNames);
    }

    /**
     * Publishes an update to the model's front-end data for every client.
     * @param {Object} data The changes to the front-end data to publish. May or may not be the result of
     *        this.frontEndData(). If it is not, then a partial update is published. Partial updates must have the same
     *        structure/hierarchy as the one defined by this.frontEndDataStructure().
     * @param {...Array} events A list of additional events to emit alongside the FrontEndDataChange event. Each array
     *        must be the arguments given to a this.event() call. Each event name given in these arrays will also be
     *        added to the FrontEndDataChange event so that client controllers know which events to emit on their end.
     */
    updateFrontEndDataForEveryone(data, ...events) {
        const eventNames = this.events(...events);
        this.log(
            "debug",
            `Publishing an update to the front-end model for every client (data, events):`,
            data,
            eventNames
        );
        this.event("FrontEndDataChange", this.constructor.name, undefined, data, eventNames);
    }

    // MARK: Interface

    /**
     * Defines the structure of this model's front-end counterpart.
     * By default, when front-end model updates are published (always as objects), they're spread over the existing
     * front-end model. This allows models to only publish their actual changes instead of publishing their entire
     * front-end model, which may be very large, every time a change occurs.
     * However, this means that if there are large objects within the front-end model's data object, changes to them
     * will still require publishing the entire object whenever a change occurs.
     * To address this, when the model publishes its initial data object, or when the model publishes its entire data
     * object to replace the existing one later on, it can also push its intended structure. This allows the object
     * spreading functionality to operate on more than one level should it be more efficient to do so.
     * For example, consider this front-end model:
     * {
     *     "flag": true,
     *     "largeObject": {
     *         "0": {
     *             "0": {
     *                 "type": "Plains",
     *                 "hp": 100,
     *                 "lots": {
     *                     "more": "properties",
     *                 },
     *             },
     *             "1": {
     *                 "type": "Plains",
     *                 "hp": 100,
     *                 "lots": {
     *                     "more": "properties",
     *                 },
     *             },
     *         },
     *         "1": {
     *             "0": {
     *                 "type": "Plains",
     *                 "hp": 100,
     *                 "lots": {
     *                     "more": "properties",
     *                 },
     *             },
     *             "1": {
     *                 "type": "Plains",
     *                 "hp": 100,
     *                 "lots": {
     *                     "more": "properties",
     *                 },
     *             },
     *         },
     *         etc.
     *     },
     *     "smallObject": {
     *         "x": 3,
     *         "y": -1,
     *     },
     * }
     * You could define its structure like this:
     * {
     *     "largeObject": {
     *         "0": {
     *             "0": {},
     *             "1": {},
     *         },
     *         "1": {
     *             "0": {},
     *             "1": {},
     *         },
     *         etc.
     *     },
     * }
     * and this would mean that if one of the inner objects requires an update, you can publish it like this:
     * {
     *     "largeObject": {
     *         "0": {
     *             "1": {
     *                 "type": "Plains",
     *                 "lots": {
     *                     "the properties within this object": "will be completely replaced",
     *                 },
     *             },
     *         },
     *     },
     * }
     * instead of publishing the entire "largeObject", since the structure defines that "largeObject" and some of its
     * inner objects require individual spreading.
     * @returns {Object} Defines the structure of this model's front-end counterpart.
     * @abstract
     */
    frontEndDataStructure() {
        return {};
    }

    /**
     * Returns the complete front-end version of this model that's sent to a given client.
     * @param {String} sessionKey The client to compute the front-end model of.
     * @returns {Object} The model's front-end version of the data it stores.
     * @abstract
     */
    frontEndData(sessionKey) {
        return {};
    }

    /**
     * The front-end events to emit when a new client connects (and when it reconnects later).
     * Whenever a NewClient event is received by the model, it emits this.frontEndData() + this.frontEndDataStructure()
     * for the new client's consumption. Override this array to tell the client to emit these events alongside the data
     * and its structure. Back-end and front-end events should be named the same and are emitted simultaneously (e.g.
     * via a call to updateFrontEndData()), but in this case these events are not emitted in the back end, only to in
     * the new client's front end.
     * @abstract
     */
    emitOnNewClient = [];
}
