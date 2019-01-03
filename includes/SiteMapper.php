<?php

namespace MediaWiki\Extension\ExternalGuidance;

class SiteMapper {
	/**
	 * Get the page URL constructed from the domain template of sites
	 * @param string $language
	 * @param string $title
	 * @param array|null $params
	 * @return string
	 */
	public static function getPageURL( $language, $title, $params = null ) {
		global $wgExternalGuidanceSiteTemplates;

		$domain = self::getDomainCode( $language );

		$url = str_replace(
			[ '$1', '$2' ],
			[ $domain, $title ],
			$wgExternalGuidanceSiteTemplates['view']
		);
		$url = wfAppendQuery( $url, $params );

		return $url;
	}

	/**
	 * Get the domain code matching language
	 *
	 * @param string $language Language code (MediaWiki internal format)
	 * @return string
	 */
	public static function getDomainCode( $language ) {
		global $wgExternalGuidanceDomainCodeMapping;

		if ( isset( $wgExternalGuidanceDomainCodeMapping[$language] ) ) {
			return $wgExternalGuidanceDomainCodeMapping[$language];
		}

		return $language;
	}

	/**
	 * Get the API URL constructed from the domain template of sites
	 * @param string $language
	 * @param array|null $params
	 * @return string
	 */
	public static function getApiURL( $language, $params = null ) {
		global $wgContentTranslationSiteTemplates;

		$domain = self::getDomainCode( $language );
		// $wgContentTranslationSiteTemplates['api'] is protocol relative path
		$url = 'https:' . str_replace( '$1', $domain, $wgContentTranslationSiteTemplates['api'] );
		$url = wfAppendQuery( $url, $params );

		return $url;
	}
}
