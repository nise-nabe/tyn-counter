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
        },
        initList: function(target, json, callback) {
            var histories =  this.getList(target);
            var items = _.map(json.items, function(item) {
                var listForName = function(list, name) {
                    return _.filter(list, function(h) {return h.name === name; });
                }(histories, item.name);

                item.counts = _.size(listForName);
                item.points = _.reduce(listForName, function(memo, h) { return memo + h.point; }, 0);
                item.point = json.type[item.type].point;
                item.bonus = json.type[Math.min(parseInt(item.type) + 1, 6)].point;
                return item;
            });
            var counts = _.reduce(items, function(memo, item) {return memo + item.counts}, 0);
            var points = _.reduce(items, function(memo, item) {return memo + item.points}, 0);

            callback(items, json.type, counts, points);
        }
    }
}]).controller("Controller", ['Resource', 'History', '$moment', function(Resource, History, $moment) {
    $moment.locale(["ja"]);

    var init = _.bind(function(target, json) {
        History.initList(target, json, _.bind(function(items, type, counts, points) {
            this.items = items;
            this.type = type;
            this.counts = counts;
            this.points = points;
        }, this));

        this.histories = _.map(_.first(History.getList(target), 11), function(history) {
            history.createdAt = $moment(history.created_at).format('LLL');
            return history;
        });

        this.doRecord = function(name, point) {
            var histories = History.getList(target);
            var history = {name: name, point: point, created_at: Date.now()};
            histories.unshift(history);
            History.setList(target, histories);
            history.createdAt = $moment(history.created_at).format('LLL');
            this.histories.unshift(history);
        };

        this.deleteRecord = _.bind(function(history) {
            var histories = History.getList(target);
            for(var i = 0; i < histories.length; ++i) {
                var h = histories[i];
                if (h.name === history.name && h.point == history.point && h.created_at == history.created_at) {
                    histories.splice(i, 1);
                    this.histories.splice(i, 1);
                    History.setList(target, histories);

                    this.counts -= 1;
                    this.points -= h.point;
                    var item = _.find(this.items, function(item){ return item.name === h.name; });
                    item.counts -= 1;
                    item.points -= h.point;
                    break;
                }
            }
        }, this);


    }, this);

    Resource.list().then(_.bind(function(json) {
        init('histories', json);

        this.toggleRelicVersion = _.bind(function(id) {
            var tabs = {'novus': 'histories', 'zeta': 'histories2'};
            _.each(tabs, function(target, tab) {
                var dom = document.getElementById('tab-'+tab);

                if (tab === id) {
                    dom.setAttribute('class', 'active');
                    init(target, json);
                } else {
                    dom.setAttribute('class', '')
                }
            });
        }, this);
    }, this), function(error) {
        console.log(error);
    });

    this.doUpdate = _.bind(function(item, point) {
        item.counts += 1;
        this.counts += 1;
        item.points += point;
        this.points += point;
    }, this);

}]);
