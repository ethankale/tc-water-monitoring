// Javascript for closing & opening the help text
//   Must load *after* map.js

// Do on load
var el_questionmark = document.getElementById("legend_question");
var el_inst = document.getElementById("instructions");
var helpstatus = window.localStorage.getItem("tcwdb_helpstatus");

if (helpstatus == "off") {
    el_inst.classList.add("is-hidden");
} else {
    el_inst.classList.remove("is-hidden");
}

el_questionmark.addEventListener("click", function() {
    if (helpstatus == "off") {
        toggleHelpText("show");
    } else {
        toggleHelpText("hide");
    }
});

document.getElementById("close_instructions").addEventListener("click", function(e) {
    toggleHelpText("hide");
});

// Functions

function toggleHelpText(action) {
    if (action == "hide") {
        el_inst.classList.add("is-hidden");
        window.localStorage.setItem("tcwdb_helpstatus", "off");
        helpstatus = "off";
    } else {
        el_inst.classList.remove("is-hidden");
        window.localStorage.setItem("tcwdb_helpstatus", "on");
        helpstatus = "on";
    }
    //console.log(action);
}