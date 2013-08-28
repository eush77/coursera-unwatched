window.addEventListener('DOMContentLoaded', function() {

    var textarea = document.getElementById('output');
    var controlPanel = document.getElementById('control-panel');

    // Formats selected by default
    var defaultFormat = new function(substrings) {
        return function(title) {
            title = title.toLowerCase();
            return substrings.some(function(s) {
                return title.indexOf(s) >= 0;
            });
        };
    }(['srt', 'video']);

    // List of resources
    var ResList = function(data) {
        return {
            // Filter object
            formats: new function() {
                data.links.forEach(function(link) {
                    this[link.title] = defaultFormat(link.title);
                }.bind(this));
            },
            // Create checkboxes and draw the form
            makeForm: function() {
                checkboxes = Object.keys(this.formats).map(function(title) {
                    var label = document.createElement('label');
                    var input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = this.formats[title];
                    label.appendChild(input);
                    // Disable incidental text selection
                    label.setAttribute('onmousedown', 'return false');
                    label.appendChild(document.createTextNode(title));
                    return label;
                }.bind(this));
                controlPanel.innerHTML = '';
                checkboxes.forEach(function(checkbox) {
                    controlPanel.appendChild(checkbox);
                });
                return this;
            },
            // Format and output data
            write: function() {
                textarea.value = data.options.join('\n') + '\n\n' + data.links.filter(function(link) {
                    return this.formats[link.title];
                }.bind(this)).map(function(link) {
                    return link.value;
                }).join('\n') + '\n';
                return this;
            },
        };
    };
    var resList = ResList({options: [], links: []});

    // Handle clicks on checkboxes
    controlPanel.onchange = function(event) {
        if (event.target.tagName == 'INPUT') {
            var type = event.target.nextSibling.data, checked = event.target.checked;
            resList.formats[type] = checked;
            resList.write();
        }
    };

    // Receive data
    chrome.runtime.onMessage.addListener(function(message) {
        switch (message.type) {
        case 'output':
            // Message data format: {
            //   options: [...],
            //   links:   [{
            //     title: '...',
            //     value: '...'
            //   }...]
            // }
            (resList = ResList(message.data)).makeForm().write();
            textarea.select();
            break;
        }
    });

    chrome.runtime.sendMessage(null, {type: 'output-ready'});

});
