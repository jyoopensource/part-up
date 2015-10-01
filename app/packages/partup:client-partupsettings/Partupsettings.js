// jscs:disable
/**
 * Widget to render part-up settings
 *
 * You can pass the widget a few options which enable various functionalities
 *
 * @module client-partupsettings
 * @param {Object} currentPartup    the partup that will be prefilled in the form
 * @param {String} FORM_ID          the form id to be used in the autoform
 * @param {Boolean} CREATE          true: render in create mode, false: render in update mode
 */
// jscs:enable
var formId;
var formPlaceholders = {
    name: function() {
        return __('partupsettings-form-name-placeholder');
    },
    description: function() {
        return __('partupsettings-form-description-placeholder');
    },
    tags_input: function() {
        return __('partupsettings-form-tags_input-placeholder');
    },
    type_commercial_budget: function() {
        return __('partupsettings-form-budget_money-placeholder');
    },
    type_organization_budget: function() {
        return __('partupsettings-form-budget_hours-placeholder');
    },
    end_date: function() {
        return __('partupsettings-form-end_date-placeholder');
    },
    location_input: function() {
        return __('partupsettings-form-location_input-placeholder');
    }
};

Template.Partupsettings.onCreated(function() {
    var template = this;

    template.nameCharactersLeft = new ReactiveVar(Partup.schemas.entities.partup._schema.partup_name.max);
    template.descriptionCharactersLeft = new ReactiveVar(Partup.schemas.entities.partup._schema.description.max);
    template.imageSystem = new ImageSystem(template);
    template.budgetType = new ReactiveVar();
    template.budgetTypeChanged = new ReactiveVar();
    template.draggingFocuspoint = new ReactiveVar(false);
    template.selectedPrivacyLabel = new ReactiveVar('partupsettings-form-privacy-public');
    template.loading = new ReactiveDict();
    template.selectedLocation = new ReactiveVar();
    template.selectedPhase = new ReactiveVar('');
    template.selectedPrivacyType = new ReactiveVar('');
    template.selectedPrivacyNetwork = new ReactiveVar('');
    template.tagsInputStates = new ReactiveDict();
    template.showNetworkDropdown = new ReactiveVar(false);

    template.autorun(function() {
        var partup = Template.currentData().currentPartup;
        if (!partup) return;

        if (partup.location && partup.location.place_id) template.selectedLocation.set(partup.location);

        if (partup.image) {
            template.imageSystem.currentImageId.set(partup.image);
            template.imageSystem.uploaded.set(true);
        } else {
            template.imageSystem.getSuggestions(partup.tags);
        }
    });

    template.setFocuspoint = function(focuspoint) {
        focuspoint.on('drag:start', function() {
            template.draggingFocuspoint.set(true);
        });
        focuspoint.on('drag:end', function(x, y) {
            template.draggingFocuspoint.set(false);
            template.imageSystem.storeFocuspoint(x, y);
        });
        template.focuspoint = focuspoint;
    };

    template.unsetFocuspoint = function() {
        template.focuspoint = undefined;
    };

    template.autorun(function() {
        var imageId = template.imageSystem.currentImageId.get();

        if (imageId && template.focuspoint) {
            template.focuspoint.reset();
        }
    });

    Template.autoForm.onCreated(function() {
        if (mout.object.get(this, 'data.id') !== template.data.FORM_ID) return;
        formId = template.data.FORM_ID;

        // Oh. My. God. Look at that hack.
        // Don't change any of these rules!
        this.autorun(function() {
            AutoForm.getFieldValue('type');

            Meteor.setTimeout(function() {
                try {
                    var type = AutoForm.getFieldValue('type', template.data.FORM_ID);
                    template.budgetType.set(type);
                } catch (e) {
                    return;
                }
            });
        });
    });

    Template.autoForm.onRendered(function() {
        // Set the focuspoint input values to the form every time they change
        this.autorun(function() {
            if (!template.view.isRendered) return;

            var x = template.imageSystem.focuspoint.get('x');
            var y = template.imageSystem.focuspoint.get('y');
            var form = template.find('#' + template.data.FORM_ID);
            if (!form) return;

            form.elements.focuspoint_x_input.value = x;
            form.elements.focuspoint_y_input.value = y;

        });

        // Update the tagsInputStates when the tags change
        this.autorun(function() {
            var tags = AutoForm.getFieldValue('tags_input');
            if (tags) tags = tags.trim();

            template.tagsInputStates.set('tags', !!tags);
        });

        // Bind datepicker
        var options = Partup.client.datepicker.options;
        options.startDate = new Date();

        var dateChangeHandler = function(event) {
            event.currentTarget.nextElementSibling.value = event.date;
        };

        this.autorun(function() {
            var end_date = AutoForm.getFieldValue('end_date');
            template.end_date_datepicker = template
                .$('[bootstrap-datepicker]')
                .datepicker(options)
                .datepicker('setDate', end_date)
                .on('changeDate clearDate', dateChangeHandler);
        });
    });
});

