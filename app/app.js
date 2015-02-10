'use strict';

angular.module('myApp', [
    'ngResource',
    'ngMoment',
    'ngAnimate'
]).factory('Resource', ['$resource', function($resource) {
    function resource() {
        return $resource('', null, {
            list: {
                method: 'GET',
                url: "data/contents.json"
            }
        })
    }
    return {
        list: function() {
            return resource().list().$promise;
        }
    };

}]).controller("Controller", ['Resource', '$moment', function(Resource, $moment) {
    $moment.locale(["ja"]);
    function getHistories() {
        var histories = localStorage.getItem("histories");
        if (histories === null) {
            histories = [];
        } else {
            histories = JSON.parse(histories);
        }
        histories = _.map(histories, function(history) {
            history.createdAt = $moment(history.created_at).format('LLL');
            return history;
        });

        return histories;
    }
    function setHistories(histories) {
        localStorage.setItem("histories", JSON.stringify(histories));
    }

    Resource.list().then(_.bind(function(json) {
        this.items = _.map(json.items, function(item) {
            var histories = getHistories();
            item.counts = _.size(_.filter(histories, function(h) {return h.name === item.name; }));
            item.points = _.reduce(_.filter(histories, function(h) {return h.name === item.name; }),
                function(memo, h) { return memo + h.point; }, 0);
            return item;
        });
    }, this), function(error) {
        console.log(error);
    });

    this.histories = _.first(getHistories(), 11);

    this.doRecord = function(name, point) {
        var histories = getHistories();
        var history = {name: name, point: point, created_at: Date.now()};
        histories.unshift(history);
        setHistories(histories);
        history.createdAt = $moment(history.created_at).format('LLL');
        this.histories.unshift(history);
    }
}]);
