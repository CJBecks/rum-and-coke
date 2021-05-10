var socket = io();

$(document).ready(function () {
  // Range slider
  $("#drinkStrength").on("input change", function (e) {
    let strengthValue = e.currentTarget.valueAsNumber;
    $("#rumDrinkIcon").attr("src", `assets/img/drink/${strengthValue}.png`);	
	// Update Strength Label
	$("#drinkStrengthLabel").html(calculateDrinkStrengthLabel(strengthValue));
  });

  $("#startPouring").on("click", function (e) {
	// Start pouring webhook event
	socket.emit("start-pour-drink", {
		drinkStrength: parseInt($("#drinkStrength").val(), 10),
	});

    // Change button
    $("#startPouring").addClass("d-none");
    $("#stopPouring").removeClass("d-none");

    // Disable Strength Range
    $("#drinkStrength").attr("disabled", true);
  });

  $("#stopPouring").on("click", function (e) {
	// Stop pouring webhook event
	
	socket.emit("stop-pour-drink");

    // Change button
    $("#stopPouring").addClass("d-none");
    $("#startPouring").removeClass("d-none");

    // Enable Strength Range
    $("#drinkStrength").attr("disabled", false);
  });
});

function calculateDrinkStrengthLabel(drinkStrength) {
	switch (drinkStrength) {
		case 1:
			return 'Virgin';
		case 2:
			return 'Weaker';
		case 3:
			return 'Weak';
		case 4:
			return 'Medium';
		case 5:
			return 'Strong';
		case 6:
			return 'Stronger';
		case 7:
			return 'Russian Bull';
		default:
			return 'Medium';
	}
}