Template.Partupsettings.onRendered(function() {
    var template = this;

    // this is a quick fix for
    // https://trello.com/c/IfsyNFgA/427-fe-partupsettings-is-not-rendered-with-correct-characters-remaining-messages-when-data-is-prefilled
    Meteor.setTimeout(function() {
        $(template.findAll('[data-max]')).each(function(index) {
            $(this).trigger('keyup');
        });
    }, 500);

    var selectedNetworkId = Session.get('createPartupForNetworkById');
    if (selectedNetworkId) {
        template.showNetworkDropdown.set(true);
        template.selectedPrivacyType.set('network');
        template.selectedPrivacyNetwork.set(selectedNetworkId);
    }
});

Template.Partupsettings.helpers({
    partup: function() {
        return this.currentPartup;
    },
    startPartupSchema: function() {
        if (this.CREATE) {
            return Partup.schemas.forms.partupCreate;
        } else {
            return Partup.schemas.forms.partupUpdate;
        }
    },
    formPlaceholders: function() {
        return formPlaceholders;
    },
    fieldsFromPartup: function() {
        var partup = this.currentPartup;
        if (!partup) return null;

        return Partup.transformers.partup.toFormStartPartup(partup);
    },
    nameCharactersLeft: function() {
        return Template.instance().nameCharactersLeft.get();
    },
    descriptionCharactersLeft: function() {
        return Template.instance().descriptionCharactersLeft.get();
    },
    partupImage: function() {
        return Template.instance().imageSystem;
    },
    partupImageId: function() {
        return Template.instance().imageSystem.currentImageId.get();
    },
    suggestionSetter: function() {
        return function(index) {
            Session.set('partials.create-partup.current-suggestion', index);
        };
    },
    currentSuggestion: function() {
        return Session.get('partials.create-partup.current-suggestion');
    },
    budgetOptions: function() {
        return [
            {
                label: __('partupsettings-form-budget-type-nobudget'), // todo: i18n
                value: ''
            },
            {
                label: __('partupsettings-form-budget-type-money'), // todo: i18n
                value: 'money'
            },
            {
                label: __('partupsettings-form-budget-type-hours'), // todo: i18n
                value: 'hours'
            }
        ];
    },
    galleryIsLoading: function() {
        var template = Template.instance();
        return template.loading &&
            (template.loading.get('suggesting-images') ||
            template.loading.get('image-uploading') ||
            template.loading.get('setting-suggestion'));
    },
    imagepreviewIsLoading: function() {
        var template = Template.instance();
        return template.loading &&
            (template.loading.get('image-uploading') ||
             template.loading.get('setting-suggestion'));
    },
    uploadingPicture: function() {
        var template = Template.instance();
        return template.loading && template.loading.get('image-uploading');
    },
    budgetType: function() {
        return Template.instance().budgetType.get();
    },
    budgetTypeChanged: function() {
        return Template.instance().budgetTypeChanged.get();
    },
    setFocuspoint: function() {
        return Template.instance().setFocuspoint;
    },
    unsetFocuspoint: function() {
        return Template.instance().unsetFocuspoint;
    },
    focuspointView: function() {
        return {
            template: Template.instance(),
            selector: '[data-focuspoint-view]'
        };
    },
    onFocuspointUpdate: function() {
        return Template.instance().imageSystem.storeFocuspoint;
    },
    draggingFocuspoint: function() {
        return Template.instance().draggingFocuspoint.get();
    },
    selectedPrivacyLabel: function() {
        return Template.instance().selectedPrivacyLabel.get();
    },
    userNetworks: function() {
        return Networks.findForUser(Meteor.user(), Meteor.userId());
    },
    privacyTypes: function() {
        var types = [
            {
                label: 'partupsettings-form-privacy-public',
                value: 'public'
            },
            {
                label: 'partupsettings-form-privacy-private',
                value: 'private'
            }
        ];

        var networks = Networks.findForUser(Meteor.user(), Meteor.userId()).fetch();
        if (networks.length) {
            types.push({
                label: 'partupsettings-form-privacy-network',
                value: 'network'
            });
        }

        return types;
    },
    showNetworkDropdown: function() {
        return Template.instance().showNetworkDropdown.get() &&
            Networks.findForUser(Meteor.user(), Meteor.userId()).fetch().length;
    },
    phaseOptions: function() {
        return [
            {
                label: 'partupsettings-form-phase-brainstorm',
                value: Partups.PHASE.BRAINSTORM
            },
            {
                label: 'partupsettings-form-phase-plan',
                value: Partups.PHASE.PLAN
            },
            {
                label: 'partupsettings-form-phase-execute',
                value: Partups.PHASE.EXECUTE
            },
            {
                label: 'partupsettings-form-phase-grow',
                value: Partups.PHASE.GROW
            }
        ];
    },
    phaseChecked: function() {
        return this.value === Template.instance().selectedPhase.get();
    },
    selectedPhase: function() {
        return Template.instance().selectedPhase.get();
    },

    // Location autocomplete
    locationLabel: function() {
        return Partup.client.strings.locationToDescription;
    },
    locationFormvalue: function() {
        return function(location) {
            return location.id;
        };
    },
    locationQuery: function() {
        return function(query, sync, async) {
            Meteor.call('google.cities.autocomplete', query, function(error, locations) {
                lodash.each(locations, function(loc) {
                    loc.value = Partup.client.strings.locationToDescription(loc);
                });
                async(locations);
            });
        };
    },
    locationSelectionReactiveVar: function() {
        return Template.instance().selectedLocation;
    },
    networkPreSelected: function() {
        var selectedNetworkId = Session.get('createPartupForNetworkById');
        return this._id === selectedNetworkId;
    },
    selectedPrivacyType: function() {
        return Template.instance().selectedPrivacyType.get();
    },
    selectedPrivacyNetwork: function() {
        return Template.instance().selectedPrivacyNetwork.get() || null;
    },
    tagsInputIsEmpty: function() {
        var template = Template.instance();

        return !template.tagsInputStates.get('tags') && !template.tagsInputStates.get('input');
    },
    privacyChecked: function() {
        return this.value === Template.instance().selectedPrivacyType.get();
    }
});

