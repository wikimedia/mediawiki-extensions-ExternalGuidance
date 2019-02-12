/* eslint-disable camelcase */
( function ( M ) {
	var mobile = M.require( 'mobile.startup' ),
		View = mobile.View,
		Overlay = mobile.Overlay,
		util = mobile.util,
		overlayManager = mobile.OverlayManager.getSingleton();

	function RequestTitleForm( options ) {
		this.editParams = {
			veaction: 'edit',
			campaign: 'external-machine-translation'
		};

		this.sitemapper = new mw.eg.SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) );
		View.call( this, {
			events: {
				'input .eg-create-page-title': $.debounce( 300, RequestTitleForm.prototype.onTitleInput ),
				'click .eg-create-page-button': 'onCreateButtonClick'
			},
			projectName: options.projectName,
			targetLanguage: options.targetLanguage,
			sourcePage: options.sourcePage
		} );
	}
	OO.inheritClass( RequestTitleForm, View );

	RequestTitleForm.prototype.postRender = function () {
		var $heading = $( '<h3>' ).text( mw.msg( 'externalguidance-specialpage-createpage-title-label' ) ),
			$input = $( '<input type="text" class="mw-ui-input eg-create-page-title" autofocus/>' )
				.val( this.options.sourcePage ),
			$p = $( '<p class="eg-create-page-desc">' )
				.text( mw.msg( 'externalguidance-specialpage-createpage-desc', this.options.projectName ) ),
			$btn = $( '<button>' )
				.addClass( 'eg-create-page-button mw-ui-button mw-ui-primary mw-ui-progressive' )
				.text( mw.msg( 'externalguidance-specialpage-createpage-button-label' ) );
		this.$el.append( [ $heading, $input, $p, $btn ] );
		this.$( '.eg-create-page-title' ).focus();
		this.onTitleInput();
		View.prototype.postRender.apply( this, arguments );
	};

	/**
	 * Click handler for create-page button
	 * @memberof CreatePageOverlay
	 * @instance
	 */
	RequestTitleForm.prototype.onCreateButtonClick = function () {
		var trackName,
			query = mw.Uri().query;

		// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.createpage
		trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'createpage',
			query.service, query.from, query.to ];

		mw.track( trackName.join( '.' ), 1 );
		mw.track( 'event.ExternalGuidance', {
			action: 'createpage',
			session_token: mw.user.sessionId(),
			source_language: query.from,
			target_language: query.to,
			service: query.service,
			title: this.options.sourcePage
		} );
		location.href = this.sitemapper.getPageUrl(
			this.options.targetLanguage,
			this.$( '.eg-create-page-title' ).val(),
			this.editParams
		);
	};

	/**
	 * Title input handler
	 * @memberof CreatePageOverlay
	 * @instance
	 */
	RequestTitleForm.prototype.onTitleInput = function () {
		var form = this,
			$button = this.$( '.eg-create-page-button' ),
			title = this.$( '.eg-create-page-title' ).val();

		this.checkPageExist( this.options.targetLanguage, title )
			.then( function ( titleExist ) {
				$button.prop( 'disabled', !title );

				if ( titleExist ) {
					form.$( '.eg-create-page-desc' )
						.addClass( 'eg-create-page-error' )
						.text(
							mw.msg( 'externalguidance-specialpage-createpage-page-exist' )
						);
					$button.text( mw.msg( 'externalguidance-specialpage-createpage-button-label-edit' ) );
				} else {
					form.$( '.eg-create-page-desc' )
						.removeClass( 'eg-create-page-error' )
						.text(
							mw.msg( 'externalguidance-specialpage-createpage-desc', this.options.projectName )
						);
					$button.text( mw.msg( 'externalguidance-specialpage-createpage-button-label' ) );
				}
			}.bind( this ) );
	};

	RequestTitleForm.prototype.checkPageExist = function ( language, title ) {
		var api = this.sitemapper.getApi( language );

		// Short circuit empty titles
		if ( title === '' ) {
			return util.Deferred().resolve( false ).promise();
		}

		// Reject titles with pipe in the name, as it has special meaning in the api
		if ( /\|/.test( title ) ) {
			return util.Deferred().resolve( false ).promise();
		}

		return api.get( {
			formatversion: 2,
			action: 'query',
			titles: title,
			redirects: true
		} ).then( function ( response ) {
			var page = response.query.pages[ 0 ];

			if ( page.missing || page.invalid ) {
				return false;
			}

			return page.title;
		} );
	};

	/**
	 * Overlay helping to start a new page
	 *
	 * @param {Object} options Configuration options
	 * @return {Overlay}
	 */
	function createPageOverlay( options ) {
		var overlay = new Overlay(
			util.extend( {
				className: 'overlay eg-createpage-overlay',
				heading: mw.msg( 'externalguidance-specialpage-createpage-title' )
			}, options )
		);

		overlay.$( '.overlay-content' ).append(
			new RequestTitleForm( {
				projectName: options.projectName,
				targetLanguage: options.targetLanguage,
				sourcePage: options.sourcePage
			} ).$el
		);
		return overlay;
	}

	function openCreatePageOverlay() {
		var query = mw.Uri().query;

		return createPageOverlay( {
			projectName: mw.config.get( 'wgSiteName' ),
			targetLanguage: query.to,
			sourcePage: query.page
		} );
	}

	$( function () {
		var trackName,
			query = mw.Uri().query,
			$button = $( '.eg-sp-contribute-create' );
		overlayManager.add( '/create-article', openCreatePageOverlay );
		$button.on( 'click', overlayManager.router.navigate.bind( null, '/create-article' ) );
		// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.specialpage
		trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'specialpage',
			query.service, query.from, query.to ];
		mw.track( trackName.join( '.' ), 1 );
		mw.track( 'event.ExternalGuidance', {
			action: 'specialpage',
			session_token: mw.user.sessionId(),
			source_language: query.from,
			target_language: query.to,
			service: query.service,
			title: query.page
		} );
	} );

}( mw.mobileFrontend ) );
