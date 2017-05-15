import {strings} from 'meteor/partup-client-base';

/*************************************************************/
/* Widget initial */
/*************************************************************/
Template.ActivityView.onCreated(function() {
    var template = this;

    template.activityDropdownOpen = new ReactiveVar(false);

    template.expanded = new ReactiveVar(!!template.data.EXPANDED || !!template.data.CREATE_PARTUP);

    template.updateContribution = function(contribution, cb) {
        var activityId = template.data.activity ? template.data.activity._id : template.data.activity_id;
        Meteor.call('contributions.update', activityId, contribution, cb);
    };
});

/*************************************************************/
/* Widget helpers */
/*************************************************************/
Template.ActivityView.helpers({
    activityDropdownOpen: function() {
        return Template.instance().activityDropdownOpen;
    },
    renderWithMarkdown: function(text) {
        return strings.renderToMarkdownWithEmoji(text, 'pu-sub-description');
    },
    partup: function() {
        if (!this.activity) return;
        return Partups.findOne(this.activity.partup_id);
    },
    contributions: function() {
        if (!this.activity || this.contribution_id) return;

        return Contributions.findForActivity(this.activity, {
            archived: false
        }).fetch();
    },
    contribution: function() {
        if (!this.contribution_id) return;

        return Contributions.findOne(this.contribution_id);
    },
    expanded: function() {
        return Template.instance().expanded.get();
    },
    showChevron: function() {
        return this.EXPANDABLE && !Template.instance().expanded.get() && !this.contribution_id;
    },
    showEditButton: function() {
        return !this.READONLY && this.isUpper //&& Template.instance().expanded.get();
    },
    showMetaData: function() {
        return (this.activity && this.activity.end_date) || this.COMMENTS_LINK;
    },
    showInviteButton: function() {
        if (this.contribution_id) return false;
        if (this.READONLY) return false;

        var user = Meteor.user();
        if (!user) return false;

        return true;
    },
    showContributeButton: function() {
        if (this.contribution_id) return false;
        if (this.READONLY) return false;

        var user = Meteor.user();
        if (!user) return false;

        var contributions = Contributions.findForActivity(this.activity).fetch();
        for (var i = 0; i < contributions.length; i++) {
            if (contributions[i].upper_id === user._id && !contributions[i].archived) return false;
        }

        return true;
    },
    updateContribution: function() {
        return Template.instance().updateContribution;
    },
    upper: function(event, template) {
        return Meteor.users.findOne({_id: this.upper_id});
    },
    isReadOnly: function() {
        return Template.instance().data.READONLY;
    },
    update: function() {
        return Updates.findOne({_id: this.updateId || get(Template.instance(), 'data.activity.update_id')});
    },
    popupId: function() {
        return 'popup.motivation.' + (this.updateId || get(Template.instance(), 'data.activity.update_id'));
    },
    newComments: function(upper_data) {
        upper_data = upper_data.hash.upper_data;
        if (!upper_data) return;

        var newComments = [];
        upper_data.forEach(function(upperData) {
            if (upperData._id === Meteor.userId()) {
                newComments = upperData.new_comments;
            }
        });
        return newComments.length;
    },
    lane: function() {
        var activity = this.activity;
        var partup = Partups.findOne(this.activity.partup_id);

        if (!partup.board_view) return false;

        return Lanes.findOne({_id: activity.lane_id});
    },
    updateDetail: function() {
        return Router.current().route.getName() === 'partup-update';
    }
});

/*************************************************************/
/* Widget events */
/*************************************************************/
Template.ActivityView.events({
    'click [data-activity-dropdown]': function(event, template) {
        event.preventDefault();
        template.activityDropdownOpen.set(true);
    },
    'click [data-activity-edit]': function(event, template) {
        template.data.edit.set(true);
    },
    'click [data-activity-expander]': function(event, template) {
        var partup = Partups.findOne({_id: template.data.activity.partup_id});
        if (template.data.BOARDVIEW) {
            Router.go('partup-update', {
                slug: partup.slug,
                update_id: template.data.updateId || template.data.activity.update_id
            });
        }

        if (!template.data.EXPANDABLE) return;

        var opened = template.expanded.get();
        template.expanded.set(!opened);
    },
    'click [data-contribute]': function(event, template) {
        event.preventDefault();

        var contribute = function() {
            var partup = Partups.findOne({_id: template.data.activity.partup_id});

            if (!partup) {
                Partup.client.notify.error('Couldn\'t proceed your contribution. Please try again!');
                return;
            }

            // If the user is not a partner, ask for motivation
            if (!partup.hasUpper(Meteor.userId())) {
                var popupId = 'popup.motivation.' + (template.data.updateId || template.data.activity.update_id);
                Partup.client.popup.open({
                    id: popupId
                }, function(result) {
                    if (result && result.success) {
                        template.updateContribution({
                            motivation: result.comment
                        }, function(error) {
                            if (error) {
                                console.error(error);
                                return;
                            }

                            analytics.track('new contribution', {
                                partupId: partup._id,
                                userId: Meteor.userId(),
                                userType: 'supporter'
                            });
                        });
                    }
                });

                return;
            }

            template.updateContribution({}, function(error) {
                if (error) {
                    console.error(error);
                    return;
                }

                analytics.track('new contribution', {
                    partupId: partup._id,
                    userId: Meteor.userId(),
                    userType: 'upper'
                });

            });
        };

        if (Meteor.user()) {
            contribute();
        } else {
            Intent.go({route: 'login'}, function() {
                contribute();
            });
        }

        template.activityDropdownOpen.set(false);
    },
    'click [data-invite]': function(event, template) {
        event.preventDefault();
        var partup = Partups.findOne({_id: template.data.activity.partup_id});
        Intent.go({
            route: 'partup-activity-invite',
            params: {
                slug: partup.slug,
                activity_id: template.data.activity._id
            }
        });
    },
    'click [data-activity-archive]': (event, template) => {

        Partup.client.prompt.confirm({
            onConfirm: function() {
                Meteor.call('activities.archive', template.data.activity._id, function(error) {
                    if (error) {
                        Partup.client.notify.error(error.reason)
                    }
                })
            }
        })
    }
});

Template.activityActionsDropdown.helpers({
    showInviteButton: function() {
        if (this.contribution_id) return false;
        if (this.READONLY) return false;

        var user = Meteor.user();
        if (!user) return false;

        return true;
    },
    showContributeButton: function() {
        if (this.contribution_id) return false;
        if (this.READONLY) return false;

        var user = Meteor.user();
        if (!user) return false;

        var contributions = Contributions.findForActivity(this.activity).fetch();
        for (var i = 0; i < contributions.length; i++) {
            if (contributions[i].upper_id === user._id && !contributions[i].archived) return false;
        }

        return true;
    },
    showEditButton: function() {
        return !this.READONLY && this.isUpper;
    }
})
