"use strict";

window.onload = function() {
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

    // Ideas from jQuery variant https://stackoverflow.com/a/26696165/2372674
    function executeFormPolyfill() {
        function appendDataToForm(data, form) {
            Object.keys(data).forEach(function(name) {
                var inputElem = document.createElement("input");
                inputElem.setAttribute("type", "hidden");
                inputElem.setAttribute("name", name);
                inputElem.value = data[name];
                form.appendChild(inputElem);
            });
        }

        var forms = document.body.querySelectorAll("form[id]");
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

    function detectedNewForms() {
        var newForms = document.querySelectorAll('form:not([class="form-already-dectected"])');
        if (newForms.length !== 0) {
            Array.prototype.forEach.call(newForms, function (form) {
                form.className += "form-already-dectected";
            });
            executeFormPolyfill();
        }
        setTimeout(detectedNewForms, 100);
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

        // If submit is not used normally, but replaced with custom JavaScript, this workaround is needed
        // Source: https://stackoverflow.com/a/35155789/2372674
        var eventToDispatch = new CustomEvent("submit", {"bubbles": true, "cancelable": true});
        detectedNewForms();   // Load jQuery if necessary and execute form attribute polyfill
    }
};
