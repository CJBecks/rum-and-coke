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

    // Start Drink
    socket.on("start-drink", function (drinkStrength) {
        // Change slider, animated
        animateRangeChange(drinkStrength);

        // Change button
        $("#startPouring").addClass("d-none");
        $("#stopPouring").removeClass("d-none");

        // Disable Strength Range
        $("#drinkStrength").attr("disabled", true);
    });

    // Finis Drink
    socket.on("finished-drink", function (args) {
        // Change button
        $("#stopPouring").addClass("d-none");
        $("#startPouring").removeClass("d-none");

        // Enable Strength Range
        $("#drinkStrength").attr("disabled", false);
    });
});

function testAnimation() {
    var currentVal = parseFloat($("#drinkStrength").val(), 10);

    updateDrinkStrengthUiBasedOnStrength(currentVal + 0.1);

    setTimeout(function () {
        testAnimation();
    }, 5);
}

/**
 * Animate the range slider..
 * @param {*} setVal
 */
function animateRangeChange(setVal) {
    var currentVal = parseFloat($("#drinkStrength").val(), 10);
    $("#drinkStrength").prop("step", 0.1);

    $("#drinkStrengthLabel").html(calculateDrinkStrengthLabel(setVal));
    $("#rumDrinkIcon").attr("src", `assets/img/drink/${setVal}.png`);

    console.log(currentVal, setVal);

    if (currentVal === setVal) {
        $("#drinkStrength").prop("step", 1);
        return;
    }

    var differenceInCurrentVsSet;
    var timeoutDuration = 8;

    if (currentVal < setVal) {
        // Animate Upstream
        differenceInCurrentVsSet = Math.round(setVal - currentVal);
        updateDrinkStrengthUiBasedOnStrength(currentVal + 0.1);
    } else {
        // Animate Downstream
        differenceInCurrentVsSet = Math.round(currentVal - setVal);
        updateDrinkStrengthUiBasedOnStrength(currentVal - 0.1);
    }

    switch (differenceInCurrentVsSet) {
        case 0:
            timeoutDuration = 20;
        case 1:
            timeoutDuration = 15;
            break;
        case 2:
            timeoutDuration = 12;
            break;
        case 3:
            timeoutDuration = 10;
            break;
        case 4:
            timeoutDuration = 8;
            break;
        case 5:
            timeoutDuration = 6;
            break;
        case 6:
            timeoutDuration = 4;
            break;
        default:
            timeoutDuration = 4;
            break;
    }

    // Recursively call function until value is set
    setTimeout(function () {
        animateRangeChange(setVal);
    }, timeoutDuration);
}

function updateDrinkStrengthUiBasedOnStrength(drinkStrength) {
    $("#drinkStrength").val(drinkStrength);
}

/**
 * Calculate the drink strength label for the UI to display
 * @param {*} drinkStrength
 * @returns
 */
function calculateDrinkStrengthLabel(drinkStrength) {
    switch (drinkStrength) {
        case 1:
            return "Only Coke";
        case 2:
            return "Weaker";
        case 3:
            return "Weak";
        case 4:
            return "Medium";
        case 5:
            return "Strong";
        case 6:
            return "Stronger";
        case 7:
            return "One Shot of Rum";
        default:
            return "Medium";
    }
}
