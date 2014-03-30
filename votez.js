Places = new Meteor.Collection("places");
Meteor.methods({
    vote: function(placeId) {
        var place = Places.findOne(placeId);
        Places.update(placeId, {$set: {votes: place.votes + 1}});
    },
    reset: function() {
        Places.update({}, {$set: {votes: 0}}, {multi: true});
    }

});


if (Meteor.isClient) {
    Meteor.startup(function() {

    });


    Meteor.subscribe("places");

    Template.placesList.places = function () {
        return Places.find({}, {sort: {votes: -1, name: 1}});
    };

    Template.placesList.events({
        "click .vote": function() {
            Meteor.call("vote", this._id);
        }
    });

    Template.header.events({
        "click .reset": function() {
            Meteor.call("reset");
        }
    });

    Template.newPlace.events({
        "submit .newPlaceForm": function(event) {
            event.preventDefault();
            Places.insert({
                name: $("#name").val(),
                votes: 0
            }, function (err) {
                if (!err) {
                    $("input[type=text]").val('');
                }
            });
        }
    });
}

if (Meteor.isServer) {
  //Meteor.startup(function () {
    // code to run on server at startup
  //});
    Meteor.publish("places", function() {
        return Places.find();
    });
}
