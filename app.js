//app.js

(function() {

	var app = angular.module('rejectedCrosswords', []);
	
	app.controller('rejectedController', ['$sce', '$http',  function($sce, $http){
	
		
		//read in the info from the json file and initialize
		var rejected = this; //an alias that is used in some functions
		rejected.crosswords = [];
		$http.get('crossword-info.json').success( function(data){
			
			//store the data (rejected is this controller)
			rejected.crosswords = data;
			
			//make the urls acceptable
			rejected.crosswords.forEach( function(entry){
				entry.url = $sce.trustAsResourceUrl(entry.url);
			});
			
			//we have the data. We initialize various things now.
			//initialize
			var hash_num = location.hash.substring(1);
			rejected.selected = rejected.crosswords[hash_num - 1];
			manageButtons();
		});
		
		
		
		
		//change the selected crossword
		this.setCrossword = function(number){
			
			//make sure a change should occur
			if(number < 1 || number > rejected.crosswords.length) return;

			//here are the changes
			document.getElementById("will").style.display = "none";
			document.getElementById("la").style.display = "none";
			document.getElementById("wsj").style.display = "none";
			this.selected = this.crosswords[number - 1];
			location.hash = this.selected.num;
			//disable or enable buttons
			manageButtons();
			
		};
		
		function manageButtons(){
		
			if( rejected.selected.num == 1){
				$("#btn-prev").addClass("disabled");
			} else {
				$("#btn-prev").removeClass("disabled");
			}
			
			if( rejected.selected.num >= rejected.crosswords.length){
				$("#btn-next").addClass("disabled");
			} else {
				$("#btn-next").removeClass("disabled");
			}
			
		}
	
	}]);
	
	app.directive("crosswordButtons", function() {
	
		return {
			restrict: "E",
			templateUrl: "crossword-buttons.html", 
		};
	
	});
	
	app.directive("crosswordHeader", function() {
	
		return {
			restrict: "E",
			templateUrl: "crossword-header.html", 
		};
	
	});
	
	app.directive("crosswordFiles", function() {
	
		return {
			restrict: "E",
			templateUrl: "crossword-files.html"
		};
	
	});
	
	app.directive("crosswordWill", function() {
	
		return {
			restrict: "E",
			templateUrl: "crossword-will.html"	
		};
	
	});
	
	app.directive("crosswordLa", function() {
	
		return {
			restrict: "E",
			templateUrl: "crossword-la.html"	
		};
	
	});
	
	app.directive("crosswordWsj", function() {
	
		return {
			restrict: "E",
			templateUrl: "crossword-wsj.html"	
		};
	
	});
	
	app.directive("crosswordOnline", function() {
	
		return {
			restrict: "E",
			templateUrl: "crossword-online.html"
		};
	
	});
	
})();
