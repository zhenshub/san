/**
 * @file 完成元素 attached 后的行为
 * @author errorrik(errorrik@gmail.com)
 */



var each = require('../util/each');
var bind = require('../util/bind');
var isBrowser = require('../browser/is-browser');

var eventDeclarationListener = require('./event-declaration-listener');
var elementAddElEvent = require('./element-add-el-event');
var isComponent = require('./is-component');
var getPropHandler = require('./get-prop-handler');


/**
 * 完成元素 attached 后的行为
 *
 * @param {Object} element 元素节点
 */
function elementAttached(element) {
    element._toPhase('created');

    var data = isComponent(element) ? element.data : element.scope;

    // 处理自身变化时双向绑定的逻辑
    var xBinds = isComponent(element) ? element.props : element.binds;
    xBinds && xBinds.each(function (bindInfo) {
        if (!bindInfo.x) {
            return;
        }

        var el = element._getEl();
        function outputer() {
            getPropHandler(element, bindInfo.name).output(element, bindInfo, data);
        }

        switch (bindInfo.name) {
            case 'value':
                switch (element.tagName) {
                    case 'input':
                    case 'textarea':
                        if (isBrowser && window.CompositionEvent) {
                            elementAddElEvent(element, 'compositionstart', function () {
                                this.composing = 1;
                            });
                            elementAddElEvent(element, 'compositionend', function () {
                                this.composing = 0;

                                var event = document.createEvent('HTMLEvents');
                                event.initEvent('input', true, true);
                                this.dispatchEvent(event);
                            });
                        }

                        elementAddElEvent(element,
                            ('oninput' in el) ? 'input' : 'propertychange',
                            function (e) {
                                if (!this.composing) {
                                    outputer(e);
                                }
                            }
                        );

                        break;

                    case 'select':
                        elementAddElEvent(element, 'change', outputer);
                        break;
                }
                break;

            case 'checked':
                switch (element.tagName) {
                    case 'input':
                        switch (el.type) {
                            case 'checkbox':
                            case 'radio':
                                elementAddElEvent(element, 'click', outputer);
                        }
                }
                break;
        }

    });

    // bind events
    each(element.aNode.events, function (eventBind) {
        elementAddElEvent(element,
            eventBind.name,
            bind(
                eventDeclarationListener,
                isComponent(element) ? element : element.owner,
                eventBind,
                0,
                element.data || element.scope
            )
        );
    });

    element._toPhase('attached');
}


exports = module.exports = elementAttached;