Template.Partupsettings.events({
    'keyup [data-max]': function(event, template) {
        var $inputElement = $(event.currentTarget);
        var max = parseInt($inputElement.attr('maxlength'));
        var charactersLeftVar = $inputElement.data('characters-left-var');
        template[charactersLeftVar].set(max - $inputElement.val().length);
    },
    'change [data-imageupload]': function(event, template) {
        $('[data-imageupload]').replaceWith($('[data-imageupload]').clone(true));
        FS.Utility.eachFile(event, function(file) {
            template.loading.set('image-uploading', true);
            Partup.client.uploader.uploadImage(file, function(error, image) {
                if (error) {
                    Partup.client.notify.error(__('partupsettings-image-error'));
                    template.loading.set('image-uploading', false);
                    return;
                }
                template.loading.set('image-uploading', false);
                template.imageSystem.currentImageId.set(image._id);
                template.imageSystem.uploaded.set(true);
                var focuspoint = template.imageSystem.focuspoint.get();
                if (focuspoint) focuspoint.reset();
            });
        });
    },
    'change [name=type]': function(event, template) {
        template.budgetTypeChanged.set(true);
    },
    'click [data-imageremove]': function(event, template) {
        var tags_input = $(event.currentTarget.form).find('[data-schema-key=tags_input]').val();
        var tags = Partup.client.strings.tagsStringToArray(tags_input);
        template.imageSystem.unsetUploadedPicture(tags);
    },
    'change .autoform-tags-field [data-schema-key]': function(event, template) {
        var tags = Partup.client.strings.tagsStringToArray($(event.currentTarget).val());
        template.imageSystem.getSuggestions(tags);
    },
    'click [data-removedate]': function(event, template) {
        event.preventDefault();
        template.end_date_datepicker.datepicker('update', '');
    },
    'change [data-privacy-type]': function(event, template) {
        var input = template.find('[data-privacy-type] :checked');
        template.selectedPrivacyType.set(input.value);
        template.showNetworkDropdown.set(input.value === 'network');
        setTimeout(function() {
            template.$('[name=privacy_type_input]').trigger('blur');
        });
    },
    'change [data-privacy-network]': function(event, template) {
        template.selectedPrivacyNetwork.set(event.currentTarget.value);
        setTimeout(function() {
            template.$('[name=network_id]').trigger('blur');
        });
    },
    'click .pu-tooltip': function(event) {
        event.preventDefault();
    },
    'click [data-focus-tagsinput]': function(event, template) {
        var target = event.currentTarget;

        var $parentElement = $(target.parentElement);
        if (!$parentElement) return;

        var input = $parentElement.find('.bootstrap-tagsinput input').get(0);
        if (!input) return;

        event.preventDefault();
        input.focus();
    },
    'keydown [data-tags-input] .bootstrap-tagsinput input, input [data-tags-input] .bootstrap-tagsinput input': function(event, template) {
        template.tagsInputStates.set('input', !!event.currentTarget.value.trim());
    },
    'change [data-phase]': function(event, template) {
        var input = template.find('[data-phase] :checked');
        template.selectedPhase.set(input.value);
        setTimeout(function() {
            template.$('[name=phase]').trigger('blur');
        });
    }
});

