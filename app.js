!(function() {
"use strict";

angular.module("workouts",[])
  .controller("WorkoutCtrl", WorkoutCtrl)
  .filter("nearestQuarter", _.constant(nearestQuarter))
  .filter("percentChange", percentChange)
  .directive("nearestQuarter", nearestQuarterDirective)




function WorkoutCtrl(
  $scope
  , $filter
) {

  var number = $filter("number");
  var percentChange = $filter("percentChange");
  var date = $filter("date");

  var self = this;

  var REP_INCREASE_TO_WAIT_RATIO = 0.025;

  var storage = new Storage;
  var autoSave = _.debounce(save, 500, { trailing: true });

  function init() {

    self.exercises = storage.get();
    
    self.exercise = {
      name: "Deadlift",
      weight: 70,
      reps: 5,
    };

    self.performances = createPerformances();


    window.addEventListener("beforeunload", save);
  }

  init();

  this.performanceSelected = function(performance) {
    self.previousExercise = performance;
    _.extend(self.exercise, _.pick(performance, "name", "reps", "weight"));
  };

  this.create = function() {
    this.exercises.push({
      id: Date.now() + "-" + self.exercise.name,
      name: self.exercise.name,
      weight: self.exercise.weight,
      reps: self.exercise.reps,
      overload: self.overload(),
      createdAt: new Date,
    });
    self.performances = createPerformances();
    autoSave();
  };

  this.remove = function(ex) {
    self.exercises = _.without(self.exercises, ex);
    self.performances = createPerformances();
  }

  this.overload = function() {
    if(!self.previousExercise) {
      return;
    }

    var ratioDueToWeight = self.exercise.weight / self.previousExercise.weight;
    var ratioDueToReps = 1 + REP_INCREASE_TO_WAIT_RATIO * (self.exercise.reps - self.previousExercise.reps);

    return ratioDueToReps * ratioDueToWeight;
  }

  self.exerciseText = function(set) {
  }

  return;


  function save() {
    storage.save(self.exercises);
  }
    
  function createPerformances() {
    var spacers = {};
    return _(self.exercises)
      .sortBy("createdAt")
      .reverse()
      .map(function(ex) {
        var vals = [];
        var day = getDay(ex.createdAt);
        if(!spacers[day]) {
          spacers[day] = true;
          vals.push({
            date: day,
            id: day + "-spacer",
            description: date(day, "shortDate"),
          });
        }
        vals.push(toPerformance(ex));
        return vals;
      })
      .flatten()
      .value();
  }

  function toPerformance(ex) {
    return {
      id: ex.id,
      description: ex.name + " " + ex.reps + "x" + formatWeight(ex.weight) + overload(),
      name: ex.name,
      reps: ex.reps,
      exercise: ex,
      weight: ex.weight,
    }

    function overload() {
      return ex.overload && ex.overload !== 1 ? " (" + percentChange(ex.overload) + ")" : "";
    }
  }

  function formatWeight(v) {
    return number(nearestQuarter(v)) + "kg"; 
  }

  function sameDay(d1, d2) {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  }

  function getDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  }

}

function nearestQuarterDirective() {
  return {
    require: "ngModel",
    link: function(scope, el, attrs, ngModel) {
      ngModel.$formatters.push(nearestQuarter);
    }
  }
}

function nearestQuarter(x) {
  return Math.round(x * 4) / 4;
}

function Storage() {

  var loaded;
  var self = this;
  
  this.get = function() {
    if(!loaded) {
      loaded = fromStorage();
    }
    return loaded;
  }

  this.save = function(items) {
    localStorage.performances = JSON.stringify(items);
  }

  function fromStorage(k) {
    return JSON.parse(localStorage.performances || "[]", reviver);
  }

  function reviver(k,v) {
    if(k === "createdAt") {
      return new Date(Date.parse(v));
    } else {
      return v;
    }
  }


}

function percentChange(
    $filter
) {
  var number = $filter("number");
  return function(x) {
    if(x === 1) {
      return "";
    }
    return number((x - 1) * 100, 1) + "%";
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

