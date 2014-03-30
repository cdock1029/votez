Places = new Meteor.Collection("places");
Meteor.methods({
    vote: function(placeId) {
        var place = Places.findOne(placeId);
        Places.update(placeId, {$set: {votes: place.votes + 1}});
    },
    reset: function() {
        Places.update({}, {$set: {votes: 0}}, {multi: true});
    },
    delete: function(placeId) {
        Places.remove(placeId, function(err) {

        });
    }
});

if (Meteor.isClient) {
    var map;
    var infowindow;
    var markersArray = [];
    function initialize() {
        //if (navigator.geolocation) {
        if (false) {
            navigator.geolocation.getCurrentPosition(geoSuccess, function(err) {
                console.log(typeof err == 'string' ? err : "error getting location");
            });
        } else {
            loc = new google.maps.LatLng(47.620017, -122.336353);
            executeNearbySearch(loc);
        }
    };

    function geoSuccess(position) {
        var loc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        executeNearbySearch(loc);
    };

    function executeNearbySearch(loc) {

        map = new google.maps.Map(document.getElementById('map-canvas'), {
            center: loc,
            zoom: 15
        });

        var request = {
            reference: 'AIzaSyDCCGbEJQK9QqYaLPp6dWVt_HsK9WgS3OE',
            location: loc,
            radius: 500,
            types: ['restaurant']
        };
        infowindow = new google.maps.InfoWindow();
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);
    };

    function callback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        }
    };

    function createMarker(place) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });
        markersArray.push(marker);
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(place.name);
            infowindow.open(map, this);
        });
    };

    Meteor.startup(function() {
        google.maps.Map.prototype.clearOverlays = function() {
            for (var i = 0; i < markersArray.length; i++) {
                markersArray[i].setMap(null);
            }
            markersArray = [];
        };
        google.maps.event.addDomListener(window, 'load', initialize);
    });


    Deps.autorun(function () {
        Meteor.subscribe("usersData");
        Meteor.subscribe("places");
    });

    Template.placesList.places = function () {
        return Places.find({}, {sort: {votes: -1, name: 1}});
    };

    Template.loggedInUsers.users = function() {
        return Meteor.users.find({"services.resume.loginTokens.hashedToken" : {"$exists": true}});
    };

    Template.userInfo.showPic = function() {
        var result = '';
        if (this.services.facebook) {
            result = this.profile.picture;
        } else if (this.services.google) {
            result = this.services.google.picture;
        }
        return result;
    }

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

    Template.map.events({
        "click .clear": function() {
            map.clearOverlays();
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
    Meteor.publish("usersData", function() {
        return Meteor.users.find({});
    });
    Accounts.onCreateUser(function(options, user) {
        if (options.profile) {
            if (user.services.facebook) {
                options.profile.picture = "http://graph.facebook.com/" + user.services.facebook.id + "/picture?type=large";
            }
            user.profile = options.profile;
        }
        return user;
    });
}
