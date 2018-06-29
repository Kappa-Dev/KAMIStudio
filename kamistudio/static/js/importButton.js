$main = $(".tabs");

$("#import_button").on(
	"click",
	function() {
		$main.addClass("loading"); 
		$(this).attr('disabled','disabled');
		document.importForm.submit();
});

