'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
getEmitter.isStar = true;
module.exports = getEmitter;

/**
 * Возвращает новый emitter
 * @returns {Object}
 */

function getEmitter() {
    let events = {};

    let addEvents = function (eventName) {
        let parentEvent = null;
        eventName.split('.').forEach(function (subEvent) {
            let fullName = parentEvent === null ? subEvent : `${parentEvent.name}.${subEvent}`;
            if (!events.hasOwnProperty(fullName)) {
                events[fullName] = getEvent(fullName, parentEvent);
            }
            parentEvent = events[fullName];
        });
    };

    let getEventForEmit = function (event) {
        let eventForEmit = null;
        event.split('.').every(function (subEvent) {
            let fullName = eventForEmit === null ? subEvent : `${eventForEmit.name}.${subEvent}`;
            if (!events.hasOwnProperty(fullName)) {
                return false;
            }

            eventForEmit = events[fullName];

            return true;
        });

        return eventForEmit;
    };

    return {

        /**
         * Подписаться на событие
         * @param {String} eventName
         * @param {Object} context
         * @param {Function} handler
         * @returns {Object} this emmiter
         */
        on: function (eventName, context, handler) {
            return this.onWithFilter(eventName, context, handler, callsCount => callsCount > 0);
        },

        /**
         * Отписаться от события
         * @param {String} eventName
         * @param {Object} context
         * @returns {Emmiter} this emmiter
         */
        off: function (eventName, context) {
            if (events.hasOwnProperty(eventName)) {
                events[eventName].unsubscribe(context, events);
            }

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object} this emmiter
         */
        emit: function (event) {
            let eventForEmit = getEventForEmit(event);
            if (eventForEmit !== null) {
                eventForEmit.raise();
            }

            return this;
        },

        /**
         * Подписаться на событие c ограничением
         * @param {String} eventName
         * @param {Object} context
         * @param {Function} handler
         * @param {Function} filter принимает на
         * вход количество вызовов события
         * @returns {Object} this emmiter
         */
        onWithFilter: function (eventName, context, handler, filter) {
            if (context === undefined || context === null) {
                return this;
            }

            addEvents(eventName);
            events[eventName].subscribe(handler, context, filter);

            return this;
        },

        /**
         * Подписаться на событие с ограничением по количеству полученных уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} times – сколько раз получить уведомление
         * @returns {Object} this emmiter
         */
        several: function (event, context, handler, times) {
            return times < 1
                ? this.on(event, context, handler)
                : this.onWithFilter(event, context, handler, callsCount => callsCount <= times);
        },

        /**
         * Подписаться на событие с ограничением по частоте получения уведомлений
         * @star
         * @param {String} eventName
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} frequency – как часто уведомлять
         * @returns {Object} this emmiter
         */
        through: function (eventName, context, handler, frequency) {
            return frequency < 1
                ? this.on(eventName, context, handler)
                : this.onWithFilter(eventName, context, handler,
                    callsCount => callsCount % frequency !== 0);
        }
    };
}


function getEvent(eventName, parentEvent) {
    let callsCount = 0;

    return {
        observers: [],
        name: eventName,
        parent: parentEvent,

        raise: function () {
            callsCount++;
            this.observers
                .filter(observer =>
                    typeof observer.filterCalls === 'function' &&
                    typeof observer.handler === 'function' &&
                    typeof observer.context !== undefined &&
                    observer.filterCalls(callsCount))
                .forEach(observer => observer.handler.call(observer.context));

            if (this.parent !== null) {
                this.parent.raise();
            }
        },

        subscribe: function (handler, context, filterCalls) {
            this.observers.push({
                'handler': handler,
                'context': context,
                'filterCalls': filterCalls
            });
        },

        unsubscribe: function (context, events) {
            this.observers = this.observers.filter(observer => observer.context !== context);
            Object.values(events)
                .filter(event => event.parent !== null && event.parent.name === this.name)
                .forEach(event => event.unsubscribe(context, events));
        }
    };
}