/*************************************************************/
/* Image system for Part-up cover picture */
/*************************************************************/
var ImageSystem = function(template) {
    var self = this;

    this.currentImageId = new ReactiveVar(false);
    this.uploaded = new ReactiveVar(false);
    this.availableSuggestions = new ReactiveVar([]);
    this.focuspoint = new ReactiveDict();
    this.focuspoint.set('x', 0.5); // set default focuspoint position
    this.focuspoint.set('y', 0.5);

    this.getSuggestions = function(tags) {
        if (!tags || !tags.length) {
            this.availableSuggestions.set([]);
            return;
        }

        var newSuggestionsArray = [];

        var addSuggestions = function(suggestions) {
            if (!suggestions) return;
            newSuggestionsArray = newSuggestionsArray.concat(lodash.map(suggestions, 'imageUrl'));
        };

        var setAvailableSuggestions = function() {
            template.loading.set('suggesting-images', false);

            if (!newSuggestionsArray.length) {
                Partup.client.notify.warning('Could not find any images suggestions.');
                return;
            }

            self.availableSuggestions.set(newSuggestionsArray.slice(0, 5));
            Session.set('partials.create-partup.current-suggestion', 0);
        };

        template.loading.set('suggesting-images', true);
        Meteor.call('partups.services.splashbase.search', tags, function(error, result) {
            if (!error) addSuggestions(result);

            if (newSuggestionsArray.length >= 5) {
                setAvailableSuggestions();
            } else {
                Meteor.call('partups.services.flickr.search', tags, function(error, result) {
                    if (!error) addSuggestions(result);
                    setAvailableSuggestions();
                });
            }
        });
    };

    this.unsetUploadedPicture = function(tags) {
        self.getSuggestions(tags);
        self.currentImageId.set(false);
        self.uploaded.set(false);
    };

    this.storeFocuspoint = function(x, y) {
        if (typeof x === 'undefined') x = 0.5;
        if (typeof y === 'undefined') y = 0.5;
        self.focuspoint.set('x', x);
        self.focuspoint.set('y', y);
    };
    var currentIndex;
    // Set suggestion
    var setSuggestionByIndex = function(index) {
        var suggestions = self.availableSuggestions.get();
        if (!mout.lang.isArray(suggestions)) return;

        var url = suggestions[index];
        currentIndex = index;
        if (!mout.lang.isString(url)) return;

        template.loading.set('setting-suggestion', true);
        Partup.client.uploader.uploadImageByUrl(url, function(error, image) {
            template.loading.set('setting-suggestion', false);

            if (error) {
                Partup.client.notify.error('Some error occured');
                return;
            }
            if (index === currentIndex) self.currentImageId.set(image._id);
        });
    };

    template.autorun(function() {
        var suggestionIndex = Session.get('partials.create-partup.current-suggestion');

        if (mout.lang.isNumber(suggestionIndex) &&
                !mout.lang.isNaN(suggestionIndex) &&
                !self.uploaded.get()) {
            self.currentImageId.set(false);
            self.uploaded.set(false);
            setSuggestionByIndex(suggestionIndex);

            var focuspoint = self.focuspoint.get();
            if (focuspoint) focuspoint.reset();
        }
    });
};
