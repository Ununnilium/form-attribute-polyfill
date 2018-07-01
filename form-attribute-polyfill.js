"use strict";

window.onload = function() {
    (function() {
        function browserNeedsPolyfill() {
            var TEST_FORM_NAME = "form-attribute-polyfill-test";
            var testForm = document.createElement("form");
            testForm.setAttribute("id", TEST_FORM_NAME);
            testForm.setAttribute("type", "hidden");
            var testInput = document.createElement("input");
            testInput.setAttribute("type", "hidden");
            testInput.setAttribute("form", TEST_FORM_NAME);
            testForm.appendChild(testInput);
            document.body.appendChild(testInput);
            document.body.appendChild(testForm);
            var sampleElementFound = testForm.elements.length === 1;
            document.body.removeChild(testInput);
            document.body.removeChild(testForm);
            return !sampleElementFound;
        }

        // Ideas from jQuery form attribute polyfill https://stackoverflow.com/a/26696165/2372674
        function executeFormPolyfill(forms) {
            function appendDataToForm(data, form) {
                Object.keys(data).forEach(function(name) {
                    var inputElem = document.createElement("input");
                    inputElem.setAttribute("type", "hidden");
                    inputElem.setAttribute("name", name);
                    inputElem.value = data[name];
                    form.appendChild(inputElem);
                });
            }
            Array.prototype.forEach.call(forms, function (form) {
                var fields = document.querySelectorAll('[form="' + form.id + '"]');
                var dataFields = [];
                Array.prototype.forEach.call(fields, function (field) {
                    if (field.disabled === false && field.hasAttribute("name")) {
                        dataFields.push(field);
                    }
                });
                Array.prototype.forEach.call(fields, function (field) {
                    if (field.type === "reset") {
                        field.addEventListener("click", function () {
                            form.reset();
                            Array.prototype.forEach.call(dataFields, function (dataField) {
                                if (dataField.nodeName === "SELECT") {
                                    Array.prototype.forEach.call(dataField.querySelectorAll('option'), function (option) {
                                        option.selected = option.defaultSelected;
                                    });
                                } else {
                                    dataField.value = dataField.defaultValue;
                                    dataField.checked = dataField.defaultChecked;
                                }
                            });
                        });
                    } else if (field.type === "submit" || field.type === "image") {
                        field.addEventListener("click", function () {
                            var obj = {};
                            obj[field.name] = field.value;
                            appendDataToForm(obj, form);
                            form.dispatchEvent(eventToDispatch);
                        });
                    }
                });
                form.addEventListener("submit", function () {
                    var data = {};
                    Array.prototype.forEach.call(dataFields, function (dataField) {
                        data[dataField.name] = dataField.value;
                    });
                    appendDataToForm(data, form);
                });
            });
        }

        // Detect new forms and execute polyfill for them
        function detectedNewForms() {
            var ALREADY_DETECTED_CLASS = 'form-already-detected';
            var newFormElements = document.querySelectorAll('form:not([class="' + ALREADY_DETECTED_CLASS + '"])');
            if (newFormElements.length !== 0) {
                Array.prototype.forEach.call(newFormElements, function (form) {
                    form.className += ALREADY_DETECTED_CLASS;
                });
                executeFormPolyfill(newFormElements);
            }

            var observer = new MutationObserver(function(mutations) {
                var formElements = [];
                mutations.forEach(function(mutation) {
                    Array.prototype.slice
                        .call(mutation.addedNodes, 0)
                        .forEach(function(node) {
                            if(node.nodeType === 1 && node.tagName === 'FORM' && (typeof node.id !== 'undefined') &&
                            !node.classList.contains(ALREADY_DETECTED_CLASS)) {
                                node.className += ALREADY_DETECTED_CLASS;
                                formElements.push(node)
                            }
                        });
                });
                executeFormPolyfill(formElements);
            });
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }


        // Source: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
        function polyfillCustomEvent() {
            if (typeof window.CustomEvent === "function") {
                return false;
            }

            function CustomEvent(event, params) {
                params = params || {bubbles: false, cancelable: false, detail: undefined};
                var evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                return evt;
            }

            CustomEvent.prototype = window.Event.prototype;
            window.CustomEvent = CustomEvent;
        }

        if (browserNeedsPolyfill()) {
            polyfillCustomEvent();   // IE is missing CustomEvent

            // This workaround is needed if submit is handled by JavaScript instead the browser itself
            // Source: https://stackoverflow.com/a/35155789/2372674
            var eventToDispatch = new CustomEvent("submit", {"bubbles": true, "cancelable": true});
            detectedNewForms();   // Poll for new forms and execute form attribute polyfill for new forms
        }
    }());
};
