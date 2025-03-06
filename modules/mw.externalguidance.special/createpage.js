const SiteMapper = require( '../mw.externalguidance/sitemapper.js' );

/**
 * Converts a jQuery object to an HTML string.
 *
 * @param {jQuery} jObj - The jQuery object to convert.
 * @return {string} The HTML string representation of the jQuery object.
 */
function getHTMLFromjQuery( jObj ) {
	const $container = $( '<div>' );
	$container.append( jObj );
	return $container.html();
}

class RequestTitleForm {
	constructor( options ) {
		this.options = options;
		this.sitemapper = new SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) );
		this.editParams = { veaction: 'edit', campaign: 'external-machine-translation' };
		this.pageExist = null;
		this.container = this.render();
		this.attachEventHandlers();
	}

	render() {
		const container = document.createElement( 'div' );
		container.classList.add( 'eg-create-page-form', 'overlay-content' );
		const heading = document.createElement( 'h3' );
		heading.textContent = mw.msg( 'externalguidance-specialpage-createpage-title-label' );

		const inputElement = document.createElement( 'input' );
		inputElement.type = 'text';
		inputElement.classList.add( 'cdx-text-input__input', 'eg-create-page-title' );
		inputElement.setAttribute( 'autofocus', 'autofocus' );
		inputElement.value = this.options.sourcePage;

		const inputDiv = document.createElement( 'div' );
		inputDiv.classList.add( 'cdx-text-input' );
		inputDiv.appendChild( inputElement );

		const descParagraph = document.createElement( 'p' );
		descParagraph.classList.add( 'eg-create-page-desc' );
		descParagraph.textContent = mw.msg( 'externalguidance-specialpage-createpage-desc', this.options.projectName );

		const button = document.createElement( 'button' );
		button.classList.add( 'eg-create-page-button', 'cdx-button', 'cdx-button--action-progressive', 'cdx-button--weight-primary' );
		button.textContent = mw.msg( 'externalguidance-specialpage-createpage-button-label' );

		container.appendChild( heading );
		container.appendChild( inputDiv );
		container.appendChild( descParagraph );

		const pageCreationOptions = this.showPageCreationOptions();
		container.appendChild( pageCreationOptions );
		container.appendChild( button );
		return container;

	}

	attachEventHandlers() {
		this.container.querySelector( '.eg-create-page-title' ).addEventListener( 'input',
			mw.util.debounce( this.onTitleInput.bind( this ), 300 )
		);
		this.container.querySelector( '.eg-create-page-button' ).addEventListener( 'click', this.onCreateButtonClick.bind( this ) );
	}

	onCreateButtonClick() {
		const updatedTitle = this.container.querySelector( '.eg-create-page-title' ).value;
		const method = this.getPageCreateMethod() || 'create';

		const action = this.pageExist ? 'editpage' : ( method === 'translate' ? 'createpage-translate' : 'createpage' );
		// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.createpage
		const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance',
			action,
			mw.config.get( 'wgExternalGuidanceService' ),
			mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			mw.config.get( 'wgExternalGuidanceTargetLanguage' )
		];

		mw.track( trackName.join( '.' ), 1 );

		if ( action === 'createpage-translate' ) {
			window.open( this.sitemapper.getCXUrl(
				this.options.sourcePage,
				updatedTitle,
				this.options.sourceLanguage,
				this.options.targetLanguage,
				{ campaign: 'external-machine-translation' }
			), '_blank' );
		} else {
			window.open( this.sitemapper.getPageUrl(
				this.options.targetLanguage,
				updatedTitle,
				this.editParams
			), '_blank' );
		}
	}

	/**
	 * Get the current selected method for creating new page
	 *
	 * @return {string} 'create' or 'translate'
	 */
	getPageCreateMethod() {
		return this.container.querySelector( '[name=eg-create-method]:checked' ).value;
	}

	showPageCreationOptions() {
		const container = document.createElement( 'div' );
		container.classList.add( 'eg-create-page-method-selection' );

		const header = document.createElement( 'h3' );
		header.textContent = mw.msg( 'externalguidance-specialpage-createpage-methods-header' );
		container.appendChild( header );

		// Translate option - Default option.
		const translateDiv = document.createElement( 'div' );
		translateDiv.classList.add( 'cdx-radio' );

		const translateInput = document.createElement( 'input' );
		translateInput.type = 'radio';
		translateInput.classList.add( 'cdx-radio__input' );
		translateInput.value = 'translate';
		translateInput.checked = true;
		translateInput.id = 'eg-translate';
		translateInput.name = 'eg-create-method';
		translateDiv.appendChild( translateInput );

		const translateIcon = document.createElement( 'span' );
		translateIcon.classList.add( 'cdx-radio__icon' );
		translateDiv.appendChild( translateIcon );

		const translateLabel = document.createElement( 'label' );
		translateLabel.classList.add( 'cdx-radio__label' );
		translateLabel.setAttribute( 'for', 'eg-translate' );

		translateLabel.innerHTML = getHTMLFromjQuery( mw.message( 'externalguidance-specialpage-createpage-create-from-scratch',
			$.uls.data.getAutonym( this.options.sourceLanguage ),
			$.uls.data.getAutonym( this.options.targetLanguage )
		).parseDom() );

		translateDiv.appendChild( translateLabel );

		container.appendChild( translateDiv );

		// Start from scratch option.
		const createDiv = document.createElement( 'div' );
		createDiv.classList.add( 'cdx-radio' );

		const createInput = document.createElement( 'input' );
		createInput.type = 'radio';
		createInput.classList.add( 'cdx-radio__input' );
		createInput.value = 'create';
		createInput.id = 'eg-create';
		createInput.name = 'eg-create-method';
		createDiv.appendChild( createInput );

		const createIcon = document.createElement( 'span' );
		createIcon.classList.add( 'cdx-radio__icon' );
		createDiv.appendChild( createIcon );

		const createLabel = document.createElement( 'label' );
		createLabel.classList.add( 'cdx-radio__label' );
		createLabel.setAttribute( 'for', 'eg-create' );
		createLabel.innerHTML = getHTMLFromjQuery( mw.message( 'externalguidance-specialpage-createpage-create-from-translation' ).parseDom() );
		createDiv.appendChild( createLabel );

		container.appendChild( createDiv );

		return container;
	}

	/**
	 * Title input handler
	 *
	 */
	onTitleInput() {
		const form = this,
			button = this.container.querySelector( '.eg-create-page-button' ),
			title = this.container.querySelector( '.eg-create-page-title' ).value;

		this.checkPageExist( this.options.targetLanguage, title )
			.then( ( titleExist ) => {
				button.disabled = !title;

				const descElement = form.container.querySelector( '.eg-create-page-desc' );

				if ( titleExist ) {
					this.pageExist = true;
					descElement.classList.add( 'eg-create-page-error' );
					descElement.textContent = mw.msg( 'externalguidance-specialpage-createpage-page-exist' );
					button.textContent = mw.msg( 'externalguidance-specialpage-createpage-button-label-edit' );
				} else {
					this.pageExist = false;
					descElement.classList.remove( 'eg-create-page-error' );
					descElement.textContent = mw.msg( 'externalguidance-specialpage-createpage-desc', this.options.projectName );
					button.textContent = mw.msg( 'externalguidance-specialpage-createpage-button-label' );
				}
			} );
	}

	checkPageExist( language, title ) {
		const api = this.sitemapper.getApi( language );

		// Short circuit empty titles
		if ( title === '' ) {
			return Promise.resolve( false );
		}

		// Reject titles with pipe in the name, as it has special meaning in the api
		if ( /\|/.test( title ) ) {
			return Promise.resolve( false );
		}

		return api.get( {
			formatversion: 2,
			action: 'query',
			titles: title,
			redirects: true
		} ).then( ( response ) => {
			const page = response.query.pages[ 0 ];

			if ( page.missing || page.invalid ) {
				return false;
			}

			return page.title;
		} );
	}
}
/**
 * Overlay helping to start a new page
 *
 * @param {Object} options Configuration options
 * @return {Element} Overlay element
 */
