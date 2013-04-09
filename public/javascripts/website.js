$(function(){
	$('#evoCarousel').carousel()
	$("body").on('click', "#product_thumbs img", function(){
		var pic = $(this).attr('data-pic');
		$("#product_thumbs_large").attr('src', pic);
	});
});
