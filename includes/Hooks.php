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

use MediaWiki\Config\Config;
use MediaWiki\Hook\BeforePageDisplayHook;
use MediaWiki\Output\OutputPage;
use MediaWiki\ResourceLoader\Hook\ResourceLoaderGetConfigVarsHook;
use Skin;

/**
 * Hooks for ExternalGuidance extension
 */
class Hooks implements
	BeforePageDisplayHook,
	ResourceLoaderGetConfigVarsHook
{
	/**
	 * @param OutputPage $out
	 * @param Skin $skin
	 */
	public function onBeforePageDisplay( $out, $skin ): void {
		global $wgExternalGuidanceEnableContextDetection;

		if ( $wgExternalGuidanceEnableContextDetection === true &&
			$skin->getSkinName() === 'minerva'
		) {
			$out->addModules( 'mw.externalguidance.init' );
		}
	}

	/**
	 * @param array &$vars
	 * @param string $skin
	 * @param Config $config
	 */
	public function onResourceLoaderGetConfigVars( array &$vars, $skin, Config $config ): void {
		global $wgExternalGuidanceMTReferrers, $wgExternalGuidanceSiteTemplates,
			$wgExternalGuidanceDomainCodeMapping;
		$vars['wgExternalGuidanceMTReferrers'] = $wgExternalGuidanceMTReferrers;
		$vars['wgExternalGuidanceSiteTemplates'] = $wgExternalGuidanceSiteTemplates;
		$vars['wgExternalGuidanceDomainCodeMapping'] = $wgExternalGuidanceDomainCodeMapping;
	}

}
