var model_checkboxes = document.getElementsByClassName('model-selection');

var all_checkbox = document.getElementById('all-models-selection');
var delete_button = document.getElementById('delete-models');
var selected_models = new Set([]);


function activateDeletion() {
	delete_button.classList.remove("disabled");
}

function deactivateDeletion() {
	delete_button.classList.add("disabled");
}

function selectAll() {
	if (all_checkbox.checked) {
      	for (var i = 0; i < model_checkboxes.length; i++) {
      		model_checkboxes[i].checked = true;
     		if (selected_models.has(model_checkboxes[i].id) == false) {
     			selected_models.add(model_checkboxes[i].id);
     		}
      	}
      	activateDeletion();
  	} else {
      for (var i = 0; i < model_checkboxes.length; i++) {
      	model_checkboxes[i].checked = false;
      }
      selected_models = new Set([]);
      deactivateDeletion();
  	}
}

function modelSelection(box) {
	if (box.target.checked) {
		selected_models.add(box.target.id);
		activateDeletion();
	} else {
		if (selected_models.has(box.target.id)) {
			selected_models.delete(box.target.id);
		}
		// check if all the checkboxes are now unchecked
		all_unchecked = true;
		for (var i = 0; i < model_checkboxes.length; i++) {
			if (model_checkboxes[i].checked) {
				all_unchecked = false;
				break;
			}
		}
		if (all_unchecked) {
			deactivateDeletion();
		}
		all_checkbox.checked = false;
	}

}

all_checkbox.addEventListener('click', selectAll, false);
for (var i = 0; i < model_checkboxes.length; i++) {
    model_checkboxes[i].addEventListener('click', modelSelection, false);
}

$("#delete-models").on(
	"click",
	function() {
		$.ajax({
		  type: "POST",
		  url: '/delete_hierarchies',
		  data: JSON.stringify(Array.from(selected_models)),
		  contentType: "application/json; charset=utf-8",
		  dataType: "json",
		  error: function() {
		    alert("Error");
		  },
		  success: function() {
		  	selected_models.forEach(function(value) {
		  		var li = document.getElementById(value);
			   	li.remove();
		  	});
		  	selected_models = new Set([]);
		  	if (document.getElementsByClassName("model").length == 0) {
		  		all_checkbox.remove();
		  		$("ul").remove();
		  		document.getElementById("empty_ul").classList.remove("hidden");
		  	}
		  }
		});
});
