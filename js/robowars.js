/** SETUP ON PAGE LOAD **/

var loaded_page = '';
var default_page = 'frontpage';
var state_is_new_page_load = false;

$(document).ready(function() {
    // Load the initial page
    load_current_hash();
    
    // Set up the page-change listener
    $(window).on('hashchange', function() {
        load_current_hash();
    });
	
    setup_page_events();
});

function setup_page_events($element) {
    if(typeof element === 'undefined') {
        $element = $(document);
    }
    
    // Dynamic-load links
    var $dynlinks = $element.find("a[data-page]");
    $dynlinks.on("click", function(e) {
        state_is_new_page_load = true;
        set_current_hash($(this).attr("data-page"));
        e.preventDefault();
    });
    $dynlinks.each(function() {
        var loc = window.location;
        hash = get_page_hash($(this).attr('data-page'));
        $(this).attr('href', get_current_baseurl() + "/" + hash);
    });
    
    // Mailing list "subscribe" button
    $newslinks = $element.find("*[data-popup='mailing-list']");
    $newslinks.on('click', function(e) {
        showMailingPopUp();
        e.preventDefault();
    });
    $newslinks.each(function() {
        $(this).attr('href', get_current_baseurl() + "/newsletter");
    });
    
    // External links open in new window
    var current_hostname = window.location.host;
    $element.find('a').each(function() {
        if(this.host !== window.location.host) {
            $(this).attr('target', '_blank');
        }
    });
}

function get_current_baseurl() {
    var loc = window.location;
    var baseurl = loc.protocol + '//' + loc.hostname;
    if(loc.port != '') baseurl += ':' + loc.port;
    return baseurl;
}

/** HASH UTILITY FUNCTIONS **/

function get_current_hash() {
    hash = window.location.hash;
    if(hash.startsWith('#/')) {
        return hash.slice(2).replace('"', '').replace(/\.{2,}/, '');
    }
    else {
        return '';
    }
}

function is_current_hash_loadable() {
    hash = window.location.hash;
    return hash.startsWith('#/');
}

function set_current_hash(page) {
    window.location.hash = get_page_hash(page);
}

function get_page_hash(page) {
    return '#/' + page.replace('"', '').replace(/\.{2,}/, '');
}

/** DYNAMIC PAGE LOADING **/

function load_current_hash() {
	var link_data = get_current_hash();
    var $anchorTarget;
    
    try {
        $anchorTarget = $(window.location.hash);
    }
    catch(e) {
        $anchorTarget = $();
    }
    
    // FIXME: loading page with anchor does not stay at target (page loads in afterwards)
    // FIXME: if URL copied/shared, does not preserve current page
    if(!is_current_hash_loadable() && $anchorTarget.length > 0) {
        // animating to anchors (non-loadable hash)
        $('body, html').animate({scrollTop: $anchorTarget.offset().top}, 500);
        
        // make sure a page is loaded
        if(!loaded_page) load_content('frontpage');
    }
	else if(typeof link_data === 'undefined' || link_data == '') {
        // no loadable hash
		load_content('frontpage')
	}
	else {
        // loadable hash
		load_content(link_data);
	}
}

/**
    Note: uses and resets state_is_new_page_load variable to decide whether to scroll up
    (I know, this is messy)
*/
function load_content(page) {
    if(loaded_page == page || page == '') {
        return false;
    }
    var $container = $("#dynamic-content");
	$container.load(page+".html", function(response, status, xhr) {
		if(status != "error") {
            setup_page_events($container);
            if(state_is_new_page_load) $('body, html').animate({ scrollTop: 0 }, 500);
            state_is_new_page_load = false;
        }
        else {
			$container.html("<div><h1>Error</h1><p>An error occurred: " + xhr.status + " " + xhr.statusText + "</p></div>");
		}
	});
	$("#navbar .active").removeClass("active");
    $("#navbar > ul > li > a[data-page='" + page + "']").parent().addClass("active");
	set_current_hash(page);
    loaded_page = page;
    return true;
}

/** MAILCHIMP **/

function showMailingPopUp() {
    require(["mojo/signup-forms/Loader"], function(L) { L.start({"baseUrl":"mc.us5.list-manage.com","uuid":"df8402f550286116b4e36e258","lid":"afe181aab9"}) });
    document.cookie = "MCEvilPopupClosed=; expires=Thu, 01 Jan 1970 00:00:00 UTC"; // Suppress cookie set by MailChimp code - this allows popup to redisplay later
};
