!(function() {
"use strict";

angular.module("workouts",[])
  .controller("WorkoutCtrl", WorkoutCtrl)




function WorkoutCtrl(
  $scope
  , $filter
) {

  var number = $filter("number");

  var self = this;

  var REP_INCREASE_TO_WAIT_RATIO = 0.025;

  function init() {

    self.exercises = [
      {
        name: "Deadlift",
        weight: 70,
        reps: 5,
        percentIncrease: 2.5, 
        suggestedReps: 10,
        reps: 5,
        createdAt: new Date,
      },
      {
        name: "Deadlift",
        weight: 70,
        reps: 5,
        percentIncrease: 2.5, 
        suggestedReps: 10,
        reps: 5,
        createdAt: new Date,
      },
    ];
    
    self.exercise = {
      name: "Deadlift",
      weight: 70,
      reps: 5,
      percentIncrease: 2.5, 
      targetReps: 10,
      reps: 5,
    };

    self.performances = createPerformances();
  }

  init();

  this.create = function() {
    this.exercises.push({
      name: self.exercise.name,
      weight: self.overloadWeight(),
      reps: self.exercise.actualReps,
      targetReps: self.exercise.targetReps,
      overload: self.exercise.percentIncrease,
      createdAt: new Date,
    });
    self.performances = createPerformances();
  };

  this.overloadWeight = function() {
    var referenceOverload = self.exercise.weight * ( 1 + self.exercise.percentIncrease / 100 );
    var overloaded = referenceOverload * 
      (1 + REP_INCREASE_TO_WAIT_RATIO * (self.exercise.reps - self.exercise.reps));
    return overloaded;
  }

    
  function createPerformances() {
    var byDay = _.groupBy(self.exercises, _.compose(getDay, _.property("createdAt")));

    return _(byDay)
      .keys()
      .sort()
      .reverse()
      .map(function(day) {
        var grouped = _.groupBy(byDay[day], "name");

        return _.sortBy(grouped, function(group) {
          return _.max(_.pluck(group, "createdAt"));
        })
        .map(toPerformance);
      })
      .flatten()
      .value();
  }

  function toPerformance(group) {
    var sets = group.length; 
    var maxReps = _.max(_.pluck(group, "reps"));
    return {
      id: getDay(group[0].createdAt) + "-" + group[0].name,
      description: group[0].name + " " + sets + "x" + maxReps + " " + formatWeight(group[0].weight),
    }
  }

  function formatWeight(v) {
    return number(v) + "kg"; 
  }

  self.exerciseText = function(set) {
  }

  function sameDay(d1, d2) {
    return d1.getDay() === d2.getDay() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  }

  function getDay(d) {
    return d.getDay() + "-" + d.getMonth() + "-" + d.getFullYear();
  }

}

function Storage() {

  var keys = localStorage.appKeys = localStorage.appKeys || [];
  var loaded;
  var self = this;

  
  this.get = function() {
    if(!loaded) {
      loaded = {};
      keys.forEach(fromStorage);
    }
    return loaded;
  }

  this.save = function() {
    Object.keys(loaded).forEach(toStorage);
  }

  function fromStorage(k) {
    loaded[k] = JSON.parse(localStorage[k] || "{}");
  }

  function toStorage(k) {
    localStorage[k] = JSON.stringify(v);
  }
}


/*
Reference overload (r) x {0.025 (t) x (reference repetitions (f) - new
repetitions(n) ) + 1} = overload weight (w)


r * (1 + t * (f - n)) = W
     r + rtf - rtn = W
     r + rtf + W = rtn
     1 + tf + W/r = tn
     1/t + f + w/r*t = n

*/

})();
