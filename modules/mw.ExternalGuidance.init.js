( function () {

	var context;
	/**
	 * Detect the external service context in which the page is being presented
	 * @return {Object} The context object with context name and extra information in 'info' key
	 */
	function detectContext() {
		var parentURL, translatedByMetaElement;

		// Check if the translated page has
		// <meta http-equiv="X-Translated-By" content="ServiceName"/>
		translatedByMetaElement = document.head.querySelector( 'meta[http-equiv="X-Translated-By"]' );
		if ( translatedByMetaElement ) {
			return {
				name: 'machine-translation',
				info: {
					service: translatedByMetaElement.getAttribute( 'content' )
				}
			};
		}

		// Check If the page is coming via a configurred referror URL
		if ( document.referrer ) {
			parentURL = new URL( document.referrer );
			if ( mw.config.get( 'wgExternalGuidanceMTReferrers' ).indexOf( parentURL.hostname ) >= 0 ) {
				return {
					name: 'machine-translation',
					info: {
						service: parentURL.hostname
					}
				};
			}
		}

		return null;
	}

	context = detectContext();
	if ( context ) {
		mw.log( '[ExternalGuidance] Context detected ' + JSON.stringify( context ) );
		mw.loader.using( [ 'mw.externalguidance' ] ).then( function () {
			var eg = new mw.ExternalGuidance( context.name, context.info );
			eg.init();
		} );
	}
}() );
