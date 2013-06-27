/**
 * Combobox Plugin
 * User: tedlin
 * Date: 6/27/13
 * @requires => RequireJS, jQuery, combobox.scss
 */

/**
 *  1. On page load, find input field targeted and insert custom HTML with classes
 *  2. On click of the current selected text field, switch to input field where
 *     user can type in name and it will auto filter dropdown. Also highlight
 *     text typed.
 *  3. On click of arrow, open up dropdown list.
 *
 */

(function ($, global, undefined) {

    var Klass = function (targ, opts, idx) {
        this._construct.call(this, targ, opts || {}, idx);
    },
    whitespace = /\s+/g;

    var isAttribute = function (elem, val) {
        var patt = new RegExp(whitespace),
            valExists = val.replace(patt).length > 0;

        return valExists && elem.attr(val) ? elem.attr(val) : val;
    };

    Klass.prototype = {
        /**
         * Constructor - Define all properties for class
         * @param targ - dropdown menu specified by user
         * @param opts - options
         * @param idx - index of instance; used to create unique class to help with context
         * @private
         */
        _construct: function (targ, opts, idx) {
            this.menu = $(targ);
            this.defaultDisplayVal = isAttribute(this.menu, opts.defaultDisplayVal);
            this.dropdownItem = opts.dropdownItem;
            this.selectItemCallback = opts.selectItemCallback;
            this.idAttribute = opts.idAttribute;
            this.customPrep = opts.customPrep;
            this.customHandlers = opts.customHandlers;

            // Do prep work and event bindings
            this._prep(idx).activate();
        },
        // Prep
        // Here is we do any prep work (eg. insert custom HTML, add classes, calculations)
        _prep: function (idx) {
            var self = this,
                wrapper = '<div class="custom_combobox combobox_' + idx + '">',
                inputField = '<div class="combobox_inputfield"><input type="text" class="combobox_input" placeholder="' + self.defaultDisplayVal + '" tabindex="' + (idx + 1) + '" data-context=".combobox_' + idx + '" /><a href="#" class="combobox_dropdowntrig"></a></div>';

            // Add custom class for easy targeting
            if (!self.menu.hasClass('combobox_dropdown')) {
                self.menu.addClass('combobox_dropdown');
            }

            // Wrap new combobox in container
            self.menu.wrap(wrapper);

            // Prepend Inputfield section to menu
            self.menu.before(inputField);

            // Target all menus for off-click hide
            self.menus = $('.custom_combobox').find('.combobox_dropdown');

            // Store reference to this particular instance's wrapper in a property
            self.context = $('.combobox_' + idx);

            // Once input field is created and inserted into the DOM, store
            // reference to this element in property
            self.inputField = self.context.find('.combobox_input');

            // Same for dropdownTrig
            self.menuTrig = self.context.find('.combobox_dropdowntrig');

            // Redefine dropdownItem to provide context
            self.dropdownItems = self.context.find(self.dropdownItem);

            // Optional Custom Prep on page load
            if (self.customPrep) {
                self.customPrep(self.context);
            }

            return this;
        },
        // Activate
        // Here is where we bind all event handlers
        activate: function () {
            var self = this;

            // Bind handlers to inputField
            self.inputField.on({
                keyup: function (e) {
	                var $input = this;

                    self.filterResults($input.value);
                },
                click: function (e) {
                    e.stopPropagation();

                    // Hide all other combobox dropdowns
                    self.hideDropdown();

                    // Show contextual dropdown
                    self.showDropdown();
                }
            });

            // Show dropdown menu on click of dropdownTrig
            self.menuTrig.off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

	            if (self.context.find(self.menus).hasClass('off')) {
                    self.showDropdown();
	            } else {
		            self.hideDropdown();
	            }

            });

            // Update input field upon click of menu item
            self.context.off('click').on('click', self.dropdownItem, function (e) {
                var $self = $(e.target);

                e.preventDefault();

                // Run selectItem
                self.selectItem($self);
            });

            // Close dropdown when click off
            $('html').off('click').on('click', function () {
                // Hide dropdown menu
                self.hideDropdown();
            });

            // If user specified custom handlers,
            // call them here
            if (self.customHandlers) {
                self.customHandlers(self);
            }

            return this;
        },
        selectItem: function ($selectedItem) {
            var self = this,
                val = $selectedItem.text(),
                id = $selectedItem.attr(self.idAttribute),
                $current = self.menu.find('.current_filter');

	        // Re-show all dropdown items after select an item
	        self.dropdownItems.parent('li').removeClass('off');

            // First remove current class from previous current item
            if ($current.length > 0) {
                $current.removeClass('current_filter');
            }

            // Add 'current' class to selected item
            $selectedItem.addClass('current_filter');

            // Update input field with current selected item
            self.inputField.val(val);

            // If user specified callback upon item selection,
            // execute it.
            if (self.selectItemCallback) {
                self.selectItemCallback(self.context, $selectedItem, self.inputField, val, id);
            }

            // Hide dropdown menu
            self.hideDropdown();
        },
        // On keyup, match value inputted with dropdown item values
        // Hide ones that don't match and show ones that do match
        filterResults: function (val) {
            var i = 0,
                l = this.dropdownItems.length - 1,
	            lis = this.dropdownItems.parent('li'),
	            li,
                patt = new RegExp(val, "i"),
                item;

            // Find all li's and scan text to see if
            // val typed matches any of the items.
            for (; i <= l; i++) {
                item = $(this.dropdownItems[i]);
	            li = $(lis[i]);

                if (!item.text().match(patt)) {
	                if (!li.hasClass('off')) {
		                li.addClass('off');
	                }
                } else {
	                if (li.hasClass('off')) {
		                li.removeClass('off');
	                }
                }
            }
            // TODO => If no results match, show error message?

            // If so, replace that text with text wrapped in <strong></strong>

        },
        // Show dropdown menu; This will get trigger on focus of the inputfield and
        // click of the dropdownTrig
        showDropdown: function () {
            var self = this;

            if (self.menu.hasClass('off')) {
                self.menu.removeClass('off');
            }

            return self;
        },
        hideDropdown: function () {
            var self = this;

            self.menus.addClass('off');

            return self;
        }
    };

    /**
     *  jQuery Adapter
     *  - Extend OKL namespace with combobox plugin
     *  @options:
     *      - inputField => user specified input field to target for combobox instance
     *      - defaultDisplayVal [string] => This is the default display value for the inputfield
     *                             This can be either a string or element attribute on
     *                             the menu.
     *      - dropdownItem => The dropdown result; Need to target in order to update
     *                      current value selected in inputfield
     *      - debugger [boolean] => True to turn on debugger; Default is set to false
     *      - selectItemCallback (optional) => Upon dropdown item select, user can provide callback
     *      - idAttribute => attribute on dropdown item that contains ID for data.
     */

    $.fn.extend({
        combobox: function (opts) {
            var defaults = {
                defaultDisplayVal: '',
                dropdownItem: null,
                selectItemCallback: null,
                idAttribute: 'data-id',
                customPrep: null,
                customHandlers: null,
                debugger: false
            }, o = $.extend(defaults, opts),
            i = 0, l = this.length - 1;

            for (; i <= l; i++) {
                new Klass($(this[i]), o, i);
            }
        }
    });
})(jQuery, this);
