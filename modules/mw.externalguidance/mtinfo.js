const mobile = require( 'mobile.startup' );
const View = mobile.View;

/**
 * Overlay displaying a Machine Translation service information
 *
 * @class MTServiceInfo
 * @extends View
 * @param {Object} options Configuration options
 */
function MTServiceInfo( options ) {
	this.options = options;
	const elements = [
		$( '<p>' )
			.text( mw.msg( 'externalguidance-machine-translation-provider-info',
				this.options.projectName, this.options.serviceName ) ),
		this.options.mtPrivacyTermsLink ? $( '<a>' )
			.attr( 'href', this.options.mtPrivacyTermsLink )
			.text( mw.msg( 'externalguidance-machine-translation-provider-terms' ) ) :
			$( [] ),
		$( '<h3>' )
			.text( mw.msg( 'externalguidance-machine-translation-access-source-title', this.options.projectName ) ),
		$( '<p>' )
			.text( this.options.targetPageExists ?
				mw.msg( 'externalguidance-machine-translation-access-source-page-exist', this.options.projectName ) :
				mw.msg( 'externalguidance-machine-translation-access-source-page-missing', this.options.projectName )
			),
		$( '<a>' )
			.attr( {
				href: this.options.learnToContributeLink,
				target: '_blank'
			} )
			.text( mw.msg( 'externalguidance-machine-translation-contribute-link', this.options.projectName ) )
	];
	return View.make( options, elements );
}

module.exports = MTServiceInfo;
