$(function(){
	$('#evoCarousel').carousel()
	$("body").on('click', "#product_thumbs img", function(){
		var pic = $(this).attr('data-pic');
		$("#product_thumbs_large").attr('src', pic);
	});
	
	$("body").on('click', '#all-more', function(){
		var location = window.location.href.substr(window.location.href.length-1, 1) == "/"  ? window.location.href.substr(0,window.location.href.length-1) : window.location.href;
		var url = location + '/all';
		var last = $("#all-products > div:last");
		var since;
		if(last.length > 0){
			since = last.attr('data-id');
			url += '/since/' + since;
		}
		$.getJSON(url, function(res){
			if(res.length < 100){
				$('#all-more').hide();
			}
			var html = '';
			res.forEach(function(item){
				var data = [
				'<div class="span3" data-id="'+item._id+'">'+
				'<img src="/files/medium_'+item.gallery[0]+'">'+
				'<a href="'+location + '/' + item.name.replace(/ /g, '-').toLowerCase()+'"><h4>'+item.name+'</h4></a>'+
				'<h5>'+item.price+'</h5></div>'
				]
				html += data.join('');
			});
			$("#all-products").append(html);
		});
	});
	$('#all-more').trigger('click');
});
