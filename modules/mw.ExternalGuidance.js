( function () {
	/**
	 * @class
	 * @param {Object} options
	 */
	function MachineTranslationContext( options ) {
		this.options = options || {};
		this.$container = $( '.heading-holder' );
	}

	MachineTranslationContext.prototype.init = function () {
		var $banner, $contribute, $header;

		$header = $( '<span>' )
			.addClass( 'eg-machine-translation-banner-header' )
			.html( mw.msg( 'externalguidance-machine-translation-heading' ) );
		$contribute = $( '<a>' )
			.attr( 'href', '#' )
			.addClass( 'eg-machine-translation-banner-action' )
			.html( mw.msg( 'externalguidance-machine-translation-contribute' ) );
		$banner = $( '<div>' )
			.addClass( 'eg-machine-translation-banner' )
			.append( $header, $contribute );
		this.$container.append( $banner );
	};

	/**
	 * @class
	 * @param {string} context
	 * @param {Object} options
	 */
	function ExternalGuidance( context, options ) {
		this.context = context;
		this.options = options || {};
	}

	ExternalGuidance.prototype.init = function () {
		var instance;

		if ( !ExternalGuidance.contextMap[ this.context ] ) {
			throw Error( 'Unknown context' );
		}
		instance = new ExternalGuidance.contextMap[ this.context ]( this.options );
		instance.init();
	};

	/**
	 * @static
	 */
	ExternalGuidance.contextMap = {
		'machine-translation': MachineTranslationContext
	};

	mw.ExternalGuidance = ExternalGuidance;
}() );
