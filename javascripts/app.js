$(document).foundation();

var COLUMN_VALUE = 4;
var COLUMN_TOTAL = 12;

/* leadingZero: put zeroes in front of decimal values that are less than ten */
function leadingZero(value) {
    if (value < 10) return "0" + value.toString();
    return value.toString();
}

/* setTimerDisplay: take a value in seconds, and convert it to minutes/seconds, 
 * or finish the timer if we've reached zero.
 */
function setTimerDisplay(timer, seconds) {
    var text;
    if (seconds > 0) {
        var minutes = Math.floor(seconds / 60); 
        text = leadingZero(Math.floor(seconds / 60)) + ":" 
            + leadingZero(seconds % 60);
        timer.find("h2").text(text);
    }
    else { // if we've exhausted our time
        timer.data('tf').sound.play();

        //set various styles and text
        text = "Done!"; 
        var panel = timer.find(".panel");
        panel.animate( { backgroundColor: "#31ff3f" }, 1000);
        var cancel_button = timer.find("a.cancel");
        cancel_button.text("Dismiss");
        cancel_button.addClass("large success expand");
        timer.find("h2").remove();
    }

    
}

/* addTimerToDOM: take a timer, and add it to the DOM creating new rows
 * wherever necessary.
 */
function addTimerToDOM(timer) {
    var timers = $("#timers");
    var last_row = timers.children(":last");

    var intro = $("#intro");
    if (intro.length) intro.remove();
    
    if (last_row.length) {
        if (last_row.children().length * COLUMN_VALUE >= COLUMN_TOTAL) {
            timers.append(
                    $("<div>", { 'class': "row" }).append(timer)
            );
        }
        else {
            last_row.append(timer);
        }
        
        return;
    }

    timers.append(
            $("<div>", { 'class': "row" }).append(timer)
    );
}

/* reorganizeTimers: traverse the DOM, and make sure that each row has two
 * timers in it, unless it's the last row.
 */
function reorganizeTimers() {
    var timers = $("#timers");

    timers.children().each(function () {
        if ($(this).children().length * COLUMN_VALUE < COLUMN_TOTAL) {
            var next_row = $(this).next();
            if (next_row.children().length > 0) {
                var next_element = next_row.children(":first");
                next_element.detach();
                $(this).append(next_element);
            }
            if (next_row.children().length < 1) {
                next_row.remove();
            }
        }
    });
}

$(document).ready(function() {
    $("#time").focus();

    //Load our alarm sound
    var alarmSound = new Audio();
    alarmSound.src = "assets/sounds/78562__joedeshon__alarm-clock-ringing-01.wav";
    alarmSound.load();

    $("#add-timer").submit(function(e) {
        e.preventDefault();
        var rawInput = $(this).find("input:text").val();

        try {
            var time = juration.parse(rawInput); 
        }
        catch (e) {
            alert("Didn't understand your input.");
            return;
        }

        var timer = $('<div>', { 'class': "timer large-" + COLUMN_VALUE + " columns" }).append( 
            $('<div>', { 'class': "panel" }).append(
                $('<h2>', { 'text': time })
            )
        );
        timer.data('tf', {
            method: function (self) {
                self.data('tf').ticks--;
                setTimerDisplay(self, self.data('tf').ticks);

                // if we haven't reached zero, re-set our interval
                // TODO make this calculate actual milliseconds for timeout
                if (self.data('tf').ticks > 0)
                    setTimeout(function() { 
                        self.data('tf').method(self); 
                    }, 1000)
            },
            ticks: time,
            canceled: false,
            cancel: function(self) {
                var parent_row = self.parent();
                self.data('tf').sound.pause();
                self.data('tf').canceled = true; 
                self.fadeOut(400, function() { 
                    self.remove(); 
                    if (parent_row.children().length < 1) parent_row.remove();
                    reorganizeTimers();
                });
            },
            snooze: function(self) {
            },
            sound: alarmSound.cloneNode(true)
        });

        // set initial display and start timer
        setTimerDisplay(timer, time);
        setTimeout(function() { 
            timer.data('tf').method(timer);
        }, 1000);

        timer.children("div").append(
            $("<a>", { 'text': "Cancel", 
                       'href': "#",
                       'class': "large cancel button expand" }).click(function(e) {
                e.preventDefault();
                timer.data('tf').cancel(timer);
            })
        );
        addTimerToDOM(timer);
    });
});

