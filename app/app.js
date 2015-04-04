'use strict';

angular.module('myApp', [
    'ngResource',
    'ngMoment',
    'ngAnimate',
    'ngMaterial'
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
        getList: function(target) {
            var histories = localStorage.getItem(target);
            if (histories === null) {
                histories = [];
            } else {
                histories = JSON.parse(histories);
            }

            return histories;
        },
        setList: function(target, histories) {
            localStorage.setItem(target, JSON.stringify(histories));
        }
    }
}]).controller("Controller", ['Resource', 'History', '$moment', function(Resource, History, $moment) {
    $moment.locale(["ja"]);

    Resource.list().then(_.bind(function(json) {
        var histories =  History.getList("histories");
        this.items = _.map(json.items, function(item) {
            var listForName = function(list, name) {
                return _.filter(list, function(h) {return h.name === name; });
            }(histories, item.name);

            item.counts = _.size(listForName);
            item.points = _.reduce(listForName, function(memo, h) { return memo + h.point; }, 0);
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

    this.histories = _.map(_.first(History.getList('histories'), 11), function(history) {
        history.createdAt = $moment(history.created_at).format('LLL');
        return history;
    });

    this.doRecord = function(name, point) {
        var histories = History.getList('histories');
        var history = {name: name, point: point, created_at: Date.now()};
        histories.unshift(history);
        History.setList("histories", histories);
        history.createdAt = $moment(history.created_at).format('LLL');
        this.histories.unshift(history);
    };

    this.deleteRecord = _.bind(function(history) {
        var histories = History.getList('histories');
        for(var i = 0; i < histories.length; ++i) {
            var h = histories[i];
            if (h.name === history.name && h.point == history.point && h.created_at == history.created_at) {
                histories.splice(i, 1);
                this.histories.splice(i, 1);
                History.setList('histories', histories);

                this.counts -= 1;
                this.points -= h.point;
                var item = _.find(this.items, function(item){ return item.name === h.name; });
                item.counts -= 1;
                item.points -= h.point;
                break;
            }
        }
    }, this);

    this.doUpdate = _.bind(function(item, point) {
        item.counts += 1;
        this.counts += 1;
        item.points += point;
        this.points += point;
    }, this);

    this.toggleRelicVersion = _.bind(function(id) {
        var tabs = ['novus', 'zeta'];
        tabs.forEach(function(tab) {
            var dom = document.getElementById('tab-'+tab);

            if (tab === id) {
                dom.setAttribute('class', 'active')
            } else {
                dom.setAttribute('class', '')
            }
        });


    }, this);
}]);
