/**
 * @file model.mjs
 * Defines the base class for models.
 */

/**
 * Abstract base class for all models in the backend.
 * A model encapsulates data from the rest of the game, and exposes public-facing commands that allow external actors to
 * update the data in controlled ways. A majority of the lower-level game logic will be within models.
 * When a model is instantiated by the controller, it will scan its methods and index those that follow the naming
 * convention (note that `on` and `when` are case sensitive):
 * 1. Public methods starting with `on` and then followed by an event name, e.g. `onUnitCreated`, are categorized as
 *    event handlers. Whenever any model emits that event, that method will be invoked, and the event's data will be
 *    passed in: e.g. `onUnitCreated(...data)`. You must not rely on event handlers to be invoked in a certain order.
 * 2. Public methods starting with `when` and then followed by a command name, e.g. `whenCreateUnit`, are categorized as
 *    command handlers. Whenever a client submits that command, that method will be invoked, and the command's arguments
 *    will be passed in: e.g. `whenCreateUnit(...unitOptions)`. Commands can return anything they wish.
 * There can be many event handlers, but there can only be one command handler throughout every model in a controller.
 * This is because you don't want two different models changing their state when a single command is submitted. This
 * usually implies that one of those models is "owned" by the other: either it should be encapsulated entirely within
 * the "owning" model and removed from the controller, or it should listen out for an event from the "owning" model,
 * once the "owning" model has validated the command and updated its data in a valid manner.
 */
export default class Model {
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
     * Models can request that some of their commands be given the sender's session key as their first argument.
     * Since views are the only actors that can send commands, this request must always be respected. Subclasses can
     * override this field with a list of names, one for each command that requires a session key argument. Do not
     * prepend any command name with "when".
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
}