function createPageOverlay( options ) {
	const overlay = document.createElement( 'dialog' );
	overlay.classList.add( 'eg-createpage-overlay' );

	overlay.append(
		new RequestTitleForm( {
			projectName: options.projectName,
			sourceLanguage: options.sourceLanguage,
			targetLanguage: options.targetLanguage,
			sourcePage: options.sourcePage
		} ).container
	);
	document.body.appendChild( overlay );
	return overlay;
}

function openCreatePageOverlay() {

	return createPageOverlay( {
		projectName: mw.config.get( 'wgSiteName' ),
		sourceLanguage: mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		targetLanguage: mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
		sourcePage: mw.config.get( 'wgExternalGuidanceSourcePage' )
	} );

}

function onContributeToOriginalClick() {
	const sitemapper = new SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) ),
		editParams = {
			veaction: 'edit',
			campaign: 'external-machine-translation'
		};

	// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.edit-original
	const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'edit-original',
		mw.config.get( 'wgExternalGuidanceService' ),
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetLanguage' )
	];
	mw.track( trackName.join( '.' ), 1 );
	window.open( sitemapper.getPageUrl(
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceSourcePage' ),
		editParams
	), '_blank' );
}

function onExpandTargetArticleClick() {
	const sitemapper = new SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) ),
		editParams = {
			veaction: 'edit',
			campaign: 'external-machine-translation'
		};

	// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.editpage
	const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'editpage',
		mw.config.get( 'wgExternalGuidanceService' ),
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetLanguage' )
	];

	mw.track( trackName.join( '.' ), 1 );
	window.open( sitemapper.getPageUrl(
		mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetPage' ),
		editParams
	), '_blank' );
}

function init() {
	const createButton = document.querySelector( '.eg-sp-contribute-create' ),
		expandButton = document.querySelector( '.eg-sp-contribute-expand' ),
		contributeToOriginalButton = document.querySelector( '.eg-sp-contribute-to-original' );

	const dialog = openCreatePageOverlay();
	if ( createButton ) {
		createButton.disabled = false;
		createButton.addEventListener( 'click', () => {
			dialog.showModal();
		} );
	}

	if ( contributeToOriginalButton ) {
		contributeToOriginalButton.disabled = false;
		contributeToOriginalButton.addEventListener( 'click', onContributeToOriginalClick );
	}

	if ( expandButton ) {
		expandButton.disabled = false;
		expandButton.addEventListener( 'click', onExpandTargetArticleClick );
	}

	const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'specialpage',
		mw.config.get( 'wgExternalGuidanceService' ),
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetLanguage' )
	];
	mw.track( trackName.join( '.' ), 1 );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
