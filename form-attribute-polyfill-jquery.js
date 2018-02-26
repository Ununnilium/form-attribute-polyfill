function browserNeedsPolyfill() {
  var SAMPLE_FORM_NAME = "html-5-polyfill-test";
  var sampleForm = document.createElement("form");
  sampleForm.setAttribute("id", SAMPLE_FORM_NAME);
  sampleForm.setAttribute("type", "hidden");
  var sampleFormAndHiddenInput = document.createElement("input");
  sampleFormAndHiddenInput.setAttribute("type", "hidden");
  sampleFormAndHiddenInput.setAttribute("form", SAMPLE_FORM_NAME);
  sampleForm.appendChild(sampleFormAndHiddenInput);
  document.body.appendChild(sampleFormAndHiddenInput);
  var sampleElementFound = sampleForm.elements.length === 1;
  document.body.removeChild(sampleFormAndHiddenInput);
  document.body.removeChild(sampleForm);
  return !sampleElementFound;
}

// Source: https://stackoverflow.com/a/26696165/2372674
function executeFormPolyfill() {
  // Append a field to a form
  $.fn.appendField = function(data) {
    // for form only
    if (!this.is('form')) {
      return;
    }

    // wrap data
    if (!Array.isArray(data) && data.name && data.value) {
      data = [data];
    }

    var form = this;

    // attach new params
    $.each(data, function(i, item) {
      $('<input/>')
        .attr('type', 'hidden')
        .attr('name', item.name)
        .val(item.value).appendTo(form);
    });

    return form;
  };


  // Find all input fields with form attribute point to jQuery object
  $('form[id]').on("submit", function(e) {
    // serialize data
    var data = $('[form='+ this.id + ']').serializeArray();
    // append data to form
    $(this).appendField(data);
  }).each(function() {
    var form = this,
      $fields = $('[form=' + this.id + ']');

    $fields.filter('button, input').filter('[type=reset],[type=submit]').on("click", function() {
      var type = this.type.toLowerCase();
      if (type === 'reset') {
        // reset form
        form.reset();
        // for elements outside form
        $fields.each(function() {
          this.value = this.defaultValue;
          this.checked = this.defaultChecked;
        }).filter('select').each(function() {
          $(this).find('option').each(function() {
            this.selected = this.defaultSelected;
          });
        });
      } else if (type.match(/^submit|image$/i)) {
        $(form).appendField({name: this.name, value: this.value})[0].dispatchEvent(evt);
      }
    });
  });
}

function detectedNewForms() {
  var ALREADY_DETECTED_CLASS = "form-already-detected";
  var newForms = $("form:not(." + ALREADY_DETECTED_CLASS + ")");
  if (newForms.length !== 0) {
    newForms.addClass(ALREADY_DETECTED_CLASS);
    executeFormPolyfill();
  }
  setTimeout(detectedNewForms, 100);  // Poll for changes
}

// Source: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
function polyfillCustomEvent() {
  if ( typeof window.CustomEvent === "function" ) {
    return false;
  }

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
}


if (browserNeedsPolyfill()) {
  polyfillCustomEvent();   // IE is missing CustomEvent

  // If submit is not used normally, but replaced with custom JavaScript, this workaround is needed
  // Source: https://stackoverflow.com/a/35155789/2372674
  var evt = new CustomEvent("submit", {"bubbles": true, "cancelable": true});
  detectedNewForms();   // Load jQuery if necessary and execute form attribute polyfill
}
