<?php
/**
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * @file
 */

namespace MediaWiki\Extension\ExternalGuidance;

use OutputPage;
use Skin;

/**
 * Hooks for ExternalGuidance extension
 */
class Hooks {
	/**
	 * @param OutputPage $out
	 * @param Skin $skin
	 * Hook: BeforePageDisplay
	 */
	public static function addModules( $out, $skin ) {
		global $wgExternalGuidanceSimulate;

		if ( $skin->getSkinName() !== 'minerva' ) {
			return;
		}

		if ( $wgExternalGuidanceSimulate === true ) {
			$out->addModules( 'mw.externalguidance.simulate' );
		} else {
			$out->addModules( 'mw.externalguidance.init' );
		}
	}

	/**
	 * Hook: ResourceLoaderGetConfigVars
	 * @param array &$vars
	 */
	public static function addConfig( array &$vars ) {
		global $wgExternalGuidanceMTReferrers, $wgExternalGuidanceSiteTemplates,
			$wgExternalGuidanceDomainCodeMapping;
		$vars['wgExternalGuidanceMTReferrers'] = $wgExternalGuidanceMTReferrers;
		$vars['wgExternalGuidanceSiteTemplates'] = $wgExternalGuidanceSiteTemplates;
		$vars['wgExternalGuidanceDomainCodeMapping'] = $wgExternalGuidanceDomainCodeMapping;
	}
}
