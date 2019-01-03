( function () {
	/**
	 * @class
	 * @param {Object} options
	 * @cfg {string} from Source language of translation
	 * @cfg {string} to Target language of translation
	 * @cfg {string} page The page being translated
	 * @cfg {string} service The MT service name
	 */
	function MachineTranslationContext( options ) {
		this.sourceLanguage = options.from;
		this.targetLanguage = this.getTargetLanguage( options.to );
		this.sourcePage = options.page;
		this.service = options.service;
		this.$container = $( '.heading-holder' );
		this.sitemapper = new mw.eg.SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) );
	}

	MachineTranslationContext.prototype.init = function () {
		var $banner, $contribute, $header, specialPageURL;

		specialPageURL = this.sitemapper.getPageUrl(
			this.targetLanguage,
			'Special:ExternalGuidance',
			{
				from: this.sourceLanguage,
				to: this.targetLanguage,
				page: this.sourcePage,
				service: this.service
			}
		);

		$header = $( '<span>' )
			.addClass( 'eg-machine-translation-banner-header' )
			.html( mw.msg( 'externalguidance-machine-translation-heading' ) );
		$contribute = $( '<a>' )
			.attr( {
				href: specialPageURL,
				rel: 'noreferrer', // Do not pass the referrer to avoid the target page detected as external context
				target: '_parent' // Open in parent frame, not in the iframe (if any) by the MT service
			} )
			.addClass( 'eg-machine-translation-banner-action' )
			.html( mw.msg( 'externalguidance-machine-translation-contribute' ) );
		$banner = $( '<div>' )
			.addClass( 'eg-machine-translation-banner' )
			.append( $header, $contribute );
		this.$container.append( $banner );
	};

	/**
	 * Clean up the target language set by MT services to a valid language code
	 * @param {string } targetLanguage
	 * @return {string}
	 */
	MachineTranslationContext.prototype.getTargetLanguage = function ( targetLanguage ) {
		// Google translate somtiems uses lang in the form of
		// targetLanguageCode-x-mtfrom-sourceLanguageCode. Example: id-x-mtfrom-en
		if ( targetLanguage.indexOf( '-x-mtfrom-' ) > 0 ) {
			targetLanguage = targetLanguage.split( '-' )[ 0 ];
		}

		return targetLanguage;
	};

	/**
	 * @class
	 * @param {string} contextName
	 * @param {Object} options
	 * @cfg {string} from Source language of translation
	 * @cfg {string} to Target language of translation
	 * @cfg {string} page The page being translated
	 * @cfg {string} service The MT service name
	 */
	function ExternalGuidance( contextName, options ) {
		this.contextName = contextName;
		this.options = options || {};
	}

	ExternalGuidance.prototype.init = function () {
		var instance;

		if ( !ExternalGuidance.contextMap[ this.contextName ] ) {
			throw Error( 'Unknown context' );
		}
		instance = new ExternalGuidance.contextMap[ this.contextName ]( this.options );
		instance.init();
	};

	/**
	 * @static
	 */
	ExternalGuidance.contextMap = {
		'machine-translation': MachineTranslationContext
	};

	mw.eg.ExternalGuidance = ExternalGuidance;
}() );
