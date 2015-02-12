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
}]).factory('History', [function() {
    return {
        getList: function() {
            var histories = localStorage.getItem("histories");
            if (histories === null) {
                histories = [];
            } else {
                histories = JSON.parse(histories);
            }

            return histories;
        },
        setList: function(histories) {
            localStorage.setItem("histories", JSON.stringify(histories));
        },
        getListForName: function(name) {
            return _.filter(this.getList(), function(h) {return h.name === name; });
        }

    }
}]).controller("Controller", ['Resource', 'History', '$moment', function(Resource, History, $moment) {
    $moment.locale(["ja"]);

    Resource.list().then(_.bind(function(json) {
        this.items = _.map(json.items, function(item) {
            item.counts = _.size(History.getListForName(item.name));
            item.points = _.reduce(History.getListForName(item.name), function(memo, h) { return memo + h.point; }, 0);
            item.point = json.type[item.type].point;
            item.bonus = json.type[Math.min(parseInt(item.type) + 1, 6)].point;
            return item;
        });
        this.type = json.type;

        this.counts = _.reduce(this.items, function(memo, item) {return memo + item.counts}, 0);
        this.points = _.reduce(this.items, function(memo, item) {return memo + item.points}, 0);
    }, this), function(error) {
        console.log(error);
    });

    this.histories = _.map(_.first(History.getList(), 11), function(history) {
        history.createdAt = $moment(history.created_at).format('LLL');
        return history;
    });

    this.doRecord = function(name, point) {
        var histories = History.getList();
        var history = {name: name, point: point, created_at: Date.now()};
        histories.unshift(history);
        History.setList(histories);
        history.createdAt = $moment(history.created_at).format('LLL');
        this.histories.unshift(history);
    };

    this.doUpdate = _.bind(function(item, point) {
        item.counts += 1;
        this.counts += 1;
        item.points += point;
        this.points += point;
    }, this);

}]);
