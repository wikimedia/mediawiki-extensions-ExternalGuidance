<?php
/**
 * Contains the special page Special:ExternalGuidance.
 *
 * @copyright See AUTHORS.txt
 * @license GPL-2.0-or-later
 */

namespace MediaWiki\Extension\ExternalGuidance;

use OutputPage;
use Title;
use SpecialPage;
use Language;
use Html;
use MWException;
use WebRequest;

/**
 * Welcoming page from an ExternalGuidance contribution entry point
 */
class SpecialExternalGuidance extends SpecialPage {
	public function __construct() {
		parent::__construct( 'ExternalGuidance' );
	}

	/**
	 * @inheritDoc
	 */
	public function getDescription() {
		return $this->msg( 'externalguidance-specialpage-title' )->text();
	}

	/**
	 * @inheritDoc
	 */
	public function execute( $parameters ) {
		$request = $this->getRequest();
		$this->setHeaders();
		$this->outputHeader();
		// Currently we have only one context - Machine translation. So using it unconditionally.
		$this->mtContextGuidance( $request, $this->getOutput() );
	}

	/**
	 * Machine translation context based guidance rendering
	 * @param WebRequest $request
	 * @param OutputPage $out
	 */
	public function mtContextGuidance( $request, $out ) {
		global $wgSitename;

		$out->addModules( 'mw.externalguidance.special' );

		$sourceLanguage = $request->getVal( 'from' );
		$targetLanguage = $request->getVal( 'to' );
		$sourcePage = $request->getVal( 'page' );
		// TODO: We also get service name. Use that for the analytics wiring.
		if ( !$sourcePage || !$sourceLanguage || !$targetLanguage ) {
			throw new MWException( __METHOD__ . ": One of the mandatory parameters missing" );
		}

		if ( !Language::isKnownLanguageTag( $sourceLanguage ) ||
			!Language::isKnownLanguageTag( $targetLanguage )
		) {
			throw new MWException( __METHOD__ . ": Invalid language code" );
		}
		// Create the title instance after validation. Throws MalformedTitleException if invalid.
		$sourcePageTitle = Title::newFromTextThrow( $sourcePage );

		// This wiki should match the target language since the "contribute" link takes the user
		// to this special page in target language.
		$pageExists = $sourcePageTitle->isKnown();
		$out->addHTML( '<div class="eg-sp">' );

		if ( $pageExists ) {
			$out->addWikiMsg( 'externalguidance-specialpage-mt-intro-pageexist',
				$wgSitename,
				Language::fetchLanguageName( $sourceLanguage )
			);
			$out->addWikiMsg( "externalguidance-specialpage-mt-pageexist",
				Language::fetchLanguageName( $targetLanguage ) );
		} else {
			$out->addWikiMsg( 'externalguidance-specialpage-mt-intro',
				$wgSitename,
				Language::fetchLanguageName( $sourceLanguage ),
				Language::fetchLanguageName( $targetLanguage )
			);
		}
		$out->addHTML( '<ul>' );
		$out->wrapWikiMsg(
			"<li class='eg-sp-intro-machine mw-ui-icon-before mw-ui-icon mw-ui-icon-eg-robot'>" .
			'<div>$1</div></li>',
			'externalguidance-specialpage-intro-machine' );
		$out->wrapWikiMsg(
			"<li class='eg-sp-intro-human mw-ui-icon-before mw-ui-icon mw-ui-icon-eg-user'>" .
			'<div>$1</div></li>',
			'externalguidance-specialpage-intro-human' );
		$out->addHTML( '</ul>' );
		$out->wrapWikiMsg( "<h3 class='eg-sp-ways-to-contribute'>\n$1\n</h3>",
			'externalguidance-specialpage-contribute-title' );
		$editParams = [
			// Invoke VisualEditor
			'veaction' => 'edit',
			// See T212405 and T209132
			'campaign' => 'external-machine-translation'
		 ];

		if ( $pageExists ) {
			$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-expand-action' )->text();
			$out->addHTML( Html::element(
				'a',
				[
					'class' => 'eg-sp-contribute-expand mw-ui-button mw-ui-primary mw-ui-progressive',
					'href' => SiteMapper::getPageURL( $targetLanguage, $sourcePage, $editParams )
				],
				$actionLabel
			) );
			$out->addWikiMsg( 'externalguidance-specialpage-contribute-expand' );
		} else {
			$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-create-action' )->text();
			$out->addHTML( Html::element(
				'button',
				[
					'class' => 'eg-sp-contribute-create mw-ui-button mw-ui-progressive',
				],
				$actionLabel
			) );
			$out->addWikiMsg( 'externalguidance-specialpage-contribute-create',
				Language::fetchLanguageName( $targetLanguage ) );

		}

		$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-improve-source-action',
			Language::fetchLanguageName( $sourceLanguage ) )->text();
		$out->addHTML( Html::element(
			'button',
			[
				'class' => 'eg-sp-contribute-to-original mw-ui-button mw-ui-progressive mw-ui-quiet'
			],
			$actionLabel
		) );
		$out->addWikiMsg( 'externalguidance-specialpage-contribute-improve-source' );
		$out->addHTML( '</div>' );
	}

}
