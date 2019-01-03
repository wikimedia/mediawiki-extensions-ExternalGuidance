<?php
/**
 * Contains the special page Special:ExternalGuidance.
 *
 * @copyright See AUTHORS.txt
 * @license GPL-2.0-or-later
 */

namespace MediaWiki\Extension\ExternalGuidance;

use Title;
use SpecialPage;
use Language;
use Html;
use MWException;

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
		global $wgExternalGuidanceSimulate;

		// No need of simulation in this page. Avoid unwanted side effects because of that
		// while developing and testing
		$wgExternalGuidanceSimulate = false;
		$request = $this->getRequest();
		$this->setHeaders();
		$this->outputHeader();
		// Currently we have only one context - Machine translation. So using it unconditionally.
		$this->mtContextGuidance( $request,  $this->getOutput() );
	}

	/**
	 * Machine translation context based guidance rendering
	 * @param RequestContext $request
	 * @param OutputPage $out
	 */
	protected function mtContextGuidance( $request, $out ) {
		global $wgSitename;

		$out->addModules( 'mw.externalguidance.special' );

		$sourceLanguage = $request->getVal( 'from' );
		$targetLanguage = $request->getVal( 'to' );
		$sourcePage = $request->getVal( 'page' );
		// TODO: We also get service name. Use that for the analytics wiring.
		if ( !$sourcePage || !$sourceLanguage || !$targetLanguage ) {
			throw new MWException( __METHOD__ . ": One of the mandatory parameters missing" );
		}
		$sourcePageTitle = Title::newFromText( $sourcePage );
		// This wiki should match the target language since the "contribute" link takes the user
		// to this special page in target language.
		$pageExists = $sourcePageTitle->isKnown();
		$out->addWikiMsg( 'externalguidance-specialpage-mt-intro',
			$wgSitename,
			Language::fetchLanguageName( $sourceLanguage ),
			Language::fetchLanguageName( $targetLanguage )
		);

		if ( $pageExists ) {
			$out->addWikiMsg( "externalguidance-specialpage-mt-pageexist",
				Language::fetchLanguageName( $targetLanguage ) );
		}

		$out->wrapWikiMsg( "<span class='eg-sp-intro-machine'>" .
			"<span class='mw-ui-icon mw-ui-icon-element mw-ui-icon-eg-robot'></span>\n$1\n</span>",
			'externalguidance-specialpage-intro-machine' );
		$out->wrapWikiMsg( "<span class='eg-sp-intro-human'>" .
			"<span class='mw-ui-icon mw-ui-icon-element mw-ui-icon-eg-user'></span>\n$1\n</span>",
			'externalguidance-specialpage-intro-human' );
		$out->wrapWikiMsg( "<h3 class='eg-sp-ways-to-contribute'>\n$1\n</h3>",
			'externalguidance-specialpage-contribute-title' );

		if ( $pageExists ) {
			$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-expand-action' )->text();
			$out->addHTML( Html::rawElement(
				'a',
				[
					'class' => "eg-sp-contribute-primary-action mw-ui-button mw-ui-primary mw-ui-progressive",
					'href' => SiteMapper::getPageURL( $targetLanguage, $sourcePage, [ "action" => "edit" ] )
				],
				$actionLabel
			) );
			$out->addWikiMsg( 'externalguidance-specialpage-contribute-expand' );
		} else {
			$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-create-action' )->text();
			$out->addHTML( Html::rawElement(
				'a',
				[
					'class' => "eg-sp-contribute-primary-action mw-ui-button mw-ui-primary mw-ui-progressive",
					'href' => SiteMapper::getPageURL( $targetLanguage, $sourcePage, [ "action" => "edit" ] )
				],
				$actionLabel
			) );
			$out->addWikiMsg( 'externalguidance-specialpage-contribute-create',
				Language::fetchLanguageName( $targetLanguage ) );
		}

		$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-improve-source-action',
			Language::fetchLanguageName( $sourceLanguage ) )->text();
		$out->addHTML( Html::rawElement(
			'a',
			[
				'class' => "eg-sp-contribute-secondary-action mw-ui-button",
				'href' => SiteMapper::getPageURL( $sourceLanguage, $sourcePage, [ "action" => "edit" ] )
			],
			$actionLabel
		) );
		$out->addWikiMsg( 'externalguidance-specialpage-contribute-improve-source' );
	}
}
