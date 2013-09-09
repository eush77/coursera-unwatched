var CHECKBOX_SCALE = 3/4;
var RIGHT_PADDING_PORTION = 1/4;
var OPACITY = 0.3;

var section = document.getElementsByClassName('course-item-list')[0];
var lectures = section.getElementsByTagName('li');

// Sparse array of selected resources for each lecture
var selected = [];

/** Return resource bar for given lectures list item.
 * @param {HTMLLIElement} li
 * @returns {HTMLDivElement}
 */
var resourcesBar = function(li) {
    return li.getElementsByClassName('course-lecture-item-resource')[0];
};

/** Create checkbox with the given ID
 * @param {Number} index
 * @returns {HTMLInputElement}
 */
var Checkbox = (function(li) {
    // Compute values
    var resbar = resourcesBar(li);
    var icon = resbar.getElementsByTagName('i')[0];
    var size = icon.offsetHeight * CHECKBOX_SCALE;
    var shiftRight = parseInt(window.getComputedStyle(li).paddingRight) * (1 - RIGHT_PADDING_PORTION);
    var shiftBottom = parseInt(window.getComputedStyle(resbar).paddingTop)
        + parseInt(window.getComputedStyle(icon).paddingTop);
    var checkboxClass = 'curly-checkbox';
    // Make prototype
    var checkboxTemplate = document.createElement('input');
    checkboxTemplate.type = 'checkbox';
    checkboxTemplate.style.cssFloat = 'right';
    checkboxTemplate.style.width = checkboxTemplate.style.height = size + 'px';
    checkboxTemplate.style.marginRight = -shiftRight + 'px'
    checkboxTemplate.style.marginTop = shiftBottom + 'px';
    checkboxTemplate.style.opacity = OPACITY;
    checkboxTemplate.className = checkboxClass;
    // Return constructor
    var create = function(index) {
        var checkbox = checkboxTemplate.cloneNode();
        checkbox.dataset.index = index; // Set index attribute
        return checkbox;
    };
    create.className = checkboxClass;
    return create;
}(lectures[0]));

// Create and embed checkboxes
var checkboxes = [].map.call(lectures, function(li, index) {
    var checkbox = Checkbox(index);
    li.insertBefore(checkbox, li.lastElementChild);
    return checkbox;
});

// Handle clicks on checkboxes
!function() {
    var lastCheckedIndex;
    // Simple state handler
    // Options: 'checkbox', 'index', 'changeState'. At least one of the first two is required.
    var check = function(opts) {
        var checkbox = opts.checkbox || checkboxes[opts.index];
        var index = opts.index || checkbox.dataset.index;
        if (opts.changeState) {
            checkbox.checked = !checkbox.checked;
        }
        selected[index] = checkbox.checked
            ? [].map.call(resourcesBar(checkbox.parentNode).children, function(a) {
                return {title: a.title, href: a.href};
            })
        : []; // Can still be passed to concat
    };
    // Listener
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains(Checkbox.className)) {
            var targetCheckbox = event.target, index = +targetCheckbox.dataset.index;
            if (event.shiftKey && lastCheckedIndex != null && lastCheckedIndex != index) {
                var delta = index < lastCheckedIndex ? +1 : -1;
                for (var i = index + delta; i != lastCheckedIndex; i += delta) {
                    var checkbox = checkboxes[i];
                    check({index: i,
                           changeState: true});
                }
            }
            check({checkbox: targetCheckbox,
                   index: lastCheckedIndex = index});
        }
        else {
            // Forget last checkbox if clicked anywhere else
            lastCheckedIndex = null;
        }
    });
}();

var actions = {
    // Extract resource links for marked lectures
    extract: function() {
        var arrayOfArrays = Object.keys(selected).filter(isFinite).sort(function(a, b) {
            return a - b;
        }).map(function(key) {
            return selected[key];
        });
        var array = [].concat.apply([], arrayOfArrays);
        chrome.runtime.sendMessage(null, {type: 'extracted', data: array});
    },
    'select-all': function() {
        checkboxes.forEach(function(checkbox) {
            if (!checkbox.checked) {
                checkbox.click();
            }
        });
    },
    'select-none': function() {
        checkboxes.forEach(function(checkbox) {
            if (checkbox.checked) {
                checkbox.click();
            }
        });
    },
    'select-invert': function() {
        checkboxes.forEach(function(checkbox) {
            checkbox.click();
        });
    },
    'select-new': function() {
        checkboxes.forEach(function(checkbox) {
            if (checkbox.parentNode.classList.contains('unviewed')) {
                checkbox.click();
            }
        });
    },
};

// Listen for messages
chrome.runtime.onMessage.addListener(function(message) {
    actions[message.type]();
});
