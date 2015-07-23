/*************************************************************/
/* main rendered */
/*************************************************************/
Template.main.onRendered(function() {
    try {
        var mainContainer = this.find('.pu-main');
        if (!mainContainer) throw 'Could not find ".pu-main" element to initialize Bender with.';

        Bender.initialize(mainContainer);
    } catch (e) {
        return e;
    }
});

Meteor.startup(function() {
    Partup.client.scroll.init();
});
